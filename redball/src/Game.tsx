"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Box = { x: number; y: number; w: number; h: number };
type Point = { x: number; y: number };
type Mover = Box & { axis: "x" | "y"; range: number; speed: number; phase?: number };
type EnemySpawn = Point & { min: number; max: number; speed?: number };
type Theme = { sky: string[]; hill: string; far: string; ground: string; grass: string; accent: string };
type Level = {
  name: string;
  subtitle: string;
  width: number;
  start: Point;
  platforms: Box[];
  movers?: Mover[];
  spikes: Box[];
  stars: Point[];
  enemies: EnemySpawn[];
  goal: Point;
  theme: Theme;
};

const VIEW_W = 1280;
const VIEW_H = 720;
const BALL_R = 27;
const GRAVITY = 1900;
const JUMP_SPEED = 840;

const themes: Theme[] = [
  { sky: ["#76d8ff", "#e7fbff"], hill: "#6ac77a", far: "#a5e2a8", ground: "#8a542d", grass: "#49ac55", accent: "#ffd646" },
  { sky: ["#69cfff", "#fff2c2"], hill: "#e6a949", far: "#f3ce74", ground: "#8b5538", grass: "#67b04a", accent: "#ffcc32" },
  { sky: ["#9fe8ff", "#e8fff2"], hill: "#57bfa0", far: "#a0dfbd", ground: "#77503b", grass: "#44a879", accent: "#ffe165" },
  { sky: ["#7d91ff", "#f2c5ff"], hill: "#7656a6", far: "#aa8ac8", ground: "#5f4465", grass: "#835faa", accent: "#ffe15b" },
  { sky: ["#ff9b69", "#ffe3a8"], hill: "#c55d4a", far: "#e98d65", ground: "#713e34", grass: "#cb6a42", accent: "#fff071" },
];

