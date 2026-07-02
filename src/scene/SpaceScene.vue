<!-- SpaceScene — the "Space" 3D preview stage (visual only: no combat, no server,
     no match). A self-contained sibling of PveScene.vue (which it copies the RECIPE
     from and never reuses by a flag / never edits): the SAME family arena material
     and lamp room-fill, the SAME rift-suppression on the central slab, the SAME
     flat-dark backdrop dome and OrbitControls rig + first-frame ready signal — but
     here the floor is a big HEX FIELD (a vast arena, much larger than the plate),
     a ROSTER of 14 club fighters roams the whole field on their own footwork
     (spaceWander), and ONE of them is marked as the LEADER by the scene's single
     glow — a pink beacon (--hex-primary).

     Discipline: calm dark room; each body glows ITS core colour as intrinsic
     light/rim (buildFighter); the LEADER's pink beacon is the ONE glow / the ONE
     pink on the screen; no HP plates; no FIGHT. All tuning knobs are in the CONFIG
     blocks at the top. Respects prefers-reduced-motion + tab pause. buildArena /
     buildFighter / presence helpers are only INSTANCED / CALLED, never edited. -->
<template>
  <div ref="wrap" class="space-scene-wrap">
    <canvas ref="canvasEl" class="space-scene-canvas" />
    <div class="space-scene-vignette" />
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildArena } from './buildArena.js';
import { makeRadialTexture, makeHexGridTexture } from './arenaTextures.js';
import { buildFighter } from './buildFighter.js';
import { resolveBehavior } from '@/data/behavior.js';
import { createSpaceWanderDirector } from './spaceWander.js';

// ───────────────────────────── CONFIG (tune on preview) ─────────────────────────────
// The big hex field — a large flat arena that reads as "огромная арена", not a bigger
// plate. Base tone + hex lattice are the arena family; it fades into fog / the dome.
const FIELD = {
  size: 46,          // side length of the hex field plane (units) — far bigger than the slab
  repeat: 18,        // hex-texture tiling across the field (lattice density)
  baseColor: 0x0d1120,  // dark blue-grey floor (arena family)
  lineOpacity: 0.5,  // hex lattice line strength
};
// Roster placement across the field (spread wide, off the central seam, apart).
const CONFIG = {
  rosterCount: 14,      // SPACE_ROSTER_COUNT — fighters on the field (range 12–16)
  roamHalf: 15,         // fighters roam within ±this of centre (walkable field half-extent)
  spawnRadiusMax: 13,   // spawn annulus outer radius
  spawnRadiusMin: 3.4,  // spawn annulus inner radius → nobody starts on the central seam
  minSeparation: 2.6,   // min XZ distance between any two members on placement
  zoneHalf: 6.6,        // personal wander-rect half-extent — BIG + overlapping → range wide
};
// The LEADER beacon — the scene's single glow, pink (--hex-primary). Marks member 0.
const LEADER = {
  index: 0,             // deterministic — no leader swap in a preview
  discRadius: 2.0,      // pink pool under the leader's feet
  discOpacity: 0.5,
  columnRadius: 0.7,    // soft light column rising from the leader
  columnHeight: 4.4,
  columnOpacity: 0.11,
  followLerp: 0.09,     // marker eases toward the roving leader
  pulse: 0.16,          // gentle opacity breathing (reduced-motion → off)
  pulseSpeed: 1.3,
};
// Camera — free orbit like PVE/Home, but pulled back + a touch higher so the whole
// field reads. (CAM_BASE distance + zoom corridor here.)
const CAM = {
  base: new THREE.Vector3(12.5, 15.5, 21.5), // ≈ dist 29
  fov: 44,
  minDistance: 10,
  maxDistance: 44,
  minPolarAngle: 0.24,
  maxPolarAngle: 1.36,   // never dip under the field
  targetLift: 1.0,       // orbit pivot above the field centre
  autoRotateSpeed: 0.42,
};
// Locked core palette (task snapshot): ONSLAUGHT / RAIDER / BULWARK / AMBUSH. These
// live on the BODIES as core light/rim (buildFighter) — never a second accent glow.
const CORE_PALETTE = [
  { id: 'natisk', hue: '#FF3344' }, // ONSLAUGHT
  { id: 'nalet', hue: '#FFA526' },  // RAIDER
  { id: 'skala', hue: '#2ED6B0' },  // BULWARK
  { id: 'zasada', hue: '#9461FF' }, // AMBUSH
];

