"""Offline contract tests for cache -> quality filtering -> validated publication."""
from contextlib import redirect_stdout
import gzip
import hashlib
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import build
import crawl
import validate_catalog as validator


class BuildExportTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.output = self.root / "dist"
        self.legacy = self.root / "legacy.json"
        for module in (crawl, build):
            override = patch.object(module, "ROOT", self.root)
            override.start()
            self.addCleanup(override.stop)
        self.real_validate = validator.validate_catalog
        validation = patch.object(validator, "validate_catalog",
                                  side_effect=lambda output: self.real_validate(output, self.legacy))
        validation.start()
        self.addCleanup(validation.stop)
        self.db = crawl.connect()
        self.addCleanup(self.db.close)
        self.good_url = crawl.BASE + "akor/ornek-iyi-7.html"
        self.bad_url = crawl.BASE + "akor/ornek-akorsuz-8.html"
        self.artist_url = crawl.BASE + "akor-tab/ornek/"
        self.stamp = "2026-10-24T01:00:00+03:00"
        self.cache(self.good_url, self.song_html(7, "İyi Örnek", "Am<br/>Örnek söz satırı"))
        self.cache(self.bad_url, self.song_html(8, "Akorsuz Örnek", "Yalnızca örnek söz satırı"))
        items = self.song_item(self.bad_url, "Akorsuz Örnek") + self.song_item(self.good_url, "İyi Örnek")
        self.cache(crawl.BASE, '<html><div class="list-title"><h1>Popüler Akorlar</h1></div>'
                   '<div class="list-list"><ul>' + items + '</ul></div></html>')
        self.cache(self.artist_url, '<html><div class="list-title"><h1>Örnek Sanatçı akorları</h1></div>'
                   '<div class="list-list"><ul>' + items + '</ul></div></html>')
        self.db.executemany("INSERT INTO identities(site_id,song_id,url,title,legacy) VALUES (?,?,?,?,1)",
                            [(7, 101, self.good_url, "İyi Örnek"), (8, 102, self.bad_url, "Akorsuz Örnek")])
        self.db.executemany("INSERT INTO meta(key,value) VALUES (?,?)", [
            ("started_at", self.stamp),
            ("selected_listing_urls", json.dumps([self.artist_url])),
        ])
        self.db.commit()
        self.legacy.write_text(json.dumps([{"id": 101, "url": self.good_url},
                                           {"id": 102, "url": self.bad_url}]), encoding="utf-8")

    @staticmethod
    def song_html(site_id, title, pre):
        return f'''<html><div class="page page-akor-detail" page-id="{site_id}" page-type="chord">
        <h1><a href="/akor-tab/ornek/">Örnek Sanatçı</a> - {title} - Akor</h1>
        <select id="select-key"><option title="Orjinal ton">Orjinal Ton: Am</option></select>
        <li class="menu-capo"><span>Kapo: 0</span></li>
        <pre class="chords" data-key="Am">{pre}</pre></div></html>'''

    @staticmethod
    def song_item(url, title):
        return f'<li><a href="{url}"><div class="title">Örnek Sanatçı - {title}</div></a></li>'

    def cache(self, url, document):
        raw = document.encode("utf-8")
        relative = Path("cache") / (hashlib.sha256(url.encode()).hexdigest() + ".html.gz")
        target = self.root / relative
        target.parent.mkdir(exist_ok=True)
        target.write_bytes(gzip.compress(raw, mtime=0))
        self.db.execute("""INSERT INTO pages(url,kind,status,fetched_at,sha256,cache_file,byte_count,attempts)
            VALUES (?,?,200,?,?,?,?,1)""", (url, crawl.kind_for(url), self.stamp,
                hashlib.sha256(raw).hexdigest(), str(relative), len(raw)))

    def publish(self):
        with redirect_stdout(io.StringIO()):
            build.export(self.db, self.output)

    def test_export_filters_broken_song_but_preserves_id_source_order_and_integrity(self):
        self.publish()
        songs = [json.loads(line) for line in (self.output / "songs.jsonl").read_text().splitlines()]
        collections = json.loads((self.output / "collections.json").read_text())
        manifest = json.loads((self.output / "manifest.json").read_text())
        self.assertEqual([(song["id"], song["source"]["site_id"]) for song in songs], [(101, 7)])
        quarantined = manifest["quality"]["quarantined_songs"]
        self.assertEqual([(song["id"], song["source"]["site_id"], song["reasons"])
                          for song in quarantined], [(102, 8, ["no_chords"])])
        self.assertEqual(manifest["counts"]["legacy_preserved"], 2)
        self.assertEqual(manifest["counts"]["legacy_active"], 1)
        self.assertEqual(manifest["counts"]["legacy_quarantined"], 1)
        self.assertEqual(manifest["coverage"]["excluded_songs"], [])
        for collection in collections["sections"] + collections["collections"]:
            self.assertEqual(collection["source_item_count"], 2)
            self.assertEqual(collection["filtered_item_count"], 1)
            self.assertEqual(collection["items"], [{"kind": "song", "song_id": 101,
                                                     "position": 1, "source_position": 2}])
        self.assertEqual(len(collections["sections"]), 1)
        self.assertEqual(len(collections["collections"]), 1)
        for name in ("songs.jsonl", "collections.json"):
            data = (self.output / name).read_bytes()
            self.assertEqual(manifest["files"][name],
                             {"bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()})
        report = self.real_validate(self.output, self.legacy)
        self.assertTrue(report["valid"], report)

    def test_direct_export_does_not_replace_published_dist_with_invalid_candidate(self):
        self.publish()
        published = {path.name: path.read_bytes() for path in self.output.iterdir()}
        real_extract = build.extract_collections

        def invalid_source_count(document, url):
            collections = real_extract(document, url)
            if url == crawl.BASE:
                collections[0]["source_item_count"] += 1
            return collections

        with patch.object(build, "extract_collections", side_effect=invalid_source_count):
            with self.assertRaisesRegex(RuntimeError, "collection_source_count_mismatch"):
                self.publish()
        self.assertEqual({path.name: path.read_bytes() for path in self.output.iterdir()}, published)
        self.assertFalse(self.output.with_name("dist.previous").exists())


if __name__ == "__main__":
    unittest.main()
