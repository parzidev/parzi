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
export type Conveyor = Box & { speed: number };
export type PhasePlatform = Box & { activeTime: number; inactiveTime: number; phase?: number; oneWay?: boolean };
export type LaserGate = { x: number; y: number; h: number; activeTime: number; inactiveTime: number; phase?: number };
export type GravityZone = Box & { scale: number };
export type KeyChallenge = "stairs" | "spring" | "lift" | "vault";
export type Theme = { sky: string[]; hill: string; far: string; ground: string; grass: string; accent: string };
export type SpikeChaser = {
  startGap: number;
  respawnGap: number;
  speed: number;
  acceleration: number;
  maxSpeed: number;
  maxGap: number;
  graceTime: number;
  width: number;
  beats?: Array<{
    at: number;
    kind: "surge" | "breather";
    duration: number;
    multiplier: number;
  }>;
};

export type SeesawBoard = Box & { pivotX: number; maxAngle: number; response: number; damping: number };
export type WallJumpWall = Box & { side: "left" | "right" | "both" };
export type PushBlock = Box & { minX: number; maxX: number; pushAcceleration: number; maxSpeed: number };
export type PressurePlate = Box & { gateId: string };
export type PressureGate = Box & { id: string; openOffset: Point };
export type BreakableWall = Box & { minImpactSpeed: number; debrisCount: number };
export type SwingAnchor = Point & { length: number; catchRadius: number; torque: number; releaseBoost: number };
export type ZiplineCable = { a: Point; b: Point; catchRadius: number; speed: number };
export type ElasticSurface = Box & { restitution: number; minBounce: number; maxBounce: number };
export type RisingWaterCourse = {
  basin: Box;
  surfaceStartY: number;
  surfaceEndY: number;
  riseSpeed: number;
  buoyancy: number;
  airPockets: Box[];
};
export type MagnetNode = Point & { radius: number; strength: number; polarity: 1 | -1 };
export type MagnetPad = Box & { polarity: 1 | -1 };
export type GravityFlipPad = Box & { gravity: 1 | -1 };
export type GearPlatform = Point & { radius: number; speed: number; phase: number; teeth: number; toothWidth: number; toothHeight: number };
export type Piston = Box & {
  axis: "x" | "y";
  travel: number;
  extendTime: number;
  holdTime: number;
  retractTime: number;
  phase: number;
  lethal: boolean;
};
export type MomentumPortal = PortalPair & { aNormal: Point; bNormal: Point; speedMultiplier: number };
export type PhaseSwitchPad = Box & { phase: "a" | "b" };
export type PhaseSwitchPlatform = Box & { phase: "a" | "b" };
export type EchoGate = Box & { id: string };
export type EchoPlate = Box & { gateId: string };
export type CollapseTile = Box & { order: number };
export type BossPhase = { triggerX: number; pattern: "shockwave" | "echo" | "portal"; interval: number };

export type SpecialLevelSpec =
  | { kind: "seesaw"; boards: SeesawBoard[] }
  | { kind: "oneWay"; surfaces: Box[] }
  | { kind: "wallJump"; walls: WallJumpWall[]; horizontalSpeed: number; verticalSpeed: number; coyoteTime: number }
  | { kind: "pushBlock"; blocks: PushBlock[] }
  | { kind: "pressureGate"; blocks: PushBlock[]; plates: PressurePlate[]; gates: PressureGate[] }
  | { kind: "breakableWall"; walls: BreakableWall[] }
  | { kind: "swing"; anchors: SwingAnchor[] }
  | { kind: "zipline"; cables: ZiplineCable[] }
  | { kind: "elastic"; surfaces: ElasticSurface[] }
  | { kind: "risingWater"; course: RisingWaterCourse }
  | { kind: "magnet"; nodes: MagnetNode[]; pads: MagnetPad[]; initialPolarity: 1 | -1 }
  | { kind: "gravityFlip"; pads: GravityFlipPad[]; initialGravity: 1 | -1 }
  | { kind: "gears"; gears: GearPlatform[] }
  | { kind: "pistons"; pistons: Piston[] }
  | { kind: "momentumPortal"; pairs: MomentumPortal[] }
  | { kind: "phaseSwitch"; pads: PhaseSwitchPad[]; platforms: PhaseSwitchPlatform[]; initialPhase: "a" | "b" }
  | { kind: "echo"; trigger: Box; delay: number; duration: number; sampleRate: number; plates: EchoPlate[]; gates: EchoGate[] }
  | { kind: "timeFreeze"; triggers: Box[]; duration: number; affected: Array<"movers" | "spinners" | "laserGates" | "pistons"> }
  | { kind: "collapse"; trigger: Box; tiles: CollapseTile[]; leadTime: number; interval: number; permanent: boolean }
  | {
    kind: "boss";
    arena: Box;
    center: Point;
    phases: BossPhase[];
    goalLock: Box;
    shockwaveSpeed: number;
    shockwaveWidth: number;
  };

export type Level = {
  number: number;
  chapter: string;
  name: string;
  subtitle: string;
  note?: string;
  quake?: boolean;
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
  conveyors: Conveyor[];
  phasePlatforms: PhasePlatform[];
  laserGates: LaserGate[];
  gravityZones: GravityZone[];
  checkpoints: Point[];
  spikes: Box[];
  stars: Point[];
  enemies: EnemySpawn[];
  key?: Point;
  keyPlatform?: Box;
  keyChallenge?: KeyChallenge;
  gravityScale: number;
  goal: Point;
  theme: Theme;
  chaser?: SpikeChaser;
  special?: SpecialLevelSpec;
};

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const BALL_R = 27;
export const GRAVITY = 1900;
export const JUMP_SPEED = 840;
export const MAX_RUN_SPEED = 430;
export const LEVEL_COUNT = 220;

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
  { sky: ["#ffd9a8", "#fff7dc"], hill: "#ce7d49", far: "#efb86d", ground: "#6f4933", grass: "#e39d3e", accent: "#fff28a" },
  { sky: ["#b9f1dd", "#f5fff2"], hill: "#4ca97c", far: "#88d2a4", ground: "#4f624b", grass: "#75c96b", accent: "#ffe36a" },
  { sky: ["#ffc8ba", "#fff1d9"], hill: "#c85e57", far: "#e58b73", ground: "#5f3f42", grass: "#f29b55", accent: "#fff08b" },
  { sky: ["#c9c4ff", "#f7ecff"], hill: "#766cc3", far: "#aaa0df", ground: "#4d4969", grass: "#a88bd6", accent: "#ffe56f" },
  { sky: ["#99e3e8", "#f1fff8"], hill: "#3f9b9c", far: "#80c9bd", ground: "#416169", grass: "#65c6a6", accent: "#fff082" },
  { sky: ["#f7c994", "#fff4cf"], hill: "#b46e3f", far: "#df9f5c", ground: "#65432f", grass: "#d8873f", accent: "#fff38d" },
  { sky: ["#d5b9f4", "#fff0fa"], hill: "#8659a6", far: "#bd8dcc", ground: "#56425e", grass: "#b979b7", accent: "#ffe374" },
  { sky: ["#9ccff2", "#eefaff"], hill: "#497ea8", far: "#78afd0", ground: "#40586b", grass: "#69b5bd", accent: "#fff18a" },
  { sky: ["#f5b7c9", "#fff0d5"], hill: "#a84f72", far: "#d27f91", ground: "#563d50", grass: "#cf7c73", accent: "#ffe66d" },
  { sky: ["#ffcf74", "#fff6cf"], hill: "#c36b37", far: "#efa957", ground: "#503b3b", grass: "#e89338", accent: "#fff7a0" },
  { sky: ["#d9c8ff", "#fff4fb"], hill: "#8f79c5", far: "#c6a9dc", ground: "#5d526d", grass: "#8bcf9d", accent: "#fff39a" },
  { sky: ["#ffb7c9", "#fff2d9"], hill: "#ad4f68", far: "#df8492", ground: "#67404b", grass: "#d87878", accent: "#ffd66e" },
];

const chapterNames = [
  "Çayır Rotası", "Zıpzıp Bahçesi", "Mor Gece", "Sıcak Vadi", "Gökyüzü Krallığı",
  "Su Bahçeleri", "Saray Zindanları", "Kor Mağaraları", "Kristal Zirveler", "Altın Taç Kalesi",
  "Dişli Şehir", "Faz Ormanı", "Işık Metrosu", "Yerçekimi İstasyonu", "Zaman Tapınağı",
  "Rüzgâr Fabrikası", "Işık Labirenti", "Kozmik Maden", "Saat Kulesi", "Sonsuzluk Sarayı",
  "Rüya Bahçesi", "Kalp Sarayı",
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
  ["İlk Dişli", "Bant Sokağı", "Bakır Köprü", "Piston Geçidi", "Çark Meydanı", "Hız Atölyesi", "Dişli Kule", "Makine Rotası", "Usta Vardiyası", "Şehir Çekirdeği"],
  ["Soluk Patika", "Kaybolan Basamak", "Gölge Korusu", "Faz Köprüsü", "Sisli Katman", "Kayan Gerçeklik", "İkiz Boyut", "Hayalet Yol", "Kırık Zaman", "Orman Çekirdeği"],
  ["İlk Işın", "Kırmızı Hat", "Prizma Durağı", "Kesik Tünel", "Işık Makası", "Bekleme Peronu", "Ayna Geçidi", "Foton Hattı", "Son Sefer", "Metro Çekirdeği"],
  ["Hafif Adım", "Çekim Odası", "Yörünge Yolu", "Ters Akım", "Boşluk İstasyonu", "Ağırlık Sınavı", "Uydu Geçidi", "Kütle Merkezi", "Derin Yörünge", "İstasyon Çekirdeği"],
  ["İlk Tik", "Sarkaç Avlusu", "Kaybolan Saniye", "Zaman Kapısı", "Duran Koridor", "Hızlı Dakika", "Kum Saati", "Geçmiş Köprü", "Gelecek Odası", "Tapınak Çekirdeği"],
  ["İlk Vardiya", "Bant Fırtınası", "Pervane Salonu", "Basınç Hattı", "Hava Kanalı", "Ters Üretim", "Kasırga Bandı", "Uçan Atölye", "Son Makine", "Fabrika Çekirdeği"],
  ["Sessiz Işık", "Keskin Köşe", "Işın Bulmacası", "Fazlı Duvar", "Kayıp Koridor", "Parlak Tuzak", "Prizma Odası", "Kırık Ayna", "Usta Labirent", "Labirent Çekirdeği"],
  ["Yıldız Tozu", "Hafif Maden", "Meteor Bandı", "Kristal Çekim", "Boşluk Ocağı", "Kozmik Tünel", "Uydu Madeni", "Karanlık Cevher", "Galaksi Damarı", "Maden Çekirdeği"],
  ["İlk Çan", "Dişli Akrep", "Saniye Köprüsü", "Fazlı Kadran", "Lazer Saati", "Çekim Sarkacı", "Kayıp Vakit", "Gece Yarısı", "Son Geri Sayım", "Kule Çekirdeği"],
  ["Sonsuz Kapı", "Bitmeyen Bant", "Yitik Faz", "Taç Işını", "Kozmik Salon", "Zaman Bahçesi", "Usta Yörünge", "Sonsuz Koridor", "Son Sınav", "Efsanevi Sonsuzluk Tacı"],
  ["Uyanan Çiçek", "Bulut Çardağı", "Fısıltı Korusu", "Ayçiçeği Salıncağı", "Uyuyan Nilüfer", "Rüya Köprüsü", "Masal Pınarı", "Yıldız Serası", "Şafak Labirenti", "Düş Bahçesi Tacı"],
  ["Kalbe Açılan Kapı", "Gül Galerisi", "Altın Mektup", "Hatıra Balkonu", "İki Kalp Köprüsü", "Saklı Sözler", "Barış Avlusu", "Sonsuz Dans", "Sevgi Tahtı", "Kalbin Efsanevi Tacı"],
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
  "Yürüyen bantların yönünü okuyup kontrol noktasına ulaş.",
  "Faz platformlarının görünme ritmini yakala.",
  "Lazer söndüğünde geç, bant hızını lehine kullan.",
  "Yerçekimi alanlarında zıplama süreni yeniden ölç.",
  "Zamanlanan platform ve lazerleri sabırla çöz.",
  "Bant, rüzgâr ve çekim akışını tek harekette birleştir.",
  "Işık kapılarıyla faz yollarının ortak ritmini bul.",
  "Kozmik çekimde hızını koru, lav boşluklarını aş.",
  "Kontrol noktalarını yakala, saatin tuzaklarını geç.",
  "İki yüz bölümde öğrendiğin her şeyi taç yolunda birleştir.",
  "Sabit çiçek adalarında ilerle, rüyanın değişen yollarını keşfet.",
  "Kalbin ritmini izle; ışık, hız ve cesareti son taçta birleştir.",
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
  cleanLevel.portals = cleanLevel.portals.filter(portal => {
    const left = Math.min(portal.a.x, portal.b.x);
    const right = Math.max(portal.a.x, portal.b.x);
    return key.x <= left || key.x >= right;
  });
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
  const difficulty = index / 99;
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
    conveyors: [],
    phasePlatforms: [],
    laserGates: [],
    gravityZones: [],
    checkpoints: [],
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
  const difficulty = index / 99;
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
    note: index === 65 ? "Keşke bunu düzelttiğim gibi aramızı da düzeltebilsem." : undefined,
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
    conveyors: [],
    phasePlatforms: [],
    laserGates: [],
    gravityZones: [],
    checkpoints: [],
    spikes,
    stars,
    enemies,
    key,
    gravityScale,
    goal: { x: last.x + last.w - 105, y: last.y - 90 },
    theme: themes[chapterIndex],
  }, index);
}

