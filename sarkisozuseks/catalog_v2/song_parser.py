"""Parse a public Repertuarım chord page into one lossless display representation.

No network or filesystem access is performed by parse_song. Chord columns are
zero-based Unicode character offsets, after tab expansion to four columns.
"""

import hashlib
import re
from urllib.parse import urljoin, urlparse

from lxml import etree, html


_CLASS = "contains(concat(' ', normalize-space(@class), ' '), ' %s ')"
_ROOT = r"[A-G](?:[#b♯♭])?"
_SUFFIX = r"(?:(?:m/maj|mmaj|mMaj|mM|maj|min|dim|aug|sus|add|m|M|ø|°|\+|-)?\d*(?:/\d+|sus\d*|add\d*|[#b+\-]\d+|\((?:add|sus|maj|[#b+\-])?\d+\))*)"
_CHORD = re.compile(_ROOT + _SUFFIX + r"(?:/" + _ROOT + r")?")
_KEY = re.compile(r"^[A-G](?:[#b♯♭])?(?:m|maj|min)?$")
_SECTION = re.compile(
    r"^(?:\[?\(?(?:intro|int[oö]ro|giri[sş]|nakarat|k[iı]ta|verse|chorus|"
    r"pre[- ]?chorus|bridge|k[oö]pr[uü]|solo|"
    r"ara(?: na[gğ]me)?(?=\s*(?:(?:[12]|x\s*2)\s*)?(?:[:)\]}]|$))|outro|final|"
    r"ritim|arpej|riff|instrumental|enstr[uü]mantal|tekrar)\b.*|.*:)\s*$",
    re.IGNORECASE,
)
_ANNOTATION = re.compile(
    r"\b(?:intro|int[oö]ro|solo|nakarat|riff|ara|giri[sş]|outro|final|"
    r"chorus|verse|bridge|kere|kez|tekrar)\b|(?:[xX×]\s*\d+|\d+\s*[xX×])",
    re.IGNORECASE,
)


def _text(element):
    return " ".join(element.text_content().split()) if element is not None else ""


def _first(elements):
    return elements[0] if elements else None


def _key(value):
    value = (value or "").strip().replace("♯", "#").replace("♭", "b")
    return value if _KEY.fullmatch(value) else None


def _pre_text(pre):
    pieces = []

    def walk(element):
        if element.text:
            pieces.append(element.text)
        for child in element:
            if child.tag == "br":
                pieces.append("\n")
            elif child.tag not in ("script", "style"):
                walk(child)
            tail = child.tail or ""
            # The source uses <br />\r\n. The physical newline formats the HTML;
            # it must not become a second empty display line.
            if child.tag == "br":
                tail = re.sub(r"^\r?\n", "", tail, count=1)
            pieces.append(tail)

    walk(pre)
    return "".join(pieces).replace("\r\n", "\n").replace("\r", "\n").replace("\xa0", " ").expandtabs(4)


def _chord_line(line):
    """Return chord positions only when all remaining text is notation.

    This also handles accidentally concatenated source chords (D#mG#m). A
    partial match inside a normal word leaves letters behind and is rejected.
    """
    matches = list(_CHORD.finditer(line))
    if not matches:
        return None
    residual = list(line)
    for match in matches:
        residual[match.start():match.end()] = " " * (match.end() - match.start())
    leftover = "".join(residual)
    stripped = _ANNOTATION.sub("", leftover)
    if re.sub(r"[\s\d|:;,.()\[\]{}/*+\-=–—~><]+", "", stripped):
        return None
    # Reject root matches inside section words: for example the B in Bridge.
    previous_end = None
    for match in matches:
        if match.start() and line[match.start() - 1].islower() and previous_end != match.start():
            return None
        if match.end() < len(line) and line[match.end()].islower():
            return None
        previous_end = match.end()
    chords = [{"name": m.group().replace("♯", "#").replace("♭", "b"), "column": m.start()} for m in matches]
    annotation = " ".join(leftover.split()).strip(" |")
    return chords, annotation


def _blocks(pre, warnings=None):
    blocks = []
    pending = None

    def flush():
        nonlocal pending
        if pending is not None:
            blocks.append(pending)
            pending = None

    for line in _pre_text(pre).split("\n"):
        line = line.rstrip()
        if not line.strip():
            flush()
            if blocks and blocks[-1]["type"] != "spacer":
                blocks.append({"type": "spacer"})
            continue
        parsed = _chord_line(line)
        if parsed:
            flush()
            chords, annotation = parsed
            pending = {"type": "line", "text": "", "chords": chords}
            if annotation:
                pending["annotation"] = annotation
        elif _SECTION.fullmatch(line.strip()):
            flush()
            blocks.append({"type": "section", "text": line.strip()})
        else:
            tokens = [word.strip("[]()|:,;") for word in line.split()]
            known = [token for token in tokens if _CHORD.fullmatch(token)]
            unknown = [token for token in tokens if not _CHORD.fullmatch(token)]
            # Bare A/B/C letters also occur in real lyrics. Require evidence
            # of musical notation beyond those letters before flagging an
            # unresolved mixed/malformed chord line for quarantine.
            has_notation = any(not re.fullmatch(r"[A-G]", token) for token in known)
            has_notation |= any(re.search(r"[#/\d]", token) for token in unknown)
            if warnings is not None and len(known) >= 2 and len(known) / len(tokens) >= 0.5 and has_notation:
                if "unparsed_chord_notation" not in warnings:
                    warnings.append("unparsed_chord_notation")
            if pending is not None:
                pending["text"] = line
                flush()
            else:
                blocks.append({"type": "line", "text": line, "chords": []})
    flush()
    if blocks and blocks[-1]["type"] == "spacer":
        blocks.pop()
    return blocks


