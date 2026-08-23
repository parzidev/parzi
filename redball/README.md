# REDBALL

`https://parzi.dev/redball/` adresinde çalışan, Ada için hazırlanmış 22 dünya ve
220 bölümlü 2D platform oyunu. İlk 50 bölümün klasik düzeni korunur; 51–100
arasında su, çöken zemin, anahtar, portal, lav, buz, rüzgâr, dönen tuzak,
zıplatan bitki ve ivme pisti mekanikleri kademeli olarak birleşir. 101–200 ise
yürüyen bant, faz platformu, lazer kapısı, yerçekimi alanı ve kontrol noktalarını
10 yeni dünyada eski mekaniklerle birleştirir. Anahtarlı 32 bölüm; basamak,
bitki, asansör veya yan oda temalı güvenli bir anahtar rotası kullanır.
201–220 arasındaki dört özel dünya; tahterevalliden duvar zıplamaya, itilebilir
bloktan salıncak ve zipline'a, yükselen sudan ters yerçekimine, zaman yankısından
üç fazlı finale uzanan 20 ayrı el yapımı mekanik kullanır. Bu bölümler yalnızca
gerektiğinde yüklenen Three.js/WebGL 2.5D renderer'ıyla çizilir. Fizik X/Y
düzleminde kalırken platformlar, oyuncu ve oynanış nesneleri ortografik kamerayla
kalın, bevel'lı 3D meshler olarak görünür; dağ, tepe ve bulut katmanları parallax
ile kayar.

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