export function isPhasePlatformActive(platform: PhasePlatform, time: number) {
  const cycle = platform.activeTime + platform.inactiveTime;
  return cycle <= 0 || (time + (platform.phase || 0)) % cycle < platform.activeTime;
}

export function isLaserGateActive(gate: LaserGate, time: number) {
  const cycle = gate.activeTime + gate.inactiveTime;
  return cycle > 0 && (time + (gate.phase || 0)) % cycle < gate.activeTime;
}

function makeExpansionLevel(index: number): Level {
  const expansionIndex = index - 100;
  const world = Math.floor(expansionIndex / 10);
  const stage = expansionIndex % 10;
  const chapterIndex = 10 + world;
  const difficulty = expansionIndex / 99;
  const random = mulberry32(770031 + expansionIndex * 104729);
  const pattern = routes[(stage * 3 + world) % routes.length];
  const route: Box[] = [];
  let cursor = 0;
  let previousY = 640;

  pattern.forEach((rawY, i) => {
    const first = i === 0;
    const last = i === pattern.length - 1;
    let y = first || last ? 640 : round(Math.max(470, Math.min(640, rawY + ((world + stage) % 3 - 1) * 15)), 5);
    if (previousY - y > 155) y = previousY - 155;
    const width = first ? 590 : last ? 690 : round(380 + random() * 175 + world * 4, 10);
    route.push({ x: cursor, y, w: width, h: VIEW_H - y + 90 });
    previousY = y;
    if (!last) cursor += width + round(72 + random() * 43, 5);
  });

  const platforms = [...route];
  const ledges: Box[] = [];
  route.slice(1, -1).forEach((platform, i) => {
    if ((i + stage + world) % 3 !== 0) return;
    const ledge = {
      x: round(platform.x + 95 + random() * Math.max(30, platform.w - 300), 5),
      y: Math.max(300, platform.y - 135 - (stage % 2) * 15),
      w: 155 + ((i + world) % 3) * 20,
      h: 24,
    };
    ledges.push(ledge);
  });
  platforms.push(...ledges);

  const movers: Mover[] = [];
  const crumbles: CrumblePlatform[] = [];
  const springs: SpringPlant[] = [];
  const boosters: Box[] = [];
  const ice: Box[] = [];
  const windZones: WindZone[] = [];
  const waterZones: WaterZone[] = [];
  const portals: PortalPair[] = [];
  const lava: LavaPool[] = [];
  const spinners: Spinner[] = [];
  const conveyors: Conveyor[] = [];
  const phasePlatforms: PhasePlatform[] = [];
  const laserGates: LaserGate[] = [];
  const gravityZones: GravityZone[] = [];
  const checkpoints: Point[] = [];
  const spikes: Box[] = [];
  const enemies: EnemySpawn[] = [];

  const safeRoute = (i: number) => route[Math.max(1, Math.min(route.length - 2, i))];
  const addConveyor = (i: number, direction = 1) => {
    const p = safeRoute(i);
    conveyors.push({ x: p.x + 80, y: p.y - 10, w: Math.min(210, p.w - 160), h: 10, speed: direction * (230 + stage * 14 + world * 5) });
  };
  const addPhase = (i: number) => {
    const p = safeRoute(i);
    phasePlatforms.push({ x: round(p.x + p.w * .5 - 95, 5), y: Math.max(285, p.y - 185), w: 190, h: 22, activeTime: 1.65 + stage * .04, inactiveTime: 1.05 + world * .035, phase: (i + stage) * .37 });
  };
  const addLaser = (i: number) => {
    const p = safeRoute(i);
    laserGates.push({ x: round(p.x + p.w * .68, 5), y: p.y - 160, h: 160, activeTime: 1.1 + stage * .035, inactiveTime: 1.25, phase: (i + world) * .43 });
  };
  const addGravity = (i: number, scale = .58) => {
    const left = route[Math.max(0, Math.min(route.length - 2, i))];
    const right = route[Math.max(1, Math.min(route.length - 1, i + 1))];
    gravityZones.push({ x: left.x + left.w - 70, y: Math.min(left.y, right.y) - 310, w: right.x - (left.x + left.w) + 140, h: 325, scale });
  };
  const addCheckpoint = (i: number) => {
    const p = safeRoute(i);
    checkpoints.push({ x: p.x + 92, y: p.y - BALL_R });
  };
  const addSpring = (i: number, power = 1080) => {
    const p = safeRoute(i);
    springs.push({ x: round(p.x + p.w * .45, 5), y: p.y, w: 72, power });
  };
  const addBooster = (i: number) => {
    const p = safeRoute(i);
    boosters.push({ x: p.x + p.w - 205, y: p.y - 8, w: 135, h: 10 });
  };
  const addWind = (i: number, direction = 1) => {
    const left = route[Math.max(0, Math.min(route.length - 2, i))];
    const right = route[Math.max(1, Math.min(route.length - 1, i + 1))];
    windZones.push({ x: left.x + left.w - 80, y: Math.min(left.y, right.y) - 285, w: right.x - (left.x + left.w) + 160, h: 300, force: direction * (410 + world * 15), lift: -75 });
  };
  const addWater = (i: number) => {
    const p = safeRoute(i);
    const top = Math.max(310, p.y - 170);
    waterZones.push({ x: p.x + 45, y: top, w: p.w - 90, h: p.y - top + 35, buoyancy: 1400 });
  };
  const addPortal = (fromIndex: number, toIndex: number) => {
    const from = safeRoute(fromIndex), to = safeRoute(toIndex);
    portals.push({ a: { x: from.x + from.w * .3, y: from.y - 55 }, b: { x: to.x + to.w * .72, y: to.y - 55 }, color: "#ffcf5c" });
  };
  const addSpinner = (i: number) => {
    const p = safeRoute(i);
    spinners.push({ x: p.x + p.w * .62, y: p.y - 78, length: 58 + stage, speed: 2.1 + difficulty * .7, phase: (i + stage) * .51 });
  };
  const addLavaGaps = (every = 2) => {
    for (let i = 0; i < route.length - 1; i += every) {
      const left = route[i], right = route[i + 1];
      lava.push({ x: left.x + left.w, y: 620, w: right.x - (left.x + left.w), h: 130, wave: 7, speed: 2.3 + difficulty, phase: i * .6 });
    }
  };
  const addIce = (i: number) => {
    const p = safeRoute(i);
    ice.push({ x: p.x + 25, y: p.y - 10, w: p.w - 50, h: 10 });
  };
  const addCrumble = (i: number) => {
    const p = safeRoute(i);
    crumbles.push({ x: p.x + p.w * .5 - 90, y: Math.max(300, p.y - 135), w: 180, h: 24, delay: .9, respawn: 2.1 });
  };

  if (world === 0) {
    addConveyor(1, 1); addConveyor(route.length - 3, stage % 2 ? -1 : 1); addCheckpoint(Math.floor(route.length / 2)); addBooster(2);
  } else if (world === 1) {
    addPhase(1); addPhase(route.length - 3); addGravity(2, .58); addSpring(2, 1080 + stage * 12);
  } else if (world === 2) {
    addLaser(1); addLaser(route.length - 3); addConveyor(3, stage % 2 ? -1 : 1); addIce(2);
  } else if (world === 3) {
    addGravity(1, .5); addGravity(route.length - 3, .66); addCheckpoint(Math.floor(route.length / 2)); addSpring(2, 1070); if (stage >= 2) addPortal(1, route.length - 3);
  } else if (world === 4) {
    addPhase(2); addPhase(route.length - 3); addLaser(3); addCrumble(2); addWater(Math.floor(route.length / 2));
  } else if (world === 5) {
    addConveyor(1, 1); addConveyor(3, -1); addGravity(2, .6); addWind(route.length - 3, stage % 2 ? -1 : 1);
  } else if (world === 6) {
    addCheckpoint(2); addLaser(3); addSpinner(route.length - 3); if (stage >= 4) addPortal(1, route.length - 3);
  } else if (world === 7) {
    addPhase(1); addConveyor(2, 1); addLavaGaps(2); addBooster(route.length - 3);
  } else if (world === 8) {
    addGravity(1, .56); addLaser(2); addCheckpoint(Math.floor(route.length / 2)); addWind(route.length - 3, 1); addWater(3);
  } else {
    addConveyor(1, stage % 2 ? -1 : 1); addPhase(2); addLaser(3); addGravity(4, .55); addCheckpoint(Math.floor(route.length / 2));
    addSpring(2, 1120); addBooster(route.length - 3); addWind(3, 1); addSpinner(route.length - 3);
    if (stage >= 3) addLavaGaps(2);
    if (stage >= 5) addPortal(1, route.length - 3);
    if (stage >= 7) { addWater(3); addIce(4); addCrumble(2); }
  }

  if (stage >= 4) {
    const p = safeRoute(2 + stage % Math.max(1, route.length - 3));
    const laserTooClose = laserGates.some(gate => Math.abs(gate.x - (p.x + p.w * .4)) < 120);
    const conveyorHere = conveyors.some(belt => belt.x < p.x + p.w && belt.x + belt.w > p.x);
    if (!laserTooClose && !conveyorHere && p.w > 420) {
      const min = p.x + 75, max = p.x + p.w - 75;
      enemies.push({ x: (min + max) / 2, y: p.y - 37, min, max, speed: 92 + difficulty * 45 });
    }
  }

  const starCandidates: Point[] = [
    ...ledges.map(p => ({ x: p.x + p.w / 2, y: p.y - 54 })),
    ...phasePlatforms.map(p => ({ x: p.x + p.w / 2, y: p.y - 55 })),
    ...route.slice(1, -1).map((p, i) => ({ x: p.x + p.w * (i % 2 ? .32 : .72), y: p.y - 65 })),
  ];
  const starPicks = [.18, .5, .82].map(ratio => Math.min(starCandidates.length - 1, Math.floor(starCandidates.length * ratio)));
  const stars = starPicks.map((pick, i) => starCandidates[pick] || ({ x: 720 + i * 650, y: 520 }));
  const last = route.at(-1)!;

  const mechanics: string[] = [];
  if (conveyors.length) mechanics.push("yürüyen bant");
  if (phasePlatforms.length) mechanics.push("faz platformu");
  if (laserGates.length) mechanics.push("lazer kapısı");
  if (gravityZones.length) mechanics.push("yerçekimi alanı");
  if (checkpoints.length) mechanics.push("kontrol noktası");
  if (springs.length) mechanics.push("zıplatan bitki");
  if (boosters.length) mechanics.push("ivme pisti");
  if (windZones.length) mechanics.push("rüzgâr");
  if (waterZones.length) mechanics.push("su");
  if (crumbles.length) mechanics.push("çöken zemin");
  if (portals.length) mechanics.push("portal");
  if (lava.length) mechanics.push("lav");
  if (spinners.length) mechanics.push("dönen tuzak");
  if (ice.length) mechanics.push("buz");

  return {
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
    conveyors,
    phasePlatforms,
    laserGates,
    gravityZones,
    checkpoints,
    spikes,
    stars,
    enemies,
    gravityScale: 1,
    goal: { x: last.x + last.w - 105, y: last.y - 90 },
    theme: themes[chapterIndex],
  };
}

