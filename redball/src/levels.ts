export type Box = { x: number; y: number; w: number; h: number };
export type Point = { x: number; y: number };
export type Mover = Box & { axis: "x" | "y"; range: number; speed: number; phase?: number };
export type EnemySpawn = Point & { min: number; max: number; speed?: number };
export type SpringPlant = { x: number; y: number; w: number; power: number };
export type Theme = { sky: string[]; hill: string; far: string; ground: string; grass: string; accent: string };

export type Level = {
  number: number;
  chapter: string;
  name: string;
  subtitle: string;
  width: number;
  start: Point;
  platforms: Box[];
  movers: Mover[];
  springs: SpringPlant[];
  spikes: Box[];
  stars: Point[];
  enemies: EnemySpawn[];
  goal: Point;
  theme: Theme;
};

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const BALL_R = 27;
export const GRAVITY = 1900;
export const JUMP_SPEED = 840;
export const MAX_RUN_SPEED = 430;
export const LEVEL_COUNT = 50;

const themes: Theme[] = [
  { sky: ["#76d8ff", "#e7fbff"], hill: "#6ac77a", far: "#a5e2a8", ground: "#8a542d", grass: "#49ac55", accent: "#ffd646" },
  { sky: ["#69cfff", "#fff2c2"], hill: "#e6a949", far: "#f3ce74", ground: "#8b5538", grass: "#67b04a", accent: "#ffcc32" },
  { sky: ["#9fe8ff", "#e8fff2"], hill: "#57bfa0", far: "#a0dfbd", ground: "#77503b", grass: "#44a879", accent: "#ffe165" },
  { sky: ["#7d91ff", "#f2c5ff"], hill: "#7656a6", far: "#aa8ac8", ground: "#5f4465", grass: "#835faa", accent: "#ffe15b" },
  { sky: ["#ff9b69", "#ffe3a8"], hill: "#c55d4a", far: "#e98d65", ground: "#713e34", grass: "#cb6a42", accent: "#fff071" },
];

const chapterNames = ["Çayır Rotası", "Zıpzıp Bahçesi", "Mor Gece", "Sıcak Vadi", "Gökyüzü Krallığı"];
const names = [
  ["Yeşil Başlangıç", "Kütük Köprüsü", "Orman Basamakları", "Dere Üstü", "Arı Yolu", "Yonca Tepesi", "Rüzgâr Değirmeni", "Göl Kıyısı", "Hız Tüneli", "Çayır Tacı"],
  ["İlk Filiz", "Zıpzıp Bahçesi", "Sarmaşık Sokağı", "Yaprak Asansörü", "Mantar Geçidi", "Çiçek Fırlatıcı", "Bambu Sıçrayışı", "Sera Labirenti", "Polen Fırtınası", "Dev Nilüfer"],
  ["Alacakaranlık", "Ateşböceği Yolu", "Mor Köprü", "Ay Işığı", "Gölge Basamakları", "Baykuş Nöbeti", "Gece Çiçeği", "Yıldız Tüneli", "Sisli Zirve", "Dolunay Kapısı"],
  ["Kızgın Toprak", "Lav Kenarı", "Kanyon Sıçrayışı", "Kızıl Kayalar", "Güneş Tuzağı", "Kuru Nehir", "Ateş Çiçeği", "Çöl Rüzgârı", "Volkan Yolu", "Kor Taç"],
  ["Bulut Merdiveni", "Rüzgâr Adaları", "Gökkuşağı Geçidi", "Uçan Bahçe", "Fırtına Hattı", "Güneş Kapısı", "Yıldız Adaları", "Gökyüzü Kulesi", "Usta Parkuru", "Altın Taç"],
];

const subtitles = [
  "Ritmi yakala ve kapıya ulaş.",
  "Boşlukları ölç, doğru anda zıpla.",
  "Yıldızlar yukarıdaki yolu gösteriyor.",
  "Dikenleri tek hamlede aş.",
  "Hareketli yolu sabırla takip et.",
];

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = seed + 0x6d2b79f5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const round = (value: number, step = 1) => Math.round(value / step) * step;

