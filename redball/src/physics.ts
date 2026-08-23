import {
  BALL_R,
  GRAVITY,
  JUMP_SPEED,
  MAX_RUN_SPEED,
  VIEW_H,
  VIEW_W,
  isLaserGateActive,
  isPhasePlatformActive,
} from "./levels.ts";
import type { Box, EnemySpawn, Level, Piston, Point } from "./levels.ts";

export type PhysicsEnemy = EnemySpawn & { dir: number; dead: boolean };

export type SpecialBlockState = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
};

export type EchoPose = { x: number; y: number; angle: number; time: number };

export type BossRuntime = {
  active: boolean;
  phase: number;
  progress: number;
  defeated: boolean;
  elapsed: number;
  attackTimer: number;
  shockwaves: number[];
};

export type SpecialRuntime = {
  angles: number[];
  blocks: SpecialBlockState[];
  flags: Record<string, boolean | number>;
  echo: EchoPose[];
  echoPose: EchoPose | null;
  gravity: 1 | -1;
  boss: BossRuntime | null;
  waterY: number | null;
  collapseTimers: number[];
  attachedSwing: number;
  swingAngle: number;
  swingVelocity: number;
  attachedZipline: number;
  ziplineProgress: number;
  attachCooldown: number;
  phase: "a" | "b";
  polarity: 1 | -1;
  frozenTimer: number;
  motionTimes: { movers: number; spinners: number; laserGates: number; pistons: number };
  echoActive: boolean;
  echoElapsed: number;
  echoSampleTimer: number;
  wallCoyote: number;
  wallSide: -1 | 0 | 1;
};

export type PhysicsState = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  grounded: boolean;
  camera: number;
  stars: boolean[];
  enemies: PhysicsEnemy[];
  time: number;
  hasKey: boolean;
  crumbleTimers: number[];
  portalCooldown: number;
  gateCooldown: number;
  boostTimer: number;
  invulnerable: number;
  checkpoint: Point;
  checkpointIndex: number;
  special: SpecialRuntime;
};

export type PhysicsInput = Readonly<{ dir: -1 | 0 | 1; jumpPressed: boolean }>;

export type PhysicsEvent =
  | { type: "jump" }
  | { type: "boost" }
  | { type: "spring" }
  | { type: "key" }
  | { type: "checkpoint"; index: number }
  | { type: "portal" }
  | { type: "star"; index: number; count: number }
  | { type: "enemyStomp" }
  | { type: "gateLocked" }
  | { type: "death"; reason: string }
  | { type: "win"; stars: number };

function createSpecialRuntime(level: Level): SpecialRuntime {
  const spec = level.special;
  const blocks = spec?.kind === "pushBlock" || spec?.kind === "pressureGate"
    ? spec.blocks.map(block => ({ x: block.x, y: block.y, vx: 0, vy: 0, angle: 0 }))
    : [];
  const gravity = spec?.kind === "gravityFlip" ? spec.initialGravity : 1;
  const phase = spec?.kind === "phaseSwitch" ? spec.initialPhase : "a";
  const polarity = spec?.kind === "magnet" ? spec.initialPolarity : 1;
  const waterY = spec?.kind === "risingWater" ? spec.course.surfaceStartY : null;
  const boss: BossRuntime | null = spec?.kind === "boss" ? {
    active: false,
    phase: 0,
    progress: 0,
    defeated: false,
    elapsed: 0,
    attackTimer: 0,
    shockwaves: [],
  } : null;
  return {
    angles: spec?.kind === "seesaw"
      ? spec.boards.map(() => 0)
      : spec?.kind === "gears"
        ? spec.gears.map(gear => gear.phase)
        : [],
    blocks,
    flags: {},
    echo: [],
    echoPose: null,
    gravity,
    boss,
    waterY,
    collapseTimers: spec?.kind === "collapse" ? spec.tiles.map(() => -1) : [],
    attachedSwing: -1,
    swingAngle: 0,
    swingVelocity: 0,
    attachedZipline: -1,
    ziplineProgress: 0,
    attachCooldown: 0,
    phase,
    polarity,
    frozenTimer: 0,
    motionTimes: { movers: 0, spinners: 0, laserGates: 0, pistons: 0 },
    echoActive: false,
    echoElapsed: 0,
    echoSampleTimer: 0,
    wallCoyote: 0,
    wallSide: 0,
  };
}

