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
  key?: Point;
  boosters?: Box[];
  goal: Point;
  theme: Theme;
};

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const BALL_R = 27;
export const GRAVITY = 1900;
export const JUMP_SPEED = 840;
export const MAX_RUN_SPEED = 430;
export const LEVEL_COUNT = 100;

const themes: Theme[] = [
  { sky: ["#76d8ff", "#e7fbff"], hill: "#6ac77a", far: "#a5e2a8", ground: "#8a542d", grass: "#49ac55", accent: "#ffd646" },
  { sky: ["#69cfff", "#fff2c2"], hill: "#e6a949", far: "#f3ce74", ground: "#8b5538", grass: "#67b04a", accent: "#ffcc32" },
  { sky: ["#9fe8ff", "#e8fff2"], hill: "#57bfa0", far: "#a0dfbd", ground: "#77503b", grass: "#44a879", accent: "#ffe165" },
  { sky: ["#7d91ff", "#f2c5ff"], hill: "#7656a6", far: "#aa8ac8", ground: "#5f4465", grass: "#835faa", accent: "#ffe15b" },
  { sky: ["#ff9b69", "#ffe3a8"], hill: "#c55d4a", far: "#e98d65", ground: "#713e34", grass: "#cb6a42", accent: "#fff071" },
  { sky: ["#4fc3f7", "#e1f5fe"], hill: "#388e3c", far: "#81c784", ground: "#5d4037", grass: "#2e7d32", accent: "#fbc02d" },
  { sky: ["#263238", "#455a64"], hill: "#1a237e", far: "#3949ab", ground: "#212121", grass: "#4e342e", accent: "#ff6f00" },
  { sky: ["#3e2723", "#bf360c"], hill: "#d84315", far: "#ff7043", ground: "#1b0000", grass: "#e65100", accent: "#ffb300" },
  { sky: ["#006064", "#80deea"], hill: "#0097a7", far: "#4dd0e1", ground: "#1a237e", grass: "#00bcd4", accent: "#e040fb" },
  { sky: ["#4a148c", "#ea80fc"], hill: "#ffb300", far: "#ffe082", ground: "#37474f", grass: "#ffc107", accent: "#ffd700" },
];

const chapterNames = [
  "Çayır Rotası", "Zıpzıp Bahçesi", "Mor Gece", "Sıcak Vadi", "Gökyüzü Krallığı",
  "Kraliyet Bahçesi", "Saray Zindanları", "Kor Mağaraları", "Kristal Zirveler", "Altın Taç Kalesi"
];

const names = [
  ["Yeşil Başlangıç", "Kütük Köprüsü", "Orman Basamakları", "Dere Üstü", "Arı Yolu", "Yonca Tepesi", "Rüzgâr Değirmeni", "Göl Kıyısı", "Hız Tüneli", "Çayır Tacı"],
  ["İlk Filiz", "Zıpzıp Bahçesi", "Sarmaşık Sokağı", "Yaprak Asansörü", "Mantar Geçidi", "Çiçek Fırlatıcı", "Bambu Sıçrayışı", "Sera Labirenti", "Polen Fırtınası", "Dev Nilüfer"],
  ["Alacakaranlık", "Ateşböceği Yolu", "Mor Köprü", "Ay Işığı", "Gölge Basamakları", "Baykuş Nöbeti", "Gece Çiçeği", "Yıldız Tüneli", "Sisli Zirve", "Dolunay Kapısı"],
  ["Kızgın Toprak", "Lav Kenarı", "Kanyon Sıçrayışı", "Kızıl Kayalar", "Güneş Tuzağı", "Kuru Nehir", "Ateş Çiçeği", "Çöl Rüzgârı", "Volkan Yolu", "Kor Taç"],
  ["Bulut Merdiveni", "Rüzgâr Adaları", "Gökkuşağı Geçidi", "Uçan Bahçe", "Fırtına Hattı", "Güneş Kapısı", "Yıldız Adaları", "Gökyüzü Kulesi", "Usta Parkuru", "Altın Taç"],
  ["Zümrüt Giriş", "Saray Çeşmesi", "Gül Patikası", "Kraliyet Asansörü", "Asil Yapraklar", "Mermer Basamaklar", "Teras Sıçrayışı", "Çit Labirenti", "Saray Rüzgârı", "Zümrüt Taç"],
  ["Karanlık Kapı", "Meşale Yolu", "Demir Tuzak", "Taş Mahzen", "Zindan Sıçrayışı", "Derin Kuyu", "Kilitli Geçit", "Zincir Köprü", "Gölge Koridoru", "Karanlık Taç"],
  ["Kızgın Nehir", "Lav Köprüsü", "Erimesiz Kayalar", "Ateş Sıçrayışı", "Kor Tüneli", "Magma Kanyonu", "Püskürme Alanı", "Sıcak Rüzgâr", "Kızıl Dev", "Volkanik Taç"],
  ["Mavi Parıltı", "Buzlu Kayalık", "Kristal Asansör", "Gök Rüzgârı", "Işık Geçidi", "Zirve Tırmanışı", "Prizma Yolu", "Uçurum Atlayışı", "Buz Sıçrayışı", "Kristal Taç"],
  ["Saray Kapısı", "Kraliyet Merdiveni", "Büyük Salon", "Asil Parkur", "Altın Geçit", "Zafer Yolu", "Kule Sıçrayışı", "Usta Geçidi", "Son Parkur", "Efsanevi Altın Taç"]
];

