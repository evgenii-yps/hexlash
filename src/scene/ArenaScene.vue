<!-- ArenaScene — Three.js arena platform, the foundation for future combat.
     Renders a thick slab floating in dark void; orbit-drag + zoom, default
     3/4 top view. No fighters, no HUD, no combat logic (separate stage). -->
<template>
  <div ref="wrap" class="arena-wrap">
    <canvas ref="canvasEl" class="arena-canvas" />
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildArena } from './buildArena.js';

const wrap = ref(null);
const canvasEl = ref(null);

let renderer, scene, camera, controls, arena, resizeObserver;

onMounted(() => {
  const el = wrap.value;
  const w = el.clientWidth || window.innerWidth;
  const h = el.clientHeight || window.innerHeight;

  // Renderer — transparent so the CSS void gradient shows behind the WebGL.
  renderer = new THREE.WebGLRenderer({
    canvas: canvasEl.value,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // cap for mobile
  renderer.setSize(w, h, false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene = new THREE.Scene();

  // Camera — perspective, 3/4 view from above (~56° tilt from vertical).
  camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
  camera.position.set(5.5, 6.2, 7.5);

  // Lighting — one key directional from top-front (top face bright, sides
  // dark, sharp face boundaries via flat shading) + a low cool fill so the
  // side faces don't crush to pure black.
  const key = new THREE.DirectionalLight(0xfff2e8, 2.3);
  key.position.set(4, 10, 6);
  scene.add(key);

  scene.add(new THREE.AmbientLight(0x2a3550, 0.55));
  scene.add(new THREE.HemisphereLight(0x44506e, 0x05060c, 0.4));

  // Arena platform.
  arena = buildArena();
  scene.add(arena.group);

  // Orbit controls — drag to rotate, wheel / pinch to zoom; centred, no pan.
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.2, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 6;
  controls.maxDistance = 18;
  controls.minPolarAngle = 0.25; // keep some top-down headroom
  controls.maxPolarAngle = 1.45; // ~83°, never dip under the slab
  controls.update();

  renderer.setAnimationLoop(() => {
    controls.update();
    renderer.render(scene, camera);
  });

  // Responsive to the actual container box (works embedded + on resize/rotate).
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

onBeforeUnmount(() => {
  if (resizeObserver) resizeObserver.disconnect();
  if (renderer) renderer.setAnimationLoop(null);
  if (controls) controls.dispose();
  if (arena) arena.dispose();
  if (renderer) renderer.dispose();
});
</script>

<style scoped>
.arena-wrap {
  position: fixed;
  inset: 0;
  /* Near-black void with a faint radial lift toward the slab. */
  background: radial-gradient(
    ellipse 70% 60% at 50% 42%,
    #0d0f1c 0%,
    #070811 55%,
    #030308 100%
  );
}
.arena-canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
