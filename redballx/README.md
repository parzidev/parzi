# REDBALL

`https://parzi.dev/redball/` adresinde çalışan, Ada için hazırlanmış 10 dünya ve
100 bölümlü 2D platform oyunu. İlk 50 bölümün klasik düzeni korunur; 51–100
arasında su, çöken zemin, anahtar, portal, lav, buz, rüzgâr, dönen tuzak,
zıplatan bitki ve ivme pisti mekanikleri kademeli olarak birleşir. Anahtarlı
32 bölüm; basamak, bitki, asansör veya yan oda temalı güvenli bir anahtar rotası kullanır.

## Kontroller

- `A` / `D` veya yön tuşları: hareket
- `W`, `↑` veya boşluk: zıpla
- `R`: bölümü yeniden başlat
- `Esc`: duraklat

Dokunmatik ekranlarda yön ve zıplama düğmeleri otomatik olarak görünür.
iPad’de Safari’den Ana Ekran’a eklenerek tam ekran ve yatay yönde oynanabilir.

## Geliştirme

```bash
pnpm install
pnpm run dev
pnpm test
```

GitHub Pages için `pnpm run build` sonrasında `.pages-build` içindeki `index.html`
ve `assets` dosyaları `redball/` köküne kopyalanır.
