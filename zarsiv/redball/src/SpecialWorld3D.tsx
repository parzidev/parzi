import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { BALL_R, VIEW_H, VIEW_W, isLaserGateActive, isPhasePlatformActive } from "./levels";
import type { Box, Level, SpecialLevelSpec, Theme } from "./levels";
import type { PhysicsState } from "./physics";

export type SpecialRenderState = PhysicsState;

type SpecialWorld3DProps = {
  level: Level;
  getState: () => SpecialRenderState | null;
  active?: boolean;
  onReadyChange?: (ready: boolean) => void;
};

type Palette = {
  skyTop: THREE.Color;
  skyBottom: THREE.Color;
  far: THREE.Color;
  hill: THREE.Color;
  ground: THREE.Color;
  grass: THREE.Color;
  accent: THREE.Color;
};

type PlatformBinding = { object: THREE.Group; box: Box; phase?: number; speed?: number; range?: number; axis?: "x" | "y" };
type LavaBinding = { object: THREE.Mesh; baseY: number; wave: number; speed: number; phase: number };
type SpinnerBinding = { object: THREE.Group; speed: number; phase: number };
type LaserBinding = { beam: THREE.Mesh; glow: THREE.Mesh; activeTime: number; inactiveTime: number; phase?: number };
type CheckpointBinding = { flag: THREE.Mesh; halo: THREE.Mesh };
type SpecialVisualBinding = {
  kind?: SpecialLevelSpec["kind"];
  root: THREE.Group;
  primary: THREE.Object3D[];
  secondary: THREE.Object3D[];
  tertiary: THREE.Object3D[];
  ghost?: THREE.Group;
  water?: THREE.Mesh;
  shockwaves: THREE.Mesh[];
};

type SceneBinding = {
  levelNumber: number;
  root: THREE.Group;
  background: { fixed: THREE.Group; far: THREE.Group; mid: THREE.Group; clouds: THREE.Group };
  player: THREE.Group;
  playerShadow: THREE.Mesh;
  movers: PlatformBinding[];
  crumbles: THREE.Group[];
  phases: THREE.Group[];
  stars: THREE.Group[];
  portals: THREE.Group[];
  lava: LavaBinding[];
  spinners: SpinnerBinding[];
  lasers: LaserBinding[];
  enemies: THREE.Group[];
  checkpoints: CheckpointBinding[];
  key?: THREE.Group;
  goal: THREE.Group;
  special: SpecialVisualBinding;
  previousGrounded: boolean;
  landingPulse: number;
};

type Runtime = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  binding?: SceneBinding;
  setReady: (ready: boolean) => void;
};

const toWorldY = (screenY: number) => VIEW_H - screenY;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function paletteFromTheme(theme: Theme): Palette {
  return {
    skyTop: new THREE.Color(theme.sky[0]),
    skyBottom: new THREE.Color(theme.sky[1]),
    far: new THREE.Color(theme.far),
    hill: new THREE.Color(theme.hill),
    ground: new THREE.Color(theme.ground),
    grass: new THREE.Color(theme.grass),
    accent: new THREE.Color(theme.accent),
  };
}

function disposeObject(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh || object instanceof THREE.LineSegments || object instanceof THREE.Points)) return;
    geometries.add(object.geometry);
    const list = Array.isArray(object.material) ? object.material : [object.material];
    list.forEach(material => materials.add(material));
  });
  geometries.forEach(geometry => geometry.dispose());
  materials.forEach(material => material.dispose());
}

// Scene setup ---------------------------------------------------------------

function createSkyMaterial(palette: Palette) {
  return new THREE.ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    uniforms: {
      topColor: { value: palette.skyTop },
      bottomColor: { value: palette.skyBottom },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      varying vec2 vUv;
      void main() {
        float blend = smoothstep(0.02, 0.94, vUv.y);
        vec3 color = mix(bottomColor, topColor, blend);
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
}

function setupCamera() {
  const camera = new THREE.OrthographicCamera(-VIEW_W / 2, VIEW_W / 2, VIEW_H / 2, -VIEW_H / 2, .1, 2400);
  camera.position.set(VIEW_W / 2 + 30, VIEW_H / 2 + 22, 1200);
  camera.lookAt(VIEW_W / 2, VIEW_H / 2, 0);
  return camera;
}

function setupLighting(scene: THREE.Scene, palette: Palette) {
  scene.add(new THREE.HemisphereLight(palette.skyBottom, palette.ground, 2.15));
  const key = new THREE.DirectionalLight(0xfff4dc, 2.65);
  key.position.set(-420, 720, 900);
  scene.add(key);
  const rim = new THREE.DirectionalLight(palette.accent, .55);
  rim.position.set(620, 260, 520);
  scene.add(rim);
}

// Background / parallax layers ---------------------------------------------

function createParallaxBackground(root: THREE.Group, palette: Palette) {
  const fixed = new THREE.Group();
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(1900, 1050), createSkyMaterial(palette));
  sky.position.set(VIEW_W / 2, VIEW_H / 2, -520);
  fixed.add(sky);

  const sun = new THREE.Mesh(
    new THREE.CircleGeometry(52, 32),
    new THREE.MeshBasicMaterial({ color: palette.accent, toneMapped: false }),
  );
  sun.position.set(1070, 610, -470);
  fixed.add(sun);
  root.add(fixed);

  const far = new THREE.Group();
  const farMountains = new THREE.InstancedMesh(
    new THREE.ConeGeometry(1, 1, 5),
    new THREE.MeshLambertMaterial({ color: palette.far, flatShading: true }),
    12,
  );
  const matrix = new THREE.Matrix4();
  for (let i = 0; i < 12; i += 1) {
    const width = 210 + (i % 4) * 42;
    const height = 170 + (i % 3) * 42;
    matrix.compose(
      new THREE.Vector3(-420 + i * 285, 165 + height / 2, -455),
      new THREE.Quaternion(),
      new THREE.Vector3(width, height, 72),
    );
    farMountains.setMatrixAt(i, matrix);
  }
  farMountains.instanceMatrix.needsUpdate = true;
  far.add(farMountains);
  root.add(far);

  const mid = new THREE.Group();
  const hills = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 12, 7, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshLambertMaterial({ color: palette.hill, flatShading: true }),
    10,
  );
  for (let i = 0; i < 10; i += 1) {
    const width = 220 + (i % 3) * 65;
    const height = 135 + (i % 4) * 24;
    matrix.compose(
      new THREE.Vector3(-360 + i * 355, 70, -405),
      new THREE.Quaternion(),
      new THREE.Vector3(width, height, 82),
    );
    hills.setMatrixAt(i, matrix);
  }
  hills.instanceMatrix.needsUpdate = true;
  mid.add(hills);
  root.add(mid);

  const clouds = new THREE.Group();
  const cloudPuffs = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 10, 7),
    new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: .88 }),
    21,
  );
  let puff = 0;
  for (let cloud = 0; cloud < 7; cloud += 1) {
    const x = -260 + cloud * 520;
    const y = 530 + (cloud % 3) * 58;
    const sizes = [[42, 24], [55, 33], [38, 23]];
    sizes.forEach(([width, height], part) => {
      matrix.compose(
        new THREE.Vector3(x + part * 42, y + (part === 1 ? 15 : 0), -360),
        new THREE.Quaternion(),
        new THREE.Vector3(width, height, 24),
      );
      cloudPuffs.setMatrixAt(puff, matrix);
      puff += 1;
    });
  }
  cloudPuffs.instanceMatrix.needsUpdate = true;
  clouds.add(cloudPuffs);
  root.add(clouds);
  return { fixed, far, mid, clouds };
}

