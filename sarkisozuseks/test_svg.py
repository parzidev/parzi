import json
import requests
from bs4 import BeautifulSoup
import os
import re
import sys
import io

# Windows konsolunda UTF-8 kullanımını zorla
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')


# Test için tek bir şarkı çekelim
song_data = {
    'id': 111,
    'sanatci': 'Onur Can  Özcan',
    'sarkiadi': 'Hırka',
    'url': 'https://www.repertuarim.com/akor/onur-can--ozcan-hirka-akor-6147.html'
}

SVG_DIR = 'svg_diyagramlar'
os.makedirs(SVG_DIR, exist_ok=True)

# Sayfayı indir
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
response = requests.get(song_data['url'], headers=headers, timeout=10)
soup = BeautifulSoup(response.content, 'html.parser')

# SVG diyagramlarını bul
diagram_section = soup.find('div', class_='menu-diagram-section')
print(f"Diagram section found: {diagram_section is not None}")

if diagram_section:
    # 'rendered' class içinde SVG'ler olabilir
    rendered_div = diagram_section.find('div', class_='menu-diagram-list rendered')
    if rendered_div:
        svgs = rendered_div.find_all('svg')
        print(f"✓ {len(svgs)} SVG diyagramı bulundu!")
    else:
        print("✗ 'menu-diagram-list rendered' bulunamadı")
        # Alternatif olarak tüm SVG'leri ara
        svgs = diagram_section.find_all('svg')
        print(f"  Alternatif arama: {len(svgs)} SVG bulundu")

    
    for idx, svg in enumerate(svgs):
        # SVG'den akor adını bul
        chord_name = "unknown"
        text_elem = svg.find('text')
        if text_elem and text_elem.find('tspan'):
            chord_name = text_elem.find('tspan').get_text(strip=True)
        
        print(f"  - Akor {idx+1}: {chord_name}")
        
        # Dosya adını oluştur
        safe_song_name = re.sub(r'[^\w\s-]', '', song_data['sarkiadi']).replace(' ', '_').lower()
        safe_chord_name = re.sub(r'[^\w\s-]', '', chord_name).replace(' ', '_').lower()
        filename = f"{song_data['id']}_{safe_song_name}_{safe_chord_name}_{idx}.svg"
        filepath = os.path.join(SVG_DIR, filename)
        
        # SVG içeriğini kaydet
        svg_content = str(svg)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(svg_content)
        
        print(f"    Kaydedildi: {filename}")
else:
    print("✗ SVG diyagramı bulunamadı!")

# Ritim bilgilerini test et
rhythm_section = soup.find('div', class_='menu-rhythm-section')
if rhythm_section:
    rhythms = [span.get_text(strip=True) for span in rhythm_section.find_all('span')]
    print(f"\n✓ {len(rhythms)} ritim bulundu:")
    for r in rhythms:
        print(f"  - {r}")
else:
    print("\n✗ Ritim bilgisi bulunamadı!")

# Ton bilgilerini test et
select_key = soup.find('select', id='select-key')
if select_key:
    orjinal_option = select_key.find('option', title='Orjinal ton')
    if orjinal_option:
        text = orjinal_option.get_text(strip=True)
        match = re.search(r'Orjinal Ton:\s*(.+)', text)
        if match:
            print(f"\n✓ Orijinal Ton: {match.group(1)}")

# Kapo bilgisini test et
capo_li = soup.find('li', class_='menu-capo')
if capo_li:
    span = capo_li.find('span')
    if span:
        text = span.get_text(strip=True)
        match = re.search(r'Kapo:\s*(\d+)', text)
        if match:
            print(f"✓ Kapo: {match.group(1)}")
