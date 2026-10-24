# Katalog yenileme

Yayımlanan veri `dist/` altında üç dosyadır:

- `songs.jsonl`: Uygun şarkılar; kimlik, kaynak, müzik bilgisi ve tek bir söz/akor gösterimi.
- `collections.json`: Ana sayfa bölümleri, sanatçı, repertuar ve gerçek arama sonuçları. Üyeler şarkı veya koleksiyon kimliklerine bağlanır.
- `manifest.json`: Sürüm, kaynak kapsamı, dosya hashleri, sayılar, kalite nedeniyle ayrılan kayıtlar ve eksikler.

## Çalıştırma

Python ve `lxml` gerekir. Bu çalışma için mevcut paketli Python:

```sh
CATALOG_PYTHON=/Users/parzi/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3
"$CATALOG_PYTHON" run.py
"$CATALOG_PYTHON" crawl.py status
"$CATALOG_PYTHON" random_probe.py --batches 100
"$CATALOG_PYTHON" validate_catalog.py dist
"$CATALOG_PYTHON" -m unittest discover
```

`run.py` eşzamanlı ikinci çalışmayı kilitle engeller, başarılı indirmeleri yeniden kullanır ve yeni bağlantılar tükenene kadar keşfi sürdürür. Aday çıktı bağımsız doğrulamadan geçmeden `dist/` değişmez. HTTP/okuma hataları tamamlanmış indirme sayılmaz. Çalışma durumu `state/run.json`, indirilen kaynaklar `cache/` ve `state/crawl.sqlite3` içindedir.

`random_probe.py` önceki anonim rastgele içerik yöntemini ek keşif için kullanır; bulduklarını aynı kuyruğa ekler. Sonrasında `run.py` bu bağlantıları işler. Sonlu bir rastgele örneklem, tek başına bütün sitenin keşfedildiği kanıtı değildir; örneklem sayıları manifestte tutulur.

## Kimlik ve kalite

Uygulamanın eski kimlikleri `../sarki_bilgileri.json` ile eşleştirilir. `../akor_urls.json` keşif numaraları uygulama kimliği olarak kullanılmaz. Yeni kimlikler mevcut veritabanından ve son yayımlanan aktif/karantina kayıtlarından korunur.

`quality.py` akorsuz, sözsüz, çözülemeyen akor yazımı veya bozuk akor konumu olan kayıtları ana katalogdan ayırır. Kimlik ve nedenler `manifest.quality.quarantined_songs` içinde kalır; ham kaynak cache'de korunur. Eksik ton, kapo veya ritim tek başına ret nedeni değildir. Şarkının türü, popülerliği veya tek akorla çalınması kalite ret nedeni değildir.

Koleksiyonlar filtrelenirken kalan üyelerin kaynak sırası korunur. `source_position` kaynak sırasını, `position` filtrelenmiş listedeki sırayı belirtir. `filtered_item_count` ayrılan üyeleri sayar. Arama önerileri arama sonucuna katılmaz.

`blocks[].chords[].column` sıfır tabanlı Unicode karakter konumudur; tablar dört boşluğa açılır. Söz ve akorlar eş aralıklı yazıyla çizilmelidir. Bu sürümün tüketici modeli yeni şemaya uyarlanmalıdır; iOS uygulaması bu çalışma sırasında değiştirilmez.
