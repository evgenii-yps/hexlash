<template>
  <canvas ref="canvasEl" class="canvas-layer" />
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import * as THREE from 'three';

const canvasEl = ref(null);

let renderer = null;
let scene = null;
let camera = null;
let onResize = null;

function setupScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070811);
  scene.fog = new THREE.Fog(0x070811, 5, 25);

  const aspect = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100);
  camera.position.set(0, 2, 8);
  camera.lookAt(0, 1, 0);

  scene.add(new THREE.AmbientLight(0x14141c, 0.4));
  scene.add(new THREE.HemisphereLight(0x1c1820, 0x06060c, 0.3));

  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(20, 0.2, 20),
    new THREE.MeshStandardMaterial({ color: 0x1a1a22, roughness: 0.9 }),
  );
  floor.position.set(0, -0.1, 0);
  scene.add(floor);

  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x12131a,
    roughness: 1.0,
    side: THREE.DoubleSide,
  });
  const wallGeo = new THREE.PlaneGeometry(20, 10);

  const backWall = new THREE.Mesh(wallGeo, wallMaterial);
  backWall.position.set(0, 5, -10);
  scene.add(backWall);

  const frontWall = new THREE.Mesh(wallGeo, wallMaterial);
  frontWall.position.set(0, 5, 10);
  frontWall.rotation.y = Math.PI;
  scene.add(frontWall);

  const leftWall = new THREE.Mesh(wallGeo, wallMaterial);
  leftWall.position.set(-10, 5, 0);
  leftWall.rotation.y = Math.PI / 2;
  scene.add(leftWall);

  const rightWall = new THREE.Mesh(wallGeo, wallMaterial);
  rightWall.position.set(10, 5, 0);
  rightWall.rotation.y = -Math.PI / 2;
  scene.add(rightWall);
}

onMounted(() => {
  renderer = new THREE.WebGLRenderer({
    canvas: canvasEl.value,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  setupScene();

  // Временный render loop — в Шаге 7 заменится на sceneRegistry + renderLoop.
  renderer.setAnimationLoop(() => renderer.render(scene, camera));

  onResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener('resize', onResize);
});

onBeforeUnmount(() => {
  if (onResize) window.removeEventListener('resize', onResize);
  if (renderer) {
    renderer.setAnimationLoop(null);
    renderer.dispose();
    const ctx = renderer.getContext && renderer.getContext();
    if (ctx && renderer.forceContextLoss) renderer.forceContextLoss();
  }
  renderer = null;
  scene = null;
  camera = null;
  onResize = null;
});
</script>

<style scoped>
.canvas-layer {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
  display: block;
}
</style>