const escapeLevelNames = [
  "İlk Alarm", "İlk Kırılma", "Lazer Nabzı", "Batık Koridor", "Artçı Şok", "Dikey Av", "Kırmızı Pencere",
  "Akıntıya Karşı", "Çöküş Kuyusu", "Faz Kırılması", "Fırtına Şaftı", "Sismik Lazerler", "Derin Basınç", "Momentum Hattı",
  "Saat Mekanizması", "Kırılan Baraj", "Ters Akış", "Ölüm Asansörü", "Kızıl Fırtına", "Son Prova", "Kıyamet Koşusu",
];

type EscapeRouteSegment = readonly [y: number, width: number, gapAfter: number];
type EscapeCrumbleSpec = number | readonly [at: number, delay: number];
type EscapeWaterSpec = number | readonly [at: number, depth: number, buoyancy?: number];
type EscapeDesign = {
  identity: string;
  subtitle: string;
  route: readonly EscapeRouteSegment[];
  boosters?: readonly number[];
  conveyors?: ReadonlyArray<readonly [at: number, speed: number]>;
  springs?: ReadonlyArray<readonly [at: number, power: number, ratio?: number]>;
  ice?: readonly number[];
  winds?: ReadonlyArray<readonly [after: number, force: number, lift: number]>;
  water?: readonly EscapeWaterSpec[];
  portals?: ReadonlyArray<readonly [from: number, to: number, color: string]>;
  lavaGaps?: readonly number[];
  spinners?: ReadonlyArray<readonly [at: number, speed: number, length: number]>;
  phaseBridges?: ReadonlyArray<readonly [after: number, phase: number, activeTime?: number, inactiveTime?: number, heightOffset?: number]>;
  lasers?: ReadonlyArray<readonly [at: number, phase: number, activeTime?: number, inactiveTime?: number, height?: number, xRatio?: number]>;
  gravity?: ReadonlyArray<readonly [after: number, scale: number]>;
  checkpoints?: readonly number[];
  spikes?: ReadonlyArray<readonly [at: number, ratio: number, width: number]>;
  enemies?: ReadonlyArray<readonly [at: number, ratio: number, speed: number]>;
  crumbles?: readonly EscapeCrumbleSpec[];
  movers?: ReadonlyArray<readonly [after: number, axis: "x" | "y", range: number, phase: number, speed?: number, heightOffset?: number]>;
  ceilings?: ReadonlyArray<readonly [at: number, heightAbove: number, inset?: number]>;
  keyAt?: number;
  starAt?: readonly [number, number, number];
  chaseEase?: number;
  chaseGrace?: number;
  quake?: boolean;
};

const escapeDesigns: readonly EscapeDesign[] = [
  {
    identity: "ritim sıçrayışı",
    subtitle: "Geniş pistlerle ritmi bul; sarı ivmeler seni ilk uzun kaçışa taşısın.",
    route: [[640,760,80],[620,560,75],[590,500,78],[620,600,82],[570,510,78],[610,640,75],[550,500,88],[600,620,76],[575,520,82],[625,610,74],[600,540,80],[640,820,0]],
    boosters: [1,5,9], conveyors: [[3,390],[8,420]], spikes: [[6,.72,48]], lavaGaps: [4,8], starAt: [2,6,9],
  },
  {
    identity: "ilk kırılma",
    subtitle: "Üç katlı ritmi oku; deprem zincirinden asansöre, oradan iki büyük sıçrayışa kaç.",
    route: [[640,720,72],[640,560,76],[600,520,82],[540,500,84],[590,430,68],[540,410,70],[490,400,72],[560,430,78],[620,560,86],[540,520,94],[480,500,92],[550,540,96],[610,570,104],[640,820,0]],
    crumbles: [[4,.82],[5,.72],[6,.66],[7,.58]], movers: [[8,"y",86,.4,1.08,104]], boosters: [0,11], springs: [[9,1020]], quake: true,
    starAt: [3,8,11], chaseEase: .88, chaseGrace: 4.15,
  },
  {
    identity: "lazer nabzı",
    subtitle: "Üç farklı lazer penceresini koşu, kısa karar ve hareketli platform üstünde yakala.",
    route: [[640,650,80],[590,520,86],[530,540,88],[610,560,82],[550,500,92],[490,470,88],[570,540,94],[620,560,84],[540,500,96],[470,460,92],[550,530,98],[610,560,88],[530,520,108],[640,820,0]],
    lasers: [[2,.15,.46,1.52,165,.7],[6,.92,.68,1.2,185,.54],[10,1.58,.54,1.46,195,.62]],
    movers: [[5,"y",58,.6,1.18,92],[9,"y",70,1.5,1.32,105]], boosters: [0,12], conveyors: [[3,430],[8,470]],
    starAt: [3,7,11], chaseEase: .91,
  },
  {
    identity: "batık koridor",
    subtitle: "Yüksekten suya kontrollü düş, basıncı kullanarak iki hava cebinden kuru üst rotaya çık.",
    route: [[430,650,86],[500,560,80],[570,520,76],[630,620,72],[600,600,70],[560,580,74],[620,620,88],[540,540,92],[480,520,86],[550,560,82],[620,600,78],[560,540,88],[610,560,84],[640,820,0]],
    water: [[3,205,1500],[4,190,1460],[5,185,1450],[6,215,1520]], ceilings: [[4,220,70],[5,215,64]],
    springs: [[6,1110,.72]], boosters: [9,12], ice: [8,9], conveyors: [[10,460]], starAt: [2,7,11], chaseEase: .9,
  },
  {
    identity: "artçı şok",
    subtitle: "Kopan katlarla aşağı sürüklen; kısa asansörleri yakalayıp yayla yeniden üst kata dön.",
    route: [[640,650,76],[600,500,72],[560,430,68],[610,420,70],[650,430,74],[590,460,82],[520,500,86],[600,500,74],[640,450,78],[560,480,84],[500,470,80],[570,510,88],[620,560,82],[640,820,0]],
    crumbles: [[2,.72],[3,.62],[4,.54],[7,.7],[8,.58]], movers: [[5,"y",54,.2,1.3,84],[8,"y",62,1.1,1.38,94]],
    springs: [[9,1110]], boosters: [1,11], quake: true, starAt: [3,8,11], chaseEase: .91,
  },
  {
    identity: "dikey av",
    subtitle: "Yay, asansör ve momentumla 620'den kule tepesine çık; inip son duvara yeniden tırman.",
    route: [[620,680,82],[580,520,84],[520,500,88],[460,480,92],[400,470,88],[340,460,82],[330,500,86],[410,520,80],[500,540,84],[590,560,88],[540,520,90],[470,500,92],[400,480,88],[480,520,86],[560,560,82],[640,820,0]],
    springs: [[1,1080],[9,1100]], movers: [[3,"y",78,.3,1.18,108],[10,"y",72,1.4,1.28,104]], boosters: [7,13],
    starAt: [5,7,12], chaseEase: .86,
  },
  {
    identity: "kırmızı pencere",
    subtitle: "Beş lazeri düşüşte, asansörde, bant çıkışında, hafif çekimde ve final sıçrayışında oku.",
    route: [[640,660,84],[570,520,88],[500,500,82],[580,520,86],[520,480,90],[450,470,88],[540,520,84],[610,560,86],[540,510,92],[470,480,88],[550,520,94],[620,560,90],[540,500,96],[470,470,92],[550,520,108],[640,820,0]],
    lasers: [[2,.2,.48,1.45,180,.62],[5,.9,.58,1.3,175,.55],[8,1.55,.52,1.55,170,.72],[11,.45,.62,1.42,205,.58],[14,1.2,.5,1.62,195,.66]],
    movers: [[4,"y",64,.4,1.22,98]], conveyors: [[6,470],[7,500]], gravity: [[10,.52]], boosters: [0,13],
    starAt: [3,9,13], chaseEase: .88,
  },
  {
    identity: "akıntıya karşı",
    subtitle: "Kuru banttan gelen momentumu uzun havuza taşı; yüzeye yükselip ters banttan tek sıçrayışla kurtul.",
    route: [[640,680,78],[600,580,84],[540,540,88],[610,620,74],[630,620,70],[590,600,72],[550,580,86],[620,560,82],[580,520,88],[520,500,92],[600,560,84],[550,520,88],[610,560,82],[640,820,0]],
    conveyors: [[0,500],[1,540],[7,-330],[8,-260],[10,480]], boosters: [1,11], water: [[3,215,1510],[4,220,1540],[5,210,1500],[6,190,1460]],
    springs: [[6,1080,.72]], starAt: [2,7,11], chaseEase: .87,
  },
  {
    identity: "çöküş kuyusu",
    subtitle: "İki kontrollü serbest düşüşte doğru x çizgisini seç; asansör ve yaylarla kuyulardan kaç.",
    route: [[350,650,80],[420,520,84],[510,480,76],[620,540,82],[590,500,88],[530,480,90],[460,500,84],[540,520,78],[620,550,82],[570,500,88],[500,480,90],[430,470,86],[510,520,82],[590,560,80],[640,820,0]],
    lasers: [[2,.45,.5,1.55,145,.58],[9,1.25,.56,1.45,160,.62]], spikes: [[3,.7,48],[8,.66,52]],
    movers: [[4,"y",82,.3,1.16,110],[9,"y",88,1.6,1.26,116]], springs: [[5,1110],[10,1130]], starAt: [2,7,11], chaseEase: .89,
  },
  {
    identity: "faz kırılması",
    subtitle: "Üç eşsiz faz ritmini hız kesmeden yakala; ikinci boşlukta tehlikeli alt rota, üçüncüde surge var.",
    route: [[640,650,82],[580,520,86],[520,500,92],[600,520,84],[550,480,90],[490,470,96],[570,520,88],[640,560,82],[590,500,92],[520,480,86],[600,520,98],[540,490,90],[480,470,94],[560,520,86],[620,560,82],[640,820,0]],
    phaseBridges: [[2,.15,1.45,.72,118],[6,.9,1.12,.88,145],[10,1.55,1.32,.64,126]],
    boosters: [0,5,9,13], crumbles: [[7,.78]], spikes: [[7,.7,48]], starAt: [3,8,12], chaseEase: .9,
  },
  {
    identity: "fırtına şaftı",
    subtitle: "İleri taşıyan, yukarı kaldıran ve finalde geri iten üç okunabilir rüzgâr şaftını zincirle.",
    route: [[640,680,86],[580,520,92],[520,500,88],[610,540,84],[550,500,90],[490,480,96],[430,470,88],[510,520,84],[590,550,92],[530,500,88],[470,480,96],[550,520,90],[620,560,86],[560,520,82],[640,820,0]],
    winds: [[1,470,-75],[5,250,-230],[10,-260,-45]], boosters: [0,4,8,12], movers: [[6,"y",54,.7,1.16,92]],
    starAt: [3,7,11], chaseEase: .9,
  },
  {
    identity: "sismik lazerler",
    subtitle: "Lazer penceresini çatlayan zeminde oku; hareketli geçişten sonra çift ışını tek akışta aş.",
    route: [[640,660,80],[590,520,84],[540,470,76],[610,520,88],[550,480,92],[490,470,86],[570,500,80],[630,540,84],[580,500,90],[520,480,86],[600,500,78],[550,470,88],[490,460,82],[560,500,90],[620,560,84],[640,820,0]],
    crumbles: [[2,.82],[6,.72],[10,.64]], lasers: [[2,.2,.54,1.35,170,.62],[6,1.02,.58,1.28,180,.58],[12,.35,.5,1.25,175,.54],[13,1.1,.46,1.3,185,.68]],
    movers: [[5,"y",62,.5,1.3,96],[9,"x",48,1.4,1.38,88]], quake: true, boosters: [0,14], starAt: [3,8,12], chaseEase: .88,
  },
  {
    identity: "derin basınç",
    subtitle: "Üç havuzda yüzey, orta derinlik ve kaldırma rotalarını sırayla seç; suda oyalanma.",
    route: [[640,660,82],[580,520,86],[620,600,78],[590,580,74],[520,500,88],[600,540,84],[630,620,76],[590,600,72],[530,520,90],[610,560,84],[640,620,78],[580,600,72],[510,520,92],[590,550,86],[640,820,0]],
    water: [[2,185,1430],[3,175,1420],[6,225,1500],[7,215,1480],[10,235,1540],[11,220,1510]],
    ceilings: [[6,205,68],[7,210,62]], spikes: [[7,.72,48]], lasers: [[7,.65,.48,1.5,105,.58]], springs: [[11,1110]], ice: [4,12],
    starAt: [3,8,12], chaseEase: .85,
  },
  {
    identity: "momentum hattı",
    subtitle: "Banttan boostera, geniş kemerden mover'a ve ikinci ivmeye hiç durmadan ak.",
    route: [[640,700,80],[590,560,86],[530,520,94],[470,500,98],[410,480,92],[480,520,88],[550,540,96],[620,580,84],[560,520,92],[500,500,98],[440,480,90],[510,520,94],[580,560,86],[640,820,0]],
    conveyors: [[1,540],[5,500],[8,520],[11,550]], boosters: [1,6,11], movers: [[4,"x",58,.4,1.36,86],[9,"y",64,1.5,1.3,98]],
    ice: [3,9], starAt: [3,7,10], chaseEase: .87,
  },
  {
    identity: "saat mekanizması",
    subtitle: "Lazer, mover, pervane ve faz köprüsünün ortak nabzını öğren; final kombinasyonunu tek akışta çöz.",
    route: [[640,650,82],[580,520,88],[520,490,84],[600,520,90],[550,480,86],[490,470,94],[570,510,88],[630,550,84],[570,500,92],[510,480,86],[590,520,96],[530,490,90],[470,470,94],[550,510,88],[620,560,82],[640,820,0]],
    lasers: [[2,.1,.6,1.2,170,.62],[6,.7,.6,1.2,180,.58],[10,1.3,.6,1.2,175,.64],[13,.4,.52,1.28,190,.6]],
    movers: [[1,"y",56,.3,1.45,92],[5,"x",48,1.2,1.45,88],[11,"y",64,2.1,1.45,102]],
    spinners: [[4,2.35,48],[8,-2.35,50]], phaseBridges: [[3,.45,1.2,.6,122],[7,1.05,1.2,.6,128],[12,1.65,1.2,.6,126]],
    boosters: [0,9,14], starAt: [3,8,12], chaseEase: .87,
  },
  {
    identity: "kırılan baraj",
    subtitle: "Kuru baraj üstü çatlayıp seni geniş suya düşürür; çıkışta artçı çöküş yeniden başlar.",
    route: [[420,680,82],[450,540,78],[500,500,72],[550,450,68],[600,430,70],[640,450,74],[620,620,72],[590,600,70],[550,580,74],[610,620,88],[530,520,84],[590,480,72],[630,460,74],[570,500,86],[620,560,82],[640,820,0]],
    crumbles: [[3,.76],[4,.66],[5,.58],[11,.72],[12,.62]], water: [[6,225,1520],[7,220,1500],[8,205,1480],[9,215,1500]],
    springs: [[9,1120,.72]], boosters: [1,13], conveyors: [[1,460],[14,520]], quake: true, starAt: [3,8,12], chaseEase: .86,
  },
  {
    identity: "ters akış",
    subtitle: "İleri kaçarken iki kısa sola düzeltmeyle asansörü ve lazer penceresini yakala; uzun geri dönüş yok.",
    route: [[640,660,80],[580,520,86],[520,490,90],[600,520,84],[550,480,92],[490,470,88],[570,520,86],[630,560,82],[570,500,94],[510,480,88],[590,520,96],[530,490,90],[470,470,94],[550,520,86],[620,560,82],[640,820,0]],
    conveyors: [[2,-250],[3,430],[7,-280],[8,470],[11,-260],[13,500]], movers: [[3,"y",66,.6,1.18,104],[8,"y",72,1.5,1.22,108]],
    lasers: [[5,.8,.56,1.34,175,.58],[10,1.45,.52,1.42,185,.62]], enemies: [[12,.58,96]], boosters: [0,13],
    starAt: [3,8,12], chaseEase: .84,
  },
  {
    identity: "ölüm asansörü",
    subtitle: "Üç asansörde çıkış atlayışı, lazer altı iniş ve spring'e hassas bırakma zamanlamasını öğren.",
    route: [[640,650,82],[580,520,88],[520,490,94],[600,520,86],[540,480,90],[480,470,96],[560,510,88],[630,550,84],[570,500,92],[510,480,88],[590,520,96],[530,490,92],[470,470,98],[550,520,88],[620,560,82],[640,820,0]],
    movers: [[2,"y",82,.2,1.12,116],[6,"y",78,1.25,1.18,112],[11,"y",92,2.1,1.26,122]],
    lasers: [[7,.55,.54,1.38,145,.58],[9,1.35,.5,1.45,175,.62]], springs: [[12,1130]], boosters: [0,13], starAt: [3,8,12], chaseEase: .85,
  },
  {
    identity: "kızıl fırtına",
    subtitle: "Beş perdede bant-lazer, rüzgâr-pervane, su-çöküş, faz-ışın ve lav-ivme birleşir.",
    route: [[640,680,78],[590,540,82],[530,500,86],[610,540,80],[550,500,88],[490,470,92],[570,520,84],[630,580,76],[590,560,72],[540,520,86],[610,560,82],[550,500,90],[490,470,94],[570,520,86],[630,560,78],[570,510,90],[510,480,96],[590,540,84],[640,820,0]],
    conveyors: [[1,540],[10,500]], lasers: [[2,.2,.5,1.38,175,.64],[12,1.1,.52,1.34,185,.58]],
    winds: [[3,460,-95],[14,-240,-45]], spinners: [[4,2.55,50],[15,-2.7,52]], water: [[7,205,1500],[8,195,1480],[9,185,1460]],
    crumbles: [[8,.68],[9,.6]], phaseBridges: [[11,.7,1.25,.62,128]], boosters: [0,5,13,17], lavaGaps: [16], portals: [[14,16,"#ff6a88"]],
    starAt: [4,9,14], chaseEase: .76, quake: true,
  },
  {
    identity: "son prova",
    subtitle: "Dikey açılış, deprem zinciri, su çıkışı, hareketli lazer ve faz-ivme finaliyle bütün becerileri sınar.",
    route: [[640,650,82],[580,500,86],[520,470,90],[460,450,84],[540,500,76],[600,430,70],[640,420,72],[590,440,78],[550,600,74],[620,620,72],[560,580,86],[500,500,92],[570,520,88],[630,550,84],[570,500,94],[510,480,98],[590,520,90],[640,820,0]],
    springs: [[1,1090],[11,1080,.7]], movers: [[2,"y",70,.3,1.2,104],[11,"x",54,1.1,1.34,90]], crumbles: [[5,.72],[6,.62],[7,.56]],
    water: [[8,220,1520],[9,215,1500],[10,195,1470]], lasers: [[12,.2,.52,1.38,175,.58],[13,1.05,.56,1.32,185,.64]],
    phaseBridges: [[14,.65,1.22,.66,128],[15,1.4,1.08,.72,132]], boosters: [0,4,11,16], checkpoints: [9], keyAt: 0,
    starAt: [3,9,14], chaseEase: .74, quake: true,
  },
  {
    identity: "kıyamet koşusu",
    subtitle: "Altı perdeli final: hız girişi, lazerli tırmanış, deprem, su kaçışı, faz gauntlet'i ve son timing.",
    route: [[640,700,76],[590,540,80],[530,500,84],[610,540,78],[550,500,86],[490,470,90],[430,450,84],[510,500,76],[580,430,68],[630,420,70],[590,440,78],[550,600,72],[620,620,70],[570,600,76],[510,520,86],[590,540,92],[530,500,88],[470,470,94],[550,520,84],[620,560,78],[640,900,0]],
    conveyors: [[1,550],[2,570],[18,580],[19,610]], boosters: [0,3,7,14,18,19], springs: [[4,1110],[13,1120,.72]],
    movers: [[5,"y",78,.3,1.2,112],[14,"y",72,1.25,1.3,108],[16,"x",56,2.1,1.42,92]],
    lasers: [[5,.2,.5,1.36,180,.58],[7,1.05,.54,1.3,190,.64],[15,.45,.52,1.34,175,.58],[19,1.25,.46,1.46,200,.62]],
    crumbles: [[8,.72],[9,.62],[10,.54]], water: [[11,230,1540],[12,225,1520],[13,205,1500]],
    phaseBridges: [[14,.55,1.22,.64,130],[16,1.35,1.08,.72,136]], portals: [[13,14,"#ff8ad8"]], spinners: [[17,2.75,50]],
    checkpoints: [11], keyAt: 0, starAt: [6,12,17], chaseEase: .68, quake: true,
  },
];

