export type Box = { x: number; y: number; w: number; h: number };
export type Point = { x: number; y: number };
export type Mover = Box & { axis: "x" | "y"; range: number; speed: number; phase?: number };
export type EnemySpawn = Point & { min: number; max: number; speed?: number };
export type SpringPlant = { x: number; y: number; w: number; power: number };
export type WindZone = Box & { force: number; lift?: number };
export type WaterZone = Box & { buoyancy: number };
export type PortalPair = { a: Point; b: Point; color: string };
export type CrumblePlatform = Box & { delay: number; respawn: number };
export type LavaPool = Box & { wave: number; speed: number; phase?: number };
export type Spinner = Point & { length: number; speed: number; phase?: number };
export type KeyChallenge = "stairs" | "spring" | "lift" | "vault";
export type Theme = { sky: string[]; hill: string; far: string; ground: string; grass: string; accent: string };

export type Level = {
  number: number;
  chapter: string;
  name: string;
  subtitle: string;
  mechanics: string[];
  width: number;
  start: Point;
  platforms: Box[];
  movers: Mover[];
  crumbles: CrumblePlatform[];
  springs: SpringPlant[];
  boosters: Box[];
  ice: Box[];
  windZones: WindZone[];
  waterZones: WaterZone[];
  portals: PortalPair[];
  lava: LavaPool[];
  spinners: Spinner[];
  spikes: Box[];
  stars: Point[];
  enemies: EnemySpawn[];
  key?: Point;
  keyPlatform?: Box;
  keyChallenge?: KeyChallenge;
  gravityScale: number;
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
  { sky: ["#58c9b3", "#eaffd2"], hill: "#278b68", far: "#78c990", ground: "#75543d", grass: "#54b866", accent: "#fff07a" },
  { sky: ["#202734", "#667080"], hill: "#252b39", far: "#3d4657", ground: "#343239", grass: "#77634c", accent: "#ffb43b" },
  { sky: ["#4b1715", "#e85b34"], hill: "#8f271f", far: "#cf4930", ground: "#2d1718", grass: "#f07a35", accent: "#ffd16a" },
  { sky: ["#55d7ed", "#e8fbff"], hill: "#4ca5b7", far: "#8bd4df", ground: "#345a78", grass: "#b9f4ff", accent: "#e8baff" },
  { sky: ["#5a2588", "#f0b2ff"], hill: "#7a3f8e", far: "#d08bc7", ground: "#3e3947", grass: "#ffc83d", accent: "#fff09a" },
];

const chapterNames = [
  "Çayır Rotası", "Zıpzıp Bahçesi", "Mor Gece", "Sıcak Vadi", "Gökyüzü Krallığı",
  "Su Bahçeleri", "Saray Zindanları", "Kor Mağaraları", "Kristal Zirveler", "Altın Taç Kalesi",
];

const names = [
  ["Yeşil Başlangıç", "Kütük Köprüsü", "Orman Basamakları", "Dere Üstü", "Arı Yolu", "Yonca Tepesi", "Rüzgâr Değirmeni", "Göl Kıyısı", "Hız Tüneli", "Çayır Tacı"],
  ["İlk Filiz", "Zıpzıp Bahçesi", "Sarmaşık Sokağı", "Yaprak Asansörü", "Mantar Geçidi", "Çiçek Fırlatıcı", "Bambu Sıçrayışı", "Sera Labirenti", "Polen Fırtınası", "Dev Nilüfer"],
  ["Alacakaranlık", "Ateşböceği Yolu", "Mor Köprü", "Ay Işığı", "Gölge Basamakları", "Baykuş Nöbeti", "Gece Çiçeği", "Yıldız Tüneli", "Sisli Zirve", "Dolunay Kapısı"],
  ["Kızgın Toprak", "Lav Kenarı", "Kanyon Sıçrayışı", "Kızıl Kayalar", "Güneş Tuzağı", "Kuru Nehir", "Ateş Çiçeği", "Çöl Rüzgârı", "Volkan Yolu", "Kor Taç"],
  ["Bulut Merdiveni", "Rüzgâr Adaları", "Gökkuşağı Geçidi", "Uçan Bahçe", "Fırtına Hattı", "Güneş Kapısı", "Yıldız Adaları", "Gökyüzü Kulesi", "Usta Parkuru", "Altın Taç"],
  ["Sığ Havuz", "Nilüfer Yolu", "Su Kemeri", "Çöken İskele", "Derin Bahçe", "Kabarcık Asansörü", "Anahtarlı Havuz", "Şelale Geçidi", "Islak Labirent", "Mercan Tacı"],
  ["Karanlık Kapı", "Meşale Yolu", "Dönen Demir", "Taş Mahzen", "Gizli Anahtar", "Derin Kuyu", "Kilitli Geçit", "Zincir Köprü", "Gölge Portalı", "Zindan Tacı"],
  ["Kızgın Nehir", "Lav Köprüsü", "Erimeyen Kayalar", "Ateş Sıçrayışı", "Kor Tüneli", "Magma Kanyonu", "Püskürme Alanı", "Alev Çemberi", "Kızıl Dev", "Volkanik Taç"],
  ["Mavi Parıltı", "Buzlu Kayalık", "Kristal Portal", "Gök Rüzgârı", "Kaygan Geçit", "Zirve Tırmanışı", "Prizma Yolu", "Uçurum Buzu", "Donmuş Fırtına", "Kristal Taç"],
  ["Saray Kapısı", "Kraliyet Merdiveni", "Büyük Salon", "Asil Parkur", "Altın Geçit", "Zafer Yolu", "Kule Sıçrayışı", "Usta Geçidi", "Son Parkur", "Efsanevi Altın Taç"],
];

