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
import { useRoute } from 'vue-router';
import HudSpectate from '@/components/hud/HudSpectate.vue';

const store = useStore();
const route = useRoute();

// 5N Esc handler — preserved verbatim
function onKeyDown(e) {
  if (e.key === 'Escape') {
    const btn = document.querySelector('.spectate-hud .sp-back');
    if (btn) btn.click();
  }
}

// Sub-epic 6 C7 — stub WS event handlers. Bodies replaced с real state binding
// в C9 (HudSpectate state hydration via shared composable, mirror FightView /
// useFightSimulation pattern). Stubs preserved for traceability + listener
// idempotency verification.
function onSpectateRoundResult(e)       { console.debug('[SPECTATE] round_result',       e.detail); /* TODO C9 */ }
function onSpectateDiceRolled(e)        { console.debug('[SPECTATE] dice_rolled',        e.detail); /* TODO C9 */ }
function onSpectateDiceAvailable(e)     { console.debug('[SPECTATE] dice_available',     e.detail); /* TODO C9 */ }
function onSpectateCoachPause(e)        { console.debug('[SPECTATE] coach_pause',        e.detail); /* TODO C9 */ }
function onSpectateCoachResult(e)       { console.debug('[SPECTATE] coach_result',       e.detail); /* TODO C9 */ }
function onSpectateFightEnd(e)          { console.debug('[SPECTATE] fight_end',          e.detail); /* TODO C9 */ }
function onSpectateOverdriveStart(e)    { console.debug('[SPECTATE] overdrive_start',    e.detail); /* TODO C9 */ }
function onSpectateFightStateResume(e)  { console.debug('[SPECTATE] fight_state_resume', e.detail); /* TODO C9 (reuse 4b pattern) */ }
function onSpectatorListUpdate(e)       { console.debug('[SPECTATE] spectator-list-update', e.detail); /* TODO C9 */ }

onMounted(() => {
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

  // Sub-epic 6 C7 — dispatch SpectateJoinMsg. matchId from route param (deterministic,
  // 6th subsection #2 occurrence — no self-anchored derivation для spectator-as-third-party).
  // BE handler (C4) will respond с initial fight_state_resume snapshot + SpectatorListMsg
  // broadcast. Auth failures emit ErrorMsg (carry-over #31 awareness — FE parser shape
  // mismatch deferred к Sub-epic 7).
  const fightId = route.params.fightId;
  if (fightId) {
    store.dispatch('webSocket/sendMessage', { type: 'SpectateJoinMsg', matchId: fightId });
  }
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
