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

test("1–50'in mevcut bölüm verisi aynen korunur", () => {
  const legacyFields = ["number", "chapter", "name", "subtitle", "width", "start", "platforms", "movers", "springs", "spikes", "stars", "enemies", "key", "boosters", "goal", "theme"] as const;
  const legacyData = levels.slice(0, 50).map(level => Object.fromEntries(legacyFields.map(field => [field, level[field]])));
  const fingerprint = createHash("sha256").update(JSON.stringify(legacyData)).digest("hex");

  assert.equal(fingerprint, "2bf98c50b1aa712a8d6d97964edfd56675018a2b7f16632b6d29516110fa35a6");
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

test("51–100 birbirinden farklı düzenlere ve on yeni mekanik türüne sahiptir", () => {
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
    "anahtar", "buz", "dönen tuzak", "ivme pisti", "lav", "portal", "rüzgâr", "su", "zıplatan bitki", "çöken zemin",
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