type EscapeChaseBeat = readonly [ratio: number, kind: "surge" | "breather", duration: number, multiplier: number];
const escapeChaseRhythms: ReadonlyArray<readonly EscapeChaseBeat[]> = [
  [[.24,"surge",1.2,1.18],[.5,"breather",1.45,.42],[.78,"surge",1.35,1.24]],
  [[.34,"breather",1.1,.5],[.58,"surge",1.2,1.18],[.77,"breather",.9,.55],[.9,"surge",1.3,1.24]],
  [[.22,"surge",.85,1.14],[.43,"breather",.8,.58],[.62,"surge",.95,1.18],[.8,"breather",.75,.55],[.91,"surge",1.2,1.25]],
  [[.18,"surge",.9,1.14],[.38,"breather",1.25,.46],[.58,"surge",1.1,1.2],[.73,"breather",1.05,.48],[.89,"surge",1.25,1.27]],
  [[.2,"surge",.9,1.16],[.42,"breather",.9,.52],[.6,"surge",1.15,1.22],[.78,"breather",.8,.5],[.9,"surge",1.2,1.28]],
  [[.2,"surge",1.05,1.16],[.4,"breather",1.15,.46],[.58,"surge",1.2,1.22],[.76,"breather",.9,.5],[.9,"surge",1.25,1.28]],
  [[.23,"surge",.9,1.15],[.36,"breather",.75,.52],[.49,"surge",.95,1.18],[.63,"breather",.8,.48],[.76,"surge",1,1.22],[.91,"surge",1.3,1.3]],
  [[.2,"surge",1,1.17],[.39,"breather",1.2,.44],[.59,"surge",1.15,1.22],[.76,"breather",.9,.5],[.9,"surge",1.25,1.28]],
  [[.18,"surge",.95,1.16],[.37,"breather",.85,.52],[.54,"surge",1.1,1.22],[.72,"breather",.8,.5],[.88,"surge",1.3,1.3]],
  [[.22,"surge",.95,1.16],[.42,"breather",.9,.52],[.61,"surge",1.1,1.23],[.79,"breather",.8,.5],[.9,"surge",1.25,1.3]],
  [[.2,"surge",1,1.17],[.39,"breather",.95,.5],[.58,"surge",1.15,1.23],[.76,"breather",.85,.5],[.9,"surge",1.25,1.29]],
  [[.18,"surge",.95,1.17],[.34,"breather",.8,.52],[.5,"surge",1,1.2],[.66,"breather",.75,.5],[.81,"surge",1.1,1.25],[.92,"surge",1.2,1.3]],
  [[.2,"surge",.95,1.18],[.38,"breather",1.05,.46],[.56,"surge",1.1,1.23],[.74,"breather",.85,.5],[.9,"surge",1.3,1.3]],
  [[.18,"surge",1,1.18],[.36,"breather",.9,.5],[.54,"surge",1.1,1.22],[.72,"breather",.8,.5],[.88,"surge",1.25,1.29]],
  [[.17,"surge",.9,1.18],[.34,"breather",.8,.5],[.51,"surge",1.05,1.23],[.68,"breather",.8,.48],[.83,"surge",1.15,1.27],[.93,"surge",1,1.31]],
  [[.18,"surge",.95,1.18],[.36,"breather",1,.46],[.54,"surge",1.1,1.23],[.72,"breather",.85,.5],[.89,"surge",1.25,1.3]],
  [[.2,"surge",.9,1.17],[.39,"breather",.85,.5],[.58,"surge",1.05,1.22],[.76,"breather",.75,.52],[.9,"surge",1.2,1.29]],
  [[.18,"surge",.95,1.18],[.36,"breather",.9,.48],[.54,"surge",1.1,1.23],[.72,"breather",.8,.5],[.89,"surge",1.3,1.31]],
  [[.14,"surge",1.05,1.22],[.28,"surge",.9,1.2],[.43,"breather",1.1,.4],[.58,"surge",1.15,1.27],[.72,"breather",.95,.44],[.86,"surge",1.4,1.35]],
  [[.17,"surge",.95,1.2],[.34,"breather",.9,.45],[.51,"surge",1.1,1.25],[.68,"breather",.8,.48],[.83,"surge",1.25,1.31],[.93,"surge",1.1,1.35]],
  [[.12,"surge",1,1.1],[.24,"breather",1.2,.36],[.48,"surge",1.4,1.25],[.7,"breather",1.05,.4],[.84,"surge",3.1,1.34],[.94,"surge",1.5,1.4]],
];