// ─────────────────────────── Lamp room-fill (PVE recipe, own copy) ───────────────────────────
// Warm dim room lighting (not an accent glow) — kept modest so the field stays calm
// dark and the leader beacon reads. Fixtures hang above the fighters / out of frame.
const LAMPS = {
  ceilingY: 8.4, wire: 1.6, hangLift: 1.2, shadeRadius: 0.6, shadeHeight: 0.5,
  shadeColor: 0x161a24, rodColor: 0x0c0f16, rodRadius: 0.02,
  bulbRadius: 0.13, bulbColor: 0xffb368, bulbOpacity: 0.9,
  light: { color: 0xffb368, intensity: 20, distance: 26, decay: 2 },
  positions: [
    { x: -6.5, z: -5.0, drop: 0.0 },
    { x: 6.8, z: 4.6, drop: 0.6 },
    { x: 5.4, z: -6.2, drop: 0.3 },
    { x: -5.8, z: 6.0, drop: 0.9 },
    { x: 0.2, z: 0.4, drop: 0.4 },
  ],
  flicker: 0.05, flickerSpeed: 1.3,
};
function buildLamps(opts, reduced) {
  const group = new THREE.Group();
  const shadeGeo = new THREE.ConeGeometry(opts.shadeRadius, opts.shadeHeight, 16, 1, true);
  const bulbGeo = new THREE.SphereGeometry(opts.bulbRadius, 10, 8);
  const shadeMat = new THREE.MeshStandardMaterial({ color: opts.shadeColor, flatShading: true, roughness: 0.9, metalness: 0.2, side: THREE.DoubleSide });
  const rodMat = new THREE.MeshStandardMaterial({ color: opts.rodColor, roughness: 0.8, metalness: 0.3 });
  const bulbMat = new THREE.MeshBasicMaterial({ color: opts.bulbColor, transparent: true, opacity: opts.bulbOpacity });
  const rodGeos = [];
  const lights = [];
  opts.positions.forEach((pos, i) => {
    const shadeTopY = opts.ceilingY - opts.wire - (pos.drop || 0) + (opts.hangLift || 0);
    const shade = new THREE.Mesh(shadeGeo, shadeMat);
    shade.position.set(pos.x, shadeTopY - opts.shadeHeight / 2, pos.z);
    group.add(shade);
    const rodLen = Math.max(0.05, opts.ceilingY - shadeTopY);
    const rodGeo = new THREE.CylinderGeometry(opts.rodRadius, opts.rodRadius, rodLen, 6);
    rodGeos.push(rodGeo);
    const rod = new THREE.Mesh(rodGeo, rodMat);
    rod.position.set(pos.x, shadeTopY + rodLen / 2, pos.z);
    group.add(rod);
    const bulbY = shadeTopY - opts.shadeHeight * 0.55;
    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulb.position.set(pos.x, bulbY, pos.z);
    group.add(bulb);
    const light = new THREE.PointLight(opts.light.color, opts.light.intensity, opts.light.distance, opts.light.decay);
    light.position.set(pos.x, bulbY - 0.05, pos.z);
    group.add(light);
    lights.push({ light, base: opts.light.intensity, phase: i * 1.7 });
  });
  const tick = reduced ? null : (t) => {
    for (const l of lights) l.light.intensity = l.base * (1 - opts.flicker * 0.5 + opts.flicker * 0.5 * Math.sin(t * opts.flickerSpeed + l.phase));
  };
  const dispose = () => { shadeGeo.dispose(); bulbGeo.dispose(); shadeMat.dispose(); rodMat.dispose(); bulbMat.dispose(); rodGeos.forEach((g) => g.dispose()); };
  return { group, tick, dispose };
}