// Platform generation -------------------------------------------------------

type PlatformKind = "ground" | "moving" | "crumble" | "phase";
type PlatformMaterialSet = { body: THREE.MeshLambertMaterial; top: THREE.MeshToonMaterial };

function platformColors(palette: Palette, kind: PlatformKind) {
  if (kind === "moving") return { body: 0x6e4aa8, top: 0xb78cf1 };
  if (kind === "crumble") return { body: 0x766454, top: 0xd7b676 };
  if (kind === "phase") return { body: 0x684994, top: 0xc5a8f1 };
  return { body: palette.ground, top: palette.grass };
}

function createPlatformMaterialSet(palette: Palette, kind: PlatformKind): PlatformMaterialSet {
  const colors = platformColors(palette, kind);
  return {
    body: new THREE.MeshLambertMaterial({ color: colors.body, flatShading: true }),
    top: new THREE.MeshToonMaterial({ color: colors.top }),
  };
}

function createPlatform(box: Box, palette: Palette, kind: PlatformKind = "ground", materials?: PlatformMaterialSet) {
  const group = new THREE.Group();
  const depth = kind === "ground" ? 82 : 62;
  const radius = Math.min(9, Math.max(3, box.h * .16));

  const body = new THREE.Mesh(
    new RoundedBoxGeometry(box.w, box.h, depth, 2, radius),
    materials?.body || createPlatformMaterialSet(palette, kind).body,
  );
  body.position.set(box.x + box.w / 2, toWorldY(box.y + box.h / 2), 0);
  group.add(body);

  const capHeight = Math.min(14, Math.max(8, box.h * .25));
  const cap = new THREE.Mesh(
    new RoundedBoxGeometry(Math.max(12, box.w - 2), capHeight, depth + 8, 2, Math.min(5, capHeight / 2)),
    materials?.top || createPlatformMaterialSet(palette, kind).top,
  );
  cap.position.set(box.x + box.w / 2, toWorldY(box.y + capHeight / 2), 5);
  group.add(cap);
  return group;
}

function createSurfaceStrip(box: Box, color: number, emissive = 0x000000) {
  const mesh = new THREE.Mesh(
    new RoundedBoxGeometry(box.w, Math.max(7, box.h), 72, 2, 3),
    new THREE.MeshPhongMaterial({ color, emissive, emissiveIntensity: .35, shininess: 70 }),
  );
  mesh.position.set(box.x + box.w / 2, toWorldY(box.y + box.h / 2), 18);
  return mesh;
}

function createDirectionalStrip(box: Box, speed: number, bodyColor: number, arrowColor: number, emissive: number) {
  const group = new THREE.Group();
  group.add(createSurfaceStrip(box, bodyColor, emissive));
  const arrowShape = new THREE.Shape();
  arrowShape.moveTo(-7, -6);
  arrowShape.lineTo(7, 0);
  arrowShape.lineTo(-7, 6);
  arrowShape.closePath();
  const arrowGeometry = new THREE.ShapeGeometry(arrowShape);
  const arrowMaterial = new THREE.MeshBasicMaterial({ color: arrowColor, side: THREE.DoubleSide, toneMapped: false });
  const count = Math.max(2, Math.floor(box.w / 34));
  for (let i = 0; i < count; i += 1) {
    const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
    arrow.position.set(box.x + box.w * ((i + .5) / count), toWorldY(box.y + box.h / 2), 58);
    if (speed < 0) arrow.scale.x = -1;
    group.add(arrow);
  }
  return group;
}

function createStarGeometry() {
  const shape = new THREE.Shape();
  for (let i = 0; i < 10; i += 1) {
    const angle = Math.PI / 2 + i * Math.PI / 5;
    const radius = i % 2 ? 11 : 24;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
  }
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, { depth: 8, bevelEnabled: true, bevelSegments: 1, bevelSize: 2, bevelThickness: 2 });
}

// Player creation -----------------------------------------------------------

function createPlayer() {
  const player = new THREE.Group();
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(BALL_R * 1.08, 28, 20),
    new THREE.MeshPhysicalMaterial({ color: 0xe52339, roughness: .35, metalness: .02, clearcoat: .75, clearcoatRoughness: .22 }),
  );
  player.add(ball);
  const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 75 });
  const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x18202b });
  [-9, 9].forEach(x => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(7.2, 14, 10), eyeMaterial);
    eye.scale.set(1, 1.25, .55);
    eye.position.set(x, 7, 27);
    player.add(eye);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(2.8, 10, 8), pupilMaterial);
    pupil.position.set(x + 1.5, 6, 32);
    player.add(pupil);
  });
  const highlight = new THREE.Mesh(
    new THREE.SphereGeometry(6, 12, 8),
    new THREE.MeshBasicMaterial({ color: 0xff9fa7, transparent: true, opacity: .75 }),
  );
  highlight.scale.set(1, .58, .28);
  highlight.position.set(-10, 15, 25);
  player.add(highlight);
  return player;
}

