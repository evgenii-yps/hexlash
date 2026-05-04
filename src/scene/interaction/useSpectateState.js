// Sub-epic 6 C9 — Spectator state composable.
//
// Mirrors Sub-epic 5 useMatchmakingState pattern (reactive state + handler
// functions + reset). Provides shared module-scoped state для SpectateView
// (listener wiring) + HudSpectate (template binding).
//
// 6th subsection #2 occurrence formal application:
// - Spectator-as-third-party: NEITHER player1 NOR player2
// - Field naming: player1Hp/player2Hp (BE-truth deterministic)
//   NOT friendHp/opponentHp (5N mock self-anchored convention dropped)
// - Result derivation: 'player1' | 'player2' | 'draw' (no VICTORY/DEFEAT —
//   no spectator self-perspective)
// - Side derivation в log entries: rollerId / playerOdId disambig fields
//   (per C3 spectator-only payload additions) compared с player1OdId/
//   player2OdId stable identities (set on fight_state_resume)
// - Carry-over #16 reflex preventive: NO isPlayer1-similar boolean
//   derivation в spectator code paths
//
// SCOPE NOTE — getStateSnapshot username gap (C9 surface):
// Sub-epic 4b getStateSnapshot does NOT include username/skin on
// player1/player2 — only odId/hp/activeEffects/diceUsedRound/coachTriggered.
// Spectator FE shows placeholder "Player 1"/"Player 2" until fight_end
// event delivers username. C9.5 (BE-only mini-commit, mirror C4.5 precedent)
// candidate to extend getStateSnapshot — flagged for design-Claude.

import { reactive, computed } from 'vue';

const MAX_HP = 100;
const MAX_ROUNDS = 10;

export const spectateState = reactive({
  // Identities — populated on fight_state_resume (C9.5 candidate adds username)
  player1Name: 'Player 1',
  player2Name: 'Player 2',
  player1OdId: null,
  player2OdId: null,

  // Fight progress
  player1Hp: MAX_HP,
  player2Hp: MAX_HP,
  currentRound: 0,
  maxRounds: MAX_ROUNDS,
  maxHp: MAX_HP, // exposed for template

  // Fight log — entries: { round, side, actor, move, damage, critical }
  // side ∈ 'player1' | 'player2' | 'system' (overdrive / coach metadata)
  fightLog: [],

  // Result
  fightOver: false,
  winner: null, // 'player1' | 'player2' | 'draw' | null

  // Spectator metadata
  spectatorCount: 0,
});

export const player1HpPct = computed(() => Math.max(0, (spectateState.player1Hp / MAX_HP) * 100));
export const player2HpPct = computed(() => Math.max(0, (spectateState.player2Hp / MAX_HP) * 100));

// ── Helpers ───────────────────────────────────────────────────────────────

function deriveSideFromOdId(odId) {
  if (!odId) return 'system';
  if (odId === spectateState.player1OdId) return 'player1';
  if (odId === spectateState.player2OdId) return 'player2';
  return 'system'; // unknown — defensive
}

function appendLog(entry) {
  spectateState.fightLog.push(entry);
}

// ── WS event handlers ─────────────────────────────────────────────────────

// pvp-round_result payload (per C3): { round, isOverdrive, firstAttacker,
//   player1: {module, damage, hp, effects, dodged, critted}, player2: ... }
export function onSpectateRoundResult(detail) {
  if (!detail || typeof detail.round !== 'number') return;

  spectateState.currentRound = detail.round;

  if (detail.player1) {
    if (typeof detail.player1.hp === 'number') spectateState.player1Hp = detail.player1.hp;
    appendLog({
      round: detail.round,
      side: 'player1',
      actor: spectateState.player1Name,
      move: detail.player1.module?.name || 'Attack',
      damage: detail.player1.damage || 0,
      critical: detail.player1.critted || false,
    });
  }
  if (detail.player2) {
    if (typeof detail.player2.hp === 'number') spectateState.player2Hp = detail.player2.hp;
    appendLog({
      round: detail.round,
      side: 'player2',
      actor: spectateState.player2Name,
      move: detail.player2.module?.name || 'Attack',
      damage: detail.player2.damage || 0,
      critical: detail.player2.critted || false,
    });
  }
}

// pvp-dice_rolled payload (C3 spectator-only): { effect, hp, oppHp?, killed?, rollerId }
// rollerId disambig field added by C3 spread — preserves Path B-min spirit.
export function onSpectateDiceRolled(detail) {
  if (!detail || !detail.rollerId) return;

  const side = deriveSideFromOdId(detail.rollerId);
  const actorName = side === 'player1'
    ? spectateState.player1Name
    : (side === 'player2' ? spectateState.player2Name : 'Unknown');

  appendLog({
    round: spectateState.currentRound,
    side,
    actor: actorName,
    move: `Dice: ${detail.effect?.type || 'roll'}`,
    damage: 0,
    critical: false,
  });

  // Update HP if instant-damage effect (rage / crit) per C3 oppHp field
  if (typeof detail.oppHp === 'number') {
    if (side === 'player1') spectateState.player2Hp = detail.oppHp;
    else if (side === 'player2') spectateState.player1Hp = detail.oppHp;
  }
}

// pvp-dice_available — minimal (no template indicator); skip log noise.
// C9.5+ polish candidate — could add dice indicator UI.
export function onSpectateDiceAvailable(_detail) { /* no-op для C9 closure scope */ }

