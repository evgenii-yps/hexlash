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
import {
  fightState,
  resetFight,
} from '@/components/hud/common/useFightSimulation.js';
import { getFightSetup } from '@/scene/interaction/useFightSetup.js';

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
  // Step 16 — module-scoped fightState survives across View re-entries.
  // Reset clears pending timers + log + HP, then park at prep so the
  // overlay opens on first paint.
  resetFight();
  fightState.phase = 'prep';
  // Epic 3Bb Step 9 — apply opponent setup from Matchmaking (or defaults
  // when entering directly via FD's FIGHT button / fresh URL). resetFight
  // intentionally does NOT touch leftName/leftArch/rightName/rightArch,
  // so we write them after reset without a field-clash.
  const setup = getFightSetup();
  fightState.leftName  = setup.leftName;
  fightState.leftArch  = setup.leftArch;
  fightState.rightName = setup.rightName;
  fightState.rightArch = setup.rightArch;
  onResize = handleResize;
  window.addEventListener('resize', onResize);
});

onBeforeUnmount(() => {
  if (onResize) {
    window.removeEventListener('resize', onResize);
    onResize = null;
  }
  // Cancel any pending simulation timers BEFORE scene teardown so a late
  // doExchange callback doesn't touch a disposed scene.
  resetFight();
  activateScene('pit');
  if (fight) {
    fight.dispose();
    fight = null;
  }
});
</script>