function createPlayerShadow() {
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(31, 24),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { shadowAlpha: { value: .16 } },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float shadowAlpha;
        varying vec2 vUv;
        void main() {
          float distanceFromCenter = distance(vUv, vec2(0.5));
          float softness = 1.0 - smoothstep(0.08, 0.5, distanceFromCenter);
          gl_FragColor = vec4(0.05, 0.07, 0.10, softness * shadowAlpha);
        }
      `,
    }),
  );
  shadow.scale.set(1.3, .38, 1);
  return shadow;
}

// Collectibles, checkpoints and hazards ------------------------------------

function createPortal(x: number, y: number, color: string) {
  const group = new THREE.Group();
  group.position.set(x, toWorldY(y), 46);
  const outer = new THREE.Mesh(
    new THREE.TorusGeometry(34, 7, 8, 30),
    new THREE.MeshPhongMaterial({ color, emissive: color, emissiveIntensity: .34, shininess: 90 }),
  );
  const inner = new THREE.Mesh(
    new THREE.TorusGeometry(23, 2.5, 6, 28),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .72 }),
  );
  inner.position.z = 4;
  group.add(outer, inner);
  return group;
}

function createCheckpoint(x: number, y: number): CheckpointBinding & { group: THREE.Group } {
  const group = new THREE.Group();
  group.position.set(x, toWorldY(y + BALL_R), 48);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 72, 8), new THREE.MeshLambertMaterial({ color: 0x56616d }));
  pole.position.y = 36;
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(44, 26), new THREE.MeshPhongMaterial({ color: 0xe4e7e8, side: THREE.DoubleSide }));
  flag.position.set(22, 61, 3);
  const halo = new THREE.Mesh(
    new THREE.RingGeometry(31, 38, 24),
    new THREE.MeshBasicMaterial({ color: 0xffcf3f, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }),
  );
  halo.position.y = 14;
  group.add(pole, flag, halo);
  return { group, flag, halo };
}

function createGoal(level: Level, palette: Palette) {
  const group = new THREE.Group();
  group.position.set(level.goal.x, toWorldY(level.goal.y), 42);
  const gold = new THREE.MeshPhongMaterial({ color: 0xffc82e, emissive: 0x8b4f08, emissiveIntensity: .2, shininess: 95 });
  const arch = new THREE.Mesh(new THREE.TorusGeometry(46, 8, 8, 32, Math.PI), gold);
  const left = new THREE.Mesh(new RoundedBoxGeometry(16, 66, 24, 2, 5), gold);
  const right = left.clone();
  left.position.set(-46, -32, 0);
  right.position.set(46, -32, 0);
  const door = new THREE.Mesh(new RoundedBoxGeometry(76, 63, 10, 2, 7), new THREE.MeshLambertMaterial({ color: palette.accent }));
  door.position.set(0, -33, -3);
  group.add(arch, left, right, door);
  return group;
}

function createZoneFrame(zone: Box, color: number, direction: "horizontal" | "vertical") {
  const group = new THREE.Group();
  const boxGeometry = new THREE.BoxGeometry(zone.w, zone.h, 6);
  const edgeGeometry = new THREE.EdgesGeometry(boxGeometry);
  boxGeometry.dispose();
  const frame = new THREE.LineSegments(
    edgeGeometry,
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: .42 }),
  );
  frame.position.set(zone.x + zone.w / 2, toWorldY(zone.y + zone.h / 2), 12);
  group.add(frame);
  const markerMaterial = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .72 });
  for (let i = 0; i < 3; i += 1) {
    const marker = new THREE.Mesh(new THREE.ConeGeometry(8, 18, 3), markerMaterial);
    marker.position.set(zone.x + zone.w * (.25 + i * .25), toWorldY(zone.y + zone.h - 22), 18);
    marker.rotation.z = direction === "horizontal" ? -Math.PI / 2 : 0;
    group.add(marker);
  }
  return group;
}

const sameBox = (a: Box, b: Box) => (
  Math.abs(a.x - b.x) < .01
  && Math.abs(a.y - b.y) < .01
  && Math.abs(a.w - b.w) < .01
  && Math.abs(a.h - b.h) < .01
);

function specialOwnsPlatform(level: Level, box: Box) {
  const spec = level.special;
  if (!spec) return false;
  if (spec.kind === "seesaw") return spec.boards.some(item => sameBox(item, box));
  if (spec.kind === "oneWay") return spec.surfaces.some(item => sameBox(item, box));
  if (spec.kind === "phaseSwitch") return spec.platforms.some(item => sameBox(item, box));
  if (spec.kind === "collapse") return spec.tiles.some(item => sameBox(item, box));
  return false;
}

function createSpecialSlab(box: Box, color: number, depth = 70, emissive = 0x000000) {
  const mesh = new THREE.Mesh(
    new RoundedBoxGeometry(box.w, box.h, depth, 2, Math.min(8, Math.max(3, box.h * .22))),
    new THREE.MeshPhongMaterial({ color, emissive, emissiveIntensity: emissive ? .22 : 0, shininess: 65 }),
  );
  mesh.position.set(box.x + box.w / 2, toWorldY(box.y + box.h / 2), 44);
  return mesh;
}

function createMechanicPad(box: Box, color: number, labelShape: "circle" | "diamond" = "circle") {
  const group = new THREE.Group();
  const pad = createSpecialSlab(box, color, 78, color);
  group.add(pad);
  const marker = new THREE.Mesh(
    labelShape === "circle" ? new THREE.RingGeometry(9, 14, 16) : new THREE.OctahedronGeometry(12, 0),
    new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, side: THREE.DoubleSide }),
  );
  marker.position.set(box.x + box.w / 2, toWorldY(box.y - 3), 86);
  group.add(marker);
  return group;
}

function createGhostBall(color = 0xbcecff) {
  const group = createPlayer();
  group.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    object.material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .38, depthWrite: false });
  });
  group.scale.setScalar(.92);
  group.visible = false;
  return group;
}

function setRodBetween(rod: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3, thickness = 6) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy);
  rod.position.set((a.x + b.x) / 2, (a.y + b.y) / 2, a.z);
  rod.scale.set(thickness, length, thickness);
  rod.rotation.z = -Math.atan2(dx, dy);
}

function buildSpecialVisual(level: Level, palette: Palette): SpecialVisualBinding {
  const root = new THREE.Group();
  const binding: SpecialVisualBinding = { kind: level.special?.kind, root, primary: [], secondary: [], tertiary: [], shockwaves: [] };
  const spec = level.special;
  if (!spec) return binding;

  if (spec.kind === "seesaw") {
    spec.boards.forEach(board => {
      const group = new THREE.Group();
      group.position.set(board.pivotX, toWorldY(board.y + board.h / 2), 52);
      const plank = new THREE.Mesh(new RoundedBoxGeometry(board.w, board.h, 72, 2, 7), new THREE.MeshPhongMaterial({ color: 0xb87948, shininess: 38 }));
      plank.position.x = board.x + board.w / 2 - board.pivotX;
      const pivot = new THREE.Mesh(new THREE.CylinderGeometry(17, 23, 34, 12), new THREE.MeshLambertMaterial({ color: 0x765036 }));
      pivot.rotation.x = Math.PI / 2;
      pivot.position.y = -25;
      group.add(plank, pivot); root.add(group); binding.primary.push(group);
    });
  } else if (spec.kind === "oneWay") {
    spec.surfaces.forEach((surface, index) => {
      const leaf = createPlatform(surface, palette, "moving");
      const vein = createSpecialSlab({ x: surface.x + 14, y: surface.y + 6, w: surface.w - 28, h: 4 }, 0xf3d56c, 76);
      leaf.add(vein); root.add(leaf); binding.primary.push(leaf);
      leaf.userData.baseY = index % 2 ? -2 : 2;
    });
  } else if (spec.kind === "wallJump") {
    spec.walls.forEach(wall => {
      const group = new THREE.Group();
      for (let y = wall.y + 26; y < wall.y + wall.h - 12; y += 46) {
        const grip = createSpecialSlab({ x: wall.x + (wall.w - 24) / 2, y, w: 24, h: 8 }, 0xffcf67, 90, 0x7c4a00);
        group.add(grip);
      }
      root.add(group); binding.primary.push(group);
    });
  } else if (spec.kind === "pushBlock" || spec.kind === "pressureGate") {
    spec.blocks.forEach(block => {
      const group = new THREE.Group();
      const body = new THREE.Mesh(new THREE.DodecahedronGeometry(block.w * .48, 1), new THREE.MeshLambertMaterial({ color: 0xb77445, flatShading: true }));
      const cap = new THREE.Mesh(new THREE.ConeGeometry(block.w * .32, block.h * .5, 8), new THREE.MeshToonMaterial({ color: 0x7d9d48 }));
      cap.position.y = block.h * .42;
      group.add(body, cap); group.position.set(block.x + block.w / 2, toWorldY(block.y + block.h / 2), 62);
      root.add(group); binding.primary.push(group);
    });
    if (spec.kind === "pressureGate") {
      spec.plates.forEach(plate => { const object = createMechanicPad(plate, 0xe2a94e, "diamond"); root.add(object); binding.secondary.push(object); });
      spec.gates.forEach(gate => { const object = createSpecialSlab(gate, 0x7b513e, 88); root.add(object); binding.tertiary.push(object); });
    }
  } else if (spec.kind === "breakableWall") {
    spec.walls.forEach(wall => {
      const group = new THREE.Group();
      group.add(createSpecialSlab(wall, 0x755543, 86));
      for (let i = 0; i < 5; i += 1) {
        const crack = new THREE.Mesh(new THREE.BoxGeometry(3, 38 + i * 7, 91), new THREE.MeshBasicMaterial({ color: 0x3d2d28 }));
        crack.position.set(wall.x + wall.w * (.25 + (i % 2) * .45), toWorldY(wall.y + 34 + i * 25), 48);
        crack.rotation.z = (i % 2 ? 1 : -1) * .35;
        group.add(crack);
      }
      root.add(group); binding.primary.push(group);
    });
  } else if (spec.kind === "swing") {
    spec.anchors.forEach(anchor => {
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 8), new THREE.MeshLambertMaterial({ color: 0x3c8f57 }));
      const hook = new THREE.Mesh(new THREE.TorusGeometry(15, 5, 7, 18), new THREE.MeshPhongMaterial({ color: 0xffcf56 }));
      hook.position.set(anchor.x, toWorldY(anchor.y), 72);
      root.add(rod, hook); binding.primary.push(rod); binding.secondary.push(hook);
    });
  } else if (spec.kind === "zipline") {
    spec.cables.forEach(cable => {
      const curve = new THREE.LineCurve3(new THREE.Vector3(cable.a.x, toWorldY(cable.a.y), 58), new THREE.Vector3(cable.b.x, toWorldY(cable.b.y), 58));
      const rail = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 4, 7, false), new THREE.MeshPhongMaterial({ color: 0x6a4d3f, shininess: 55 }));
      const trolley = new THREE.Group();
      trolley.add(new THREE.Mesh(new THREE.TorusGeometry(13, 5, 7, 18), new THREE.MeshPhongMaterial({ color: 0xffc84f })));
      root.add(rail, trolley); binding.primary.push(rail); binding.secondary.push(trolley);
    });
  } else if (spec.kind === "elastic") {
    spec.surfaces.forEach(surface => {
      const object = createSpecialSlab(surface, 0x69c982, 80, 0x164e2d);
      root.add(object); binding.primary.push(object);
    });
  } else if (spec.kind === "risingWater") {
    const basin = spec.course.basin;
    const water = new THREE.Mesh(
      new RoundedBoxGeometry(basin.w, basin.h, 58, 2, 7),
      new THREE.MeshPhongMaterial({ color: 0x2eaed1, transparent: true, opacity: .58, shininess: 100, depthWrite: false }),
    );
    water.position.set(basin.x + basin.w / 2, toWorldY(basin.y + basin.h / 2), 49);
    root.add(water); binding.water = water;
    spec.course.airPockets.forEach(pocket => {
      const frame = createZoneFrame(pocket, 0xf1fbff, "horizontal"); root.add(frame); binding.secondary.push(frame);
    });
  } else if (spec.kind === "magnet") {
    spec.nodes.forEach(node => {
      const group = new THREE.Group();
      const ring = new THREE.Mesh(new THREE.TorusGeometry(30, 7, 8, 28), new THREE.MeshPhongMaterial({ color: node.polarity > 0 ? 0xe85d68 : 0x55b8d5, emissive: node.polarity > 0 ? 0x64121d : 0x124d62, emissiveIntensity: .35 }));
      const core = new THREE.Mesh(new THREE.SphereGeometry(15, 12, 8), new THREE.MeshToonMaterial({ color: 0xffe4a3 }));
      group.add(ring, core); group.position.set(node.x, toWorldY(node.y), 70); root.add(group); binding.primary.push(group);
    });
    spec.pads.forEach(pad => { const object = createMechanicPad(pad, pad.polarity > 0 ? 0xe85d68 : 0x55b8d5); root.add(object); binding.secondary.push(object); });
  } else if (spec.kind === "gravityFlip") {
    spec.pads.forEach(pad => {
      const frame = createZoneFrame(pad, pad.gravity > 0 ? 0xf2bd5b : 0xa98ce8, "vertical"); root.add(frame); binding.primary.push(frame);
    });
  } else if (spec.kind === "gears") {
    spec.gears.forEach(gear => {
      const group = new THREE.Group();
      const cog = new THREE.Mesh(new THREE.CylinderGeometry(gear.radius, gear.radius, 24, gear.teeth), new THREE.MeshLambertMaterial({ color: 0xc48a54, flatShading: true }));
      cog.rotation.x = Math.PI / 2;
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(18, 18, 32, 12), new THREE.MeshPhongMaterial({ color: 0x6e4f45 }));
      hub.rotation.x = Math.PI / 2;
      group.add(cog, hub); group.position.set(gear.x, toWorldY(gear.y), 46); root.add(group); binding.primary.push(group);
      const carrier = createSpecialSlab({ x: 0, y: 0, w: gear.toothWidth, h: gear.toothHeight }, 0xffd06a, 78);
      root.add(carrier); binding.secondary.push(carrier);
    });
  } else if (spec.kind === "pistons") {
    spec.pistons.forEach(piston => {
      const object = createSpecialSlab(piston, piston.lethal ? 0xd96659 : 0xc49458, 88, piston.lethal ? 0x5c1010 : 0x553500);
      root.add(object); binding.primary.push(object);
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(8, 10, 7), new THREE.MeshBasicMaterial({ color: 0xffd458 }));
      lamp.position.set(piston.x + piston.w / 2, toWorldY(piston.y - 18), 88); root.add(lamp); binding.secondary.push(lamp);
    });
  } else if (spec.kind === "momentumPortal") {
    spec.pairs.forEach(pair => {
      [pair.a, pair.b].forEach(point => {
        const arrow = new THREE.Mesh(new THREE.ConeGeometry(10, 28, 3), new THREE.MeshBasicMaterial({ color: 0xffe48b }));
        arrow.rotation.z = -Math.PI / 2;
        arrow.position.set(point.x + 48, toWorldY(point.y), 82);
        arrow.userData.baseY = arrow.position.y;
        root.add(arrow); binding.primary.push(arrow);
      });
    });
  } else if (spec.kind === "phaseSwitch") {
    spec.platforms.forEach(platform => {
      const object = createPlatform(platform, palette, "phase"); root.add(object); binding.primary.push(object);
    });
    spec.pads.forEach(pad => { const object = createMechanicPad(pad, pad.phase === "a" ? 0xe39d66 : 0x8e79c9, "diamond"); root.add(object); binding.secondary.push(object); });
  } else if (spec.kind === "echo") {
    root.add(createZoneFrame(spec.trigger, 0x8ecbdc, "horizontal"));
    spec.plates.forEach(plate => { const object = createMechanicPad(plate, 0x8ecbdc); root.add(object); binding.primary.push(object); });
    spec.gates.forEach(gate => { const object = createSpecialSlab(gate, 0x665474, 86); root.add(object); binding.tertiary.push(object); });
    binding.ghost = createGhostBall(); root.add(binding.ghost);
  } else if (spec.kind === "timeFreeze") {
    spec.triggers.forEach(trigger => { const object = createMechanicPad(trigger, 0x7db8cf); root.add(object); binding.primary.push(object); });
  } else if (spec.kind === "collapse") {
    spec.tiles.forEach(tile => {
      const object = createPlatform(tile, palette, "crumble"); root.add(object); binding.primary.push(object);
    });
  } else if (spec.kind === "boss") {
    const boss = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(68, 20, 14), new THREE.MeshToonMaterial({ color: 0xb44f66 }));
    body.scale.set(1.35, .9, .55);
    const crown = new THREE.Mesh(new THREE.ConeGeometry(45, 58, 5), new THREE.MeshPhongMaterial({ color: 0xffd35b, emissive: 0x704000, emissiveIntensity: .2 }));
    crown.position.y = 76;
    boss.add(body, crown); boss.position.set(spec.center.x, toWorldY(spec.center.y), 18); root.add(boss); binding.primary.push(boss);
    const gate = createSpecialSlab(spec.goalLock, 0x8d5366, 92); root.add(gate); binding.tertiary.push(gate);
    for (let i = 0; i < 6; i += 1) {
      const wave = new THREE.Mesh(new THREE.RingGeometry(22, 29, 32), new THREE.MeshBasicMaterial({ color: 0xffd36b, transparent: true, opacity: .55, side: THREE.DoubleSide, depthWrite: false }));
      wave.visible = false; wave.position.set(spec.center.x, toWorldY(615), 78); wave.scale.y = .24; root.add(wave); binding.shockwaves.push(wave);
    }
  }
  return binding;
}

function buildLevelScene(level: Level) {
  const root = new THREE.Group();
  const palette = paletteFromTheme(level.theme);
  const background = createParallaxBackground(root, palette);
  level.platforms.filter(platform => !specialOwnsPlatform(level, platform)).forEach(platform => root.add(createPlatform(platform, palette)));

  const movers = level.movers.map(mover => {
    const object = createPlatform(mover, palette, "moving");
    root.add(object);
    return { object, box: mover, phase: mover.phase || 0, speed: mover.speed, range: mover.range, axis: mover.axis };
  });
  const crumbles = level.crumbles.map(crumble => {
    const object = createPlatform(crumble, palette, "crumble");
    root.add(object);
    return object;
  });
  const phases = level.phasePlatforms.map(platform => {
    const object = createPlatform(platform, palette, "phase");
    root.add(object);
    return object;
  });

  level.boosters.forEach(strip => root.add(createDirectionalStrip(strip, 1, 0xffb62f, 0xfff08a, 0xb43e00)));
  level.ice.forEach(strip => {
    const mesh = createSurfaceStrip(strip, 0xaeeeff, 0x4a9fb5);
    (mesh.material as THREE.MeshPhongMaterial).transparent = true;
    (mesh.material as THREE.MeshPhongMaterial).opacity = .88;
    root.add(mesh);
  });
  level.conveyors.forEach(strip => root.add(createDirectionalStrip(strip, strip.speed, 0x414955, 0xffcf42, 0x5d4300)));

  level.springs.forEach(spring => {
    const group = new THREE.Group();
    group.position.set(spring.x + spring.w / 2, toWorldY(spring.y), 47);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(5, 7, 37, 8), new THREE.MeshLambertMaterial({ color: 0x3b9b51 }));
    stem.position.y = 19;
    const flower = new THREE.Mesh(new THREE.SphereGeometry(15, 12, 8), new THREE.MeshToonMaterial({ color: 0xffd340 }));
    flower.scale.set(1.4, .62, .9);
    flower.position.y = 43;
    group.add(stem, flower);
    root.add(group);
  });

  level.windZones.forEach(zone => root.add(createZoneFrame(zone, 0x85e6f4, "horizontal")));
  level.gravityZones.forEach(zone => root.add(createZoneFrame(zone, 0xb596ef, "vertical")));
  level.waterZones.forEach(zone => {
    const water = new THREE.Mesh(
      new RoundedBoxGeometry(zone.w, zone.h, 54, 2, 6),
      new THREE.MeshPhongMaterial({ color: 0x41bce9, transparent: true, opacity: .52, shininess: 95, depthWrite: false }),
    );
    water.position.set(zone.x + zone.w / 2, toWorldY(zone.y + zone.h / 2), 34);
    root.add(water);
  });

  const portals = level.portals.flatMap(portal => {
    const a = createPortal(portal.a.x, portal.a.y, portal.color);
    const b = createPortal(portal.b.x, portal.b.y, portal.color);
    root.add(a, b);
    return [a, b];
  });
  const lava = level.lava.map(pool => {
    const object = new THREE.Mesh(
      new RoundedBoxGeometry(pool.w, pool.h, 64, 2, 5),
      new THREE.MeshPhongMaterial({ color: 0xff5b24, emissive: 0xa61c0d, emissiveIntensity: .72, shininess: 75 }),
    );
    const baseY = toWorldY(pool.y + pool.h / 2);
    object.position.set(pool.x + pool.w / 2, baseY, 24);
    root.add(object);
    return { object, baseY, wave: pool.wave, speed: pool.speed, phase: pool.phase || 0 };
  });

  level.spikes.forEach(spike => {
    const count = Math.max(2, Math.round(spike.w / 28));
    const width = spike.w / count;
    for (let i = 0; i < count; i += 1) {
      const mesh = new THREE.Mesh(new THREE.ConeGeometry(width * .48, spike.h, 4), new THREE.MeshLambertMaterial({ color: 0x4e5663, flatShading: true }));
      mesh.position.set(spike.x + width * (i + .5), toWorldY(spike.y + spike.h / 2), 45);
      mesh.rotation.y = Math.PI / 4;
      root.add(mesh);
    }
  });

  const spinners = level.spinners.map(spinner => {
    const object = new THREE.Group();
    object.position.set(spinner.x, toWorldY(spinner.y), 58);
    const bar = new THREE.Mesh(new RoundedBoxGeometry(spinner.length * 2, 16, 19, 2, 5), new THREE.MeshLambertMaterial({ color: 0x343c49 }));
    const stripe = new THREE.Mesh(new RoundedBoxGeometry(spinner.length * 1.75, 5, 23, 2, 2), new THREE.MeshBasicMaterial({ color: 0xffc52f }));
    const hub = new THREE.Mesh(new THREE.SphereGeometry(15, 14, 10), new THREE.MeshPhongMaterial({ color: 0xe53b45 }));
    object.add(bar, stripe, hub);
    root.add(object);
    return { object, speed: spinner.speed, phase: spinner.phase || 0 };
  });

  const lasers = level.laserGates.map(gate => {
    const beam = new THREE.Mesh(
      new RoundedBoxGeometry(9, gate.h, 16, 2, 4),
      new THREE.MeshBasicMaterial({ color: 0xff4456, transparent: true, opacity: 1, toneMapped: false }),
    );
    beam.position.set(gate.x, toWorldY(gate.y + gate.h / 2), 62);
    const emitterMaterial = new THREE.MeshPhongMaterial({ color: 0x3b414c, emissive: 0x811522, emissiveIntensity: .25 });
    [gate.y, gate.y + gate.h].forEach(y => {
      const emitter = new THREE.Mesh(new RoundedBoxGeometry(29, 18, 23, 2, 5), emitterMaterial);
      emitter.position.set(gate.x, toWorldY(y), 55);
      root.add(emitter);
    });
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(42, gate.h + 26),
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          glowColor: { value: new THREE.Color(0xff3045) },
          glowAlpha: { value: 0 },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 glowColor;
          uniform float glowAlpha;
          varying vec2 vUv;
          void main() {
            float horizontal = 1.0 - smoothstep(0.0, 0.5, abs(vUv.x - 0.5));
            float vertical = smoothstep(0.0, 0.08, vUv.y) * (1.0 - smoothstep(0.92, 1.0, vUv.y));
            gl_FragColor = vec4(glowColor, horizontal * vertical * glowAlpha);
          }
        `,
      }),
    );
    glow.position.copy(beam.position);
    root.add(beam, glow);
    return { beam, glow, activeTime: gate.activeTime, inactiveTime: gate.inactiveTime, phase: gate.phase };
  });

  const stars = level.stars.map(star => {
    const group = new THREE.Group();
    const mesh = new THREE.Mesh(createStarGeometry(), new THREE.MeshPhongMaterial({ color: 0xffd32d, emissive: 0x9c6100, emissiveIntensity: .45, shininess: 100 }));
    mesh.position.z = -4;
    group.position.set(star.x, toWorldY(star.y), 66);
    group.add(mesh);
    root.add(group);
    return group;
  });
  const checkpoints = level.checkpoints.map(checkpoint => {
    const binding = createCheckpoint(checkpoint.x, checkpoint.y);
    root.add(binding.group);
    return { flag: binding.flag, halo: binding.halo };
  });
  const enemies = level.enemies.map(enemy => {
    const group = new THREE.Group();
    group.add(new THREE.Mesh(new RoundedBoxGeometry(44, 44, 42, 2, 7), new THREE.MeshLambertMaterial({ color: 0x29313c })));
    [-10, 10].forEach(x => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(5.5, 10, 7), new THREE.MeshPhongMaterial({ color: 0xffffff }));
      eye.scale.z = .45;
      eye.position.set(x, 7, 22);
      group.add(eye);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(2.2, 8, 6), new THREE.MeshBasicMaterial({ color: 0x10151c }));
      pupil.position.set(x + 1, 7, 25);
      group.add(pupil);
    });
    group.position.set(enemy.x, toWorldY(enemy.y), 54);
    root.add(group);
    return group;
  });

  let key: THREE.Group | undefined;
  if (level.key) {
    key = new THREE.Group();
    key.position.set(level.key.x, toWorldY(level.key.y), 68);
    const material = new THREE.MeshPhongMaterial({ color: 0xffcc27, emissive: 0x8c5800, emissiveIntensity: .35, shininess: 100 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(12, 4, 7, 20), material);
    const shaft = new THREE.Mesh(new RoundedBoxGeometry(5, 28, 8, 2, 2), material);
    shaft.position.y = -19;
    key.add(ring, shaft);
    root.add(key);
  }

  const special = buildSpecialVisual(level, palette);
  root.add(special.root);

  const goal = createGoal(level, palette);
  root.add(goal);
  const playerShadow = createPlayerShadow();
  playerShadow.position.z = 44;
  root.add(playerShadow);
  const player = createPlayer();
  root.add(player);

  return {
    levelNumber: level.number,
    root,
    background,
    player,
    playerShadow,
    movers,
    crumbles,
    phases,
    stars,
    portals,
    lava,
    spinners,
    lasers,
    enemies,
    checkpoints,
    key,
    goal,
    special,
    previousGrounded: false,
    landingPulse: 0,
  } satisfies SceneBinding;
}

