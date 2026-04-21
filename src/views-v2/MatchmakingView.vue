<!-- Epic 3Bb Step 2 — Matchmaking view orchestrator.
     Lazy scene registration pattern from Epic 3A/3Ba. HUD + filter wiring
     + typeLog + results phase arrive in Steps 5-9. -->
<template>
  <div class="matchmaking-view">
    <HudMatchmaking
      @back="onBack"
      @cancel="onCancel"
      @rescan="onRescan"
      @fight="onFight"
      @elo-change="onEloChange"
    />
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import * as THREE from 'three';
import {
  registerScene,
  unregisterScene,
  activateScene,
} from '@/scene/sceneRegistry.js';
import { buildMatchmakingScene } from '@/scene/scenes/MatchmakingScene.js';
import {
  refreshScreen,
  startSearchLogAnimation,
} from '@/scene/interaction/useMatchmakingScreen.js';
import HudMatchmaking from '@/components/hud/HudMatchmaking.vue';

const router = useRouter();

let sceneApi = null;
let animHandle = null;
let onResize = null;

function handleResize() {
  if (!sceneApi) return;
  sceneApi.camera.aspect = window.innerWidth / window.innerHeight;
  sceneApi.camera.updateProjectionMatrix();
}

function onBack() {
  router.push('/v2');
}

// Step 6 placeholders — real wiring in Steps 7-9.
function onCancel() {
  router.push('/v2');
}
// eslint-disable-next-line no-unused-vars
function onRescan() {
  // Step 7 — enterSearchPhase + restart typeLog.
}
// eslint-disable-next-line no-unused-vars
function onFight() {
  // Step 9 — setFightSetup + router.push('/v2/fight').
}
// eslint-disable-next-line no-unused-vars
function onEloChange(value) {
  // Step 7 — mmState.eloDelta = value + refreshScreen via watcher.
}

function onKeydown(e) {
  if (e.key === 'Escape') onBack();
}

onMounted(() => {
  const aspect = window.innerWidth / window.innerHeight;
  sceneApi = buildMatchmakingScene(THREE, aspect);
  registerScene('matchmaking', {
    scene: sceneApi.scene,
    camera: sceneApi.camera,
    tick: sceneApi.tick,
  });
  activateScene('matchmaking');
  // Step 5 — draw CRT once with empty state, then start typeLog animation.
  refreshScreen(sceneApi.screenCtx, sceneApi.screenTex);
  animHandle = startSearchLogAnimation(
    sceneApi.screenCtx,
    sceneApi.screenTex,
    () => {
      // Step 8 will replace this with generateCandidates + enterResultsPhase.
      // eslint-disable-next-line no-console
      console.log('[MM] typeLog complete — Step 8 will transition to results');
    },
  );
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
  // Cancel pending typeLog timers first — otherwise they mutate mmState
  // / push to screenCtx after scene teardown.
  if (animHandle) {
    animHandle.cancel();
    animHandle = null;
  }
  // Switch back to pit BEFORE disposing, so renderLoop doesn't touch a
  // freed scene on its next tick.
  activateScene('pit');
  unregisterScene('matchmaking');
  if (sceneApi) {
    sceneApi.dispose();
    sceneApi = null;
  }
});
</script>

<style scoped>
.matchmaking-view {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 50;
}
</style>
