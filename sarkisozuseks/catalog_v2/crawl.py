"""Resumable public-page download cache. Run with the bundled Python runtime."""
from __future__ import annotations

import argparse
import concurrent.futures
import gzip
import hashlib
import json
from pathlib import Path
import re
import sqlite3
import threading
import time
from datetime import datetime, timezone
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlsplit, urlunsplit
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent
BASE = "https://www.repertuarim.com/"
SITE_HOSTS = {"repertuarim.com", "www.repertuarim.com"}
HEADERS = {"User-Agent": "Mozilla/5.0", "Accept-Language": "tr-TR,tr;q=0.9"}


def now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def canonical_url(url):
    parsed = urlsplit(url)
    if parsed.hostname not in SITE_HOSTS:
        raise ValueError("Off-site URL")
    return urlunsplit(("https", "www.repertuarim.com", parsed.path or "/", parsed.query, ""))


def kind_for(url):
    path = urlsplit(url).path
    if path.startswith("/akor/"):
        return "song"
    if path.startswith("/akor-tab/"):
        return "artist"
    if path.startswith("/repertuar/"):
        return "repertoire"
    if path.startswith("/etiket/"):
        return "tag"
    return "page"


def site_id(url):
    match = re.search(r"-(\d+)\.html$", urlsplit(url).path)
    if not match:
        raise ValueError("Song URL has no source ID: " + url)
    return int(match.group(1))


def connect():
    (ROOT / "state").mkdir(exist_ok=True)
    db = sqlite3.connect(ROOT / "state" / "crawl.sqlite3", timeout=30)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA journal_mode=WAL")
    db.executescript("""
        CREATE TABLE IF NOT EXISTS pages (
            url TEXT PRIMARY KEY, kind TEXT NOT NULL,
            status INTEGER, fetched_at TEXT, sha256 TEXT, cache_file TEXT,
            byte_count INTEGER, attempts INTEGER NOT NULL DEFAULT 0,
            error TEXT
        );
        CREATE TABLE IF NOT EXISTS identities (
            site_id INTEGER PRIMARY KEY, song_id INTEGER NOT NULL UNIQUE,
            url TEXT NOT NULL, title TEXT, legacy INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);
        CREATE TABLE IF NOT EXISTS rejected_urls (url TEXT PRIMARY KEY, reason TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS scanned_links (url TEXT PRIMARY KEY, sha256 TEXT NOT NULL);
    """)
    return db


def add_urls(db, urls):
    for url in urls:
        url = canonical_url(url)
        if kind_for(url) == "song":
            try:
                site_id(url)
            except ValueError:
                db.execute("INSERT OR IGNORE INTO rejected_urls VALUES (?,?)", (url, "invalid_source_id"))
                continue
        db.execute("INSERT OR IGNORE INTO pages(url,kind) VALUES (?,?)", (url, kind_for(url)))
    db.commit()


