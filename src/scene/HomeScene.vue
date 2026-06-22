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

let renderer, scene, camera, arena, fighter, resizeObserver, clock;
let onVisibility;
let propGroup = null;
let gridGroup = null;
let ghostGroup = null;
let arenaRefs = null;
let reduced = false;
// Fixed camera base + look target; the sway is a small offset on top.
const CAM_BASE = new THREE.Vector3(4.6, 5.2, 6.7);
const CAM_LOOK = new THREE.Vector3(0, 1.05, 0.15);

function lowPowerDevice() {
  const cores = navigator.hardwareConcurrency || 8;
  const mem = navigator.deviceMemory || 8;
  return cores <= 4 || mem <= 4;
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
  camera.lookAt(CAM_LOOK);

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

  // Dark seam-filler — occludes the void seen straight down the torn slit so the
  // slab reads as one calm platform (the slit + teeth span ~±0.55 in Z).
  const seam = new THREE.Mesh(
    new THREE.PlaneGeometry(arena.refs.W + 0.2, 1.3),
    new THREE.MeshBasicMaterial({ color: 0x0c1018 }),
  );
  seam.rotation.x = -Math.PI / 2;
  seam.position.set(0, arena.refs.topY - 0.06, 0);
  scene.add(seam);

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
  scene.add(fighter.group);

  rebuildProps();

  // --- Render loop. FPS-capped; elapsed time drives the idle + the camera sway.
  clock = new THREE.Clock();
  const interval = 1000 / targetFPS;
  let lastFrame = 0;
  const loop = (time) => {
    if (time - lastFrame < interval) return;
    lastFrame = time;
    const t = clock.getElapsedTime();

    // Gentle fixed-camera sway (no orbit / no manual control). Off under reduced motion.
    if (!reduced) {
      camera.position.set(
        CAM_BASE.x + Math.sin(t * 0.16) * 0.22,
        CAM_BASE.y + Math.sin(t * 0.11) * 0.10,
        CAM_BASE.z + Math.cos(t * 0.13) * 0.16,
      );
    } else {
      camera.position.copy(CAM_BASE);
    }
    camera.lookAt(CAM_LOOK);

    fighter?.update(t, camera);
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
  if (propGroup) { scene.remove(propGroup); disposeGroup(propGroup); }
  if (gridGroup) { scene.remove(gridGroup); disposeGroup(gridGroup); }
  if (ghostGroup) { scene.remove(ghostGroup); disposeGroup(ghostGroup); }
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