function makeLevel(index: number): Level {
  const random = mulberry32(20260803 + index * 977);
  const chapterIndex = Math.floor(index / 10);
  const stage = index % 10;
  const difficulty = index / (LEVEL_COUNT - 1);
  const requestedWidth = 2250 + chapterIndex * 330 + stage * 115;
  const platforms: Box[] = [];
  let x = 0;
  let island = 0;

  while (x < requestedWidth) {
    const platformWidth = island === 0 ? 530 : round(370 + random() * 180, 10);
    const remaining = requestedWidth - x;
    const width = remaining < 650 ? remaining : platformWidth;
    platforms.push({ x, y: 640, w: Math.max(330, width), h: 110 });
    x += Math.max(330, width);
    if (x >= requestedWidth) break;
    const gap = round(72 + random() * (48 + difficulty * 38), 5);
    x += gap;
    island++;
  }

  const worldWidth = platforms.at(-1)!.x + platforms.at(-1)!.w;
  const ledges: Box[] = [];
  for (let i = 0; i < platforms.length; i++) {
    const ground = platforms[i];
    if ((i + index) % 2 === 0 && ground.w > 400) {
      const ledgeWidth = round(145 + random() * 55, 5);
      const ledgeY = round(465 + random() * 45, 5);
      ledges.push({ x: round(ground.x + 105 + random() * Math.max(30, ground.w - ledgeWidth - 190), 5), y: ledgeY, w: ledgeWidth, h: 25 });
    }
  }
  platforms.push(...ledges);

  const springs: SpringPlant[] = [];
  if (index >= 10) {
    const ground = platforms.filter(p => p.y === 640 && p.x > 450 && p.x < worldWidth - 500);
    const count = Math.min(1 + Math.floor((index - 10) / 14), 3);
    for (let i = 0; i < count && ground.length; i++) {
      const selected = ground[Math.floor((i + 1) * ground.length / (count + 1))];
      springs.push({ x: round(selected.x + selected.w * (.34 + i * .13), 5), y: selected.y, w: 72, power: 1080 + chapterIndex * 45 });
    }
  }

  const spikes: Box[] = [];
  const groundPlatforms = platforms.filter(p => p.y === 640);
  if (index >= 2) {
    groundPlatforms.slice(1, -1).forEach((ground, i) => {
      if ((i + index) % Math.max(2, 4 - Math.floor(difficulty * 2)) !== 0 || ground.w < 390) return;
      const spikeWidth = round(65 + random() * (45 + difficulty * 35), 5);
      let spikeX = round(ground.x + ground.w * (.48 + (random() - .5) * .18), 5);
      const spring = springs.find(s => s.x < ground.x + ground.w && s.x + s.w > ground.x);
      if (spring && Math.abs(spikeX - spring.x) < 130) spikeX = ground.x + 105;
      spikes.push({ x: spikeX, y: 608, w: Math.min(145, spikeWidth), h: 32 });
    });
  }

  const enemies: EnemySpawn[] = [];
  if (index >= 4) {
    groundPlatforms.slice(1, -1).forEach((ground, i) => {
      if ((i * 3 + index) % 4 !== 0 || ground.w < 430) return;
      const min = ground.x + 65;
      const max = ground.x + ground.w - 65;
      enemies.push({ x: round((min + max) / 2, 5), y: 603, min, max, speed: 78 + difficulty * 55 });
    });
  }
  if (index >= 20 && enemies.length === 0) {
    const ground = groundPlatforms.slice(1, -1).find(candidate => {
      const left = candidate.x + 90;
      const right = candidate.x + candidate.w - 90;
      return right - left > 170 && !spikes.some(spike => spike.x < right && spike.x + spike.w > left);
    });
    if (ground) {
      const min = ground.x + 75;
      const max = ground.x + ground.w - 75;
      enemies.push({ x: round((min + max) / 2, 5), y: 603, min, max, speed: 88 + difficulty * 45 });
    }
  }

  const movers: Mover[] = [];
  if (index >= 6) {
    for (let i = 0; i < groundPlatforms.length - 1; i++) {
      if ((i + index) % 4 !== 1) continue;
      const left = groundPlatforms[i];
      const right = groundPlatforms[i + 1];
      const gapStart = left.x + left.w;
      movers.push({ x: gapStart + 8, y: 500 - (i % 2) * 55, w: Math.max(95, right.x - gapStart - 16), h: 24, axis: i % 2 ? "y" : "x", range: 38 + chapterIndex * 8, speed: 1.15 + difficulty * .8, phase: i * .7 });
    }
  }
  if (index >= 20 && movers.length === 0 && groundPlatforms.length > 1) {
    const left = groundPlatforms[0];
    const right = groundPlatforms[1];
    const gapStart = left.x + left.w;
    movers.push({ x: gapStart + 8, y: 500, w: Math.max(95, right.x - gapStart - 16), h: 24, axis: "x", range: 48, speed: 1.35 + difficulty * .7 });
  }

  const starCandidates: Point[] = ledges.map(p => ({ x: p.x + p.w / 2, y: p.y - 55 }));
  springs.forEach(s => starCandidates.push({ x: s.x + s.w / 2, y: s.y - 245 }));
  groundPlatforms.slice(1, -1).forEach(p => starCandidates.push({ x: p.x + p.w * .72, y: 555 }));
  const starIndexes = [Math.floor(starCandidates.length * .18), Math.floor(starCandidates.length * .5), Math.floor(starCandidates.length * .82)];
  const stars = starIndexes.map((candidate, i) => starCandidates[Math.min(starCandidates.length - 1, candidate + i)] || ({ x: 650 + i * 500, y: 540 }));
  const last = groundPlatforms.at(-1)!;

  return {
    number: index + 1,
    chapter: chapterNames[chapterIndex],
    name: names[chapterIndex][stage],
    subtitle: index >= 10 && springs.length ? (stage % 2 ? "Zıplatan bitkiyi kullan, göğe yüksel!" : "Yeşil filiz seni yukarı fırlatır.") : subtitles[(index + chapterIndex) % subtitles.length],
    width: worldWidth,
    start: { x: 110, y: 570 },
    platforms,
    movers,
    springs,
    spikes,
    stars,
    enemies,
    goal: { x: last.x + last.w - 105, y: 550 },
    theme: themes[chapterIndex],
  };
}

