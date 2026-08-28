import assert from "node:assert/strict";
import test from "node:test";
import { levels } from "../src/levels.ts";
import type { Level } from "../src/levels.ts";
import { clonePhysicsState, createPhysicsState, stepPhysics } from "../src/physics.ts";
import type { PhysicsState } from "../src/physics.ts";

const DT = 1 / 60;
const FRAMES_PER_INPUT = 6;
const MAX_INPUTS = 430;
const BEAM_WIDTH = 620;

type Input = Readonly<{ dir: -1 | 0 | 1; jump: boolean; label: string }>;
type SimState = { physics: PhysicsState; won: boolean; dead: boolean; deathReason?: string };
type SearchNode = { state: SimState; replay: string; score: number };
type SearchResult = { replay?: string; elapsed: number; farthestX: number; deathReasons: Map<string, number> };

const INPUTS: readonly Input[] = [
  { dir: 1, jump: true, label: "→↑" },
  { dir: 1, jump: false, label: "→" },
  { dir: 0, jump: true, label: "↑" },
  { dir: 0, jump: false, label: "·" },
  { dir: -1, jump: true, label: "←↑" },
  { dir: -1, jump: false, label: "←" },
];

function initialState(level: Level): SimState {
  return { physics: createPhysicsState(level), won: false, dead: false };
}

function cloneState(state: SimState): SimState {
  return { ...state, physics: clonePhysicsState(state.physics) };
}

function applyInput(level: Level, source: SimState, input: Input) {
  const state = cloneState(source);
  for (let frame = 0; frame < FRAMES_PER_INPUT && !state.dead && !state.won; frame += 1) {
    const events = stepPhysics(level, state.physics, { dir: input.dir, jumpPressed: input.jump && frame === 0 }, DT);
    const death = events.find(event => event.type === "death");
    if (death?.type === "death") {
      state.dead = true;
      state.deathReason = death.reason;
    }
    if (events.some(event => event.type === "win")) state.won = true;
  }
  return state;
}

function stateKey(state: SimState) {
  const s = state.physics;
  const deadEnemies = s.enemies.reduce((mask, enemy, index) => mask | (enemy.dead ? 1 << index : 0), 0);
  const crumbleMask = s.crumbleTimers.reduce((mask, timer, index) => mask | (timer >= 0 ? 1 << index : 0), 0);
  const flagSignature = Object.entries(s.special.flags)
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => `${key}:${typeof value === "number" ? Math.round(value * 4) : 1}`)
    .sort()
    .join(",");
  return [
    Math.round(s.x / 24), Math.round(s.y / 20), Math.round(s.vx / 70), Math.round(s.vy / 90),
    s.grounded ? 1 : 0, s.portalCooldown > 0 ? 1 : 0, s.boostTimer > 0 ? 1 : 0,
    s.special.gravity, s.special.phase, s.special.polarity,
    s.special.attachedSwing, s.special.attachedZipline,
    s.special.blocks.map(block => Math.round(block.x / 28)).join("."),
    s.special.boss?.phase || 0, s.special.boss?.defeated ? 1 : 0,
    s.chaserX === null ? "-" : Math.round(s.chaserX / 24), Math.round(s.chaserSpeed / 12), Math.round(s.chaserGrace * 10),
    s.chaserBeatIndex, Math.round(s.chaserBeatTimer * 10), Math.round(s.chaserBeatMultiplier * 10),
    deadEnemies, crumbleMask, flagSignature,
  ].join(":");
}

function nodeScore(level: Level, state: SimState) {
  const s = state.physics;
  const goalDistance = Math.hypot(s.x - level.goal.x, s.y - (level.goal.y + 25));
  const objective = Object.keys(s.special.flags).length * 90
    + (s.special.boss?.phase || 0) * 250
    + (s.special.boss?.defeated ? 900 : 0);
  return s.x * 8 - goalDistance * .08 + (s.grounded ? 55 : 0) - Math.abs(s.vy) * .018 + objective;
}

function findReplay(level: Level): SearchResult {
  let beam: SearchNode[] = [{ state: initialState(level), replay: "", score: 0 }];
  let farthestX = level.start.x;
  const deathReasons = new Map<string, number>();
  for (let depth = 0; depth < MAX_INPUTS; depth += 1) {
    const unique = new Map<string, SearchNode>();
    for (const node of beam) {
      for (let inputIndex = 0; inputIndex < INPUTS.length; inputIndex += 1) {
        const state = applyInput(level, node.state, INPUTS[inputIndex]);
        farthestX = Math.max(farthestX, state.physics.x);
        if (state.won) return { replay: node.replay + inputIndex.toString(36), elapsed: state.physics.time, farthestX, deathReasons };
        if (state.dead) {
          const reason = state.deathReason || "bilinmeyen";
          deathReasons.set(reason, (deathReasons.get(reason) || 0) + 1);
          continue;
        }
        const candidate = { state, replay: node.replay + inputIndex.toString(36), score: nodeScore(level, state) };
        const key = stateKey(state);
        const previous = unique.get(key);
        if (!previous || candidate.score > previous.score) unique.set(key, candidate);
      }
    }
    beam = [...unique.values()].sort((a, b) => b.score - a.score).slice(0, BEAM_WIDTH);
    if (!beam.length) break;
  }
  return { elapsed: MAX_INPUTS * FRAMES_PER_INPUT * DT, farthestX, deathReasons };
}

function replay(level: Level, encoded: string) {
  let state = initialState(level);
  for (const code of encoded) {
    state = applyInput(level, state, INPUTS[Number.parseInt(code, 36)]);
    if (state.dead || state.won) break;
  }
  return state;
}

function summarizeDeaths(deaths: Map<string, number>) {
  return [...deaths.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([reason, count]) => `${reason}:${count}`).join(", ");
}

test("201–220 ortak oyun fiziğinde yalnız dokunmatik left/right/jump ile bitirilebilir", { timeout: 90_000 }, () => {
  const failures: string[] = [];
  for (const level of levels.slice(200, 220)) {
    const result = findReplay(level);
    if (!result.replay) {
      failures.push(`#${level.number} ${level.name}: en uzak x=${result.farthestX.toFixed(0)}/${level.width}, ölümler=[${summarizeDeaths(result.deathReasons)}]`);
      continue;
    }
    const finalState = replay(level, result.replay);
    if (!finalState.won) failures.push(`#${level.number} ${level.name}: deterministik replay bozuldu`);
  }
  assert.deepEqual(failures, [], failures.join("\n"));
});

test("180–200 uzun diken duvarı kaçışları yalnız dokunmatik left/right/jump ile bitirilebilir", { timeout: 180_000 }, () => {
  const failures: string[] = [];
  const requestedLevel = Number(process.env.ESCAPE_LEVEL || 0);
  const escapeLevels = requestedLevel >= 180 && requestedLevel <= 200
    ? [levels[requestedLevel - 1]]
    : levels.slice(179, 200);
  for (const level of escapeLevels) {
    const result = findReplay(level);
    if (!result.replay) {
      failures.push(`#${level.number} ${level.name}: en uzak x=${result.farthestX.toFixed(0)}/${level.width}, ölümler=[${summarizeDeaths(result.deathReasons)}]`);
      continue;
    }
    const finalState = replay(level, result.replay);
    if (!finalState.won) failures.push(`#${level.number} ${level.name}: deterministik replay bozuldu`);
    else if (finalState.physics.time > 35) failures.push(`#${level.number} ${level.name}: bitirme süresi ${finalState.physics.time.toFixed(1)}sn ile çok yavaş`);
  }
  assert.deepEqual(failures, [], failures.join("\n"));
});
