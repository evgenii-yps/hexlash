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

import { onMounted, onBeforeUnmount, computed } from 'vue';
import { useStore } from 'vuex';
import * as THREE from 'three';
import HudFight from '@/components/hud/HudFight.vue';
import { buildFightScene } from '@/scene/scenes/FightScene.js';
import { registerScene, activateScene } from '@/scene/sceneRegistry.js';
import {
  fightState,
  resetFight,
} from '@/components/hud/common/useFightSimulation.js';
import { getFightSetup, clearFightSetup } from '@/scene/interaction/useFightSetup.js';

const store = useStore();

// Sub-epic 4a — pvpState match-meta bindings (Commit 4).
// Round-level state (HP / dice / coach / round log) пока через useFightSimulation.
// Migration к cardFightState bindings — Commit 6 (match start handler).
const matchActive = computed(() => store.getters['pvp/getCurrentMatchId'] !== null);
const displayOpponent = computed(() =>
  matchActive.value
    ? store.getters['pvp/getOpponentInfo']
    : null
);
const pvpFightStatus = computed(() => store.getters['pvp/getPvpFightStatus']);

let fight = null;
let onResize = null;

function handleResize() {
  if (!fight) return;
  fight.camera.aspect = window.innerWidth / window.innerHeight;
  fight.camera.updateProjectionMatrix();
}

// Sub-epic 4a — WS listener scaffold (Commit 3).
// Handlers wired в Commits 5-9 (entry → match start → rounds → coach/dice → fight end).
// Mirrors v1 CardFightView pattern (Phase 0 Q-V5 reference, 11 listeners).
const onPvPFightStart = (e) => {
  console.log('[v2 PvP] fight_start received', e.detail);
  // TODO Commit 6 — wire к cardFightState/initFight + populate pvpState
};
const onPvPRoundResult = (e) => {
  console.log('[v2 PvP] round_result received', e.detail);
  // TODO Commit 7 — wire к cardFightState round transition
};
const onPvPDiceAvailable = (e) => {
  console.log('[v2 PvP] dice_available received', e.detail);
  // TODO Commit 8 — wire к cardFightState diceState.ready
};
const onPvPDiceRolled = (e) => {
  console.log('[v2 PvP] dice_rolled received', e.detail);
  // TODO Commit 8 — wire к cardFightState dice effect application
};
const onPvPDiceError = (e) => {
  console.log('[v2 PvP] dice_error received', e.detail);
  // TODO Commit 8 — wire к UI error feedback (rate-limit / cooldown / no_match)
};
const onPvPCoachPause = (e) => {
  console.log('[v2 PvP] coach_pause received', e.detail);
  // TODO Commit 8 — wire к cardFightState coach pause UI
};
const onPvPCoachResult = (e) => {
  console.log('[v2 PvP] coach_result received', e.detail);
  // TODO Commit 8 — wire к cardFightState coach effect application
};
const onPvPCoachOpponentReady = (e) => {
  console.log('[v2 PvP] coach_opponent_ready received', e.detail);
  // TODO Commit 8 — wire к "waiting for opponent" UI feedback
};
const onPvPFightEnd = (e) => {
  console.log('[v2 PvP] fight_end received', e.detail);
  // TODO Commit 9 — wire к cardFightState finalize + finalists screen
};
const onPvPOverdriveStart = (e) => {
  console.log('[v2 PvP] overdrive_start received', e.detail);
  // TODO Commit 7 — wire к UI overdrive transition
};
const onMatchCancelled = (e) => {
  console.log('[v2 PvP] match-cancelled received', e.detail);
  // TODO Commit 5/9 — wire к ready_timeout UX (navigate to /v2/profile or /v2)
};

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
  //
  // Epic 3Bb Step 10 fix — one-shot consumption. clearFightSetup() right
  // after read so a later direct FD → FIGHT entry doesn't inherit the
  // previous Matchmaking opponent. Rematch on this FightView mount still
  // works because setup already applied to fightState; resetFight leaves
  // name/arch untouched on subsequent round resets.
  //
  // Sub-epic 4a (Commit 4) — branch на pvpState. Live PvP path: read
  // opponentInfo from Vuex pvpState (populated в Commit 5/6 via
  // friend-challenge flow). Mock fallback path remains intact: empty
  // pvpState (currentMatchId === null) → existing fightSetup behavior.
  if (matchActive.value) {
    const opp = store.getters['pvp/getOpponentInfo'];
    // Player 1 vs Player 2 disambiguation finalizes в Commit 6.
    // Self-name source (master.userData.login) wired в Commit 6.
    fightState.leftName  = 'You';
    fightState.leftArch  = '';
    fightState.rightName = opp?.username || 'Opponent';
    fightState.rightArch = opp?.archetype || '';
  } else {
    const setup = getFightSetup();
    clearFightSetup();
    fightState.leftName  = setup.leftName;
    fightState.leftArch  = setup.leftArch;
    fightState.rightName = setup.rightName;
    fightState.rightArch = setup.rightArch;
  }
  onResize = handleResize;
  window.addEventListener('resize', onResize);
  // Sub-epic 4a — register 11 PvP WS event listeners (handlers wired Commits 5-9)
  window.addEventListener('pvp-fight_start',          onPvPFightStart);
  window.addEventListener('pvp-round_result',         onPvPRoundResult);
  window.addEventListener('pvp-dice_available',       onPvPDiceAvailable);
  window.addEventListener('pvp-dice_rolled',          onPvPDiceRolled);
  window.addEventListener('pvp-dice_error',           onPvPDiceError);
  window.addEventListener('pvp-coach_pause',          onPvPCoachPause);
  window.addEventListener('pvp-coach_result',         onPvPCoachResult);
  window.addEventListener('pvp-coach_opponent_ready', onPvPCoachOpponentReady);
  window.addEventListener('pvp-fight_end',            onPvPFightEnd);
  window.addEventListener('pvp-overdrive_start',      onPvPOverdriveStart);
  window.addEventListener('match-cancelled',          onMatchCancelled);
});

onBeforeUnmount(() => {
  if (onResize) {
    window.removeEventListener('resize', onResize);
    onResize = null;
  }
  // Sub-epic 4a — symmetric cleanup of 11 PvP WS listeners
  window.removeEventListener('pvp-fight_start',          onPvPFightStart);
  window.removeEventListener('pvp-round_result',         onPvPRoundResult);
  window.removeEventListener('pvp-dice_available',       onPvPDiceAvailable);
  window.removeEventListener('pvp-dice_rolled',          onPvPDiceRolled);
  window.removeEventListener('pvp-dice_error',           onPvPDiceError);
  window.removeEventListener('pvp-coach_pause',          onPvPCoachPause);
  window.removeEventListener('pvp-coach_result',         onPvPCoachResult);
  window.removeEventListener('pvp-coach_opponent_ready', onPvPCoachOpponentReady);
  window.removeEventListener('pvp-fight_end',            onPvPFightEnd);
  window.removeEventListener('pvp-overdrive_start',      onPvPOverdriveStart);
  window.removeEventListener('match-cancelled',          onMatchCancelled);
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
