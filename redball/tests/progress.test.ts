import assert from "node:assert/strict";
import test from "node:test";
import { LEGACY_PROGRESS_KEY, PROGRESS_KEY, loadProgress, normalizeProgress } from "../src/progress.ts";

class MemoryStorage {
  data = new Map<string, string>();
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { this.data.set(key, value); }
}

test("yeni oyuncu yalnızca ilk bölüm açık başlar", () => {
  const progress = normalizeProgress(undefined, 200);
  assert.equal(progress.unlocked, 1);
  assert.equal(progress.scores.length, 200);
  assert.ok(progress.scores.every(score => score === 0));
});

test("eski 50 bölümlük kayıt açık bölümleri ve yıldızları korur", () => {
  const storage = new MemoryStorage();
  const oldScores = Array(50).fill(0); oldScores[0] = 3; oldScores[48] = 2;
  storage.setItem(PROGRESS_KEY, JSON.stringify({ unlocked: 50, scores: oldScores }));

  const progress = loadProgress(storage, 200);
  assert.equal(progress.unlocked, 50);
  assert.deepEqual(progress.scores.slice(0, 50), oldScores);
  assert.ok(progress.scores.slice(50).every(score => score === 0));
});

test("eski oyun anahtarındaki kayıt yeni anahtara kayıpsız taşınır", () => {
  const storage = new MemoryStorage();
  storage.setItem(LEGACY_PROGRESS_KEY, JSON.stringify({ unlocked: 37, scores: [3, 2, 1] }));

  const progress = loadProgress(storage, 200);
  assert.equal(progress.unlocked, 37);
  assert.deepEqual(progress.scores.slice(0, 3), [3, 2, 1]);
  assert.deepEqual(JSON.parse(storage.getItem(PROGRESS_KEY)!), progress);
});

test("kilitsiz 100 bölümlük sürümden gelen kayıtta oynanan bölüm korunur", () => {
  const storage = new MemoryStorage();
  storage.setItem(PROGRESS_KEY, JSON.stringify({ unlocked: 100, scores: Array(75).fill(3) }));
  assert.equal(loadProgress(storage, 200).unlocked, 76);
});

test("kilitsiz sürümde yalnızca otomatik açılan 51–100 yeniden kilitlenir", () => {
  const storage = new MemoryStorage();
  storage.setItem(PROGRESS_KEY, JSON.stringify({ unlocked: 100, scores: Array(100).fill(0) }));
  assert.equal(loadProgress(storage, 200).unlocked, 50);
});

test("yeni kilitli kayıt formatındaki ilerleme sonraki açılışlarda aynen kalır", () => {
  const storage = new MemoryStorage();
  storage.setItem(PROGRESS_KEY, JSON.stringify({ version: 1, unlocked: 76, scores: Array(100).fill(0) }));
  const progress = loadProgress(storage, 200);
  assert.equal(progress.unlocked, 76);
  assert.equal(progress.scores.length, 200);
});

test("bozuk yeni kayıt varsa sağlam eski kayıt yine kurtarılır", () => {
  const storage = new MemoryStorage();
  storage.setItem(PROGRESS_KEY, "bozuk-json");
  storage.setItem(LEGACY_PROGRESS_KEY, JSON.stringify({ unlocked: 50, scores: [3] }));
  assert.equal(loadProgress(storage, 200).unlocked, 50);
});

test("tamamlanmış 100 bölümlük kayıt 101. bölümü açarak genişler", () => {
  const storage = new MemoryStorage();
  const oldScores = Array(100).fill(0); oldScores[0] = 3; oldScores[99] = 2;
  storage.setItem(PROGRESS_KEY, JSON.stringify({ version: 1, unlocked: 100, scores: oldScores }));

  const progress = loadProgress(storage, 200);
  assert.equal(progress.unlocked, 101);
  assert.deepEqual(progress.scores.slice(0, 100), oldScores);
  assert.ok(progress.scores.slice(100).every(score => score === 0));
  assert.equal(JSON.parse(storage.getItem(PROGRESS_KEY)!).scores.length, 200);
});

test("eski finali sıfır yıldızla geçmiş kayıt da 101'e devam edebilir", () => {
  const storage = new MemoryStorage();
  storage.setItem(PROGRESS_KEY, JSON.stringify({ version: 1, unlocked: 100, scores: Array(100).fill(0) }));
  assert.equal(loadProgress(storage, 200).unlocked, 101);
});

test("200 bölümlük güncel kayıt yeniden açıldığında aynen korunur", () => {
  const storage = new MemoryStorage();
  storage.setItem(PROGRESS_KEY, JSON.stringify({ version: 1, unlocked: 137, scores: Array(200).fill(0) }));
  const progress = loadProgress(storage, 200);
  assert.equal(progress.unlocked, 137);
  assert.equal(progress.scores.length, 200);
});