def seed_legacy(db):
    rows = json.loads((ROOT.parent / "akor_urls.json").read_text())
    legacy = json.loads((ROOT.parent / "sarki_bilgileri.json").read_text())
    # Discovery IDs were regenerated independently of the app's shipped IDs.
    # Only the metadata catalog shares IDs with the app and detailed lyrics.
    authoritative = {site_id(r["url"]): r for r in legacy}
    if len(authoritative) != len(legacy) or len({r["id"] for r in legacy}) != len(legacy):
        raise ValueError("Legacy application identity catalog contains duplicates")
    mismatches = [r for r in db.execute("SELECT * FROM identities WHERE legacy=1")
                  if r["site_id"] in authoritative and r["song_id"] != authoritative[r["site_id"]]["id"]]
    if mismatches:
        if (ROOT / "dist" / "songs.jsonl").exists():
            raise ValueError("Published IDs need review before legacy registry migration")
        # Only unpublished identity mappings are corrected; downloaded pages
        # and already assigned new-song IDs are untouched.
        db.execute("DELETE FROM identities WHERE legacy=1")
        print(json.dumps({"legacy_id_mismatches_corrected":len(mismatches)}),flush=True)
    for source, row in authoritative.items():
        url = canonical_url(row["url"])
        existing = db.execute("SELECT song_id FROM identities WHERE site_id=?",(source,)).fetchone()
        if existing and existing[0] != row["id"]:
            raise ValueError("Legacy app ID conflicts with resume registry")
        title = " - ".join(filter(None,[row.get("sanatci"),row.get("sarkiadi")]))
        db.execute("INSERT OR IGNORE INTO identities(site_id,song_id,url,title,legacy) VALUES (?,?,?,?,1)",
                   (source,row["id"],url,title))
    rejected = []
    valid_urls = [r["url"] for r in legacy]
    for row in rows:
        url = canonical_url(row["url"])
        if kind_for(url) != "song":
            continue
        try:
            source = site_id(url)
        except ValueError:
            rejected.append({"id": row["id"], "url": url, "reason": "invalid_source_url"})
            continue
        valid_urls.append(url)
    add_urls(db, valid_urls)
    db.execute("INSERT OR REPLACE INTO meta VALUES ('legacy_rejected',?)", (json.dumps(rejected),))
    db.execute("INSERT OR REPLACE INTO meta VALUES ('legacy_max_id',?)", (str(max(r["id"] for r in rows)),))
    db.execute("INSERT OR REPLACE INTO meta VALUES ('legacy_identity_source',?)", ("sarki_bilgileri.json",))
    db.execute("INSERT OR IGNORE INTO meta VALUES ('started_at',?)", (now(),))
    db.commit()
    # Published IDs are the durable registry for newly discovered songs too.
    # A clean checkout can rebuild its ignored resume database without changing
    # any IDs that have already shipped to the app.
    published = ROOT / "dist" / "songs.jsonl"
    if published.exists():
        urls = []
        def retain_published(song):
            source = song["source"]["site_id"]
            song_id = song["id"]
            url = canonical_url(song["source"]["url"])
            existing = db.execute("SELECT song_id FROM identities WHERE site_id=?", (source,)).fetchone()
            existing_id = db.execute("SELECT site_id FROM identities WHERE song_id=?", (song_id,)).fetchone()
            if (existing and existing[0] != song_id) or (existing_id and existing_id[0] != source):
                raise ValueError("Published song ID conflicts with resume registry")
            db.execute("INSERT OR IGNORE INTO identities(site_id,song_id,url,title,legacy) VALUES (?,?,?,?,0)",
                (source,song_id,url,song["artist"]+" - "+song["title"]))
            urls.append(url)
        with published.open(encoding="utf-8") as stream:
            for line in stream:
                if not line.strip():
                    continue
                retain_published(json.loads(line))
        published_manifest=ROOT/"dist"/"manifest.json"
        if published_manifest.exists():
            metadata=json.loads(published_manifest.read_text())
            for song in metadata.get("quality",{}).get("quarantined_songs",[]):
                retain_published(song)
        add_urls(db,urls)
        db.commit()


class Downloader:
    def __init__(self, interval=0.5):
        self.interval = interval
        self.lock = threading.Lock()
        self.last = 0.0

    def fetch(self, url):
        with self.lock:
            delay = self.interval - (time.monotonic() - self.last)
            if delay > 0:
                time.sleep(delay)
            self.last = time.monotonic()
        stamp = now()
        try:
            parts = urlsplit(url)
            request_url = urlunsplit((parts.scheme, parts.netloc,
                quote(parts.path, safe="/%:@!$&'()*+,;=-._~"),
                quote(parts.query, safe="%=&?/:@!$'()*+,;~-._"), ""))
            with urlopen(Request(request_url, headers=HEADERS), timeout=25) as response:
                raw = response.read()
                final_url = canonical_url(response.url)
                if response.status != 200:
                    raise ValueError("Unexpected HTTP status")
                if kind_for(url) == "song" and kind_for(final_url) != "song":
                    raise ValueError("Song redirected outside song pages")
                name = hashlib.sha256(url.encode()).hexdigest() + ".html.gz"
                relative = Path("cache") / "pages" / name
                path = ROOT / relative
                path.parent.mkdir(parents=True, exist_ok=True)
                temporary = path.with_suffix(".tmp")
                temporary.write_bytes(gzip.compress(raw, mtime=0))
                temporary.replace(path)
                return {"url": url, "status": 200, "fetched_at": stamp,
                        "sha256": hashlib.sha256(raw).hexdigest(), "cache_file": str(relative),
                        "byte_count": len(raw), "error": None}
        except HTTPError as error:
            return {"url": url, "status": error.code, "fetched_at": stamp, "error": "HTTP " + str(error.code)}
        except (URLError, TimeoutError, OSError, ValueError) as error:
            return {"url": url, "status": 0, "fetched_at": stamp,
                    "error": type(error).__name__ + ": " + str(error)[:240]}


def store_result(db, result):
    db.execute("""UPDATE pages SET status=:status,fetched_at=:fetched_at,
        sha256=:sha256,cache_file=:cache_file,byte_count=:byte_count,
        attempts=attempts+1,error=:error WHERE url=:url""",
        {"sha256": None, "cache_file": None, "byte_count": 0, **result})
    db.commit()


def read_page(row):
    return gzip.decompress((ROOT / row["cache_file"]).read_bytes()).decode("utf-8-sig")