// Animation / update loop ---------------------------------------------------

function updateSpecialVisual(binding: SceneBinding, level: Level, state: SpecialRenderState, reducedMotion: boolean) {
  const spec = level.special;
  const visual = binding.special;
  if (!spec) return;
  const runtime = state.special;
  const time = state.time;

  if (spec.kind === "seesaw") {
    visual.primary.forEach((object, index) => { object.rotation.z = -(runtime.angles[index] || 0); });
  } else if (spec.kind === "oneWay") {
    visual.primary.forEach((object, index) => {
      const surface = spec.surfaces[index];
      const close = state.x > surface.x - 40 && state.x < surface.x + surface.w + 40 && state.y > surface.y;
      object.scale.y += ((close ? .86 : 1) - object.scale.y) * .16;
      object.position.y = (object.userData.baseY || 0) + (reducedMotion ? 0 : Math.sin(time * 2.2 + index) * 2);
    });
  } else if (spec.kind === "wallJump") {
    const active = runtime.wallCoyote > 0;
    visual.primary.forEach(object => { object.scale.setScalar(active ? 1.08 : 1); });
  } else if (spec.kind === "pushBlock" || spec.kind === "pressureGate") {
    visual.primary.forEach((object, index) => {
      const block = runtime.blocks[index];
      const config = spec.blocks[index];
      if (!block) return;
      object.position.set(block.x + config.w / 2, toWorldY(block.y + config.h / 2), 62);
      object.rotation.z = -block.angle;
    });
    if (spec.kind === "pressureGate") {
      visual.secondary.forEach((object, index) => {
        const plate = spec.plates[index];
        object.scale.y += ((runtime.flags[`gate:${plate.gateId}`] ? .55 : 1) - object.scale.y) * .22;
      });
      visual.tertiary.forEach((object, index) => {
        const gate = spec.gates[index];
        const open = Boolean(runtime.flags[`gate:${gate.id}`]);
        object.position.x = gate.x + gate.w / 2 + (open ? gate.openOffset.x : 0);
        object.position.y += (toWorldY(gate.y + gate.h / 2 + (open ? gate.openOffset.y : 0)) - object.position.y) * .15;
      });
    }
  } else if (spec.kind === "breakableWall") {
    visual.primary.forEach((object, index) => {
      const broken = Boolean(runtime.flags[`wall:${index}`]);
      object.visible = !broken;
      object.scale.setScalar(broken ? .2 : 1);
    });
  } else if (spec.kind === "swing") {
    visual.primary.forEach((rod, index) => {
      const anchor = spec.anchors[index];
      const attached = runtime.attachedSwing === index;
      const endX = attached ? state.x : anchor.x;
      const endY = attached ? state.y : anchor.y + anchor.length;
      setRodBetween(rod, new THREE.Vector3(anchor.x, toWorldY(anchor.y), 64), new THREE.Vector3(endX, toWorldY(endY), 64), 5);
    });
  } else if (spec.kind === "zipline") {
    visual.secondary.forEach((trolley, index) => {
      const cable = spec.cables[index];
      const progress = runtime.attachedZipline === index ? runtime.ziplineProgress : (reducedMotion ? .08 : (time * .05) % 1);
      trolley.position.set(cable.a.x + (cable.b.x - cable.a.x) * progress, toWorldY(cable.a.y + (cable.b.y - cable.a.y) * progress), 74);
      trolley.rotation.z = -Math.atan2(cable.b.y - cable.a.y, cable.b.x - cable.a.x);
    });
  } else if (spec.kind === "elastic") {
    visual.primary.forEach((object, index) => {
      const surface = spec.surfaces[index];
      const touching = state.x + BALL_R > surface.x && state.x - BALL_R < surface.x + surface.w && Math.abs(state.y + BALL_R - surface.y) < 30;
      object.scale.y += ((touching ? .52 : 1) - object.scale.y) * .24;
    });
  } else if (spec.kind === "risingWater" && visual.water) {
    const basin = spec.course.basin;
    const surfaceY = runtime.waterY ?? spec.course.surfaceStartY;
    const bottom = basin.y + basin.h;
    const visibleHeight = Math.max(4, bottom - surfaceY);
    visual.water.scale.y = visibleHeight / basin.h;
    visual.water.position.y = toWorldY(surfaceY + visibleHeight / 2);
    visual.water.rotation.z = reducedMotion ? 0 : Math.sin(time * 1.8) * .002;
  } else if (spec.kind === "magnet") {
    visual.primary.forEach((object, index) => {
      object.rotation.z = reducedMotion ? 0 : time * (spec.nodes[index].polarity > 0 ? .55 : -.55);
      object.scale.setScalar(spec.nodes[index].polarity === runtime.polarity ? 1.1 : .94);
    });
  } else if (spec.kind === "gravityFlip") {
    visual.primary.forEach((object, index) => {
      const selected = spec.pads[index].gravity === runtime.gravity;
      object.scale.setScalar(selected ? 1.05 + (reducedMotion ? 0 : Math.sin(time * 4) * .025) : .94);
    });
  } else if (spec.kind === "gears") {
    visual.primary.forEach((object, index) => { object.rotation.z = -(runtime.angles[index] || 0); });
    visual.secondary.forEach((object, index) => {
      const gear = spec.gears[index];
      const angle = runtime.angles[index] || gear.phase;
      object.position.set(gear.x + Math.cos(angle) * gear.radius, toWorldY(gear.y + Math.sin(angle) * gear.radius), 62);
    });
  } else if (spec.kind === "pistons") {
    visual.primary.forEach((object, index) => {
      const piston = spec.pistons[index];
      const amount = Number(runtime.flags[`piston:${index}`] || 0);
      object.position.set(
        piston.x + piston.w / 2 + (piston.axis === "x" ? piston.travel * amount : 0),
        toWorldY(piston.y + piston.h / 2 - (piston.axis === "y" ? piston.travel * amount : 0)),
        54,
      );
      const material = (object as THREE.Mesh).material as THREE.MeshPhongMaterial;
      material.emissiveIntensity = amount > .72 ? .48 : .16;
    });
    visual.secondary.forEach((lamp, index) => {
      const amount = Number(runtime.flags[`piston:${index}`] || 0);
      lamp.scale.setScalar(1 + (reducedMotion ? 0 : Math.sin(time * 10 + index) * .18) * (1 - amount));
    });
  } else if (spec.kind === "momentumPortal") {
    visual.primary.forEach((object, index) => {
      object.position.y = Number(object.userData.baseY || 0) + (reducedMotion ? 0 : Math.sin(time * 4 + index) * 2.2);
      object.scale.setScalar(1 + Math.min(.22, Math.hypot(state.vx, state.vy) / 2600));
    });
  } else if (spec.kind === "phaseSwitch") {
    visual.primary.forEach((object, index) => {
      const visible = spec.platforms[index].phase === runtime.phase;
      object.visible = visible;
      object.scale.z = visible ? 1 : .1;
    });
    visual.secondary.forEach((object, index) => { object.scale.setScalar(spec.pads[index].phase === runtime.phase ? 1.08 : .92); });
  } else if (spec.kind === "echo") {
    visual.tertiary.forEach((object, index) => {
      const gate = spec.gates[index];
      const open = Boolean(runtime.flags[`echoGate:${gate.id}`]);
      object.position.y += ((open ? toWorldY(gate.y - gate.h / 2 - 35) : toWorldY(gate.y + gate.h / 2)) - object.position.y) * .14;
    });
    if (visual.ghost) {
      const pose = runtime.echoPose;
      visual.ghost.visible = Boolean(pose);
      if (pose) {
        visual.ghost.position.set(pose.x, toWorldY(pose.y), 69);
        visual.ghost.rotation.z = -pose.angle;
      }
    }
  } else if (spec.kind === "timeFreeze") {
    const frozen = runtime.frozenTimer > 0;
    visual.primary.forEach((object, index) => { object.scale.setScalar(frozen ? 1.12 : 1 + (reducedMotion ? 0 : Math.sin(time * 3 + index) * .03)); });
  } else if (spec.kind === "collapse") {
    visual.primary.forEach((object, index) => {
      const elapsed = runtime.collapseTimers[index] ?? -1;
      object.visible = elapsed < 0;
      object.position.y = elapsed < 0 ? 0 : -Math.min(120, elapsed * 220);
      object.rotation.z = elapsed < 0 ? 0 : (index % 2 ? 1 : -1) * Math.min(1.1, elapsed * 3);
    });
  } else if (spec.kind === "boss" && runtime.boss) {
    const boss = visual.primary[0];
    boss.scale.setScalar(1 + runtime.boss.phase * .06 + (reducedMotion ? 0 : Math.sin(time * 2.6) * .025));
    boss.position.y = toWorldY(spec.center.y) + (reducedMotion ? 0 : Math.sin(time * 1.7) * 9);
    visual.tertiary[0].visible = !runtime.boss.defeated;
    visual.shockwaves.forEach((wave, index) => {
      const radius = runtime.boss?.shockwaves[index];
      wave.visible = typeof radius === "number";
      if (typeof radius === "number") wave.scale.set(Math.max(.1, radius / 25), Math.max(.04, radius / 25 * .24), 1);
    });
  }
}

