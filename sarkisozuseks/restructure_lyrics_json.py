import json
import re

def parse_lyrics_html(html_content):
    """HTML şarkı sözlerini parse edip JSON formatına çevir"""
    
    # <pre> etiketlerini kaldır
    content = html_content.replace('<pre class="chords" data-key="', '')
    content = re.sub(r'" id="key">', '', content)
    content = content.replace('</pre>', '')
    
    # Original key'i bul
    key_match = re.search(r'data-key="([^"]+)"', html_content)
    original_key = key_match.group(1) if key_match else None
    
    # <br/> ile satırlara böl
    lines = content.split('<br/>')
    
    # Her satırı işle
    lyrics_lines = []
    all_chords_found = set()
    
    for line in lines:
        # \r\n gibi karakterleri temizle
        line = line.strip()
        if not line:
            lyrics_lines.append({"type": "empty", "content": ""})
            continue
        
        # Akor patternleri bul
        chord_pattern = r'\b([A-G][#b]?(?:m|maj|min|dim|aug|sus|add)?[0-9]*)\b'
        chords_in_line = re.findall(chord_pattern, line)
        
        # Satırdaki kelimeleri analiz et
        words = line.split()
        chord_count = 0
        
        for word in words:
            if re.match(r'^[A-G][#b]?(?:m|maj|min|dim|aug|sus|add)?[0-9]*$', word):
                chord_count += 1
                all_chords_found.add(word)
        
        # Akor satırı mı yoksa şarkı sözü mü?
        chord_ratio = chord_count / len(words) if words else 0
        
        if chord_ratio >= 0.6:
            # Akor satırı
            lyrics_lines.append({
                "type": "chords",
                "content": line,
                "chords": chords_in_line
            })
        else:
            # Şarkı sözü veya başlık
            if line.startswith('Intro:') or line.endswith(':'):
                lyrics_lines.append({
                    "type": "section",
                    "content": line
                })
            else:
                lyrics_lines.append({
                    "type": "lyrics",
                    "content": line
                })
    
    return {
        "original_key": original_key,
        "lines": lyrics_lines,
        "chords_used": sorted(list(all_chords_found))
    }

def restructure_song(song):
    """Bir şarkı objesini yeniden yapılandır"""
    # Meta alanını kaldır
    if 'meta' in song:
        del song['meta']
    
    # akorlar_ve_sozler'i parse et
    if 'akorlar_ve_sozler' in song and song['akorlar_ve_sozler']:
        parsed = parse_lyrics_html(song['akorlar_ve_sozler'])
        
        # HTML içeriğini sil, parsed JSON'u ekle
        del song['akorlar_ve_sozler']
        song['lyrics_data'] = parsed
    
    # akor_diyagramlari boş ise sil veya kullanılan akorlarla doldur
    if 'akor_diyagramlari' in song:
        if not song['akor_diyagramlari'] and 'lyrics_data' in song:
            # Kullanılan akorları ekle
            song['used_chords'] = song['lyrics_data']['chords_used']
        del song['akor_diyagramlari']
    
    return song

# Ana işlem
print("JSON dosyası okunuyor...")
with open('detayli_sarki_bilgileri.json', 'r', encoding='utf-8') as f:
    songs = json.load(f)

print(f"Toplam {len(songs)} şarkı bulundu.")
print("Şarkılar yeniden yapılandırılıyor...")

# Her şarkıyı işle
restructured_songs = []
for i, song in enumerate(songs):
    restructured = restructure_song(song.copy())
    restructured_songs.append(restructured)
    
    if (i + 1) % 100 == 0:
        print(f"  {i + 1} şarkı işlendi...")

# Yeni dosyaya yaz
output_file = 'detayli_sarki_bilgileri_restructured.json'
print(f"\n{output_file} dosyasına yazılıyor...")

with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(restructured_songs, f, ensure_ascii=False, indent=2)

print(f"✓ Tamamlandı!")
print(f"  • {len(restructured_songs)} şarkı yeniden yapılandırıldı")
print(f"  • 'meta' alanı kaldırıldı")
print(f"  • 'akorlar_ve_sozler' HTML -> JSON'a çevrildi")
print(f"  • 'akor_diyagramlari' -> 'used_chords' olarak güncellendi")
print(f"\nYeni dosya: {output_file}")
