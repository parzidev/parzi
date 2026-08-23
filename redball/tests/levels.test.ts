import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { LEVEL_COUNT, analyzeSolvability, isLaserGateActive, isPhasePlatformActive, levels } from "../src/levels.ts";

test("220 bölümün tamamı fizik sınırları içinde geçilebilirdir", () => {
  assert.equal(levels.length, LEVEL_COUNT);
  assert.equal(new Set(levels.map(level => level.name)).size, LEVEL_COUNT, "bölüm adları benzersiz olmalı");

  const failures = levels
    .map(level => ({ level, result: analyzeSolvability(level) }))
    .filter(({ result }) => !result.ok)
    .map(({ level, result }) => `#${level.number} ${level.name}: ${result.reason}`);

  assert.deepEqual(failures, [], failures.join("\n"));
});

test("mevcut 1–100 bölüm genişleme sonrasında aynen korunur", () => {
  const originalFields = [
    "number", "chapter", "name", "subtitle", "note", "mechanics", "width", "start", "platforms", "movers", "crumbles", "springs",
    "boosters", "ice", "windZones", "waterZones", "portals", "lava", "spinners", "spikes", "stars", "enemies", "key", "keyPlatform",
    "keyChallenge", "gravityScale", "goal", "theme",
  ] as const;
  const originalData = levels.slice(0, 100).map(level => Object.fromEntries(originalFields.map(field => [field, level[field]])));
  const fingerprint = createHash("sha256").update(JSON.stringify(originalData)).digest("hex");

  assert.equal(fingerprint, "9c25a1f3203b67f098511f6910a630749bb68503608ce2066009c5eba1c2b3d9");
});

