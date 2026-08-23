export type CheatAction = "up" | "right" | "left" | "jump";

export const LEVEL_UNLOCK_CODE = "ADA220";
export const SINGLE_LEVEL_SKIP_CODE = "HILECIKEDI";

export const CHEAT_SEQUENCE: readonly CheatAction[] = [
  "up", "up", "right", "left", "right", "left", "jump", "left", "right",
];

function normalizeCheatCode(value: string) {
  return value.trim().replace(/\s+/g, "").toLocaleUpperCase("tr-TR").replace(/İ/g, "I");
}

export function isLevelUnlockCode(value: string) {
  return normalizeCheatCode(value) === LEVEL_UNLOCK_CODE;
}

export function isSingleLevelSkipCode(value: string) {
  return normalizeCheatCode(value) === SINGLE_LEVEL_SKIP_CODE;
}

export function advanceCheatIndex(index: number, action: CheatAction) {
  const expected = CHEAT_SEQUENCE[index];
  const verticalAction = action === "up" || action === "jump";
  const verticalExpected = expected === "up" || expected === "jump";

  if (action === expected || (verticalAction && verticalExpected)) return index + 1;
  return verticalAction ? 1 : 0;
}
