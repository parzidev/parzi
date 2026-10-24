"""Public Repertuarım catalog and ordered collection discovery.

Only same-site content URLs are returned. HTTP links from the site's XML maps
are normalized to HTTPS so the crawl has one identity for each page.
"""

from __future__ import annotations

import re
import unicodedata
from urllib.parse import urljoin, urlsplit, urlunsplit

from lxml import etree, html

BASE_URL = "https://www.repertuarim.com/"
SITE_HOSTS = {"www.repertuarim.com", "repertuarim.com"}


def _class(name: str) -> str:
    return 'contains(concat(" ", normalize-space(@class), " "), " ' + name + ' ")'


def _text(node) -> str:
    return " ".join(node.text_content().split())


def canonical_url(value: str, base_url: str = BASE_URL) -> str | None:
    """Return a same-site HTTPS URL without a fragment; preserve page queries."""
    parsed = urlsplit(urljoin(base_url, value.strip()))
    if parsed.scheme not in {"http", "https"} or parsed.hostname not in SITE_HOSTS:
        return None
    path = re.sub(r"/{2,}", "/", parsed.path or "/")
    return urlunsplit(("https", "www.repertuarim.com", path, parsed.query, ""))


def classify_url(url: str) -> str | None:
    path = urlsplit(url).path
    if re.fullmatch(r"/akor/[^/]+-\d+\.html", path):
        return "song"
    if re.fullmatch(r"/akor-tab/[^/]+/?", path):
        return "artist"
    if re.fullmatch(r"/repertuar/\d+/[^/]+\.html", path):
        return "repertoire"
    return None


def _item(anchor, base_url: str) -> dict | None:
    url = canonical_url(anchor.get("href", ""), base_url)
    kind = classify_url(url) if url else None
    if not kind:
        return None
    # Each link has an A/S/R icon sibling. Its letter is UI, not the title.
    title_nodes = anchor.xpath('.//*[' + _class("title") + ']')
    title = _text(title_nodes[0]) if title_nodes else _text(anchor)
    if not title:
        title = " ".join((anchor.get("title") or "").split())
    return {"kind": kind, "url": url, "title": title}


def _slug(text: str) -> str:
    text = text.casefold().replace("ı", "i")
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", text).strip("-") or "list"


def _page_id(url: str) -> str:
    path = urlsplit(url).path
    repertoire = re.search(r"/repertuar/(\d+)/", path)
    if repertoire:
        return "repertoire:" + repertoire.group(1)
    artist = re.search(r"/akor-tab/([^/]+)/?", path)
    if artist:
        return "artist:" + artist.group(1)
    song = re.search(r"/akor/.*-(\d+)\.html", path)
    if song:
        return "song:" + song.group(1)
    return "home" if path == "/" else "page:" + _slug(path)


