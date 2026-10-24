"""Discover homepage collections and export the validated three-file catalog."""
from __future__ import annotations

import argparse
from collections import Counter
import concurrent.futures
import hashlib
import json
from pathlib import Path
import shutil

from crawl import (ROOT, BASE, Downloader, add_urls, assign_new_ids, canonical_url,
                   connect, now, read_page, site_id, store_result)
from discovery import extract_collections, extract_links
from song_parser import parse_song
from quality import assess_song

SCHEMA_VERSION = 2


def json_text(value, pretty=False):
    return json.dumps(value, ensure_ascii=False, indent=2 if pretty else None,
                      separators=None if pretty else (",", ":"))


def ensure_page(db, downloader, url):
    add_urls(db, [url])
    row = db.execute("SELECT * FROM pages WHERE url=?", (url,)).fetchone()
    if row["status"] != 200:
        store_result(db, downloader.fetch(url))
        row = db.execute("SELECT * FROM pages WHERE url=?", (url,)).fetchone()
    if row["status"] != 200:
        raise RuntimeError("Collection page unavailable: " + url)
    return row


def scan_cached_links(db):
    """Follow catalog links even when an artist is absent from the XML maps."""
    before=db.execute("SELECT count(*) FROM pages").fetchone()[0]
    rows=db.execute("""SELECT p.* FROM pages p LEFT JOIN scanned_links s ON s.url=p.url
        WHERE p.status=200 AND (s.sha256 IS NULL OR s.sha256!=p.sha256)
        AND (p.kind IN ('song','artist','repertoire') OR p.url=? OR p.url LIKE 'https://www.repertuarim.com/ara/%')""",(BASE,)).fetchall()
    for row in rows:
        links=extract_links(read_page(row),row["url"])
        add_urls(db,[item["url"] for group in links.values() for item in group])
        db.execute("INSERT OR REPLACE INTO scanned_links VALUES (?,?)",(row["url"],row["sha256"]))
    db.commit()
    added=db.execute("SELECT count(*) FROM pages").fetchone()[0]-before
    print(json_text({"cached_pages_scanned":len(rows),"new_linked_pages":added}),flush=True)
    return added


def discover(db):
    scan_cached_links(db)
    downloader = Downloader(0.5)
    home = ensure_page(db, downloader, BASE)
    sections = extract_collections(read_page(home), BASE)
    if not sections or not any(s["title"] == "Popüler Akorlar" for s in sections):
        raise RuntimeError("Homepage collection structure changed")
    home_refs = {item["url"] for section in sections for item in section["items"]
                 if item["kind"] in {"artist", "repertoire"}}
    add_urls(db, home_refs)
    # The live site's listing graph is traversed, not only the previous catalog
    # or homepage highlights. The runner repeats this until no links are new.
    selected = sorted(r[0] for r in db.execute("SELECT url FROM pages WHERE kind IN ('artist','repertoire') OR url LIKE 'https://www.repertuarim.com/ara/%'"))
    pending = [url for url in selected if db.execute("SELECT status FROM pages WHERE url=?", (url,)).fetchone()[0] != 200]
    print(json_text({"selected_listings": len(selected), "pending": len(pending)}), flush=True)
    completed = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        for offset in range(0, len(pending), 16):
            tasks = [pool.submit(downloader.fetch, url) for url in pending[offset:offset+16]]
            for task in concurrent.futures.as_completed(tasks):
                result = task.result()
                store_result(db, result)
                completed += 1
                if result["status"] != 200:
                    print(json_text({"collection_download_error": result}), flush=True)
                elif completed % 50 == 0:
                    print(json_text({"at":now(),"listings_downloaded":completed,"pending_this_round":len(pending)}),flush=True)
    song_urls = {item["url"] for section in sections for item in section["items"] if item["kind"] == "song"}
    primary_count = 0
    discovered_listings = set()
    for url in selected:
        row = db.execute("SELECT * FROM pages WHERE url=?", (url,)).fetchone()
        if row["status"] != 200:
            continue
        text = read_page(row)
        links = extract_links(text,url)
        song_urls.update(item["url"] for item in links["songs"])
        discovered_listings.update(item["url"] for kind in ("artists","repertoires","pages") for item in links[kind])
        primary = [c for c in extract_collections(text, url) if c.get("role") == "primary"]
        primary_count += len(primary)
        for collection in primary:
            song_urls.update(item["url"] for item in collection["items"] if item["kind"] == "song")
    add_urls(db, sorted(song_urls))
    add_urls(db, sorted(discovered_listings))
    assign_new_ids(db)
    db.execute("INSERT OR REPLACE INTO meta VALUES ('selected_listing_urls',?)", (json_text(selected),))
    db.commit()
    print(json_text({"sections":len(sections),"primary_collections":primary_count,
                     "collection_song_urls":len(song_urls),"known_songs":db.execute("SELECT count(*) FROM identities").fetchone()[0]}),flush=True)


