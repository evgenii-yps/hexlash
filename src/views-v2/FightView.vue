<template>
  <HudFight />
</template>

<script setup>
// Epic 3A — FightView.
//
// Architecture symmetric to FighterDetailView: lazy scene registration on
// mount, dispose on unmount, per-View resize handler. CanvasLayer owns the
// renderer, scene is bound through sceneRegistry. Fight scene has no orbit
// in Step 9 — camera is static (pit-mode lerp lands in Step 13).

import { onMounted, onBeforeUnmount } from 'vue';
import * as THREE from 'three';
import HudFight from '@/components/hud/HudFight.vue';
import { buildFightScene } from '@/scene/scenes/FightScene.js';
import { registerScene, activateScene } from '@/scene/sceneRegistry.js';

let fight = null;
let onResize = null;

function handleResize() {
  if (!fight) return;
  fight.camera.aspect = window.innerWidth / window.innerHeight;
  fight.camera.updateProjectionMatrix();
}

onMounted(() => {
  const aspect = window.innerWidth / window.innerHeight;
  fight = buildFightScene(THREE, aspect);
  // Fight registers without picker/getIsDragging/hoverScale/labels — no
  // clickable 3D objects on this scene. CanvasLayer's pointer handlers
  // early-return on missing picker.
  registerScene('fight', {
    scene: fight.scene,
    camera: fight.camera,
    tick: fight.tick,
  });
  activateScene('fight');
  onResize = handleResize;
  window.addEventListener('resize', onResize);
});

onBeforeUnmount(() => {
  if (onResize) {
    window.removeEventListener('resize', onResize);
    onResize = null;
  }
  activateScene('pit');
  if (fight) {
    fight.dispose();
    fight = null;
  }
});
</script>