const worldSubtitles = [
  "Yuvarlanma, fren ve temiz zıplayış zamanı.",
  "Zıplatan bitkilerle üst rotayı yakala.",
  "Düşük yerçekiminde portalların ritmini çöz.",
  "İvme pistine bas ve lav boşluğunu aş.",
  "Rüzgârı karşına değil arkana al.",
  "Suda yüksel, çöken zeminde oyalanma.",
  "Anahtarı bul, dönen tuzakları geç.",
  "Lav, sıçratıcılar ve alev çemberleri birlikte.",
  "Buzda frene erken bas, kristal portala gir.",
  "Öğrendiğin bütün mekanikler aynı parkurda.",
];

const routes = [
  [640, 640, 610, 580, 610, 640, 620, 640],
  [640, 590, 540, 590, 640, 570, 640, 610, 640],
  [640, 640, 520, 640, 540, 640, 560, 640],
  [640, 600, 560, 520, 560, 600, 640, 580, 640],
  [640, 640, 640, 600, 640, 640, 580, 640, 640],
  [640, 520, 640, 520, 640, 520, 640, 600, 640],
  [520, 560, 600, 640, 600, 560, 520, 600, 640],
  [640, 540, 440, 540, 640, 560, 480, 580, 640],
  [640, 590, 490, 590, 640, 520, 620, 540, 640],
  [640, 520, 620, 480, 590, 510, 640, 530, 610, 640],
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

const legacySubtitles = [
  "Ritmi yakala ve kapıya ulaş.",
  "Boşlukları ölç, doğru anda zıpla.",
  "Yıldızlar yukarıdaki yolu gösteriyor.",
  "Dikenleri tek hamlede aş.",
  "Hareketli yolu sabırla takip et.",
  "Sıçratıcı bitkiyle dev zıplayışı gerçekleştir!",
  "Altın ivme pistini kullan, karşıya uç!",
  "Kilitli kapıyı açmak için altın anahtarı topla!",
  "Zindan tuzaklarına dikkat et, yüksekten uç!",
  "Kraliyet parkurunda tüm yıldızları topla!",
];

const overlapsX = (x: number, w: number, left: number, right: number) => x < right && x + w > left;

function redesignKeyRoute(level: Level, index: number): Level {
  if (!level.key) return level;

  const desiredX = level.width * (.48 + index % 4 * .055);
  const candidates = level.platforms.filter(platform => (
    platform.h >= 60
    && platform.w >= 380
    && platform.x + platform.w / 2 >= level.width * .3
    && platform.x + platform.w / 2 <= level.width * .8
  ));
  const conflictScore = (platform: Box) => {
    const left = platform.x - 45, right = platform.x + platform.w + 45;
    const hazards = level.spikes.filter(item => overlapsX(item.x, item.w, left, right)).length
      + level.enemies.filter(enemy => enemy.min < right && enemy.max > left).length
      + level.springs.filter(item => overlapsX(item.x, item.w, left, right)).length
      + level.boosters.filter(item => overlapsX(item.x, item.w, left, right)).length
      + level.ice.filter(item => overlapsX(item.x, item.w, left, right)).length
      + level.windZones.filter(item => overlapsX(item.x, item.w, left, right)).length * 2
      + level.waterZones.filter(item => overlapsX(item.x, item.w, left, right)).length * 2
      + level.spinners.filter(spinner => spinner.x + spinner.length > left && spinner.x - spinner.length < right).length * 2
      + level.portals.filter(portal => [portal.a, portal.b].some(point => point.x > left && point.x < right)).length * 2;
    return hazards * 10000 + Math.abs(platform.x + platform.w / 2 - desiredX);
  };
  const host = [...candidates].sort((a, b) => conflictScore(a) - conflictScore(b))[0];
  if (!host) return level;

  const left = host.x - 45, right = host.x + host.w + 45;
  const safePlatforms = level.platforms.filter(platform => (
    platform === host || platform.h > 40 || !overlapsX(platform.x, platform.w, left, right)
  ));
  const cleanLevel = {
    ...level,
    platforms: safePlatforms,
    spikes: level.spikes.filter(item => !overlapsX(item.x, item.w, left, right)),
    enemies: level.enemies.filter(enemy => enemy.min >= right || enemy.max <= left),
    springs: level.springs.filter(item => !overlapsX(item.x, item.w, left, right)),
    boosters: level.boosters.filter(item => !overlapsX(item.x, item.w, left, right)),
    ice: level.ice.filter(item => !overlapsX(item.x, item.w, left, right)),
    windZones: level.windZones.filter(item => !overlapsX(item.x, item.w, left, right)),
    waterZones: level.waterZones.filter(item => !overlapsX(item.x, item.w, left, right)),
    spinners: level.spinners.filter(spinner => spinner.x + spinner.length <= left || spinner.x - spinner.length >= right),
    portals: level.portals.filter(portal => [portal.a, portal.b].every(point => point.x <= left || point.x >= right)),
  };
  if (level.windZones.length && !cleanLevel.windZones.length) {
    const route = cleanLevel.platforms.filter(platform => platform.h >= 60).sort((a, b) => a.x - b.x);
    for (let i = 0; i < route.length - 1; i++) {
      const from = route[i], to = route[i + 1];
      const outsideKeyRoom = from.x + from.w < left - 70 || from.x > right + 70;
      const gap = to.x - (from.x + from.w);
      if (!outsideKeyRoom || gap < 25) continue;
      const original = level.windZones[0];
      cleanLevel.windZones.push({
        x: from.x + from.w - 70,
        y: Math.min(from.y, to.y) - 300,
        w: gap + 140,
        h: 300,
        force: original.force,
        lift: original.lift,
      });
      break;
    }
  }

  const challenge = (["stairs", "spring", "lift", "vault"] as const)[index % 4];
  const platform = (x: number, y: number, w: number): Box => ({ x: round(x, 5), y: round(y, 5), w: round(w, 5), h: 24 });
  let keyPlatform: Box;

  if (challenge === "stairs") {
    const step = platform(host.x + 45, host.y - 92, 135);
    keyPlatform = platform(host.x + host.w - 190, host.y - 168, 160);
    cleanLevel.platforms.push(step, keyPlatform);
  } else if (challenge === "spring") {
    const spring = { x: round(host.x + 72, 5), y: host.y, w: 72, power: 1110 + Math.floor(index / 10) * 15 };
    keyPlatform = platform(Math.min(host.x + host.w - 215, spring.x + 95), host.y - 230, 190);
    cleanLevel.springs.push(spring);
    cleanLevel.platforms.push(keyPlatform);
  } else if (challenge === "lift") {
    const liftX = host.x + 55;
    cleanLevel.movers.push({ x: round(liftX, 5), y: host.y - 78, w: 135, h: 22, axis: "y", range: 58, speed: 1.15 + index * .006, phase: index * .37 });
    keyPlatform = platform(host.x + host.w - 195, host.y - 168, 165);
    cleanLevel.platforms.push(keyPlatform);
  } else {
    const lower = platform(host.x + host.w - 175, host.y - 102, 145);
    keyPlatform = platform(host.x + 45, host.y - 174, 175);
    cleanLevel.platforms.push(lower, keyPlatform);
  }

  const key = { x: keyPlatform.x + keyPlatform.w / 2, y: keyPlatform.y - 58 };
  const stars = [...cleanLevel.stars];
  const starIndex = stars.reduce((best, star, candidate) => (
    Math.abs(star.x - key.x) < Math.abs(stars[best].x - key.x) ? candidate : best
  ), 0);
  if (stars.length) stars[starIndex] = { x: key.x, y: key.y - 88 };

  const challengeCopy: Record<KeyChallenge, string> = {
    stairs: "Altın basamakları tırman, anahtarı al ve kapıya ilerle.",
    spring: "Zıplatan bitkiyle anahtar balkonuna çık, sonra kapıya dön.",
    lift: "Hareketli platformu yakala, anahtarı al ve kilidi aç.",
    vault: "Yan odadaki iki basamağı aş, anahtarı al ve kapıya ilerle.",
  };

  return {
    ...cleanLevel,
    key,
    keyPlatform,
    keyChallenge: challenge,
    stars,
    subtitle: challengeCopy[challenge],
    mechanics: Array.from(new Set([...cleanLevel.mechanics, "anahtar odası"])),
  };
}

function makeLegacyLevel(index: number): Level {
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
    x += round(44 + random() * 16, 5);
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
      if (maxOffset > 20) ledges.push({ x: round(ground.x + 140 + random() * maxOffset, 5), y: ledgeY, w: ledgeWidth, h: 25 });
    }
  }
  platforms.push(...ledges);

  const springs: SpringPlant[] = [];
  if (index >= 8) {
    const ground = platforms.filter(p => p.y === 640 && p.x > 400 && p.x < worldWidth - 450);
    const count = Math.min(1 + Math.floor(index / 15), 3);
    for (let i = 0; i < count && ground.length; i++) {
      const selected = ground[Math.floor((i + 1) * ground.length / (count + 1))];
      springs.push({ x: round(selected.x + selected.w * .45, 5), y: selected.y, w: 72, power: 1080 + chapterIndex * 30 });
    }
  }

  const spikes: Box[] = [];
  const groundPlatforms = platforms.filter(p => p.y === 640);
  if (index >= 4) {
    groundPlatforms.slice(2, -1).forEach((ground, i) => {
      if ((i + index) % 5 !== 0 || ground.w < 640) return;
      if (springs.some(s => s.x >= ground.x - 30 && s.x + s.w <= ground.x + ground.w + 30)) return;
      const spikeX = round(ground.x + ground.w * .65, 5);
      if (spikeX >= ground.x + 220 && spikeX + 36 <= ground.x + ground.w - 180) spikes.push({ x: spikeX, y: 608, w: 36, h: 32 });
    });
  }

  const enemies: EnemySpawn[] = [];
  if (index >= 4) {
    groundPlatforms.slice(1, -1).forEach((ground, i) => {
      if ((i * 3 + index) % 4 !== 0 || ground.w < 440) return;
      const min = ground.x + 65, max = ground.x + ground.w - 65;
      enemies.push({ x: round((min + max) / 2, 5), y: 603, min, max, speed: 78 + difficulty * 55 });
    });
  }

  const movers: Mover[] = [];
  if (index >= 6) {
    for (let i = 0; i < groundPlatforms.length - 1; i++) {
      if ((i + index) % 4 !== 1) continue;
      const left = groundPlatforms[i], right = groundPlatforms[i + 1];
      const gapStart = left.x + left.w;
      const moverW = Math.max(140, right.x - gapStart + 35);
      if (moverW <= 280) movers.push({ x: gapStart - 10, y: 640, w: moverW, h: 24, axis: "y", range: 8 + chapterIndex, speed: .8 + difficulty * .2, phase: i * .7 });
    }
  }

  let key: Point | undefined;
  if (index >= 12 && index % 3 === 0) {
    const candidates = groundPlatforms.slice(1, -1).filter(p => !ledges.some(l => l.x - 60 <= p.x + p.w * .4 && p.x + p.w * .4 <= l.x + l.w + 60));
    if (candidates.length) key = { x: round(candidates[0].x + candidates[0].w * .4, 5), y: 585 };
  }

  const boosters: Box[] = [];
  if (index >= 15) {
    groundPlatforms.slice(1, -1).forEach((ground, i) => {
      if ((i + index) % 4 !== 2 || ground.w < 420) return;
      const hasDanger = spikes.some(s => s.x >= ground.x && s.x <= ground.x + ground.w) || springs.some(s => s.x >= ground.x && s.x <= ground.x + ground.w);
      if (!hasDanger) boosters.push({ x: round(ground.x + ground.w * .35, 5), y: 632, w: 110, h: 10 });
    });
  }

  const starCandidates: Point[] = ledges.map(p => ({ x: p.x + p.w / 2, y: p.y - 55 }));
  springs.forEach(s => starCandidates.push({ x: s.x + s.w / 2, y: s.y - 230 }));
  groundPlatforms.slice(1, -1).forEach(p => starCandidates.push({ x: p.x + p.w * .72, y: 555 }));
  const starIndexes = [.18, .5, .82].map(ratio => Math.floor(starCandidates.length * ratio));
  const stars = starIndexes.map((candidate, i) => starCandidates[Math.min(starCandidates.length - 1, candidate + i)] || ({ x: 650 + i * 500, y: 540 }));
  const last = groundPlatforms.at(-1)!;
  let subtitle = legacySubtitles[(index + chapterIndex) % legacySubtitles.length];
  if (key) subtitle = "Kilitli kapıyı açmak için önce altın anahtarı al!";
  else if (boosters.length) subtitle = "Altın ivme pistini kullan, karşıya uç!";
  const mechanics = [springs.length && "zıplatan bitki", boosters.length && "ivme pisti", movers.length && "hareketli platform", key && "anahtar"].filter(Boolean) as string[];

  return redesignKeyRoute({
    number: index + 1,
    chapter: chapterNames[chapterIndex],
    name: names[chapterIndex][stage],
    subtitle,
    mechanics: mechanics.length ? mechanics : ["klasik parkur"],
    width: worldWidth,
    start: { x: 110, y: 570 },
    platforms,
    movers,
    crumbles: [],
    springs,
    boosters,
    ice: [],
    windZones: [],
    waterZones: [],
    portals: [],
    lava: [],
    spinners: [],
    spikes,
    stars,
    enemies,
    key,
    gravityScale: 1,
    goal: { x: last.x + 120, y: 550 },
    theme: themes[chapterIndex],
  }, index);
}