function updateScene(binding: SceneBinding, level: Level, state: SpecialRenderState, reducedMotion: boolean) {
  const time = state.time;
  const motionTimes = state.special.motionTimes;
  binding.background.fixed.position.x = state.camera;
  binding.background.far.position.x = state.camera * .92;
  binding.background.mid.position.x = state.camera * .82;
  binding.background.clouds.position.x = state.camera * .72 + (reducedMotion ? 0 : Math.sin(time * .12) * 14);
  binding.movers.forEach(item => {
    const offset = Math.sin(motionTimes.movers * (item.speed || 0) + (item.phase || 0)) * (item.range || 0);
    item.object.position.x = item.axis === "x" ? offset : 0;
    item.object.position.y = item.axis === "y" ? -offset : 0;
  });
  binding.crumbles.forEach((object, index) => {
    const timer = state.crumbleTimers[index] ?? -1;
    object.visible = timer < 0 || timer < level.crumbles[index].delay;
    object.rotation.z = !reducedMotion && timer > 0 && object.visible ? Math.sin(time * 42) * .012 : 0;
  });
  binding.phases.forEach((object, index) => {
    object.visible = isPhasePlatformActive(level.phasePlatforms[index], time);
  });
  binding.stars.forEach((star, index) => {
    star.visible = !state.stars[index];
    star.rotation.y = reducedMotion ? .2 : time * 1.8 + index * .7;
    star.position.y = toWorldY(level.stars[index].y) + (reducedMotion ? 0 : Math.sin(time * 3 + index) * 5);
  });
  binding.portals.forEach((portal, index) => {
    portal.rotation.y = reducedMotion ? 0 : Math.sin(time * 1.1 + index) * .12;
    portal.rotation.z = reducedMotion ? 0 : time * (index % 2 ? -.12 : .12);
  });
  binding.lava.forEach(item => { item.object.position.y = item.baseY - Math.sin(time * item.speed + item.phase) * item.wave; });
  binding.spinners.forEach(item => { item.object.rotation.z = -(motionTimes.spinners * item.speed + item.phase); });
  binding.lasers.forEach((item, index) => {
    const active = isLaserGateActive({ x: 0, y: 0, h: 1, activeTime: item.activeTime, inactiveTime: item.inactiveTime, phase: item.phase }, motionTimes.laserGates);
    const material = item.beam.material as THREE.MeshBasicMaterial;
    material.opacity = active ? 1 : .2;
    material.color.set(active ? 0xff4456 : 0x8b3945);
    (item.glow.material as THREE.ShaderMaterial).uniforms.glowAlpha.value = active && !reducedMotion ? .42 : 0;
    item.beam.scale.x = active ? 1 + Math.sin(time * 18 + index) * .18 : .7;
  });
  binding.enemies.forEach((enemy, index) => {
    const source = state.enemies[index];
    enemy.visible = Boolean(source && !source.dead);
    if (!source) return;
    enemy.position.set(source.x, toWorldY(source.y), 54);
    enemy.rotation.z = reducedMotion ? 0 : -time * 1.7;
  });
  binding.checkpoints.forEach((checkpoint, index) => {
    const active = index <= state.checkpointIndex;
    const flagMaterial = checkpoint.flag.material as THREE.MeshPhongMaterial;
    flagMaterial.color.set(active ? 0xffd342 : 0xd9dde0);
    flagMaterial.emissive.set(active ? 0x7b4a00 : 0x000000);
    flagMaterial.emissiveIntensity = active ? .25 : 0;
    (checkpoint.halo.material as THREE.MeshBasicMaterial).opacity = active ? .4 : 0;
    checkpoint.halo.rotation.z = reducedMotion ? 0 : time * .3;
  });
  if (binding.key) {
    binding.key.visible = !state.hasKey;
    binding.key.rotation.y = reducedMotion ? 0 : time * 1.3;
    if (level.key) binding.key.position.y = toWorldY(level.key.y) + (reducedMotion ? 0 : Math.sin(time * 3) * 5);
  }
  binding.goal.scale.setScalar(1 + (reducedMotion ? 0 : Math.sin(time * 2.5) * .018));
  updateSpecialVisual(binding, level, state, reducedMotion);

  if (state.grounded && !binding.previousGrounded) binding.landingPulse = 1;
  binding.previousGrounded = state.grounded;
  binding.landingPulse *= .78;
  const airStretch = state.grounded ? 0 : clamp(Math.abs(state.vy) / 1100, 0, .14);
  const squash = binding.landingPulse * .16;
  binding.player.scale.set(1 + squash - airStretch * .42, 1 - squash + airStretch, 1 + squash * .25);
  binding.player.position.set(state.x, toWorldY(state.y), 74);
  binding.player.rotation.z = state.special.gravity < 0 ? Math.PI + state.angle : -state.angle;
  binding.player.visible = !(state.invulnerable > 0 && Math.floor(time * 12) % 2);

  let shadowSurfaceY = Number.POSITIVE_INFINITY;
  const considerShadowSurface = (surface: Box) => {
    if (
      state.x >= surface.x - BALL_R
      && state.x <= surface.x + surface.w + BALL_R
      && surface.y >= state.y + BALL_R - 10
      && surface.y < shadowSurfaceY
    ) shadowSurfaceY = surface.y;
  };
  level.platforms.filter(surface => !specialOwnsPlatform(level, surface)).forEach(considerShadowSurface);
  level.crumbles.forEach((surface, index) => {
    const timer = state.crumbleTimers[index] ?? -1;
    if (timer < 0 || timer < surface.delay) considerShadowSurface(surface);
  });
  level.phasePlatforms.forEach(surface => {
    if (isPhasePlatformActive(surface, time)) considerShadowSurface(surface);
  });
  level.movers.forEach(surface => {
    const offset = Math.sin(motionTimes.movers * surface.speed + (surface.phase || 0)) * surface.range;
    considerShadowSurface({
      x: surface.x + (surface.axis === "x" ? offset : 0),
      y: surface.y + (surface.axis === "y" ? offset : 0),
      w: surface.w,
      h: surface.h,
    });
  });
  const spec = level.special;
  if (spec?.kind === "seesaw") spec.boards.forEach(considerShadowSurface);
  if (spec?.kind === "oneWay") spec.surfaces.forEach(considerShadowSurface);
  if (spec?.kind === "phaseSwitch") spec.platforms.filter(surface => surface.phase === state.special.phase).forEach(considerShadowSurface);
  if (spec?.kind === "collapse") spec.tiles.forEach((surface, index) => {
    if ((state.special.collapseTimers[index] ?? -1) < 0) considerShadowSurface(surface);
  });
  if (spec?.kind === "gears") spec.gears.forEach((gear, index) => {
    const angle = state.special.angles[index] || gear.phase;
    considerShadowSurface({
      x: gear.x + Math.cos(angle) * gear.radius - gear.toothWidth / 2,
      y: gear.y + Math.sin(angle) * gear.radius - gear.toothHeight / 2,
      w: gear.toothWidth,
      h: gear.toothHeight,
    });
  });
  if (!Number.isFinite(shadowSurfaceY)) shadowSurfaceY = state.y + BALL_R + 24;
  const shadowDistance = Math.max(0, shadowSurfaceY - (state.y + BALL_R));
  const airborne = clamp(shadowDistance / 240, 0, 1);
  binding.playerShadow.position.set(state.x + 8, toWorldY(shadowSurfaceY) + 2, 44);
  binding.playerShadow.scale.set(1.3 - airborne * .45, .38 - airborne * .14, 1);
  (binding.playerShadow.material as THREE.ShaderMaterial).uniforms.shadowAlpha.value = .16 - airborne * .1;
}

