"""Objective music-data eligibility checks for parsed catalog records.

This module does not rate musical taste or infer missing chords. It does not
inspect network status. Rejected IDs remain in the export's quarantine metadata.
"""

import re

from song_parser import _ANNOTATION, _CHORD, _SECTION, _chord_line


REJECTION_REASONS = frozenset({
    "no_chords", "no_lyrics", "unparsed_chord_notation",
    "invalid_chord_position", "invalid_chord_name", "chord_index_mismatch",
})

_TAB_LINE = re.compile(r"^[eEABGD]?\s*\|[\d\s|./\\hHpPbBrRxX()~^v\-]+$")


def _has_lyrics(text):
    if not isinstance(text, str) or not any(char.isalpha() for char in text):
        return False
    text = text.strip()
    if _SECTION.fullmatch(text) or _TAB_LINE.fullmatch(text):
        return False
    if _chord_line(text) is not None:
        return False
    # A repetition mark such as x2 or a section label alone is not a lyric.
    return any(char.isalpha() for char in _ANNOTATION.sub("", text))


def assess_song(song):
    """Return {eligible, reasons, warnings} without changing the input record.

    Column offsets may extend beyond lyric length: this is normal for chord
    changes after a sung phrase. Only malformed positions/order/overlap fail.
    One-chord songs, repeated verses and unaccompanied lyric lines are valid.
    """
    reasons = []

    def reject(reason):
        if reason not in reasons:
            reasons.append(reason)

    source_warnings = song.get("quality", {}).get("warnings", [])
    warnings = [warning for warning in source_warnings
                if warning not in ("unparsed_chord_notation", "no_chords_detected")]
    if "unparsed_chord_notation" in source_warnings:
        reject("unparsed_chord_notation")

    encountered = []
    has_lyrics = False
    for block in song.get("blocks", []):
        if block.get("type") != "line":
            continue
        has_lyrics |= _has_lyrics(block.get("text", ""))
        chord_entries = block.get("chords", [])
        if not isinstance(chord_entries, list):
            reject("invalid_chord_position")
            continue
        previous_end = 0
        for chord in chord_entries:
            if not isinstance(chord, dict):
                reject("invalid_chord_name")
                continue
            name = chord.get("name")
            valid_name = isinstance(name, str) and bool(_CHORD.fullmatch(name))
            if not valid_name:
                reject("invalid_chord_name")
            else:
                if name not in encountered:
                    encountered.append(name)
            column = chord.get("column")
            if type(column) is not int or column < 0:
                reject("invalid_chord_position")
            elif column < previous_end:
                reject("invalid_chord_position")
            elif valid_name:
                previous_end = column + len(name)

    if not encountered:
        reject("no_chords")
    if not has_lyrics:
        reject("no_lyrics")
    if song.get("chords") != encountered:
        reject("chord_index_mismatch")

    music = song.get("music", {})
    if not music.get("original_key"):
        warnings.append("missing_original_key")
    if music.get("capo") is None:
        warnings.append("missing_capo")
    if not music.get("rhythms"):
        warnings.append("missing_rhythm")
    return {
        "eligible": not reasons,
        "reasons": reasons,
        "warnings": list(dict.fromkeys(warnings)),
    }