def load_sitemaps(db, downloader):
    queue = [BASE + "sitemap.xml"]
    seen = set()
    counts = {}
    while queue:
        url = canonical_url(queue.pop(0))
        if url in seen:
            continue
        seen.add(url)
        add_urls(db, [url])
        row = db.execute("SELECT * FROM pages WHERE url=?", (url,)).fetchone()
        if row["status"] != 200:
            store_result(db, downloader.fetch(url))
            row = db.execute("SELECT * FROM pages WHERE url=?", (url,)).fetchone()
        if row["status"] != 200:
            raise RuntimeError("Sitemap unavailable: " + url)
        tree = ET.fromstring(read_page(row))
        locations = [el.text.strip() for el in tree.iter() if el.tag.split("}")[-1] == "loc" and el.text]
        if tree.tag.split("}")[-1] == "sitemapindex":
            queue.extend(locations)
        else:
            add_urls(db, locations)
            counts[url] = len(locations)
    db.execute("INSERT OR REPLACE INTO meta VALUES ('sitemaps',?)", (json.dumps(counts),))
    db.commit()
    print(json.dumps({"sitemaps": counts}, ensure_ascii=False), flush=True)


def assign_new_ids(db):
    next_id = db.execute("SELECT coalesce(max(song_id),0)+1 FROM identities").fetchone()[0]
    legacy = db.execute("SELECT value FROM meta WHERE key='legacy_max_id'").fetchone()
    if legacy:
        next_id = max(next_id, int(legacy[0]) + 1)
    by_source = {}
    for row in db.execute("SELECT url FROM pages WHERE kind='song' ORDER BY url"):
        try:
            source = site_id(row["url"])
        except ValueError:
            continue
        by_source.setdefault(source, row["url"])
    for source, url in sorted(by_source.items()):
        existing = db.execute("SELECT song_id FROM identities WHERE site_id=?", (source,)).fetchone()
        if existing:
            continue
        db.execute("INSERT INTO identities(site_id,song_id,url,legacy) VALUES (?,?,?,0)", (source, next_id, url))
        next_id += 1
    db.commit()


def status(db):
    return [dict(row) for row in db.execute("""SELECT kind,count(*) total,
        sum(status=200) downloaded,sum(status IS NULL) pending,
        sum(status IS NOT NULL AND status!=200) failed FROM pages GROUP BY kind ORDER BY kind""")]


def download_pending(db, downloader, workers, kinds, max_attempts, limit):
    where = " AND kind IN (" + ",".join("?" for _ in kinds) + ")" if kinds else ""
    rows = db.execute("SELECT url FROM pages WHERE coalesce(status,0)!=200 AND attempts<?" + where + " ORDER BY CASE kind WHEN 'song' THEN 0 ELSE 1 END,url", (max_attempts, *kinds)).fetchall()
    if limit:
        rows = rows[:limit]
    print(json.dumps({"pending_this_run":len(rows),"interval":downloader.interval,"workers":workers}),flush=True)
    # Bounded batches keep both queued work and resume state small.
    done = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as pool:
        for offset in range(0, len(rows), workers * 4):
            tasks = [pool.submit(downloader.fetch, row["url"]) for row in rows[offset:offset+workers*4]]
            for task in concurrent.futures.as_completed(tasks):
                result = task.result()
                store_result(db, result)
                done += 1
                if done % 50 == 0 or result["status"] != 200 or done == len(rows):
                    print(json.dumps({"at":now(),"done":done,"total":len(rows),"status":result["status"],"error":result["error"]}),flush=True)
    print(json.dumps({"status":status(db)},ensure_ascii=False),flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["seed", "fetch", "status"])
    parser.add_argument("--kind", choices=["all", "songs", "listings"],default="all")
    parser.add_argument("--workers",type=int,default=4)
    parser.add_argument("--interval",type=float,default=0.5)
    parser.add_argument("--max-attempts",type=int,default=3)
    parser.add_argument("--limit",type=int,default=0)
    args=parser.parse_args()
    if args.interval < 0.5 or not 1 <= args.workers <= 4:
        parser.error("Use interval >= 0.5 seconds and 1-4 workers")
    db=connect()
    if args.command == "status":
        print(json.dumps({"status":status(db)},ensure_ascii=False));return
    seed_legacy(db)
    add_urls(db,[BASE])
    downloader=Downloader(args.interval)
    if args.command == "seed":
        load_sitemaps(db,downloader)
        assign_new_ids(db)
        print(json.dumps({"status":status(db)},ensure_ascii=False));return
    kinds={"all":[],"songs":["song"],"listings":["artist","repertoire","tag","page"]}[args.kind]
    download_pending(db,downloader,args.workers,kinds,args.max_attempts,args.limit)


if __name__ == "__main__":
    main()