function makeRedesignedLevel(index: number): Level {
  const random = mulberry32(90210 + index * 7919);
  const chapterIndex = Math.floor(index / 10);
  const stage = index % 10;
  const difficulty = index / (LEVEL_COUNT - 1);
  const route: Box[] = [];
  let cursor = 0;

  routes[stage].forEach((y, i, values) => {
    const first = i === 0;
    const last = i === values.length - 1;
    const width = first ? 560 : last ? 640 : round(340 + random() * 180 + chapterIndex * 5, 10);
    route.push({ x: cursor, y, w: width, h: VIEW_H - y + 90 });
    if (!last) cursor += width + round(76 + random() * (48 + difficulty * 25), 5);
  });

  const crumbleIndexes = new Set<number>();
  if (chapterIndex === 5) {
    crumbleIndexes.add(2 + stage % 2);
    if (stage >= 4) crumbleIndexes.add(route.length - 3);
  }
  if (chapterIndex === 9 && stage >= 2) crumbleIndexes.add(2 + stage % Math.max(1, route.length - 4));

  const crumbles: CrumblePlatform[] = [...crumbleIndexes]
    .filter(i => i > 0 && i < route.length - 1)
    .map(i => ({ ...route[i], delay: Math.max(.55, 1.05 - difficulty * .35), respawn: 2.2 }));
  const platforms = route.filter((_, i) => !crumbleIndexes.has(i));

  const ledges: Box[] = [];
  route.slice(1, -1).forEach((ground, i) => {
    if ((i + stage + chapterIndex) % 3 !== 0) return;
    const width = 150 + ((i + stage) % 3) * 20;
    ledges.push({ x: round(ground.x + ground.w * (.32 + random() * .25), 5), y: Math.max(300, ground.y - 125 - (stage % 2) * 20), w: width, h: 24 });
  });
  platforms.push(...ledges);

  const movers: Mover[] = [];
  const springs: SpringPlant[] = [];
  const boosters: Box[] = [];
  const ice: Box[] = [];
  const windZones: WindZone[] = [];
  const waterZones: WaterZone[] = [];
  const portals: PortalPair[] = [];
  const lava: LavaPool[] = [];
  const spinners: Spinner[] = [];
  const spikes: Box[] = [];
  const enemies: EnemySpawn[] = [];
  let gravityScale = 1;
  let key: Point | undefined;

  const safeRoute = (i: number) => route[Math.max(1, Math.min(route.length - 2, i))];
  const addSpring = (i: number, power = 1080) => {
    const p = safeRoute(i);
    springs.push({ x: round(p.x + p.w * .5 - 36, 5), y: p.y, w: 72, power });
  };
  const addBooster = (i: number) => {
    const p = safeRoute(i);
    boosters.push({ x: round(p.x + 55, 5), y: p.y - 8, w: Math.min(135, p.w - 120), h: 10 });
  };
  const addMover = (i: number, axis: "x" | "y" = "y") => {
    const left = route[Math.max(0, Math.min(route.length - 2, i))];
    const right = route[Math.max(1, Math.min(route.length - 1, i + 1))];
    const gapStart = left.x + left.w;
    movers.push({ x: gapStart - 14, y: Math.min(left.y, right.y) - 68, w: Math.max(110, right.x - gapStart + 28), h: 22, axis, range: axis === "y" ? 58 : 42, speed: 1 + difficulty * .8, phase: i * .75 });
  };
  const addWind = (i: number, direction = 1) => {
    const left = route[Math.max(0, Math.min(route.length - 2, i))];
    const right = route[Math.max(1, Math.min(route.length - 1, i + 1))];
    windZones.push({ x: left.x + left.w - 85, y: Math.min(left.y, right.y) - 300, w: right.x - (left.x + left.w) + 170, h: 300, force: direction * (370 + chapterIndex * 20), lift: -80 });
  };
  const addWater = (i: number) => {
    const p = safeRoute(i);
    waterZones.push({ x: p.x + 35, y: Math.max(300, p.y - 190), w: p.w - 70, h: p.y - Math.max(300, p.y - 190) + 45, buoyancy: 1420 });
  };
  const addPortal = (fromIndex: number, toIndex: number, color = "#b66cff") => {
    const from = safeRoute(fromIndex), to = safeRoute(toIndex);
    portals.push({ a: { x: from.x + from.w * .72, y: from.y - 55 }, b: { x: to.x + to.w * .28, y: to.y - 55 }, color });
  };
  const addSpinner = (i: number, speed = 2.1) => {
    const p = safeRoute(i);
    spinners.push({ x: p.x + p.w * .62, y: p.y - 72, length: 58 + stage * 2, speed, phase: i * .8 });
  };
  const addLavaGaps = (every = 1) => {
    for (let i = 0; i < route.length - 1; i += every) {
      const left = route[i], right = route[i + 1];
      lava.push({ x: left.x + left.w, y: 618, w: right.x - (left.x + left.w), h: 130, wave: 9, speed: 2 + difficulty, phase: i * .7 });
    }
  };

  if (chapterIndex === 0) {
    if (stage >= 1) addMover(1 + stage % Math.max(1, route.length - 3), stage % 2 ? "x" : "y");
    if (stage >= 5) addBooster(2 + stage % 3);
  }
  if (chapterIndex === 1) {
    addSpring(1 + stage % 2, 1060 + stage * 18);
    addSpring(route.length - 3, 1100 + stage * 15);
    if (stage >= 5) addWater(3 + stage % 2);
  }
  if (chapterIndex === 2) {
    gravityScale = .58 + stage * .015;
    addMover(1 + stage % 3, "y");
    if (stage >= 1) addPortal(1 + stage % 2, route.length - 3, "#d58cff");
    if (stage >= 6) addWind(3, stage % 2 ? -1 : 1);
  }
  if (chapterIndex === 3) {
    addBooster(1 + stage % 2);
    addBooster(route.length - 3);
    addLavaGaps(stage >= 6 ? 1 : 2);
    if (stage >= 3) addSpinner(3 + stage % 2, 1.8 + stage * .1);
  }
  if (chapterIndex === 4) {
    gravityScale = .84;
    addWind(1 + stage % 2, stage % 3 === 0 ? -1 : 1);
    addWind(route.length - 3, 1);
    addMover(2 + stage % 3, stage % 2 ? "x" : "y");
    if (stage >= 6) addPortal(2, route.length - 2, "#8fe6ff");
  }
  if (chapterIndex === 5) {
    addWater(1 + stage % 3);
    addWater(route.length - 3);
    if (stage >= 5) {
      const p = safeRoute(2 + stage % 3);
      key = { x: p.x + p.w * .55, y: p.y - 58 };
    }
    if (stage >= 7) addSpring(3, 1050);
  }
  if (chapterIndex === 6) {
    const p = safeRoute(1 + stage % 3);
    key = { x: p.x + p.w * .58, y: p.y - 58 };
    addSpinner(2 + stage % 3, 2 + stage * .12);
    if (stage >= 3) addSpinner(route.length - 3, -2.3);
    if (stage >= 5) addPortal(1, route.length - 3, "#ffad45");
  }
  if (chapterIndex === 7) {
    addLavaGaps(1);
    addSpring(2 + stage % 2, 1130 + stage * 14);
    addBooster(route.length - 3);
    if (stage >= 2) addSpinner(3 + stage % 3, 2.2 + stage * .1);
  }
  if (chapterIndex === 8) {
    [1 + stage % 2, 3 + stage % 3, route.length - 2].forEach(i => {
      const p = safeRoute(i);
      ice.push({ x: p.x + 15, y: p.y - 10, w: p.w - 30, h: 10 });
    });
    addWind(2 + stage % 2, stage % 2 ? -1 : 1);
    if (stage >= 2) addPortal(1, route.length - 3, "#68e8ff");
  }
  if (chapterIndex === 9) {
    addBooster(1);
    addSpring(2 + stage % 2, 1120);
    addWind(3 + stage % 2, stage % 3 === 0 ? -1 : 1);
    addSpinner(route.length - 3, 2.3 + stage * .08);
    if (stage >= 2) addLavaGaps(2);
    if (stage >= 3) {
      const p = safeRoute(4);
      ice.push({ x: p.x + 15, y: p.y - 10, w: p.w - 30, h: 10 });
    }
    if (stage >= 4) addPortal(1, route.length - 3, "#ffd84e");
    if (stage >= 5) addWater(3);
    if (stage >= 6) {
      const p = safeRoute(2);
      key = { x: p.x + p.w * .58, y: p.y - 58 };
    }
  }

  route.slice(1, -1).forEach((p, i) => {
    const occupied = springs.some(s => s.x >= p.x && s.x <= p.x + p.w)
      || boosters.some(b => b.x >= p.x && b.x <= p.x + p.w)
      || waterZones.some(w => w.x < p.x + p.w && w.x + w.w > p.x);
    if (!occupied && stage >= 2 && (i + stage + chapterIndex) % 4 === 0 && p.w > 390) {
      spikes.push({ x: round(p.x + p.w * .7, 5), y: p.y - 32, w: 48 + (stage % 3) * 8, h: 32 });
    }
    if (stage >= 3 && (i * 2 + stage + chapterIndex) % 5 === 0 && p.w > 420) {
      const min = p.x + 70, max = p.x + p.w - 70;
      enemies.push({ x: (min + max) / 2, y: p.y - 37, min, max, speed: 76 + difficulty * 65 });
    }
  });

  const starCandidates: Point[] = [];
  ledges.forEach(p => starCandidates.push({ x: p.x + p.w / 2, y: p.y - 52 }));
  route.slice(1, -1).forEach((p, i) => starCandidates.push({ x: p.x + p.w * (i % 2 ? .35 : .7), y: p.y - 62 }));
  portals.forEach(portal => starCandidates.push({ x: portal.b.x, y: portal.b.y - 55 }));
  const picks = [.18, .5, .82].map(ratio => Math.min(starCandidates.length - 1, Math.floor(starCandidates.length * ratio)));
  const stars = picks.map((pick, i) => starCandidates[pick] || ({ x: 700 + i * 650, y: 530 }));
  const last = route.at(-1)!;

  const mechanics: string[] = [];
  if (springs.length) mechanics.push("zıplatan bitki");
  if (boosters.length) mechanics.push("ivme pisti");
  if (movers.length) mechanics.push("hareketli platform");
  if (windZones.length) mechanics.push("rüzgâr");
  if (waterZones.length) mechanics.push("su");
  if (crumbles.length) mechanics.push("çöken zemin");
  if (portals.length) mechanics.push("portal");
  if (lava.length) mechanics.push("lav");
  if (spinners.length) mechanics.push("dönen tuzak");
  if (ice.length) mechanics.push("buz");
  if (key) mechanics.push("anahtar");
  if (gravityScale < .75) mechanics.push("düşük yerçekimi");
  if (!mechanics.length) mechanics.push("klasik parkur");

  return redesignKeyRoute({
    number: index + 1,
    chapter: chapterNames[chapterIndex],
    name: names[chapterIndex][stage],
    subtitle: `${worldSubtitles[chapterIndex]} · ${mechanics.slice(0, 3).join(" + ")}`,
    mechanics,
    width: last.x + last.w,
    start: { x: route[0].x + 105, y: route[0].y - BALL_R },
    platforms,
    movers,
    crumbles,
    springs,
    boosters,
    ice,
    windZones,
    waterZones,
    portals,
    lava,
    spinners,
    spikes,
    stars,
    enemies,
    key,
    gravityScale,
    goal: { x: last.x + last.w - 105, y: last.y - 90 },
    theme: themes[chapterIndex],
  }, index);
}

