import assert from "node:assert/strict";
import test from "node:test";
import { LEVEL_COUNT, analyzeSolvability, levels } from "../src/levels.ts";

test("50 bölümün tamamı fizik sınırları içinde geçilebilirdir", () => {
  assert.equal(levels.length, LEVEL_COUNT);
  assert.equal(new Set(levels.map(level => level.name)).size, LEVEL_COUNT, "bölüm adları benzersiz olmalı");

  const failures = levels
    .map(level => ({ level, result: analyzeSolvability(level) }))
    .filter(({ result }) => !result.ok)
    .map(({ level, result }) => `#${level.number} ${level.name}: ${result.reason}`);

  assert.deepEqual(failures, [], failures.join("\n"));
});

test("bölüm ilerleyişi yeni mekanikleri kademeli açar", () => {
  assert.equal(levels.slice(0, 10).every(level => level.springs.length === 0), true);
  assert.equal(levels.slice(10).every(level => level.springs.length >= 1), true);
  assert.ok(levels.reduce((total, level) => total + level.springs.length, 0) >= 60);
  assert.ok(levels.slice(20).every(level => level.enemies.length > 0));
  assert.ok(levels.slice(20).every(level => level.movers.length > 0));
});
