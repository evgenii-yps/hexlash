<!-- Sub-epic 5 — Matchmaking view orchestrator. Real BE wiring landing across
     C4-C12:
     C4 ✓ MatchmakingStartMsg dispatch + searchTime timer + captain pre-check
     C5 ✓ 4 window event listeners (match-found / queue-update / cancelled / timeout)
     C6 ✓ match-found handler → pvp/SET_PVP_MATCH → phase='found'
     C7 ✓ timeout handler + retry/back wiring + DRY startMatchmakingSearch helper
     C8 ✓ 3-second countdown post-match-found + VS display + navigate /v2/fight (carry-over #17)
     C9 ✓ search timer + queue size display
     C10 ✓ online players count REST fetch + display
     C11 ✓ double-queue FE redirect guard
     C12 — race Q8.1 cancel-during-pair handling
-->
<template>
  <div class="matchmaking-view">
    <HudMatchmaking
      @back="onBack"
      @cancel="onCancel"
      @retry="onRetry"
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
  enterSearchPhase,
  enterFoundPhase,
  enterTimeoutPhase,
} from '@/scene/interaction/useMatchmakingState.js';
import { InfoMessageModel } from '@/core/models/internal/infoMessageModel.js';
import { getOnlinePlayersCount } from '@/core/services/statsService.js';
import HudMatchmaking from '@/components/hud/HudMatchmaking.vue';

const router = useRouter();
const store = useStore();

let sceneApi = null;
let onResize = null;
let searchTimer = null;
// Sub-epic 5 C8 — countdown timer (3-2-1) post-match-found, navigates к
// /v2/fight on countdown=0. Module-scope mirror searchTimer pattern.
let countdownTimer = null;
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

// Sub-epic 5 C8 — countdown timer cleanup (countdown=0 navigate path uses
// it inline; cancel/back/unmount paths use this helper для idempotent stop).
function stopCountdownTimer() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
}

// Sub-epic 5 C8 — cancel-during-countdown defensive cleanup. Resets pvp Vuex
// state committed by C6 onMatchFound. NOT called on countdown=0 path (FightView
// reads pvp/getCurrentMatchId !== null to enter PvP mode per Phase 0 Q9.3 —
// resetting pre-navigate would break matchActive computed).
function resetPvpState() {
  store.commit('pvp/RESET_PVP_FIGHT');
}

function onBack() {
  dispatchMatchmakingCancel();
  stopSearchTimer();
  stopCountdownTimer();
  resetPvpState();
  router.push('/v2');
}

function onCancel() {
  // C12 will add localCancelPending flag for race Q8.1 handling.
  dispatchMatchmakingCancel();
  stopSearchTimer();
  stopCountdownTimer();
  resetPvpState();
  router.push('/v2');
}

function onKeydown(e) {
  if (e.key === 'Escape') onBack();
}

// Sub-epic 5 C7 — DRY helper extraction. Used by onMounted (initial entry) +
// onRetry (timeout-phase retry button). Captain pre-check guard mirrors C4
// audit decision (carry-over #5 option c — minimal local fix, avoids trip к
// BE NO_CAPTAIN_SET error path). Returns false on pre-check fail (caller
// already redirected via router.replace + toast); true on dispatch success.
function startMatchmakingSearch() {
  const captain = store.getters['agent/currentCaptain'];
  if (!captain) {
    store.commit(
      'master/setInfoMessage',
      InfoMessageModel.withTimeout('No Captain set. Create a fighter first.', 3000),
    );
    router.replace('/v2');
    return false;
  }

  // MatchmakingStartMsg dispatch — mirror v1 pattern (MatchmakingView.vue:226-237)
  // с captain-authoritative ELO + skin (BE ignores client rating per Phase 0
  // Q3.2 — uses captain.elo). Field name `username` matches BE handler
  // expectation (handler.js:618). FE-side getter is userData.name (UserModel
  // field, NOT 'username' per Lesson #11 catch).
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

  // searchTime timer (1s tick). Stopped on cancel/unmount/match-found/timeout
  // (5 stopSearchTimer call sites). Idempotent — safe to call after onRetry
  // even if previous searchTimer cleared.
  searchTimer = setInterval(() => {
    mmState.searchTime += 1;
  }, 1000);
  return true;
}

// Sub-epic 5 C7 — retry handler from .mm-timeout retry button.
// Re-dispatches MatchmakingStartMsg + transitions phase к 'searching' + restarts
// timer. Defensive stopSearchTimer call (C5 onMatchmakingTimeout already cleared
// — idempotent re-clear safe).
function onRetry() {
  stopSearchTimer();
  enterSearchPhase();
  startMatchmakingSearch();
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

  // Sub-epic 5 C8 — 3-second countdown (carry-over #17 closure). 3 → 0 ticks
  // 1Hz; on 0 navigate to /v2/fight where matchActive (pvp/getCurrentMatchId
  // !== null per Phase 0 Q9.3) gates PvP mode. Phase 0 S5 chose 3s over v1's
  // 5s for tighter UX + visual parity с BE COUNTDOWN_MS=3000 (pvpCombatEngine
  // start delay between fight_start emit and round 1).
  mmState.countdown = 3;
  countdownTimer = setInterval(() => {
    mmState.countdown -= 1;
    if (mmState.countdown <= 0) {
      stopCountdownTimer();
      router.push('/v2/fight');
    }
  }, 1000);

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
  // Sub-epic 5 C11 — double-queue FE redirect guard (Phase 0 Q8.3).
  // If user already в active PvP match (e.g. opens new tab/window during
  // fight), skip matchmaking entry entirely + redirect к /v2/fight where
  // existing FightView matchActive computed gates PvP mode. router.replace
  // (NOT push) prevents back-button returning to matchmaking.
  // Guard placed BEFORE scene setup — cheaper если redirect fires (no
  // buildMatchmakingScene allocation, no scene/listener registration).
  // onBeforeUnmount cleanup safe on uninitialized state — all ops no-op
  // на null sceneApi/searchTimer/countdownTimer/onResize, browser-tolerant
  // на never-added removeEventListener calls.
  if (store.getters['pvp/getCurrentMatchId'] !== null) {
    router.replace('/v2/fight');
    return;
  }

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

  // Sub-epic 5 C10 — online players count REST fetch (single mount fetch,
  // public endpoint /v1/stats/online per Phase 0 Q4.4). Fire-and-forget
  // Promise pattern: doesn't block dispatch path; resolves to mmState
  // reactive update whenever response arrives. v1 polled every 10s; v2
  // single-fetch on mount per ТЗ scope. Cross-phase persistence (preserved
  // by enterSearchPhase per C1 design) — onRetry path doesn't refetch.
  getOnlinePlayersCount().then(n => { mmState.onlineCount = n; });

  // Sub-epic 5 C4+C7 — start search via shared helper (captain pre-check
  // guard + MatchmakingStartMsg dispatch + searchTime timer). Helper is
  // also called from onRetry (timeout retry path).
  startMatchmakingSearch();
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
  // Sub-epic 5 C4+C8 — defensive cleanup: if user navigates away без onCancel
  // (e.g. Esc → onBack already cleaned), these are no-ops. Countdown timer
  // must clear here too (countdown=0 path navigates → unmount → idempotent
  // clear). NO pvp/RESET_PVP_FIGHT here — countdown=0 navigates к /v2/fight
  // и FightView needs matchId persisted (Phase 0 Q9.3).
  dispatchMatchmakingCancel();
  stopSearchTimer();
  stopCountdownTimer();
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
