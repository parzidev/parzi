# REDBALL

`https://parzi.dev/redball/` adresinde çalışan, Ada için hazırlanmış 5 dünya ve
50 özgün bölümlü 2D platform oyunu. Kırmızı topu yuvarla, zıplatan bitkileri
kullan, yıldızları topla, dikenlerden ve düşmanlardan kaç.

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