export function createPhysicsState(level: Level, enemyDirections: readonly number[] = []): PhysicsState {
  return {
    x: level.start.x,
    y: level.start.y,
    vx: 0,
    vy: 0,
    angle: 0,
    grounded: false,
    camera: 0,
    stars: level.stars.map(() => false),
    enemies: level.enemies.map((enemy, index) => ({
      ...enemy,
      dir: enemyDirections[index] === -1 ? -1 : 1,
      dead: false,
    })),
    time: 0,
    hasKey: false,
    crumbleTimers: level.crumbles.map(() => -1),
    portalCooldown: 0,
    gateCooldown: 0,
    boostTimer: 0,
    invulnerable: 0,
    checkpoint: { ...level.start },
    checkpointIndex: -1,
    special: createSpecialRuntime(level),
  };
}

export function clonePhysicsState(state: PhysicsState): PhysicsState {
  return {
    ...state,
    stars: [...state.stars],
    enemies: state.enemies.map(enemy => ({ ...enemy })),
    crumbleTimers: [...state.crumbleTimers],
    checkpoint: { ...state.checkpoint },
    special: {
      ...state.special,
      angles: [...state.special.angles],
      blocks: state.special.blocks.map(block => ({ ...block })),
      flags: { ...state.special.flags },
      echo: state.special.echo.map(pose => ({ ...pose })),
      echoPose: state.special.echoPose ? { ...state.special.echoPose } : null,
      boss: state.special.boss ? { ...state.special.boss, shockwaves: [...state.special.boss.shockwaves] } : null,
      collapseTimers: [...state.special.collapseTimers],
      motionTimes: { ...state.special.motionTimes },
    },
  };
}

function distanceToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared
    ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared))
    : 0;
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

type Solid = {
  x: number;
  y: number;
  w: number;
  h: number;
  crumbleIndex: number;
  oneWay?: boolean;
  specialKind?: "block" | "gate" | "breakable" | "gear" | "piston" | "phase" | "collapse";
  specialIndex?: number;
};

const boxMatches = (a: Box, b: Box) => (
  Math.abs(a.x - b.x) < .01
  && Math.abs(a.y - b.y) < .01
  && Math.abs(a.w - b.w) < .01
  && Math.abs(a.h - b.h) < .01
);

function pointToSegmentT(px: number, py: number, a: Point, b: Point) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  return lengthSquared ? Math.max(0, Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / lengthSquared)) : 0;
}

function pistonAmount(piston: Piston, time: number) {
  const cycle = piston.extendTime + piston.holdTime + piston.retractTime;
  const local = ((time + piston.phase) % cycle + cycle) % cycle;
  if (local < piston.extendTime) return local / piston.extendTime;
  if (local < piston.extendTime + piston.holdTime) return 1;
  return 1 - (local - piston.extendTime - piston.holdTime) / piston.retractTime;
}

function overlapsPlayer(state: PhysicsState, box: { x: number; y: number; w: number; h: number }, inset = 0) {
  return state.x + BALL_R - inset > box.x
    && state.x - BALL_R + inset < box.x + box.w
    && state.y + BALL_R - inset > box.y
    && state.y - BALL_R + inset < box.y + box.h;
}

function boxesOverlap(a: Box, b: Box) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/**
 * Advances a state without touching React, DOM, audio, storage or rendering.
 * The caller owns the state and can clone it first when immutable branching is needed.
 */
