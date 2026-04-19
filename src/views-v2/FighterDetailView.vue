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
  registerScene('fd', {
    scene: fd.scene,
    camera: fd.camera,
    tick: fd.tick,
  });
  activateScene('fd');
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
  if (fd) {
    fd.dispose();
    fd = null;
  }
});

watch(() => route.params.key, guard);
</script>
