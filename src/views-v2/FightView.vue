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
import { useRouter } from 'vue-router';
import * as THREE from 'three';
import HudFight from '@/components/hud/HudFight.vue';
import { buildFightScene } from '@/scene/scenes/FightScene.js';
import { registerScene, activateScene } from '@/scene/sceneRegistry.js';
import {
  fightState,
  resetFight,
} from '@/components/hud/common/useFightSimulation.js';
import { logFight, clearFightLog } from '@/components/hud/common/useFightLog.js';
import { triggerFlash } from '@/components/hud/common/useFlashHit.js';
import { getFightSetup, clearFightSetup } from '@/scene/interaction/useFightSetup.js';
import { DICE_COOLDOWN_ROUNDS } from '@/core/constants.js';

const store = useStore();
const router = useRouter();

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

// Sub-epic 4a Commit 6a — captain + self-name bindings.
// Captain source for pvp_ready emit (deck + modules) per v1 canonical
// pattern (Lesson #32 mirror). userLogin replaces 'You' placeholder
// from Commit 4 — accessed via master/getMaster.userData.login (no
// dedicated master/userData getter in masterState — see Q-V finding).
const captain = computed(() => store.getters['agent/currentCaptain']);
const userLogin = computed(() => store.getters['master/getMaster']?.userData?.login);

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
  const data = e.detail;
  // Derive isP1 — corrects ChallengeNotification's hardcoded false (carry-over #16
  // dead-write, addressed via overwrite cascade per audit Finding 3).
  const myId = store.getters['master/getMaster']?.userData?.id;
  const isP1 = data.player1?.odId === myId;
  const oppData = isP1 ? data.player2 : data.player1;
  store.commit('pvp/SET_PVP_MATCH', {
    matchId: data.matchId,
    opponent: oppData,
    isPlayer1: isP1,
  });
  // v2 visual transition: PrepOverlay dismisses, fight screen shows.
  // Module-scoped fightState (HUD bindings, NOT Vuex cardFightState which is
  // PvE-only per audit Finding 1). Round 1 HP hydrates via pvp-round_result
  // (Commit 7).
  fightState.phase    = 'fight';
  fightState.leftHp   = 100;
  fightState.rightHp  = 100;
};
const onPvPRoundResult = (e) => {
  const data = e.detail;
  const isP1 = store.getters['pvp/getIsPlayer1'];

  // Map server data к my perspective (left = self, right = opponent)
  const myData  = isP1 ? data.player1 : data.player2;
  const oppData = isP1 ? data.player2 : data.player1;

  // BE-authoritative HP + round (module-scoped per Commit 6b precedent)
  fightState.leftHp  = myData.hp;
  fightState.rightHp = oppData.hp;
  fightState.round   = data.round;

  // B3 (#26): active effect badges — populate from BE-truth myData.effects array.
  // Effect shape: { type: 'adrenaline'|'shield'|'blind'|..., roundsLeft: N }
  // (per pvpCombatEngine.js:388/410). Display only adrenaline/shield/blind in v2;
  // heal/rage/crit/overdrive are per-hit triggers (handled by FLASH_COLORS map).
  const myEffectTypes = (myData.effects || []).map(e => e.type);
  fightState.activeEffects.adrenaline = myEffectTypes.includes('adrenaline');
  fightState.activeEffects.shield = myEffectTypes.includes('shield');
  fightState.activeEffects.blind = myEffectTypes.includes('blind');

  // Hit-flash if any damage
  if (myData.damage > 0 || oppData.damage > 0) {
    triggerFlash();
  }

  // Self attack — actor-warden colored (position-based per HudFight CSS taxonomy)
  if (myData.damage > 0) {
    logFight(
      '<span class="lt">R' + data.round + '</span> dealt <strong>' + myData.damage + '</strong> dmg',
      'actor-warden' + (myData.critted ? ' crit' : '')
    );
  }
  // Opponent attack — actor-predator colored
  if (oppData.damage > 0) {
    logFight(
      '<span class="lt">R' + data.round + '</span> took <strong>' + oppData.damage + '</strong> dmg',
      'actor-predator' + (oppData.critted ? ' crit' : '')
    );
  }
  // Dodges — miss class on attacker side (mirrors mock pattern)
  if (oppData.dodged) {
    logFight(
      '<span class="lt">R' + data.round + '</span> attack — opponent slipped',
      'actor-warden miss'
    );
  }
  if (myData.dodged) {
    logFight(
      '<span class="lt">R' + data.round + '</span> opponent attack — you slipped',
      'actor-predator miss'
    );
  }
};
const onPvPDiceAvailable = (e) => {
  fightState.diceReady = true;
  fightState.diceActiveType = null;
};
const onPvPDiceRolled = (e) => {
  const data = e.detail;
  if (!data?.effect) return;
  fightState.diceReady = false;
  fightState.diceActiveType = data.effect.type;
  // BE-authoritative HP updates (instant heal / rage / crit)
  if (typeof data.hp === 'number') fightState.leftHp = data.hp;
  if (typeof data.oppHp === 'number') fightState.rightHp = data.oppHp;
  triggerFlash();
  logFight('Dice: <strong>' + data.effect.type.toUpperCase() + '</strong>', 'round');
};
const onPvPDiceError = (e) => {
  const msg = e.detail?.message || 'dice_on_cooldown';
  logFight('Dice unavailable (' + msg + ')', 'actor-predator miss');
  fightState.diceReady = false;
  // Mirror v1 — re-enable after 2s grace period
  setTimeout(() => {
    if (store.getters['pvp/getCurrentMatchId']) {
      fightState.diceReady = true;
    }
  }, 2000);
};
const onPvPCoachPause = (e) => {
  fightState.coachPauseOpen = true;
  fightState.coachPauseText = 'Coach pause — pick your advice (10s)';
};
const onPvPCoachResult = (e) => {
  const data = e.detail;
  const isP1 = store.getters['pvp/getIsPlayer1'];
  const myResult = isP1 ? data.player1 : data.player2;
  fightState.coachPauseOpen = false;
  fightState.coachPauseText = '';
  if (myResult?.action) {
    logFight('Coach: <strong>' + myResult.action + '</strong>.', 'round');
  }
};
const onPvPCoachOpponentReady = (e) => {
  if (fightState.coachPauseOpen) {
    fightState.coachPauseText = 'Opponent ready. Waiting...';
  }
};
const onPvPFightEnd = (e) => {
  const data = e.detail;
  const myId = store.getters['master/getMaster']?.userData?.id;
  const isP1 = store.getters['pvp/getIsPlayer1'];

  // BE-authoritative final HPs
  if (data.player1 && data.player2) {
    fightState.leftHp  = isP1 ? data.player1.finalHp : data.player2.finalHp;
    fightState.rightHp = isP1 ? data.player2.finalHp : data.player1.finalHp;
  }

  // Result type derivation (mirror v1 logic). Sub-epic 4b: existing winner+myId
  // logic correctly handles surrender (loser sees winner=opponent.odId → 'lose';
  // winner sees winner=myId → 'win') and match_timeout (winner='draw' → 'draw').
  let resultType;
  if (data.reason === 'opponent_disconnected') {
    resultType = 'win';
  } else if (data.winner === 'draw') {
    resultType = 'draw';
  } else if (data.winner === myId) {
    resultType = 'win';
  } else {
    resultType = 'lose';
  }

  // Sub-epic 4b — extended summary text branches per reason. Refactored from
  // nested ternary к if/else for clarity (3+ reasons per result type now).
  // English-only per 6B-3a/5N convention (i18n deferred).
  let resultSummary;
  if (resultType === 'win') {
    if (data.reason === 'opponent_disconnected') resultSummary = 'Opponent disconnected.';
    else if (data.reason === 'opponent_surrendered') resultSummary = 'Opponent surrendered.';
    else resultSummary = 'Victory!';
  } else if (resultType === 'lose') {
    if (data.reason === 'surrender') resultSummary = 'You surrendered.';
    else resultSummary = 'Defeated.';
  } else {
    if (data.reason === 'match_timeout') resultSummary = 'Match ended (time limit).';
    else resultSummary = 'Match drawn.';
  }

  // ResultOverlay binding (existing component reuse — Lesson #32 minimal touch)
  fightState.resultWon = (resultType === 'win');
  fightState.resultSummary = resultSummary;
  fightState.phase = 'result';

  // Update pvp Vuex stats (existing action)
  store.dispatch('pvp/finishPvPFight', resultType);
};
const onPvPOverdriveStart = (e) => {
  triggerFlash();
  logFight('<strong>OVERDRIVE</strong>', 'round');
};
// Sub-epic 4b — handler for fight_state_resume event emitted by BE on reconnect.
// Hydrates module-scoped fightState from in-memory snapshot (Option α minimal —
// no DB persistence). Snapshot fields per C4 enumeration: maxRounds (NOT
// totalRounds), no maxHp (FE constant), diceUsedRound (raw — derive cooldown),
// status='paused_coach' indicates pause (NOT separate pausedFor field),
// pendingChoices object tracks coach-pause-internal state.
const onFightStateResume = (e) => {
  const snapshot = e.detail;
  if (!snapshot) return;

  // Defensive: don't hydrate finished match (FE already received fight_end)
  if (snapshot.status === 'finished') return;

  // Defensive: don't go backwards from result phase
  if (fightState.phase === 'result') return;

  // Defensive race guard: stale snapshot (lower currentRound than fightState
  // already reached) — could happen if pvp-round_result arrived before
  // fight_state_resume during reconnect window. Don't overwrite newer state.
  if (typeof snapshot.currentRound === 'number' && snapshot.currentRound < fightState.round) return;

  const isP1 = store.getters['pvp/getIsPlayer1'];
  const myPlayer  = isP1 ? snapshot.player1 : snapshot.player2;
  const oppPlayer = isP1 ? snapshot.player2 : snapshot.player1;

  // BE-authoritative HP hydration. leftMaxHp/rightMaxHp persist (MAX_HP global
  // constant doesn't change mid-fight).
  if (myPlayer && typeof myPlayer.hp === 'number') fightState.leftHp = myPlayer.hp;
  if (oppPlayer && typeof oppPlayer.hp === 'number') fightState.rightHp = oppPlayer.hp;

  // Round counter
  if (typeof snapshot.currentRound === 'number') fightState.round = snapshot.currentRound;
  if (typeof snapshot.maxRounds === 'number') fightState.totalRounds = snapshot.maxRounds;

  // Dice cooldown derivation (BE doesn't ship diceCooldownRemaining — C4 catch).
  // diceUsedRound initialized к -DICE_COOLDOWN_ROUNDS so dice available round 1.
  // Available если (currentRound - diceUsedRound) >= DICE_COOLDOWN_ROUNDS.
  if (myPlayer && typeof myPlayer.diceUsedRound === 'number') {
    fightState.diceReady = (snapshot.currentRound - myPlayer.diceUsedRound) >= DICE_COOLDOWN_ROUNDS;
  }
  // Active dice effect type is transient (set via dice_rolled, not stored in
  // engine state) — clear on reconnect. If effect still active, FE waits для
  // next round_result для re-render.
  fightState.diceActiveType = null;

  // Phase recovery
  if (snapshot.status === 'paused_coach') {
    if (fightState.phase === 'prep') fightState.phase = 'fight';
    fightState.coachPauseOpen = true;
    // Coach pause text: derive from pendingChoices state (mirror existing
    // onPvPCoachPause / onPvPCoachOpponentReady text values).
    const myChoice  = isP1 ? snapshot.pendingChoices?.player1 : snapshot.pendingChoices?.player2;
    const oppChoice = isP1 ? snapshot.pendingChoices?.player2 : snapshot.pendingChoices?.player1;
    if (myChoice?.action) {
      fightState.coachPauseText = 'Waiting for opponent...';
    } else if (oppChoice?.action) {
      fightState.coachPauseText = 'Opponent ready. Waiting...';
    } else {
      fightState.coachPauseText = 'Coach pause — pick your advice (10s)';
    }
  } else {
    // 'running' state (or 'waiting' edge case)
    if (fightState.phase === 'prep') fightState.phase = 'fight';
    fightState.coachPauseOpen = false;
    fightState.coachPauseText = '';
  }

  // Round log replay — mirror onPvPRoundResult per-round logFight pattern
  // (lines 100-127). Clear current log первым, then replay each round entry.
  if (Array.isArray(snapshot.roundResults) && snapshot.roundResults.length > 0) {
    clearFightLog();
    for (const round of snapshot.roundResults) {
      // Skip rounds with errors (e.g. invalid_move per pvpCombatEngine.js:221)
      if (round.error) continue;
      const myData  = isP1 ? round.player1 : round.player2;
      const oppData = isP1 ? round.player2 : round.player1;

      // Self attack — actor-warden colored
      if (myData?.damage > 0) {
        logFight(
          '<span class="lt">R' + round.round + '</span> dealt <strong>' + myData.damage + '</strong> dmg',
          'actor-warden' + (myData.critted ? ' crit' : '')
        );
      }
      // Opponent attack — actor-predator colored
      if (oppData?.damage > 0) {
        logFight(
          '<span class="lt">R' + round.round + '</span> took <strong>' + oppData.damage + '</strong> dmg',
          'actor-predator' + (oppData.critted ? ' crit' : '')
        );
      }
      // Dodges
      if (oppData?.dodged) {
        logFight(
          '<span class="lt">R' + round.round + '</span> attack — opponent slipped',
          'actor-warden miss'
        );
      }
      if (myData?.dodged) {
        logFight(
          '<span class="lt">R' + round.round + '</span> opponent attack — you slipped',
          'actor-predator miss'
        );
      }
    }
  }
};
const onMatchCancelled = (e) => {
  store.commit('pvp/RESET_PVP_FIGHT');
  store.commit('master/setInfoMessage', { text: 'Match cancelled', timeout: 3000 });
  router.push('/v2');
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
    // Sub-epic 4a Commit 6a — userLogin replaces 'You' placeholder.
    // Player 1 vs Player 2 isP1 disambiguation lives в pvp/SET_PVP_MATCH
    // commits (ChallengeNotification + Commit 6b onPvPFightStart).
    fightState.leftName  = userLogin.value || 'You';
    fightState.leftArch  = '';
    fightState.rightName = opp?.username || 'Opponent';
    fightState.rightArch = opp?.archetype || '';

    // Sub-epic 4a Commit 6a — emit pvp_ready (mirror v1 CardFightView
    // pvp_ready pattern verbatim per Lesson #32). BE pvpHandler awaits
    // both sides ready → match.start() → fight_start broadcast (Commit 6b
    // wires onPvPFightStart handler).
    const cap = captain.value;
    if (cap) {
      const captainProg = cap.progression || {};
      const captainDeck = Array.isArray(captainProg.deck) ? captainProg.deck : [];
      const captainMoves = Array.isArray(captainProg.moves) ? captainProg.moves : [];
      const captainModules = [cap.primaryModule, cap.secondaryModule, cap.tertiaryModule].filter(Boolean);
      const moveLevelMap = {};
      for (const m of captainMoves) { if (m.moveId) moveLevelMap[m.moveId] = m.level || 1; }
      store.dispatch('webSocket/sendMessage', {
        type: 'pvp_ready',
        matchId: store.getters['pvp/getCurrentMatchId'],
        deck: captainDeck.map(id => ({ id, level: moveLevelMap[id] || 1 })),
        modules: captainModules,
      });
    }
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
  window.addEventListener('pvp-fight_state_resume',   onFightStateResume);
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
  window.removeEventListener('pvp-fight_state_resume',   onFightStateResume);
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
