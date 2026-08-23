export type StoredProgress = { version?: number; unlocked?: number; scores?: unknown[] };
export type Progress = { version: number; unlocked: number; scores: number[] };

export const PROGRESS_KEY = "redball-progress";
export const LEGACY_PROGRESS_KEY = "kizil-zipla-progress";
export const PROGRESS_VERSION = 1;

type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

const normalizeScore = (value: unknown) => (
  typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(3, Math.floor(value)))
    : 0
);

export function normalizeProgress(saved: StoredProgress | undefined, levelCount: number): Progress {
  const scores = Array.from({ length: levelCount }, (_, index) => normalizeScore(saved?.scores?.[index]));
  const unlockedFromScores = scores.reduce((unlocked, score, index) => score > 0 ? Math.max(unlocked, index + 2) : unlocked, 1);
  const storedUnlocked = typeof saved?.unlocked === "number" && Number.isFinite(saved.unlocked)
    ? Math.floor(saved.unlocked)
    : unlockedFromScores;
  const unlockedAfterExpansion = saved?.version === PROGRESS_VERSION && saved.scores?.length === 100 && storedUnlocked >= 100
    ? Math.max(storedUnlocked, 101)
    : storedUnlocked;
  const importedUnlocked = saved?.version === PROGRESS_VERSION
    ? unlockedAfterExpansion
    : saved
      ? Math.min(storedUnlocked, Math.min(50, levelCount))
      : 1;

  return {
    version: PROGRESS_VERSION,
    unlocked: Math.max(1, Math.min(levelCount, Math.max(importedUnlocked, unlockedFromScores))),
    scores,
  };
}

export function loadProgress(storage: StorageLike, levelCount: number): Progress {
  for (const key of [PROGRESS_KEY, LEGACY_PROGRESS_KEY]) {
    let raw: string | null;
    try { raw = storage.getItem(key); } catch { return normalizeProgress(undefined, levelCount); }
    if (!raw) continue;
    try {
      const progress = normalizeProgress(JSON.parse(raw) as StoredProgress, levelCount);
      try { storage.setItem(PROGRESS_KEY, JSON.stringify(progress)); } catch { /* progress still works in memory */ }
      return progress;
    } catch { /* try the older storage key */ }
  }
  return normalizeProgress(undefined, levelCount);
}