const subtitles = [
  "Ritmi yakala ve kapıya ulaş.",
  "Boşlukları ölç, doğru anda zıpla.",
  "Yıldızlar yukarıdaki yolu gösteriyor.",
  "Dikenleri tek hamlede aş.",
  "Hareketli yolu sabırla takip et.",
  "Sıçratıcı bitkiyle dev zıplayışı gerçekleştir!",
  "Altın ivme pistini kullan, karşıya uç!",
  "Kilitli kapıyı açmak için altın anahtarı topla!",
  "Zindan tuzaklarına dikkat et, yüksekten uç!",
  "Kraliyet parkurunda tüm yıldızları topla!"
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

export function makeLevel(index: number): Level {
  const random = mulberry32(20260803 + index * 977);
  const chapterIndex = Math.floor(index / 10);
  const stage = index % 10;
  const difficulty = index / (LEVEL_COUNT - 1);
  const requestedWidth = 2200 + chapterIndex * 250 + stage * 100;
  const platforms: Box[] = [];
  let x = 0;
  let island = 0;

  while (x < requestedWidth) {
    const platformWidth = island === 0 ? 550 : round(420 + random() * 160, 10);
    const remaining = requestedWidth - x;
    const width = remaining < 600 ? remaining : platformWidth;
    platforms.push({ x, y: 640, w: Math.max(380, width), h: 110 });
    x += Math.max(380, width);
    if (x >= requestedWidth) break;
    const gap = round(44 + random() * 16, 5);
    x += gap;
    island++;
  }

  const worldWidth = platforms.at(-1)!.x + platforms.at(-1)!.w;
  const ledges: Box[] = [];
  for (let i = 0; i < platforms.length; i++) {
    const ground = platforms[i];
    if ((i + index) % 2 === 0 && ground.w > 480) {
      const ledgeWidth = round(140 + random() * 40, 5);
      const ledgeY = round(450 + random() * 30, 5);
      const maxOffset = ground.w - ledgeWidth - 280;
      if (maxOffset > 20) {
        ledges.push({ x: round(ground.x + 140 + random() * maxOffset, 5), y: ledgeY, w: ledgeWidth, h: 25 });
      }
    }
  }
  platforms.push(...ledges);

  const springs: SpringPlant[] = [];
  if (index >= 8) {
    const ground = platforms.filter(p => p.y === 640 && p.x > 400 && p.x < worldWidth - 450);
    const count = Math.min(1 + Math.floor(index / 15), 3);
    for (let i = 0; i < count && ground.length; i++) {
      const selected = ground[Math.floor((i + 1) * ground.length / (count + 1))];
      const power = 1080 + chapterIndex * 30;
      springs.push({ x: round(selected.x + selected.w * .45, 5), y: selected.y, w: 72, power });
    }
  }

  const spikes: Box[] = [];
  const groundPlatforms = platforms.filter(p => p.y === 640);
  if (index >= 4) {
    groundPlatforms.slice(2, -1).forEach((ground, i) => {
      if ((i + index) % 5 !== 0 || ground.w < 640) return;
      const hasSpring = springs.some(s => s.x >= ground.x - 30 && s.x + s.w <= ground.x + ground.w + 30);
      if (hasSpring) return;
      const spikeWidth = 36;
      const spikeX = round(ground.x + ground.w * .65, 5);
      if (spikeX >= ground.x + 220 && spikeX + spikeWidth <= ground.x + ground.w - 180) {
        spikes.push({ x: spikeX, y: 608, w: spikeWidth, h: 32 });
      }
    });
  }

  const enemies: EnemySpawn[] = [];
  if (index >= 4) {
    groundPlatforms.slice(1, -1).forEach((ground, i) => {
      if ((i * 3 + index) % 4 !== 0 || ground.w < 440) return;
      const min = ground.x + 65;
      const max = ground.x + ground.w - 65;
      enemies.push({ x: round((min + max) / 2, 5), y: 603, min, max, speed: 78 + difficulty * 55 });
    });
  }

  const movers: Mover[] = [];
  if (index >= 6) {
    for (let i = 0; i < groundPlatforms.length - 1; i++) {
      if ((i + index) % 4 !== 1) continue;
      const left = groundPlatforms[i];
      const right = groundPlatforms[i + 1];
      const gapStart = left.x + left.w;
      const gapW = right.x - gapStart;
      const moverW = Math.max(140, gapW + 35);
      if (moverW <= 280) {
        movers.push({
          x: gapStart - 10,
          y: 640,
          w: moverW,
          h: 24,
          axis: "y",
          range: 8 + chapterIndex,
          speed: .8 + difficulty * .2,
          phase: i * .7
        });
      }
    }
  }

  let key: Point | undefined = undefined;
  if (index >= 12 && (index % 3 === 0 || index >= 50)) {
    const candidateGround = groundPlatforms.slice(1, -1).filter(p => !ledges.some(l => l.x - 60 <= p.x + p.w * .4 && p.x + p.w * .4 <= l.x + l.w + 60));
    if (candidateGround.length > 0) {
      const keyGround = candidateGround[0];
      key = { x: round(keyGround.x + keyGround.w * .4, 5), y: 585 };
    }
  }

  const boosters: Box[] = [];
  if (index >= 15) {
    groundPlatforms.slice(1, -1).forEach((ground, i) => {
      if ((i + index) % 4 === 2 && ground.w >= 420) {
        const hasDanger = spikes.some(s => s.x >= ground.x && s.x <= ground.x + ground.w) || springs.some(s => s.x >= ground.x && s.x <= ground.x + ground.w);
        if (!hasDanger) {
          boosters.push({ x: round(ground.x + ground.w * .35, 5), y: 632, w: 110, h: 10 });
        }
      }
    });
  }

  const starCandidates: Point[] = ledges.map(p => ({ x: p.x + p.w / 2, y: p.y - 55 }));
  springs.forEach(s => starCandidates.push({ x: s.x + s.w / 2, y: s.y - 230 }));
  groundPlatforms.slice(1, -1).forEach(p => starCandidates.push({ x: p.x + p.w * .72, y: 555 }));
  const starIndexes = [Math.floor(starCandidates.length * .18), Math.floor(starCandidates.length * .5), Math.floor(starCandidates.length * .82)];
  const stars = starIndexes.map((candidate, i) => starCandidates[Math.min(starCandidates.length - 1, candidate + i)] || ({ x: 650 + i * 500, y: 540 }));
  const last = groundPlatforms.at(-1)!;

  let subtitleText = subtitles[(index + chapterIndex) % subtitles.length];
  if (key) {
    subtitleText = "Kilitli kapıyı açmak için önce altın anahtarı al!";
  } else if (boosters.length > 0) {
    subtitleText = "Altın ivme pistini kullan, karşıya uç!";
  }

  return {
    number: index + 1,
    chapter: chapterNames[chapterIndex],
    name: names[chapterIndex][stage],
    subtitle: subtitleText,
    width: worldWidth,
    start: { x: 110, y: 570 },
    platforms,
    movers,
    springs,
    spikes,
    stars,
    enemies,
    key,
    boosters,
    goal: { x: last.x + 120, y: 550 },
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
    if (!host || spike.w > 150 || spike.x - host.x < 55 || host.x + host.w - (spike.x + spike.w) < 55) {
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
