export type CheatAction = "up" | "right" | "left" | "jump";

export const CHEAT_SEQUENCE: readonly CheatAction[] = [
  "up", "up", "right", "left", "right", "left", "jump", "left", "right",
];

export function advanceCheatIndex(index: number, action: CheatAction) {
  const expected = CHEAT_SEQUENCE[index];
  const verticalAction = action === "up" || action === "jump";
  const verticalExpected = expected === "up" || expected === "jump";

  if (action === expected || (verticalAction && verticalExpected)) return index + 1;
  return verticalAction ? 1 : 0;
}