function makeEscapeLevel(index: number): Level {
  const escapeIndex = index - 179;
  const chapterIndex = Math.floor(index / 10);
  const design = escapeDesigns[escapeIndex];
  const route: Box[] = [];
  let cursor = 0;
  const mechanicIndex = (entry: number | readonly [number, ...unknown[]]) => typeof entry === "number" ? entry : entry[0];
  const phaseGapIndexes = new Set((design.phaseBridges || []).map(([routeIndex]) => routeIndex));
  const moverGapIndexes = new Set((design.movers || []).map(([routeIndex]) => routeIndex));
  const flightGapIndexes = new Set([
    ...(design.gravity || []).map(([routeIndex]) => routeIndex),
    ...(design.winds || []).map(([routeIndex]) => routeIndex),
  ]);
  const springGapIndexes = new Set((design.springs || []).map(([routeIndex]) => routeIndex));
  const boosterGapIndexes = new Set(design.boosters || []);
  const portalGapIndexes = new Set((design.portals || []).map(([routeIndex]) => routeIndex));

  design.route.forEach(([y, configuredWidth, configuredGap], routeIndex) => {
    const first = routeIndex === 0;
    const last = routeIndex === design.route.length - 1;
    const width = first ? Math.min(540, configuredWidth) : configuredWidth;
    const thickness = first || last ? VIEW_H - y + 100 : 82 + ((escapeIndex * 2 + routeIndex) % 3) * 22;
    route.push({ x: cursor, y, w: width, h: thickness });
    if (last) return;
    let gapAfter = configuredGap;
    if (phaseGapIndexes.has(routeIndex) || moverGapIndexes.has(routeIndex)) gapAfter = Math.max(gapAfter, 225);
    if (flightGapIndexes.has(routeIndex)) gapAfter = Math.max(gapAfter, 205);
    if (springGapIndexes.has(routeIndex)) gapAfter = Math.max(gapAfter, 185);
    if (boosterGapIndexes.has(routeIndex)) gapAfter = Math.max(gapAfter, 175);
    if (portalGapIndexes.has(routeIndex)) gapAfter = Math.max(gapAfter, 350);
    cursor += width + gapAfter;
  });

  const routeAt = (routeIndex: number) => route[Math.max(0, Math.min(route.length - 1, routeIndex))];
  const gapAt = (routeIndex: number) => {
    const left = routeAt(Math.min(route.length - 2, routeIndex));
    const right = routeAt(Math.min(route.length - 1, routeIndex + 1));
    return { left, right, start: left.x + left.w, width: right.x - (left.x + left.w) };
  };
  const crumbleIndexes = new Set((design.crumbles || []).map(mechanicIndex));
  const crumbles: CrumblePlatform[] = (design.crumbles || []).map(spec => {
    const routeIndex = mechanicIndex(spec);
    const delay = typeof spec === "number" ? .62 + (routeIndex % 3) * .1 : spec[1];
    return { ...routeAt(routeIndex), delay, respawn: 2.1 };
  });
  const platforms = route.filter((_, routeIndex) => !crumbleIndexes.has(routeIndex));
  const boosters = (design.boosters || []).map(routeIndex => {
    const platform = routeAt(routeIndex);
    return { x: platform.x + Math.max(55, platform.w - 215), y: platform.y - 10, w: Math.min(145, platform.w - 110), h: 10 };
  });
  const conveyors: Conveyor[] = (design.conveyors || []).map(([routeIndex, speed]) => {
    const platform = routeAt(routeIndex);
    return { x: platform.x + 48, y: platform.y - 10, w: Math.max(150, platform.w - 96), h: 10, speed };
  });
  const springs: SpringPlant[] = (design.springs || []).map(([routeIndex, power, ratio = .55]) => {
    const platform = routeAt(routeIndex);
    return { x: platform.x + platform.w * ratio - 36, y: platform.y, w: 72, power };
  });
  const ice = (design.ice || []).map(routeIndex => {
    const platform = routeAt(routeIndex);
    return { x: platform.x + 22, y: platform.y - 10, w: platform.w - 44, h: 10 };
  });
  const windZones: WindZone[] = (design.winds || []).map(([routeIndex, force, lift]) => {
    const { left, right, start, width } = gapAt(routeIndex);
    return { x: start - 100, y: Math.min(left.y, right.y) - 330, w: width + 200, h: 350, force, lift };
  });
  const waterZones: WaterZone[] = (design.water || []).map(spec => {
    const routeIndex = mechanicIndex(spec);
    const platform = routeAt(routeIndex);
    const depth = typeof spec === "number" ? 175 : spec[1];
    const buoyancy = typeof spec === "number" ? 1420 : spec[2] || 1420;
    const y = Math.max(260, platform.y - depth);
    return { x: platform.x + 45, y, w: platform.w - 90, h: platform.y - y + 38, buoyancy };
  });
  const portals: PortalPair[] = (design.portals || []).map(([fromIndex, toIndex, color]) => {
    const from = routeAt(fromIndex), to = routeAt(toIndex);
    return { a: { x: from.x + from.w * .72, y: from.y - 55 }, b: { x: to.x + to.w * .32, y: to.y - 55 }, color };
  });
  const lava: LavaPool[] = (design.lavaGaps || []).map(routeIndex => {
    const { start, width } = gapAt(routeIndex);
    return {
      x: start,
      y: 632,
      w: width,
      h: 110,
      wave: 6 + escapeIndex * .1,
      speed: 2.35 + escapeIndex * .025,
      phase: routeIndex * .57,
    };
  });
  const spinners: Spinner[] = (design.spinners || []).map(([routeIndex, speed, length]) => {
    const platform = routeAt(routeIndex);
    return { x: platform.x + platform.w * .66, y: platform.y - 76, length, speed, phase: routeIndex * .63 };
  });
  const phasePlatforms: PhasePlatform[] = (design.phaseBridges || []).map(([routeIndex, phase, activeTime = 2.15, inactiveTime = .58, heightOffset = 128]) => {
    const { left, right, start, width } = gapAt(routeIndex);
    // Keep the phase bridge high enough to be a route choice, not a low ceiling
    // that catches the ball when it jumps from the lower platform below.
    return { x: start - 18, y: Math.min(left.y, right.y) - heightOffset, w: Math.max(140, width + 36), h: 22, activeTime, inactiveTime, phase, oneWay: true };
  });
  const laserGates: LaserGate[] = (design.lasers || []).map(([routeIndex, phase, activeTime = .55, inactiveTime = 1.85, height = 170, xRatio = .7]) => {
    const platform = routeAt(routeIndex);
    return { x: platform.x + platform.w * xRatio, y: platform.y - height, h: height, activeTime, inactiveTime, phase };
  });
  const gravityZones: GravityZone[] = (design.gravity || []).map(([routeIndex, scale]) => {
    const { left, right, start, width } = gapAt(routeIndex);
    return { x: start - 90, y: Math.min(left.y, right.y) - 340, w: width + 180, h: 355, scale };
  });
  const checkpoints = (design.checkpoints || []).map(routeIndex => {
    const platform = routeAt(routeIndex);
    return { x: platform.x + 92, y: platform.y - BALL_R };
  });
  const spikes = (design.spikes || []).map(([routeIndex, ratio, width]) => {
    const platform = routeAt(routeIndex);
    return { x: platform.x + platform.w * ratio, y: platform.y - 32, w: width, h: 32 };
  });
  const enemies = (design.enemies || []).map(([routeIndex, ratio, speed]) => {
    const platform = routeAt(routeIndex);
    const min = platform.x + 72, max = platform.x + platform.w - 72;
    return { x: platform.x + platform.w * ratio, y: platform.y - 37, min, max, speed };
  });
  const movers: Mover[] = (design.movers || []).map(([routeIndex, axis, range, phase, speed = 1.2 + escapeIndex * .018, heightOffset = 74]) => {
    const { left, right, start, width } = gapAt(routeIndex);
    return { x: start - 16, y: Math.min(left.y, right.y) - heightOffset, w: Math.max(135, width + 32), h: 22, axis, range, speed, phase };
  });
  const ceilings = (design.ceilings || []).map(([routeIndex, heightAbove, inset = 55]) => {
    const platform = routeAt(routeIndex);
    return { x: platform.x + inset, y: platform.y - heightAbove, w: Math.max(140, platform.w - inset * 2), h: 30 };
  });
  platforms.push(...ceilings);
  const starIndexes = design.starAt || [Math.floor(route.length * .25), Math.floor(route.length * .55), Math.floor(route.length * .82)];
  const starLedges = starIndexes.map((routeIndex, starIndex) => {
    const host = routeAt(routeIndex);
    const width = 155 + ((escapeIndex + starIndex) % 3) * 24;
    const xRatio = .24 + ((escapeIndex + starIndex * 2) % 3) * .2;
    return {
      x: Math.max(host.x + 30, Math.min(host.x + host.w - width - 30, host.x + host.w * xRatio - width / 2)),
      y: Math.max(295, host.y - 126 - ((escapeIndex + starIndex) % 3) * 24),
      w: width,
      h: 26,
    };
  });
  platforms.push(...starLedges);
  const stars = starLedges.map(ledge => ({ x: ledge.x + ledge.w / 2, y: ledge.y - 52 }));
  const keyPlatform = design.keyAt === undefined ? undefined : routeAt(design.keyAt);
  // Put escape-run keys directly on the approach line so a chased player can
  // collect them while grounded instead of having to make a blind detour.
  const key = keyPlatform ? {
    x: keyPlatform.x + Math.min(260, keyPlatform.w * .54),
    y: keyPlatform.y - BALL_R - 8,
  } : undefined;
  const last = route.at(-1)!;
  const mechanics = ["diken duvarı", design.identity];
  if (design.quake) mechanics.push("deprem");
  if (movers.length) mechanics.push("hareketli platform");
  if (crumbles.length) mechanics.push("çöken zemin");
  if (springs.length) mechanics.push("zıplatan bitki");
  if (boosters.length) mechanics.push("ivme pisti");
  if (ice.length) mechanics.push("buz");
  if (windZones.length) mechanics.push("rüzgâr");
  if (waterZones.length) mechanics.push("su");
  if (portals.length) mechanics.push("portal");
  if (lava.length) mechanics.push("lav");
  if (spinners.length) mechanics.push("dönen tuzak");
  if (conveyors.length) mechanics.push("yürüyen bant");
  if (phasePlatforms.length) mechanics.push("faz platformu");
  if (laserGates.length) mechanics.push("lazer kapısı");
  if (gravityZones.length) mechanics.push("yerçekimi alanı");
  if (checkpoints.length) mechanics.push("kontrol noktası");
  if (spikes.length) mechanics.push("diken");
  if (enemies.length) mechanics.push("düşman");
  if (key) mechanics.push("anahtar");
  const chaseEase = design.chaseEase || 1;

  return {
    number: index + 1,
    chapter: chapterNames[chapterIndex],
    name: escapeLevelNames[escapeIndex],
    subtitle: design.subtitle,
    quake: design.quake,
    mechanics,
    width: last.x + last.w,
    start: { x: 105, y: route[0].y - BALL_R },
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
    conveyors,
    phasePlatforms,
    laserGates,
    gravityZones,
    checkpoints,
    spikes,
    stars,
    enemies,
    key,
    keyPlatform,
    gravityScale: 1,
    goal: { x: last.x + last.w - 105, y: last.y - 90 },
    theme: themes[chapterIndex],
    chaser: {
      startGap: 370 - escapeIndex * 2,
      respawnGap: 560 - escapeIndex * 2,
      speed: (225 + escapeIndex * 3.1) * chaseEase,
      acceleration: (3.7 + escapeIndex * .14) * chaseEase,
      maxSpeed: Math.min(398, (318 + escapeIndex * 2.6) * chaseEase),
      maxGap: 660 - escapeIndex * 5,
      graceTime: design.chaseGrace ?? 2.05 - escapeIndex * .018,
      width: 138 + escapeIndex * .6,
      beats: escapeChaseRhythms[escapeIndex].map(([ratio, kind, duration, multiplier]) => ({
        at: (last.x + last.w) * ratio,
        kind,
        duration,
        multiplier,
      })),
    },
  };
}