const levels: Level[] = [
  {
    name: "Yeşil Başlangıç", subtitle: "Yuvarlan, zıpla, parılda!", width: 2300, start: { x: 110, y: 570 }, theme: themes[0],
    platforms: [{ x: 0, y: 640, w: 560, h: 120 }, { x: 650, y: 640, w: 480, h: 120 }, { x: 1210, y: 640, w: 470, h: 120 }, { x: 1770, y: 640, w: 530, h: 120 }, { x: 360, y: 500, w: 150, h: 26 }, { x: 820, y: 470, w: 170, h: 26 }, { x: 1400, y: 480, w: 170, h: 26 }],
    spikes: [{ x: 995, y: 608, w: 84, h: 32 }], stars: [{ x: 435, y: 445 }, { x: 905, y: 412 }, { x: 1490, y: 421 }], enemies: [{ x: 1320, y: 603, min: 1220, max: 1600 }], goal: { x: 2180, y: 550 },
  },
  {
    name: "Kütük Köprüsü", subtitle: "Boşluklara dikkat et.", width: 2700, start: { x: 100, y: 570 }, theme: themes[0],
    platforms: [{ x: 0, y: 640, w: 420, h: 100 }, { x: 540, y: 640, w: 420, h: 100 }, { x: 1080, y: 640, w: 360, h: 100 }, { x: 1580, y: 640, w: 420, h: 100 }, { x: 2140, y: 640, w: 560, h: 100 }, { x: 300, y: 465, w: 150, h: 25 }, { x: 680, y: 390, w: 170, h: 25 }, { x: 1150, y: 480, w: 200, h: 25 }, { x: 1730, y: 400, w: 160, h: 25 }, { x: 2210, y: 470, w: 180, h: 25 }],
    spikes: [{ x: 1160, y: 608, w: 76, h: 32 }, { x: 1840, y: 608, w: 84, h: 32 }], stars: [{ x: 375, y: 410 }, { x: 765, y: 335 }, { x: 1810, y: 344 }], enemies: [{ x: 700, y: 603, min: 560, max: 920 }, { x: 2260, y: 603, min: 2160, max: 2500 }], goal: { x: 2570, y: 550 },
  },
  {
    name: "Orman Basamakları", subtitle: "Yukarı çıkan yol kazanır.", width: 3000, start: { x: 100, y: 570 }, theme: themes[2],
    platforms: [{ x: 0, y: 640, w: 590, h: 100 }, { x: 680, y: 640, w: 420, h: 100 }, { x: 1220, y: 640, w: 460, h: 100 }, { x: 1810, y: 640, w: 360, h: 100 }, { x: 2290, y: 640, w: 710, h: 100 }, { x: 380, y: 510, w: 150, h: 25 }, { x: 700, y: 430, w: 150, h: 25 }, { x: 1010, y: 350, w: 170, h: 25 }, { x: 1350, y: 430, w: 150, h: 25 }, { x: 1870, y: 470, w: 170, h: 25 }, { x: 2380, y: 410, w: 170, h: 25 }],
    spikes: [{ x: 890, y: 608, w: 90, h: 32 }, { x: 1450, y: 608, w: 90, h: 32 }, { x: 2520, y: 608, w: 110, h: 32 }], stars: [{ x: 455, y: 454 }, { x: 1095, y: 294 }, { x: 2465, y: 354 }], enemies: [{ x: 750, y: 603, min: 700, max: 850 }, { x: 1950, y: 603, min: 1830, max: 2120 }], goal: { x: 2860, y: 550 },
  },
  {
    name: "Hareketli Hat", subtitle: "Zamanlamanı iyi ayarla.", width: 3200, start: { x: 100, y: 570 }, theme: themes[1],
    platforms: [{ x: 0, y: 640, w: 430, h: 100 }, { x: 760, y: 640, w: 400, h: 100 }, { x: 1450, y: 640, w: 430, h: 100 }, { x: 2170, y: 640, w: 1030, h: 100 }, { x: 900, y: 450, w: 150, h: 25 }, { x: 1570, y: 430, w: 170, h: 25 }, { x: 2350, y: 420, w: 170, h: 25 }],
    movers: [{ x: 470, y: 530, w: 180, h: 25, axis: "x", range: 90, speed: 1.2 }, { x: 1210, y: 500, w: 160, h: 25, axis: "y", range: 110, speed: 1.45, phase: 1 }, { x: 1900, y: 500, w: 170, h: 25, axis: "x", range: 100, speed: 1.55 }],
    spikes: [{ x: 980, y: 608, w: 90, h: 32 }, { x: 1620, y: 608, w: 110, h: 32 }, { x: 2640, y: 608, w: 120, h: 32 }], stars: [{ x: 560, y: 468 }, { x: 1290, y: 360 }, { x: 2435, y: 365 }], enemies: [{ x: 840, y: 603, min: 780, max: 1120 }, { x: 2300, y: 603, min: 2200, max: 2580 }], goal: { x: 3060, y: 550 },
  },
  {
    name: "Mor Gece", subtitle: "Gölgeler seni şaşırtmasın.", width: 3400, start: { x: 100, y: 570 }, theme: themes[3],
    platforms: [{ x: 0, y: 640, w: 510, h: 100 }, { x: 630, y: 640, w: 380, h: 100 }, { x: 1130, y: 640, w: 500, h: 100 }, { x: 1760, y: 640, w: 400, h: 100 }, { x: 2280, y: 640, w: 430, h: 100 }, { x: 2840, y: 640, w: 560, h: 100 }, { x: 280, y: 470, w: 160, h: 25 }, { x: 700, y: 400, w: 170, h: 25 }, { x: 1250, y: 470, w: 170, h: 25 }, { x: 1850, y: 380, w: 190, h: 25 }, { x: 2360, y: 460, w: 160, h: 25 }, { x: 2930, y: 410, w: 180, h: 25 }],
    spikes: [{ x: 770, y: 608, w: 90, h: 32 }, { x: 1370, y: 608, w: 120, h: 32 }, { x: 2390, y: 608, w: 120, h: 32 }], stars: [{ x: 360, y: 415 }, { x: 1945, y: 324 }, { x: 3020, y: 354 }], enemies: [{ x: 680, y: 603, min: 650, max: 960 }, { x: 1850, y: 603, min: 1780, max: 2110 }, { x: 2910, y: 603, min: 2860, max: 3220 }], goal: { x: 3280, y: 550 },
  },
  {
    name: "Sıcak Vadi", subtitle: "Dikenler artık daha yakın.", width: 3600, start: { x: 90, y: 570 }, theme: themes[4],
    platforms: [{ x: 0, y: 640, w: 440, h: 100 }, { x: 560, y: 640, w: 470, h: 100 }, { x: 1170, y: 640, w: 350, h: 100 }, { x: 1680, y: 640, w: 510, h: 100 }, { x: 2320, y: 640, w: 420, h: 100 }, { x: 2880, y: 640, w: 720, h: 100 }, { x: 310, y: 460, w: 140, h: 25 }, { x: 740, y: 400, w: 160, h: 25 }, { x: 1230, y: 380, w: 180, h: 25 }, { x: 1800, y: 450, w: 160, h: 25 }, { x: 2420, y: 380, w: 160, h: 25 }, { x: 3020, y: 430, w: 180, h: 25 }],
    movers: [{ x: 1540, y: 500, w: 130, h: 24, axis: "y", range: 100, speed: 1.7 }], spikes: [{ x: 650, y: 608, w: 120, h: 32 }, { x: 1290, y: 608, w: 100, h: 32 }, { x: 1840, y: 608, w: 140, h: 32 }, { x: 3010, y: 608, w: 140, h: 32 }], stars: [{ x: 380, y: 405 }, { x: 1320, y: 324 }, { x: 2510, y: 324 }], enemies: [{ x: 860, y: 603, min: 780, max: 990 }, { x: 2440, y: 603, min: 2340, max: 2700 }, { x: 3290, y: 603, min: 3200, max: 3460 }], goal: { x: 3470, y: 550 },
  },
  {
    name: "Bulut Yolu", subtitle: "Yere bakma; ritmi yakala.", width: 3800, start: { x: 100, y: 570 }, theme: themes[0],
    platforms: [{ x: 0, y: 640, w: 380, h: 100 }, { x: 700, y: 640, w: 300, h: 100 }, { x: 1320, y: 640, w: 340, h: 100 }, { x: 2000, y: 640, w: 340, h: 100 }, { x: 2700, y: 640, w: 360, h: 100 }, { x: 3390, y: 640, w: 410, h: 100 }, { x: 470, y: 500, w: 150, h: 25 }, { x: 1050, y: 430, w: 170, h: 25 }, { x: 1690, y: 360, w: 170, h: 25 }, { x: 2390, y: 440, w: 170, h: 25 }, { x: 3120, y: 390, w: 170, h: 25 }],
    movers: [{ x: 760, y: 360, w: 150, h: 24, axis: "y", range: 100, speed: 1.35 }, { x: 1880, y: 500, w: 150, h: 24, axis: "x", range: 100, speed: 1.5 }, { x: 3200, y: 510, w: 150, h: 24, axis: "x", range: 90, speed: 1.7 }], spikes: [{ x: 790, y: 608, w: 100, h: 32 }, { x: 1430, y: 608, w: 110, h: 32 }, { x: 2790, y: 608, w: 120, h: 32 }], stars: [{ x: 545, y: 445 }, { x: 1775, y: 304 }, { x: 3205, y: 334 }], enemies: [{ x: 770, y: 603, min: 720, max: 970 }, { x: 2070, y: 603, min: 2020, max: 2300 }, { x: 3460, y: 603, min: 3410, max: 3730 }], goal: { x: 3690, y: 550 },
  },
  {
    name: "Hız Tüneli", subtitle: "Durmak da bir beceri.", width: 4100, start: { x: 100, y: 570 }, theme: themes[2],
    platforms: [{ x: 0, y: 640, w: 620, h: 100 }, { x: 720, y: 640, w: 540, h: 100 }, { x: 1370, y: 640, w: 580, h: 100 }, { x: 2070, y: 640, w: 510, h: 100 }, { x: 2700, y: 640, w: 530, h: 100 }, { x: 3350, y: 640, w: 750, h: 100 }, { x: 390, y: 450, w: 150, h: 25 }, { x: 820, y: 390, w: 160, h: 25 }, { x: 1480, y: 450, w: 150, h: 25 }, { x: 2160, y: 380, w: 170, h: 25 }, { x: 2800, y: 450, w: 160, h: 25 }, { x: 3450, y: 390, w: 180, h: 25 }],
    spikes: [{ x: 470, y: 608, w: 120, h: 32 }, { x: 850, y: 608, w: 160, h: 32 }, { x: 1530, y: 608, w: 150, h: 32 }, { x: 2200, y: 608, w: 150, h: 32 }, { x: 2840, y: 608, w: 140, h: 32 }, { x: 3540, y: 608, w: 170, h: 32 }], stars: [{ x: 465, y: 394 }, { x: 2245, y: 324 }, { x: 3540, y: 334 }], enemies: [{ x: 760, y: 603, min: 730, max: 820 }, { x: 1810, y: 603, min: 1710, max: 1920 }, { x: 3100, y: 603, min: 3010, max: 3200 }, { x: 3810, y: 603, min: 3740, max: 4000 }], goal: { x: 3970, y: 550 },
  },
  {
    name: "Usta Parkuru", subtitle: "Öğrendiğin her şey burada.", width: 4400, start: { x: 100, y: 570 }, theme: themes[1],
    platforms: [{ x: 0, y: 640, w: 460, h: 100 }, { x: 580, y: 640, w: 400, h: 100 }, { x: 1110, y: 640, w: 380, h: 100 }, { x: 1620, y: 640, w: 420, h: 100 }, { x: 2170, y: 640, w: 390, h: 100 }, { x: 2690, y: 640, w: 430, h: 100 }, { x: 3250, y: 640, w: 380, h: 100 }, { x: 3760, y: 640, w: 640, h: 100 }, { x: 300, y: 460, w: 150, h: 25 }, { x: 650, y: 390, w: 160, h: 25 }, { x: 1200, y: 430, w: 160, h: 25 }, { x: 1700, y: 350, w: 180, h: 25 }, { x: 2240, y: 430, w: 160, h: 25 }, { x: 2780, y: 360, w: 180, h: 25 }, { x: 3330, y: 430, w: 160, h: 25 }, { x: 3870, y: 370, w: 190, h: 25 }],
    movers: [{ x: 1000, y: 510, w: 120, h: 24, axis: "y", range: 120, speed: 1.7 }, { x: 2050, y: 500, w: 120, h: 24, axis: "x", range: 80, speed: 1.9 }, { x: 3630, y: 500, w: 120, h: 24, axis: "y", range: 100, speed: 1.6 }], spikes: [{ x: 690, y: 608, w: 120, h: 32 }, { x: 1260, y: 608, w: 120, h: 32 }, { x: 1780, y: 608, w: 130, h: 32 }, { x: 2320, y: 608, w: 130, h: 32 }, { x: 2820, y: 608, w: 150, h: 32 }, { x: 3350, y: 608, w: 120, h: 32 }], stars: [{ x: 375, y: 404 }, { x: 1790, y: 294 }, { x: 3965, y: 314 }], enemies: [{ x: 620, y: 603, min: 600, max: 940 }, { x: 1670, y: 603, min: 1640, max: 2000 }, { x: 2740, y: 603, min: 2710, max: 3090 }, { x: 3830, y: 603, min: 3780, max: 4180 }], goal: { x: 4270, y: 550 },
  },
  {
    name: "Altın Taç", subtitle: "Son koşu. Son zıplayış.", width: 4800, start: { x: 100, y: 570 }, theme: themes[4],
    platforms: [{ x: 0, y: 640, w: 500, h: 100 }, { x: 620, y: 640, w: 410, h: 100 }, { x: 1160, y: 640, w: 440, h: 100 }, { x: 1730, y: 640, w: 410, h: 100 }, { x: 2270, y: 640, w: 430, h: 100 }, { x: 2830, y: 640, w: 440, h: 100 }, { x: 3400, y: 640, w: 440, h: 100 }, { x: 3970, y: 640, w: 830, h: 100 }, { x: 330, y: 460, w: 150, h: 25 }, { x: 700, y: 380, w: 170, h: 25 }, { x: 1240, y: 450, w: 160, h: 25 }, { x: 1810, y: 360, w: 180, h: 25 }, { x: 2350, y: 440, w: 160, h: 25 }, { x: 2920, y: 350, w: 190, h: 25 }, { x: 3490, y: 440, w: 160, h: 25 }, { x: 4070, y: 360, w: 190, h: 25 }],
    movers: [{ x: 1050, y: 500, w: 110, h: 24, axis: "y", range: 110, speed: 1.8 }, { x: 2150, y: 490, w: 120, h: 24, axis: "x", range: 85, speed: 2 }, { x: 3270, y: 500, w: 130, h: 24, axis: "y", range: 120, speed: 1.9 }, { x: 3840, y: 490, w: 130, h: 24, axis: "x", range: 90, speed: 2.1 }], spikes: [{ x: 720, y: 608, w: 130, h: 32 }, { x: 1300, y: 608, w: 150, h: 32 }, { x: 1820, y: 608, w: 150, h: 32 }, { x: 2400, y: 608, w: 150, h: 32 }, { x: 2970, y: 608, w: 150, h: 32 }, { x: 3500, y: 608, w: 170, h: 32 }, { x: 4200, y: 608, w: 180, h: 32 }], stars: [{ x: 405, y: 404 }, { x: 1900, y: 304 }, { x: 4165, y: 304 }], enemies: [{ x: 660, y: 603, min: 640, max: 990, speed: 105 }, { x: 1220, y: 603, min: 1180, max: 1560, speed: 115 }, { x: 1770, y: 603, min: 1750, max: 2100, speed: 120 }, { x: 2880, y: 603, min: 2850, max: 3230, speed: 120 }, { x: 4030, y: 603, min: 4000, max: 4460, speed: 125 }], goal: { x: 4650, y: 540 },
  },
];

