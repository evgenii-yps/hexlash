// v2 Migration — единый render loop для всех сцен.
// THREE передаётся параметром, чтобы не было дублирующего импорта.

import { tickAll, getActiveScene } from './sceneRegistry.js';

let renderer = null;
let clock = null;
let running = false;

export function startRenderLoop(r, THREE) {
  renderer = r;
  clock = new THREE.Clock();
  running = true;
  renderer.setAnimationLoop(tick);
}

function tick() {
  if (!running) return;
  const t = clock.getElapsedTime();
  tickAll(t);
  const active = getActiveScene();
  if (active) renderer.render(active.scene, active.camera);
}

export function stopRenderLoop() {
  running = false;
  if (renderer) renderer.setAnimationLoop(null);
}
