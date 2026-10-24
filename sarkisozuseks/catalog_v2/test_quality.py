import copy
import unittest

from quality import REJECTION_REASONS, assess_song


def song(blocks=None):
    return {
        "id": 1,
        "artist": "Örnek Sanatçı",
        "title": "Örnek Şarkı",
        "music": {"original_key": "Am", "capo": 0, "rhythms": []},
        "blocks": blocks if blocks is not None else [
            {"type": "line", "text": "Örnek şarkı sözü", "chords": [{"name": "Am", "column": 0}]},
        ],
        "chords": ["Am"],
        "quality": {"warnings": []},
    }


class QualityTests(unittest.TestCase):
    def test_one_chord_repeated_lyrics_and_unaccompanied_verse_remain_eligible(self):
        record = song()
        record["blocks"].extend(copy.deepcopy(record["blocks"]))
        record["blocks"].append({"type": "line", "text": "Akorsuz bir söz satırı", "chords": []})
        before = copy.deepcopy(record)
        self.assertTrue(assess_song(record)["eligible"])
        self.assertEqual(record, before)

    def test_missing_optional_music_fields_are_warnings_only(self):
        record = song()
        record["music"] = {"original_key": None, "capo": None, "rhythms": []}
        verdict = assess_song(record)
        self.assertTrue(verdict["eligible"])
        self.assertEqual(set(verdict["warnings"]), {"missing_original_key", "missing_capo", "missing_rhythm"})

    def test_no_chords_is_rejected_even_when_song_level_index_claims_chords(self):
        record = song([{"type": "line", "text": "Örnek şarkı sözü", "chords": []}])
        verdict = assess_song(record)
        self.assertFalse(verdict["eligible"])
        self.assertIn("no_chords", verdict["reasons"])
        self.assertIn("chord_index_mismatch", verdict["reasons"])

    def test_only_section_chords_repeat_marks_or_tab_are_not_lyrics(self):
        record = song([
            {"type": "section", "text": "Intro:"},
            {"type": "line", "text": "", "chords": [{"name": "Am", "column": 0}]},
            {"type": "line", "text": "x2", "chords": []},
            {"type": "line", "text": "e|---0---1---|", "chords": []},
        ])
        self.assertEqual(assess_song(record)["reasons"], ["no_lyrics"])

    def test_unparsed_source_notation_is_quarantined(self):
        record = song()
        record["quality"]["warnings"] = ["unparsed_chord_notation"]
        self.assertEqual(assess_song(record)["reasons"], ["unparsed_chord_notation"])

    def test_column_errors_and_overlaps_fail_but_offsets_beyond_lyrics_are_valid(self):
        for column in [-1, 1.5, True, "0"]:
            with self.subTest(column=column):
                record = song()
                record["blocks"][0]["chords"][0]["column"] = column
                self.assertIn("invalid_chord_position", assess_song(record)["reasons"])
        record = song()
        record["blocks"][0]["chords"] = [{"name": "Am", "column": 0}, {"name": "G", "column": 1}]
        record["chords"] = ["Am", "G"]
        self.assertIn("invalid_chord_position", assess_song(record)["reasons"])
        record["blocks"][0]["chords"][1]["column"] = 120
        self.assertTrue(assess_song(record)["eligible"])

    def test_empty_or_malformed_names_and_index_mismatches_fail(self):
        for name in ["", "  ", None, "Bbn"]:
            with self.subTest(name=name):
                record = song()
                record["blocks"][0]["chords"][0]["name"] = name
                self.assertIn("invalid_chord_name", assess_song(record)["reasons"])
        record = song()
        record["chords"] = ["Am", "G"]
        self.assertIn("chord_index_mismatch", assess_song(record)["reasons"])

    def test_extended_and_slash_chords_remain_eligible(self):
        record = song()
        names = ["F#mmaj7", "C6/9", "Dm/maj7", "Am(add9)", "G/B", "E7-9"]
        record["chords"] = names
        record["blocks"][0]["chords"] = [{"name": name, "column": index * 15} for index, name in enumerate(names)]
        self.assertTrue(assess_song(record)["eligible"])

    def test_reasons_remain_within_contract(self):
        record = song()
        record["blocks"] = []
        record["quality"]["warnings"] = ["unparsed_chord_notation"]
        self.assertTrue(set(assess_song(record)["reasons"]) <= REJECTION_REASONS)


if __name__ == "__main__":
    unittest.main()
