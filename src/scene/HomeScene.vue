<!-- HomeScene — the calm "home" 3D stage. The SAME arena slab + the SAME idle
     fighter as the arena, but WITHOUT the combat rift (no glow, no sparks, no
     opponent, no HUD) and with a fixed 3/4 camera (gentle sway, no orbit).
     Reuses buildArena / buildFighter unmodified — the rift glow is suppressed
     by hiding the rift-glow materials + sparks and never creating the presence
     layer (which is what pulses the rift). A small dark seam-filler occludes the
     void seen through the torn slit so the slab reads as one calm platform.

     Discipline: the ONLY glow on this scene is the fighter's core (one of the
     two allowed glows; the other — the FIGHT button — lives in the 2D layer).
     Decor props are matte. Respects prefers-reduced-motion + tab-hidden pause. -->
<template>
  <div ref="wrap" class="home-scene-wrap">
    <canvas ref="canvasEl" class="home-scene-canvas" />
    <div class="home-scene-vignette" />
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, watch, ref } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildArena } from './buildArena.js';
import { buildFighter } from './buildFighter.js';
import { resolveBehavior } from '@/data/behavior.js';
import { buildPropSet, buildSnapGrid, buildGhost, disposeGroup } from './homeProps.js';

const props = defineProps({
  coreHue: { type: String, default: '#FF0069' }, // fighter core colour (per-core hue)
  coreId: { type: String, default: null }, // null = no core picked → default fighter
  placements: { type: Array, default: () => [] }, // [{ kind, u, v }] fixed decor set
  arrange: { type: Boolean, default: false }, // arrange mode → show snap-grid + ghost
  gridCells: { type: Array, default: () => [] }, // [{ u, v, active }]
  ghost: { type: Object, default: null }, // { kind, u, v } | null
});

const wrap = ref(null);
const canvasEl = ref(null);

let renderer, scene, camera, controls, arena, fighter, resizeObserver, clock;
let onVisibility;
let propGroup = null;
let gridGroup = null;
let ghostGroup = null;
let arenaRefs = null;
let garland = null;
let reduced = false;
// Initial 3/4 camera placement; OrbitControls derives azimuth/polar/distance
// from this + the target (the fighter) on first update().
const CAM_BASE = new THREE.Vector3(4.6, 5.2, 6.7);

function lowPowerDevice() {
  const cores = navigator.hardwareConcurrency || 8;
  const mem = navigator.deviceMemory || 8;
  return cores <= 4 || mem <= 4;
}