def collect(db):
    meta = {r["key"]: r["value"] for r in db.execute("SELECT * FROM meta")}
    identities = {r["site_id"]: dict(r) for r in db.execute("SELECT * FROM identities")}
    pages = {r["url"]: r for r in db.execute("SELECT * FROM pages")}
    songs, exclusions, quarantined = [], [], []
    for source_id, identity in sorted(identities.items(), key=lambda item:item[1]["song_id"]):
        row = pages[identity["url"]]
        reason = None
        if row["status"] != 200:
            reason = "not_downloaded" if row["status"] is None else "download_failed"
        else:
            try:
                song = parse_song(read_page(row), row["url"], identity["song_id"], row["fetched_at"])
                if song["source"]["site_id"] != source_id:
                    raise ValueError("Source identity changed")
                if song["source"]["html_sha256"] != row["sha256"]:
                    raise ValueError("Cached HTML checksum mismatch")
                assessment=assess_song(song)
                song["quality"]["warnings"]=assessment["warnings"]
                if assessment["eligible"]:
                    songs.append(song)
                else:
                    quarantined.append({"id":song["id"],"source":song["source"],
                                        "artist":song["artist"],"title":song["title"],
                                        "reasons":assessment["reasons"]})
            except Exception as error:
                reason = "parse_failed: " + type(error).__name__ + ": " + str(error)[:200]
        if reason:
            exclusion = {"site_id":source_id,"url":row["url"],"reason":reason,
                         "http_status":row["status"],"song_id":identity["song_id"]}
            if identity["legacy"]:
                exclusion["legacy_id"] = identity["song_id"]
            exclusions.append(exclusion)
    song_by_source = {song["source"]["site_id"]:song for song in songs}
    quarantined_sources={song["source"]["site_id"] for song in quarantined}
    home = pages.get(BASE)
    if home is None or home["status"] != 200:
        raise RuntimeError("Run discover before export")
    sections = extract_collections(read_page(home), BASE)
    selected = json.loads(meta.get("selected_listing_urls", "[]"))
    if not selected:
        raise RuntimeError("Selected listing scope is missing")
    collections = []
    empty_listings = []
    unresolved = []
    for url in selected:
        row = pages.get(url)
        if row is None or row["status"] != 200:
            unresolved.append({"kind":"listing","url":url,"reason":"not_downloaded",
                               "http_status":row["status"] if row else None})
            continue
        primary = [c for c in extract_collections(read_page(row),url) if c.get("role") == "primary"]
        if not primary:
            empty_listings.append(url)
            continue
        if len(primary) != 1:
            raise RuntimeError("Multiple main collections need pagination merge: " + url)
        collections.extend(primary)
    meta["empty_listing_urls"] = json_text(empty_listings)
    by_url = {c["source_url"]:c["id"] for c in collections}
    for collection in sections + collections:
        resolved = []
        filtered = 0
        for item in collection["items"]:
            if item["kind"] == "song":
                source_id = site_id(item["url"])
                song = song_by_source.get(source_id)
                if song is None:
                    if source_id not in quarantined_sources:
                        unresolved.append({"collection_id":collection["id"],"site_id":source_id,"url":item["url"]})
                    filtered += 1
                    continue
                resolved.append({"kind":"song","song_id":song["id"],"position":len(resolved)+1,
                                 "source_position":item.get("source_position",item["position"])})
            else:
                target = by_url.get(item["url"])
                if target is None:
                    if item["url"] not in empty_listings:
                        unresolved.append({"collection_id":collection["id"],"url":item["url"],"reason":"missing_main_collection"})
                    filtered += 1
                    continue
                resolved.append({"kind":item["kind"],"title":item["title"],"url":item["url"],
                                 "collection_id":target,"position":len(resolved)+1,
                                 "source_position":item.get("source_position",item["position"])})
        collection["items"] = resolved
        collection["filtered_item_count"] = filtered
    # Filtering a song can empty its artist/repertoire list. Remove empty
    # navigation targets too, without leaving references to absent categories.
    while True:
        empty_ids={c["id"] for c in collections if not c["items"]}
        changed=False
        for collection in sections+collections:
            kept=[]
            for item in collection["items"]:
                if item.get("collection_id") in empty_ids:
                    collection["filtered_item_count"]+=1
                    changed=True
                else:
                    item["position"]=len(kept)+1
                    kept.append(item)
            collection["items"]=kept
        if not changed:
            break
    meta["quarantined_songs"]=json_text(quarantined)
    meta["empty_collections"]=json_text([{"id":c["id"],"source_url":c["source_url"],"reason":"no_eligible_items"}
                                        for c in collections if not c["items"]])
    collections=[c for c in collections if c["items"]]
    sections=[c for c in sections if c["items"]]
    return songs, {"schema_version":SCHEMA_VERSION,"sections":sections,"collections":collections}, exclusions, unresolved, meta