test("mevcut 1–200 bölüm bonus dünyalar eklenirken bit bit korunur", () => {
  const fingerprint = createHash("sha256").update(JSON.stringify(levels.slice(0, 200))).digest("hex");

  assert.equal(fingerprint, "9426b2ebe79911e7226f5fdd12ca55b221e961ad6786562fb5cd8be281c82773");
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
  const redesigned = levels.slice(50, 100);
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

test("101–200 yüz benzersiz parkur ve beş yeni mekanik getirir", () => {
  const expansion = levels.slice(100, 200);
  const signatures = expansion.map(level => JSON.stringify({
    platforms: level.platforms,
    conveyors: level.conveyors,
    phasePlatforms: level.phasePlatforms,
    laserGates: level.laserGates,
    gravityZones: level.gravityZones,
    checkpoints: level.checkpoints,
  }));
  const mechanics = new Set(expansion.flatMap(level => level.mechanics));

  assert.equal(expansion.length, 100);
  assert.equal(new Set(signatures).size, 100, "101–200 arasında kopya bölüm düzeni olmamalı");
  assert.equal(new Set(expansion.map(level => level.chapter)).size, 10);
  assert.ok(expansion.every(level => level.mechanics.length >= 3));
  for (const mechanic of ["yürüyen bant", "faz platformu", "lazer kapısı", "yerçekimi alanı", "kontrol noktası"]) {
    assert.ok(mechanics.has(mechanic), `${mechanic} genişlemede bulunmalı`);
  }
});

test("101–200'deki on dünya kendi mekanik kimliğini korur", () => {
  const worlds = Array.from({ length: 10 }, (_, world) => levels.slice(100 + world * 10, 110 + world * 10));

  assert.ok(worlds[0].every(level => level.conveyors.length > 0 && level.checkpoints.length > 0));
  assert.ok(worlds[1].every(level => level.phasePlatforms.length > 0 && level.gravityZones.length > 0));
  assert.ok(worlds[2].every(level => level.laserGates.length > 0 && level.conveyors.length > 0));
  assert.ok(worlds[3].every(level => level.gravityZones.length > 0 && level.checkpoints.length > 0));
  assert.ok(worlds[4].every(level => level.phasePlatforms.length > 0 && level.laserGates.length > 0));
  assert.ok(worlds[5].every(level => level.conveyors.length > 0 && level.gravityZones.length > 0));
  assert.ok(worlds[6].every(level => level.checkpoints.length > 0 && level.laserGates.length > 0));
  assert.ok(worlds[7].every(level => level.phasePlatforms.length > 0 && level.conveyors.length > 0));
  assert.ok(worlds[8].every(level => level.gravityZones.length > 0 && level.laserGates.length > 0 && level.checkpoints.length > 0));
  assert.ok(worlds[9].every(level => level.conveyors.length > 0 && level.phasePlatforms.length > 0 && level.laserGates.length > 0 && level.gravityZones.length > 0 && level.checkpoints.length > 0));
  assert.ok(worlds[9].at(-1)!.mechanics.length >= 14, "200. bölüm eski ve yeni mekanikleri birleştirmeli");
});

test("201–220 dört perdede yirmi el yapımı ana mekanik sunar", () => {
  const bonus = levels.slice(200, 220);
  const expectedKinds = [
    "seesaw", "oneWay", "wallJump", "pushBlock", "pressureGate",
    "breakableWall", "swing", "zipline", "elastic", "risingWater",
    "magnet", "gravityFlip", "gears", "pistons", "momentumPortal",
    "phaseSwitch", "echo", "timeFreeze", "collapse", "boss",
  ];
  const signatures = bonus.map(level => JSON.stringify({
    platforms: level.platforms,
    special: level.special,
  }));

  assert.equal(bonus.length, 20);
  assert.equal(new Set(signatures).size, 20, "201–220 arasında kopya bölüm düzeni olmamalı");
  assert.deepEqual(bonus.map(level => level.special?.kind), expectedKinds);
  assert.deepEqual([...new Set(bonus.map(level => level.chapter))], ["Kök Bahçesi", "Yaprak Serası", "Saat Atölyesi", "Kalp Motoru"]);
  assert.ok(bonus.every(level => level.mechanics.length === 1), "her özel bölüm tek ana fikre odaklanmalı");
  assert.ok(bonus.every(level => level.subtitle.length >= 35), "mekanik dokunmatik oyuncuya açıkça anlatılmalı");

  for (const level of bonus) {
    const collapseTiles = level.special?.kind === "collapse" ? level.special.tiles : [];
    const mainRoute = [
      ...level.platforms.filter(platform => platform.h >= 80 && platform.w >= 300),
      ...collapseTiles,
    ].sort((a, b) => a.x - b.x);
    assert.equal(mainRoute[0].x, 0, `#${level.number}: ana rota başlangıçta başlamalı`);
    assert.equal(mainRoute.at(-1)!.x + mainRoute.at(-1)!.w, level.width, `#${level.number}: ana rota kapıya ulaşmalı`);
    for (let i = 0; i < mainRoute.length - 1; i++) {
      const from = mainRoute[i], to = mainRoute[i + 1];
      assert.ok(to.x - (from.x + from.w) <= 100, `#${level.number}: ana rotadaki boşluk fazla geniş`);
      assert.ok(from.y - to.y <= 145, `#${level.number}: ana rotadaki yükseliş fazla dik`);
    }
  }
});

test("220. bölüm üç fazlı, kilitli bir muhafız finalidir", () => {
  const finale = levels[219];

  assert.equal(finale.name, "Kalbin Efsanevi Tacı");
  assert.equal(finale.special?.kind, "boss");
  assert.equal(finale.special?.kind === "boss" ? finale.special.phases.length : 0, 3);
  assert.ok(finale.subtitle.includes("Üç mührü"));
  assert.equal(finale.portals.length, 1);
});

test("faz platformları ve lazer kapıları zaman döngüsüne uyar", () => {
  const phase = { x: 0, y: 0, w: 100, h: 20, activeTime: 2, inactiveTime: 1, phase: 0 };
  const laser = { x: 0, y: 0, h: 100, activeTime: 1, inactiveTime: 2, phase: 0 };

  assert.equal(isPhasePlatformActive(phase, .5), true);
  assert.equal(isPhasePlatformActive(phase, 2.5), false);
  assert.equal(isLaserGateActive(laser, .5), true);
  assert.equal(isLaserGateActive(laser, 1.5), false);
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

test("66. bölüm özel mesajı taşır", () => {
  assert.equal(levels[65].note, "Keşke bunu düzelttiğim gibi aramızı da düzeltebilsem.");
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
    assert.ok(!level.portals.some(portal => Math.min(portal.a.x, portal.b.x) < key.x && Math.max(portal.a.x, portal.b.x) > key.x), `#${level.number}: portal anahtar rotasını atlıyor`);
  }
});
