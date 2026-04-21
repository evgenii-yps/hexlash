<!-- Epic 3Bc Step 1 — Create view stub.
     Lazy scene registration pattern from 3Ba/3Bb. Real scene binding and
     materialize wiring land in Steps 2-10. -->
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
import HudCreate from '@/components/hud/HudCreate.vue';

const router = useRouter();
const flashRef = ref(null);

let emptyScene = null;
let emptyCamera = null;

function onBack() {
  router.push('/v2');
}

function onKeydown(e) {
  if (e.key === 'Escape') onBack();
}

onMounted(() => {
  // Step 1 hot-fix — without an active scene under 'create', the renderer
  // keeps drawing pit (autoClear=true clears the buffer, but pit is then
  // re-rendered every frame because getActiveScene() still returns it).
  // Register a placeholder scene so /v2/create shows a clean dark canvas.
  // Step 2 replaces this entry via registerScene(Map.set) — same id, no
  // collision, no Step 1 → Step 2 transition wiring needed.
  emptyScene = new THREE.Scene();
  emptyScene.background = new THREE.Color(0x070811);
  emptyCamera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    100,
  );
  registerScene('create', { scene: emptyScene, camera: emptyCamera });
  activateScene('create');

  window.addEventListener('keydown', onKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
  // Switch back to pit BEFORE clearing the entry — symmetric to 3Ba/3Bb
  // unmount ordering. unregisterScene also nulls activeId if it was the
  // active one, so activateScene('pit') first guarantees the pit ref.
  activateScene('pit');
  unregisterScene('create');
  emptyScene = null;
  emptyCamera = null;
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