def export(db, output, allow_incomplete=False):
    songs, collections, exclusions, unresolved, meta = collect(db)
    if (exclusions or unresolved) and not allow_incomplete:
        raise RuntimeError(json_text({"incomplete_songs":len(exclusions),"unresolved_references":len(unresolved),
                                      "examples":exclusions[:5]+unresolved[:5]}))
    temporary = output.with_name(output.name + ".building")
    temporary.mkdir(parents=True,exist_ok=True)
    song_path = temporary / "songs.jsonl"
    with song_path.open("w",encoding="utf-8",newline="\n") as file:
        for song in songs:
            file.write(json_text(song)+"\n")
    (temporary / "collections.json").write_text(json_text(collections)+"\n",encoding="utf-8")
    files = {}
    for name in ("songs.jsonl","collections.json"):
        raw=(temporary/name).read_bytes()
        files[name]={"bytes":len(raw),"sha256":hashlib.sha256(raw).hexdigest()}
    identity_by_id={r["song_id"]:r for r in db.execute("SELECT * FROM identities")}
    quarantined=json.loads(meta.get("quarantined_songs","[]"))
    all_preserved=songs+quarantined
    warnings=Counter(warning for song in songs for warning in song["quality"]["warnings"])
    manifest={
        "schema_version":SCHEMA_VERSION,"generated_at":now(),"complete":not bool(exclusions or unresolved),
        "source":{"site":BASE,"crawl_started_at":meta["started_at"],
                  "method":"public HTML pages; XML sitemaps + preserved legacy URLs + homepage collection links",
                  "collection_scope":"all homepage sections; primary lists from all sitemap and transitively linked artist/repertoire/search pages"},
        "counts":{"songs":len(songs),"artists":len({s["artist"] for s in songs}),
                  "sections":len(collections["sections"]),"collections":len(collections["collections"]),
                  "quarantined_songs":len(quarantined),
                  "legacy_preserved":sum(identity_by_id[s["id"]]["legacy"] for s in all_preserved),
                  "legacy_active":sum(identity_by_id[s["id"]]["legacy"] for s in songs),
                  "legacy_quarantined":sum(identity_by_id[s["id"]]["legacy"] for s in quarantined),
                  "new_songs":sum(not identity_by_id[s["id"]]["legacy"] for s in all_preserved)},
        "coverage":{"discovered_song_site_ids":[r[0] for r in db.execute("SELECT site_id FROM identities ORDER BY site_id")],
                    "excluded_songs":exclusions,"unresolved_collection_items":unresolved,
                    "legacy_rejected_urls":json.loads(meta.get("legacy_rejected","[]")),
                    "rejected_source_urls":[dict(r) for r in db.execute("SELECT * FROM rejected_urls ORDER BY url")],
                    "empty_listing_urls":json.loads(meta.get("empty_listing_urls","[]")),
                    "sitemaps":json.loads(meta.get("sitemaps","{}")),
                    "random_probe":json.loads(meta.get("random_probe","null")),
                    "selected_listing_urls":json.loads(meta.get("selected_listing_urls","[]"))},
        "quality":{"warnings":dict(warnings),"quarantined_songs":quarantined,
                   "empty_collections":json.loads(meta.get("empty_collections","[]")),
                   "missing_original_key":sum(s["music"]["original_key"] is None for s in songs),
                   "missing_capo":sum(s["music"]["capo"] is None for s in songs),
                   "songs_without_rhythm":sum(not s["music"]["rhythms"] for s in songs),
                   "duplicate_collection_items_removed":sum(c["duplicates_removed"] for c in collections["sections"]+collections["collections"]),
                   "empty_dynamic_sections_omitted":["Rastgele"]},
        "files":files,
    }
    (temporary/"manifest.json").write_text(json_text(manifest,pretty=True)+"\n",encoding="utf-8")
    if not allow_incomplete:
        from validate_catalog import validate_catalog
        report=validate_catalog(temporary)
        if not report["valid"]:
            raise RuntimeError(json_text({"validation_failed":report}))
    if output.exists():
        previous=output.with_name(output.name+".previous")
        if previous.exists():
            shutil.rmtree(previous)
        output.replace(previous)
    temporary.replace(output)
    print(json_text({"output":str(output),"counts":manifest["counts"],"quality":manifest["quality"],
                     "excluded_songs":len(exclusions),"unresolved_references":len(unresolved)}),flush=True)


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command",choices=["discover","export"])
    parser.add_argument("--output",type=Path,default=ROOT/"dist")
    parser.add_argument("--allow-incomplete",action="store_true")
    args=parser.parse_args()
    if args.allow_incomplete and args.output.resolve()==(ROOT/"dist").resolve():
        parser.error("Incomplete previews must use --output state/preview")
    db=connect()
    if args.command=="discover":
        discover(db)
    else:
        export(db,args.output,args.allow_incomplete)


if __name__=="__main__":
    main()