// ───────────────────────── Overhead lamp garland ─────────────────────────
// Atmospheric "string lights over the pit" — warm, DIM emissive dots (fake
// glowing bulbs, NOT real lights: MeshBasic dots + faint additive halos, no
// PointLight), strung on thin dark catenary wires high above the fighter to
// fill the empty top of the frame. Discipline: the fighter core stays the only
// bright/real glow; these are tiny amber accents that never light the slab and
// are never pink. All knobs live here — tweak on preview in one place. If in
// doubt about brightness, go DIMMER (raise bulbOpacity/haloOpacity to brighten).
const GARLAND = {
  seed: 7314, // fixed → identical messy layout every reload
  strands: 3, // crisscrossing wire runs (robust across the 360° orbit)
  bulbsPerStrand: 7, // lamps per wire, irregular spacing + heights
  ringRadius: 5.4, // anchors scatter on a high circle of this radius (slab is ±3)
  height: 6.4, // Y of the anchor points (fighter top ~2.5 → well above)
  heightJitter: 0.9, // ± per-anchor vertical scatter
  sag: 1.9, // mid-span droop depth of each wire
  sagJitter: 0.7, // ± per-strand droop variation
  bulbRadius: 0.07, // lamp size (small = reads as a dim dot)
  bulbColor: 0xff9a4a, // warm amber (orange-yellow — NOT pink, NOT white)
  bulbColorJitter: 0.1, // tiny per-bulb hue/brightness scatter
  bulbOpacity: 0.7, // base dot opacity (dim; raise to brighten)
  haloOpacity: 0.14, // faint warm halo around each bulb (additive)
  haloScale: 5.0, // halo diameter as a multiple of the bulb diameter
  wireColor: 0x06060b, // thin dark wire
  wireOpacity: 0.55,
  flicker: 0.1, // per-bulb opacity wobble amplitude (0 = steady)
  flickerSpeed: 1.6,
  sway: 0.025, // gentle whole-garland sway (radians)
  swaySpeed: 0.45,
};

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Soft warm radial sprite for the bulb halo (one shared texture).
function makeHaloTexture() {
  const s = 64;
  const cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const ctx = cv.getContext('2d');
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,235,200,0.5)');
  g.addColorStop(1, 'rgba(255,220,180,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Build the garland → { group, tick(t)|null, dispose }. reduced ⇒ tick=null
// (static, no flicker/sway). Cheap: shared bulb geometry + halo texture/material,
// a handful of line/sphere/sprite objects total — fine on mobile.
function buildGarland(opts, reduced) {
  const group = new THREE.Group();
  const rng = mulberry32(opts.seed);
  const haloTex = makeHaloTexture();
  const haloMat = new THREE.SpriteMaterial({
    map: haloTex, color: opts.bulbColor, transparent: true, opacity: opts.haloOpacity,
    blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
  });
  const bulbGeo = new THREE.SphereGeometry(opts.bulbRadius, 8, 6);
  const wireGeos = [];
  const wireMats = [];
  const bulbs = []; // { mat, phase }

  const lerp = (a, b, t) => a + (b - a) * t;
  const onStrand = (A, B, sag, t) => new THREE.Vector3(
    lerp(A.x, B.x, t), lerp(A.y, B.y, t) - sag * 4 * t * (1 - t), lerp(A.z, B.z, t),
  );

  for (let s = 0; s < opts.strands; s++) {
    const aA = rng() * Math.PI * 2;
    const aB = aA + Math.PI + (rng() - 0.5) * 1.3; // roughly opposite → crosses centre
    const rA = opts.ringRadius * (0.85 + rng() * 0.3);
    const rB = opts.ringRadius * (0.85 + rng() * 0.3);
    const A = new THREE.Vector3(Math.cos(aA) * rA, opts.height + (rng() - 0.5) * 2 * opts.heightJitter, Math.sin(aA) * rA);
    const B = new THREE.Vector3(Math.cos(aB) * rB, opts.height + (rng() - 0.5) * 2 * opts.heightJitter, Math.sin(aB) * rB);
    const sag = opts.sag + (rng() - 0.5) * 2 * opts.sagJitter;

    const SEG = 26;
    const pts = [];
    for (let i = 0; i <= SEG; i++) pts.push(onStrand(A, B, sag, i / SEG));
    const wGeo = new THREE.BufferGeometry().setFromPoints(pts);
    const wMat = new THREE.LineBasicMaterial({ color: opts.wireColor, transparent: true, opacity: opts.wireOpacity });
    group.add(new THREE.Line(wGeo, wMat));
    wireGeos.push(wGeo);
    wireMats.push(wMat);

    for (let b = 0; b < opts.bulbsPerStrand; b++) {
      const t = THREE.MathUtils.clamp(
        (b + 0.5) / opts.bulbsPerStrand + (rng() - 0.5) * (0.7 / opts.bulbsPerStrand), 0.03, 0.97,
      );
      const p = onStrand(A, B, sag, t);
      p.y -= rng() * 0.18; // hang slightly off the wire (uneven)
      const c = new THREE.Color(opts.bulbColor);
      const j = (rng() - 0.5) * 2 * opts.bulbColorJitter;
      c.offsetHSL(j * 0.03, 0, j * 0.5); // tiny hue + brightness scatter
      const mat = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: opts.bulbOpacity, depthWrite: false });
      const m = new THREE.Mesh(bulbGeo, mat);
      m.position.copy(p);
      group.add(m);
      const halo = new THREE.Sprite(haloMat);
      halo.position.copy(p);
      halo.scale.setScalar(opts.bulbRadius * opts.haloScale);
      group.add(halo);
      bulbs.push({ mat, phase: rng() * Math.PI * 2 });
    }
  }

  const tick = reduced ? null : (t) => {
    group.rotation.z = Math.sin(t * opts.swaySpeed) * opts.sway;
    group.rotation.x = Math.sin(t * opts.swaySpeed * 0.7 + 1.3) * opts.sway * 0.5;
    for (const b of bulbs) {
      b.mat.opacity = opts.bulbOpacity * (1 - opts.flicker * 0.5 + opts.flicker * 0.5 * Math.sin(t * opts.flickerSpeed + b.phase));
    }
  };

  const dispose = () => {
    bulbGeo.dispose();
    haloTex.dispose();
    haloMat.dispose();
    wireGeos.forEach((g) => g.dispose());
    wireMats.forEach((m) => m.dispose());
    bulbs.forEach((b) => b.mat.dispose());
  };

  return { group, tick, dispose };
}