export default function SpecialWorld3D({ level, getState, active = true, onReadyChange }: SpecialWorld3DProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<Runtime | null>(null);
  const loopControlRef = useRef<{ start: () => void; stop: () => void } | null>(null);
  const levelRef = useRef(level);
  const getStateRef = useRef(getState);
  const activeRef = useRef(active);
  const onReadyChangeRef = useRef(onReadyChange);
  levelRef.current = level;
  getStateRef.current = getState;
  activeRef.current = active;
  onReadyChangeRef.current = onReadyChange;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let readyState: boolean | undefined;
    const setReady = (ready: boolean) => {
      host.dataset.ready = String(ready);
      if (readyState === ready) return;
      readyState = ready;
      onReadyChangeRef.current?.(ready);
    };
    setReady(false);
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "high-performance" });
    } catch {
      host.dataset.webgl = "unavailable";
      setReady(false);
      return;
    }

    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarsePointer ? 1.25 : 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.dataset.specialWorldCanvas = "true";
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = setupCamera();
    const runtime: Runtime = { renderer, scene, camera, setReady };
    runtimeRef.current = runtime;
    let frameId = 0;
    let visible = !document.hidden;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const resize = () => {
      const rect = host.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      renderer.setSize(Math.round(rect.width), Math.round(rect.height), false);
      const aspect = rect.width / rect.height;
      const targetAspect = VIEW_W / VIEW_H;
      if (aspect > targetAspect) {
        const width = VIEW_H * aspect;
        camera.left = -width / 2;
        camera.right = width / 2;
        camera.top = VIEW_H / 2;
        camera.bottom = -VIEW_H / 2;
      } else {
        const height = VIEW_W / aspect;
        camera.left = -VIEW_W / 2;
        camera.right = VIEW_W / 2;
        camera.top = height / 2;
        camera.bottom = -height / 2;
      }
      camera.updateProjectionMatrix();
    };

    const stopRender = () => {
      if (!frameId) return;
      cancelAnimationFrame(frameId);
      frameId = 0;
    };
    const startRender = () => {
      if (!frameId && visible && activeRef.current) frameId = requestAnimationFrame(render);
    };
    const render = () => {
      frameId = 0;
      if (!visible || !activeRef.current) return;
      const currentLevel = levelRef.current;
      const state = getStateRef.current();
      const binding = runtime.binding;
      if (binding && binding.levelNumber === currentLevel.number && state) {
        updateScene(binding, currentLevel, state, reducedMotion.matches);
        const centerX = state.camera + VIEW_W / 2;
        camera.position.set(centerX + 30, VIEW_H / 2 + 22, 1200);
        camera.lookAt(centerX, VIEW_H / 2, 0);
        renderer.render(scene, camera);
        setReady(true);
      }
      startRender();
    };
    loopControlRef.current = { start: startRender, stop: stopRender };

    const onVisibility = () => {
      visible = !document.hidden;
      if (visible) startRender();
      else stopRender();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    document.addEventListener("visibilitychange", onVisibility);
    resize();
    startRender();

    return () => {
      stopRender();
      loopControlRef.current = null;
      setReady(false);
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      if (runtime.binding) disposeObject(runtime.binding.root);
      scene.clear();
      renderer.renderLists.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      runtimeRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (active) loopControlRef.current?.start();
    else loopControlRef.current?.stop();
  }, [active]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    runtime.setReady(false);
    if (runtime.binding) {
      runtime.scene.remove(runtime.binding.root);
      disposeObject(runtime.binding.root);
    }
    const palette = paletteFromTheme(level.theme);
    runtime.scene.clear();
    setupLighting(runtime.scene, palette);
    runtime.binding = buildLevelScene(level);
    runtime.scene.add(runtime.binding.root);
  }, [level]);

  return <div ref={hostRef} className="special-world-3d" data-world={level.chapter} aria-hidden="true" />;
}
