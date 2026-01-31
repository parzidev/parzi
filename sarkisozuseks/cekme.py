import argparse
import json
import time
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

BASE = "https://www.repertuarim.com/"
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36")

HEADERS = {
    "User-Agent": UA,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
    "Connection": "keep-alive",
}


def load_json(path: Path):
    """JSON dosyasını yükle"""
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, items: list[dict]):
    """JSON dosyasını kaydet"""
    path.write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8")


def extract_artist_and_song_from_title(title: str):
    """
    'Arın - Sözün Adı Sen' formatından sanatçı ve şarkı adını çıkar
    """
    # ' - Akor' veya ' - akor' kısmını temizle
    title = title.replace(" - Akor", "").replace(" - akor", "")
    title = title.replace(" - Kolay ve Orjinal Ton", "")
    
    # İlk ' - ' ile ayır
    parts = title.split(" - ", 1)
    if len(parts) == 2:
        artist = parts[0].strip()
        song = parts[1].strip()
        return artist, song
    
    return "", ""


def extract_from_page(url: str, session: requests.Session):
    """
    Sayfadan sanatçı ve şarkı adını çıkar
    """
    try:
        r = session.get(url, headers=HEADERS, timeout=15)
        if r.status_code != 200:
            return None, None
        
        soup = BeautifulSoup(r.text, "html.parser")
        
        # Sayfa başlığından çıkar
        title_tag = soup.find("title")
        if title_tag:
            title = title_tag.get_text(strip=True)
            artist, song = extract_artist_and_song_from_title(title)
            if artist and song:
                return artist, song
        
        # h1 başlığından dene
        h1 = soup.find("h1")
        if h1:
            title = h1.get_text(strip=True)
            artist, song = extract_artist_and_song_from_title(title)
            if artist and song:
                return artist, song
        
        return None, None
    
    except Exception as e:
        print(f"  Hata: {url} - {e}")
        return None, None


def main():
    ap = argparse.ArgumentParser(description="Akor URL'lerinden sanatçı ve şarkı adlarını çıkar")
    ap.add_argument("--input", default="akor_urls.json", help="Giriş JSON dosyası")
    ap.add_argument("--output", default="sarki_bilgileri.json", help="Çıkış JSON dosyası")
    ap.add_argument("--delay", type=float, default=0.5, help="İstekler arası bekleme süresi (saniye)")
    ap.add_argument("--limit", type=int, default=0, help="İşlenecek maksimum kayıt sayısı (0=tümü)")
    args = ap.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)

    # Giriş dosyasını yükle
    input_data = load_json(input_path)
    if not input_data:
        print(f"Hata: {args.input} dosyası boş veya bulunamadı!")
        return

    # Mevcut çıktıyı yükle (varsa devam edebilmek için)
    output_data = load_json(output_path)
    processed_urls = {item["url"] for item in output_data}
    
    next_id = max([item["id"] for item in output_data], default=0) + 1

    print(f"Toplam {len(input_data)} kayıt bulundu")
    print(f"Daha önce işlenmiş: {len(processed_urls)} kayıt")
    print(f"İşlenecek: {len(input_data) - len(processed_urls)} kayıt\n")

    with requests.Session() as session:
        # Ana sayfaya bir istek at (cookie için)
        session.get(BASE, headers=HEADERS, timeout=15)

        for idx, item in enumerate(input_data, 1):
            url = item.get("url")
            title = item.get("title", "")
            
            if not url:
                continue
            
            # Daha önce işlenmişse atla
            if url in processed_urls:
                continue
            
            # Limit kontrolü
            if args.limit and len(output_data) >= args.limit:
                print(f"\nLimit ({args.limit}) doldu, durduruluyor...")
                break

            print(f"[{idx}/{len(input_data)}] İşleniyor: {url}")

            # Önce title'dan çıkarmayı dene
            artist, song = extract_artist_and_song_from_title(title)
            
            # Başarısızsa sayfayı çek
            if not artist or not song:
                print(f"  Title'dan çıkarılamadı, sayfa çekiliyor...")
                artist, song = extract_from_page(url, session)
            
            if artist and song:
                output_data.append({
                    "id": next_id,
                    "sanatci": artist,
                    "url": url,
                    "sarkiadi": song
                })
                next_id += 1
                processed_urls.add(url)
                print(f"  + {artist} - {song}")
                
                # Her 10 kayıtta bir kaydet
                if len(output_data) % 10 == 0:
                    save_json(output_path, output_data)
            else:
                print(f"  - Bilgi cikarilmadi")

            # Bekleme
            time.sleep(args.delay)

    # Son durumu kaydet
    save_json(output_path, output_data)
    print(f"\nTamamlandi! {len(output_data)} kayit {args.output} dosyasina yazildi.")


if __name__ == "__main__":
    main()