def parse_song(html_text, url, song_id, fetched_at):
    """Return a clean song record, or raise ValueError for a non-song page."""
    try:
        doc = html.fromstring(html_text)
    except (ValueError, TypeError, etree.ParserError) as exc:
        raise ValueError("invalid_html") from exc
    page = _first(doc.xpath("//div[@page-type='chord' and @page-id]"))
    pre = _first(doc.xpath("//pre[" + (_CLASS % "chords") + "]"))
    if page is None or pre is None:
        raise ValueError("not_a_chord_page")
    site_id = page.get("page-id")
    if not site_id.isdigit():
        raise ValueError("invalid_source_id")
    site_id = int(site_id)
    url_id = re.search(r"-(\d+)\.html$", urlparse(url).path)
    if url_id and int(url_id.group(1)) != site_id:
        raise ValueError("source_id_mismatch")
    heading = _first(page.xpath(".//h1"))
    artist_link = _first(heading.xpath(".//a[contains(@href, '/akor-tab/')]") if heading is not None else [])
    artist = _text(artist_link)
    heading_text = _text(heading)
    if not artist or not heading_text.startswith(artist):
        raise ValueError("missing_artist_or_title")
    title = re.sub(r"\s*-\s*Akor\s*$", "", heading_text[len(artist):].lstrip(" -")).strip()
    if not title:
        raise ValueError("missing_artist_or_title")
    warnings = []
    options = doc.xpath("//select[@id='select-key']/option")
    original = None
    easy = None
    for option in options:
        label = _text(option)
        if "orjinal" in option.get("title", "").lower() or re.search(r"or[iİı]?jinal\s+ton", label, re.IGNORECASE):
            candidate = re.search(r":\s*(.+)$", label)
            original = _key(candidate.group(1)) if candidate else None
        if "kolay" in option.get("title", "").lower():
            easy = _key(option.get("value"))
    display = _key(pre.get("data-key"))
    if original is None:
        original = display
        if original is not None:
            warnings.append("original_key_from_display_key")
    if original is None:
        warnings.append("missing_original_key")
    if display is None:
        warnings.append("missing_display_key")
    if easy is not None:
        # jquery.transposer.js changes the root and preserves each chord's
        # suffix (d() function). A root-only easy option therefore inherits
        # the display key's major/minor mode, e.g. D#m -> target A means Am.
        # Source: /theme/default/assets/jquery.transposer.js
        mode_key = display or original
        if mode_key is None:
            easy = None
            warnings.append("unknown_easy_key_mode")
        elif not easy.endswith(("m", "min", "maj")) and mode_key.endswith(("m", "min")):
            easy += "m"
    capo_element = _first(doc.xpath("//*[" + (_CLASS % "menu-capo") + "]"))
    capo_text = _text(capo_element)
    capo_match = re.search(r"kapo\s*:\s*(\d+)", capo_text, re.IGNORECASE)
    capo = int(capo_match.group(1)) if capo_match else None
    if capo is None and re.search(r"kapo\s*:\s*[-–—]", capo_text, re.IGNORECASE):
        capo = 0
    if capo is None:
        warnings.append("missing_capo")
    elif not 0 <= capo <= 24:
        warnings.append("capo_out_of_range")
    rhythms = []
    for rhythm in doc.xpath("//*[" + (_CLASS % "menu-rhythm-section") + "]/span"):
        value = _text(rhythm)
        if value and "empty-rhythm" not in rhythm.get("class", "").split() and not re.search(r"henüz|eklenmemiş|girişi", value, re.IGNORECASE):
            if value not in rhythms:
                rhythms.append(value)
    blocks = _blocks(pre, warnings)
    chords = list(dict.fromkeys(chord["name"] for block in blocks for chord in block.get("chords", [])))
    if not chords:
        warnings.append("no_chords_detected")
    return {
        "id": song_id,
        "source": {"site_id": site_id, "url": url, "artist_url": urljoin(url, artist_link.get("href")), "fetched_at": fetched_at, "html_sha256": hashlib.sha256(html_text.encode("utf-8")).hexdigest()},
        "artist": artist,
        "title": title,
        "music": {"original_key": original, "display_key": display, "easy_key": easy, "capo": capo, "rhythms": rhythms},
        "chords": chords,
        "blocks": blocks,
        "quality": {"warnings": warnings},
    }
