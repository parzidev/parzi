import assert from "node:assert/strict";
import test from "node:test";
import { advanceCheatIndex, CHEAT_SEQUENCE, type CheatAction } from "../src/cheat.ts";

function enter(actions: CheatAction[]) {
  return actions.reduce(advanceCheatIndex, 0);
}

test("iPad dokunmatik tuşları hile dizisini tamamlar", () => {
  assert.equal(enter(["jump", "jump", "right", "left", "right", "left", "jump", "left", "right"]), CHEAT_SEQUENCE.length);
});

test("klavye hile dizisi çalışmaya devam eder", () => {
  assert.equal(enter([...CHEAT_SEQUENCE]), CHEAT_SEQUENCE.length);
});

test("yanlış tuş diziyi güvenli biçimde sıfırlar", () => {
  assert.equal(enter(["jump", "right", "right"]), 0);
});
