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
let lamps = null;
let reduced = false;
// Initial 3/4 camera placement; OrbitControls derives azimuth/polar/distance
// from this + the target (the fighter) on first update().
const CAM_BASE = new THREE.Vector3(4.6, 5.2, 6.7);

function lowPowerDevice() {
  const cores = navigator.hardwareConcurrency || 8;
  const mem = navigator.deviceMemory || 8;
  return cores <= 4 || mem <= 4;
}

// ─────────────────────── Overhead industrial dish lamps ───────────────────────
// Workshop / gym "dish" lamps hanging from the ceiling: a dark low-poly reflector
// (open cone) on a thin vertical rod, a warm amber bulb inside, and — the point
// this time — a REAL warm PointLight per lamp that actually pools onto the slab +
// fighter, so the scene sits in a lit room instead of floating in black.
//
// Discipline frame: the lamp light is warm, soft and DIM — a gentle amber room
// fill. The fighter core stays the ONLY bright accent and the only cold/pink one:
// warm even fill vs. one sharp cold pink point. The fill must never out-bright or
// recolour the core (the core halo is additive/constant, so light can't tint it;
// just keep light.intensity low). All knobs live in LAMPS — tune on preview in one
// place. Default leans DIM (easier to raise than to rescue the discipline). A few
// lamps in a calm spread over the slab — industrial lighting, NOT a garland.
const LAMPS = {
  ceilingY: 7.3, // Y where the rods attach up top — master drop lever (lower ⇒ whole
  //               fixture (rod+shade+bulb+light) slides down as one unit)
  wire: 1.6, // base rod length (ceiling → shade); per-lamp `drop` adds to it
  shadeRadius: 0.55, // reflector opening radius
  shadeHeight: 0.5, // reflector depth
  shadeColor: 0x161a24, // dark matte outer shell (arena family)
  rodColor: 0x0c0f16, // thin hanger rod
  rodRadius: 0.018,
  bulbRadius: 0.12, // warm glowing element inside the shade
  bulbColor: 0xffb368, // warm amber bulb (emissive dot, NOT pink/white)
  bulbOpacity: 0.95,
  light: {
    color: 0xffb368, // warm amber — matches the bulb
    intensity: 16, // DIM by default — raise on preview if the room is too dark
    distance: 18, // falloff radius
    decay: 2, // physical falloff
  },
  // Calm spread over the slab (±3 X, ±2 Z); `drop` staggers hang height a touch.
  positions: [
    { x: -1.9, z: -0.5, drop: 0.0 },
    { x: 1.9, z: 0.5, drop: 0.7 },
    { x: 0.1, z: -1.5, drop: 0.3 },
    { x: -0.3, z: 1.4, drop: 1.0 },
  ],
  flicker: 0.05, // gentle light-intensity wobble (0 = dead steady)
  flickerSpeed: 1.3,
};

// Build the lamps → { group, tick(t)|null, dispose }. reduced ⇒ tick=null (steady
// light, no flicker). Cheap: shared shade/bulb geometry + materials, one PointLight
// per lamp, no shadow maps (pure fill) — fine on mobile.
function buildLamps(opts, reduced) {
  const group = new THREE.Group();
  const shadeGeo = new THREE.ConeGeometry(opts.shadeRadius, opts.shadeHeight, 16, 1, true);
  const bulbGeo = new THREE.SphereGeometry(opts.bulbRadius, 10, 8);
  const shadeMat = new THREE.MeshStandardMaterial({
    color: opts.shadeColor, flatShading: true, roughness: 0.9, metalness: 0.2, side: THREE.DoubleSide,
  });
  const rodMat = new THREE.MeshStandardMaterial({ color: opts.rodColor, roughness: 0.8, metalness: 0.3 });
  const bulbMat = new THREE.MeshBasicMaterial({ color: opts.bulbColor, transparent: true, opacity: opts.bulbOpacity });
  const rodGeos = []; // per-lamp (length varies with drop)
  const lights = []; // { light, base, phase }

  opts.positions.forEach((pos, i) => {
    const shadeTopY = opts.ceilingY - opts.wire - (pos.drop || 0);

    // reflector — cone apex up at shadeTopY, wide opening facing down
    const shade = new THREE.Mesh(shadeGeo, shadeMat);
    shade.position.set(pos.x, shadeTopY - opts.shadeHeight / 2, pos.z);
    group.add(shade);

    // hanger rod — ceiling → shade apex
    const rodLen = opts.ceilingY - shadeTopY;
    const rodGeo = new THREE.CylinderGeometry(opts.rodRadius, opts.rodRadius, rodLen, 6);
    rodGeos.push(rodGeo);
    const rod = new THREE.Mesh(rodGeo, rodMat);
    rod.position.set(pos.x, shadeTopY + rodLen / 2, pos.z);
    group.add(rod);

    // warm bulb inside the shade
    const bulbY = shadeTopY - opts.shadeHeight * 0.55;
    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulb.position.set(pos.x, bulbY, pos.z);
    group.add(bulb);

    // REAL warm light — soft amber pool on the slab + fighter (no shadows = cheap)
    const light = new THREE.PointLight(opts.light.color, opts.light.intensity, opts.light.distance, opts.light.decay);
    light.position.set(pos.x, bulbY - 0.05, pos.z);
    group.add(light);
    lights.push({ light, base: opts.light.intensity, phase: i * 1.7 });
  });

  const tick = reduced ? null : (t) => {
    for (const l of lights) {
      l.light.intensity = l.base * (1 - opts.flicker * 0.5 + opts.flicker * 0.5 * Math.sin(t * opts.flickerSpeed + l.phase));
    }
  };

  const dispose = () => {
    shadeGeo.dispose();
    bulbGeo.dispose();
    shadeMat.dispose();
    rodMat.dispose();
    bulbMat.dispose();
    rodGeos.forEach((g) => g.dispose());
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

  // Overhead industrial dish lamps — warm DIM amber room fill that actually lights
  // the slab + fighter (see LAMPS knobs up top), so the scene isn't floating in
  // black. The core stays the only bright/cold accent; lower light.intensity if it
  // ever competes.
  lamps = buildLamps(LAMPS, reduced);
  scene.add(lamps.group);

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
    lamps?.tick?.(t); // gentle light flicker (null under reduced motion)
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
  if (lamps) { scene.remove(lamps.group); lamps.dispose(); }
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
