<!-- PveScene — the PVE "club" 3D stage. A self-contained sibling of HomeScene.vue
     (the home is live on prod — this never reuses it by a flag and never touches it):
     the SAME arena slab with the combat rift SUPPRESSED from outside (rift-glow
     opacity 0, sparks off, presence never created, the bright slab outline Lines
     hidden), the SAME warm dim lamp room-fill + drifting dust, and an OrbitControls
     rig — but here the plate holds a ROSTER of club fighters (buildFighter ×N), each
     living and walking on its own footwork (pveWander), and above the plate centre a
     trainer-LEGEND floats in a warm amber cloud, continuously drifting (legendPresence).

     Discipline: dark room; each roster body glows ITS core colour (cold/varied);
     the legend's warm amber cloud is the ONE warm anchor; NO pink anywhere (the FIGHT
     pink lives on the home, never here); no HP plates; no FIGHT. All tuning knobs are
     in the CONFIG / LEGEND blocks at the top. Respects prefers-reduced-motion + tab
     pause. buildArena / buildFighter are only INSTANCED, never edited. -->
<template>
  <div ref="wrap" class="pve-scene-wrap">
    <canvas ref="canvasEl" class="pve-scene-canvas" />
    <div class="pve-scene-vignette" />
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildArena } from './buildArena.js';
import { makeRadialTexture } from './arenaTextures.js';
import { buildFighter } from './buildFighter.js';
import { resolveBehavior } from '@/data/behavior.js';
import { createPveWanderDirector } from './pveWander.js';
import { createLegendPresence } from './legendPresence.js';

// ───────────────────────────── CONFIG (tune on preview) ─────────────────────────────
const CONFIG = {
  rosterCount: 5,            // CLUB_ROSTER_COUNT — fighters on the plate
  rosterSpreadRadius: 1.6,   // ideal placement radius from the plate centre
  rosterMinSeparation: 1.2,  // min XZ distance between any two members on placement
  seamGuard: 0.78,           // keep members this far off the central rift seam (|z|)
  agentZoneHalfX: 0.72,      // personal wander rect half-extent X around a member's spawn
  agentZoneHalfZ: 0.3,       // personal wander rect half-extent Z (shallow → stays its side)
};
// The legend trainer floating over the plate centre.
const LEGEND = {
  height: 2.55,        // plate-top → legend feet (it floats this high above the roster)
  driftSpeed: 0.5,     // Lissajous glide rate (never static)
  driftRadius: 0.7,    // horizontal glide half-extent
  bobAmplitude: 0.18,  // vertical bob
  hazeDensity: 90,     // warm cloud particle count
};
// Locked core palette (RAIDER = the bright tone #FFD930). The legend is amber #FFB21D —
// the single warm anchor, distinct from these cold/varied roster cores.
const CORE_PALETTE = [
  { id: 'natisk', hue: '#FF3344' }, // ONSLAUGHT
  { id: 'nalet', hue: '#FFD930' },  // RAIDER (bright)
  { id: 'skala', hue: '#2ED6B0' },  // BULWARK
  { id: 'zasada', hue: '#9461FF' }, // AMBUSH
];
const LEGEND_HUE = '#FFB21D';