// ─────────────────────────── The big hex field (own build, arena tone) ───────────────────────────
// A dark base plane + a tiled hex-lattice overlay (makeHexGridTexture, the same
// generator the arena plate uses), sitting flush with the slab top so the slab reads
// as the field's centre. Fog + the dome carry it into the distance.
function buildHexField(topY, maxAniso) {
  const group = new THREE.Group();
  const baseMat = new THREE.MeshStandardMaterial({ color: FIELD.baseColor, roughness: 0.95, metalness: 0.1 });
  const base = new THREE.Mesh(new THREE.PlaneGeometry(FIELD.size, FIELD.size), baseMat);
  base.rotation.x = -Math.PI / 2;
  base.position.y = topY - 0.04;
  group.add(base);

  const hexTex = makeHexGridTexture(maxAniso);
  hexTex.repeat.set(FIELD.repeat, FIELD.repeat);
  const lineMat = new THREE.MeshBasicMaterial({ map: hexTex, transparent: true, opacity: FIELD.lineOpacity, depthWrite: false });
  const lines = new THREE.Mesh(new THREE.PlaneGeometry(FIELD.size, FIELD.size), lineMat);
  lines.rotation.x = -Math.PI / 2;
  lines.position.y = topY - 0.02;
  group.add(lines);

  const dispose = () => { baseMat.dispose(); base.geometry.dispose(); lineMat.dispose(); lines.geometry.dispose(); hexTex.dispose(); };
  return { group, dispose };
}

// ─────────────────────────── Background depth dome (PVE recipe, own copy) ───────────────────────────
// Flat dark gradient (hex weave + grain OFF), sized to surround the whole field.
const BACKDROP = {
  radius: 72, centerY: 6, texW: 1024, texH: 1024,
  grad: [[0.0, '#060710'], [0.42, '#0a0a12'], [0.62, '#120f0c'], [1.0, '#1b150d']],
};
function buildBackdrop(o) {
  const c = document.createElement('canvas'); c.width = o.texW; c.height = o.texH;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, o.texH);
  for (const [stop, col] of o.grad) g.addColorStop(stop, col);
  ctx.fillStyle = g; ctx.fillRect(0, 0, o.texW, o.texH);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const geo = new THREE.SphereGeometry(o.radius, 48, 32);
  const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false, depthWrite: false });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0, o.centerY, 0); mesh.renderOrder = -10;
  const dispose = () => { geo.dispose(); mat.dispose(); tex.dispose(); };
  return { mesh, dispose };
}

// ─────────────────────────── Leader beacon — the scene's SINGLE glow (pink) ───────────────────────────
// A pink pool disc under the feet + a soft rising light column, both additive, both
// riding the roving leader. This is the ONE glow / the ONE pink on the screen; every
// other body carries only its own core light/rim (no added glow). Presence-effect
// family (discs / additive shafts), built here — the shared presence helpers are only
// referenced as a technique, never edited.
function buildLeaderMarker(pinkHex, topY) {
  const group = new THREE.Group();
  const color = new THREE.Color(pinkHex);

  const discTex = makeRadialTexture('rgba(255,255,255,0.92)', 'rgba(255,255,255,0.12)', 0.5);
  const discMat = new THREE.MeshBasicMaterial({ map: discTex, color, transparent: true, opacity: LEADER.discOpacity, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  const disc = new THREE.Mesh(new THREE.PlaneGeometry(LEADER.discRadius * 2, LEADER.discRadius * 2), discMat);
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = topY + 0.03;
  group.add(disc);

  // soft light column: an open cone, wide at the feet, tapering up — additive, low
  // opacity, fog off. Reads as a beacon of light standing on the leader.
  const colGeo = new THREE.ConeGeometry(LEADER.columnRadius, LEADER.columnHeight, 24, 1, true);
  const colMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: LEADER.columnOpacity, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false });
  const column = new THREE.Mesh(colGeo, colMat);
  column.position.y = topY + LEADER.columnHeight / 2;
  group.add(column);

  const follow = (pos) => {
    group.position.x += (pos.x - group.position.x) * LEADER.followLerp;
    group.position.z += (pos.z - group.position.z) * LEADER.followLerp;
  };
  const tick = (t, reduced) => {
    const k = reduced ? 1 : 1 + LEADER.pulse * Math.sin(t * LEADER.pulseSpeed);
    discMat.opacity = LEADER.discOpacity * k;
    colMat.opacity = LEADER.columnOpacity * k;
  };
  const dispose = () => { disc.geometry.dispose(); discMat.dispose(); discTex.dispose(); colGeo.dispose(); colMat.dispose(); };
  return { group, follow, tick, dispose };
}