function makeProceduralSpecialLevel(index: number): Level {
  const specialIndex = index - 200;
  const world = Math.floor(specialIndex / 10);
  const stage = specialIndex % 10;
  const chapterIndex = 20 + world;
  const random = mulberry32(220220 + specialIndex * 65537);
  const pattern = routes[(stage * 7 + world * 3) % routes.length];
  const route: Box[] = [];
  let cursor = 0;
  let previousY = 640;

  pattern.forEach((rawY, i) => {
    const first = i === 0;
    const last = i === pattern.length - 1;
    let y = first || last ? 640 : round(Math.max(485, Math.min(640, rawY + ((stage + i + world) % 3 - 1) * 10)), 5);
    if (previousY - y > 145) y = previousY - 145;
    const width = first ? 610 : last ? 720 : round(440 + random() * 105 + stage * 4 + world * 12, 5);
    route.push({ x: cursor, y, w: width, h: VIEW_H - y + 90 });
    previousY = y;
    if (!last) cursor += width + 70 + ((stage * 3 + i * 7 + world) % 5) * 7;
  });

  const ledgeIndexes = Array.from(new Set([1, Math.floor(route.length / 2), route.length - 2]));
  const ledges: Box[] = ledgeIndexes.map((routeIndex, i) => {
    const host = route[routeIndex];
    const width = 190 + ((stage + i + world) % 3) * 15;
    const travel = Math.max(0, host.w - width - 150);
    return {
      x: round(host.x + 75 + ((stage * 31 + i * 47) % Math.max(1, travel)), 5),
      y: Math.max(300, host.y - 115 - ((stage + i) % 2) * 15),
      w: width,
      h: 24,
    };
  });
  const platforms = [...route, ...ledges];
  const safeRoute = (i: number) => route[Math.max(1, Math.min(route.length - 2, i))];
  const middleIndex = Math.floor(route.length / 2);

  const moverLeft = route[Math.max(0, middleIndex - 1)];
  const moverRight = route[Math.min(route.length - 1, middleIndex)];
  const movers: Mover[] = [{
    x: moverLeft.x + moverLeft.w + 8,
    y: Math.min(moverLeft.y, moverRight.y) - 92,
    w: Math.max(105, moverRight.x - (moverLeft.x + moverLeft.w) - 16),
    h: 22,
    axis: stage % 2 ? "x" : "y",
    range: 28 + stage,
    speed: 1.05 + stage * .045,
    phase: stage * .41,
  }];

  const crumbleHost = safeRoute(2 + stage % Math.max(1, route.length - 4));
  const crumbles: CrumblePlatform[] = [{
    x: round(crumbleHost.x + crumbleHost.w - 205, 5),
    y: Math.max(300, crumbleHost.y - 122),
    w: 165,
    h: 24,
    delay: 1.15 - stage * .025,
    respawn: 2.25,
  }];
  const springs: SpringPlant[] = [{ x: ledges[0].x + 10, y: ledges[0].y, w: 72, power: 1040 + stage * 12 }];

  const boostHost = safeRoute(route.length - 3);
  const boosters: Box[] = world === 1 || stage >= 3
    ? [{ x: boostHost.x + 85, y: boostHost.y - 10, w: 125, h: 10 }]
    : [];
  const iceHost = safeRoute(2);
  const ice: Box[] = world === 1 || stage >= 2
    ? [{ x: iceHost.x + 35, y: iceHost.y - 10, w: Math.min(230, iceHost.w - 70), h: 10 }]
    : [];

  const windZones: WindZone[] = [];
  const gravityZones: GravityZone[] = [];
  const addGapFlow = (gapIndex: number, force: number, scale: number) => {
    const left = route[Math.max(0, Math.min(route.length - 2, gapIndex))];
    const right = route[Math.max(1, Math.min(route.length - 1, gapIndex + 1))];
    const x = left.x + left.w - 55;
    const w = right.x - (left.x + left.w) + 110;
    windZones.push({ x, y: Math.min(left.y, right.y) - 270, w, h: 285, force, lift: -55 });
    gravityZones.push({ x, y: Math.min(left.y, right.y) - 305, w, h: 320, scale });
  };
  addGapFlow(1 + stage % Math.max(1, route.length - 3), 235 + stage * 8, world === 0 ? .62 : .7);
  if (stage >= 6 || world === 1) addGapFlow(route.length - 3, 210 + stage * 7, .66);

  const waterLedge = ledges[1];
  const waterZones: WaterZone[] = [{
    x: waterLedge.x + 12,
    y: waterLedge.y - 108,
    w: waterLedge.w - 24,
    h: 120,
    buoyancy: 1360 + stage * 8,
  }];
  const portals: PortalPair[] = [{
    a: { x: ledges[0].x + ledges[0].w - 43, y: ledges[0].y - 55 },
    b: { x: ledges.at(-1)!.x + 43, y: ledges.at(-1)!.y - 55 },
    color: world === 0 ? "#dca6ff" : "#ffcf72",
  }];

  const lava: LavaPool[] = [];
  if (world === 1 || stage >= 5) {
    for (let i = world === 1 ? 0 : 1; i < route.length - 1; i += world === 1 ? 1 : 2) {
      const left = route[i], right = route[i + 1];
      lava.push({
        x: left.x + left.w,
        y: 620,
        w: right.x - (left.x + left.w),
        h: 130,
        wave: world === 0 ? 5 : 7,
        speed: 2.1 + stage * .07,
        phase: i * .53,
      });
    }
  }

  const spinnerLedge = ledges.at(-1)!;
  const spinners: Spinner[] = world === 1 || stage >= 4
    ? [{ x: spinnerLedge.x + spinnerLedge.w / 2, y: spinnerLedge.y - 68, length: 38 + stage, speed: 1.8 + stage * .09, phase: stage * .35 }]
    : [];
  const conveyors: Conveyor[] = [];
  const conveyorHosts = world === 0 ? [safeRoute(1)] : [safeRoute(1), safeRoute(route.length - 3)];
  conveyorHosts.forEach((host, i) => conveyors.push({
    x: host.x + 55,
    y: host.y - 10,
    w: Math.min(205, host.w - 110),
    h: 10,
    speed: 185 + stage * 9 + i * 25,
  }));

  const phasePlatforms: PhasePlatform[] = [];
  const phaseGapIndexes = [2, route.length - 3];
  phaseGapIndexes.forEach((gapIndex, i) => {
    const left = route[Math.max(0, Math.min(route.length - 2, gapIndex))];
    const right = route[Math.max(1, Math.min(route.length - 1, gapIndex + 1))];
    phasePlatforms.push({
      x: left.x + left.w - 8,
      y: Math.min(left.y, right.y) - 130 - i * 18,
      w: right.x - (left.x + left.w) + 16,
      h: 22,
      activeTime: 1.8 + stage * .025,
      inactiveTime: 1.05 + world * .15,
      phase: stage * .29 + i * .8,
    });
  });

  const laserGates: LaserGate[] = [];
  if (world === 1 || stage >= 6) {
    const laserHosts = world === 1 && stage === 9
      ? [safeRoute(1), safeRoute(middleIndex), safeRoute(route.length - 3)]
      : [ledges[1]];
    laserHosts.forEach((host, i) => laserGates.push({
      x: host.x + host.w * (.68 + i % 2 * .1),
      y: host.y - 105,
      h: 105,
      activeTime: .9 + i * .08,
      inactiveTime: 1.65,
      phase: stage * .37 + i * .64,
    }));
  }

  const checkpoints: Point[] = [
    { x: safeRoute(2).x + 90, y: safeRoute(2).y - BALL_R },
    { x: safeRoute(route.length - 3).x + 90, y: safeRoute(route.length - 3).y - BALL_R },
  ];
  const spikes: Box[] = [];
  if (world === 1 || stage >= 7) {
    const host = ledges[1];
    spikes.push({ x: host.x + host.w / 2 - 20, y: host.y - 30, w: 40, h: 30 });
  }

  const enemies: EnemySpawn[] = [];
  if (stage >= 5) {
    const host = safeRoute(middleIndex + 1);
    enemies.push({
      x: host.x + host.w / 2,
      y: host.y - 37,
      min: host.x + 70,
      max: host.x + host.w - 70,
      speed: 78 + stage * 5,
    });
  }

  const starHosts = [safeRoute(2), safeRoute(middleIndex), safeRoute(route.length - 2)];
  const stars = starHosts.map((host, i) => ({ x: host.x + host.w * (i % 2 ? .58 : .42), y: host.y - 70 }));
  const last = route.at(-1)!;
  const mechanics: string[] = [];
  if (movers.length) mechanics.push("hareketli platform");
  if (crumbles.length) mechanics.push("çöken zemin");
  if (springs.length) mechanics.push("zıplatan bitki");
  if (boosters.length) mechanics.push("ivme pisti");
  if (ice.length) mechanics.push("buz");
  if (windZones.length) mechanics.push("rüzgâr");
  if (waterZones.length) mechanics.push("su");
  if (portals.length) mechanics.push("portal");
  if (lava.length) mechanics.push("lav");
  if (spinners.length) mechanics.push("dönen tuzak");
  if (conveyors.length) mechanics.push("yürüyen bant");
  if (phasePlatforms.length) mechanics.push("faz platformu");
  if (laserGates.length) mechanics.push("lazer kapısı");
  if (gravityZones.length) mechanics.push("yerçekimi alanı");
  if (checkpoints.length) mechanics.push("kontrol noktası");

  return {
    number: index + 1,
    chapter: chapterNames[chapterIndex],
    name: names[chapterIndex][stage],
    subtitle: world === 1 && stage === 9
      ? "İki yüz yirmi bölümün bütün ritmini Kalbin Efsanevi Tacı'nda birleştir."
      : `${worldSubtitles[chapterIndex]} · ${mechanics.slice(0, 4).join(" + ")}`,
    mechanics,
    width: last.x + last.w,
    start: { x: route[0].x + 110, y: route[0].y - BALL_R },
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
    conveyors,
    phasePlatforms,
    laserGates,
    gravityZones,
    checkpoints,
    spikes,
    stars,
    enemies,
    gravityScale: 1,
    goal: { x: last.x + last.w - 110, y: last.y - 90 },
    theme: themes[chapterIndex],
  };
}

type SpecialLevelDesign = {
  chapter: string;
  name: string;
  subtitle: string;
  width: number;
  platforms: Box[];
  stars: Point[];
  goal: Point;
  special: SpecialLevelSpec;
  movers?: Mover[];
  crumbles?: CrumblePlatform[];
  springs?: SpringPlant[];
  boosters?: Box[];
  ice?: Box[];
  windZones?: WindZone[];
  waterZones?: WaterZone[];
  portals?: PortalPair[];
  lava?: LavaPool[];
  spinners?: Spinner[];
  conveyors?: Conveyor[];
  phasePlatforms?: PhasePlatform[];
  laserGates?: LaserGate[];
  gravityZones?: GravityZone[];
  checkpoints?: Point[];
  spikes?: Box[];
  enemies?: EnemySpawn[];
};

const ground = (x: number, w: number, y = 640): Box => ({ x, y, w, h: VIEW_H - y + 90 });
const ledge = (x: number, y: number, w: number, h = 24): Box => ({ x, y, w, h });

