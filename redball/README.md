# Kızıl Zıpla!

`https://parzi.dev/redball/` adresinde çalışan, 10 özgün bölümlü 2D platform
oyunu. Kırmızı topu yuvarla, yıldızları topla, dikenlerden ve düşmanlardan kaç.

## Kontroller

- `A` / `D` veya yön tuşları: hareket
- `W`, `↑` veya boşluk: zıpla
- `R`: bölümü yeniden başlat
- `Esc`: duraklat

Dokunmatik ekranlarda yön ve zıplama düğmeleri otomatik olarak görünür.

## Geliştirme

```bash
pnpm install
pnpm run dev
pnpm test
```

GitHub Pages için `pnpm run build` sonrasında `.pages-build` içindeki `index.html`
ve `assets` dosyaları `redball/` köküne kopyalanır.