// ── roster placement: rejection-sample N spawns in an annulus (off the centre seam),
//    each ≥ minSeparation apart. Relaxed top-up if the strict pass falls short. ──
function placeRoster() {
  const pts = [];
  let tries = 0;
  while (pts.length < CONFIG.rosterCount && tries < 900) {
    tries++;
    const a = Math.random() * Math.PI * 2;
    const r = CONFIG.spawnRadiusMin + Math.random() * (CONFIG.spawnRadiusMax - CONFIG.spawnRadiusMin);
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (pts.some((p) => Math.hypot(p.x - x, p.z - z) < CONFIG.minSeparation)) continue;
    pts.push({ x, z });
  }
  while (pts.length < CONFIG.rosterCount) {
    const a = (pts.length / CONFIG.rosterCount) * Math.PI * 2;
    const r = CONFIG.spawnRadiusMin + Math.random() * (CONFIG.spawnRadiusMax - CONFIG.spawnRadiusMin);
    pts.push({ x: Math.cos(a) * r, z: Math.sin(a) * r });
  }
  return pts;
}

// ─────────────────────────────────── scene plumbing ───────────────────────────────────
const wrap = ref(null);
const canvasEl = ref(null);

let renderer, scene, camera, controls, arena, resizeObserver, clock;
// Pre-load readiness: emit once after the first frame renders so the bootstrap
// splash + the SPA transition cover lift on real space-scene readiness. Per-mount
// (script-setup local) so it re-fires on every fresh mount.
let firstFrameEmitted = false;
let onVisibility;
let director = null;
let prevT = 0;
let reduced = false;
let lamps = null, backdrop = null, field = null, leaderMarker = null;
const roster = []; // [{ fighter }]

function lowPowerDevice() {
  const cores = navigator.hardwareConcurrency || 8;
  const mem = navigator.deviceMemory || 8;
  return cores <= 4 || mem <= 4;
}

