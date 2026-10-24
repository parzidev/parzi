"""Independently validate the three-file application catalog and its references."""
from __future__ import annotations

import argparse
from collections import Counter
from datetime import datetime
import hashlib
import json
from pathlib import Path
import re
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent
_SOURCE_ID = re.compile(r"-(\d+)\.html$")
_SHA256 = re.compile(r"^[0-9a-f]{64}$")
_HTML = re.compile(r"</?[A-Za-z][^>]*>")
_MISSING = object()
QUARANTINE_REASONS = frozenset({
    "no_chords", "no_lyrics", "unparsed_chord_notation",
    "invalid_chord_position", "invalid_chord_name", "chord_index_mismatch",
})


def _positive_int(value):
    return type(value) is int and value > 0


def _text(value):
    return isinstance(value, str) and bool(value.strip())


def _source_id(url):
    if not isinstance(url, str):
        return None
    parsed = urlsplit(url)
    match = _SOURCE_ID.search(parsed.path)
    return int(match.group(1)) if match else None


def _public_url(url):
    if not isinstance(url, str):
        return False
    parsed = urlsplit(url)
    return parsed.scheme == "https" and parsed.hostname == "www.repertuarim.com"


def _no_duplicate_keys(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError("duplicate JSON key: " + key)
        result[key] = value
    return result


def _load_json(text):
    return json.loads(text, object_pairs_hook=_no_duplicate_keys)


def validate_catalog(dist_dir=ROOT / "dist", legacy_path=ROOT.parent / "sarki_bilgileri.json"):
    """Return a report; no catalog files are modified and no network is used.

    Quarantined, successfully parsed songs retain their IDs without entering
    active collections. Download/parse exclusions remain strict errors.
    """
    dist_dir = Path(dist_dir)
    errors = []
    error_count = 0

    def fail(code, **details):
        nonlocal error_count
        error_count += 1
        if len(errors) < 100:
            errors.append({"code": code, **details})

    def check_source(source, context):
        if not isinstance(source, dict):
            fail("missing_source", **context)
            return None
        source_id = source.get("site_id")
        if not _positive_int(source_id):
            fail("invalid_source_id", **context)
        if not _public_url(source.get("url")) or _source_id(source.get("url")) != source_id:
            fail("source_url_mismatch", **context)
        if source.get("artist_url") is not None and not _public_url(source["artist_url"]):
            fail("invalid_artist_url", **context)
        if not isinstance(source.get("html_sha256"), str) or not _SHA256.fullmatch(source["html_sha256"]):
            fail("invalid_source_hash", **context)
        try:
            fetched = datetime.fromisoformat(source.get("fetched_at", "").replace("Z", "+00:00"))
            if fetched.tzinfo is None:
                raise ValueError("timezone required")
        except (TypeError, ValueError, AttributeError):
            fail("invalid_fetched_at", **context)
        return source_id if _positive_int(source_id) else None

    files = {}
    objects = {}
    for name in ("songs.jsonl", "collections.json", "manifest.json"):
        try:
            raw = (dist_dir / name).read_bytes()
            files[name] = {"bytes": len(raw), "sha256": hashlib.sha256(raw).hexdigest()}
            if name != "songs.jsonl":
                objects[name] = _load_json(raw.decode("utf-8"))
        except (OSError, UnicodeError, ValueError) as exc:
            fail("unreadable_file", file=name, detail=str(exc))
    manifest = objects.get("manifest.json", {})
    collections_document = objects.get("collections.json", {})
    if not isinstance(manifest, dict):
        fail("manifest_not_object")
        manifest = {}
    if not isinstance(collections_document, dict):
        fail("collections_not_object")
        collections_document = {}
    if manifest.get("schema_version") != 2:
        fail("invalid_manifest_schema_version", value=manifest.get("schema_version"))
    if manifest.get("complete") is False:
        fail("manifest_incomplete")
    if collections_document.get("schema_version") != 2:
        fail("invalid_collections_schema_version", value=collections_document.get("schema_version"))

    ids = set()
    source_ids = set()
    id_to_source = {}
    artist_names = set()
    song_count = 0
    warning_counts = Counter()
    songs_path = dist_dir / "songs.jsonl"
    if "songs.jsonl" in files:
        with songs_path.open(encoding="utf-8") as stream:
            for line_number, line in enumerate(stream, 1):
                if not line.strip():
                    fail("blank_jsonl_line", line=line_number)
                    continue
                try:
                    song = _load_json(line)
                except ValueError as exc:
                    fail("invalid_song_json", line=line_number, detail=str(exc))
                    continue
                song_count += 1
                if not isinstance(song, dict):
                    fail("song_not_object", line=line_number)
                    continue
                song_id = song.get("id")
                context = {"line": line_number, "song_id": song_id}
                if not _positive_int(song_id):
                    fail("invalid_song_id", **context)
                elif song_id in ids:
                    fail("duplicate_song_id", **context)
                else:
                    ids.add(song_id)
                for key in ("artist", "title"):
                    if not _text(song.get(key)) or _HTML.search(song.get(key, "")):
                        fail("invalid_song_text", field=key, **context)
                if isinstance(song.get("artist"), str):
                    artist_names.add(song["artist"])
                if any(key in song for key in ("normalized", "lyrics_data", "akorlar_ve_sozler", "scrape_status")):
                    fail("redundant_legacy_field", **context)
                source_id = check_source(song.get("source"), context)
                if source_id in source_ids:
                    fail("duplicate_source_id", site_id=source_id, **context)
                elif source_id is not None:
                    source_ids.add(source_id)
                if _positive_int(song_id) and _positive_int(source_id):
                    id_to_source[song_id] = source_id
                music = song.get("music")
                if not isinstance(music, dict):
                    fail("missing_music", **context)
                    music = {}
                for key in ("original_key", "display_key", "easy_key"):
                    value = music.get(key, _MISSING)
                    if value is not None and not _text(value):
                        fail("invalid_music_key", field=key, **context)
                capo = music.get("capo", _MISSING)
                if capo is not None and (type(capo) is not int or not 0 <= capo <= 24):
                    fail("invalid_capo", **context)
                rhythms = music.get("rhythms")
                if not isinstance(rhythms, list) or any(not _text(value) for value in rhythms):
                    fail("invalid_rhythms", **context)
                elif any(re.search(r"henüz|eklenmemiş", value, re.I) for value in rhythms):
                    fail("rhythm_placeholder", **context)
                blocks = song.get("blocks")
                derived_chords = []
                seen_chords = set()
                if not isinstance(blocks, list) or not blocks:
                    fail("missing_blocks", **context)
                    blocks = []
                has_content = False
                for block_number, block in enumerate(blocks):
                    block_context = {**context, "block": block_number}
                    if not isinstance(block, dict):
                        fail("block_not_object", **block_context)
                        continue
                    block_type = block.get("type")
                    if block_type not in {"line", "section", "spacer"}:
                        fail("invalid_block_type", **block_context)
                        continue
                    text = block.get("text", "")
                    if not isinstance(text, str) or _HTML.search(text):
                        fail("invalid_block_text", **block_context)
                    elif text.strip():
                        has_content = True
                    if block_type == "line":
                        if not isinstance(block.get("text"), str):
                            fail("missing_line_text", **block_context)
                        chords = block.get("chords")
                        if not isinstance(chords, list):
                            fail("missing_line_chords", **block_context)
                            continue
                        previous_column = -1
                        for chord in chords:
                            if not isinstance(chord, dict):
                                fail("chord_not_object", **block_context)
                                continue
                            name = chord.get("name")
                            column = chord.get("column")
                            if not _text(name) or any(char.isspace() for char in name):
                                fail("invalid_chord_name", **block_context)
                            elif name not in seen_chords:
                                seen_chords.add(name)
                                derived_chords.append(name)
                            if type(column) is not int or column < 0 or column <= previous_column:
                                fail("invalid_chord_column", **block_context)
                            else:
                                previous_column = column
                        if chords:
                            has_content = True
                if not has_content:
                    fail("empty_song_content", **context)
                if song.get("chords") != derived_chords:
                    fail("derived_chords_mismatch", **context)
                quality = song.get("quality")
                warnings = quality.get("warnings") if isinstance(quality, dict) else None
                if not isinstance(warnings, list) or any(not _text(value) for value in warnings):
                    fail("invalid_quality_warnings", **context)
                else:
                    warning_counts.update(warnings)

    manifest_quality = manifest.get("quality", {})
    if not isinstance(manifest_quality, dict):
        fail("invalid_manifest_quality")
        manifest_quality = {}
    quarantined = manifest_quality.get("quarantined_songs", [])
    if not isinstance(quarantined, list):
        fail("invalid_quarantined_songs")
        quarantined = []
    quarantine_ids = set()
    quarantine_source_ids = set()
    for index, song in enumerate(quarantined):
        if not isinstance(song, dict):
            fail("quarantined_song_not_object", quarantine_index=index)
            continue
        song_id = song.get("id")
        context = {"quarantine_index": index, "song_id": song_id}
        if not _positive_int(song_id):
            fail("invalid_quarantined_song_id", **context)
        elif song_id in quarantine_ids:
            fail("duplicate_quarantined_song_id", **context)
        else:
            quarantine_ids.add(song_id)
        if _positive_int(song_id) and song_id in ids:
            fail("quarantined_song_is_active", **context)
        for key in ("artist", "title"):
            if not _text(song.get(key)) or _HTML.search(song.get(key, "")):
                fail("invalid_quarantined_song_text", field=key, **context)
        source_id = check_source(song.get("source"), context)
        if source_id is not None:
            if source_id in quarantine_source_ids:
                fail("duplicate_quarantined_source_id", site_id=source_id, **context)
            quarantine_source_ids.add(source_id)
            if source_id in source_ids:
                fail("quarantined_source_is_active", site_id=source_id, **context)
            if _positive_int(song_id):
                # Do not let an overlapping invalid quarantine overwrite the
                # authoritative active ID/source mapping during legacy checks.
                id_to_source.setdefault(song_id, source_id)
        reasons = song.get("reasons")
        if (not isinstance(reasons, list) or not reasons
                or any(not isinstance(reason, str) or reason not in QUARANTINE_REASONS for reason in reasons)):
            fail("invalid_quarantine_reasons", **context)
        elif len(set(reasons)) != len(reasons):
            fail("duplicate_quarantine_reason", **context)
        # Optional acquisition fields cannot turn an unsuccessful download into
        # an apparently valid music-quality quarantine record.
        for owner in (song, song.get("source", {})):
            if isinstance(owner, dict) and "http_status" in owner and owner["http_status"] != 200:
                fail("quarantine_acquisition_failure", **context)

    sections = collections_document.get("sections")
    collections = collections_document.get("collections")
    if not isinstance(sections, list):
        fail("missing_sections")
        sections = []
    if not isinstance(collections, list):
        fail("missing_collections")
        collections = []
    collection_ids = set()
    collection_sources = set()
    references = []
    for collection in sections + collections:
        if not isinstance(collection, dict):
            fail("collection_not_object")
            continue
        collection_id = collection.get("id")
        if not _text(collection_id):
            fail("invalid_collection_id")
        elif collection_id in collection_ids:
            fail("duplicate_collection_id", collection_id=collection_id)
        else:
            collection_ids.add(collection_id)
        if not _text(collection.get("title")):
            fail("invalid_collection_title", collection_id=collection_id)
        if not _public_url(collection.get("source_url")):
            fail("invalid_collection_url", collection_id=collection_id)
        items = collection.get("items")
        if not isinstance(items, list) or not items:
            fail("empty_collection", collection_id=collection_id)
            continue
        seen_items = set()
        previous_source_position = 0
        for position, item in enumerate(items, 1):
            if not isinstance(item, dict):
                fail("collection_item_not_object", collection_id=collection_id)
                continue
            if item.get("position") != position:
                fail("collection_position_mismatch", collection_id=collection_id, position=position)
            if "source_position" in item:
                source_position = item["source_position"]
                if not _positive_int(source_position) or source_position <= previous_source_position:
                    fail("invalid_source_position", collection_id=collection_id, position=position)
                else:
                    previous_source_position = source_position
            kind = item.get("kind")
            if kind == "song":
                identity = (kind, item.get("song_id"))
                if not _positive_int(item.get("song_id")) or item["song_id"] not in ids:
                    fail("unresolved_song_reference", collection_id=collection_id, song_id=item.get("song_id"))
            elif kind in {"artist", "repertoire"}:
                identity = (kind, item.get("url"))
                if not _text(item.get("title")) or not _public_url(item.get("url")):
                    fail("invalid_entity_reference", collection_id=collection_id)
                if not _text(item.get("collection_id")):
                    fail("missing_collection_reference", collection_id=collection_id)
                else:
                    references.append((collection_id, item["collection_id"]))
            else:
                identity = (str(kind), position)
                fail("invalid_collection_item_kind", collection_id=collection_id)
            if identity in seen_items:
                fail("duplicate_collection_item", collection_id=collection_id)
            seen_items.add(identity)
        source_count = collection.get("source_item_count")
        duplicates = collection.get("duplicates_removed")
        filtered = collection.get("filtered_item_count", 0)
        if (type(source_count) is not int or type(duplicates) is not int or duplicates < 0
                or type(filtered) is not int or filtered < 0
                or source_count != len(items) + duplicates + filtered):
            fail("collection_source_count_mismatch", collection_id=collection_id)
    for parent_id, target_id in references:
        if target_id not in collection_ids:
            fail("unresolved_collection_reference", collection_id=parent_id, target_id=target_id)
    for collection in collections:
        if not isinstance(collection, dict):
            continue
        source_url = collection.get("source_url")
        if not isinstance(source_url, str):
            continue
        if source_url in collection_sources:
            fail("duplicate_collection_source_url", source_url=source_url)
        collection_sources.add(source_url)

    empty_collections = manifest_quality.get("empty_collections", [])
    if not isinstance(empty_collections, list):
        fail("invalid_empty_collections")
        empty_collections = []
    empty_collection_urls = set()
    empty_collection_ids = set()
    for collection in empty_collections:
        if not isinstance(collection, dict):
            fail("invalid_empty_collection")
            continue
        source_url = collection.get("source_url")
        collection_id = collection.get("id")
        if (not _public_url(source_url) or not _text(collection_id)
                or collection.get("reason") != "no_eligible_items"):
            fail("invalid_empty_collection")
            continue
        if source_url in empty_collection_urls or collection_id in empty_collection_ids:
            fail("duplicate_empty_collection", source_url=source_url)
        if source_url in collection_sources or collection_id in collection_ids:
            fail("empty_collection_is_active", source_url=source_url)
        empty_collection_urls.add(source_url)
        empty_collection_ids.add(collection_id)

    legacy_rows = []
    if legacy_path is not None:
        try:
            legacy_rows = _load_json(Path(legacy_path).read_text(encoding="utf-8"))
            if not isinstance(legacy_rows, list):
                raise ValueError("legacy catalog is not a list")
        except (OSError, ValueError) as exc:
            fail("unreadable_legacy_catalog", detail=str(exc))
            legacy_rows = []
    preserved = 0
    for legacy in legacy_rows:
        if not isinstance(legacy, dict):
            fail("invalid_legacy_record")
            continue
        old_id = legacy.get("id")
        expected_source_id = _source_id(legacy.get("url"))
        if expected_source_id is None:
            fail("invalid_legacy_source_url", song_id=old_id)
        elif id_to_source.get(old_id) != expected_source_id:
            fail("legacy_id_not_preserved", song_id=old_id, site_id=expected_source_id)
        else:
            preserved += 1

    manifest_files = manifest.get("files")
    if not isinstance(manifest_files, dict):
        fail("missing_manifest_files")
        manifest_files = {}
    for name in ("songs.jsonl", "collections.json"):
        expected = manifest_files.get(name)
        if not isinstance(expected, dict):
            fail("missing_file_digest", file=name)
        elif name in files:
            for field in ("bytes", "sha256"):
                if expected.get(field) != files[name][field]:
                    fail("file_digest_mismatch", file=name, field=field)
    actual_counts = {"songs": song_count, "sections": len(sections), "collections": len(collections),
                     "legacy_preserved": preserved, "artists": len(artist_names),
                     "quarantined_songs": len(quarantined)}
    counts = manifest.get("counts")
    if not isinstance(counts, dict):
        fail("missing_manifest_counts")
        counts = {}
    for key in ("songs", "sections", "collections", "legacy_preserved"):
        if counts.get(key) != actual_counts[key]:
            fail("manifest_count_mismatch", field=key, actual=actual_counts[key], expected=counts.get(key))
    if "artists" in counts and counts["artists"] != actual_counts["artists"]:
        fail("manifest_count_mismatch", field="artists", actual=actual_counts["artists"], expected=counts["artists"])
    if "quarantined_songs" in manifest_quality and counts.get("quarantined_songs") != len(quarantined):
        fail("manifest_count_mismatch", field="quarantined_songs", actual=len(quarantined), expected=counts.get("quarantined_songs"))
    coverage = manifest.get("coverage")
    if not isinstance(coverage, dict):
        fail("missing_coverage")
        coverage = {}
    discovered = coverage.get("discovered_song_site_ids")
    excluded = coverage.get("excluded_songs")
    if not isinstance(discovered, list) or any(not _positive_int(value) for value in discovered):
        fail("invalid_discovered_song_site_ids")
        discovered = []
    elif len(set(discovered)) != len(discovered):
        fail("duplicate_discovered_song_site_id")
    if not isinstance(excluded, list):
        fail("invalid_excluded_songs")
        excluded = []
    excluded_ids = set()
    for exclusion in excluded:
        if not isinstance(exclusion, dict) or not _positive_int(exclusion.get("site_id")) or not _text(exclusion.get("reason")):
            fail("invalid_exclusion")
            continue
        source_id = exclusion["site_id"]
        if source_id in excluded_ids:
            fail("duplicate_exclusion", site_id=source_id)
        excluded_ids.add(source_id)
        fail("excluded_song", site_id=source_id, reason=exclusion["reason"])
    discovered_ids = set(discovered)
    available_ids = source_ids | quarantine_source_ids
    if discovered_ids != available_ids | excluded_ids:
        fail("coverage_mismatch", missing=sorted(discovered_ids - available_ids - excluded_ids),
             unexpected=sorted((available_ids | excluded_ids) - discovered_ids))
    if available_ids & excluded_ids:
        fail("exported_song_also_excluded", site_ids=sorted(available_ids & excluded_ids))
    if "selected_listing_urls" in coverage:
        selected = coverage["selected_listing_urls"]
        source_empty = coverage.get("empty_listing_urls", [])
        if not isinstance(selected, list) or any(not _public_url(url) for url in selected):
            fail("invalid_selected_listing_urls")
            selected = []
        if not isinstance(source_empty, list) or any(not _public_url(url) for url in source_empty):
            fail("invalid_empty_listing_urls")
            source_empty = []
        if len(set(selected)) != len(selected):
            fail("duplicate_selected_listing_url")
        if len(set(source_empty)) != len(source_empty):
            fail("duplicate_empty_listing_url")
        source_empty_urls = set(source_empty)
        if source_empty_urls & (collection_sources | empty_collection_urls):
            fail("overlapping_listing_coverage", urls=sorted(source_empty_urls & (collection_sources | empty_collection_urls)))
        covered = collection_sources | source_empty_urls | empty_collection_urls
        if set(selected) != covered:
            fail("listing_coverage_mismatch", missing=sorted(set(selected) - covered),
                 unexpected=sorted(covered - set(selected)))
    return {"valid": error_count == 0, "error_count": error_count, "errors": errors,
            "counts": actual_counts, "quality_warning_counts": dict(sorted(warning_counts.items()))}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("dist", type=Path, nargs="?", default=ROOT / "dist")
    parser.add_argument("--legacy", type=Path, default=ROOT.parent / "sarki_bilgileri.json")
    args = parser.parse_args()
    report = validate_catalog(args.dist, args.legacy)
    print(json.dumps(report, ensure_ascii=False, indent=2))
    raise SystemExit(0 if report["valid"] else 2)


if __name__ == "__main__":
    main()