// pvp-coach_pause payload: { round, timeLimit }. Spectator UI: log entry only
// (no read-only overlay в HudSpectate template — defer к polish).
export function onSpectateCoachPause(detail) {
  if (!detail) return;
  appendLog({
    round: detail.round || spectateState.currentRound,
    side: 'system',
    actor: 'Coach',
    move: 'Pause',
    damage: 0,
    critical: false,
  });
}

// pvp-coach_result payload: { player1: {action}, player2: {action} }
export function onSpectateCoachResult(detail) {
  if (!detail) return;
  const p1Action = detail.player1?.action || 'none';
  const p2Action = detail.player2?.action || 'none';
  appendLog({
    round: spectateState.currentRound,
    side: 'system',
    actor: 'Coach',
    move: `P1:${p1Action} / P2:${p2Action}`,
    damage: 0,
    critical: false,
  });
}

// pvp-fight_end payload (per C3 neutral form for spectators): { matchId, winner,
//   rounds, xp, player1: {odId, username, finalHp}, player2: {...}, roundLog?, reason? }
// winner = 'draw' | <player1.odId> | <player2.odId>
export function onSpectateFightEnd(detail) {
  if (!detail) return;

  spectateState.fightOver = true;

  // Player names — fight_end DOES include username (C9.5 candidate would also
  // add to fight_state_resume для earlier name display).
  if (detail.player1?.username) spectateState.player1Name = detail.player1.username;
  if (detail.player2?.username) spectateState.player2Name = detail.player2.username;

  // Final HP
  if (typeof detail.player1?.finalHp === 'number') spectateState.player1Hp = detail.player1.finalHp;
  if (typeof detail.player2?.finalHp === 'number') spectateState.player2Hp = detail.player2.finalHp;

  // Winner derivation: deterministic via odId match (NOT self-anchored)
  if (detail.winner === 'draw') {
    spectateState.winner = 'draw';
  } else if (detail.winner === spectateState.player1OdId || detail.winner === detail.player1?.odId) {
    spectateState.winner = 'player1';
  } else if (detail.winner === spectateState.player2OdId || detail.winner === detail.player2?.odId) {
    spectateState.winner = 'player2';
  } else {
    spectateState.winner = 'draw'; // defensive — unknown winner treated as draw
  }
}

// pvp-overdrive_start payload: { round }
export function onSpectateOverdriveStart(detail) {
  appendLog({
    round: detail?.round || spectateState.currentRound,
    side: 'system',
    actor: 'OVERDRIVE',
    move: `Round ${detail?.round || spectateState.currentRound}`,
    damage: 0,
    critical: false,
  });
}

// pvp-fight_state_resume — late-join state hydration. Snapshot fields per
// Sub-epic 4b getStateSnapshot. Spectator perspective adaptation: NO isP1
// derivation (third-party — neither player1 nor player2).
export function onSpectateFightStateResume(detail) {
  if (!detail) return;

  // Defensive: don't hydrate if spectator already received fight_end
  // (race window — fight_end could arrive before snapshot)
  if (spectateState.fightOver) return;

  // Hydrate identities (only odId available на snapshot — username comes via
  // fight_end OR C9.5 BE extension)
  if (detail.player1?.odId) spectateState.player1OdId = detail.player1.odId;
  if (detail.player2?.odId) spectateState.player2OdId = detail.player2.odId;

  // Hydrate fight progress
  if (typeof detail.currentRound === 'number') spectateState.currentRound = detail.currentRound;
  if (typeof detail.maxRounds === 'number') spectateState.maxRounds = detail.maxRounds;
  if (typeof detail.player1?.hp === 'number') spectateState.player1Hp = detail.player1.hp;
  if (typeof detail.player2?.hp === 'number') spectateState.player2Hp = detail.player2.hp;

  // If snapshot status === 'finished' (race: match ended before snapshot delivery),
  // mark fightOver and skip log replay (fight_end will arrive separately if not received).
  if (detail.status === 'finished') {
    spectateState.fightOver = true;
    return;
  }

  // Replay roundResults log if present (for late-joiners catching up)
  if (Array.isArray(detail.roundResults)) {
    for (const round of detail.roundResults) {
      if (typeof round.round !== 'number') continue;
      if (round.player1) {
        appendLog({
          round: round.round,
          side: 'player1',
          actor: spectateState.player1Name,
          move: round.player1.module?.name || 'Attack',
          damage: round.player1.damage || 0,
          critical: round.player1.critted || false,
        });
      }
      if (round.player2) {
        appendLog({
          round: round.round,
          side: 'player2',
          actor: spectateState.player2Name,
          move: round.player2.module?.name || 'Attack',
          damage: round.player2.damage || 0,
          critical: round.player2.critted || false,
        });
      }
    }
  }
}

// spectator-list-update payload: { matchId, count }
export function onSpectatorListUpdate(detail) {
  if (typeof detail?.count === 'number') spectateState.spectatorCount = detail.count;
}

// ── Reset ─────────────────────────────────────────────────────────────────

export function resetSpectateState() {
  spectateState.player1Name = 'Player 1';
  spectateState.player2Name = 'Player 2';
  spectateState.player1OdId = null;
  spectateState.player2OdId = null;
  spectateState.player1Hp = MAX_HP;
  spectateState.player2Hp = MAX_HP;
  spectateState.currentRound = 0;
  spectateState.maxRounds = MAX_ROUNDS;
  spectateState.maxHp = MAX_HP;
  spectateState.fightLog = [];
  spectateState.fightOver = false;
  spectateState.winner = null;
  spectateState.spectatorCount = 0;
}