onMounted(() => {
  const el = wrap.value;
  const w = el.clientWidth || window.innerWidth;
  const h = el.clientHeight || window.innerHeight;

  reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const targetFPS = coarse ? 30 : 60;

  renderer = new THREE.WebGLRenderer({ canvas: canvasEl.value, antialias: true, alpha: true, powerPreference: 'high-performance' });
  const maxDPR = lowPowerDevice() ? 1.5 : 2;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDPR));
  renderer.setSize(w, h, false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x070811, 0.019); // lighter than PVE → the big field reads, edges fade

  camera = new THREE.PerspectiveCamera(CAM.fov, w / h, 0.1, 200);
  camera.position.copy(CAM.base);

  // Lighting — same recipe as the arena/home (one warm key + cool fill).
  const key = new THREE.DirectionalLight(0xfff2e8, 2.2);
  key.position.set(4, 12, 6);
  scene.add(key);
  scene.add(new THREE.AmbientLight(0x2a3550, 0.5));
  scene.add(new THREE.HemisphereLight(0x44506e, 0x05060c, 0.4));

  const pink = getComputedStyle(el).getPropertyValue('--hex-primary').trim() || '#FF0069';

  // --- Central slab: instance buildArena UNMODIFIED, then suppress the combat rift
  //     exactly as PVE does (external only): zero the rift-glow opacities, hide the
  //     sparks, never build presence, and hide the bright slab-outline Lines. ---
  arena = buildArena(renderer.capabilities.getMaxAnisotropy(), pink);
  arena.refs.riftGlow.forEach((r) => { r.mat.opacity = 0; });
  arena.refs.sparks.points.visible = false;
  arena.group.traverse((o) => { if (o.isLine) o.visible = false; });
  scene.add(arena.group);
  const topY = arena.refs.topY;

  // Dark seam-filler over the torn slit so the slab reads as one calm platform.
  const seam = new THREE.Mesh(new THREE.PlaneGeometry(arena.refs.W + 0.2, 1.3), new THREE.MeshBasicMaterial({ color: 0x0c1018 }));
  seam.rotation.x = -Math.PI / 2;
  seam.position.set(0, topY - 0.05, 0);
  scene.add(seam);

  // --- The big hex FIELD around the slab (dominant floor) + depth dome + lamps. ---
  field = buildHexField(topY, renderer.capabilities.getMaxAnisotropy()); scene.add(field.group);
  backdrop = buildBackdrop(BACKDROP); scene.add(backdrop.mesh);
  lamps = buildLamps(LAMPS, reduced); scene.add(lamps.group);

  // --- Roster: 14 fighters, core colour cycled, spread across the field off the seam.
  //     Each idles + walks via the spaceWander director on a BIG personal zone. ---
  const pts = placeRoster();
  const agents = []; // { fighter, zone } for the director
  pts.forEach((p, i) => {
    const core = CORE_PALETTE[i % CORE_PALETTE.length];
    const behavior = resolveBehavior(core.id, []);
    if (behavior && behavior.axes) behavior.axes.distance = 18; // small range → always WALKS to the lure

    // personal wander rect — big + overlapping (range wide), clamped to the field
    const zone = {
      xMin: THREE.MathUtils.clamp(p.x - CONFIG.zoneHalf, -CONFIG.roamHalf, CONFIG.roamHalf),
      xMax: THREE.MathUtils.clamp(p.x + CONFIG.zoneHalf, -CONFIG.roamHalf, CONFIG.roamHalf),
      zMin: THREE.MathUtils.clamp(p.z - CONFIG.zoneHalf, -CONFIG.roamHalf, CONFIG.roamHalf),
      zMax: THREE.MathUtils.clamp(p.z + CONFIG.zoneHalf, -CONFIG.roamHalf, CONFIG.roamHalf),
    };

    const idx = i; // capture for the per-agent getFoePos closure
    const fighter = buildFighter(core.hue, {
      side: 'player',
      coreId: core.id,
      behavior,
      bounds: { x: CONFIG.roamHalf, z: CONFIG.roamHalf },
      neutralColor: false, // keep the core colour on the body (light/rim)
      getFoePos: () => director.foePos(idx),
    });
    fighter.group.position.set(p.x, topY, p.z);
    fighter.group.rotation.y = Math.atan2(p.x, p.z); // face the field centre initially
    fighter.setReducedMotion(reduced);
    // SUPPRESS the over-head HP plate (the only Sprite added DIRECTLY to the group),
    // same external approach as PVE/Home — no HP plates in this preview.
    fighter.group.children.forEach((o) => { if (o.isSprite) o.visible = false; });
    scene.add(fighter.group);

    roster.push({ fighter });
    agents.push({ fighter, zone });
  });

  // Roster wander — drives the EXISTING locomotion per member (see spaceWander.js).
  director = createSpaceWanderDirector();
  director.attach(agents, camera, { reduced });

  // --- Leader beacon: mark member LEADER.index with the scene's single pink glow. ---
  const leader = roster[LEADER.index]?.fighter || null;
  if (leader) {
    leaderMarker = buildLeaderMarker(pink, topY);
    leaderMarker.group.position.set(leader.group.position.x, 0, leader.group.position.z);
    scene.add(leaderMarker.group);
  }

  // --- Orbit around the FIELD CENTRE (stable pivot — never follows anyone). Pulled
  //     back + a touch higher so the whole field reads. ---
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, topY + CAM.targetLift, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.rotateSpeed = 0.9;
  controls.zoomSpeed = 0.9;
  controls.minDistance = CAM.minDistance;
  controls.maxDistance = CAM.maxDistance;
  controls.minPolarAngle = CAM.minPolarAngle;
  controls.maxPolarAngle = CAM.maxPolarAngle;
  controls.autoRotate = !reduced;
  controls.autoRotateSpeed = CAM.autoRotateSpeed;
  controls.addEventListener('start', () => { controls.autoRotate = false; });
  controls.update();

  // --- Render loop. FPS-capped; elapsed time drives wander + idle + beacon. ---
  clock = new THREE.Clock();
  prevT = 0;
  const interval = 1000 / targetFPS;
  let lastFrame = 0;
  const loop = (time) => {
    if (time - lastFrame < interval) return;
    lastFrame = time;
    const t = clock.getElapsedTime();
    const dt = t - prevT;
    prevT = t;

    controls.update();
    if (!reduced) director?.update(t, dt);
    for (const r of roster) r.fighter.update(t, camera);

    // Leader beacon rides the roving leader + gently breathes.
    if (leaderMarker && leader) {
      leaderMarker.follow(leader.group.position);
      leaderMarker.tick(t, reduced);
    }

    lamps?.tick?.(t);

    renderer.render(scene, camera);

    // First frame is on screen — signal readiness once (latch + event) so the
    // pre-load splash / SPA transition cover lift on real space-scene readiness.
    if (!firstFrameEmitted) {
      firstFrameEmitted = true;
      window.__hexSpaceReady = true;
      window.dispatchEvent(new Event('hexlash:space-ready'));
    }
  };
  renderer.setAnimationLoop(loop);

  onVisibility = () => {
    if (document.hidden) renderer.setAnimationLoop(null);
    else renderer.setAnimationLoop(loop);
  };
  document.addEventListener('visibilitychange', onVisibility);

  resizeObserver = new ResizeObserver(() => {
    const cw = el.clientWidth, ch = el.clientHeight;
    if (!cw || !ch) return;
    camera.aspect = cw / ch;
    camera.updateProjectionMatrix();
    renderer.setSize(cw, ch, false);
  });
  resizeObserver.observe(el);
});

onBeforeUnmount(() => {
  if (resizeObserver) resizeObserver.disconnect();
  if (onVisibility) document.removeEventListener('visibilitychange', onVisibility);
  if (renderer) renderer.setAnimationLoop(null);
  if (director) director.dispose();
  if (controls) controls.dispose();
  if (leaderMarker) { scene.remove(leaderMarker.group); leaderMarker.dispose(); }
  for (const r of roster) { if (r.fighter) r.fighter.dispose(); }
  roster.length = 0;
  if (lamps) { scene.remove(lamps.group); lamps.dispose(); }
  if (field) { scene.remove(field.group); field.dispose(); }
  if (backdrop) { scene.remove(backdrop.mesh); backdrop.dispose(); }
  if (arena) arena.dispose();
  if (renderer) renderer.dispose();
});
</script>

<style scoped>
.space-scene-wrap {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 70% 60% at 50% 44%, #0d0f1c 0%, #07080f 55%, #030308 100%);
}
.space-scene-canvas { display: block; width: 100%; height: 100%; }
.space-scene-vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse 80% 80% at 50% 50%, transparent 54%, rgba(3, 3, 8, 0.6) 100%);
}
</style>
