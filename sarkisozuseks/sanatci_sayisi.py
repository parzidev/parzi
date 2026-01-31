import json
import sys

# Windows konsolunda UTF-8 kullanımını zorla
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# JSON dosyasını oku
with open('sarki_bilgileri.json', 'r', encoding='utf-8') as f:
    sarki_listesi = json.load(f)

# Benzersiz sanatçıları bul
sanatcilar = set()
for sarki in sarki_listesi:
    sanatcilar.add(sarki['sanatci'])

# Sonuçları göster
print(f"Toplam şarkı sayısı: {len(sarki_listesi)}")
print(f"Farklı şarkıcı sayısı: {len(sanatcilar)}")
print("\n" + "="*50)
print("Şarkıcılar:")
print("="*50)

# Şarkıcıları alfabetik sıraya göre listele
for sanatci in sorted(sanatcilar):
    sarki_sayisi = sum(1 for s in sarki_listesi if s['sanatci'] == sanatci)
    print(f"{sanatci}: {sarki_sayisi} şarkı")