type Enemy = EnemySpawn & { dir: number; dead: boolean };
type GameState = {
  x: number; y: number; vx: number; vy: number; angle: number; grounded: boolean;
  camera: number; stars: boolean[]; enemies: Enemy[]; lives: number; time: number;
};

const initialProgress = () => {
  if (typeof window === "undefined") return { unlocked: 1, scores: Array(10).fill(0) };
  try {
    const raw = localStorage.getItem("kizil-zipla-progress");
    if (raw) return JSON.parse(raw) as { unlocked: number; scores: number[] };
  } catch { /* fresh start */ }
  return { unlocked: 1, scores: Array(10).fill(0) };
};

function starPath(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const rr = i % 2 ? r * .46 : r;
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState | null>(null);
  const controls = useRef({ left: false, right: false, jump: false, jumpPressed: false });
  const rafRef = useRef(0);
  const lastRef = useRef(0);
  const soundRef = useRef(true);
  const [screen, setScreen] = useState<"menu" | "levels" | "game">("menu");
  const [levelIndex, setLevelIndex] = useState(0);
  const [lives, setLives] = useState(3);
  const [starCount, setStarCount] = useState(0);
  const [paused, setPaused] = useState(false);
  const [message, setMessage] = useState<"win" | "lose" | null>(null);
  const [sound, setSound] = useState(true);
  const [progress, setProgress] = useState(initialProgress);

  const beep = useCallback((frequency: number, duration = .08, gain = .04) => {
    if (!soundRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ac = new AudioCtx();
      const osc = ac.createOscillator(); const vol = ac.createGain();
      osc.frequency.value = frequency; osc.type = "sine"; vol.gain.value = gain;
      osc.connect(vol); vol.connect(ac.destination); osc.start();
      vol.gain.exponentialRampToValueAtTime(.001, ac.currentTime + duration);
      osc.stop(ac.currentTime + duration); osc.onended = () => ac.close();
    } catch { /* sound is optional */ }
  }, []);

  const resetLevel = useCallback((index = levelIndex, keepLives = false) => {
    const lvl = levels[index];
    const nextLives = keepLives && stateRef.current ? stateRef.current.lives : 3;
    stateRef.current = {
      x: lvl.start.x, y: lvl.start.y, vx: 0, vy: 0, angle: 0, grounded: false,
      camera: 0, stars: lvl.stars.map(() => false),
      enemies: lvl.enemies.map(e => ({ ...e, dir: Math.random() > .5 ? 1 : -1, dead: false })), lives: nextLives, time: 0,
    };
    setLives(nextLives); setStarCount(0); setMessage(null); setPaused(false);
  }, [levelIndex]);

  const startLevel = useCallback((index: number) => {
    setLevelIndex(index); setScreen("game"); setMessage(null); setPaused(false);
    const lvl = levels[index];
    stateRef.current = { x: lvl.start.x, y: lvl.start.y, vx: 0, vy: 0, angle: 0, grounded: false, camera: 0, stars: lvl.stars.map(() => false), enemies: lvl.enemies.map(e => ({ ...e, dir: 1, dead: false })), lives: 3, time: 0 };
    setLives(3); setStarCount(0); beep(420, .07);
  }, [beep]);

  const saveWin = useCallback((stars: number) => {
    setProgress(prev => {
      const scores = [...prev.scores]; scores[levelIndex] = Math.max(scores[levelIndex] || 0, stars);
      const next = { unlocked: Math.max(prev.unlocked, Math.min(10, levelIndex + 2)), scores };
      localStorage.setItem("kizil-zipla-progress", JSON.stringify(next)); return next;
    });
  }, [levelIndex]);

  const loseLife = useCallback(() => {
    const s = stateRef.current; if (!s || message) return;
    s.lives -= 1; setLives(s.lives); beep(120, .22, .06);
    if (s.lives <= 0) { setMessage("lose"); return; }
    const lvl = levels[levelIndex];
    s.x = lvl.start.x; s.y = lvl.start.y; s.vx = 0; s.vy = 0; s.camera = 0;
  }, [beep, levelIndex, message]);

  const draw = useCallback((ctx: CanvasRenderingContext2D, s: GameState, lvl: Level, time: number) => {
    const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H); sky.addColorStop(0, lvl.theme.sky[0]); sky.addColorStop(1, lvl.theme.sky[1]);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.globalAlpha = .85; ctx.fillStyle = lvl.theme.accent; ctx.beginPath(); ctx.arc(1080, 105, 48, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    const cloud = (x: number, y: number, scale: number) => { ctx.fillStyle = "rgba(255,255,255,.78)"; ctx.beginPath(); ctx.arc(x, y, 28 * scale, 0, 7); ctx.arc(x + 35 * scale, y - 12 * scale, 35 * scale, 0, 7); ctx.arc(x + 72 * scale, y, 26 * scale, 0, 7); ctx.fill(); };
    for (let i = 0; i < 7; i++) cloud(((i * 270 - s.camera * .12) % 1700) - 120, 105 + (i % 3) * 65, .7 + (i % 2) * .25);
    ctx.fillStyle = lvl.theme.far; ctx.beginPath(); ctx.moveTo(0, 610);
    for (let x = -80; x <= VIEW_W + 160; x += 180) { const px = x - (s.camera * .16 % 180); ctx.quadraticCurveTo(px + 85, 410, px + 180, 610); }
    ctx.lineTo(VIEW_W, 720); ctx.lineTo(0, 720); ctx.fill();
    ctx.fillStyle = lvl.theme.hill; ctx.beginPath(); ctx.moveTo(0, 650);
    for (let x = -100; x <= VIEW_W + 220; x += 240) { const px = x - (s.camera * .28 % 240); ctx.quadraticCurveTo(px + 110, 500, px + 240, 650); }
    ctx.lineTo(VIEW_W, 720); ctx.lineTo(0, 720); ctx.fill();

    ctx.save(); ctx.translate(-s.camera, 0);
    const movingRects = (lvl.movers || []).map(m => ({ ...m, x: m.x + (m.axis === "x" ? Math.sin(time * m.speed + (m.phase || 0)) * m.range : 0), y: m.y + (m.axis === "y" ? Math.sin(time * m.speed + (m.phase || 0)) * m.range : 0) }));
    [...lvl.platforms, ...movingRects].forEach((p, i) => {
      ctx.fillStyle = i >= lvl.platforms.length ? "#7149aa" : lvl.theme.ground; ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = i >= lvl.platforms.length ? "#b68cff" : lvl.theme.grass; ctx.fillRect(p.x, p.y, p.w, Math.min(13, p.h));
      ctx.fillStyle = "rgba(255,255,255,.18)"; ctx.fillRect(p.x + 8, p.y + 5, Math.max(0, p.w - 16), 3);
      if (p.h > 40) { ctx.fillStyle = "rgba(42,25,18,.14)"; for (let xx = p.x + 22; xx < p.x + p.w; xx += 58) ctx.fillRect(xx, p.y + 34, 12, 8); }
    });
    lvl.spikes.forEach(sp => { const count = Math.max(2, Math.round(sp.w / 28)); const sw = sp.w / count; for (let i = 0; i < count; i++) { ctx.fillStyle = "#4c5263"; ctx.beginPath(); ctx.moveTo(sp.x + i * sw, sp.y + sp.h); ctx.lineTo(sp.x + (i + .5) * sw, sp.y); ctx.lineTo(sp.x + (i + 1) * sw, sp.y + sp.h); ctx.fill(); ctx.strokeStyle = "#313744"; ctx.stroke(); } });
    lvl.stars.forEach((st, i) => { if (s.stars[i]) return; ctx.save(); ctx.translate(st.x, st.y); ctx.rotate(time * 1.8); ctx.shadowColor = "#ffd531"; ctx.shadowBlur = 18; starPath(ctx, 0, 0, 25); ctx.fillStyle = "#ffd531"; ctx.fill(); ctx.strokeStyle = "#e7a918"; ctx.lineWidth = 4; ctx.stroke(); ctx.restore(); });
    s.enemies.forEach(e => { if (e.dead) return; ctx.save(); ctx.translate(e.x, e.y); ctx.fillStyle = "#242a35"; ctx.rotate(time * e.dir); ctx.fillRect(-23, -23, 46, 46); ctx.fillStyle = "#f6f7fb"; ctx.fillRect(-14, -12, 9, 11); ctx.fillRect(5, -12, 9, 11); ctx.fillStyle = "#141820"; ctx.fillRect(-11, -9, 4, 5); ctx.fillRect(7, -9, 4, 5); ctx.restore(); });
    const gx = lvl.goal.x, gy = lvl.goal.y;
    ctx.fillStyle = "rgba(255,224,75,.25)"; ctx.beginPath(); ctx.arc(gx, gy, 66 + Math.sin(time * 3) * 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#ffcc26"; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(gx, gy, 46, Math.PI, 0); ctx.lineTo(gx + 46, gy + 65); ctx.lineTo(gx - 46, gy + 65); ctx.closePath(); ctx.stroke();
    ctx.fillStyle = "#fff5a9"; ctx.fillRect(gx - 34, gy + 4, 68, 60); ctx.fillStyle = "#ffbd21"; ctx.beginPath(); ctx.arc(gx + 17, gy + 35, 5, 0, 7); ctx.fill();
    if (levelIndex === 9) { ctx.fillStyle = "#ffd32a"; ctx.beginPath(); ctx.moveTo(gx - 28, gy - 65); ctx.lineTo(gx - 14, gy - 90); ctx.lineTo(gx, gy - 68); ctx.lineTo(gx + 15, gy - 90); ctx.lineTo(gx + 30, gy - 65); ctx.closePath(); ctx.fill(); }
    ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.angle); ctx.shadowColor = "rgba(80,0,0,.25)"; ctx.shadowBlur = 14; ctx.shadowOffsetY = 10;
    const red = ctx.createRadialGradient(-9, -12, 3, 0, 0, BALL_R); red.addColorStop(0, "#ff7676"); red.addColorStop(.38, "#f13542"); red.addColorStop(1, "#b80d26"); ctx.fillStyle = red; ctx.beginPath(); ctx.arc(0, 0, BALL_R, 0, 7); ctx.fill(); ctx.shadowBlur = 0; ctx.strokeStyle = "#8f0d20"; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = "white"; ctx.beginPath(); ctx.ellipse(-9, -7, 7, 9, 0, 0, 7); ctx.ellipse(9, -7, 7, 9, 0, 0, 7); ctx.fill(); ctx.fillStyle = "#20232a"; ctx.beginPath(); ctx.arc(-7, -6, 3, 0, 7); ctx.arc(11, -6, 3, 0, 7); ctx.fill(); ctx.strokeStyle = "#650918"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 4, 10, .2, Math.PI - .2); ctx.stroke(); ctx.restore();
    ctx.restore();
  }, [levelIndex]);

  useEffect(() => {
    if (screen !== "game") return;
    const canvas = canvasRef.current; const ctx = canvas?.getContext("2d"); if (!canvas || !ctx) return;
    const tick = (now: number) => {
      const s = stateRef.current; const lvl = levels[levelIndex];
      if (!s) { rafRef.current = requestAnimationFrame(tick); return; }
      const dt = Math.min(.025, (now - (lastRef.current || now)) / 1000); lastRef.current = now;
      if (!paused && !message) {
        s.time += dt;
        const c = controls.current;
        const dir = (c.right ? 1 : 0) - (c.left ? 1 : 0);
        s.vx += dir * 1450 * dt; s.vx *= Math.pow(s.grounded && !dir ? .001 : .08, dt); s.vx = Math.max(-430, Math.min(430, s.vx));
        if (c.jumpPressed && s.grounded) { s.vy = -JUMP_SPEED; s.grounded = false; beep(360, .07); } c.jumpPressed = false;
        s.vy = Math.min(1050, s.vy + GRAVITY * dt);
        const movingRects = (lvl.movers || []).map(m => ({ ...m, x: m.x + (m.axis === "x" ? Math.sin(s.time * m.speed + (m.phase || 0)) * m.range : 0), y: m.y + (m.axis === "y" ? Math.sin(s.time * m.speed + (m.phase || 0)) * m.range : 0) }));
        const solids = [...lvl.platforms, ...movingRects];
        const prevX = s.x; s.x += s.vx * dt;
        solids.forEach(p => { if (s.x + BALL_R > p.x && s.x - BALL_R < p.x + p.w && s.y + BALL_R > p.y + 3 && s.y - BALL_R < p.y + p.h) { if (s.vx > 0 && prevX + BALL_R <= p.x + 8) { s.x = p.x - BALL_R; s.vx = 0; } else if (s.vx < 0 && prevX - BALL_R >= p.x + p.w - 8) { s.x = p.x + p.w + BALL_R; s.vx = 0; } } });
        const prevY = s.y; s.y += s.vy * dt; s.grounded = false;
        solids.forEach(p => { if (s.x + BALL_R - 5 > p.x && s.x - BALL_R + 5 < p.x + p.w && s.y + BALL_R > p.y && s.y - BALL_R < p.y + p.h) { if (s.vy >= 0 && prevY + BALL_R <= p.y + 10) { s.y = p.y - BALL_R; s.vy = 0; s.grounded = true; } else if (s.vy < 0 && prevY - BALL_R >= p.y + p.h - 8) { s.y = p.y + p.h + BALL_R; s.vy = 0; } } });
        s.x = Math.max(BALL_R, Math.min(lvl.width - BALL_R, s.x)); s.angle += s.vx * dt / BALL_R;
        lvl.stars.forEach((st, i) => { if (!s.stars[i] && Math.hypot(s.x - st.x, s.y - st.y) < BALL_R + 25) { s.stars[i] = true; const count = s.stars.filter(Boolean).length; setStarCount(count); beep(760 + count * 100, .11); } });
        s.enemies.forEach(e => { if (e.dead) return; e.x += e.dir * (e.speed || 88) * dt; if (e.x < e.min) { e.x = e.min; e.dir = 1; } if (e.x > e.max) { e.x = e.max; e.dir = -1; } const d = Math.hypot(s.x - e.x, s.y - e.y); if (d < BALL_R + 25) { if (s.vy > 110 && s.y < e.y - 8) { e.dead = true; s.vy = -570; beep(190, .08); } else loseLife(); } });
        const hitSpike = lvl.spikes.some(sp => s.x + BALL_R - 8 > sp.x && s.x - BALL_R + 8 < sp.x + sp.w && s.y + BALL_R > sp.y + 5 && s.y - BALL_R < sp.y + sp.h);
        if (hitSpike || s.y > VIEW_H + 90) loseLife();
        if (Math.hypot(s.x - lvl.goal.x, s.y - (lvl.goal.y + 25)) < 70) { const got = s.stars.filter(Boolean).length; saveWin(got); setMessage("win"); beep(900, .28, .06); }
        const targetCamera = Math.max(0, Math.min(lvl.width - VIEW_W, s.x - VIEW_W * .38)); s.camera += (targetCamera - s.camera) * Math.min(1, dt * 6);
      }
      draw(ctx, s, lvl, s.time); rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick); return () => { cancelAnimationFrame(rafRef.current); lastRef.current = 0; };
  }, [screen, levelIndex, paused, message, beep, draw, loseLife, saveWin]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(e.key)) e.preventDefault(); if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") controls.current.left = true; if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") controls.current.right = true; if ((e.key === "ArrowUp" || e.key === " " || e.key.toLowerCase() === "w") && !controls.current.jump) { controls.current.jump = true; controls.current.jumpPressed = true; } if (e.key.toLowerCase() === "r" && screen === "game") resetLevel(); if (e.key === "Escape" && screen === "game" && !message) setPaused(p => !p); };
    const up = (e: KeyboardEvent) => { if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") controls.current.left = false; if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") controls.current.right = false; if (e.key === "ArrowUp" || e.key === " " || e.key.toLowerCase() === "w") controls.current.jump = false; };
    window.addEventListener("keydown", down, { passive: false }); window.addEventListener("keyup", up); return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [screen, message, resetLevel]);

  const touch = (key: "left" | "right" | "jump", active: boolean) => {
    if (key === "jump" && active && !controls.current.jump) controls.current.jumpPressed = true;
    controls.current[key] = active;
  };
  const toggleSound = () => { soundRef.current = !soundRef.current; setSound(soundRef.current); };

  return (
    <main className="app-shell">
      <div className="grain" aria-hidden="true" />
      {screen === "menu" && (
        <section className="menu-screen">
          <div className="menu-cloud cloud-one" /><div className="menu-cloud cloud-two" />
          <div className="hero-copy">
            <p className="eyebrow">10 BÖLÜMLÜ MACERA</p>
            <h1>KIZIL<br /><span>ZIPLA!</span></h1>
            <p className="intro">Minik kahramanımızı yuvarla, dikenlerden kaç ve altın tacın yolunu aç.</p>
            <div className="menu-actions">
              <button className="primary-button" onClick={() => startLevel(Math.min(progress.unlocked - 1, 9))}><span>▶</span> MACERAYA BAŞLA</button>
              <button className="secondary-button" onClick={() => setScreen("levels")}>BÖLÜMLER</button>
            </div>
            <p className="control-hint"><kbd>A</kbd><kbd>D</kbd> hareket &nbsp; <kbd>W</kbd> / <kbd>↑</kbd> zıpla</p>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="sun" /><div className="hill hill-back" /><div className="hill hill-front" />
            <div className="grass-platform"><i /><i /><i /><i /></div>
            <div className="hero-ball"><span className="eye left-eye" /><span className="eye right-eye" /><span className="smile" /></div>
            <div className="hero-star">★</div><div className="spike-row">▲ ▲ ▲</div>
          </div>
          <button className="sound-button" onClick={toggleSound} aria-label={sound ? "Sesi kapat" : "Sesi aç"}>{sound ? "♫" : "×"}</button>
        </section>
      )}

      {screen === "levels" && (
        <section className="level-screen">
          <header className="level-header"><button className="round-button" onClick={() => setScreen("menu")} aria-label="Ana menüye dön">←</button><div><p className="eyebrow">YOLCULUK HARİTASI</p><h2>Bölümünü seç</h2></div><div className="total-stars">★ {progress.scores.reduce((a, b) => a + b, 0)} / 30</div></header>
          <div className="level-grid">
            {levels.map((lvl, i) => { const locked = i + 1 > progress.unlocked; return <button key={lvl.name} disabled={locked} onClick={() => startLevel(i)} className={`level-card ${locked ? "locked" : ""}`}><span className="level-number">{locked ? "◆" : String(i + 1).padStart(2, "0")}</span><span className="level-info"><strong>{lvl.name}</strong><small>{locked ? "Önceki bölümü bitir" : lvl.subtitle}</small></span><span className="card-stars">{[0, 1, 2].map(n => <i key={n} className={n < (progress.scores[i] || 0) ? "earned" : ""}>★</i>)}</span></button>; })}
          </div>
        </section>
      )}

      {screen === "game" && (
        <section className="game-screen">
          <div className="game-topbar">
            <button className="round-button dark" onClick={() => { setScreen("levels"); setMessage(null); }} aria-label="Bölümlere dön">←</button>
            <div className="level-label"><small>BÖLÜM {levelIndex + 1}</small><strong>{levels[levelIndex].name}</strong></div>
            <div className="hud-pill"><span className="mini-ball" /> × {lives}</div>
            <div className="hud-pill stars"><span>★</span> {starCount} / 3</div>
            <button className="round-button dark" onClick={() => setPaused(p => !p)} aria-label={paused ? "Devam et" : "Duraklat"}>{paused ? "▶" : "Ⅱ"}</button>
            <button className="round-button dark" onClick={toggleSound} aria-label={sound ? "Sesi kapat" : "Sesi aç"}>{sound ? "♫" : "×"}</button>
          </div>
          <div className="canvas-frame"><canvas ref={canvasRef} width={VIEW_W} height={VIEW_H} aria-label={`${levels[levelIndex].name} oyun alanı`} /></div>
          <div className="touch-controls" aria-label="Dokunmatik kontroller"><div><button onPointerDown={() => touch("left", true)} onPointerUp={() => touch("left", false)} onPointerLeave={() => touch("left", false)}>←</button><button onPointerDown={() => touch("right", true)} onPointerUp={() => touch("right", false)} onPointerLeave={() => touch("right", false)}>→</button></div><button className="jump-button" onPointerDown={() => touch("jump", true)} onPointerUp={() => touch("jump", false)} onPointerLeave={() => touch("jump", false)}>↑</button></div>
          {paused && !message && <div className="game-modal"><div className="modal-card"><span className="modal-icon">Ⅱ</span><h2>Mola verdik</h2><p>Top da biraz nefeslensin.</p><button className="primary-button small" onClick={() => setPaused(false)}>DEVAM ET</button><button className="text-button" onClick={() => resetLevel()}>Bölümü yeniden başlat</button></div></div>}
          {message && <div className="game-modal"><div className="modal-card"><span className="modal-icon">{message === "win" ? (levelIndex === 9 ? "♛" : "★") : "×"}</span><p className="eyebrow">{message === "win" ? (levelIndex === 9 ? "MACERA TAMAMLANDI" : "BÖLÜM TAMAMLANDI") : "HAKLAR BİTTİ"}</p><h2>{message === "win" ? (levelIndex === 9 ? "Taç senin!" : "Harika yuvarlandın!") : "Bir kez daha?"}</h2>{message === "win" && <div className="result-stars">{[0, 1, 2].map(n => <span key={n} className={n < starCount ? "earned" : ""}>★</span>)}</div>}<button className="primary-button small" onClick={() => { if (message === "win" && levelIndex < 9) startLevel(levelIndex + 1); else resetLevel(); }}>{message === "win" && levelIndex < 9 ? "SONRAKİ BÖLÜM" : "TEKRAR DENE"}</button><button className="text-button" onClick={() => { setScreen("levels"); setMessage(null); }}>Bölüm haritası</button></div></div>}
        </section>
      )}
    </main>
  );
}