// Rebuild the decor / grid / ghost groups from the current props. Cheap — a
// handful of faceted meshes; called on mount + whenever the state changes.
function rebuildProps() {
  if (!scene || !arenaRefs) return;
  if (propGroup) { scene.remove(propGroup); disposeGroup(propGroup); propGroup = null; }
  if (gridGroup) { scene.remove(gridGroup); disposeGroup(gridGroup); gridGroup = null; }
  if (ghostGroup) { scene.remove(ghostGroup); disposeGroup(ghostGroup); ghostGroup = null; }

  propGroup = buildPropSet(props.placements, arenaRefs);
  scene.add(propGroup);

  if (props.arrange) {
    gridGroup = buildSnapGrid(props.gridCells, arenaRefs, props.coreHue);
    scene.add(gridGroup);
    if (props.ghost) {
      ghostGroup = buildGhost(props.ghost.kind, props.ghost, arenaRefs, props.coreHue);
      scene.add(ghostGroup);
    }
  }
}

onMounted(() => {
  const el = wrap.value;
  const w = el.clientWidth || window.innerWidth;
  const h = el.clientHeight || window.innerHeight;

  reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const targetFPS = coarse ? 30 : 60;

  renderer = new THREE.WebGLRenderer({
    canvas: canvasEl.value,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  const maxDPR = lowPowerDevice() ? 1.5 : 2;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDPR));
  renderer.setSize(w, h, false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x070811, 0.03);

  camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
  camera.position.copy(CAM_BASE);

  // Lighting — same recipe as the arena (one warm key from top-front + cool fill).
  const key = new THREE.DirectionalLight(0xfff2e8, 2.3);
  key.position.set(4, 10, 6);
  scene.add(key);
  scene.add(new THREE.AmbientLight(0x2a3550, 0.5));
  scene.add(new THREE.HemisphereLight(0x44506e, 0x05060c, 0.4));

  const pink = getComputedStyle(el).getPropertyValue('--hex-primary').trim() || '#FF0069';

  // --- Slab: reuse buildArena UNMODIFIED, then SUPPRESS the combat rift. The
  //     rift glow + sparks live on refs; zeroing the glow materials' opacity and
  //     hiding the sparks removes the light, and never creating arenaPresence
  //     means nothing pulses them back. Result: the same torn slab, no rift glow.
  arena = buildArena(renderer.capabilities.getMaxAnisotropy(), pink);
  arenaRefs = arena.refs;
  arena.refs.riftGlow.forEach((r) => { r.mat.opacity = 0; });
  arena.refs.sparks.points.visible = false;
  scene.add(arena.group);

  // Kill the bright seam contour on the floor: each plate's `rim` is a THREE.Line
  // tracing its full outline INCLUDING the inner torn edge — the jagged bright
  // line across the slab. It isn't part of riftGlow, so suppress it here (home
  // only, external — the combat arena builds its own slab and is untouched). The
  // two rims are the only Lines in the arena group. Result: one calm solid floor.
  arena.group.traverse((o) => { if (o.isLine) o.visible = false; });

  // Dark seam-filler — occludes the void seen straight down the torn slit so the
  // slab reads as one calm platform (the slit + teeth span ~±0.55 in Z).
  const seam = new THREE.Mesh(
    new THREE.PlaneGeometry(arena.refs.W + 0.2, 1.3),
    new THREE.MeshBasicMaterial({ color: 0x0c1018 }),
  );
  seam.rotation.x = -Math.PI / 2;
  seam.position.set(0, arena.refs.topY - 0.06, 0);
  scene.add(seam);

  // Overhead lamp garland — warm dim string lights filling the empty top of the
  // frame (see GARLAND knobs up top). Atmosphere only: never lights the slab.
  garland = buildGarland(GARLAND, reduced);
  scene.add(garland.group);

  // --- Fighter: ONE idle construct on the slab. No foe (getFoePos → null) → it
  //     idles (buildFighter idlePose path); AI is never enabled. Behaviour is
  //     resolved from the picked core (or core-less default) purely so the build
  //     is core-shaped; it never fights here.
  const behavior = resolveBehavior(props.coreId, []);
  const NAV_MARGIN = 0.5;
  fighter = buildFighter(props.coreHue, {
    side: 'player',
    coreId: props.coreId,
    behavior,
    bounds: { x: arena.refs.W / 2 - NAV_MARGIN, z: arena.refs.totalDepth / 2 - NAV_MARGIN },
    neutralColor: false,
    getFoePos: () => null, // no opponent on the home stage → idle, never steers
  });
  fighter.group.position.set(0, arena.refs.topY, 0.35);
  // Face the core toward the camera (a flattering 3/4 front, since the camera is
  // off-axis). Forward is local -Z; facing dir (dx,dz) ⇒ rotation.y = atan2(-dx,-dz).
  {
    const dx = CAM_BASE.x - fighter.group.position.x;
    const dz = CAM_BASE.z - fighter.group.position.z;
    fighter.group.rotation.y = Math.atan2(-dx, -dz);
  }
  fighter.setReducedMotion(reduced);
  // SUPPRESS the over-head HP plate on the home stage — same external approach as
  // the rift glow above (reach in after build, never touch the combat file). The
  // HP plate is the only Sprite added DIRECTLY to the fighter group (buildFighter
  // attaches hpUI.mesh to group; the core halo is a Sprite nested under torso, so
  // it's untouched). Nothing in fighter.update() re-shows it, so visible=false
  // sticks. In the arena the plate is built/shown as before.
  fighter.group.children.forEach((o) => { if (o.isSprite) o.visible = false; });
  scene.add(fighter.group);

  // --- Free orbit around the FIGHTER (home only — never added to the combat
  //     scene). Mouse: drag = orbit, wheel = zoom. Touch: one-finger drag =
  //     orbit, pinch = zoom (pan disabled). Soft damping.
  controls = new OrbitControls(camera, renderer.domElement);
  // Orbit pivot = the fighter's chest/core so it stays in focus while turning.
  controls.target.set(fighter.group.position.x, arena.refs.topY + 1.1, fighter.group.position.z);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08; // soft, not snappy
  controls.enablePan = false; // pivot stays locked on the fighter
  controls.rotateSpeed = 0.9;
  controls.zoomSpeed = 0.9;
  // Zoom corridor: near enough not to clip into the fighter, far enough that the
  // slab never gets lost in the void.
  controls.minDistance = 3.5;
  controls.maxDistance = 12;
  // Vertical clamp (the safety rail): top = pleasant high 3/4 (NOT straight
  // overhead); bottom stays comfortably above the slab so the camera can never
  // dip under the plate / see the suppressed seam from below. With the target at
  // chest height (~1.6) and maxPolar 1.4 (~80°), the camera y = target.y +
  // d·cos(polar) ≥ ~1.6 + 0.17·d — always well above the slab top (0.5).
  controls.minPolarAngle = 0.3; // ~17° from vertical
  controls.maxPolarAngle = 1.4; // ~80° — just above horizontal, never under
  // Horizontal: full 360° (no azimuth limit — no underside sideways).
  // Gentle intro auto-orbit that hands control to the player on first interaction.
  controls.autoRotate = !reduced;
  controls.autoRotateSpeed = 0.6;
  controls.addEventListener('start', () => { controls.autoRotate = false; });
  controls.update();

  rebuildProps();

  // --- Render loop. FPS-capped; elapsed time drives the idle + the camera sway.
  clock = new THREE.Clock();
  const interval = 1000 / targetFPS;
  let lastFrame = 0;
  const loop = (time) => {
    if (time - lastFrame < interval) return;
    lastFrame = time;
    const t = clock.getElapsedTime();

    controls.update(); // damping + intro auto-orbit (until first interaction)
    fighter?.update(t, camera);
    garland?.tick?.(t); // gentle sway + flicker (null under reduced motion)
    renderer.render(scene, camera);
  };
  renderer.setAnimationLoop(loop);

  onVisibility = () => {
    if (document.hidden) renderer.setAnimationLoop(null);
    else renderer.setAnimationLoop(loop);
  };
  document.addEventListener('visibilitychange', onVisibility);

  resizeObserver = new ResizeObserver(() => {
    const cw = el.clientWidth;
    const ch = el.clientHeight;
    if (!cw || !ch) return;
    camera.aspect = cw / ch;
    camera.updateProjectionMatrix();
    renderer.setSize(cw, ch, false);
  });
  resizeObserver.observe(el);
});