// ─────────────────────────── Lamp room-fill (home recipe, own copy) ───────────────────────────
const LAMPS = {
  ceilingY: 7.3, wire: 1.6, hangLift: 1.2, shadeRadius: 0.55, shadeHeight: 0.5,
  // hangLift raises the shades/bulbs/light by this much (and shortens the visible rod
  // from below) so the fixtures sit above the fighters / out of frame. Light PARAMS
  // (colour/intensity/distance/decay) are unchanged — only the hang height moves.
  shadeColor: 0x161a24, rodColor: 0x0c0f16, rodRadius: 0.018,
  bulbRadius: 0.12, bulbColor: 0xffb368, bulbOpacity: 0.95,
  light: { color: 0xffb368, intensity: 16, distance: 18, decay: 2 },
  positions: [
    { x: -1.9, z: -0.5, drop: 0.0 },
    { x: 1.9, z: 0.5, drop: 0.7 },
    { x: 0.1, z: -1.5, drop: 0.3 },
    { x: -0.3, z: 1.4, drop: 1.0 },
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
    const rodLen = Math.max(0.05, opts.ceilingY - shadeTopY); // shorter visible rod as the shade rises
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

// ─────────────────────────── Ambient dust (home recipe, own copy) ───────────────────────────
const DUST = {
  count: 110, xRange: 2.6, zRange: 1.7, yMin: 0.7, yMax: 3.9, size: 0.16,
  color: 0xffb368, opacity: 0.36, rise: 0.10, sway: 0.05, swaySpeed: 0.25, flicker: 0.35, flickerSpeed: 0.55,
};
function buildDust(opts, reducedMotion) {
  const n = opts.count;
  const positions = new Float32Array(n * 3);
  const baseX = new Float32Array(n), baseZ = new Float32Array(n), baseY = new Float32Array(n);
  const phX = new Float32Array(n), phZ = new Float32Array(n);
  const yRange = opts.yMax - opts.yMin;
  for (let i = 0; i < n; i++) {
    baseX[i] = (Math.random() * 2 - 1) * opts.xRange;
    baseZ[i] = (Math.random() * 2 - 1) * opts.zRange;
    baseY[i] = Math.random() * yRange;
    phX[i] = Math.random() * Math.PI * 2; phZ[i] = Math.random() * Math.PI * 2;
    positions[i * 3] = baseX[i]; positions[i * 3 + 1] = opts.yMin + baseY[i]; positions[i * 3 + 2] = baseZ[i];
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const tex = makeRadialTexture('rgba(255,210,150,0.95)', 'rgba(255,180,105,0.22)', 0.3);
  const mat = new THREE.PointsMaterial({ map: tex, color: opts.color, size: opts.size, sizeAttenuation: true, transparent: true, opacity: opts.opacity, depthWrite: false, blending: THREE.AdditiveBlending });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  const tick = reducedMotion ? null : (t) => {
    for (let i = 0; i < n; i++) {
      positions[i * 3] = baseX[i] + opts.sway * Math.sin(opts.swaySpeed * t + phX[i]);
      positions[i * 3 + 1] = opts.yMin + ((baseY[i] + opts.rise * t) % yRange);
      positions[i * 3 + 2] = baseZ[i] + opts.sway * Math.cos(opts.swaySpeed * 0.8 * t + phZ[i]);
    }
    geo.attributes.position.needsUpdate = true;
    mat.opacity = opts.opacity * (1 - opts.flicker * 0.5 + opts.flicker * 0.5 * Math.sin(opts.flickerSpeed * t));
  };
  const dispose = () => { geo.dispose(); mat.dispose(); tex.dispose(); };
  return { points, tick, dispose };
}

// ── Per-fighter under-glow (home GLOW recipe, own copy) — tinted to THE fighter's
//    COLD core hue (NOT amber), so every member stands in a faint pool of its own
//    core light and the legend's amber stays the only warm anchor. ──
const GLOW = { radius: 1.3, opacity: 0.16, follow: 0.08, yLift: 0.02 };
function buildUnderGlow(colorHex, topY) {
  const tex = makeRadialTexture('rgba(255,255,255,0.85)', 'rgba(255,255,255,0.12)', 0.5);
  const mat = new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(colorHex), transparent: true, opacity: GLOW.opacity, depthWrite: false, blending: THREE.AdditiveBlending });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(GLOW.radius * 2, GLOW.radius * 2), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = topY + GLOW.yLift;
  const follow = (pos) => {
    mesh.position.x += (pos.x - mesh.position.x) * GLOW.follow;
    mesh.position.z += (pos.z - mesh.position.z) * GLOW.follow;
  };
  const dispose = () => { mesh.geometry.dispose(); mat.dispose(); tex.dispose(); };
  return { mesh, follow, dispose };
}

// ─────────────────────────── Background depth dome + lamp haze (home recipe, own copy) ───────────────────────────
const BACKDROP = {
  radius: 45, centerY: 1.6, texW: 1024, texH: 1024,
  grad: [[0.0, '#060710'], [0.42, '#0a0a12'], [0.62, '#120f0c'], [1.0, '#1b150d']],
  hexCols: 60, hexRGB: '255,186,120', hexMaxAlpha: 0.05, hexFadeStart: 0.46, hexFadeEnd: 0.62, dither: 3,
};
const HAZE = { color: 0xffb368, opacity: 0.14, scale: 2.6, yOffset: 0.05 };
function strokeHex(ctx, cx, cy, R) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) { const a = (Math.PI / 3) * i, x = cx + R * Math.cos(a), y = cy + R * Math.sin(a); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
  ctx.closePath(); ctx.stroke();
}
function drawHexWeave(ctx, o) {
  const cols = o.hexCols, R = o.texW / (cols * 1.5), vStep = Math.sqrt(3) * R;
  ctx.lineWidth = Math.max(1, R * 0.05); ctx.lineJoin = 'round';
  for (let c = 0; c <= cols; c++) {
    const x = c * 1.5 * R, yOff = (c % 2) * (vStep / 2);
    for (let r = -1; r * vStep + yOff < o.texH + vStep; r++) {
      const y = r * vStep + yOff, v = 1 - y / o.texH;
      let a = 0;
      if (v > o.hexFadeStart) a = o.hexMaxAlpha * Math.min(1, (v - o.hexFadeStart) / (o.hexFadeEnd - o.hexFadeStart));
      if (a <= 0.002) continue;
      ctx.strokeStyle = `rgba(${o.hexRGB},${a.toFixed(3)})`;
      strokeHex(ctx, x, y, R);
    }
  }
}
function buildBackdrop(o, maxAniso) {
  const c = document.createElement('canvas'); c.width = o.texW; c.height = o.texH;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, o.texH);
  for (const [stop, col] of o.grad) g.addColorStop(stop, col);
  ctx.fillStyle = g; ctx.fillRect(0, 0, o.texW, o.texH);
  if (o.dither > 0) {
    const img = ctx.getImageData(0, 0, o.texW, o.texH), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const nz = (Math.random() * 2 - 1) * o.dither; d[i] += nz; d[i + 1] += nz; d[i + 2] += nz; }
    ctx.putImageData(img, 0, 0);
  }
  drawHexWeave(ctx, o);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = Math.min(4, maxAniso || 1);
  const geo = new THREE.SphereGeometry(o.radius, 48, 32);
  const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false, depthWrite: false });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0, o.centerY, 0); mesh.renderOrder = -10;
  const dispose = () => { geo.dispose(); mat.dispose(); tex.dispose(); };
  return { mesh, dispose };
}
function buildLampHaze(o, lampOpts) {
  const group = new THREE.Group();
  const tex = makeRadialTexture('rgba(255,205,150,0.9)', 'rgba(255,175,100,0.0)', 0.5);
  const mat = new THREE.SpriteMaterial({ map: tex, color: o.color, transparent: true, opacity: o.opacity, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  for (const pos of lampOpts.positions) {
    const shadeTopY = lampOpts.ceilingY - lampOpts.wire - (pos.drop || 0);
    const bulbY = shadeTopY - lampOpts.shadeHeight * 0.55;
    const s = new THREE.Sprite(mat);
    s.position.set(pos.x, bulbY + o.yOffset, pos.z); s.scale.setScalar(o.scale);
    group.add(s);
  }
  const dispose = () => { tex.dispose(); mat.dispose(); };
  return { group, dispose };
}

// ── roster placement: rejection-sample N spots inset on the plate, OFF the central
//    seam band, each ≥ rosterMinSeparation apart. Falls back to a relaxed fill. ──
function placeRoster(W, totalDepth) {
  const halfX = W / 2 - 0.85;
  const halfZ = totalDepth / 2 - 0.5;
  const pts = [];
  let tries = 0;
  while (pts.length < CONFIG.rosterCount && tries < 600) {
    tries++;
    const x = (Math.random() * 2 - 1) * halfX;
    const z = (Math.random() * 2 - 1) * halfZ;
    if (Math.abs(z) < CONFIG.seamGuard) continue;
    if (pts.some((p) => Math.hypot(p.x - x, p.z - z) < CONFIG.rosterMinSeparation)) continue;
    pts.push({ x, z });
  }
  // relaxed top-up if the strict pass came up short (rare)
  while (pts.length < CONFIG.rosterCount) {
    const side = pts.length % 2 === 0 ? 1 : -1;
    pts.push({ x: (Math.random() * 2 - 1) * halfX, z: side * (CONFIG.seamGuard + Math.random() * (halfZ - CONFIG.seamGuard)) });
  }
  return { pts, halfX, halfZ };
}

// ─────────────────────────────────── scene plumbing ───────────────────────────────────
const wrap = ref(null);
const canvasEl = ref(null);

let renderer, scene, camera, controls, arena, resizeObserver, clock;
// Pre-load readiness: emit once after the first frame is rendered so the
// bootstrap splash (page-load) and the SPA transition cover can lift on real
// pve-scene readiness. Per-mount (script-setup local) so it re-fires on every
// fresh mount, not just the first of the session.
let firstFrameEmitted = false;
let onVisibility;
let director = null;
let prevT = 0;
let reduced = false;
let lamps = null, dust = null, backdrop = null, lampHaze = null;
let legend = null, legendPresence = null;
const roster = []; // [{ fighter, glow }]

const CAM_BASE = new THREE.Vector3(5.4, 6.1, 8.4);

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
  scene.fog = new THREE.FogExp2(0x070811, 0.03);

  camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
  camera.position.copy(CAM_BASE);

  // Lighting — same recipe as the arena/home (one warm key + cool fill).
  const key = new THREE.DirectionalLight(0xfff2e8, 2.3);
  key.position.set(4, 10, 6);
  scene.add(key);
  scene.add(new THREE.AmbientLight(0x2a3550, 0.5));
  scene.add(new THREE.HemisphereLight(0x44506e, 0x05060c, 0.4));

  const pink = getComputedStyle(el).getPropertyValue('--hex-primary').trim() || '#FF0069';

  // --- Slab: instance buildArena UNMODIFIED, then suppress the combat rift exactly
  //     as the home does (external only): zero the rift-glow opacities, hide the
  //     sparks, never build arenaPresence, and hide the bright slab-outline Lines. ---
  arena = buildArena(renderer.capabilities.getMaxAnisotropy(), pink);
  arena.refs.riftGlow.forEach((r) => { r.mat.opacity = 0; });
  arena.refs.sparks.points.visible = false;
  arena.group.traverse((o) => { if (o.isLine) o.visible = false; });
  scene.add(arena.group);
  const topY = arena.refs.topY;

  // Dark seam-filler over the torn slit so the slab reads as one calm platform.
  const seam = new THREE.Mesh(new THREE.PlaneGeometry(arena.refs.W + 0.2, 1.3), new THREE.MeshBasicMaterial({ color: 0x0c1018 }));
  seam.rotation.x = -Math.PI / 2;
  seam.position.set(0, topY - 0.06, 0);
  scene.add(seam);

  // Atmosphere / depth — warm dim lamp room-fill + drifting dust + a background dome
  // + soft lamp haze (all warm/dark FILL, no pink, no new accent).
  lamps = buildLamps(LAMPS, reduced); scene.add(lamps.group);
  backdrop = buildBackdrop(BACKDROP, renderer.capabilities.getMaxAnisotropy()); scene.add(backdrop.mesh);
  lampHaze = buildLampHaze(HAZE, LAMPS); scene.add(lampHaze.group);
  dust = buildDust(DUST, reduced); scene.add(dust.points);

  // --- Roster: CLUB_ROSTER_COUNT fighters, each its own core colour (cycled), spread
  //     on the plate off the seam. Each idles + walks via the pveWander director. ---
  const { pts, halfX, halfZ } = placeRoster(arena.refs.W, arena.refs.totalDepth);
  const agents = []; // { fighter, zone } for the director
  pts.forEach((p, i) => {
    const core = CORE_PALETTE[i % CORE_PALETTE.length];
    const behavior = resolveBehavior(core.id, []);
    if (behavior && behavior.axes) behavior.axes.distance = 18; // keep range small → always WALKS to the lure

    // personal wander rect — clamped to this member's side of the seam (never crosses)
    const sideMin = p.z > 0 ? CONFIG.seamGuard : -halfZ;
    const sideMax = p.z > 0 ? halfZ : -CONFIG.seamGuard;
    const zone = {
      xMin: THREE.MathUtils.clamp(p.x - CONFIG.agentZoneHalfX, -halfX, halfX),
      xMax: THREE.MathUtils.clamp(p.x + CONFIG.agentZoneHalfX, -halfX, halfX),
      zMin: THREE.MathUtils.clamp(p.z - CONFIG.agentZoneHalfZ, sideMin, sideMax),
      zMax: THREE.MathUtils.clamp(p.z + CONFIG.agentZoneHalfZ, sideMin, sideMax),
    };

    const idx = i; // capture for the per-agent getFoePos closure
    const fighter = buildFighter(core.hue, {
      side: 'player',
      coreId: core.id,
      behavior,
      bounds: { x: arena.refs.W / 2 - 0.35, z: arena.refs.totalDepth / 2 - 0.3 },
      neutralColor: false,
      getFoePos: () => director.foePos(idx), // moving lure while strolling, null while idle
    });
    fighter.group.position.set(p.x, topY, p.z);
    fighter.group.rotation.y = Math.atan2(p.x, p.z); // face the plate centre initially
    fighter.setReducedMotion(reduced);
    // SUPPRESS the over-head HP plate (the only Sprite added DIRECTLY to the group),
    // same external approach as the home — there are no HP plates on this scene.
    fighter.group.children.forEach((o) => { if (o.isSprite) o.visible = false; });
    scene.add(fighter.group);

    // a faint pool of THIS member's own (cold) core colour under its feet
    const glow = buildUnderGlow(core.hue, topY);
    glow.mesh.position.set(p.x, topY + GLOW.yLift, p.z);
    scene.add(glow.mesh);

    roster.push({ fighter, glow });
    agents.push({ fighter, zone });
  });

  // Roster wander — drives the EXISTING locomotion per member (see pveWander.js).
  director = createPveWanderDirector();
  director.attach(agents, camera, { reduced });

  // --- Legend: a buildFighter body with the amber core, idle only (NEVER added to
  //     the wander), floating LEGEND.height over the plate centre, drifting forever
  //     inside its warm cloud (legendPresence). ---
  const legendBehavior = resolveBehavior(null, []);
  legend = buildFighter(LEGEND_HUE, { side: 'player', coreId: null, behavior: legendBehavior, bounds: { x: 1, z: 1 }, neutralColor: false, getFoePos: () => null });
  legend.setReducedMotion(reduced);
  legend.group.children.forEach((o) => { if (o.isSprite) o.visible = false; }); // no HP plate
  scene.add(legend.group);
  legendPresence = createLegendPresence({
    baseX: 0, baseZ: 0, floorY: topY,
    driftSpeed: LEGEND.driftSpeed, driftRadius: LEGEND.driftRadius,
    bobAmplitude: LEGEND.bobAmplitude, hazeDensity: LEGEND.hazeDensity,
    ORBIT: { highAboveTop: LEGEND.height }, // feet height at the high/centre phase = LEGEND.height
    reduced,
  });
  legend.group.position.copy(legendPresence.position);
  scene.add(legendPresence.group);
  scene.add(legendPresence.trail); // world-space descent smoke wisps

  // --- Orbit around the PLATE CENTRE (stable pivot — never follows anyone). ---
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, topY + 1.6, 0); // plate centre, lifted between roster + legend
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.rotateSpeed = 0.9;
  controls.zoomSpeed = 0.9;
  controls.minDistance = 3.5;
  controls.maxDistance = 12;
  controls.minPolarAngle = 0.3;
  controls.maxPolarAngle = 1.4;
  controls.autoRotate = !reduced;
  controls.autoRotateSpeed = 0.5;
  controls.addEventListener('start', () => { controls.autoRotate = false; });
  controls.update();

  // --- Render loop. FPS-capped; elapsed time drives wander + idle + drift. ---
  clock = new THREE.Clock();
  prevT = 0;
  const interval = 1000 / targetFPS;
  let lastFrame = 0;
  const _camDir = new THREE.Vector3();
  const loop = (time) => {
    if (time - lastFrame < interval) return;
    lastFrame = time;
    const t = clock.getElapsedTime();
    const dt = t - prevT;
    prevT = t;

    controls.update();
    if (!reduced) director?.update(t, dt);
    for (const r of roster) {
      r.fighter.update(t, camera);
      r.glow.follow(r.fighter.group.position);
    }

    // Legend: idle body, ride the drift, and slowly face the camera (presiding).
    legend?.update(t, camera);
    if (legendPresence) {
      legendPresence.tick(t, dt);
      legend.group.position.copy(legendPresence.position);
      if (!reduced) {
        _camDir.set(camera.position.x - legend.group.position.x, 0, camera.position.z - legend.group.position.z);
        const desired = Math.atan2(-_camDir.x, -_camDir.z);
        let d = (desired - legend.group.rotation.y) % (Math.PI * 2);
        if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2;
        legend.group.rotation.y += d * (1 - Math.exp(-1.5 * Math.min(0.05, dt)));
      }
    }

    lamps?.tick?.(t);
    if (!reduced) dust?.tick?.(t);

    renderer.render(scene, camera);

    // First frame is on screen — signal readiness once (latch + event) so the
    // pre-load splash / SPA transition cover lift on real pve-scene readiness.
    if (!firstFrameEmitted) {
      firstFrameEmitted = true;
      window.__hexPveReady = true;
      window.dispatchEvent(new Event('hexlash:pve-ready'));
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
  for (const r of roster) {
    if (r.glow) { scene.remove(r.glow.mesh); r.glow.dispose(); }
    if (r.fighter) r.fighter.dispose();
  }
  roster.length = 0;
  if (legendPresence) { scene.remove(legendPresence.group); scene.remove(legendPresence.trail); legendPresence.dispose(); }
  if (legend) legend.dispose();
  if (lamps) { scene.remove(lamps.group); lamps.dispose(); }
  if (backdrop) { scene.remove(backdrop.mesh); backdrop.dispose(); }
  if (lampHaze) { scene.remove(lampHaze.group); lampHaze.dispose(); }
  if (dust) { scene.remove(dust.points); dust.dispose(); }
  if (arena) arena.dispose();
  if (renderer) renderer.dispose();
});
</script>

<style scoped>
.pve-scene-wrap {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 70% 60% at 50% 44%, #0d0f1c 0%, #07080f 55%, #030308 100%);
}
.pve-scene-canvas { display: block; width: 100%; height: 100%; }
.pve-scene-vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse 78% 78% at 50% 50%, transparent 56%, rgba(3, 3, 8, 0.55) 100%);
}
</style>
