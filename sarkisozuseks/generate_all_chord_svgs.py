import json
import re
import sys
import io
from chord_diagram_generator import ChordDiagram, CHORD_DATABASE

# Windows konsolunda UTF-8 kullanımını zorla
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def extract_chords_from_html(html_content):
    """HTML içeriğinden akorları çıkar"""
    # <span class="c">AKOR</span> veya direkt akor patternleri
    chords = []
    
    # HTML taglarını temizle ve akorları bul
    # Pattern: Büyük harf ile başlayan, # veya m içerebilen, sayı içerebilen
    chord_pattern = r'\b([A-G][#b]?(?:m|maj|min|sus|dim|aug|add)?[0-9]*)\b'
    
    # HTML'den metni çıkar
    text = re.sub(r'<[^>]+>', ' ', html_content)
    
    # Akorları bul
    matches = re.findall(chord_pattern, text)
    chords.extend(matches)
    
    return chords

def main():
    # JSON dosyasını oku
    print("📂 Veri dosyası yükleniyor...")
    with open('scraping_progress.json', 'r', encoding='utf-8') as f:
        songs = json.load(f)
    
    print(f"✓ {len(songs)} şarkı yüklendi")
    
    # Tüm benzersiz akorları topla
    all_chords = set()
    
    for song in songs:
        if song.get('akorlar_ve_sozler'):
            chords = extract_chords_from_html(song['akorlar_ve_sozler'])
            all_chords.update(chords)
    
    # Sırala
    unique_chords = sorted(all_chords)
    
    print(f"\n🎸 Toplam {len(unique_chords)} benzersiz akor bulundu")
    print(f"İlk 20 akor: {', '.join(unique_chords[:20])}")
    
    # Akor diyagramı üreticisi
    generator = ChordDiagram()
    
    # test_chords klasörünü oluştur
    import os
    os.makedirs('test_chords', exist_ok=True)
    
    # Her akor için SVG üret
    created_count = 0
    skipped_count = 0
    
    print(f"\n📊 SVG diyagramları oluşturuluyor...")
    
    for chord in unique_chords:
        svg_path = f"test_chords/{chord}.svg"
        
        # Zaten varsa atla
        if os.path.exists(svg_path):
            skipped_count += 1
            continue
        
        # Eğer veritabanında varsa SVG üret
        if chord in CHORD_DATABASE:
            fingering = CHORD_DATABASE[chord]
            svg_content = generator.create_svg(chord, fingering)
            
            with open(svg_path, 'w', encoding='utf-8') as f:
                f.write(svg_content)
            created_count += 1
            
            if created_count % 10 == 0:
                print(f"  ✓ {created_count} akor oluşturuldu...")
        else:
            # Veritabanında yok, atla
            pass
    
    print(f"\n✅ Tamamlandı!")
    print(f"  • {created_count} yeni SVG oluşturuldu")
    print(f"  • {skipped_count} zaten mevcut (atlandı)")
    print(f"  • Toplam: {created_count + skipped_count} SVG dosyası")

if __name__ == "__main__":
    main()