const specialActThemes: Theme[] = [
  { sky: ["#8fdcf2", "#fff0c8"], hill: "#55ad79", far: "#9ed6a0", ground: "#655044", grass: "#65c779", accent: "#ffd45c" },
  { sky: ["#85d9e8", "#f8f0c8"], hill: "#458e78", far: "#83c5a2", ground: "#67513f", grass: "#57b978", accent: "#ffbf55" },
  { sky: ["#9d91d9", "#f2cfde"], hill: "#6d5b91", far: "#a48db8", ground: "#55495b", grass: "#c28a72", accent: "#ffd36a" },
  { sky: ["#ef9baa", "#ffe0c5"], hill: "#a95c71", far: "#d78e93", ground: "#5f414b", grass: "#d97977", accent: "#ffe06c" },
];

const specialLevelDesigns: readonly SpecialLevelDesign[] = [
  {
    chapter: "Kök Bahçesi", name: "Denge Kökü", subtitle: "Tahterevallinin ucuna yuvarlan; eğimi sıçrama rampasına çevir.", width: 2700,
    platforms: [ground(0, 500), ledge(485, 548, 230), ground(580, 530, 610), ground(1110, 510), ground(1620, 510), ground(2130, 570)],
    stars: [{ x: 650, y: 480 }, { x: 1320, y: 535 }, { x: 2020, y: 515 }], goal: { x: 2590, y: 550 },
    special: { kind: "seesaw", boards: [{ x: 485, y: 548, w: 230, h: 24, pivotX: 600, maxAngle: .28, response: 7, damping: .82 }] },
  },
  {
    chapter: "Kök Bahçesi", name: "Yaprak Kanopisi", subtitle: "Yaprakların altından geç; yukarıdan inerken üstlerine kon.", width: 2680,
    platforms: [ground(0, 560), ground(640, 430), ground(1150, 430, 610), ground(1660, 410), ground(2150, 530), ledge(610, 505, 190), ledge(930, 410, 180), ledge(1290, 345, 190), ledge(1640, 430, 190)],
    stars: [{ x: 705, y: 455 }, { x: 1385, y: 290 }, { x: 1950, y: 530 }], goal: { x: 2570, y: 550 },
    special: { kind: "oneWay", surfaces: [ledge(610, 505, 190), ledge(930, 410, 180), ledge(1290, 345, 190), ledge(1640, 430, 190)] },
  },
  {
    chapter: "Kök Bahçesi", name: "Kabuk Bacası", subtitle: "Duvara dokunurken zıpla; karşı kabuğa sekerek yüksel.", width: 2760,
    platforms: [ground(0, 650), ground(730, 430), ground(1240, 440, 605), ground(1760, 430), ground(2270, 490), { x: 720, y: 390, w: 45, h: 250 }, { x: 960, y: 315, w: 45, h: 325 }, ledge(765, 315, 195)],
    stars: [{ x: 845, y: 520 }, { x: 860, y: 250 }, { x: 1990, y: 530 }], goal: { x: 2650, y: 550 },
    special: { kind: "wallJump", walls: [{ x: 720, y: 390, w: 45, h: 250, side: "both" }, { x: 960, y: 315, w: 45, h: 325, side: "both" }], horizontalSpeed: 510, verticalSpeed: 790, coyoteTime: .13 },
  },
  {
    chapter: "Kök Bahçesi", name: "Meşepalamudu Basamağı", subtitle: "Meşepalamudunu it; yüksek kökün altına taşıyıp basamak yap.", width: 2780,
    platforms: [ground(0, 720), ground(800, 540), ground(1340, 510), ground(1850, 510), ground(2360, 420), ledge(1030, 470, 250), ledge(1580, 440, 210)],
    stars: [{ x: 630, y: 550 }, { x: 1155, y: 410 }, { x: 2070, y: 545 }], goal: { x: 2670, y: 550 },
    special: { kind: "pushBlock", blocks: [{ x: 520, y: 574, w: 66, h: 66, minX: 260, maxX: 1240, pushAcceleration: 980, maxSpeed: 250 }] },
  },
  {
    chapter: "Kök Bahçesi", name: "İki Ağırlık Kapısı", subtitle: "Top ya da meşepalamudu plakaya değince kök kapısı açılır.", width: 2860,
    platforms: [ground(0, 760), ground(840, 500), ground(1380, 510), ground(1930, 470), ground(2440, 420), ledge(1510, 490, 240)],
    stars: [{ x: 690, y: 545 }, { x: 1610, y: 430 }, { x: 2180, y: 540 }], goal: { x: 2750, y: 550 },
    special: {
      kind: "pressureGate",
      blocks: [{ x: 520, y: 576, w: 64, h: 64, minX: 260, maxX: 1240, pushAcceleration: 920, maxSpeed: 235 }],
      plates: [{ x: 920, y: 628, w: 120, h: 12, gateId: "root-gate" }],
      gates: [{ x: 1275, y: 430, w: 46, h: 210, id: "root-gate", openOffset: { x: 0, y: -235 } }],
    },
  },
  {
    chapter: "Yaprak Serası", name: "Çatlayan Kök", subtitle: "İvme yaprağında hızlan; çatlak duvara omuz at.", width: 2840,
    platforms: [ground(0, 780), ground(860, 530), ground(1430, 510, 610), ground(1980, 470), ground(2490, 350)],
    boosters: [{ x: 535, y: 630, w: 155, h: 10 }], stars: [{ x: 620, y: 545 }, { x: 1540, y: 530 }, { x: 2210, y: 545 }], goal: { x: 2730, y: 550 },
    special: { kind: "breakableWall", walls: [{ x: 795, y: 465, w: 52, h: 175, minImpactSpeed: 620, debrisCount: 14 }] },
  },
  {
    chapter: "Yaprak Serası", name: "Sarmaşık Salıncağı", subtitle: "Sarmaşığa temasla tutun; zıplayarak doğru anda bırak.", width: 2900,
    platforms: [ground(0, 720), ground(810, 370), ground(1260, 460, 610), ground(1800, 430), ground(2310, 590), ledge(1030, 470, 170)],
    stars: [{ x: 650, y: 540 }, { x: 1070, y: 280 }, { x: 2040, y: 530 }], goal: { x: 2790, y: 550 },
    special: { kind: "swing", anchors: [{ x: 1010, y: 235, length: 235, catchRadius: 58, torque: 2.7, releaseBoost: 1.12 }] },
  },
  {
    chapter: "Yaprak Serası", name: "Sera Zipline'ı", subtitle: "Raya dokun; hızını koruyarak zıpla ve makaradan ayrıl.", width: 2920,
    platforms: [ground(0, 690), ground(780, 420, 610), ground(1280, 410), ground(1770, 420, 600), ground(2270, 650), ledge(750, 430, 170), ledge(1700, 390, 190)],
    stars: [{ x: 610, y: 540 }, { x: 1240, y: 320 }, { x: 2050, y: 520 }], goal: { x: 2810, y: 550 },
    special: { kind: "zipline", cables: [{ a: { x: 760, y: 350 }, b: { x: 1690, y: 300 }, catchRadius: 55, speed: 310 }] },
  },
  {
    chapter: "Yaprak Serası", name: "Esneyen Nilüfer", subtitle: "Nilüfere yüksekten in; sıkışan yaprak seni yukarı fırlatsın.", width: 2840,
    platforms: [ground(0, 640), ground(720, 430), ground(1230, 450, 610), ground(1760, 430), ground(2270, 570), ledge(690, 520, 180), ledge(1120, 390, 210), ledge(1630, 455, 190)],
    stars: [{ x: 780, y: 455 }, { x: 1225, y: 330 }, { x: 2000, y: 530 }], goal: { x: 2730, y: 550 },
    special: { kind: "elastic", surfaces: [{ x: 690, y: 520, w: 180, h: 24, restitution: 1.22, minBounce: 820, maxBounce: 1180 }] },
  },
  {
    chapter: "Yaprak Serası", name: "Yükselen Gölet", subtitle: "Su yükselirken yüz; hava ceplerini kullanıp üst köke çık.", width: 3000,
    platforms: [ground(0, 650), ground(730, 430), ground(1240, 430, 600), ground(1750, 440), ground(2270, 730), ledge(900, 455, 190), ledge(1320, 370, 190), ledge(1710, 450, 180)],
    stars: [{ x: 920, y: 400 }, { x: 1415, y: 315 }, { x: 2080, y: 535 }], goal: { x: 2890, y: 550 },
    special: { kind: "risingWater", course: { basin: { x: 720, y: 300, w: 1470, h: 340 }, surfaceStartY: 600, surfaceEndY: 360, riseSpeed: 42, buoyancy: 1450, airPockets: [{ x: 1060, y: 345, w: 170, h: 90 }, { x: 1530, y: 315, w: 170, h: 90 }] } },
  },
  {
    chapter: "Saat Atölyesi", name: "Mıknatıs Rayı", subtitle: "Kutup pedine değ; çekim ve itmeyi rotana dönüştür.", width: 2920,
    platforms: [ground(0, 650), ground(730, 420), ground(1230, 430, 605), ground(1740, 430), ground(2250, 670), ledge(930, 430, 180), ledge(1540, 390, 190)],
    stars: [{ x: 620, y: 545 }, { x: 1010, y: 360 }, { x: 2010, y: 530 }], goal: { x: 2810, y: 550 },
    special: { kind: "magnet", initialPolarity: 1, pads: [{ x: 550, y: 628, w: 105, h: 12, polarity: -1 }, { x: 1780, y: 628, w: 105, h: 12, polarity: 1 }], nodes: [{ x: 1040, y: 330, radius: 330, strength: 920, polarity: 1 }, { x: 1620, y: 325, radius: 300, strength: 820, polarity: -1 }] },
  },
  {
    chapter: "Saat Atölyesi", name: "Tavan Vardiyası", subtitle: "Yerçekimi pedinden geç; aynı tuşlarla tavanda ilerle.", width: 3000,
    platforms: [ground(0, 700), ground(790, 430), ground(1300, 430), ground(1810, 430), ground(2320, 680), { x: 760, y: 130, w: 1510, h: 35 }, ledge(1190, 470, 190), ledge(1700, 430, 190)],
    stars: [{ x: 620, y: 545 }, { x: 1450, y: 215 }, { x: 2080, y: 215 }], goal: { x: 2890, y: 550 },
    special: { kind: "gravityFlip", initialGravity: 1, pads: [{ x: 720, y: 520, w: 85, h: 120, gravity: -1 }, { x: 2210, y: 130, w: 85, h: 120, gravity: 1 }] },
  },
  {
    chapter: "Saat Atölyesi", name: "Saat Dişleri", subtitle: "Dönen dişlerin ritmini oku; üstlerine basıp bir sonrakine atla.", width: 2960,
    platforms: [ground(0, 650), ground(740, 380), ground(1200, 420), ground(1700, 420, 610), ground(2200, 760), ledge(820, 470, 110), ledge(1190, 430, 110), ledge(1580, 460, 110)],
    stars: [{ x: 620, y: 545 }, { x: 1280, y: 335 }, { x: 2040, y: 525 }], goal: { x: 2850, y: 550 },
    special: { kind: "gears", gears: [{ x: 890, y: 455, radius: 78, speed: 1.1, phase: 0, teeth: 12, toothWidth: 80, toothHeight: 20 }, { x: 1300, y: 410, radius: 92, speed: -1, phase: 1.1, teeth: 14, toothWidth: 90, toothHeight: 20 }, { x: 1690, y: 445, radius: 82, speed: 1.25, phase: 2.1, teeth: 12, toothWidth: 82, toothHeight: 20 }] },
  },
  {
    chapter: "Saat Atölyesi", name: "Piston Kalbi", subtitle: "Sarı uyarıyı izle; piston çekildiğinde koridoru geç.", width: 3020,
    platforms: [ground(0, 710), ground(790, 510), ground(1340, 490), ground(1870, 490), ground(2400, 620), ledge(1080, 485, 180), ledge(2140, 465, 180)],
    stars: [{ x: 650, y: 545 }, { x: 1550, y: 530 }, { x: 2250, y: 405 }], goal: { x: 2910, y: 550 },
    special: { kind: "pistons", pistons: [{ x: 1040, y: 460, w: 60, h: 180, axis: "y", travel: 145, extendTime: .7, holdTime: .55, retractTime: .8, phase: 0, lethal: true }, { x: 1640, y: 470, w: 62, h: 170, axis: "y", travel: 135, extendTime: .75, holdTime: .5, retractTime: .75, phase: .9, lethal: true }, { x: 2200, y: 445, w: 150, h: 55, axis: "x", travel: 125, extendTime: .8, holdTime: .45, retractTime: .8, phase: 1.6, lethal: false }] },
  },
  {
    chapter: "Saat Atölyesi", name: "Momentum Geçidi", subtitle: "Portala hızlı gir; çıkışta aynı yön ve hızla boşluğu aş.", width: 3100,
    platforms: [ground(0, 760), ground(850, 430), ground(1370, 430, 600), ground(1880, 430), ground(2390, 710), ledge(1160, 455, 180), ledge(2020, 410, 190)],
    boosters: [{ x: 515, y: 630, w: 150, h: 10 }], stars: [{ x: 650, y: 545 }, { x: 1530, y: 525 }, { x: 2210, y: 355 }], goal: { x: 2990, y: 550 },
    portals: [{ a: { x: 735, y: 560 }, b: { x: 2010, y: 355 }, color: "#ffbf57" }],
    special: { kind: "momentumPortal", pairs: [{ a: { x: 735, y: 560 }, b: { x: 2010, y: 355 }, color: "#ffbf57", aNormal: { x: 1, y: 0 }, bNormal: { x: 1, y: -.2 }, speedMultiplier: 1.04 }] },
  },
  {
    chapter: "Kalp Motoru", name: "İki Dünya Rölesi", subtitle: "A ve B pedlerine değ; yalnız seçili dünyanın platformları katılaşır.", width: 3060,
    platforms: [ground(0, 690), ground(780, 400), ground(1260, 410, 610), ground(1750, 410), ground(2240, 820), ledge(720, 500, 170), ledge(1040, 420, 170), ledge(1450, 500, 170), ledge(1780, 420, 170)],
    stars: [{ x: 620, y: 545 }, { x: 1120, y: 360 }, { x: 1940, y: 360 }], goal: { x: 2950, y: 550 },
    special: { kind: "phaseSwitch", initialPhase: "a", pads: [{ x: 560, y: 628, w: 90, h: 12, phase: "a" }, { x: 1510, y: 488, w: 90, h: 12, phase: "b" }], platforms: [{ ...ledge(720, 500, 170), phase: "a" }, { ...ledge(1040, 420, 170), phase: "b" }, { ...ledge(1450, 500, 170), phase: "a" }, { ...ledge(1780, 420, 170), phase: "b" }] },
  },
  {
    chapter: "Kalp Motoru", name: "Zaman Yankısı", subtitle: "Rota kaydolur; gecikmeli hayaletin plakayı tutarken kapıdan geç.", width: 3040,
    platforms: [ground(0, 760), ground(840, 460), ground(1380, 450), ground(1910, 430), ground(2420, 620), ledge(1050, 480, 190), ledge(1680, 450, 180)],
    stars: [{ x: 640, y: 545 }, { x: 1140, y: 420 }, { x: 2200, y: 535 }], goal: { x: 2930, y: 550 },
    special: { kind: "echo", trigger: { x: 520, y: 500, w: 120, h: 140 }, delay: 1.7, duration: 7, sampleRate: 30, plates: [{ x: 1000, y: 628, w: 120, h: 12, gateId: "echo-gate" }], gates: [{ x: 1510, y: 455, w: 46, h: 185, id: "echo-gate" }] },
  },
  {
    chapter: "Kalp Motoru", name: "Duran Saniye", subtitle: "Saat plakasına değ; tuzaklar donar, top hareket etmeye devam eder.", width: 3060,
    platforms: [ground(0, 730), ground(810, 450), ground(1340, 450), ground(1870, 450), ground(2400, 660), ledge(1020, 470, 180), ledge(2070, 450, 180)],
    movers: [{ x: 980, y: 500, w: 165, h: 22, axis: "y", range: 95, speed: 1.3 }, { x: 2020, y: 480, w: 165, h: 22, axis: "x", range: 90, speed: 1.15, phase: 1.2 }],
    laserGates: [{ x: 1630, y: 450, h: 190, activeTime: 1, inactiveTime: 1.1 }], stars: [{ x: 650, y: 545 }, { x: 1080, y: 410 }, { x: 2210, y: 390 }], goal: { x: 2950, y: 550 },
    special: { kind: "timeFreeze", triggers: [{ x: 610, y: 628, w: 105, h: 12 }], duration: 3.2, affected: ["movers", "spinners", "laserGates", "pistons"] },
  },
  {
    chapter: "Kalp Motoru", name: "Çöken Hatıra Köprüsü", subtitle: "Arkandaki köprü dalga halinde çöküyor; ritmi bozmadan ilerle.", width: 3150,
    platforms: [ground(0, 620), ledge(610, 590, 190, 50), ledge(800, 585, 190, 55), ledge(990, 580, 190, 60), ledge(1180, 585, 190, 55), ledge(1370, 590, 190, 50), ledge(1560, 580, 190, 60), ledge(1750, 585, 190, 55), ledge(1940, 590, 190, 50), ground(2130, 1020)],
    checkpoints: [{ x: 2190, y: 613 }], stars: [{ x: 760, y: 520 }, { x: 1430, y: 510 }, { x: 2280, y: 540 }], goal: { x: 3040, y: 550 },
    special: { kind: "collapse", trigger: { x: 520, y: 480, w: 120, h: 160 }, leadTime: 3, interval: .5, permanent: true, tiles: [ledge(610, 590, 190, 50), ledge(800, 585, 190, 55), ledge(990, 580, 190, 60), ledge(1180, 585, 190, 55), ledge(1370, 590, 190, 50), ledge(1560, 580, 190, 60), ledge(1750, 585, 190, 55), ledge(1940, 590, 190, 50)].map((tile, order) => ({ ...tile, order })) },
  },
  {
    chapter: "Kalp Motoru", name: "Kalbin Efsanevi Tacı", subtitle: "Üç mührü aç; şok dalgası, yankı ve portal fazlarını tamamla.", width: 3300,
    platforms: [ground(0, 720), ground(800, 660), ground(1500, 660), ground(2200, 1100), ledge(1040, 470, 190), ledge(1740, 430, 190), ledge(2500, 460, 190)],
    portals: [{ a: { x: 1320, y: 540 }, b: { x: 2360, y: 500 }, color: "#ffd15c" }],
    stars: [{ x: 1120, y: 405 }, { x: 1820, y: 365 }, { x: 2580, y: 395 }], goal: { x: 3190, y: 550 },
    special: { kind: "boss", arena: { x: 720, y: 260, w: 2440, h: 380 }, center: { x: 1950, y: 290 }, phases: [{ triggerX: 1050, pattern: "shockwave", interval: 2.4 }, { triggerX: 1750, pattern: "echo", interval: 2.1 }, { triggerX: 2450, pattern: "portal", interval: 1.9 }], goalLock: { x: 3100, y: 430, w: 52, h: 210 }, shockwaveSpeed: 520, shockwaveWidth: 34 },
  },
];

