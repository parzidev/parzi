import unittest
from pathlib import Path
import gzip
import sqlite3

from lxml import html

from discovery import canonical_url, extract_collections, extract_links, extract_sitemap, primary_content_counts, classify_url


class DiscoveryTests(unittest.TestCase):
    def test_named_list_preserves_order_without_icons_or_duplicates(self):
        page = '''<div class="list-main"><div class="list-title"><h1>Popüler Akorlar</h1></div>
        <div class="list-list list-open"><ul>
        <li><a href="http://www.repertuarim.com/akor/test-1.html"><div class="icon">A</div><div class="title">B - İki</div></a></li>
        <li><a href="/akor/test-2.html"><div class="title">A - Bir</div></a></li>
        <li><a href="/akor/test-1.html"><div class="title">B - İki</div></a></li>
        </ul></div></div><div class="list-main"><div class="list-title">Gece Modu</div></div>'''
        collections = extract_collections(page)
        self.assertEqual(len(collections), 1)
        c = collections[0]
        self.assertEqual(c["id"], "home:populer-akorlar")
        self.assertEqual(c["kind"], "songs")
        self.assertEqual(c["role"], "primary")
        self.assertEqual([i["title"] for i in c["items"]], ["B - İki", "A - Bir"])
        self.assertEqual([i["position"] for i in c["items"]], [1, 2])
        self.assertEqual(c["source_item_count"], 3)
        self.assertEqual(c["duplicates_removed"], 1)

    def test_links_are_classified_and_external_links_ignored(self):
        page = '''<a href="/akor/song-1.html">Song</a><a href="/akor-tab/a/">Artist</a>
        <a href="/repertuar/12/list.html">List</a><a href="https://evil.example/akor/song-2.html">External</a>
        <a href="/akor-tab/a/?page=2">Artist page 2</a><a href="/signup/">Login</a>'''
        links = extract_links(page)
        self.assertEqual(len(links["songs"]), 1)
        self.assertEqual(len(links["artists"]), 1)
        self.assertEqual(len(links["repertoires"]), 1)
        self.assertEqual(links["pages"], [{"url": "https://www.repertuarim.com/akor-tab/a/?page=2", "title": "Artist page 2"}])

    def test_xml_namespaces_and_http_normalization(self):
        index = '''<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <sitemap><loc>http://www.repertuarim.com/maps/song.xml</loc></sitemap></sitemapindex>'''
        self.assertEqual(extract_sitemap(index), {"sitemaps": ["https://www.repertuarim.com/maps/song.xml"], "urls": []})
        urls = '<urlset><url><loc>http://repertuarim.com/akor/a-1.html</loc></url><url><loc>https://www.repertuarim.com/akor/a-1.html</loc></url></urlset>'
        self.assertEqual(extract_sitemap(urls)["urls"], ["https://www.repertuarim.com/akor/a-1.html"])

    def test_normalization_does_not_accept_lookalike_hosts(self):
        self.assertIsNone(canonical_url("https://www.repertuarim.com.evil.example/akor/a-1.html"))
        self.assertIsNone(canonical_url("javascript:alert(1)"))
        self.assertEqual(canonical_url("/akor/a-1.html#chords"), "https://www.repertuarim.com/akor/a-1.html")

    def test_broken_source_link_is_not_a_song(self):
        links=extract_links('<a href="/akor/--akor-.html">Broken source</a>')
        self.assertEqual(links['songs'],[])

    def test_duplicate_removal_keeps_original_source_rank(self):
        page='<div class="list-title">Liste</div><div class="list-list"><a href="/akor/a-1.html">A</a><a href="/akor/a-1.html">A</a><a href="/akor/b-2.html">B</a></div>'
        items=extract_collections(page)[0]['items']
        self.assertEqual([i['position'] for i in items],[1,2])
        self.assertEqual([i['source_position'] for i in items],[1,3])

    def test_live_home_snapshot_collections(self):
        path = Path(__file__).parent / "cache/home.html"
        if not path.exists():
            self.skipTest("Live snapshot not available")
        lists = extract_collections(path.read_text())
        by_title = {c["title"]: c for c in lists}
        self.assertEqual(len(lists), 8)
        self.assertEqual(len(by_title["Popüler Akorlar"]["items"]), 36)
        self.assertEqual(len(by_title["Yeni Akorlar"]["items"]), 40)
        self.assertEqual(by_title["Popüler Sanatçılar"]["kind"], "artists")
        self.assertEqual(by_title["Popüler Repertuarlar"]["kind"], "repertoires")
        self.assertEqual(by_title["Yeni Ritim Eklenenler"]["duplicates_removed"], 2)
        self.assertTrue(all(c["role"] == "primary" for c in lists))

    def test_repertoire_primary_list_is_not_lost(self):
        page = '''<div class="page-title"><h1>Kolay Akorlar</h1></div>
        <div class="list-main"><div class="list-list list-open"><ul class="r-content-list">
        <li><a href="/akor/a-3.html"><div class="title">A - Üç</div></a></li></ul></div></div>'''
        lists = extract_collections(page, "https://www.repertuarim.com/repertuar/1/kolay.html")
        self.assertEqual(lists[0]["id"], "repertoire:1:contents")
        self.assertEqual(lists[0]["title"], "Kolay Akorlar")
        self.assertEqual(lists[0]["role"], "primary")
        self.assertEqual(lists[0]["items"][0]["title"], "A - Üç")

    def test_live_repertoire_snapshot(self):
        path = Path(__file__).parent / "cache/repertoire_sample.html"
        if not path.exists():
            self.skipTest("Live snapshot not available")
        lists = extract_collections(path.read_text(), "https://www.repertuarim.com/repertuar/1/kolay.html")
        self.assertEqual(lists[0]["id"], "repertoire:1:contents")
        self.assertEqual(len(lists[0]["items"]), 58)
        self.assertTrue(all(c["role"] == "related" for c in lists[1:]))

    def test_artist_related_lists_have_separate_roles(self):
        page = '''<div class="list-main"><div class="list-title"><h1>Duman akorları</h1></div>
        <div class="list-list"><a href="/akor/a-1.html"><div class="title">Duman - Bir</div></a></div></div>
        <div class="list-main"><div class="list-title"><h2>Benzer Sanatçılar</h2></div>
        <div class="list-list"><a href="/akor-tab/a/"><div class="title">A</div></a></div></div>'''
        lists = extract_collections(page, "https://www.repertuarim.com/akor-tab/duman/")
        self.assertEqual([c["role"] for c in lists], ["primary", "related"])

    def test_search_primary_results_exclude_popular_suggestions(self):
        page = '''<div class="page page-search">
        <div class="page-header"><div class="page-title"><h1>"dktt" <span>için sonuçlar:</span></h1></div></div>
        <div class="list-list list-open no-split"><ul>
        <li><a href="/akor-tab/dolu-kadehi-ters-tut/"><div class="title">Dolu Kadehi Ters Tut</div></a></li>
        <li><a href="/akor/dedikodu-4219.html"><div class="title">Resul Dindar - Dedikodu</div></a></li>
        </ul></div>
        <div class="search-suggest-list-main"><div class="search-suggest-list-title"><h2>Popüler Aramalar</h2></div>
        <ul class="search-suggest-list chord"><li><a href="/akor/irrelevant-3257.html"><div class="title">Önerilen şarkı</div></a></li></ul>
        </div></div>'''
        url = "https://www.repertuarim.com/ara/dktt/"
        lists = extract_collections(page, url)
        self.assertEqual(len(lists), 1)
        self.assertEqual(lists[0]["id"], "page:ara-dktt:contents")
        self.assertEqual(lists[0]["title"], '"dktt" için sonuçlar:')
        self.assertEqual(lists[0]["role"], "primary")
        self.assertEqual(lists[0]["kind"], "mixed")
        self.assertEqual([item["kind"] for item in lists[0]["items"]], ["artist", "song"])
        self.assertEqual(primary_content_counts(page, url), {"songs": 1, "artists": 1, "repertoires": 0})

    def test_empty_search_does_not_export_suggestions_as_results(self):
        page = '''<div class="page page-search"><div class="page-header"><div class="page-title"><h1>Bulunamadı</h1></div></div>
        <div class="list-list list-open no-split"><div class="warning">Sonuç yok</div></div>
        <div class="search-suggest-list-main"><ul><li><a href="/akor/popular-3257.html">Popüler şarkı</a></li></ul></div></div>'''
        url = "https://www.repertuarim.com/ara/olmayan/"
        self.assertEqual(extract_collections(page, url), [])
        self.assertEqual(primary_content_counts(page, url), {"songs": 0, "artists": 0, "repertoires": 0})

    def test_actual_cached_search_pages_match_only_direct_results(self):
        root = Path(__file__).parent
        db_path = root / "state/crawl.sqlite3"
        if not db_path.exists():
            self.skipTest("Live crawl cache not available")
        with sqlite3.connect(db_path.as_uri() + "?mode=ro", uri=True) as db:
            rows = db.execute("SELECT url,cache_file FROM pages WHERE url LIKE '%/ara/%' AND status=200 AND cache_file IS NOT NULL").fetchall()
        if not rows:
            self.skipTest("Search snapshots not available")
        tested = 0
        for url, cache_file in rows:
            path = Path(cache_file)
            path = path if path.is_absolute() else root / path
            if not path.exists():
                continue
            with gzip.open(path, "rt", encoding="utf-8") as source:
                text = source.read()
            document = html.fromstring(text)
            actual = document.xpath('//*[contains(concat(" ",normalize-space(@class)," ")," page-search ")]/div[contains(concat(" ",normalize-space(@class)," ")," list-list ")]//a[@href]')
            expected = {"songs": set(), "artists": set(), "repertoires": set()}
            groups = {"song": "songs", "artist": "artists", "repertoire": "repertoires"}
            for anchor in actual:
                href = canonical_url(anchor.get("href"), url)
                kind = classify_url(href) if href else None
                if kind:
                    expected[groups[kind]].add(href)
            self.assertEqual(primary_content_counts(text, url), {key: len(values) for key, values in expected.items()}, url)
            if url == "https://www.repertuarim.com/ara/dktt/":
                self.assertEqual(primary_content_counts(text, url)["songs"], 1)
                self.assertEqual(primary_content_counts(text, url)["artists"], 1)
            tested += 1
        self.assertGreater(tested, 0)


if __name__ == "__main__":
    unittest.main()
