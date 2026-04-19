<template>
  <HudFighterDetail :key-prop="validatedKey" />
</template>

<script setup>
// Epic 3A — FighterDetailView.
//
// Architecture (Step 2): lazy scene registration in the View (ТЗ recommendation).
// On mount — build FD scene, registerScene('fd', ...), activateScene('fd').
// On unmount — activateScene('pit') first (so renderLoop stops pointing at this
// scene), then dispose FD resources. Rebuilds fresh on re-entry.
//
// Rationale: matches scene lifecycle to View lifecycle, avoids stale GL context
// across AppV2 remount cycles, keeps CanvasLayer dumb.

import { computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import * as THREE from 'three';
import HudFighterDetail from '@/components/hud/HudFighterDetail.vue';
import { buildFighterDetailScene } from '@/scene/scenes/FighterDetailScene.js';
import { registerScene, activateScene } from '@/scene/sceneRegistry.js';
import { attachFdOrbit } from '@/scene/interaction/fdCameraController.js';
import { getCanvasRef } from '@/scene/interaction/useCanvasRef.js';

const VALID_KEYS = ['warden', 'predator'];

const route = useRoute();
const router = useRouter();

const validatedKey = computed(() => {
  const k = route.params.key;
  return VALID_KEYS.includes(k) ? k : 'warden';
});

function guard(key) {
  if (!VALID_KEYS.includes(key)) router.replace('/v2');
}

let fd = null;
let fdOrbit = null;
let onResize = null;

function handleResize() {
  if (!fd) return;
  fd.camera.aspect = window.innerWidth / window.innerHeight;
  fd.camera.updateProjectionMatrix();
}

onMounted(() => {
  if (!VALID_KEYS.includes(route.params.key)) {
    guard(route.params.key);
    return;
  }
  const aspect = window.innerWidth / window.innerHeight;
  fd = buildFighterDetailScene(THREE, aspect);
  // Step 6 — drag-to-rotate orbit owned by the View (canvas is published by
  // CanvasLayer via useCanvasRef). Attached before registerScene so tick is
  // composed as orbit.tick → scene.tick (orbit must write camera BEFORE any
  // downstream camera consumers).
  const canvas = getCanvasRef();
  if (canvas) fdOrbit = attachFdOrbit(fd.camera, canvas);
  registerScene('fd', {
    scene: fd.scene,
    camera: fd.camera,
    tick: (t) => {
      if (fdOrbit) fdOrbit.tick(t);
      fd.tick(t);
    },
  });
  activateScene('fd');
  // Step 4 — load the fighter model for this route key.
  fd.setKey(validatedKey.value);
  onResize = handleResize;
  window.addEventListener('resize', onResize);
});

onBeforeUnmount(() => {
  if (onResize) {
    window.removeEventListener('resize', onResize);
    onResize = null;
  }
  // Switch back to pit BEFORE disposing, so renderLoop doesn't touch a
  // freed scene on its next tick.
  activateScene('pit');
  if (fdOrbit) {
    fdOrbit.detach();
    fdOrbit = null;
  }
  if (fd) {
    fd.dispose();
    fd = null;
  }
});

// Route-key swap without full unmount (warden ↔ predator direct navigation).
watch(() => route.params.key, (k) => {
  guard(k);
  if (fd && VALID_KEYS.includes(k)) fd.setKey(k);
});
</script>
