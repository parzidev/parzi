import json
import requests
from bs4 import BeautifulSoup
import time
import os
import re
from tqdm import tqdm
import sys
import io
from chord_diagram_generator import generate_chord_svg, CHORD_DATABASE

# Windows konsolunda UTF-8 kullanımını zorla
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Konfigürasyon
INPUT_FILE = 'sarki_bilgileri.json'
OUTPUT_FILE = 'detayli_sarki_bilgileri.json'
SVG_DIR = 'svg_diyagramlar'
PROGRESS_FILE = 'scraping_progress.json'
REQUEST_DELAY = 0.5
TEST_MODE = False  # Tüm şarkıları işle
TEST_LIMIT = 3

# SVG klasörünü oluştur
os.makedirs(SVG_DIR, exist_ok=True)

def load_song_urls():
    """sarki_bilgileri.json'dan şarkı listesini yükle"""
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        songs = json.load(f)
    
    if TEST_MODE:
        print(f"⚠️  TEST MODU: Sadece ilk {TEST_LIMIT} şarkı işlenecek")
        return songs[:TEST_LIMIT]
    return songs

def load_progress():
    """İlerleme dosyasını yükle (varsa)"""
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

def save_progress(results):
    """İlerlemeyi kaydet"""
    with open(PROGRESS_FILE, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

def save_final_results(results):
    """Final sonuçları kaydet"""
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\n✓ Tüm veriler kaydedildi: {OUTPUT_FILE}")

def extract_chords_from_lyrics(lyrics_text):
    """Şarkı sözlerinden akorları tespit et"""
    if not lyrics_text:
        return []
    
    # Akor pattern: <span class="c">AKOR</span>
    chord_pattern = r'<span class="c">([^<]+)</span>'
    chords = re.findall(chord_pattern, lyrics_text)
    
    # Benzersiz akorları al
    unique_chords = list(set(chords))
    return unique_chords

def generate_diagrams_for_chords(chords, song_id, song_name):
    """Verilen akorlar için SVG diyagramları üret"""
    svg_files = []
    
    for chord in chords:
        # Sadece veritabanında olan akorlar için diyagram üret
        if chord in CHORD_DATABASE:
            # Dosya adını oluştur
            safe_song_name = re.sub(r'[^\w\s-]', '', song_name).replace(' ', '_').lower()
            safe_chord = re.sub(r'[^\w\s-]', '', chord).replace(' ', '_').lower()
            filename = f"{song_id}_{safe_song_name}_{safe_chord}.svg"
            filepath = os.path.join(SVG_DIR, filename)
            
            # SVG üret ve kaydet
            generate_chord_svg(chord, filepath)
            svg_files.append(filename)
    
    return svg_files

def extract_chords_and_lyrics(soup):
    """Akor ve şarkı sözlerini çek"""
    chords_pre = soup.find('pre', class_='chords')
    if chords_pre:
        # HTML olarak al (akorlar span içinde)
        return str(chords_pre)
    return ""

def extract_rhythm_info(soup):
    """Ritim bilgilerini çek"""
    rhythm_section = soup.find('div', class_='menu-rhythm-section')
    if rhythm_section:
        rhythms = [span.get_text(strip=True) for span in rhythm_section.find_all('span')]
        return [r for r in rhythms if r]  # Boş olanları filtrele
    return []

def extract_transpose_keys(soup):
    """Transpose tuşlarını çek"""
    transpose_section = soup.find('div', class_='menu-transpose-section')
    if transpose_section:
        key_links = transpose_section.find_all('a')
        keys = [link.get('k') for link in key_links if link.get('k')]
        return keys
    return []

def extract_key_info(soup):
    """Ton ve kapo bilgilerini çek"""
    info = {
        'orjinal_ton': '',
        'kapo': '',
        'kayitli_ton': '',
        'kolay_akor_ton': ''
    }
    
    # Select menüden tonları çek
    select_key = soup.find('select', id='select-key')
    if select_key:
        # Orijinal ton
        orjinal_option = select_key.find('option', title='Orjinal ton')
        if orjinal_option:
            text = orjinal_option.get_text(strip=True)
            match = re.search(r'Orjinal Ton:\s*(.+)', text)
            if match:
                info['orjinal_ton'] = match.group(1)
        
        # Kayıtlı ton
        kayitli_option = select_key.find('option', string=lambda s: s and 'Kayıtlı Ton:' in s)
        if kayitli_option:
            text = kayitli_option.get_text(strip=True)
            match = re.search(r'Kayıtlı Ton:\s*(.+)', text)
            if match:
                info['kayitli_ton'] = match.group(1)
        
        # Kolay akor
        kolay_option = select_key.find('option', title='Kolay akor')
        if kolay_option:
            info['kolay_akor_ton'] = kolay_option.get('value', '')
    
    # Kapo
    capo_li = soup.find('li', class_='menu-capo')
    if capo_li:
        span = capo_li.find('span')
        if span:
            text = span.get_text(strip=True)
            match = re.search(r'Kapo:\s*(\d+)', text)
            if match:
                info['kapo'] = match.group(1)
            else:
                # "Kapo: -" gibi durumlarda
                info['kapo'] = '0'
    
    return info

def extract_meta_info(soup):
    """Meta bilgileri çek"""
    meta = {
        'soz': '',
        'muzik': '',
        'duzenleme': '',
        'yapimci_sirket': '',
        'ekleyen': ''
    }
    
    list_main = soup.find('div', class_='list-main type-2')
    if list_main:
        list_items = list_main.find_all('li')
        
        for li in list_items:
            spans = li.find_all('span')
            if len(spans) >= 2:
                key = spans[0].get_text(strip=True).rstrip(':').lower()
                value = spans[1].get_text(strip=True)
                
                if 'söz' in key:
                    meta['soz'] = value
                elif 'müzik' in key:
                    meta['muzik'] = value
                elif 'düzenleme' in key:
                    meta['duzenleme'] = value
                elif 'yapımcı' in key:
                    meta['yapimci_sirket'] = value
                elif 'ekleyen' in key:
                    a_tag = spans[1].find('a')
                    if a_tag:
                        meta['ekleyen'] = a_tag.get_text(strip=True)
    
    return meta

def scrape_song_page(song_data):
    """Tek bir şarkı sayfasını scrape et"""
    url = song_data['url']
    song_id = song_data['id']
    song_name = song_data['sarkiadi']
    
    try:
        # Sayfayı indir
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        # HTML'i parse et
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Verileri çek
        key_info = extract_key_info(soup)
        lyrics_html = extract_chords_and_lyrics(soup)
        
        # Akorları tespit et
        chords_used = extract_chords_from_lyrics(lyrics_html)
        
        # SVG diyagramları üret
        svg_files = generate_diagrams_for_chords(chords_used, song_id, song_name)
        
        # Transpose tuşlarını çek
        transpose_keys = extract_transpose_keys(soup)
        
        result = {
            'id': song_id,
            'sanatci': song_data['sanatci'],
            'sarkiadi': song_name,
            'url': url,
            'orjinal_ton': key_info['orjinal_ton'],
            'kayitli_ton': key_info['kayitli_ton'],
            'kolay_akor_ton': key_info['kolay_akor_ton'],
            'kapo': key_info['kapo'],
            'transpose_tonlari': transpose_keys,
            'kullanilan_akorlar': chords_used,
            'ritimler': extract_rhythm_info(soup),
            'akorlar_ve_sozler': lyrics_html,
            'akor_diyagramlari': svg_files,
            'meta': extract_meta_info(soup),
            'scrape_status': 'success'
        }
        
        return result
        
    except requests.exceptions.RequestException as e:
        print(f"\n✗ Hata (ID: {song_id}): {str(e)}")
        return {
            'id': song_id,
            'sanatci': song_data['sanatci'],
            'sarkiadi': song_name,
            'url': url,
            'scrape_status': 'error',
            'error_message': str(e)
        }
    except Exception as e:
        print(f"\n✗ Beklenmeyen hata (ID: {song_id}): {str(e)}")
        return {
            'id': song_id,
            'sanatci': song_data['sanatci'],
            'sarkiadi': song_name,
            'url': url,
            'scrape_status': 'error',
            'error_message': str(e)
        }

def main():
    """Ana fonksiyon"""
    print("="*60)
    print("Şarkı Verisi Çekme Scripti v2.0")
    print("="*60)
    
    # Şarkı listesini yükle
    print("\n📂 Şarkı listesi yükleniyor...")
    songs = load_song_urls()
    print(f"✓ {len(songs)} şarkı bulundu")
    
    # İlerlemeyi yükle (varsa)
    progress = load_progress()
    processed_ids = {item['id'] for item in progress if 'id' in item}
    
    if processed_ids:
        print(f"✓ {len(processed_ids)} şarkı daha önce işlenmiş, kaldığı yerden devam ediliyor...")
    
    # Her şarkıyı scrape et
    results = progress.copy()
    
    print(f"\n🚀 Scraping başlıyor... (Her istek arası {REQUEST_DELAY}s bekleniyor)")
    print("="*60)
    
    for song in tqdm(songs, desc="İlerleme", unit="şarkı"):
        # Daha önce işlenmişse atla
        if song['id'] in processed_ids:
            continue
        
        # Şarkıyı scrape et
        result = scrape_song_page(song)
        results.append(result)
        
        # Her 10 şarkıda bir ilerlemeyi kaydet
        if len(results) % 10 == 0:
            save_progress(results)
        
        # Rate limiting
        time.sleep(REQUEST_DELAY)
    
    # Final sonuçları kaydet
    save_final_results(results)
    
    # İstatistikler
    success_count = sum(1 for r in results if r.get('scrape_status') == 'success')
    error_count = sum(1 for r in results if r.get('scrape_status') == 'error')
    total_svgs = sum(len(r.get('akor_diyagramlari', [])) for r in results if r.get('scrape_status') == 'success')
    
    print("\n" + "="*60)
    print("İSTATİSTİKLER")
    print("="*60)
    print(f"Toplam şarkı: {len(results)}")
    print(f"✓ Başarılı: {success_count}")
    print(f"✗ Hatalı: {error_count}")
    print(f"🎸 Oluşturulan SVG: {total_svgs}")
    print(f"📁 SVG klasörü: {SVG_DIR}")
    print(f"📄 Çıktı dosyası: {OUTPUT_FILE}")
    
    if TEST_MODE:
        print(f"\n⚠️  TEST MODU AKTİF - Sadece {TEST_LIMIT} şarkı işlendi")
        print("   Tüm şarkıları işlemek için TEST_MODE = False yapın")
    
    print("="*60)

if __name__ == "__main__":
    main()
