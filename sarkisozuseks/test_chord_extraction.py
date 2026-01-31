import json
import sys
import io

# UTF-8 encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Load progress file
with open('scraping_progress.json', 'r', encoding='utf-8') as f:
    songs = json.load(f)

# Test ID 2 (Gökhan Türkmen - İnsanız Ayıbı Yok)
song = songs[1]  # ID 2 is index 1

print(f"🎵 Şarkı: {song['sanatci']} - {song['sarkiadi']}")
print(f"📊 Orijinal Ton: {song['orjinal_ton']}")

# Extract chords using same logic as viewer
def extract_chords(html):
    chords = []
    
    # Clean HTML
    import re
    text = html.replace('<br/>', '\n').replace('<br>', '\n')
    text = re.sub(r'<[^>]+>', '', text)
    text = text.replace('&nbsp;', ' ')
    
    lines = text.split('\n')
    
    for line in lines:
        chord_pattern = r'\b([A-G][#b]?(?:m|maj|min|dim|aug|sus|add)?[0-9]*)\b'
        matches = re.findall(chord_pattern, line)
        
        if matches and len(line.strip().split()) <= 10:
            chords.extend(matches)
    
    unique = sorted(set(chords))
    return [c for c in unique if len(c) > 1 or '#' in c or 'b' in c]

chords = extract_chords(song['akorlar_ve_sozler'])

print(f"\n🎸 Bulunan Akorlar ({len(chords)}):")
print(f"   {', '.join(chords)}\n")

# Check which have SVGs
import os
has_svg = []
no_svg = []

for chord in chords:
    svg_path = f"test_chords/{chord}.svg"
    if os.path.exists(svg_path):
        has_svg.append(chord)
    else:
        no_svg.append(chord)

print(f"✅ SVG Mevcut ({len(has_svg)}):")
print(f"   {', '.join(has_svg) if has_svg else 'Yok'}")

if no_svg:
    print(f"\n⚠️ SVG Yok ({len(no_svg)}):")
    print(f"   {', '.join(no_svg)}")

print(f"\n📈 Başarı Oranı: {len(has_svg)}/{len(chords)} (%{int(len(has_svg)/len(chords)*100) if chords else 0})")