function makeSpecialLevel(index: number): Level {
  const designIndex = index - 200;
  const design = specialLevelDesigns[designIndex];
  if (!design) throw new RangeError(`Özel bölüm bulunamadı: ${index + 1}`);
  const act = Math.min(3, Math.floor(designIndex / 5));
  const mechanics = [
    "tahterevalli", "tek yönlü yaprak", "duvar zıplama", "itilebilir meşepalamudu", "basınç plakası",
    "kırılabilir duvar", "sarmaşık salıncağı", "zipline", "elastik yüzey", "yükselen su",
    "mıknatıs", "ters yerçekimi", "taşıyan dişliler", "piston", "momentum portalı",
    "A/B dünyası", "zaman yankısı", "zaman dondurma", "çöken rota", "üç fazlı muhafız",
  ];
  return {
    number: index + 1,
    chapter: design.chapter,
    name: design.name,
    subtitle: design.subtitle,
    mechanics: [mechanics[designIndex]],
    width: design.width,
    start: { x: 105, y: 640 - BALL_R },
    platforms: design.platforms,
    movers: design.movers || [],
    crumbles: design.crumbles || [],
    springs: design.springs || [],
    boosters: design.boosters || [],
    ice: design.ice || [],
    windZones: design.windZones || [],
    waterZones: design.waterZones || [],
    portals: design.portals || [],
    lava: design.lava || [],
    spinners: design.spinners || [],
    conveyors: design.conveyors || [],
    phasePlatforms: design.phasePlatforms || [],
    laserGates: design.laserGates || [],
    gravityZones: design.gravityZones || [],
    checkpoints: design.checkpoints || [],
    spikes: design.spikes || [],
    stars: design.stars,
    enemies: design.enemies || [],
    gravityScale: 1,
    goal: design.goal,
    theme: specialActThemes[act],
    special: design.special,
  };
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
  const surfaceAtPoint = (point: Point, margin = 65) => surfaces.findIndex(platform => (
    point.x >= platform.x - margin
    && point.x <= platform.x + platform.w + margin
    && point.y + 100 >= platform.y
    && point.y <= platform.y + platform.h + 60
  ));

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
    for (const portal of level.portals) {
      for (const [entry, exit] of [[portal.a, portal.b], [portal.b, portal.a]] as const) {
        const entrySurface = surfaceAtPoint(entry);
        const exitSurface = surfaceAtPoint(exit);
        if (entrySurface >= 0 && exitSurface >= 0 && reachable.has(entrySurface) && !reachable.has(exitSurface)) {
          reachable.add(exitSurface);
          changed = true;
        }
      }
    }
  }

  const onReachableSurface = (point: Point, margin = 65) => {
    const surfaceIndex = surfaceAtPoint(point, margin);
    return surfaceIndex >= 0 && reachable.has(surfaceIndex);
  };
  if (!onReachableSurface(level.goal)) return { ok: false, reachablePlatforms: reachable.size, reason: "Kapıya ulaşan platform zinciri yok." };
  if (level.key && !onReachableSurface(level.key, 35)) return { ok: false, reachablePlatforms: reachable.size, reason: "Anahtar erişilebilir değil." };
  if (level.stars.length !== 3) return { ok: false, reachablePlatforms: reachable.size, reason: "Bölümde tam üç yıldız yok." };
  for (const checkpoint of level.checkpoints) {
    if (!onReachableSurface(checkpoint, 35)) return { ok: false, reachablePlatforms: reachable.size, reason: "Kontrol noktası erişilebilir değil." };
  }

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
  for (const strip of [...level.boosters, ...level.ice, ...level.conveyors]) {
    if (!surfaces.some(p => strip.x >= p.x && strip.x + strip.w <= p.x + p.w && Math.abs(strip.y + strip.h - p.y) < 5)) {
      return { ok: false, reachablePlatforms: reachable.size, reason: "Bir yüzey mekaniği platformsuz kaldı." };
    }
  }
  for (const phase of level.phasePlatforms) {
    if (phase.w <= 0 || phase.h <= 0 || phase.activeTime <= 0 || phase.inactiveTime <= 0 || phase.x < 0 || phase.x + phase.w > level.width) {
      return { ok: false, reachablePlatforms: reachable.size, reason: "Bir faz platformunun ölçüleri geçersiz." };
    }
  }
  for (const gate of level.laserGates) {
    if (gate.h <= 0 || gate.activeTime <= 0 || gate.inactiveTime <= 0 || gate.x < 0 || gate.x > level.width) {
      return { ok: false, reachablePlatforms: reachable.size, reason: "Bir lazer kapısının ölçüleri geçersiz." };
    }
  }
  for (const zone of level.gravityZones) {
    if (zone.w <= 0 || zone.h <= 0 || zone.scale <= 0 || zone.x < 0 || zone.x + zone.w > level.width) {
      return { ok: false, reachablePlatforms: reachable.size, reason: "Bir yerçekimi alanının ölçüleri geçersiz." };
    }
  }

  return { ok: true, reachablePlatforms: reachable.size };
}

export function makeLevel(index: number): Level {
  return index < 50
    ? makeLegacyLevel(index)
    : index < 100
      ? makeRedesignedLevel(index)
      : index < 179
        ? makeExpansionLevel(index)
        : index < 200
          ? makeEscapeLevel(index)
          : makeSpecialLevel(index);
}

export const levels: Level[] = Array.from({ length: LEVEL_COUNT }, (_, index) => makeLevel(index));
