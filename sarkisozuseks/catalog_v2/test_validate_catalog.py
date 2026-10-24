import copy
import hashlib
import json
from pathlib import Path
import tempfile
import unittest

from validate_catalog import validate_catalog


class CatalogValidationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.dist = self.root / "dist"
        self.dist.mkdir()
        self.legacy = self.root / "legacy.json"
        self.song = {
            "id": 17,
            "source": {"site_id": 549, "url": "https://www.repertuarim.com/akor/example-akor-549.html",
                       "artist_url": "https://www.repertuarim.com/akor-tab/example/",
                       "fetched_at": "2026-10-24T01:00:00+03:00", "html_sha256": "a" * 64},
            "artist": "Example", "title": "Example song",
            "music": {"original_key": "Am", "display_key": "Am", "easy_key": None,
                      "capo": 0, "rhythms": []},
            "chords": ["Am", "G"],
            "blocks": [{"type": "line", "text": "Synthetic test text",
                        "chords": [{"name": "Am", "column": 0}, {"name": "G", "column": 8}]}],
            "quality": {"warnings": []},
        }
        self.section = {"id": "home:popular", "title": "Popüler Akorlar",
                        "source_url": "https://www.repertuarim.com/", "kind": "songs",
                        "items": [{"kind": "song", "song_id": 17, "position": 1}],
                        "source_item_count": 1, "duplicates_removed": 0}
        self.collections = {"schema_version": 2, "sections": [self.section], "collections": []}
        self.legacy.write_text(json.dumps([{"id": 17, "url": self.song["source"]["url"]}]))

    def tearDown(self):
        self.temp.cleanup()

    def write(self, songs=None, collections=None, excluded=None, quality=None, coverage=None):
        songs = songs if songs is not None else [self.song]
        collections = collections if collections is not None else self.collections
        (self.dist / "songs.jsonl").write_text("".join(json.dumps(song) + "\n" for song in songs))
        (self.dist / "collections.json").write_text(json.dumps(collections))
        files = {}
        for name in ("songs.jsonl", "collections.json"):
            data = (self.dist / name).read_bytes()
            files[name] = {"bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}
        manifest = {"schema_version": 2, "files": files,
                    "counts": {"songs": len(songs), "sections": len(collections["sections"]),
                               "collections": len(collections["collections"]), "legacy_preserved": 1},
                    "coverage": {"discovered_song_site_ids": [549], "excluded_songs": excluded or []}}
        if quality is not None:
            manifest["quality"] = quality
            if "quarantined_songs" in quality:
                manifest["counts"]["quarantined_songs"] = len(quality["quarantined_songs"])
        if coverage:
            manifest["coverage"].update(coverage)
        (self.dist / "manifest.json").write_text(json.dumps(manifest))

    def quarantine(self, reason="no_chords"):
        return {key: copy.deepcopy(self.song[key]) for key in ("id", "source", "artist", "title")} | {"reasons": [reason]}

    def new_song(self, song_id=18, site_id=550):
        song = copy.deepcopy(self.song)
        song["id"] = song_id
        song["source"]["site_id"] = site_id
        song["source"]["url"] = f"https://www.repertuarim.com/akor/new-akor-{site_id}.html"
        return song

    def codes(self):
        return {error["code"] for error in validate_catalog(self.dist, self.legacy)["errors"]}

    def test_valid_complete_catalog(self):
        self.write()
        report = validate_catalog(self.dist, self.legacy)
        self.assertTrue(report["valid"], report)

    def test_wrong_ids_and_broken_reference_are_detected(self):
        self.song["id"] = 18
        self.write()
        self.assertTrue({"legacy_id_not_preserved", "unresolved_song_reference"} <= self.codes())

    def test_invalid_alignment_and_chord_index_are_detected(self):
        self.song["blocks"][0]["chords"][1]["column"] = -1
        self.song["chords"] = ["Am"]
        self.write()
        self.assertTrue({"invalid_chord_column", "derived_chords_mismatch"} <= self.codes())

    def test_file_corruption_is_detected(self):
        self.write()
        with (self.dist / "songs.jsonl").open("a") as stream:
            stream.write("{broken}\n")
        self.assertTrue({"invalid_song_json", "file_digest_mismatch"} <= self.codes())

    def test_exclusion_cannot_hide_missing_song(self):
        self.write(songs=[], excluded=[{"site_id": 549, "reason": "http_404"}])
        self.assertTrue({"excluded_song", "legacy_id_not_preserved"} <= self.codes())

    def test_unresolved_collection_and_wrong_order_are_detected(self):
        self.section["items"] = [{"kind": "artist", "title": "Example",
                                  "url": "https://www.repertuarim.com/akor-tab/example/",
                                  "collection_id": "artist:missing", "position": 2}]
        self.write()
        self.assertTrue({"unresolved_collection_reference", "collection_position_mismatch"} <= self.codes())

    def test_duplicate_source_and_raw_html_are_detected(self):
        duplicate = copy.deepcopy(self.song)
        duplicate["id"] = 18
        duplicate["blocks"][0]["text"] = "<span>Unclean text</span>"
        self.write(songs=[self.song, duplicate])
        self.assertTrue({"duplicate_source_id", "invalid_block_text"} <= self.codes())

    def test_quarantine_preserves_legacy_id_without_entering_active_catalog(self):
        self.section["items"][0]["song_id"] = 18
        self.write(songs=[self.new_song()], quality={"quarantined_songs": [self.quarantine()]},
                   coverage={"discovered_song_site_ids": [549, 550]})
        report = validate_catalog(self.dist, self.legacy)
        self.assertTrue(report["valid"], report)
        self.assertEqual(report["counts"]["legacy_preserved"], 1)
        self.assertEqual(report["counts"]["quarantined_songs"], 1)

    def test_quarantined_song_cannot_be_referenced_by_collection(self):
        self.write(songs=[self.new_song()], quality={"quarantined_songs": [self.quarantine()]},
                   coverage={"discovered_song_site_ids": [549, 550]})
        self.assertIn("unresolved_song_reference", self.codes())

    def test_quarantine_and_active_pools_must_be_disjoint(self):
        self.write(quality={"quarantined_songs": [self.quarantine()]})
        self.assertTrue({"quarantined_song_is_active", "quarantined_source_is_active"} <= self.codes())

    def test_http_failure_cannot_be_masked_as_quarantine(self):
        self.section["items"][0]["song_id"] = 18
        self.write(songs=[self.new_song()], quality={"quarantined_songs": [self.quarantine("http_500")]},
                   coverage={"discovered_song_site_ids": [549, 550]})
        self.assertIn("invalid_quarantine_reasons", self.codes())
        quarantine = self.quarantine()
        quarantine["http_status"] = 500
        self.write(songs=[self.new_song()], quality={"quarantined_songs": [quarantine]},
                   coverage={"discovered_song_site_ids": [549, 550]})
        self.assertIn("quarantine_acquisition_failure", self.codes())

    def test_quarantine_metadata_and_count_are_verified(self):
        self.section["items"][0]["song_id"] = 18
        quarantine = self.quarantine()
        quarantine["source"]["html_sha256"] = "invalid"
        self.write(songs=[self.new_song()], quality={"quarantined_songs": [quarantine]},
                   coverage={"discovered_song_site_ids": [549, 550]})
        manifest_path = self.dist / "manifest.json"
        manifest = json.loads(manifest_path.read_text())
        del manifest["counts"]["quarantined_songs"]
        manifest_path.write_text(json.dumps(manifest))
        self.assertTrue({"invalid_source_hash", "manifest_count_mismatch"} <= self.codes())

    def test_filtered_collections_keep_original_rank_and_count(self):
        self.section["items"] = [
            {"kind": "song", "song_id": 18, "position": 1, "source_position": 2},
            {"kind": "song", "song_id": 19, "position": 2, "source_position": 4},
        ]
        self.section["filtered_item_count"] = 2
        self.section["source_item_count"] = 4
        self.write(songs=[self.new_song(), self.new_song(19, 551)],
                   quality={"quarantined_songs": [self.quarantine()]},
                   coverage={"discovered_song_site_ids": [549, 550, 551]})
        report = validate_catalog(self.dist, self.legacy)
        self.assertTrue(report["valid"], report)
        self.section["items"][1]["source_position"] = 1
        self.section["filtered_item_count"] = 1
        self.write(songs=[self.new_song(), self.new_song(19, 551)],
                   quality={"quarantined_songs": [self.quarantine()]},
                   coverage={"discovered_song_site_ids": [549, 550, 551]})
        self.assertTrue({"invalid_source_position", "collection_source_count_mismatch"} <= self.codes())

    def test_listing_coverage_accounts_for_active_source_empty_and_quality_empty(self):
        artist_url = self.song["source"]["artist_url"]
        empty_url = "https://www.repertuarim.com/akor-tab/source-empty/"
        filtered_url = "https://www.repertuarim.com/repertuar/23/quality-empty.html"
        collection = copy.deepcopy(self.section)
        collection["id"] = "artist:example:contents"
        collection["source_url"] = artist_url
        document = {"schema_version": 2, "sections": [], "collections": [collection]}
        quality = {"empty_collections": [{"id": "repertoire:23:contents", "source_url": filtered_url,
                                           "reason": "no_eligible_items"}]}
        coverage = {"selected_listing_urls": [artist_url, empty_url, filtered_url],
                    "empty_listing_urls": [empty_url]}
        self.write(collections=document, quality=quality, coverage=coverage)
        report = validate_catalog(self.dist, self.legacy)
        self.assertTrue(report["valid"], report)
        coverage["selected_listing_urls"].append("https://www.repertuarim.com/akor-tab/unaccounted/")
        coverage["empty_listing_urls"].append(artist_url)
        self.write(collections=document, quality=quality, coverage=coverage)
        self.assertTrue({"listing_coverage_mismatch", "overlapping_listing_coverage"} <= self.codes())


if __name__ == "__main__":
    unittest.main()