export type SolvabilityResult = { ok: boolean; reachablePlatforms: number; reason?: string };

export function analyzeSolvability(level: Level): SolvabilityResult {
  const surfaces = [...level.platforms, ...level.crumbles]
    .map((platform, index) => ({ ...platform, index }))
    .sort((a, b) => a.x - b.x || a.y - b.y);
  const start = surfaces.findIndex(p => {
    const fallDistance = p.y - (level.start.y + BALL_R);
    return level.start.x >= p.x && level.start.x <= p.x + p.w && fallDistance >= -12 && fallDistance <= 80;
  });
  if (start < 0) return { ok: false, reachablePlatforms: 0, reason: "Başlangıç platform üzerinde değil." };
  const reachable = new Set<number>([start]);

  const canJump = (from: Box, to: Box) => {
    if (to.x + to.w < from.x - 30) return false;
    const springPower = level.springs.filter(s => s.x + s.w >= from.x && s.x <= from.x + from.w && Math.abs(s.y - from.y) < 5).reduce((power, spring) => Math.max(power, spring.power), 0);
    const launch = Math.max(JUMP_SPEED, springPower);
    const gravity = GRAVITY * level.gravityScale;
    const rise = from.y - to.y;
    if (rise > launch * launch / (2 * gravity) - 10) return false;
    const discriminant = launch * launch + 2 * gravity * (to.y - from.y);
    if (discriminant < 0) return false;
    const flight = (launch + Math.sqrt(discriminant)) / gravity;
    const boosted = level.boosters.some(b => b.x + b.w >= from.x && b.x <= from.x + from.w);
    const horizontalReach = (boosted ? 700 : MAX_RUN_SPEED) * flight * .76 + BALL_R * 2;
    return Math.max(0, to.x - (from.x + from.w)) <= horizontalReach;
  };

  let changed = true;
  while (changed) {
    changed = false;
    for (const fromIndex of [...reachable]) {
      for (let toIndex = 0; toIndex < surfaces.length; toIndex++) {
        if (!reachable.has(toIndex) && canJump(surfaces[fromIndex], surfaces[toIndex])) {
          reachable.add(toIndex);
          changed = true;
        }
      }
    }
  }

  const onReachableSurface = (point: Point, margin = 65) => [...reachable].some(index => {
    const p = surfaces[index];
    return point.x >= p.x - margin && point.x <= p.x + p.w + margin && point.y + 100 >= p.y;
  });
  if (!onReachableSurface(level.goal)) return { ok: false, reachablePlatforms: reachable.size, reason: "Kapıya ulaşan platform zinciri yok." };
  if (level.key && !onReachableSurface(level.key, 35)) return { ok: false, reachablePlatforms: reachable.size, reason: "Anahtar erişilebilir değil." };

  for (const spike of level.spikes) {
    const host = surfaces.find(p => spike.x >= p.x && spike.x + spike.w <= p.x + p.w && Math.abs(spike.y + spike.h - p.y) < 5);
    if (!host || spike.w > 100 || spike.x - host.x < 50 || host.x + host.w - (spike.x + spike.w) < 50) {
      return { ok: false, reachablePlatforms: reachable.size, reason: "Bir diken güvenli sıçrama payını aşıyor." };
    }
  }
  for (const spring of level.springs) {
    if (!surfaces.some(p => spring.x >= p.x && spring.x + spring.w <= p.x + p.w && Math.abs(spring.y - p.y) < 5)) {
      return { ok: false, reachablePlatforms: reachable.size, reason: "Zıplatan bitki platformsuz kaldı." };
    }
  }
  for (const strip of [...level.boosters, ...level.ice]) {
    if (!surfaces.some(p => strip.x >= p.x && strip.x + strip.w <= p.x + p.w && Math.abs(strip.y + strip.h - p.y) < 5)) {
      return { ok: false, reachablePlatforms: reachable.size, reason: "Bir yüzey mekaniği platformsuz kaldı." };
    }
  }

  return { ok: true, reachablePlatforms: reachable.size };
}

export function makeLevel(index: number): Level {
  return index < 50 ? makeLegacyLevel(index) : makeRedesignedLevel(index);
}

export const levels: Level[] = Array.from({ length: LEVEL_COUNT }, (_, index) => makeLevel(index));