def extract_collections(html_text: str, url: str = BASE_URL) -> list[dict]:
    """Extract named list containers, preserving title and first-seen order.

    Navigation, feedback and account links are excluded structurally. Search
    results are the page-search container's direct list-list, never the popular
    search suggestions below it. Empty lists are omitted.
    """
    document = html.fromstring(html_text)
    source_url = canonical_url(url) or url
    result = []
    seen_ids = set()
    candidates = []
    # A repertoire's primary list uses a page heading rather than list-title.
    # Keep it separate from its sidebar's recommended repertoire collection.
    primary = document.xpath('//ul[' + _class("r-content-list") + ']')
    heading = document.xpath('//*[' + _class("page-title") + ']//h1')
    if primary and heading:
        candidates.append((_text(heading[0]), primary[0], _page_id(source_url) + ":contents", "primary"))
    # Search pages have no list-title before their actual results. Popular
    # suggestions are nested in search-suggest-list-main, so only accept the
    # search page's direct list-list child rather than all descendant anchors.
    for search_page in document.xpath('//*[' + _class("page-search") + ']'):
        search_headings = search_page.xpath('./*[' + _class("page-header") + ']//*[' + _class("page-title") + ']//h1')
        search_lists = search_page.xpath('./div[' + _class("list-list") + ']')
        if search_headings and search_lists:
            candidates.append((_text(search_headings[0]), search_lists[0], _page_id(source_url) + ":contents", "primary"))
    for title_node in document.xpath('//*[' + _class("list-title") + ']'):
        title = _text(title_node)
        listing = None
        for sibling in title_node.itersiblings():
            if sibling.xpath('self::*[' + _class("list-title") + ']'):
                break
            if sibling.xpath('self::*[' + _class("list-list") + ']'):
                listing = sibling
                break
        if listing is not None:
            role = "primary" if urlsplit(source_url).path == "/" or title_node.xpath('.//h1') else "related"
            candidates.append((title, listing, _page_id(source_url) + ":" + _slug(title), role))
    for title, listing, collection_id, role in candidates:
        if not title:
            continue
        items, seen_urls, source_count = [], set(), 0
        for anchor in listing.xpath('.//a[@href]'):
            item = _item(anchor, source_url)
            if item is None:
                continue
            source_count += 1
            if item["url"] in seen_urls:
                continue
            seen_urls.add(item["url"])
            item["position"] = len(items) + 1
            item["source_position"] = source_count
            items.append(item)
        if not items:
            continue
        # Duplicate responsive representations must not create duplicate lists.
        if collection_id in seen_ids:
            continue
        seen_ids.add(collection_id)
        item_kinds = {item["kind"] for item in items}
        kind = {"song": "songs", "artist": "artists", "repertoire": "repertoires"}.get(
            next(iter(item_kinds)), "mixed"
        ) if len(item_kinds) == 1 else "mixed"
        result.append({
            "id": collection_id,
            "title": title,
            "source_url": source_url,
            "kind": kind,
            "role": role,
            "items": items,
            "source_item_count": source_count,
            "duplicates_removed": source_count - len(items),
        })
    return result


def primary_content_counts(html_text: str, url: str = BASE_URL) -> dict[str, int]:
    """Count unique primary catalog references, including genuinely empty pages.

    Zero counts do not fabricate an empty collection. On search pages these
    counts exclude the separate popular search suggestion lists.
    """
    groups = {"song": "songs", "artist": "artists", "repertoire": "repertoires"}
    urls = {key: set() for key in groups.values()}
    for collection in extract_collections(html_text, url):
        if collection["role"] != "primary":
            continue
        for item in collection["items"]:
            urls[groups[item["kind"]]].add(item["url"])
    return {key: len(values) for key, values in urls.items()}


def extract_links(html_text: str, url: str = BASE_URL) -> dict[str, list[dict]]:
    """Find catalog entities and same-site paginated list links on a page."""
    document = html.fromstring(html_text)
    result = {"songs": [], "artists": [], "repertoires": [], "pages": []}
    seen = set()
    groups = {"song": "songs", "artist": "artists", "repertoire": "repertoires"}
    for anchor in document.xpath('//a[@href]'):
        full_url = canonical_url(anchor.get("href", ""), url)
        if not full_url or full_url in seen:
            continue
        parsed = urlsplit(full_url)
        # Keep pagination as a page traversal, not a new catalog entity.
        if (re.search(r"[?&](?:page|sayfa)=\d+(?:&|$)", full_url)
                or re.search(r"/(?:page|sayfa)/\d+/?$", parsed.path)):
            seen.add(full_url)
            result["pages"].append({"url": full_url, "title": _text(anchor)})
            continue
        item = _item(anchor, url)
        if item is not None:
            key = groups[item.pop("kind")]
            if item["url"] not in seen:
                seen.add(item["url"])
                result[key].append(item)
            continue
    return result


def extract_sitemap(xml_text: str | bytes) -> dict[str, list[str]]:
    """Read an XML sitemap index or URL set without external entity access."""
    raw = xml_text.encode("utf-8") if isinstance(xml_text, str) else xml_text
    parser = etree.XMLParser(resolve_entities=False, no_network=True)
    document = etree.fromstring(raw, parser=parser)
    result = {"sitemaps": [], "urls": []}
    seen = set()
    for element in document.xpath('//*[local-name()="loc"]'):
        url = canonical_url(element.text or "")
        if not url or url in seen:
            continue
        seen.add(url)
        parent_name = etree.QName(element.getparent()).localname
        if parent_name == "sitemap":
            result["sitemaps"].append(url)
        elif parent_name == "url":
            result["urls"].append(url)
    return result
