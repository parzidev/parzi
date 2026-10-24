"""Bounded anonymous discovery through Repertuarım's public random endpoint.

The result measures this probe only. Zero direct new songs is not proof that
all songs are known: newly queued artists and repertoires still need crawling.
"""

from __future__ import annotations

import argparse
import gzip
import hashlib
from http.cookiejar import CookieJar
import json
import math
from pathlib import Path
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import HTTPCookieProcessor, Request, build_opener
from uuid import uuid4

import crawl
from discovery import extract_links

ROOT = Path(__file__).resolve().parent
ENDPOINT = crawl.BASE + "theme/default/inc/ajaxr.php"
HEADERS = {
    **crawl.HEADERS,
    "Referer": crawl.BASE,
    "Origin": crawl.BASE.rstrip("/"),
    "X-Requested-With": "XMLHttpRequest",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
}


def _save_stats(db, stats):
    stats["timestamp"] = crawl.now()
    db.execute("INSERT OR REPLACE INTO meta(key,value) VALUES ('random_probe',?)",
               (json.dumps(stats, ensure_ascii=False),))
    db.commit()
    return stats


def _failure(error):
    # Record no response headers, cookies, request dumps or response error body.
    return {"error": type(error).__name__, "status": error.code if isinstance(error, HTTPError) else 0}


def probe_random(db, batches=100, interval=0.5):
    """Queue references from a finite number of anonymous public random replies.

    Request cookies live only in a new in-memory CookieJar. Successful response
    bodies and nonsecret audit metadata are cached under an isolated run folder.
    Existing page URLs and source IDs are checked before and after enqueueing.
    """
    if isinstance(batches, bool) or not isinstance(batches, int) or batches < 1:
        raise ValueError("batches must be a positive integer")
    if not isinstance(interval, (int, float)) or not math.isfinite(interval) or interval < 0.5:
        raise ValueError("interval must be at least 0.5 seconds")
    started = crawl.now()
    run_id = started.replace(":", "").replace("+", "_") + "-" + uuid4().hex[:8]
    relative = Path("cache/random") / run_id
    directory = ROOT / relative
    directory.mkdir(parents=True, exist_ok=False)
    stats = {
        "started_at": started,
        "timestamp": started,
        "requested_batches": batches,
        "batches": 0,
        "successful_batches": 0,
        "new_direct_songs": 0,
        "new_song_urls": 0,
        "new_artists": 0,
        "new_repertoires": 0,
        "failures": 0,
        "interval": interval,
        "cache_dir": str(relative),
        "scope": "bounded_random_probe",
        "exhaustive": False,
    }
    known_sources = {row[0] for row in db.execute("SELECT site_id FROM identities")}
    for row in db.execute("SELECT url FROM pages WHERE kind='song'"):
        try:
            known_sources.add(crawl.site_id(row[0]))
        except ValueError:
            continue
    opener = build_opener(HTTPCookieProcessor(CookieJar()))
    audit = directory / "audit.jsonl"

    def record(item):
        with audit.open("a", encoding="utf-8") as stream:
            stream.write(json.dumps(item, ensure_ascii=False) + "\n")

    try:
        with opener.open(Request(crawl.BASE, headers=crawl.HEADERS), timeout=25) as response:
            response.read()
            if response.status != 200:
                raise ValueError("Unexpected bootstrap status")
        record({"event": "bootstrap", "timestamp": crawl.now(), "status": 200})
    except (HTTPError, URLError, TimeoutError, OSError, ValueError) as error:
        stats["failures"] += 1
        stats["bootstrap_failed"] = True
        record({"event": "bootstrap", "timestamp": crawl.now(), **_failure(error)})
        return _save_stats(db, stats)

    for batch in range(1, batches + 1):
        # Also space the first POST from the bootstrap request. Waiting after
        # responses keeps all attempts at least interval seconds apart.
        time.sleep(interval)
        stats["batches"] += 1
        stamp = crawl.now()
        item = {"event": "random_response", "batch": batch, "timestamp": stamp}
        request = Request(ENDPOINT, data=urlencode({"get": "randomContent"}).encode("ascii"),
                          headers=HEADERS, method="POST")
        try:
            with opener.open(request, timeout=25) as response:
                raw = response.read()
                status = response.status
                if status != 200:
                    raise ValueError("Unexpected endpoint status")
            filename = relative / f"{batch:04d}.html.gz"
            (ROOT / filename).write_bytes(gzip.compress(raw, mtime=0))
            item.update({"status": status, "byte_count": len(raw),
                         "sha256": hashlib.sha256(raw).hexdigest(), "cache_file": str(filename)})
            if not raw.strip():
                raise ValueError("Random response is empty")
            links = extract_links(raw.decode("utf-8-sig"), crawl.BASE)
            counts = {key: len(links[key]) for key in ("songs", "artists", "repertoires")}
            if not any(counts.values()):
                raise ValueError("Random response contains no catalog references")
            urls = [entry["url"] for key in counts for entry in links[key]]
            before = {url for url in urls if db.execute("SELECT 1 FROM pages WHERE url=?", (url,)).fetchone()}
            # New IDs may already have been assigned by the graph crawler.
            known_sources.update(row[0] for row in db.execute("SELECT site_id FROM identities"))
            crawl.add_urls(db, urls)
            inserted = {url for url in urls if url not in before
                        and db.execute("SELECT 1 FROM pages WHERE url=?", (url,)).fetchone()}
            new_song_urls = inserted.intersection(entry["url"] for entry in links["songs"])
            new_sources = {crawl.site_id(url) for url in new_song_urls} - known_sources
            known_sources.update(crawl.site_id(entry["url"]) for entry in links["songs"])
            new_counts = {
                "new_direct_songs": len(new_sources),
                "new_song_urls": len(new_song_urls),
                "new_artists": len(inserted.intersection(entry["url"] for entry in links["artists"])),
                "new_repertoires": len(inserted.intersection(entry["url"] for entry in links["repertoires"])),
            }
            for key, value in new_counts.items():
                stats[key] += value
            stats["successful_batches"] += 1
            item.update({"counts": counts, **new_counts})
        except (HTTPError, URLError, TimeoutError, OSError, ValueError, UnicodeError) as error:
            stats["failures"] += 1
            failure = _failure(error)
            if "status" in item:
                failure.pop("status")
            item.update(failure)
        record(item)
        # The active pipeline can inspect progress without reading cookie state.
        _save_stats(db, stats)
    crawl.assign_new_ids(db)
    return _save_stats(db, stats)


def main():
    parser = argparse.ArgumentParser(description="Bounded anonymous random catalog discovery")
    parser.add_argument("--batches", type=int, default=100)
    parser.add_argument("--interval", type=float, default=0.5)
    arguments = parser.parse_args()
    db = crawl.connect()
    try:
        stats = probe_random(db, batches=arguments.batches, interval=arguments.interval)
    finally:
        db.close()
    print(json.dumps(stats, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
