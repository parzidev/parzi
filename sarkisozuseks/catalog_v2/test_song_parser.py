import unittest
from pathlib import Path

from song_parser import parse_song


def fixture(pre, menu="", original=""):
    return f'''<html><div class="page page-akor-detail" page-id="7" page-type="chord">
    <h1><a href="/akor-tab/ornek/">Örnek Sanatçı</a> - Örnek Şarkı - Akor</h1>
    <select id="select-key">{original}</select>{menu}<pre class="chords" data-key="Am">{pre}</pre></div></html>'''


def parse(content):
    return parse_song(content, "https://www.repertuarim.com/akor/ornek-7.html", 99, "2026-10-24T00:00:00Z")


class SongParserTests(unittest.TestCase):
    def test_columns_pairs_html_entities_and_concatenated_chords(self):
        song = parse(fixture('  D#mG#m       A#/C#<br/>\r\n  Örnek &amp; söz<br/>\r\n<br/>\r\nF#sus4 Bbmaj7 C7b9<br/>Son satır'))
        self.assertEqual(song["blocks"][0], {"type": "line", "text": "  Örnek & söz", "chords": [{"name": "D#m", "column": 2}, {"name": "G#m", "column": 5}, {"name": "A#/C#", "column": 15}]})
        self.assertEqual(song["blocks"][1], {"type": "spacer"})
        self.assertEqual(song["chords"], ["D#m", "G#m", "A#/C#", "F#sus4", "Bbmaj7", "C7b9"])

    def test_lyrics_words_are_not_chords(self):
        song = parse(fixture('Bir gün gelir<br/>Aman bugün olmasın<br/>Intro:<br/>Am<br/>Örnek söz'))
        self.assertEqual(song["blocks"][0]["chords"], [])
        self.assertEqual(song["blocks"][1]["chords"], [])
        self.assertEqual(song["blocks"][2], {"type": "section", "text": "Intro:"})
        self.assertEqual(song["chords"], ["Am"])

    def test_original_fallback_unknown_capo_and_placeholder_rhythm(self):
        song = parse(fixture('Am<br/>Örnek söz', '<div class="menu-rhythm-section"><span class="empty-rhythm">Henüz Ritim / Arpej bilgisi eklenmemiş.</span></div>'))
        self.assertEqual(song["music"]["original_key"], "Am")
        self.assertIsNone(song["music"]["capo"])
        self.assertEqual(song["music"]["rhythms"], [])
        self.assertIn("original_key_from_display_key", song["quality"]["warnings"])

    def test_explicit_capo_and_original_are_preserved(self):
        song = parse(fixture('Am<br/>Örnek söz', '<li class="menu-capo"><span class="icon"></span><span>Kapo: 3</span></li><div class="menu-rhythm-section"><span>Ayy Ay</span></div>', '<option value="C" title="Orjinal ton">Orjinal Ton: Cm</option>'))
        self.assertEqual(song["music"]["capo"], 3)
        self.assertEqual(song["music"]["original_key"], "Cm")
        self.assertEqual(song["music"]["display_key"], "Am")
        self.assertEqual(song["music"]["rhythms"], ["Ayy Ay"])
        self.assertEqual(song["source"]["artist_url"], "https://www.repertuarim.com/akor-tab/ornek/")

    def test_minor_major_chord_and_source_typo_are_not_silently_rewritten(self):
        song = parse(fixture('F#m F#mmaj7 B7 E<br/>Örnek söz<br/>Bbm Ab Bbn F<br/>İkinci satır'))
        self.assertIn("F#mmaj7", song["chords"])
        self.assertIn("unparsed_chord_notation", song["quality"]["warnings"])
        self.assertTrue(any("Bbn" in b.get("text", "") for b in song["blocks"]))

    def test_ordinary_lyrics_with_note_letters_do_not_get_quarantined(self):
        song = parse(fixture('Am<br/>Örnek bir şarkı<br/>Harfleri oku A, B, C'))
        self.assertNotIn("unparsed_chord_notation", song["quality"]["warnings"])
        self.assertEqual(song["blocks"][-1]["text"], "Harfleri oku A, B, C")

    def test_ara_lyrics_remain_lines_and_ara_section_labels_remain_sections(self):
        for text in ["Ara beni bir gün", "Ara bana dönmeden", "Ara sıra söyle"]:
            with self.subTest(lyrics=text):
                song = parse(fixture("Am<br/>" + text))
                self.assertEqual(song["blocks"], [{"type": "line", "text": text, "chords": [{"name": "Am", "column": 0}]}])
        for label in ["Ara", "Ara Nağme", "(Ara)", "[Ara Nağme]", "Ara:", "Ara Nağme:", "Ara 1", "Ara 2", "Ara x2", "(Ara 2)", "[Ara Nağme x2]", "Ara: x2"]:
            with self.subTest(label=label):
                song = parse(fixture(label + "<br/>Am<br/>Örnek söz"))
                self.assertEqual(song["blocks"][0], {"type": "section", "text": label})

    def test_empty_and_chord_only_content_are_returned_for_quality_quarantine(self):
        from quality import assess_song

        empty = parse(fixture(""))
        self.assertEqual(empty["blocks"], [])
        self.assertEqual(empty["chords"], [])
        self.assertEqual(assess_song(empty)["reasons"], ["no_chords", "no_lyrics"])
        chord_only = parse(fixture("Am G/B<br/>Fmaj7"))
        self.assertEqual(chord_only["chords"], ["Am", "G/B", "Fmaj7"])
        self.assertEqual(assess_song(chord_only)["reasons"], ["no_lyrics"])

    def test_source_transposer_chord_extensions_are_preserved(self):
        song = parse(fixture('C6/9 Dm/maj7 E7-9 Am(add9) F7+5<br/>Örnek söz'))
        self.assertEqual(song["chords"], ["C6/9", "Dm/maj7", "E7-9", "Am(add9)", "F7+5"])

    def test_easy_key_preserves_minor_mode_like_source_transposer(self):
        # jquery.transposer.js d(): transpose the root, retain suffix.
        song = parse(fixture('Am<br/>Örnek söz', original='<option value="A" title="Kolay akor">Kolay Akor</option>'))
        self.assertEqual(song["music"]["easy_key"], "Am")
        self.assertNotIn("easy_key_source_root_only", song["quality"]["warnings"])

    def test_wrong_page_and_wrong_id_are_rejected(self):
        with self.assertRaisesRegex(ValueError, "not_a_chord_page"):
            parse("<html><h1>Hata</h1></html>")
        with self.assertRaisesRegex(ValueError, "invalid_html"):
            parse("")
        with self.assertRaisesRegex(ValueError, "source_id_mismatch"):
            parse_song(fixture("Am<br/>Örnek söz"), "https://www.repertuarim.com/akor/ornek-8.html", 99, "now")

    def test_live_cache_pages_parse_without_dropping_failed_old_record(self):
        folder = Path(__file__).parent / "cache"
        for filename, site_id, artist, title in [("song_old.html", 549, "Sertab Erener", "Bir Damla Gözlerimde"), ("song_failed.html", 70, "Melih Görgün", "14 Bahar")]:
            with self.subTest(filename=filename):
                song = parse_song((folder / filename).read_text(), f"https://www.repertuarim.com/akor/test-{site_id}.html", 1, "now")
                self.assertEqual((song["artist"], song["title"]), (artist, title))
                self.assertGreater(len(song["blocks"]), 10)
                self.assertTrue(song["chords"])
                self.assertEqual(song["music"]["capo"], 0)


if __name__ == "__main__":
    unittest.main()
