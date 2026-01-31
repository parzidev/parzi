import argparse
import json
import shlex
import time
from collections import deque
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

BASE = "https://www.repertuarim.com/"
AJAXR = "https://www.repertuarim.com/theme/default/inc/ajaxr.php"

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36")

HEADERS_GET = {
    "User-Agent": UA,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
    "Connection": "keep-alive",
}

def parse_curl_command(curl_text: str):
    tokens = shlex.split(curl_text.strip(), posix=True)
    if not tokens or tokens[0].lower() != "curl":
        raise ValueError("curl.txt içeriği 'curl ...' ile başlamalı (Copy as cURL (bash)).")

    method = None
    url = None
    headers = {}
    data = None

    i = 0
    while i < len(tokens):
        t = tokens[i]

        if t == "curl":
            i += 1
            continue

        if t in ("-X", "--request"):
            method = tokens[i + 1].upper()
            i += 2
            continue

        if t in ("-H", "--header"):
            h = tokens[i + 1]
            if ":" in h:
                k, v = h.split(":", 1)
                headers[k.strip()] = v.strip()
            i += 2
            continue

        if t in ("--data", "--data-raw", "--data-binary", "--data-ascii", "-d"):
            data = tokens[i + 1]
            i += 2
            continue

        if t.startswith("http://") or t.startswith("https://"):
            url = t
            i += 1
            continue

        i += 1

    if not url:
        raise ValueError("cURL içinden URL bulunamadı.")
    if not method:
        method = "POST" if data is not None else "GET"

    headers.pop("Content-Length", None)
    headers.pop("Host", None)

    # bazı cURL headerları garip olabiliyor, GET için ayrı kullanacağız
    return method, url, headers, data


def save_json(path: Path, items: list[dict]):
    path.write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8")


def load_existing(path: Path):
    if not path.exists():
        return [], set(), 1
    data = json.loads(path.read_text(encoding="utf-8"))
    seen = set()
    max_id = 0
    out = []
    if isinstance(data, list):
        for it in data:
            u = it.get("url")
            if not u:
                continue
            seen.add(u)
            try:
                max_id = max(max_id, int(it.get("id", 0) or 0))
            except Exception:
                pass
            out.append(it)
    return out, seen, max_id + 1


def extract_random_links(html: str):
    soup = BeautifulSoup(html, "html.parser")
    ul = soup.select_one("ul.random-list")
    links = ul.select("li > a[href]") if ul else soup.select("a[href]")

    out = []
    for a in links:
        href = (a.get("href") or "").strip()
        if not href:
            continue
        full_url = href if href.startswith("http") else urljoin(BASE, href)
        if "repertuarim.com/" not in full_url:
            continue

        title_div = a.select_one(".title")
        title = title_div.get_text(strip=True) if title_div else (a.get("title") or a.get_text(" ", strip=True))
        title = (title or "").strip()

        out.append((full_url, title))
    return out


def page_type(url: str) -> str:
    if "/akor/" in url:
        return "akor"
    if "/akor-tab/" in url:
        return "artist"
    if "/repertuar/" in url:
        return "repertuar"
    return "other"


