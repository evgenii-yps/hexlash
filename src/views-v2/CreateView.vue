<!-- Epic 3Bc — Create view orchestrator.
     Step 1: manual empty scene stub + route wiring.
     Step 2: replaced by buildCreateScene (fog/camera/floor/walls).
     Steps 3-10 populate lighting, podium, holo fighter, archetype glow,
     HUD wiring, name panel, confirm, materialize. -->
<template>
  <div class="create-view">
    <HudCreate @back="onBack" />
    <div ref="flashRef" class="materialize-flash"></div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { useRouter } from 'vue-router';
import * as THREE from 'three';
import {
  registerScene,
  unregisterScene,
  activateScene,
} from '@/scene/sceneRegistry.js';
import { buildCreateScene } from '@/scene/scenes/CreateScene.js';
import HudCreate from '@/components/hud/HudCreate.vue';

const router = useRouter();
const flashRef = ref(null);

let sceneApi = null;
let onResize = null;

function handleResize() {
  if (!sceneApi) return;
  sceneApi.camera.aspect = window.innerWidth / window.innerHeight;
  sceneApi.camera.updateProjectionMatrix();
}

function onBack() {
  router.push('/v2');
}

function onKeydown(e) {
  if (e.key === 'Escape') onBack();
}

onMounted(() => {
  const aspect = window.innerWidth / window.innerHeight;
  sceneApi = buildCreateScene(THREE, aspect);
  // Step 1 registered a plain empty scene under 'create'. Step 2
  // registerScene(Map.set) overwrites that entry with the real scaffold —
  // no collision, no transition wiring needed.
  registerScene('create', {
    scene: sceneApi.scene,
    camera: sceneApi.camera,
    tick: sceneApi.tick,
  });
  activateScene('create');
  onResize = handleResize;
  window.addEventListener('resize', onResize);
  window.addEventListener('keydown', onKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
  if (onResize) {
    window.removeEventListener('resize', onResize);
    onResize = null;
  }
  // Teardown ordering mirrors 3Ba/3Bb: switch back to pit BEFORE
  // unregistering so renderLoop never ticks a disposed scene.
  activateScene('pit');
  unregisterScene('create');
  if (sceneApi) {
    sceneApi.dispose();
    sceneApi = null;
  }
});
</script>

<style scoped>
.create-view {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 50;
}
</style>
