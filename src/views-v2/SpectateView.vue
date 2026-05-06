<!-- Sub-Epic 5N — Spectate Flag (Path α Mock Port).
     v2 view orchestrator for /v2/spectate/:fightId. HUD-only mount —
     deliberately does NOT register a 3D scene. Whatever scene was active
     prior (profile / pit / etc) stays as the visual backdrop, behind the
     HUD overlay. CanvasLayer's onMounted fallback (`if (!getActiveScene())
     activateScene('pit')`) covers direct-URL access.

     Sub-Epic 6 C7 — extend lifecycle с WS subscribe/unsubscribe:
     - onMounted: SpectateJoinMsg dispatch + 9 window event listener registration
     - onBeforeUnmount: SpectateLeaveMsg dispatch + 9 listener cleanup
     - Stub handlers (console.debug + TODO) — C9 wires real state binding logic
     - 5N Esc handler preserved (no override)
     - 6th subsection #2 occurrence — matchId from route.params (deterministic),
       NO self-anchored derivation (spectator is third-party). -->
<template>
  <div class="spectate-view">
    <HudSpectate />
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import HudSpectate from '@/components/hud/HudSpectate.vue';
import {
  resetSpectateState,
  onSpectateRoundResult       as onSpectateRoundResultMutation,
  onSpectateDiceRolled        as onSpectateDiceRolledMutation,
  onSpectateDiceAvailable     as onSpectateDiceAvailableMutation,
  onSpectateCoachPause        as onSpectateCoachPauseMutation,
  onSpectateCoachResult       as onSpectateCoachResultMutation,
  onSpectateFightEnd          as onSpectateFightEndMutation,
  onSpectateOverdriveStart    as onSpectateOverdriveStartMutation,
  onSpectateFightStateResume  as onSpectateFightStateResumeMutation,
  onSpectatorListUpdate       as onSpectatorListUpdateMutation,
} from '@/scene/interaction/useSpectateState.js';

const store = useStore();
const route = useRoute();
const router = useRouter();

// 5N Esc handler — preserved verbatim
function onKeyDown(e) {
  if (e.key === 'Escape') {
    const btn = document.querySelector('.spectate-hud .sp-back');
    if (btn) btn.click();
  }
}

// Sub-epic 6 C9 — WS event handlers. Each unwraps CustomEvent.detail and
// delegates к useSpectateState composable mutation function (mirror Sub-epic 5
// MatchmakingView / useMatchmakingState pattern). HudSpectate template binds
// reactive state from composable.
function onSpectateRoundResult(e)       { onSpectateRoundResultMutation(e.detail); }
function onSpectateDiceRolled(e)        { onSpectateDiceRolledMutation(e.detail); }
function onSpectateDiceAvailable(e)     { onSpectateDiceAvailableMutation(e.detail); }
function onSpectateCoachPause(e)        { onSpectateCoachPauseMutation(e.detail); }
function onSpectateCoachResult(e)       { onSpectateCoachResultMutation(e.detail); }
function onSpectateFightEnd(e)          { onSpectateFightEndMutation(e.detail); }
function onSpectateOverdriveStart(e)    { onSpectateOverdriveStartMutation(e.detail); }
function onSpectateFightStateResume(e)  { onSpectateFightStateResumeMutation(e.detail); }
function onSpectatorListUpdate(e)       { onSpectatorListUpdateMutation(e.detail); }

// Sub-epic 6 C11 — defensive match-cancelled handler (Q8.2 race guard).
// Mirrors FightView onMatchCancelled pattern (FightView.vue:334-338) — if
// active match cancelled while spectating (mid-spectate disconnect race,
// timeout, etc), redirect spectator к /v2 hub с info toast.
//
// 6th subsection #2 occurrence — no self-anchored derivation, neutral
// 'Match ended' message regardless of spectator perspective.
function onMatchCancelled(_e) {
  store.commit('master/setInfoMessage', { text: 'Match ended', timeout: 3000 });
  router.push('/v2');
}

onMounted(() => {
  // Sub-epic 6 C11 — fightId validation guard. Defensive: undefined/empty
  // route.params.fightId means malformed URL — toast + redirect /v2 immediately.
  // Without this guard, spectator stuck on placeholder UI без feedback (C7
  // had `if (fightId)` guard но silently no-op on missing param).
  const fightId = route.params.fightId;
  if (!fightId || typeof fightId !== 'string') {
    store.commit('master/setInfoMessage', { text: 'Invalid spectate URL', timeout: 3000 });
    router.push('/v2');
    return;
  }

  // Sub-epic 6 C9 — fresh spectate session: reset shared composable state
  // (mirror Sub-epic 5 MatchmakingView / resetMmState pattern). Prevents
  // cross-session leakage on remount.
  resetSpectateState();

  // 5N Esc handler
  window.addEventListener('keydown', onKeyDown);

  // Sub-epic 6 C7 — register 8 PvP WS event listeners + 1 spectator metadata listener (9 total).
  // Event names use 'pvp-{messageType}' convention (underscore suffix preserved per Sub-epic 4a/4b
  // precedent — webSocketState.js line 190 dispatches 'pvp-' + messageType verbatim).
  window.addEventListener('pvp-round_result',       onSpectateRoundResult);
  window.addEventListener('pvp-dice_rolled',        onSpectateDiceRolled);
  window.addEventListener('pvp-dice_available',     onSpectateDiceAvailable);
  window.addEventListener('pvp-coach_pause',        onSpectateCoachPause);
  window.addEventListener('pvp-coach_result',       onSpectateCoachResult);
  window.addEventListener('pvp-fight_end',          onSpectateFightEnd);
  window.addEventListener('pvp-overdrive_start',    onSpectateOverdriveStart);
  window.addEventListener('pvp-fight_state_resume', onSpectateFightStateResume);
  window.addEventListener('spectator-list-update',  onSpectatorListUpdate);
  window.addEventListener('match-cancelled',        onMatchCancelled); // Sub-epic 6 C11

  // Sub-epic 6 C7 — dispatch SpectateJoinMsg. matchId from route param (deterministic,
  // 6th subsection #2 occurrence — no self-anchored derivation для spectator-as-third-party).
  // BE handler (C4) will respond с initial fight_state_resume snapshot + SpectatorListMsg
  // broadcast. Auth failures emit ErrorMsg (carry-over #31 awareness — FE parser shape
  // mismatch deferred к Sub-epic 7). C11 fightId validation guard above ensures non-empty.
  store.dispatch('webSocket/sendMessage', { type: 'SpectateJoinMsg', matchId: fightId });
});

onBeforeUnmount(() => {
  // 5N Esc handler
  window.removeEventListener('keydown', onKeyDown);

  // Sub-epic 6 C7 — symmetric cleanup of 9 listeners (mirrors Sub-epic 5 MatchmakingView
  // discipline + Sub-epic 4a/4b FightView precedent).
  window.removeEventListener('pvp-round_result',       onSpectateRoundResult);
  window.removeEventListener('pvp-dice_rolled',        onSpectateDiceRolled);
  window.removeEventListener('pvp-dice_available',     onSpectateDiceAvailable);
  window.removeEventListener('pvp-coach_pause',        onSpectateCoachPause);
  window.removeEventListener('pvp-coach_result',       onSpectateCoachResult);
  window.removeEventListener('pvp-fight_end',          onSpectateFightEnd);
  window.removeEventListener('pvp-overdrive_start',    onSpectateOverdriveStart);
  window.removeEventListener('pvp-fight_state_resume', onSpectateFightStateResume);
  window.removeEventListener('spectator-list-update',  onSpectatorListUpdate);
  window.removeEventListener('match-cancelled',        onMatchCancelled); // Sub-epic 6 C11

  // Sub-epic 6 C7 — dispatch SpectateLeaveMsg. NO matchId payload (BE resolves via
  // session state per C4 — mirror MatchmakingCancelMsg server-state derivation pattern).
  // Silent on WS-already-closed (sendMessage internal). Race-tolerant.
  store.dispatch('webSocket/sendMessage', { type: 'SpectateLeaveMsg' });
});
</script>

<style scoped>
.spectate-view {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
</style>
