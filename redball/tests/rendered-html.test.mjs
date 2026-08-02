import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("GitHub Pages paketi doğru domain ve varlıklarla hazırdır", async () => {
  const html = await readFile(new URL("../.pages-build/index.html", import.meta.url), "utf8");
  assert.match(html, /<title>Kızıl Zıpla!/i);
  assert.match(html, /https:\/\/parzi\.dev\/redball\//);
  assert.match(html, /\/redball\/assets\/index-[^"']+\.js/);
  assert.match(html, /https:\/\/parzi\.dev\/redball\/og\.png/);
  await access(new URL("../og.png", import.meta.url));
});

test("oyun 10 bölüm, kayıt ve dokunmatik kontrol içerir", async () => {
  const source = await readFile(new URL("../src/Game.tsx", import.meta.url), "utf8");
  const names = ["Yeşil Başlangıç", "Kütük Köprüsü", "Orman Basamakları", "Hareketli Hat", "Mor Gece", "Sıcak Vadi", "Bulut Yolu", "Hız Tüneli", "Usta Parkuru", "Altın Taç"];
  for (const name of names) assert.match(source, new RegExp(name));
  assert.match(source, /localStorage\.setItem\("kizil-zipla-progress"/);
  assert.match(source, /onPointerDown/);
  assert.match(source, /requestAnimationFrame/);
  assert.match(source, /const JUMP_SPEED = 840/);
  assert.ok((840 ** 2) / (2 * 1900) > 180, "zıplama yüksekliği ilk bölüm basamaklarına yetmeli");
});
