import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { LEVEL_COUNT, analyzeSolvability, levels } from "../src/levels.ts";

test("100 bölümün tamamı fizik sınırları içinde geçilebilirdir", () => {
  assert.equal(levels.length, LEVEL_COUNT);
  assert.equal(new Set(levels.map(level => level.name)).size, LEVEL_COUNT, "bölüm adları benzersiz olmalı");

  const failures = levels
    .map(level => ({ level, result: analyzeSolvability(level) }))
    .filter(({ result }) => !result.ok)
    .map(({ level, result }) => `#${level.number} ${level.name}: ${result.reason}`);

  assert.deepEqual(failures, [], failures.join("\n"));
});

test("1–50'de anahtarsız bölümlerin mevcut tasarımı aynen korunur", () => {
  const legacyFields = ["number", "chapter", "name", "subtitle", "width", "start", "platforms", "movers", "springs", "spikes", "stars", "enemies", "key", "boosters", "goal", "theme"] as const;
  const legacyData = levels.slice(0, 50).filter(level => !level.key).map(level => Object.fromEntries(legacyFields.map(field => [field, level[field]])));
  const fingerprint = createHash("sha256").update(JSON.stringify(legacyData)).digest("hex");

  assert.equal(fingerprint, "59912727e6eaf39ac46cee1d834fb2e92f3e88d7bc0f67f21535df72bb12a7ac");
  assert.ok(levels.slice(0, 50).every(level => (
    level.crumbles.length === 0
    && level.ice.length === 0
    && level.windZones.length === 0
    && level.waterZones.length === 0
    && level.portals.length === 0
    && level.lava.length === 0
    && level.spinners.length === 0
    && level.gravityScale === 1
  )));
});

test("51–100 birbirinden farklı düzenlere ve anahtar odaları dahil yeni mekaniklere sahiptir", () => {
  const redesigned = levels.slice(50);
  const layoutSignatures = redesigned.map(level => JSON.stringify({
    platforms: level.platforms.map(platform => [platform.x, platform.y, platform.w, platform.h]),
    crumbles: level.crumbles,
    springs: level.springs,
    boosters: level.boosters,
    ice: level.ice,
    wind: level.windZones,
    water: level.waterZones,
    portals: level.portals,
    lava: level.lava,
    spinners: level.spinners,
    key: level.key,
  }));
  const mechanicTypes = new Set(redesigned.flatMap(level => level.mechanics));

  assert.equal(redesigned.length, 50);
  assert.equal(new Set(layoutSignatures).size, 50, "51–100 arasında kopya bölüm düzeni olmamalı");
  assert.deepEqual([...mechanicTypes].sort(), [
    "anahtar", "anahtar odası", "buz", "dönen tuzak", "ivme pisti", "lav", "portal", "rüzgâr", "su", "zıplatan bitki", "çöken zemin",
  ].sort());
  assert.ok(redesigned.every(level => level.mechanics.length >= 2));
});

test("51–100'deki beş yeni dünya kendine özgü mekanik kurallarını taşır", () => {
  const [water, dungeon, lava, crystal, finale] = Array.from({ length: 5 }, (_, world) => levels.slice(50 + world * 10, 60 + world * 10));

  assert.ok(water.every(level => level.waterZones.length > 0 && level.crumbles.length > 0));
  assert.ok(dungeon.every(level => level.key && level.spinners.length > 0));
  assert.ok(lava.every(level => level.lava.length > 0 && level.springs.length > 0 && level.boosters.length > 0));
  assert.ok(crystal.every(level => level.ice.length > 0 && level.windZones.length > 0));
  assert.ok(finale.every(level => level.springs.length > 0 && level.boosters.length > 0 && level.windZones.length > 0 && level.spinners.length > 0));
  assert.ok(finale.at(-1)!.mechanics.length >= 10, "100. bölüm bütün yeni mekanikleri birleştirmeli");
});

test("32 anahtarlı bölüm güvenli ve farklı anahtar odalarına sahiptir", () => {
  const keyLevels = levels.filter(level => level.key);
  assert.equal(keyLevels.length, 32);
  assert.deepEqual(new Set(keyLevels.map(level => level.keyChallenge)), new Set(["stairs", "spring", "lift", "vault"]));

  for (const level of keyLevels) {
    const key = level.key!;
    const platform = level.keyPlatform;
    assert.ok(platform, `#${level.number}: anahtar platformu eksik`);
    assert.ok(key.x >= platform.x && key.x <= platform.x + platform.w && Math.abs(key.y + 58 - platform.y) < 1, `#${level.number}: anahtar platform üstünde değil`);
    assert.ok(level.subtitle.includes("anahtar"), `#${level.number}: anahtar rotası açıklanmıyor`);
    assert.ok(!level.crumbles.some(item => key.x >= item.x && key.x <= item.x + item.w && Math.abs(key.y + 58 - item.y) < 5), `#${level.number}: anahtar çöken zeminde`);
    assert.ok(!level.spikes.some(item => Math.abs(item.x + item.w / 2 - key.x) < 160), `#${level.number}: anahtar dikene çok yakın`);
    assert.ok(!level.enemies.some(enemy => enemy.min < key.x + 160 && enemy.max > key.x - 160), `#${level.number}: anahtar düşman rotasında`);
    assert.ok(!level.spinners.some(spinner => Math.hypot(spinner.x - key.x, spinner.y - key.y) < spinner.length + 100), `#${level.number}: anahtar dönen tuzağa çok yakın`);
    assert.ok(!level.portals.some(portal => [portal.a, portal.b].some(point => Math.hypot(point.x - key.x, point.y - key.y) < 140)), `#${level.number}: anahtar portalla çakışıyor`);
  }
});