export function stepPhysics(level: Level, state: PhysicsState, input: PhysicsInput, dt: number): PhysicsEvent[] {
  const events: PhysicsEvent[] = [];
  const special = state.special;
  const spec = level.special;

  state.time += dt;
  state.portalCooldown = Math.max(0, state.portalCooldown - dt);
  state.gateCooldown = Math.max(0, state.gateCooldown - dt);
  state.boostTimer = Math.max(0, state.boostTimer - dt);
  state.invulnerable = Math.max(0, state.invulnerable - dt);
  special.attachCooldown = Math.max(0, special.attachCooldown - dt);
  special.wallCoyote = Math.max(0, special.wallCoyote - dt);
  const wasFrozen = special.frozenTimer > 0;
  special.frozenTimer = Math.max(0, special.frozenTimer - dt);
  const frozenGroups = spec?.kind === "timeFreeze" && wasFrozen ? new Set(spec.affected) : null;
  (Object.keys(special.motionTimes) as Array<keyof SpecialRuntime["motionTimes"]>).forEach(group => {
    if (!frozenGroups?.has(group)) special.motionTimes[group] += dt;
  });

  if (spec?.kind === "gravityFlip") {
    const latch = Number(special.flags.gravityLatch || 0);
    const pad = spec.pads.find(item => overlapsPlayer(state, item, 4));
    if (pad && latch <= 0 && special.gravity !== pad.gravity) {
      special.gravity = pad.gravity;
      special.flags.gravityLatch = .35;
      state.grounded = false;
      state.vy = 90 * pad.gravity;
    } else {
      special.flags.gravityLatch = Math.max(0, latch - dt);
    }
  }
  if (spec?.kind === "phaseSwitch") {
    const pad = spec.pads.find(item => overlapsPlayer(state, item, 4));
    if (pad) special.phase = pad.phase;
  }
  if (spec?.kind === "magnet") {
    const pad = spec.pads.find(item => overlapsPlayer(state, item, 4));
    if (pad) special.polarity = pad.polarity;
  }
  if (spec?.kind === "timeFreeze" && spec.triggers.some(trigger => overlapsPlayer(state, trigger, 4))) {
    special.frozenTimer = Math.max(special.frozenTimer, spec.duration);
  }
  state.crumbleTimers = state.crumbleTimers.map((timer, index) => {
    if (timer < 0) return timer;
    const next = timer + dt;
    return next >= level.crumbles[index].delay + level.crumbles[index].respawn ? -1 : next;
  });

  const dir = input.dir;
  const onIce = state.grounded && level.ice.some(strip => (
    state.x + BALL_R > strip.x
    && state.x - BALL_R < strip.x + strip.w
    && Math.abs(state.y + BALL_R - (strip.y + strip.h)) < 14
  ));
  const gravityZone = level.gravityZones.find(zone => (
    state.x > zone.x - BALL_R
    && state.x < zone.x + zone.w + BALL_R
    && state.y > zone.y - BALL_R
    && state.y < zone.y + zone.h + BALL_R
  ));
  const friction = onIce ? (dir ? .38 : .6) : (state.grounded && !dir ? .001 : .08);
  state.vx += dir * 1450 * dt;
  state.vx *= Math.pow(friction, dt);
  const maxRunSpeed = state.boostTimer > 0 ? 790 : MAX_RUN_SPEED;
  state.vx = Math.max(-maxRunSpeed, Math.min(maxRunSpeed, state.vx));
  if (input.jumpPressed && state.grounded) {
    state.vy = -JUMP_SPEED * special.gravity;
    state.grounded = false;
    events.push({ type: "jump" });
  } else if (input.jumpPressed && spec?.kind === "wallJump" && special.wallCoyote > 0 && special.wallSide !== 0) {
    state.vx = -special.wallSide * spec.horizontalSpeed;
    state.vy = -spec.verticalSpeed;
    state.grounded = false;
    special.wallCoyote = 0;
    events.push({ type: "jump" });
  }
  state.vy = Math.max(-1050, Math.min(1050, state.vy + GRAVITY * level.gravityScale * (gravityZone?.scale || 1) * special.gravity * dt));

  for (const zone of level.windZones) {
    if (state.x > zone.x - BALL_R && state.x < zone.x + zone.w + BALL_R && state.y > zone.y - BALL_R && state.y < zone.y + zone.h + BALL_R) {
      state.vx += zone.force * dt;
      state.vy += (zone.lift || 0) * dt;
    }
  }
  for (const zone of level.waterZones) {
    if (state.x > zone.x - BALL_R && state.x < zone.x + zone.w + BALL_R && state.y > zone.y && state.y < zone.y + zone.h + BALL_R) {
      state.vy -= zone.buoyancy * 1.5 * dt;
      state.vy *= Math.pow(.07, dt);
      state.vx *= Math.pow(.2, dt);
    }
  }

  if (spec?.kind === "risingWater") {
    const course = spec.course;
    special.waterY = Math.max(course.surfaceEndY, (special.waterY ?? course.surfaceStartY) - course.riseSpeed * dt);
    const waterY = special.waterY;
    const insideBasin = state.x + BALL_R > course.basin.x
      && state.x - BALL_R < course.basin.x + course.basin.w
      && state.y + BALL_R > waterY
      && state.y - BALL_R < course.basin.y + course.basin.h;
    const inAirPocket = course.airPockets.some(pocket => overlapsPlayer(state, pocket, 8));
    if (insideBasin && !inAirPocket) {
      state.vy -= course.buoyancy * 1.5 * dt;
      state.vy *= Math.pow(.08, dt);
      state.vx *= Math.pow(.24, dt);
    }
  }

  if (spec?.kind === "magnet") {
    spec.nodes.forEach(node => {
      const dx = node.x - state.x;
      const dy = node.y - state.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 1 || distance > node.radius) return;
      const attraction = node.polarity === special.polarity ? -1 : 1;
      const falloff = 1 - distance / node.radius;
      const force = node.strength * falloff * attraction;
      state.vx += dx / distance * force * dt;
      state.vy += dy / distance * force * dt;
    });
  }

  const movingRects = level.movers.map(mover => ({
    ...mover,
    x: mover.x + (mover.axis === "x" ? Math.sin(special.motionTimes.movers * mover.speed + (mover.phase || 0)) * mover.range : 0),
    y: mover.y + (mover.axis === "y" ? Math.sin(special.motionTimes.movers * mover.speed + (mover.phase || 0)) * mover.range : 0),
  }));
  const activeCrumbles = level.crumbles
    .map((platform, index) => ({ ...platform, crumbleIndex: index }))
    .filter(platform => {
      const timer = state.crumbleTimers[platform.crumbleIndex] ?? -1;
      return timer < 0 || timer < platform.delay;
    });

  const excludedPlatforms: Box[] = [];
  if (spec?.kind === "oneWay") excludedPlatforms.push(...spec.surfaces);
  if (spec?.kind === "phaseSwitch") excludedPlatforms.push(...spec.platforms);
  if (spec?.kind === "collapse") excludedPlatforms.push(...spec.tiles);

  if (spec?.kind === "pushBlock" || spec?.kind === "pressureGate") {
    special.blocks.forEach((block, index) => {
      const config = spec.blocks[index];
      block.vx *= Math.pow(.035, dt);
      block.x = Math.max(config.minX, Math.min(config.maxX, block.x + block.vx * dt));
      block.angle += block.vx * dt / Math.max(18, config.h / 2);
      block.y = config.y;
    });
  }

  if (spec?.kind === "collapse") {
    if (overlapsPlayer(state, spec.trigger, 4) && typeof special.flags.collapseStart !== "number") {
      special.flags.collapseStart = state.time;
    }
    const start = typeof special.flags.collapseStart === "number" ? special.flags.collapseStart : Number.POSITIVE_INFINITY;
    special.collapseTimers = spec.tiles.map(tile => {
      const elapsed = state.time - start - spec.leadTime - tile.order * spec.interval;
      return elapsed >= 0 ? elapsed : -1;
    });
  }

  if (spec?.kind === "boss" && special.boss) {
    const boss = special.boss;
    if (overlapsPlayer(state, spec.arena, -BALL_R)) boss.active = true;
    if (boss.active && !boss.defeated) {
      boss.elapsed += dt;
      while (boss.phase < spec.phases.length && state.x >= spec.phases[boss.phase].triggerX) boss.phase += 1;
      boss.progress = boss.phase / spec.phases.length;
      boss.defeated = boss.phase >= spec.phases.length && state.x > spec.phases.at(-1)!.triggerX + 260;
      const phaseConfig = spec.phases[Math.max(0, Math.min(spec.phases.length - 1, boss.phase - 1))];
      boss.attackTimer += dt;
      if (phaseConfig && boss.attackTimer >= phaseConfig.interval) {
        boss.attackTimer = 0;
        boss.shockwaves.push(0);
      }
      boss.shockwaves = boss.shockwaves.map(radius => radius + spec.shockwaveSpeed * dt).filter(radius => radius < spec.arena.w * .65);
    }
  }

  const solids: Solid[] = [
    ...level.platforms
      .filter(platform => !excludedPlatforms.some(excluded => boxMatches(platform, excluded)))
      .map(platform => ({ ...platform, crumbleIndex: -1 })),
    ...movingRects.map(platform => ({ ...platform, crumbleIndex: -1 })),
    ...level.phasePlatforms
      .filter(platform => isPhasePlatformActive(platform, state.time))
      .map(platform => ({ ...platform, crumbleIndex: -1 })),
    ...activeCrumbles,
  ];

  if (spec?.kind === "oneWay") {
    spec.surfaces.forEach((surface, index) => solids.push({ ...surface, crumbleIndex: -1, oneWay: true, specialIndex: index }));
  }
  if (spec?.kind === "pushBlock" || spec?.kind === "pressureGate") {
    special.blocks.forEach((block, index) => {
      const config = spec.blocks[index];
      solids.push({ x: block.x, y: block.y, w: config.w, h: config.h, crumbleIndex: -1, specialKind: "block", specialIndex: index });
    });
  }
  if (spec?.kind === "pressureGate") {
    spec.gates.forEach((gate, index) => {
      if (!special.flags[`gate:${gate.id}`]) solids.push({ ...gate, crumbleIndex: -1, specialKind: "gate", specialIndex: index });
    });
  }
  if (spec?.kind === "breakableWall") {
    spec.walls.forEach((wall, index) => {
      if (!special.flags[`wall:${index}`]) solids.push({ ...wall, crumbleIndex: -1, specialKind: "breakable", specialIndex: index });
    });
  }
  if (spec?.kind === "phaseSwitch") {
    spec.platforms.forEach((platform, index) => {
      if (platform.phase === special.phase) solids.push({ ...platform, crumbleIndex: -1, specialKind: "phase", specialIndex: index });
    });
  }
  if (spec?.kind === "gears") {
    spec.gears.forEach((gear, index) => {
      const angle = special.motionTimes.movers * gear.speed + gear.phase;
      special.angles[index] = angle;
      solids.push({
        x: gear.x + Math.cos(angle) * gear.radius - gear.toothWidth / 2,
        y: gear.y + Math.sin(angle) * gear.radius - gear.toothHeight / 2,
        w: gear.toothWidth,
        h: gear.toothHeight,
        crumbleIndex: -1,
        specialKind: "gear",
        specialIndex: index,
      });
    });
  }
  if (spec?.kind === "pistons") {
    spec.pistons.forEach((piston, index) => {
      const amount = pistonAmount(piston, special.motionTimes.pistons);
      special.flags[`piston:${index}`] = amount;
      solids.push({
        ...piston,
        x: piston.x + (piston.axis === "x" ? piston.travel * amount : 0),
        y: piston.y - (piston.axis === "y" ? piston.travel * amount : 0),
        crumbleIndex: -1,
        specialKind: "piston",
        specialIndex: index,
      });
    });
  }
  if (spec?.kind === "echo") {
    spec.gates.forEach((gate, index) => {
      if (!special.flags[`echoGate:${gate.id}`]) solids.push({ ...gate, crumbleIndex: -1, specialKind: "gate", specialIndex: index });
    });
  }
  if (spec?.kind === "collapse") {
    spec.tiles.forEach((tile, index) => {
      if (special.collapseTimers[index] < 0) solids.push({ ...tile, crumbleIndex: -1, specialKind: "collapse", specialIndex: index });
    });
  }
  if (spec?.kind === "boss" && special.boss && !special.boss.defeated) {
    solids.push({ ...spec.goalLock, crumbleIndex: -1, specialKind: "gate" });
  }

  const previousX = state.x;
  state.x += state.vx * dt;
  for (const platform of solids) {
    if (platform.oneWay) continue;
    if (state.x + BALL_R > platform.x && state.x - BALL_R < platform.x + platform.w && state.y + BALL_R > platform.y + 3 && state.y - BALL_R < platform.y + platform.h) {
      if (platform.specialKind === "breakable" && spec?.kind === "breakableWall") {
        const wall = spec.walls[platform.specialIndex || 0];
        if (Math.abs(state.vx) >= wall.minImpactSpeed) {
          special.flags[`wall:${platform.specialIndex || 0}`] = true;
          state.vx *= .72;
          continue;
        }
      }
      if (platform.specialKind === "block" && (spec?.kind === "pushBlock" || spec?.kind === "pressureGate")) {
        const index = platform.specialIndex || 0;
        const block = special.blocks[index];
        const config = spec.blocks[index];
        const pushDirection = state.vx > 0 ? 1 : -1;
        block.vx = Math.max(-config.maxSpeed, Math.min(config.maxSpeed, block.vx + pushDirection * config.pushAcceleration * dt));
        const nextX = Math.max(config.minX, Math.min(config.maxX, block.x + block.vx * dt));
        const shifted = nextX - block.x;
        block.x = nextX;
        platform.x += shifted;
        state.vx *= .82;
      }
      if (state.vx > 0 && previousX + BALL_R <= platform.x + 8) {
        state.x = platform.x - BALL_R;
        state.vx = 0;
        if (spec?.kind === "wallJump" && spec.walls.some(wall => boxMatches(wall, platform))) {
          special.wallSide = 1;
          special.wallCoyote = spec.coyoteTime;
        }
      } else if (state.vx < 0 && previousX - BALL_R >= platform.x + platform.w - 8) {
        state.x = platform.x + platform.w + BALL_R;
        state.vx = 0;
        if (spec?.kind === "wallJump" && spec.walls.some(wall => boxMatches(wall, platform))) {
          special.wallSide = -1;
          special.wallCoyote = spec.coyoteTime;
        }
      }
    }
  }

  const previousY = state.y;
  state.y += state.vy * dt;
  state.grounded = false;
  let groundedSolid: Solid | null = null;
  for (const platform of solids) {
    if (!overlapsPlayer(state, platform, 5)) continue;
    if (platform.oneWay && (special.gravity < 0 || state.vy < 0 || previousY + BALL_R > platform.y + 10)) continue;
    if (special.gravity > 0) {
      if (state.vy >= 0 && previousY + BALL_R <= platform.y + 10) {
        const impactVelocity = state.vy;
        state.y = platform.y - BALL_R;
        state.vy = 0;
        state.grounded = true;
        groundedSolid = platform;
        if (platform.crumbleIndex >= 0 && state.crumbleTimers[platform.crumbleIndex] < 0) state.crumbleTimers[platform.crumbleIndex] = .001;
        if (spec?.kind === "elastic") {
          const surface = spec.surfaces.find(item => boxMatches(item, platform));
          if (surface) {
            const bounce = Math.max(surface.minBounce, Math.min(surface.maxBounce, Math.abs(impactVelocity) * surface.restitution));
            state.vy = -bounce;
            state.grounded = false;
            events.push({ type: "spring" });
          }
        }
      } else if (state.vy < 0 && previousY - BALL_R >= platform.y + platform.h - 8) {
        state.y = platform.y + platform.h + BALL_R;
        state.vy = 0;
      }
    } else if (state.vy <= 0 && previousY - BALL_R >= platform.y + platform.h - 10) {
      state.y = platform.y + platform.h + BALL_R;
      state.vy = 0;
      state.grounded = true;
      groundedSolid = platform;
    } else if (state.vy > 0 && previousY + BALL_R <= platform.y + 8) {
      state.y = platform.y - BALL_R;
      state.vy = 0;
    }
  }

  if (spec?.kind === "seesaw") {
    spec.boards.forEach((board, index) => {
      const onBoard = groundedSolid && boxMatches(board, groundedSolid);
      const target = onBoard
        ? Math.max(-board.maxAngle, Math.min(board.maxAngle, (state.x - board.pivotX) / (board.w / 2) * board.maxAngle))
        : 0;
      special.angles[index] += (target - special.angles[index]) * Math.min(1, dt * board.response);
      special.angles[index] *= Math.pow(board.damping, dt * 60);
      if (onBoard) state.vx += Math.sin(special.angles[index]) * 260 * dt;
    });
  }

  if (state.grounded) {
    const booster = level.boosters.find(box => (
      state.x + BALL_R > box.x
      && state.x - BALL_R < box.x + box.w
      && Math.abs(state.y + BALL_R - box.y) < 14
    ));
    if (booster) {
      const boostDirection = dir || (state.vx < 0 ? -1 : 1);
      if (state.boostTimer <= .05) events.push({ type: "boost" });
      state.vx = boostDirection * Math.max(Math.abs(state.vx), 750);
      state.boostTimer = .7;
    }
    const conveyor = level.conveyors.find(belt => (
      state.x + BALL_R > belt.x
      && state.x - BALL_R < belt.x + belt.w
      && Math.abs(state.y + BALL_R - (belt.y + belt.h)) < 14
    ));
    if (conveyor) state.vx += (conveyor.speed - state.vx) * Math.min(1, dt * 4.5);
  }

  const spring = level.springs.find(plant => (
    state.grounded
    && state.x + BALL_R - 5 > plant.x
    && state.x - BALL_R + 5 < plant.x + plant.w
    && Math.abs(state.y + BALL_R - plant.y) < 12
  ));
  if (spring) {
    state.vy = -spring.power;
    state.grounded = false;
    events.push({ type: "spring" });
  }

  if (spec?.kind === "pressureGate") {
    spec.plates.forEach(plate => {
      const playerPressed = overlapsPlayer(state, plate, 2);
      const blockPressed = special.blocks.some((block, index) => boxesOverlap(
        { x: block.x, y: block.y, w: spec.blocks[index].w, h: spec.blocks[index].h },
        plate,
      ));
      if (playerPressed || blockPressed) special.flags[`gate:${plate.gateId}`] = true;
    });
  }

  if (spec?.kind === "swing") {
    if (special.attachedSwing >= 0) {
      const anchor = spec.anchors[special.attachedSwing];
      if (input.jumpPressed) {
        const tangentX = Math.cos(special.swingAngle) * anchor.length * special.swingVelocity;
        const tangentY = -Math.sin(special.swingAngle) * anchor.length * special.swingVelocity;
        state.vx = tangentX * anchor.releaseBoost + dir * 110;
        state.vy = tangentY * anchor.releaseBoost - 250;
        special.attachedSwing = -1;
        special.attachCooldown = .35;
        events.push({ type: "jump" });
      } else {
        const acceleration = -Math.sin(special.swingAngle) * GRAVITY / anchor.length + dir * anchor.torque;
        special.swingVelocity = (special.swingVelocity + acceleration * dt) * Math.pow(.992, dt * 60);
        special.swingAngle += special.swingVelocity * dt;
        state.x = anchor.x + Math.sin(special.swingAngle) * anchor.length;
        state.y = anchor.y + Math.cos(special.swingAngle) * anchor.length;
        state.vx = Math.cos(special.swingAngle) * anchor.length * special.swingVelocity;
        state.vy = -Math.sin(special.swingAngle) * anchor.length * special.swingVelocity;
        state.grounded = false;
      }
    } else if (special.attachCooldown <= 0) {
      const index = spec.anchors.findIndex(anchor => Math.abs(Math.hypot(state.x - anchor.x, state.y - anchor.y) - anchor.length) <= anchor.catchRadius);
      if (index >= 0) {
        const anchor = spec.anchors[index];
        special.attachedSwing = index;
        special.swingAngle = Math.atan2(state.x - anchor.x, state.y - anchor.y);
        special.swingVelocity = state.vx / Math.max(1, anchor.length);
      }
    }
  }

  if (spec?.kind === "zipline") {
    if (special.attachedZipline >= 0) {
      const cable = spec.cables[special.attachedZipline];
      const length = Math.hypot(cable.b.x - cable.a.x, cable.b.y - cable.a.y);
      if (input.jumpPressed || special.ziplineProgress >= 1) {
        const dx = (cable.b.x - cable.a.x) / Math.max(1, length);
        const dy = (cable.b.y - cable.a.y) / Math.max(1, length);
        state.vx = dx * cable.speed;
        state.vy = dy * cable.speed - 300;
        special.attachedZipline = -1;
        special.attachCooldown = .3;
        events.push({ type: "jump" });
      } else {
        special.ziplineProgress = Math.min(1, special.ziplineProgress + cable.speed / Math.max(1, length) * dt);
        state.x = cable.a.x + (cable.b.x - cable.a.x) * special.ziplineProgress;
        state.y = cable.a.y + (cable.b.y - cable.a.y) * special.ziplineProgress + 28;
        state.vx = (cable.b.x - cable.a.x) / Math.max(1, length) * cable.speed;
        state.vy = (cable.b.y - cable.a.y) / Math.max(1, length) * cable.speed;
        state.grounded = false;
      }
    } else if (special.attachCooldown <= 0) {
      const index = spec.cables.findIndex(cable => distanceToSegment(state.x, state.y, cable.a.x, cable.a.y, cable.b.x, cable.b.y) <= cable.catchRadius);
      if (index >= 0) {
        const cable = spec.cables[index];
        special.attachedZipline = index;
        special.ziplineProgress = pointToSegmentT(state.x, state.y, cable.a, cable.b);
      }
    }
  }

  if (spec?.kind === "echo") {
    if (overlapsPlayer(state, spec.trigger, 4)) special.echoActive = true;
    if (special.echoActive && special.echoElapsed <= spec.duration) {
      special.echoElapsed += dt;
      special.echoSampleTimer += dt;
      const sampleStep = 1 / spec.sampleRate;
      if (special.echoSampleTimer >= sampleStep) {
        special.echoSampleTimer %= sampleStep;
        special.echo.push({ x: state.x, y: state.y, angle: state.angle, time: state.time });
        const earliest = state.time - spec.delay - spec.duration;
        while (special.echo.length && special.echo[0].time < earliest) special.echo.shift();
      }
    }
    const targetTime = state.time - spec.delay;
    special.echoPose = special.echo.reduce<EchoPose | null>((best, pose) => {
      if (pose.time > targetTime) return best;
      return !best || pose.time > best.time ? pose : best;
    }, null);
    spec.plates.forEach(plate => {
      if (overlapsPlayer(state, plate, 2) && typeof special.flags[`echoPlate:${plate.gateId}`] !== "number") {
        special.flags[`echoPlate:${plate.gateId}`] = state.time;
      }
      const pose = special.echoPose;
      const echoPressed = Boolean(pose && pose.x + BALL_R > plate.x && pose.x - BALL_R < plate.x + plate.w && pose.y + BALL_R > plate.y - 12 && pose.y - BALL_R < plate.y + plate.h + 12);
      const pressedAt = special.flags[`echoPlate:${plate.gateId}`];
      if (echoPressed || (typeof pressedAt === "number" && state.time - pressedAt >= spec.delay)) {
        special.flags[`echoGate:${plate.gateId}`] = true;
      }
    });
  }

  if (level.key && !state.hasKey && Math.hypot(state.x - level.key.x, state.y - level.key.y) < BALL_R + 25) {
    state.hasKey = true;
    state.gateCooldown = 0;
    events.push({ type: "key" });
  }

  level.checkpoints.forEach((checkpoint, index) => {
    if (index > state.checkpointIndex && Math.hypot(state.x - checkpoint.x, state.y - checkpoint.y) < BALL_R + 30) {
      state.checkpoint = { ...checkpoint };
      state.checkpointIndex = index;
      events.push({ type: "checkpoint", index });
    }
  });

  if (state.portalCooldown <= 0) {
    for (let portalIndex = 0; portalIndex < level.portals.length; portalIndex += 1) {
      const portal = level.portals[portalIndex];
      const atA = Math.hypot(state.x - portal.a.x, state.y - portal.a.y) < BALL_R + 27;
      const atB = Math.hypot(state.x - portal.b.x, state.y - portal.b.y) < BALL_R + 27;
      if (atA || atB) {
        const target = atA ? portal.b : portal.a;
        state.x = target.x;
        state.y = target.y;
        if (spec?.kind === "momentumPortal") {
          const pair = spec.pairs[portalIndex];
          if (pair) {
            const speed = Math.max(260, Math.hypot(state.vx, state.vy)) * pair.speedMultiplier;
            const normal = atA ? pair.bNormal : pair.aNormal;
            const normalLength = Math.max(.001, Math.hypot(normal.x, normal.y));
            state.vx = normal.x / normalLength * speed;
            state.vy = normal.y / normalLength * speed;
          }
        }
        state.portalCooldown = .8;
        state.grounded = false;
        events.push({ type: "portal" });
        break;
      }
    }
  }

  state.x = Math.max(BALL_R, Math.min(level.width - BALL_R, state.x));
  state.angle += state.vx * dt / BALL_R;

  level.stars.forEach((star, index) => {
    if (!state.stars[index] && Math.hypot(state.x - star.x, state.y - star.y) < BALL_R + 25) {
      state.stars[index] = true;
      events.push({ type: "star", index, count: state.stars.filter(Boolean).length });
    }
  });

  for (const enemy of state.enemies) {
    if (enemy.dead) continue;
    enemy.x += enemy.dir * (enemy.speed || 88) * dt;
    if (enemy.x < enemy.min) { enemy.x = enemy.min; enemy.dir = 1; }
    if (enemy.x > enemy.max) { enemy.x = enemy.max; enemy.dir = -1; }
    if (Math.hypot(state.x - enemy.x, state.y - enemy.y) < BALL_R + 25) {
      if (state.vy > 110 && state.y < enemy.y - 8) {
        enemy.dead = true;
        state.vy = -570;
        events.push({ type: "enemyStomp" });
      } else if (state.invulnerable <= 0) {
        events.push({ type: "death", reason: "düşman" });
        return events;
      }
    }
  }

  const hitSpike = level.spikes.some(spike => overlapsPlayer(state, spike, 8) && state.y + BALL_R > spike.y + 5);
  const hitLava = level.lava.some(pool => {
    const top = pool.y + Math.sin(state.time * pool.speed + (pool.phase || 0)) * pool.wave;
    return state.x + BALL_R - 5 > pool.x
      && state.x - BALL_R + 5 < pool.x + pool.w
      && state.y + BALL_R > top
      && state.y - BALL_R < top + pool.h;
  });
  const hitSpinner = level.spinners.some(spinner => {
    const angle = special.motionTimes.spinners * spinner.speed + (spinner.phase || 0);
    const dx = Math.cos(angle) * spinner.length;
    const dy = Math.sin(angle) * spinner.length;
    return distanceToSegment(state.x, state.y, spinner.x - dx, spinner.y - dy, spinner.x + dx, spinner.y + dy) < BALL_R + 9;
  });
  const hitLaser = level.laserGates.some(gate => (
    isLaserGateActive(gate, special.motionTimes.laserGates)
    && Math.abs(state.x - gate.x) < BALL_R + 8
    && state.y + BALL_R > gate.y
      && state.y - BALL_R < gate.y + gate.h
  ));
  const hitBossWave = Boolean(spec?.kind === "boss" && special.boss?.shockwaves.some(radius => (
    Math.abs(Math.abs(state.x - spec.center.x) - radius) < spec.shockwaveWidth
    && state.y > 545
    && state.grounded
  )));
  if (hitBossWave) {
    state.vy = -620;
    state.grounded = false;
  }
  if (state.invulnerable <= 0 && (hitSpike || hitLava || hitSpinner || hitLaser || state.y > VIEW_H + 90 || state.y < -90)) {
    const reason = hitSpike ? "diken" : hitLava ? "lav" : hitSpinner ? "dönen tuzak" : hitLaser ? "lazer" : "düşüş";
    events.push({ type: "death", reason });
    return events;
  }

  if (Math.hypot(state.x - level.goal.x, state.y - (level.goal.y + 25)) < 70) {
    if (spec?.kind === "boss" && !special.boss?.defeated) {
      state.x = Math.min(state.x, spec.goalLock.x - BALL_R);
      state.vx = Math.min(state.vx, -260);
      return events;
    }
    if (level.key && !state.hasKey) {
      state.x = Math.min(state.x, level.goal.x - 82);
      state.vx = Math.min(state.vx, -360);
      if (state.gateCooldown <= 0) {
        state.gateCooldown = .65;
        events.push({ type: "gateLocked" });
      }
    } else {
      events.push({ type: "win", stars: state.stars.filter(Boolean).length });
    }
  }

  const targetCamera = Math.max(0, Math.min(level.width - VIEW_W, state.x - VIEW_W * .38));
  state.camera += (targetCamera - state.camera) * Math.min(1, dt * 6);
  return events;
}
