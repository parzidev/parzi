"use client";

import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { advanceCheatIndex, CHEAT_SEQUENCE, isLevelUnlockCode, isSingleLevelSkipCode } from "./cheat";
import type { CheatAction } from "./cheat";
import { BALL_R, GRAVITY, JUMP_SPEED, LEVEL_COUNT, MAX_RUN_SPEED, VIEW_H, VIEW_W, isLaserGateActive, isPhasePlatformActive, levels } from "./levels";
import type { Level } from "./levels";
import { createPhysicsState, stepPhysics } from "./physics";
import type { PhysicsState } from "./physics";
import { loadProgress, normalizeProgress, PROGRESS_KEY, skipNextLevel } from "./progress";

const SpecialWorld3D = lazy(() => import("./SpecialWorld3D"));

type GameState = PhysicsState & { lives: number };

const initialProgress = () => {
  if (typeof window === "undefined") return normalizeProgress(undefined, LEVEL_COUNT);
  return loadProgress(window.localStorage, LEVEL_COUNT);
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

function distanceToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax, dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared)) : 0;
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

const CHEAT_EMOJIS = ["🐱", "😼", "🐾", "🕵️‍♂️", "⚡", "✨", "🪄", "👑", "🎭", "😻", "🐈", "🕶️"];

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState | null>(null);
  const controls = useRef({ left: false, right: false, jump: false, jumpPressed: false });
  const cheatIndexRef = useRef(0);
  const rafRef = useRef(0);
  const lastRef = useRef(0);
  const soundRef = useRef(true);
  const specialReadyRef = useRef(false);
  const [screen, setScreen] = useState<"menu" | "levels" | "game">("menu");
  const [levelIndex, setLevelIndex] = useState(0);
  const [lives, setLives] = useState(3);
  const [starCount, setStarCount] = useState(0);
  const [hasKey, setHasKey] = useState(false);
  const [paused, setPaused] = useState(false);
  const [message, setMessage] = useState<"win" | "lose" | "cheat" | null>(null);
  const [sound, setSound] = useState(true);
  const [progress, setProgress] = useState(initialProgress);
  const [levelCheatCode, setLevelCheatCode] = useState("");
  const [levelCheatStatus, setLevelCheatStatus] = useState<"idle" | "success" | "error">("idle");
  const [levelCheatMessage, setLevelCheatMessage] = useState("");

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
    const directions = lvl.enemies.map(() => Math.random() > .5 ? 1 : -1);
    stateRef.current = { ...createPhysicsState(lvl, directions), lives: nextLives };
    specialReadyRef.current = false;
    setLives(nextLives); setStarCount(0); setHasKey(false); setMessage(null); setPaused(false);
  }, [levelIndex]);

  const startLevel = useCallback((index: number) => {
    setLevelIndex(index); setScreen("game"); setMessage(null); setPaused(false);
    const lvl = levels[index];
    stateRef.current = { ...createPhysicsState(lvl), lives: 3 };
    specialReadyRef.current = false;
    setLives(3); setStarCount(0); setHasKey(false); beep(420, .07);
  }, [beep]);

  const saveWin = useCallback((stars: number) => {
    setProgress(prev => {
      const scores = [...prev.scores]; scores[levelIndex] = Math.max(scores[levelIndex] || 0, stars);
      const next = { ...prev, unlocked: Math.max(prev.unlocked, Math.min(LEVEL_COUNT, levelIndex + 2)), scores };
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(next)); return next;
    });
  }, [levelIndex]);

  const triggerCheat = useCallback(() => {
    cheatIndexRef.current = 0;
    if (stateRef.current) stateRef.current.stars = stateRef.current.stars.map(() => true);
    setStarCount(3);
    saveWin(3);
    setMessage("cheat");
    setPaused(false);
    beep(900, .28, .06);
  }, [beep, saveWin]);

  const advanceCheat = useCallback((action: CheatAction) => {
    const nextIndex = advanceCheatIndex(cheatIndexRef.current, action);
    if (nextIndex === CHEAT_SEQUENCE.length) triggerCheat();
    else cheatIndexRef.current = nextIndex;
  }, [triggerCheat]);

  const submitLevelCheat = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const unlockAll = isLevelUnlockCode(levelCheatCode);
    const skipOne = isSingleLevelSkipCode(levelCheatCode);
    if (!unlockAll && !skipOne) {
      setLevelCheatStatus("error");
      setLevelCheatMessage("Bu kod olmadı kedim.");
      beep(145, .16, .045);
      return;
    }
    setProgress(prev => {
      const next = unlockAll ? { ...prev, unlocked: LEVEL_COUNT } : skipNextLevel(prev, LEVEL_COUNT);
      try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(next)); } catch { /* unlocked for this session */ }
      return next;
    });
    if (unlockAll) setLevelCheatMessage(`Tüm ${LEVEL_COUNT} bölüm açıldı!`);
    else if (progress.unlocked < LEVEL_COUNT) setLevelCheatMessage(`${progress.unlocked}. bölüm geçildi, ${progress.unlocked + 1}. bölüm açıldı!`);
    else setLevelCheatMessage(`Tüm ${LEVEL_COUNT} bölüm zaten açık.`);
    setLevelCheatCode("");
    setLevelCheatStatus("success");
    beep(unlockAll ? 960 : 820, .24, .055);
  };

  const loseLife = useCallback(() => {
    const s = stateRef.current; if (!s || message || s.invulnerable > 0) return;
    s.lives -= 1; setLives(s.lives); beep(120, .22, .06);
    if (s.lives <= 0) { setMessage("lose"); return; }
    const lvl = levels[levelIndex];
    const checkpoint = { ...s.checkpoint };
    const checkpointIndex = s.checkpointIndex;
    const collectedStars = [...s.stars];
    const livesLeft = s.lives;
    const fresh = createPhysicsState(lvl);
    Object.assign(s, fresh, {
      x: checkpoint.x,
      y: checkpoint.y,
      camera: Math.max(0, Math.min(lvl.width - VIEW_W, checkpoint.x - VIEW_W * .38)),
      checkpoint,
      checkpointIndex,
      stars: collectedStars,
      lives: livesLeft,
      invulnerable: 1,
    });
    setHasKey(false);
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
    lvl.gravityZones.forEach(zone => {
      ctx.fillStyle = "rgba(120,92,205,.13)"; ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
      ctx.strokeStyle = "rgba(255,255,255,.48)"; ctx.lineWidth = 3;
      for (let yy = zone.y + 42; yy < zone.y + zone.h; yy += 72) {
        for (let xx = zone.x + 34; xx < zone.x + zone.w; xx += 64) {
          ctx.beginPath(); ctx.arc(xx, yy, 10 + Math.sin(time * 3 + xx) * 2, 0, Math.PI * 2); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(xx, yy + 18); ctx.lineTo(xx, yy - 17); ctx.lineTo(xx - 7, yy - 9); ctx.moveTo(xx, yy - 17); ctx.lineTo(xx + 7, yy - 9); ctx.stroke();
        }
      }
    });
    lvl.windZones.forEach(zone => {
      ctx.fillStyle = "rgba(230,250,255,.15)"; ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
      ctx.fillStyle = "rgba(255,255,255,.62)";
      const direction = zone.force >= 0 ? 1 : -1;
      for (let xx = zone.x + 35; xx < zone.x + zone.w - 20; xx += 62) {
        for (let yy = zone.y + 45; yy < zone.y + zone.h; yy += 82) {
          ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx + direction * 28, yy); ctx.lineTo(xx + direction * 18, yy - 8); ctx.moveTo(xx + direction * 28, yy); ctx.lineTo(xx + direction * 18, yy + 8); ctx.strokeStyle = "rgba(255,255,255,.72)"; ctx.lineWidth = 4; ctx.stroke();
        }
      }
    });
    lvl.waterZones.forEach(zone => {
      ctx.fillStyle = "rgba(31,166,224,.32)"; ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
      ctx.strokeStyle = "rgba(188,245,255,.8)"; ctx.lineWidth = 4; ctx.beginPath();
      for (let xx = zone.x; xx <= zone.x + zone.w; xx += 24) ctx.lineTo(xx, zone.y + Math.sin(time * 3 + xx * .04) * 5);
      ctx.stroke();
    });
    lvl.lava.forEach(pool => {
      const top = pool.y + Math.sin(time * pool.speed + (pool.phase || 0)) * pool.wave;
      const gradient = ctx.createLinearGradient(0, top, 0, top + pool.h); gradient.addColorStop(0, "#ffd04a"); gradient.addColorStop(.2, "#ff6b22"); gradient.addColorStop(1, "#8d1714");
      ctx.fillStyle = gradient; ctx.fillRect(pool.x, top, pool.w, pool.h);
      ctx.fillStyle = "rgba(255,245,160,.72)"; for (let xx = pool.x + 12; xx < pool.x + pool.w; xx += 34) ctx.fillRect(xx, top + 6 + Math.sin(xx + time * 4) * 3, 15, 4);
    });
    const movingRects = lvl.movers.map(m => ({ ...m, x: m.x + (m.axis === "x" ? Math.sin(time * m.speed + (m.phase || 0)) * m.range : 0), y: m.y + (m.axis === "y" ? Math.sin(time * m.speed + (m.phase || 0)) * m.range : 0) }));
    [...lvl.platforms, ...movingRects].forEach((p, i) => {
      ctx.fillStyle = i >= lvl.platforms.length ? "#7149aa" : lvl.theme.ground; ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = i >= lvl.platforms.length ? "#b68cff" : lvl.theme.grass; ctx.fillRect(p.x, p.y, p.w, Math.min(13, p.h));
      ctx.fillStyle = "rgba(255,255,255,.18)"; ctx.fillRect(p.x + 8, p.y + 5, Math.max(0, p.w - 16), 3);
      if (p.h > 40) { ctx.fillStyle = "rgba(42,25,18,.14)"; for (let xx = p.x + 22; xx < p.x + p.w; xx += 58) ctx.fillRect(xx, p.y + 34, 12, 8); }
    });
    lvl.phasePlatforms.forEach(platform => {
      const active = isPhasePlatformActive(platform, time);
      ctx.save(); ctx.globalAlpha = active ? .95 : .2;
      ctx.fillStyle = active ? "#9b7be3" : "#d8caff"; ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
      ctx.fillStyle = "rgba(255,255,255,.82)"; ctx.fillRect(platform.x + 8, platform.y + 5, platform.w - 16, 4);
      ctx.strokeStyle = "#5b3d99"; ctx.lineWidth = 3; ctx.strokeRect(platform.x, platform.y, platform.w, platform.h);
      ctx.restore();
    });
    lvl.crumbles.forEach((p, i) => {
      const timer = s.crumbleTimers[i] ?? -1;
      if (timer >= p.delay && timer < p.delay + p.respawn) return;
      const shake = timer > 0 ? Math.sin(time * 42) * Math.min(5, timer * 6) : 0;
      ctx.save(); ctx.translate(shake, 0); ctx.fillStyle = "#79634e"; ctx.fillRect(p.x, p.y, p.w, p.h); ctx.fillStyle = "#d9b674"; ctx.fillRect(p.x, p.y, p.w, 12);
      ctx.strokeStyle = "#473b34"; ctx.lineWidth = 3; for (let xx = p.x + 55; xx < p.x + p.w; xx += 90) { ctx.beginPath(); ctx.moveTo(xx, p.y + 4); ctx.lineTo(xx - 12, p.y + 28); ctx.lineTo(xx + 8, p.y + 48); ctx.stroke(); } ctx.restore();
    });
    if (lvl.keyPlatform) {
      const p = lvl.keyPlatform;
      const glow = ctx.createLinearGradient(p.x, p.y, p.x + p.w, p.y); glow.addColorStop(0, "#e9a91e"); glow.addColorStop(.5, "#fff09a"); glow.addColorStop(1, "#e9a91e");
      ctx.fillStyle = glow; ctx.fillRect(p.x, p.y, p.w, 10);
      ctx.fillStyle = "rgba(255,210,44,.18)"; ctx.fillRect(p.x - 8, p.y - 5, p.w + 16, 34);
      ctx.fillStyle = "#7b5110"; ctx.font = "900 11px Arial"; ctx.textAlign = "center"; ctx.fillText("ANAHTAR ODASI", p.x + p.w / 2, p.y + 20);
    }

    // Speed Booster Pads
    lvl.boosters.forEach(b => {
      ctx.fillStyle = "#ffe033"; ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = "#ff9900"; for (let ax = b.x + 15; ax < b.x + b.w - 10; ax += 25) { ctx.beginPath(); ctx.moveTo(ax, b.y + 2); ctx.lineTo(ax + 12, b.y + 5); ctx.lineTo(ax, b.y + 8); ctx.fill(); }
    });
    lvl.ice.forEach(strip => {
      ctx.fillStyle = "rgba(190,248,255,.9)"; ctx.fillRect(strip.x, strip.y, strip.w, strip.h);
      ctx.fillStyle = "rgba(255,255,255,.8)"; for (let xx = strip.x + 12; xx < strip.x + strip.w; xx += 45) { ctx.beginPath(); ctx.moveTo(xx, strip.y + 2); ctx.lineTo(xx + 18, strip.y + strip.h - 2); ctx.lineTo(xx + 31, strip.y + 2); ctx.fill(); }
    });
    lvl.conveyors.forEach(belt => {
      const direction = belt.speed >= 0 ? 1 : -1;
      ctx.fillStyle = "#3f4652"; ctx.fillRect(belt.x, belt.y, belt.w, belt.h);
      ctx.fillStyle = "#ffd052";
      for (let xx = belt.x + 14; xx < belt.x + belt.w - 10; xx += 28) {
        ctx.beginPath(); ctx.moveTo(xx, belt.y + 2); ctx.lineTo(xx + direction * 11, belt.y + belt.h / 2); ctx.lineTo(xx, belt.y + belt.h - 2); ctx.fill();
      }
    });

    lvl.springs.forEach(spring => {
      const sway = Math.sin(time * 4 + spring.x * .01) * 4;
      ctx.strokeStyle = "#247b42"; ctx.lineWidth = 8; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(spring.x + spring.w / 2, spring.y); ctx.quadraticCurveTo(spring.x + spring.w / 2 + sway, spring.y - 23, spring.x + spring.w / 2, spring.y - 42); ctx.stroke();
      ctx.fillStyle = "#48bd59";
      ctx.beginPath(); ctx.ellipse(spring.x + 22 + sway, spring.y - 26, 23, 11, -.45, 0, Math.PI * 2); ctx.ellipse(spring.x + spring.w - 20 + sway, spring.y - 28, 23, 11, .45, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ffcf35"; ctx.beginPath(); ctx.arc(spring.x + spring.w / 2, spring.y - 48, 15 + Math.sin(time * 5) * 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff5ad"; ctx.beginPath(); ctx.arc(spring.x + spring.w / 2 - 5, spring.y - 53, 4, 0, Math.PI * 2); ctx.fill();
    });

    lvl.spikes.forEach(sp => { const count = Math.max(2, Math.round(sp.w / 28)); const sw = sp.w / count; for (let i = 0; i < count; i++) { ctx.fillStyle = "#4c5263"; ctx.beginPath(); ctx.moveTo(sp.x + i * sw, sp.y + sp.h); ctx.lineTo(sp.x + (i + .5) * sw, sp.y); ctx.lineTo(sp.x + (i + 1) * sw, sp.y + sp.h); ctx.fill(); ctx.strokeStyle = "#313744"; ctx.stroke(); } });
    lvl.stars.forEach((st, i) => { if (s.stars[i]) return; ctx.save(); ctx.translate(st.x, st.y); ctx.rotate(time * 1.8); ctx.shadowColor = "#ffd531"; ctx.shadowBlur = 18; starPath(ctx, 0, 0, 25); ctx.fillStyle = "#ffd531"; ctx.fill(); ctx.strokeStyle = "#e7a918"; ctx.lineWidth = 4; ctx.stroke(); ctx.restore(); });

    // Floating Gold Key
    if (lvl.key && !s.hasKey) {
      const ky = lvl.key.y + Math.sin(time * 3.5) * 6;
      ctx.save(); ctx.translate(lvl.key.x, ky); ctx.shadowColor = "#ffd700"; ctx.shadowBlur = 20;
      ctx.strokeStyle = "#ffcc00"; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, -10, 12, 0, Math.PI * 2); ctx.stroke();
      ctx.fillRect(-2, 2, 5, 22); ctx.fillRect(3, 14, 8, 4); ctx.fillRect(3, 20, 6, 4);
      ctx.restore();
    }

    lvl.portals.forEach((portal, pairIndex) => {
      [portal.a, portal.b].forEach((point, side) => {
        const pulse = 1 + Math.sin(time * 4 + pairIndex + side * Math.PI) * .08;
        ctx.save(); ctx.translate(point.x, point.y); ctx.scale(pulse, 1);
        ctx.shadowColor = portal.color; ctx.shadowBlur = 22;
        ctx.strokeStyle = portal.color; ctx.lineWidth = 11; ctx.beginPath(); ctx.ellipse(0, 0, 25, 43, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = "rgba(255,255,255,.82)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, 0, 13, 29, time * (side ? -1 : 1), 0, Math.PI * 1.45); ctx.stroke();
        ctx.restore();
      });
    });

    lvl.spinners.forEach(spinner => {
      const angle = time * spinner.speed + (spinner.phase || 0);
      const dx = Math.cos(angle) * spinner.length, dy = Math.sin(angle) * spinner.length;
      ctx.strokeStyle = "#2f3440"; ctx.lineWidth = 17; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(spinner.x - dx, spinner.y - dy); ctx.lineTo(spinner.x + dx, spinner.y + dy); ctx.stroke();
      ctx.strokeStyle = "#ffca36"; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(spinner.x - dx, spinner.y - dy); ctx.lineTo(spinner.x + dx, spinner.y + dy); ctx.stroke();
      ctx.fillStyle = "#f04a3f"; ctx.beginPath(); ctx.arc(spinner.x, spinner.y, 17, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff2af"; ctx.beginPath(); ctx.arc(spinner.x - 4, spinner.y - 5, 4, 0, Math.PI * 2); ctx.fill();
    });

    lvl.laserGates.forEach(gate => {
      const active = isLaserGateActive(gate, time);
      ctx.fillStyle = "#3a3542"; ctx.fillRect(gate.x - 15, gate.y - 8, 30, 18); ctx.fillRect(gate.x - 15, gate.y + gate.h - 10, 30, 18);
      ctx.fillStyle = active ? "#ffeb78" : "#8e8295"; ctx.beginPath(); ctx.arc(gate.x, gate.y + 1, 7, 0, Math.PI * 2); ctx.arc(gate.x, gate.y + gate.h - 1, 7, 0, Math.PI * 2); ctx.fill();
      if (active) {
        ctx.save(); ctx.shadowColor = "#ff3d4f"; ctx.shadowBlur = 18; ctx.strokeStyle = "#ff4357"; ctx.lineWidth = 8;
        ctx.beginPath(); ctx.moveTo(gate.x, gate.y + 8); ctx.lineTo(gate.x, gate.y + gate.h - 8); ctx.stroke();
        ctx.strokeStyle = "#fff5bf"; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
      }
    });

    lvl.checkpoints.forEach((checkpoint, i) => {
      const active = i <= s.checkpointIndex;
      const surfaceY = checkpoint.y + BALL_R;
      ctx.strokeStyle = active ? "#f5b51b" : "#596371"; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(checkpoint.x, surfaceY); ctx.lineTo(checkpoint.x, surfaceY - 78); ctx.stroke();
      ctx.fillStyle = active ? "#ffd84e" : "#d5d8dc"; ctx.beginPath(); ctx.moveTo(checkpoint.x + 3, surfaceY - 76); ctx.lineTo(checkpoint.x + 48, surfaceY - 62); ctx.lineTo(checkpoint.x + 3, surfaceY - 47); ctx.closePath(); ctx.fill();
      ctx.fillStyle = active ? "rgba(255,216,78,.22)" : "rgba(255,255,255,.12)"; ctx.beginPath(); ctx.arc(checkpoint.x, checkpoint.y, 42, 0, Math.PI * 2); ctx.fill();
    });

    s.enemies.forEach(e => { if (e.dead) return; ctx.save(); ctx.translate(e.x, e.y); ctx.fillStyle = "#242a35"; ctx.rotate(time * e.dir); ctx.fillRect(-23, -23, 46, 46); ctx.fillStyle = "#f6f7fb"; ctx.fillRect(-14, -12, 9, 11); ctx.fillRect(5, -12, 9, 11); ctx.fillStyle = "#141820"; ctx.fillRect(-11, -9, 4, 5); ctx.fillRect(7, -9, 4, 5); ctx.restore(); });

    // Goal Portal / Locked Gate
    const gx = lvl.goal.x, gy = lvl.goal.y;
    const isLocked = lvl.key && !s.hasKey;
    ctx.fillStyle = isLocked ? "rgba(255,80,80,.25)" : "rgba(255,224,75,.25)"; ctx.beginPath(); ctx.arc(gx, gy, 66 + Math.sin(time * 3) * 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = isLocked ? "#ff4444" : "#ffcc26"; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(gx, gy, 46, Math.PI, 0); ctx.lineTo(gx + 46, gy + 65); ctx.lineTo(gx - 46, gy + 65); ctx.closePath(); ctx.stroke();
    ctx.fillStyle = isLocked ? "#ffaaaa" : "#fff5a9"; ctx.fillRect(gx - 34, gy + 4, 68, 60); ctx.fillStyle = isLocked ? "#cc0000" : "#ffbd21"; ctx.beginPath(); ctx.arc(gx + 17, gy + 35, 5, 0, 7); ctx.fill();

    if (isLocked) {
      // Draw padlock 🔒 icon over gate
      ctx.fillStyle = "#d32f2f"; ctx.beginPath(); ctx.roundRect(gx - 14, gy + 20, 28, 22, 4); ctx.fill();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(gx, gy + 20, 8, Math.PI, 0); ctx.stroke();
      ctx.fillStyle = "rgba(119,10,25,.9)"; ctx.beginPath(); ctx.roundRect(gx - 76, gy - 70, 152, 27, 10); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.font = "900 12px Arial"; ctx.textAlign = "center"; ctx.fillText("ÖNCE ANAHTARI BUL", gx, gy - 52);
    }

    if (levelIndex === LEVEL_COUNT - 1) { ctx.fillStyle = "#ffd32a"; ctx.beginPath(); ctx.moveTo(gx - 28, gy - 65); ctx.lineTo(gx - 14, gy - 90); ctx.lineTo(gx, gy - 68); ctx.lineTo(gx + 15, gy - 90); ctx.lineTo(gx + 30, gy - 65); ctx.closePath(); ctx.fill(); }

    // Player Ball
    ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.angle); ctx.globalAlpha = s.invulnerable > 0 && Math.floor(time * 12) % 2 ? .35 : 1; ctx.shadowColor = "rgba(80,0,0,.25)"; ctx.shadowBlur = 14; ctx.shadowOffsetY = 10;
    const red = ctx.createRadialGradient(-9, -12, 3, 0, 0, BALL_R); red.addColorStop(0, "#ff7676"); red.addColorStop(.38, "#f13542"); red.addColorStop(1, "#b80d26"); ctx.fillStyle = red; ctx.beginPath(); ctx.arc(0, 0, BALL_R, 0, 7); ctx.fill(); ctx.shadowBlur = 0; ctx.strokeStyle = "#8f0d20"; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = "white"; ctx.beginPath(); ctx.ellipse(-9, -7, 7, 9, 0, 0, 7); ctx.ellipse(9, -7, 7, 9, 0, 0, 7); ctx.fill(); ctx.fillStyle = "#20232a"; ctx.beginPath(); ctx.arc(-7, -6, 3, 0, 7); ctx.arc(11, -6, 3, 0, 7); ctx.fill(); ctx.strokeStyle = "#650918"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 4, 10, .2, Math.PI - .2); ctx.stroke(); ctx.restore();
    ctx.restore();
  }, [levelIndex]);

  useEffect(() => {
    if (screen !== "game") return;
    const canvas = canvasRef.current; const ctx = canvas?.getContext("2d"); if (!canvas || !ctx) return;
    lastRef.current = 0;
    const tick = (now: number) => {
      const s = stateRef.current; const lvl = levels[levelIndex];
      if (!s) { rafRef.current = requestAnimationFrame(tick); return; }
      const dt = Math.min(.025, (now - (lastRef.current || now)) / 1000); lastRef.current = now;
      if (!paused && !message) {
        const c = controls.current;
        const dir = ((c.right ? 1 : 0) - (c.left ? 1 : 0)) as -1 | 0 | 1;
        const events = stepPhysics(lvl, s, { dir, jumpPressed: c.jumpPressed }, dt);
        c.jumpPressed = false;
        for (const event of events) {
          if (event.type === "jump") beep(360, .07);
          else if (event.type === "boost") beep(680, .06, .05);
          else if (event.type === "spring") beep(520, .12, .05);
          else if (event.type === "key") { setHasKey(true); beep(880, .14, .06); }
          else if (event.type === "checkpoint") beep(740, .12, .045);
          else if (event.type === "portal") beep(620, .16, .045);
          else if (event.type === "star") { setStarCount(event.count); beep(760 + event.count * 100, .11); }
          else if (event.type === "enemyStomp") beep(190, .08);
          else if (event.type === "gateLocked") beep(220, .15, .05);
          else if (event.type === "death") { loseLife(); break; }
          else if (event.type === "win") { saveWin(event.stars); setMessage("win"); beep(900, .28, .06); break; }
        }
      }
      if (levelIndex < 200 || !specialReadyRef.current) draw(ctx, s, lvl, s.time);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(rafRef.current); lastRef.current = 0; };
  }, [beep, draw, levelIndex, loseLife, message, paused, saveWin]);

  useEffect(() => {
    if (screen !== "game") return;
    const press = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (["arrowleft", "arrowright", "arrowup", "a", "d", "w", " "].includes(key)) event.preventDefault();
      if (event.repeat) return;

      if (key === "h" || key === "9" || key === "c") {
        triggerCheat();
        return;
      }

      const isUp = key === "arrowup" || key === "w";
      const isRight = key === "arrowright" || key === "d";
      const isLeft = key === "arrowleft" || key === "a";
      const cheatAction: CheatAction | null = isUp ? "up" : isRight ? "right" : isLeft ? "left" : key === " " || key === "space" ? "jump" : null;
      if (cheatAction) advanceCheat(cheatAction);

      if (key === "arrowleft" || key === "a") controls.current.left = true;
      if (key === "arrowright" || key === "d") controls.current.right = true;
      if (key === "arrowup" || key === "w" || key === " ") {
        if (!controls.current.jump) controls.current.jumpPressed = true;
        controls.current.jump = true;
      }
      if (key === "r") resetLevel();
      if (key === "escape") setPaused(value => !value);
    };
    const release = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === "arrowleft" || key === "a") controls.current.left = false;
      if (key === "arrowright" || key === "d") controls.current.right = false;
      if (key === "arrowup" || key === "w" || key === " ") controls.current.jump = false;
    };
    const releaseAll = () => { controls.current = { left: false, right: false, jump: false, jumpPressed: false }; };
    window.addEventListener("keydown", press); window.addEventListener("keyup", release); window.addEventListener("blur", releaseAll);
    return () => { window.removeEventListener("keydown", press); window.removeEventListener("keyup", release); window.removeEventListener("blur", releaseAll); releaseAll(); };
  }, [advanceCheat, resetLevel, screen, triggerCheat]);

  useEffect(() => {
    if (screen !== "game") return;
    const pauseWhenHidden = () => { if (document.hidden) setPaused(true); };
    document.addEventListener("visibilitychange", pauseWhenHidden);
    return () => document.removeEventListener("visibilitychange", pauseWhenHidden);
  }, [screen]);

  const touch = (action: "left" | "right" | "jump", active: boolean) => {
    if (active) advanceCheat(action);
    if (action === "jump") { if (active && !controls.current.jump) controls.current.jumpPressed = true; controls.current.jump = active; return; }
    controls.current[action] = active;
  };

  const toggleSound = () => { soundRef.current = !soundRef.current; setSound(soundRef.current); };
  const getSpecialRenderState = useCallback(() => stateRef.current, []);

  return (
    <main className="app-shell">
      <div className="grain" aria-hidden="true" />
      {screen === "menu" && (
        <section className="menu-screen">
          <div className="menu-cloud cloud-one" /><div className="menu-cloud cloud-two" />
          <div className="hero-copy">
            <p className="eyebrow">ADA İÇİN 220 BÖLÜMLÜ MACERA</p>
            <h1>RED<br /><span>BALL</span></h1>
            <p className="intro">Ada, minik kahramanımızı yuvarla, dikenlerden kaç ve altın tacın yolunu aç.</p>
            <div className="menu-actions">
              <button className="primary-button" onClick={() => startLevel(Math.min(progress.unlocked - 1, LEVEL_COUNT - 1))}><span>▶</span> MACERAYA BAŞLA</button>
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
          <header className="level-header"><button className="round-button" onClick={() => setScreen("menu")} aria-label="Ana menüye dön">←</button><div><p className="eyebrow">22 DÜNYA · 220 BÖLÜM</p><h2>Bölümünü seç</h2></div><div className="total-stars">★ {progress.scores.reduce((a, b) => a + b, 0)} / {LEVEL_COUNT * 3}</div></header>
          <form className="level-cheat" onSubmit={submitLevelCheat}>
            <label htmlFor="level-cheat-code"><span>🐾</span><strong>Gizli geçit</strong><small>Hile kodunu yaz</small></label>
            <input
              id="level-cheat-code"
              value={levelCheatCode}
              onChange={event => { setLevelCheatCode(event.target.value); setLevelCheatStatus("idle"); setLevelCheatMessage(""); }}
              placeholder="Hile kodu"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              enterKeyHint="done"
              aria-describedby="level-cheat-result"
            />
            <button type="submit">HEPSİNİ AÇ</button>
            <output id="level-cheat-result" className={`level-cheat-result ${levelCheatStatus}`} aria-live="polite">
              {levelCheatMessage}
            </output>
          </form>
          <div className="level-grid">
            {levels.map((lvl, i) => { const locked = i + 1 > progress.unlocked; return <button key={lvl.number} disabled={locked} onClick={() => startLevel(i)} className={`level-card ${locked ? "locked" : ""}`}><span className="level-number">{locked ? "◆" : String(i + 1).padStart(2, "0")}</span><span className="level-info"><em>{lvl.chapter}</em><strong>{lvl.name}</strong><small>{locked ? "Önceki bölümü bitir" : lvl.subtitle}</small></span><span className="card-stars">{[0, 1, 2].map(n => <i key={n} className={n < (progress.scores[i] || 0) ? "earned" : ""}>★</i>)}</span></button>; })}
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
            {levels[levelIndex].key && <div className="hud-pill key">{hasKey ? "🔑 ✓" : "🔑 ✗"}</div>}
            <button className="round-button dark" onClick={() => setPaused(p => !p)} aria-label={paused ? "Devam et" : "Duraklat"}>{paused ? "▶" : "Ⅱ"}</button>
            <button className="round-button dark" onClick={toggleSound} aria-label={sound ? "Sesi kapat" : "Sesi aç"}>{sound ? "♫" : "×"}</button>
          </div>
          <div className="canvas-frame">
            <canvas ref={canvasRef} width={VIEW_W} height={VIEW_H} aria-label={`${levels[levelIndex].name} oyun alanı`} />
            {levelIndex >= 200 && (
              <Suspense fallback={null}>
                <SpecialWorld3D
                  level={levels[levelIndex]}
                  getState={getSpecialRenderState}
                  active={!paused && !message}
                  onReadyChange={ready => { specialReadyRef.current = ready; }}
                />
              </Suspense>
            )}
            {levelIndex >= 200 && <p className="special-mechanic-hint">{levels[levelIndex].subtitle}</p>}
            {levels[levelIndex].note && <p className="level-note">{levels[levelIndex].note}</p>}
          </div>
          <div className="rotate-hint">↻ iPad’i yatay çevirirsen oyun alanı genişler.</div>
          <div className="touch-controls" aria-label="Dokunmatik kontroller"><div><button aria-label="Sola git" onPointerDown={() => touch("left", true)} onPointerUp={() => touch("left", false)} onPointerCancel={() => touch("left", false)} onPointerLeave={() => touch("left", false)}>←</button><button aria-label="Sağa git" onPointerDown={() => touch("right", true)} onPointerUp={() => touch("right", false)} onPointerCancel={() => touch("right", false)} onPointerLeave={() => touch("right", false)}>→</button></div><button aria-label="Zıpla" className="jump-button" onPointerDown={() => touch("jump", true)} onPointerUp={() => touch("jump", false)} onPointerCancel={() => touch("jump", false)} onPointerLeave={() => touch("jump", false)}>↑</button></div>
          {paused && !message && <div className="game-modal"><div className="modal-card"><span className="modal-icon">Ⅱ</span><h2>Mola verdik</h2><p>Top da biraz nefeslensin.</p><button className="primary-button small" onClick={() => setPaused(false)}>DEVAM ET</button><button className="text-button" onClick={() => resetLevel()}>Bölümü yeniden başlat</button></div></div>}
          {message === "cheat" && (
            <div className="cheat-rain-container" aria-hidden="true">
              {Array.from({ length: 28 }).map((_, i) => (
                <span key={i} className="cheat-emoji-item" style={{ left: `${(i * 33 + 4) % 94}%`, animationDuration: `${2.2 + (i % 6) * 0.4}s`, animationDelay: `${(i % 8) * 0.25}s`, fontSize: `${1.8 + (i % 4) * 0.5}rem` }}>{CHEAT_EMOJIS[i % CHEAT_EMOJIS.length]}</span>
              ))}
            </div>
          )}
          {message && (
            <div className="game-modal">
              <div className="modal-card">
                <span className="modal-icon">{(message === "win" || message === "cheat") ? (levelIndex === LEVEL_COUNT - 1 ? "♛" : "★") : "×"}</span>
                <p className="eyebrow">
                  {message === "cheat" ? "HİLECİ KEDİMMM" : (message === "win" ? (levelIndex === LEVEL_COUNT - 1 ? "MACERA TAMAMLAYAN KEDİM" : "KAZANDIN ADA!") : "KAYBETTİN ADA")}
                </p>
                <h2>
                  {message === "cheat" ? "hileci kedimmm" : (message === "win" ? (levelIndex === LEVEL_COUNT - 1 ? "ELLLERİNE SAĞLIK KEDİM 220 BÖLÜMÜN TAMAMINI BİTİRDİN!" : "Harika oynadın bebeğimmmmmm") : "SEN ÖLDÜN MÜÜÜ KIYAMAMMM")}
                </h2>
                {!((message === "win" || message === "cheat") && levelIndex === LEVEL_COUNT - 1) && (
                  <p>{(message === "win" || message === "cheat") ? "FENAAA İYİSİNNN" : "Hadi bir kez daha dene sevgilim."}</p>
                )}
                {(message === "win" || message === "cheat") && <div className="result-stars">{[0, 1, 2].map(n => <span key={n} className={n < starCount ? "earned" : ""}>★</span>)}</div>}
                <button className="primary-button small" onClick={() => { if ((message === "win" || message === "cheat") && levelIndex < LEVEL_COUNT - 1) startLevel(levelIndex + 1); else resetLevel(); }}>{(message === "win" || message === "cheat") && levelIndex < LEVEL_COUNT - 1 ? "SONRAKİ BÖLÜM, ADA" : "TEKRAR DENE ADA"}</button>
                <button className="text-button" onClick={() => { setScreen("levels"); setMessage(null); }}>Bölüm haritası</button>
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
