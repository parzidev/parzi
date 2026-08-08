"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BALL_R, GRAVITY, JUMP_SPEED, LEVEL_COUNT, MAX_RUN_SPEED, VIEW_H, VIEW_W, levels } from "./levels";
import type { EnemySpawn, Level } from "./levels";

type Enemy = EnemySpawn & { dir: number; dead: boolean };
type GameState = {
  x: number; y: number; vx: number; vy: number; angle: number; grounded: boolean;
  camera: number; stars: boolean[]; enemies: Enemy[]; lives: number; time: number;
  hasKey?: boolean;
};

const PROGRESS_KEY = "redball-progress";
const LEGACY_PROGRESS_KEY = "kizil-zipla-progress";

const initialProgress = () => {
  if (typeof window === "undefined") return { unlocked: LEVEL_COUNT, scores: Array(LEVEL_COUNT).fill(0) };
  try {
    const raw = localStorage.getItem(PROGRESS_KEY) || localStorage.getItem(LEGACY_PROGRESS_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as { unlocked?: number; scores?: number[] };
      return {
        unlocked: Math.max(LEVEL_COUNT, Math.min(LEVEL_COUNT, saved.unlocked || LEVEL_COUNT)),
        scores: Array.from({ length: LEVEL_COUNT }, (_, index) => saved.scores?.[index] || 0),
      };
    }
  } catch { /* fresh start */ }
  return { unlocked: LEVEL_COUNT, scores: Array(LEVEL_COUNT).fill(0) };
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
  const [hasKey, setHasKey] = useState(false);
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
      hasKey: false,
    };
    setLives(nextLives); setStarCount(0); setHasKey(false); setMessage(null); setPaused(false);
  }, [levelIndex]);

  const startLevel = useCallback((index: number) => {
    setLevelIndex(index); setScreen("game"); setMessage(null); setPaused(false);
    const lvl = levels[index];
    stateRef.current = { x: lvl.start.x, y: lvl.start.y, vx: 0, vy: 0, angle: 0, grounded: false, camera: 0, stars: lvl.stars.map(() => false), enemies: lvl.enemies.map(e => ({ ...e, dir: 1, dead: false })), lives: 3, time: 0, hasKey: false };
    setLives(3); setStarCount(0); setHasKey(false); beep(420, .07);
  }, [beep]);

  const saveWin = useCallback((stars: number) => {
    setProgress(prev => {
      const scores = [...prev.scores]; scores[levelIndex] = Math.max(scores[levelIndex] || 0, stars);
      const next = { unlocked: Math.max(prev.unlocked, Math.min(LEVEL_COUNT, levelIndex + 2)), scores };
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(next)); return next;
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
    const movingRects = lvl.movers.map(m => ({ ...m, x: m.x + (m.axis === "x" ? Math.sin(time * m.speed + (m.phase || 0)) * m.range : 0), y: m.y + (m.axis === "y" ? Math.sin(time * m.speed + (m.phase || 0)) * m.range : 0) }));
    [...lvl.platforms, ...movingRects].forEach((p, i) => {
      ctx.fillStyle = i >= lvl.platforms.length ? "#7149aa" : lvl.theme.ground; ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = i >= lvl.platforms.length ? "#b68cff" : lvl.theme.grass; ctx.fillRect(p.x, p.y, p.w, Math.min(13, p.h));
      ctx.fillStyle = "rgba(255,255,255,.18)"; ctx.fillRect(p.x + 8, p.y + 5, Math.max(0, p.w - 16), 3);
      if (p.h > 40) { ctx.fillStyle = "rgba(42,25,18,.14)"; for (let xx = p.x + 22; xx < p.x + p.w; xx += 58) ctx.fillRect(xx, p.y + 34, 12, 8); }
    });

    // Speed Booster Pads
    if (lvl.boosters) {
      lvl.boosters.forEach(b => {
        ctx.fillStyle = "#ffe033"; ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.fillStyle = "#ff9900"; for (let ax = b.x + 15; ax < b.x + b.w - 10; ax += 25) { ctx.beginPath(); ctx.moveTo(ax, b.y + 2); ctx.lineTo(ax + 12, b.y + 5); ctx.lineTo(ax, b.y + 8); ctx.fill(); }
      });
    }

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
    }

    if (levelIndex === LEVEL_COUNT - 1) { ctx.fillStyle = "#ffd32a"; ctx.beginPath(); ctx.moveTo(gx - 28, gy - 65); ctx.lineTo(gx - 14, gy - 90); ctx.lineTo(gx, gy - 68); ctx.lineTo(gx + 15, gy - 90); ctx.lineTo(gx + 30, gy - 65); ctx.closePath(); ctx.fill(); }
    
    // Player Ball
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
        s.vx += dir * 1450 * dt; s.vx *= Math.pow(s.grounded && !dir ? .001 : .08, dt); s.vx = Math.max(-MAX_RUN_SPEED, Math.min(MAX_RUN_SPEED, s.vx));
        if (c.jumpPressed && s.grounded) { s.vy = -JUMP_SPEED; s.grounded = false; beep(360, .07); } c.jumpPressed = false;
        s.vy = Math.min(1050, s.vy + GRAVITY * dt);
        const movingRects = lvl.movers.map(m => ({ ...m, x: m.x + (m.axis === "x" ? Math.sin(s.time * m.speed + (m.phase || 0)) * m.range : 0), y: m.y + (m.axis === "y" ? Math.sin(s.time * m.speed + (m.phase || 0)) * m.range : 0) }));
        const solids = [...lvl.platforms, ...movingRects];
        const prevX = s.x; s.x += s.vx * dt;
        solids.forEach(p => { if (s.x + BALL_R > p.x && s.x - BALL_R < p.x + p.w && s.y + BALL_R > p.y + 3 && s.y - BALL_R < p.y + p.h) { if (s.vx > 0 && prevX + BALL_R <= p.x + 8) { s.x = p.x - BALL_R; s.vx = 0; } else if (s.vx < 0 && prevX - BALL_R >= p.x + p.w - 8) { s.x = p.x + p.w + BALL_R; s.vx = 0; } } });
        const prevY = s.y; s.y += s.vy * dt; s.grounded = false;
        solids.forEach(p => { if (s.x + BALL_R - 5 > p.x && s.x - BALL_R + 5 < p.x + p.w && s.y + BALL_R > p.y && s.y - BALL_R < p.y + p.h) { if (s.vy >= 0 && prevY + BALL_R <= p.y + 10) { s.y = p.y - BALL_R; s.vy = 0; s.grounded = true; } else if (s.vy < 0 && prevY - BALL_R >= p.y + p.h - 8) { s.y = p.y + p.h + BALL_R; s.vy = 0; } } });
        
        // Speed Booster collision
        if (lvl.boosters && s.grounded) {
          const booster = lvl.boosters.find(b => s.x + BALL_R > b.x && s.x - BALL_R < b.x + b.w && Math.abs((s.y + BALL_R) - b.y) < 14);
          if (booster) {
            s.vx = (s.vx < 0 ? -1 : 1) * Math.max(Math.abs(s.vx), 750);
            beep(680, .06, .05);
          }
        }

        // Spring collision
        const spring = lvl.springs.find(plant => s.grounded && s.x + BALL_R - 5 > plant.x && s.x - BALL_R + 5 < plant.x + plant.w && Math.abs(s.y + BALL_R - plant.y) < 12);
        if (spring) { s.vy = -spring.power; s.grounded = false; beep(520, .12, .05); }

        // Gold Key pickup
        if (lvl.key && !s.hasKey && Math.hypot(s.x - lvl.key.x, s.y - lvl.key.y) < BALL_R + 25) {
          s.hasKey = true; setHasKey(true); beep(880, .14, .06);
        }

        s.x = Math.max(BALL_R, Math.min(lvl.width - BALL_R, s.x)); s.angle += s.vx * dt / BALL_R;
        lvl.stars.forEach((st, i) => { if (!s.stars[i] && Math.hypot(s.x - st.x, s.y - st.y) < BALL_R + 25) { s.stars[i] = true; const count = s.stars.filter(Boolean).length; setStarCount(count); beep(760 + count * 100, .11); } });
        s.enemies.forEach(e => { if (e.dead) return; e.x += e.dir * (e.speed || 88) * dt; if (e.x < e.min) { e.x = e.min; e.dir = 1; } if (e.x > e.max) { e.x = e.max; e.dir = -1; } const d = Math.hypot(s.x - e.x, s.y - e.y); if (d < BALL_R + 25) { if (s.vy > 110 && s.y < e.y - 8) { e.dead = true; s.vy = -570; beep(190, .08); } else loseLife(); } });
        const hitSpike = lvl.spikes.some(sp => s.x + BALL_R - 8 > sp.x && s.x - BALL_R + 8 < sp.x + sp.w && s.y + BALL_R > sp.y + 5 && s.y - BALL_R < sp.y + sp.h);
        if (hitSpike || s.y > VIEW_H + 90) loseLife();

        // Goal reached (checked with key lock)
        if (Math.hypot(s.x - lvl.goal.x, s.y - (lvl.goal.y + 25)) < 70) {
          if (lvl.key && !s.hasKey) {
            s.vx = -300; beep(220, .15, .05);
          } else {
            const got = s.stars.filter(Boolean).length; saveWin(got); setMessage("win"); beep(900, .28, .06);
          }
        }
        const targetCamera = Math.max(0, Math.min(lvl.width - VIEW_W, s.x - VIEW_W * .38)); s.camera += (targetCamera - s.camera) * Math.min(1, dt * 6);
      }
      draw(ctx, s, lvl, s.time); rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [beep, draw, levelIndex, loseLife, message, paused, saveWin]);

  const touch = (action: "left" | "right" | "jump", active: boolean) => {
    if (action === "jump") { if (active && !controls.current.jump) controls.current.jumpPressed = true; controls.current.jump = active; return; }
    controls.current[action] = active;
  };
  const toggleSound = () => { soundRef.current = !soundRef.current; setSound(soundRef.current); };

  return (
    <main className="app-shell">
      <div className="grain" aria-hidden="true" />
      {screen === "menu" && (
        <section className="menu-screen">
          <div className="menu-cloud cloud-one" /><div className="menu-cloud cloud-two" />
          <div className="hero-copy">
            <p className="eyebrow">ADA İÇİN 100 BÖLÜMLÜ MACERA</p>
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
          <header className="level-header"><button className="round-button" onClick={() => setScreen("menu")} aria-label="Ana menüye dön">←</button><div><p className="eyebrow">10 DÜNYA · 100 BÖLÜM</p><h2>Bölümünü seç</h2></div><div className="total-stars">★ {progress.scores.reduce((a, b) => a + b, 0)} / {LEVEL_COUNT * 3}</div></header>
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
          <div className="canvas-frame"><canvas ref={canvasRef} width={VIEW_W} height={VIEW_H} aria-label={`${levels[levelIndex].name} oyun alanı`} /></div>
          <div className="rotate-hint">↻ iPad’i yatay çevirirsen oyun alanı genişler.</div>
          <div className="touch-controls" aria-label="Dokunmatik kontroller"><div><button aria-label="Sola git" onPointerDown={() => touch("left", true)} onPointerUp={() => touch("left", false)} onPointerCancel={() => touch("left", false)} onPointerLeave={() => touch("left", false)}>←</button><button aria-label="Sağa git" onPointerDown={() => touch("right", true)} onPointerUp={() => touch("right", false)} onPointerCancel={() => touch("right", false)} onPointerLeave={() => touch("right", false)}>→</button></div><button aria-label="Zıpla" className="jump-button" onPointerDown={() => touch("jump", true)} onPointerUp={() => touch("jump", false)} onPointerCancel={() => touch("jump", false)} onPointerLeave={() => touch("jump", false)}>↑</button></div>
          {paused && !message && <div className="game-modal"><div className="modal-card"><span className="modal-icon">Ⅱ</span><h2>Mola verdik</h2><p>Top da biraz nefeslensin.</p><button className="primary-button small" onClick={() => setPaused(false)}>DEVAM ET</button><button className="text-button" onClick={() => resetLevel()}>Bölümü yeniden başlat</button></div></div>}
          {message && (
            <div className="game-modal">
              <div className="modal-card">
                <span className="modal-icon">{message === "win" ? (levelIndex === LEVEL_COUNT - 1 ? "♛" : "★") : "×"}</span>
                <p className="eyebrow">
                  {message === "win" ? (levelIndex === LEVEL_COUNT - 1 ? "MACERA TAMAMLAYAN KEDİM" : "KAZANDIN ADA!") : "KAYBETTİN ADA"}
                </p>
                <h2>
                  {message === "win" ? (levelIndex === LEVEL_COUNT - 1 ? "ELLLERİNE SAĞLIK KEDİM 100 BÖLÜMÜN TAMAMINI BİTİRDİN!" : "Harika oynadın bebeğimmmmmm") : "SEN ÖLDÜN MÜÜÜ KIYAMAMMM"}
                </h2>
                {!(message === "win" && levelIndex === LEVEL_COUNT - 1) && (
                  <p>{message === "win" ? "FENAAA İYİSİNNN" : "Hadi bir kez daha dene sevgilim."}</p>
                )}
                {message === "win" && <div className="result-stars">{[0, 1, 2].map(n => <span key={n} className={n < starCount ? "earned" : ""}>★</span>)}</div>}
                <button className="primary-button small" onClick={() => { if (message === "win" && levelIndex < LEVEL_COUNT - 1) startLevel(levelIndex + 1); else resetLevel(); }}>
                  {message === "win" && levelIndex < LEVEL_COUNT - 1 ? "SONRAKİ BÖLÜM, ADA" : "TEKRAR DENE ADA"}
                </button>
                <button className="text-button" onClick={() => { setScreen("levels"); setMessage(null); }}>Bölüm haritası</button>
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
