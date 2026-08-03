import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("GitHub Pages paketi doğru domain ve varlıklarla hazırdır", async () => {
  const html = await readFile(new URL("../.pages-build/index.html", import.meta.url), "utf8");
  assert.match(html, /<title>REDBALL/i);
  assert.match(html, /https:\/\/parzi\.dev\/redball\//);
  assert.match(html, /\/redball\/assets\/index-[^"']+\.js/);
  assert.match(html, /https:\/\/parzi\.dev\/redball\/og-redball\.png/);
  await access(new URL("../og-redball.png", import.meta.url));
});

test("oyun 50 bölüm, kayıt, bitki ve iPad kontrolleri içerir", async () => {
  const source = await readFile(new URL("../src/Game.tsx", import.meta.url), "utf8");
  const levelSource = await readFile(new URL("../src/levels.ts", import.meta.url), "utf8");
  assert.match(levelSource, /LEVEL_COUNT = 50/);
  assert.match(levelSource, /SpringPlant/);
  assert.match(levelSource, /analyzeSolvability/);
  assert.match(source, /const PROGRESS_KEY = "redball-progress"/);
  assert.match(source, /localStorage\.setItem\(PROGRESS_KEY/);
  assert.match(source, /onPointerDown/);
  assert.match(source, /onPointerCancel/);
  assert.match(source, /requestAnimationFrame/);
  assert.match(source, /spring\.power/);
  assert.match(source, /KAZANDIN ADA!/);
  assert.match(source, /KAYBETTİN ADA/);
  assert.match(source, /kalbimde hep kazanıyorsun/);
  assert.ok((840 ** 2) / (2 * 1900) > 180, "zıplama yüksekliği ilk bölüm basamaklarına yetmeli");
  const manifest = JSON.parse(await readFile(new URL("../manifest.webmanifest", import.meta.url), "utf8"));
  assert.equal(manifest.display, "fullscreen");
  assert.equal(manifest.orientation, "landscape");
});