export type SolvabilityResult = { ok: boolean; reachablePlatforms: number; reason?: string };

export function analyzeSolvability(level: Level): SolvabilityResult {
  const surfaces = level.platforms.map((platform, index) => ({ ...platform, index })).sort((a, b) => a.x - b.x || a.y - b.y);
  const start = surfaces.findIndex(p => level.start.x >= p.x && level.start.x <= p.x + p.w && level.start.y + BALL_R <= p.y + 10);
  if (start < 0) return { ok: false, reachablePlatforms: 0, reason: "Başlangıç platform üzerinde değil." };
  const reachable = new Set<number>([start]);

  const canJump = (from: Box, to: Box) => {
    if (to.x + to.w < from.x - 30) return false;
    const springPower = level.springs.filter(s => s.x + s.w >= from.x && s.x <= from.x + from.w && Math.abs(s.y - from.y) < 5).reduce((power, spring) => Math.max(power, spring.power), 0);
    const launch = Math.max(JUMP_SPEED, springPower);
    const rise = from.y - to.y;
    const maxRise = launch * launch / (2 * GRAVITY) - 10;
    if (rise > maxRise) return false;
    const verticalDelta = to.y - from.y;
    const discriminant = launch * launch + 2 * GRAVITY * verticalDelta;
    if (discriminant < 0) return false;
    const flight = (launch + Math.sqrt(discriminant)) / GRAVITY;
    const horizontalReach = MAX_RUN_SPEED * flight * .78 + BALL_R * 2;
    const gap = Math.max(0, to.x - (from.x + from.w));
    return gap <= horizontalReach;
  };

  let changed = true;
  while (changed) {
    changed = false;
    for (const fromIndex of [...reachable]) {
      for (let toIndex = 0; toIndex < surfaces.length; toIndex++) {
        if (reachable.has(toIndex)) continue;
        if (canJump(surfaces[fromIndex], surfaces[toIndex])) {
          reachable.add(toIndex);
          changed = true;
        }
      }
    }
  }

  const goalReachable = [...reachable].some(index => {
    const p = surfaces[index];
    return level.goal.x >= p.x - 55 && level.goal.x <= p.x + p.w + 55 && level.goal.y + 90 >= p.y;
  });
  if (!goalReachable) return { ok: false, reachablePlatforms: reachable.size, reason: "Kapıya ulaşan platform zinciri yok." };

  for (const spike of level.spikes) {
    const host = surfaces.find(p => spike.x >= p.x && spike.x + spike.w <= p.x + p.w && Math.abs(spike.y + spike.h - p.y) < 5);
    if (!host || spike.w > 150 || spike.x - host.x < 70 || host.x + host.w - (spike.x + spike.w) < 70) {
      return { ok: false, reachablePlatforms: reachable.size, reason: "Bir diken güvenli sıçrama payını aşıyor." };
    }
  }

  for (const spring of level.springs) {
    const host = surfaces.find(p => spring.x >= p.x && spring.x + spring.w <= p.x + p.w && Math.abs(spring.y - p.y) < 5);
    if (!host) return { ok: false, reachablePlatforms: reachable.size, reason: "Zıplatan bitki platformsuz kaldı." };
  }

  return { ok: true, reachablePlatforms: reachable.size };
}

export const levels: Level[] = Array.from({ length: LEVEL_COUNT }, (_, index) => makeLevel(index));