def extract_akor_links_from_page(html: str):
    soup = BeautifulSoup(html, "html.parser")

    # Senin gösterdiğin blok: div.list-list ... içinden akor linkleri
    out = []
    for a in soup.select('div.list-list a[href*="/akor/"]'):
        href = (a.get("href") or "").strip()
        if not href:
            continue
        full = href if href.startswith("http") else urljoin(BASE, href)
        title_div = a.select_one(".title")
        title = title_div.get_text(strip=True) if title_div else (a.get("title") or a.get_text(" ", strip=True))
        title = (title or "").strip()
        if title:
            out.append((full, title))

    # fallback: sayfadaki tüm /akor/ linkleri
    if not out:
        for a in soup.select('a[href*="/akor/"]'):
            href = (a.get("href") or "").strip()
            if not href:
                continue
            full = href if href.startswith("http") else urljoin(BASE, href)
            title = (a.get("title") or a.get_text(" ", strip=True) or "").strip()
            if title:
                out.append((full, title))

    # uniq
    uniq = {}
    for u, t in out:
        uniq[u] = t
    return [(u, uniq[u]) for u in uniq]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--curl-file", default="curl.txt", help="Copy as cURL (bash) çıktısı")
    ap.add_argument("--out", default="akor_urls.json", help="Çıktı JSON")
    ap.add_argument("--interval", type=float, default=1.0, help="Random endpoint basma aralığı (sn)")
    ap.add_argument("--page-delay", type=float, default=0.7, help="Artist/Repertuar sayfası çekme aralığı (sn)")
    ap.add_argument("--limit", type=int, default=0, help="0=sonsuz, yoksa şu kadar akor linkinde dur")
    ap.add_argument("--debug", action="store_true")
    args = ap.parse_args()

    curl_text = Path(args.curl_file).read_text(encoding="utf-8")
    method, url, curl_headers, data = parse_curl_command(curl_text)

    # POST için cURL headerlarını kullan (cookie falan dahil)
    post_headers = dict(curl_headers)
    # GET için normal browser headerları + cookie aynı olsun diye post_headers'taki Cookie'yi al
    get_headers = dict(HEADERS_GET)
    if "Cookie" in post_headers:
        get_headers["Cookie"] = post_headers["Cookie"]

    out_path = Path(args.out)
    saved, seen_akor_urls, next_id = load_existing(out_path)

    # Artist/repertuar sayfalarını tekrar tekrar gezmemek için
    seen_pages = set()

    # kuyruğa atacağımız (url,title) işleri
    queue = deque()

    with requests.Session() as s:
        # session cookie için ana sayfa
        s.get(BASE, headers=get_headers, timeout=25)

        while True:
            # 1) random endpoint’e bas
            r = s.request(method, url, headers=post_headers, data=data, timeout=25)
            if args.debug:
                print("RANDOM STATUS:", r.status_code, "LEN:", len(r.text))
            if r.status_code == 200 and r.text:
                for u, t in extract_random_links(r.text):
                    queue.append((u, t))

            # 2) kuyruktan işler: /akor/ ise kaydet; artist/repertuar ise sayfayı aç -> akorları çıkar
            while queue:
                u, t = queue.popleft()
                typ = page_type(u)

                if typ == "akor":
                    if u in seen_akor_urls:
                        continue
                    seen_akor_urls.add(u)
                    saved.append({"id": next_id, "title": t or "", "url": u})
                    next_id += 1
                    save_json(out_path, saved)
                    print(f"+1 akor | toplam: {len(saved)} | {u}")

                    if args.limit and len(saved) >= args.limit:
                        print("Limit doldu, durduruldu:", args.limit)
                        return

                elif typ in ("artist", "repertuar"):
                    if u in seen_pages:
                        continue
                    seen_pages.add(u)

                    # bu sayfayı çek, içindeki akor linklerini çıkar
                    try:
                        pr = s.get(u, headers=get_headers, timeout=25)
                        if args.debug:
                            print("PAGE", typ, "STATUS:", pr.status_code, "URL:", u, "LEN:", len(pr.text))
                        if pr.status_code == 200 and pr.text:
                            akor_links = extract_akor_links_from_page(pr.text)
                            for ak_u, ak_t in akor_links:
                                # direkt kayda gitsin
                                if ak_u not in seen_akor_urls:
                                    seen_akor_urls.add(ak_u)
                                    saved.append({"id": next_id, "title": ak_t, "url": ak_u})
                                    next_id += 1
                            if akor_links:
                                save_json(out_path, saved)
                                print(f"+{len(akor_links)} akor (sayfadan) | toplam: {len(saved)} | kaynak: {u}")

                                if args.limit and len(saved) >= args.limit:
                                    print("Limit doldu, durduruldu:", args.limit)
                                    return
                    except requests.RequestException:
                        pass

                    time.sleep(args.page_delay)

                else:
                    # başka tip linkleri şimdilik yok say
                    continue

            time.sleep(args.interval)


if __name__ == "__main__":
    main()
