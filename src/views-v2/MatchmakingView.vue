<!-- Sub-epic 5 — Matchmaking view orchestrator. Real BE wiring landing across
     C4-C12:
     C4 ✓ MatchmakingStartMsg dispatch + searchTime timer + captain pre-check
     C5 ✓ 4 window event listeners (match-found / queue-update / cancelled / timeout)
     C6 ✓ match-found handler → pvp/SET_PVP_MATCH → phase='found'
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
import { useStore } from 'vuex';
import * as THREE from 'three';
import {
  registerScene,
  unregisterScene,
  activateScene,
} from '@/scene/sceneRegistry.js';
import { buildMatchmakingScene } from '@/scene/scenes/MatchmakingScene.js';
import {
  mmState,
  resetMmState,
  enterFoundPhase,
  enterTimeoutPhase,
} from '@/scene/interaction/useMatchmakingState.js';
import { InfoMessageModel } from '@/core/models/internal/infoMessageModel.js';
import HudMatchmaking from '@/components/hud/HudMatchmaking.vue';

const router = useRouter();
const store = useStore();

let sceneApi = null;
let onResize = null;
let searchTimer = null;
// Sub-epic 5 C4 — track whether MatchmakingStartMsg was successfully
// dispatched, so onBeforeUnmount only sends Cancel if we're still in queue.
// (Pre-check failure path returns before dispatch — no Cancel needed.)
let queueDispatched = false;

function handleResize() {
  if (!sceneApi) return;
  sceneApi.camera.aspect = window.innerWidth / window.innerHeight;
  sceneApi.camera.updateProjectionMatrix();
}

function dispatchMatchmakingCancel() {
  if (!queueDispatched) return;
  store.dispatch('webSocket/sendMessage', { type: 'MatchmakingCancelMsg' });
  queueDispatched = false;
}

function stopSearchTimer() {
  if (searchTimer) {
    clearInterval(searchTimer);
    searchTimer = null;
  }
}

function onBack() {
  dispatchMatchmakingCancel();
  stopSearchTimer();
  router.push('/v2');
}

function onCancel() {
  // C12 will add localCancelPending flag for race Q8.1 handling.
  dispatchMatchmakingCancel();
  stopSearchTimer();
  router.push('/v2');
}

function onKeydown(e) {
  if (e.key === 'Escape') onBack();
}

// Sub-epic 5 C5 — WS event listeners (named refs for proper removeEventListener).
// Event names verbatim from webSocketState.js:164-175 routing chain (Phase 0 Q1.1).

function onQueueUpdate(e) {
  // BE→FE MatchmakingQueueMsg → { queueSize: number }
  mmState.queueSize = e.detail?.queueSize || 0;
}

function onMatchFound(e) {
  // BE→FE MatchFoundMsg → { matchId, opponent: { odId, username, rating, skin, avatarUrl } }
  // C5 stashes raw data + stops searchTimer. C6 commits pvp/SET_PVP_MATCH +
  // transitions phase к 'found'. C8 will initialise countdown timer +
  // navigate to /v2/fight on countdown=0.
  if (!e.detail) return;
  mmState.matchData = {
    matchId: e.detail.matchId,
    opponent: e.detail.opponent,
  };
  stopSearchTimer();
  // Sub-epic 5 C6 — pvp/SET_PVP_MATCH commit. isPlayer1: false placeholder
  // per Phase 0 Subsection 6 + carry-over #16 reclassification: MatchFoundMsg
  // payload contains ONLY opponent data, NOT both player1/player2 odIds —
  // cannot derive isP1 here. BE pvp-fight_start emit (later, after both
  // players send pvp_ready) carries authoritative player1.odId / player2.odId;
  // FightView.vue:64-67 (onPvPFightStart, Sub-epic 4a) derives isP1 from
  // there + re-commits via overwrite cascade. DO NOT replace placeholder
  // с derivation logic — symmetric pairing means we cannot tell from
  // MatchFoundMsg alone if we're p1 or p2.
  store.commit('pvp/SET_PVP_MATCH', {
    matchId: e.detail.matchId,
    opponent: e.detail.opponent,
    isPlayer1: false,
  });
  enterFoundPhase();
  // queueDispatched stays true до C12 manages flag для race Q8.1. Cancel
  // still safely no-op'able during pre-pvp_ready window (BE removed user
  // from queue at match creation per matchmaking.js:115-116; Cancel msg
  // is harmless redundancy).
}

