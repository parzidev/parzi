import assert from "node:assert/strict";
import test from "node:test";
import {
  advanceCheatIndex,
  CHEAT_SEQUENCE,
  isLevelUnlockCode,
  isSingleLevelSkipCode,
  LEVEL_UNLOCK_CODE,
  SINGLE_LEVEL_SKIP_CODE,
  type CheatAction,
} from "../src/cheat.ts";

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

test("bölüm haritası hile kodunu büyük küçük harf ve boşluklardan bağımsız tanır", () => {
  assert.equal(LEVEL_UNLOCK_CODE, "ADA220");
  assert.equal(isLevelUnlockCode("ada220"), true);
  assert.equal(isLevelUnlockCode("  Ada 220  "), true);
  assert.equal(isLevelUnlockCode("ADA200"), false);
});

test("hilecikedi kodu yalnızca tek bölüm atlama hilesini çalıştırır", () => {
  assert.equal(SINGLE_LEVEL_SKIP_CODE, "HILECIKEDI");
  assert.equal(isSingleLevelSkipCode("hilecikedi"), true);
  assert.equal(isSingleLevelSkipCode("HİLECİ KEDİ"), true);
  assert.equal(isSingleLevelSkipCode("HILECIKEDI"), true);
  assert.equal(isSingleLevelSkipCode("hileci"), false);
  assert.equal(isLevelUnlockCode("hilecikedi"), false);
});
