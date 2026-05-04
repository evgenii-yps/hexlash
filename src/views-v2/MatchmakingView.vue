<!-- Sub-epic 5 C2 — Matchmaking view orchestrator (mock-flow gutted).
     Mock files (mmCandidatesMock + useMatchmakingScreen) deleted; CRT typeLog
     animation + candidate generation removed. Real BE wiring lands в C4-C12:
     C4 — MatchmakingStartMsg dispatch + searchTime timer
     C5 — 4 window event listeners (match-found / queue-update / cancelled / timeout)
     C6 — match-found handler → pvp/SET_PVP_MATCH → phase='found'
     C7 — timeout handler + retry/back wiring
     C8 — 3-second countdown post-match-found
     C9 — search timer + queue size display
     C10 — online players REST poll
     C11 — double-queue FE redirect guard
     C12 — race Q8.1 cancel-during-pair handling
-->
<template>
  <div class="matchmaking-view">
    <HudMatchmaking
      @back="onBack"
      @cancel="onCancel"
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
  resetMmState,
} from '@/scene/interaction/useMatchmakingState.js';
import HudMatchmaking from '@/components/hud/HudMatchmaking.vue';

const router = useRouter();

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

function onCancel() {
  // Sub-epic 5 C2 — stub. C4 will dispatch MatchmakingCancelMsg via WS,
  // C12 will add localCancelPending flag for race Q8.1 handling.
  router.push('/v2');
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
  resetMmState();
  // C4 will add: MatchmakingStartMsg dispatch + searchTime setInterval
  // C5 will add: 4 window event listeners (matchmaking-*)
  // C10 will add: getOnlinePlayersCount REST fetch + repoll
  // C11 will add: pvp/getCurrentMatchId double-queue guard
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
  // C4 will add: clearInterval(searchTimer) + dispatch MatchmakingCancelMsg
  // C5 will add: remove 4 window event listeners
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
