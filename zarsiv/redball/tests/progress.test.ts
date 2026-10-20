import assert from "node:assert/strict";
import test from "node:test";
import { LEGACY_PROGRESS_KEY, PROGRESS_KEY, loadProgress, normalizeProgress, skipNextLevel } from "../src/progress.ts";

class MemoryStorage {
  data = new Map<string, string>();
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { this.data.set(key, value); }
}

test("yeni oyuncu yalnızca ilk bölüm açık başlar", () => {
  const progress = normalizeProgress(undefined, 220);
  assert.equal(progress.unlocked, 1);
  assert.equal(progress.scores.length, 220);
  assert.ok(progress.scores.every(score => score === 0));
});

test("eski 50 bölümlük kayıt açık bölümleri ve yıldızları korur", () => {
  const storage = new MemoryStorage();
  const oldScores = Array(50).fill(0); oldScores[0] = 3; oldScores[48] = 2;
  storage.setItem(PROGRESS_KEY, JSON.stringify({ unlocked: 50, scores: oldScores }));

  const progress = loadProgress(storage, 220);
  assert.equal(progress.unlocked, 50);
  assert.deepEqual(progress.scores.slice(0, 50), oldScores);
  assert.ok(progress.scores.slice(50).every(score => score === 0));
});

test("eski oyun anahtarındaki kayıt yeni anahtara kayıpsız taşınır", () => {
  const storage = new MemoryStorage();
  storage.setItem(LEGACY_PROGRESS_KEY, JSON.stringify({ unlocked: 37, scores: [3, 2, 1] }));

  const progress = loadProgress(storage, 220);
  assert.equal(progress.unlocked, 37);
  assert.deepEqual(progress.scores.slice(0, 3), [3, 2, 1]);
  assert.deepEqual(JSON.parse(storage.getItem(PROGRESS_KEY)!), progress);
});

test("kilitsiz 100 bölümlük sürümden gelen kayıtta oynanan bölüm korunur", () => {
  const storage = new MemoryStorage();
  storage.setItem(PROGRESS_KEY, JSON.stringify({ unlocked: 100, scores: Array(75).fill(3) }));
  assert.equal(loadProgress(storage, 220).unlocked, 76);
});

test("kilitsiz sürümde yalnızca otomatik açılan 51–100 yeniden kilitlenir", () => {
  const storage = new MemoryStorage();
  storage.setItem(PROGRESS_KEY, JSON.stringify({ unlocked: 100, scores: Array(100).fill(0) }));
  assert.equal(loadProgress(storage, 220).unlocked, 50);
});

test("yeni kilitli kayıt formatındaki ilerleme sonraki açılışlarda aynen kalır", () => {
  const storage = new MemoryStorage();
  storage.setItem(PROGRESS_KEY, JSON.stringify({ version: 1, unlocked: 76, scores: Array(100).fill(0) }));
  const progress = loadProgress(storage, 220);
  assert.equal(progress.unlocked, 76);
  assert.equal(progress.scores.length, 220);
});

test("bozuk yeni kayıt varsa sağlam eski kayıt yine kurtarılır", () => {
  const storage = new MemoryStorage();
  storage.setItem(PROGRESS_KEY, "bozuk-json");
  storage.setItem(LEGACY_PROGRESS_KEY, JSON.stringify({ unlocked: 50, scores: [3] }));
  assert.equal(loadProgress(storage, 220).unlocked, 50);
});

test("tamamlanmış 100 bölümlük kayıt 101. bölümü açarak genişler", () => {
  const storage = new MemoryStorage();
  const oldScores = Array(100).fill(0); oldScores[0] = 3; oldScores[99] = 2;
  storage.setItem(PROGRESS_KEY, JSON.stringify({ version: 1, unlocked: 100, scores: oldScores }));

  const progress = loadProgress(storage, 220);
  assert.equal(progress.unlocked, 101);
  assert.deepEqual(progress.scores.slice(0, 100), oldScores);
  assert.ok(progress.scores.slice(100).every(score => score === 0));
  assert.equal(JSON.parse(storage.getItem(PROGRESS_KEY)!).scores.length, 220);
});

test("eski finali sıfır yıldızla geçmiş kayıt da 101'e devam edebilir", () => {
  const storage = new MemoryStorage();
  storage.setItem(PROGRESS_KEY, JSON.stringify({ version: 1, unlocked: 100, scores: Array(100).fill(0) }));
  assert.equal(loadProgress(storage, 220).unlocked, 101);
});

test("tamamlanmış 200 bölümlük kayıt 201. bölümü açarak genişler", () => {
  const storage = new MemoryStorage();
  const oldScores = Array(200).fill(0); oldScores[0] = 3; oldScores[199] = 2;
  storage.setItem(PROGRESS_KEY, JSON.stringify({ version: 1, unlocked: 200, scores: oldScores }));

  const progress = loadProgress(storage, 220);
  assert.equal(progress.unlocked, 201);
  assert.deepEqual(progress.scores.slice(0, 200), oldScores);
  assert.ok(progress.scores.slice(200).every(score => score === 0));
  assert.equal(JSON.parse(storage.getItem(PROGRESS_KEY)!).scores.length, 220);
});

test("eski 200. bölümü sıfır yıldızla geçmiş kayıt da 201'e devam edebilir", () => {
  const storage = new MemoryStorage();
  storage.setItem(PROGRESS_KEY, JSON.stringify({ version: 1, unlocked: 200, scores: Array(200).fill(0) }));
  assert.equal(loadProgress(storage, 220).unlocked, 201);
});

test("yarım kalmış 200 bölümlük kayıt ilerlemesini kaybetmeden genişler", () => {
  const storage = new MemoryStorage();
  const oldScores = Array(200).fill(0); oldScores[0] = 3; oldScores[135] = 2;
  storage.setItem(PROGRESS_KEY, JSON.stringify({ version: 1, unlocked: 137, scores: oldScores }));

  const progress = loadProgress(storage, 220);
  assert.equal(progress.unlocked, 137);
  assert.deepEqual(progress.scores.slice(0, 200), oldScores);
  assert.ok(progress.scores.slice(200).every(score => score === 0));
});

test("220 bölümlük güncel kayıt yeniden açıldığında aynen korunur", () => {
  const storage = new MemoryStorage();
  storage.setItem(PROGRESS_KEY, JSON.stringify({ version: 1, unlocked: 207, scores: Array(220).fill(0) }));
  const progress = loadProgress(storage, 220);
  assert.equal(progress.unlocked, 207);
  assert.equal(progress.scores.length, 220);
});

test("güncel kayıt 220 bölüm sınırının dışına taşamaz", () => {
  const scores = Array(225).fill(3);
  const progress = normalizeProgress({ version: 1, unlocked: 999, scores }, 220);
  assert.equal(progress.unlocked, 220);
  assert.equal(progress.scores.length, 220);
  assert.ok(progress.scores.every(score => score === 3));
});

test("tek bölüm hilesi sıradaki bölümü yıldızlara dokunmadan açar", () => {
  const progress = normalizeProgress({ version: 1, unlocked: 66, scores: [3, 2, 1] }, 220);
  const skipped = skipNextLevel(progress, 220);
  assert.equal(skipped.unlocked, 67);
  assert.deepEqual(skipped.scores, progress.scores);
  assert.equal(skipNextLevel({ ...progress, unlocked: 220 }, 220).unlocked, 220);
});