// State changes (empty ↔ lived ↔ arrange, ghost moves) → rebuild decor.
watch(
  () => [props.placements, props.arrange, props.gridCells, props.ghost],
  () => rebuildProps(),
  { deep: true },
);

onBeforeUnmount(() => {
  if (resizeObserver) resizeObserver.disconnect();
  if (onVisibility) document.removeEventListener('visibilitychange', onVisibility);
  if (renderer) renderer.setAnimationLoop(null);
  if (controls) controls.dispose();
  if (propGroup) { scene.remove(propGroup); disposeGroup(propGroup); }
  if (gridGroup) { scene.remove(gridGroup); disposeGroup(gridGroup); }
  if (ghostGroup) { scene.remove(ghostGroup); disposeGroup(ghostGroup); }
  if (garland) { scene.remove(garland.group); garland.dispose(); }
  if (fighter) fighter.dispose();
  if (arena) arena.dispose();
  if (renderer) renderer.dispose();
});
</script>

<style scoped>
.home-scene-wrap {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse 70% 60% at 50% 44%,
    #0d0f1c 0%,
    #07080f 55%,
    #030308 100%
  );
}
.home-scene-canvas {
  display: block;
  width: 100%;
  height: 100%;
}
.home-scene-vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(
    ellipse 78% 78% at 50% 50%,
    transparent 56%,
    rgba(3, 3, 8, 0.55) 100%
  );
}
</style>
