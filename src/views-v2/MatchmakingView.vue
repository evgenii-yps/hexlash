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
import { onMounted, onBeforeUnmount, watch } from 'vue';
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
import {
  mmState,
  resetMmState,
  enterSearchPhase,
  enterResultsPhase,
} from '@/scene/interaction/useMatchmakingState.js';
import { generateCandidates } from '@/scene/interaction/mmCandidatesMock.js';
import HudMatchmaking from '@/components/hud/HudMatchmaking.vue';

const router = useRouter();

let sceneApi = null;
let animHandle = null;
let resultsTimer = null;
let onResize = null;

function handleResize() {
  if (!sceneApi) return;
  sceneApi.camera.aspect = window.innerWidth / window.innerHeight;
  sceneApi.camera.updateProjectionMatrix();
}

function onBack() {
  router.push('/v2');
}

// Step 7 — search lifecycle. startSearch() is reused by onMounted and
// onRescan, so cancel + enterSearchPhase + new animation all happen in
// one place.
function startSearch() {
  if (!sceneApi) return;
  if (animHandle) animHandle.cancel();
  if (resultsTimer) {
    clearTimeout(resultsTimer);
    resultsTimer = null;
  }
  enterSearchPhase();
  animHandle = startSearchLogAnimation(
    sceneApi.screenCtx,
    sceneApi.screenTex,
    onSearchComplete,
  );
}

// Step 8 — typeLog completes → generate candidates, paint summary line
// on the CRT, pause 600ms so the user reads it, then flip the HUD to
// the results phase. Matches prototype 10727-10731 ordering.
function onSearchComplete() {
  if (!sceneApi) return;
  if (mmState.phase !== 'search') return;
  const candidates = generateCandidates(mmState);
  mmState.candidates = candidates;
  mmState.searchLog.unshift(
    '> ' + candidates.length + ' candidates matched. ready.',
  );
  refreshScreen(sceneApi.screenCtx, sceneApi.screenTex);
  resultsTimer = setTimeout(() => {
    resultsTimer = null;
    if (mmState.phase !== 'search') return;
    enterResultsPhase();
  }, 600);
}

function onCancel() {
  if (animHandle) {
    animHandle.cancel();
    animHandle = null;
  }
  if (resultsTimer) {
    clearTimeout(resultsTimer);
    resultsTimer = null;
  }
  router.push('/v2');
}

function onRescan() {
  startSearch();
}

// eslint-disable-next-line no-unused-vars
function onFight() {
  // Step 9 — setFightSetup + router.push('/v2/fight').
}

function onEloChange(value) {
  mmState.eloDelta = value;
  // Watcher below picks it up and repaints the CRT filters line.
}

function onKeydown(e) {
  if (e.key === 'Escape') onBack();
}

// Step 7 — refreshScreen whenever any filter changes so the CRT line
// stays in sync with the HUD. Primitive fields, no deep watch needed.
watch(
  () => [mmState.eloDelta, mmState.archFilter, mmState.beltFilter],
  () => {
    if (sceneApi) refreshScreen(sceneApi.screenCtx, sceneApi.screenTex);
  },
);

onMounted(() => {
  const aspect = window.innerWidth / window.innerHeight;
  sceneApi = buildMatchmakingScene(THREE, aspect);
  registerScene('matchmaking', {
    scene: sceneApi.scene,
    camera: sceneApi.camera,
    tick: sceneApi.tick,
  });
  activateScene('matchmaking');
  // Step 7 — session enters with a clean slate + first typeLog pass.
  resetMmState();
  refreshScreen(sceneApi.screenCtx, sceneApi.screenTex);
  startSearch();
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
  // / push to screenCtx after scene teardown. resultsTimer is the 600ms
  // between CRT summary and phase flip; also freed here.
  if (animHandle) {
    animHandle.cancel();
    animHandle = null;
  }
  if (resultsTimer) {
    clearTimeout(resultsTimer);
    resultsTimer = null;
  }
  // Reset shared reactive state so a re-entry starts clean (matches
  // Training's resetTrainingState pattern).
  resetMmState();
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