function onMatchmakingCancelled() {
  // BE→FE MatchmakingCancelledMsg ack — local cleanup already done by
  // dispatchMatchmakingCancel call site (onCancel/onBack/onBeforeUnmount).
  // C12 may extend для race Q8.1 handling.
  queueDispatched = false;
}

function onMatchmakingTimeout() {
  // BE→FE matchmaking_timeout → { reason: 'search_timeout' }. BE has already
  // removed user from queue (matchmaking.js:60). Stop local timer + transition
  // phase. C7 fills .mm-timeout template content (retry/back UI).
  stopSearchTimer();
  queueDispatched = false;
  enterTimeoutPhase();
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
  onResize = handleResize;
  window.addEventListener('resize', onResize);
  window.addEventListener('keydown', onKeydown);

  // Sub-epic 5 C5 — register 4 BE matchmaking event listeners. Named function
  // refs (NOT anonymous arrows) for proper removeEventListener в onBeforeUnmount.
  window.addEventListener('matchmaking-queue-update', onQueueUpdate);
  window.addEventListener('matchmaking-match-found',  onMatchFound);
  window.addEventListener('matchmaking-cancelled',    onMatchmakingCancelled);
  window.addEventListener('matchmaking-timeout',      onMatchmakingTimeout);

  // Sub-epic 5 C4 — captain pre-check guard (audit decision per carry-over #5
  // option c: minimal local fix, не affects ErrorMsg flow elsewhere).
  // Avoids trip к BE NO_CAPTAIN_SET path entirely.
  const captain = store.getters['agent/currentCaptain'];
  if (!captain) {
    store.commit(
      'master/setInfoMessage',
      InfoMessageModel.withTimeout('No Captain set. Create a fighter first.', 3000),
    );
    router.replace('/v2');
    return;
  }

  // Sub-epic 5 C4 — MatchmakingStartMsg dispatch.
  // Mirror v1 pattern (MatchmakingView.vue:226-237) с captain-authoritative
  // ELO + skin (BE ignores client rating per Phase 0 Q3.2 — uses captain.elo).
  // Field name `username` matches BE handler field expectation
  // (handler.js:618: `username: captain.name || username || 'Player'`).
  // FE-side getter is userData.name (UserModel field, not 'username').
  const masterData = store.getters['master/getMaster'];
  store.dispatch('webSocket/sendMessage', {
    type: 'MatchmakingStartMsg',
    matchmakingRequest: {
      username: captain.name || masterData?.userData?.name || 'Player',
      rating: captain.elo,
      skin: captain.skin || masterData?.userData?.skin || null,
      avatarUrl: masterData?.userData?.avatarUrl || null,
    },
  });
  queueDispatched = true;

  // Sub-epic 5 C4 — searchTime timer (1s tick). C6/C7 will stop on phase
  // transition к 'found'/'timeout'; this commit only stops on cancel/unmount.
  searchTimer = setInterval(() => {
    mmState.searchTime += 1;
  }, 1000);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
  // Sub-epic 5 C5 — unregister BE matchmaking listeners (mirror onMounted).
  window.removeEventListener('matchmaking-queue-update', onQueueUpdate);
  window.removeEventListener('matchmaking-match-found',  onMatchFound);
  window.removeEventListener('matchmaking-cancelled',    onMatchmakingCancelled);
  window.removeEventListener('matchmaking-timeout',      onMatchmakingTimeout);
  if (onResize) {
    window.removeEventListener('resize', onResize);
    onResize = null;
  }
  // Sub-epic 5 C4 — defensive cleanup: if user navigates away без onCancel
  // (e.g. Esc → onBack already cleaned), these are no-ops.
  dispatchMatchmakingCancel();
  stopSearchTimer();
  // Reset shared reactive state so a re-entry starts clean.
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
