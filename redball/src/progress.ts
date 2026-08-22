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
  const importedUnlocked = saved?.version === PROGRESS_VERSION
    ? storedUnlocked
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

// iPad/touch support for the existing keyboard cheat listener.
// The game already translates keyboard arrows into cheat-sequence inputs;
// dispatching a short synthetic key press from the touch controls keeps both
// input paths on the same code path without changing normal touch movement.
if (typeof window !== "undefined") {
  document.addEventListener("pointerdown", (event) => {
    const target = event.target as HTMLElement | null;
    const button = target?.closest<HTMLButtonElement>(".touch-controls button");
    if (!button) return;

    const label = button.getAttribute("aria-label")?.toLowerCase();
    const key = label?.includes("sola")
      ? "ArrowLeft"
      : label?.includes("sağa")
        ? "ArrowRight"
        : label?.includes("zıpla")
          ? "ArrowUp"
          : null;

    if (!key) return;

    window.dispatchEvent(new KeyboardEvent("keydown", {
      key,
      bubbles: true,
      cancelable: true,
    }));

    window.dispatchEvent(new KeyboardEvent("keyup", {
      key,
      bubbles: true,
      cancelable: true,
    }));
  });
}
