// Epic 3A Step 16 — Fight simulation state machine.
// prep → fight → result, with mid-fight coach pause. Module-scoped reactive
// state; Fight HUD binds templates directly to `fightState` fields.
// Source: prototype hexlash_v24.html — doExchange 8490-8531, runRound
// 8534-8571, showCoachPause 8573-8586, endFight 8597-8618, startFight
// 8670-8676.
//
// Defensive notes:
//   - Inner setTimeouts (220ms damage window, coach-pause-to-next-round)
//     check fightState.phase before mutating. resetFight clears the stored
//     `timer` slot, but setTimeouts scheduled WITHIN earlier callbacks
//     aren't tracked — the phase guard stops them from corrupting reset
//     state if they race.

import { reactive } from 'vue';
import { fightSceneApi } from '@/scene/scenes/useFightSceneApi.js';
import { logFight, clearFightLog } from './useFightLog.js';
import { triggerFlash } from './useFlashHit.js';

export const fightState = reactive({
  phase: 'prep',                       // 'prep' | 'fight' | 'result'
  round: 0,
  totalRounds: 5,
  leftHp: 100, leftMaxHp: 100,
  rightHp: 100, rightMaxHp: 100,
  timer: null,
  coachShown: false,
  coachStrategy: 'balanced',           // 'balanced' | 'aggressive' | 'defensive' | 'counter'
  leftName:  'FIGHTER #1',
  leftArch:  'Captain \u00b7 Warden',
  rightName: 'FIGHTER #2',
  rightArch: 'Predator',
  coachPauseOpen: false,
  coachPauseText: '',
  resultWon: false,
  resultSummary: '',
});

const MOVES = [
  { type: 'jab',   dmg: [4, 10],  hitChance: 0.75, label: 'jab'   },
  { type: 'cross', dmg: [10, 18], hitChance: 0.55, label: 'cross' },
  { type: 'hook',  dmg: [8, 14],  hitChance: 0.60, label: 'hook'  },
];

function rng(a, b) { return a + Math.random() * (b - a); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function labelForStrat(s) {
  return { aggressive: 'Push Pace', defensive: 'Defend', counter: 'Counter' }[s] || s;
}

function setTimer(fn, ms) {
  fightState.timer = setTimeout(fn, ms);
}

export function startFight(strategy) {
  fightState.coachStrategy = strategy || 'balanced';
  fightState.phase = 'fight';
  clearFightLog();
  logFight('The bell rings.', 'round');
  setTimer(runRound, 700);
}

function runRound() {
  if (fightState.phase !== 'fight') return;
  fightState.round += 1;
  if (fightState.round > fightState.totalRounds) {
    endFight();
    return;
  }
  logFight('Round ' + fightState.round + ' begins.', 'round');

  const exchanges = 3 + Math.floor(Math.random() * 3); // 3..5
  let attacker = (fightState.round % 2 === 1) ? 'left' : 'right';
  let i = 0;

  function nextExchange() {
    if (fightState.phase !== 'fight') return;
    if (fightState.leftHp <= 0 || fightState.rightHp <= 0) {
      endFight();
      return;
    }
    if (i >= exchanges) {
      // Coach pause at the mid-fight round.
      if (!fightState.coachShown
          && fightState.round === Math.floor(fightState.totalRounds / 2)) {
        showCoachPause();
        return;
      }
      setTimer(runRound, 1500);
      return;
    }
    doExchange(attacker);
    attacker = (attacker === 'left') ? 'right' : 'left';
    i += 1;
    setTimer(nextExchange, 800);
  }
  setTimer(nextExchange, 600);
}

function doExchange(attackerSide) {
  const move = pick(MOVES);
  const isLeft = attackerSide === 'left';
  const defenderSide  = isLeft ? 'right' : 'left';
  const attackerLabel = isLeft ? fightState.leftName  : fightState.rightName;
  const defenderLabel = isLeft ? fightState.rightName : fightState.leftName;
  const actorClass    = isLeft ? 'actor-warden' : 'actor-predator';

  let chance = move.hitChance;
  if (fightState.coachStrategy === 'aggressive' &&  isLeft) chance += 0.08;
  if (fightState.coachStrategy === 'defensive'  && !isLeft) chance -= 0.10;
  // `counter` noop in MVP — prototype also leaves it unimplemented.

  fightSceneApi.playMove(attackerSide, move.type);

  // 220ms matches the punch animation peak so the hit/miss log lines up
  // with the visible punch impact on the 3D fighter.
  setTimeout(() => {
    if (fightState.phase !== 'fight') return; // reset raced us
    const hit = Math.random() < chance;
    if (!hit) {
      const defenseType = Math.random() < 0.5 ? 'dodge' : 'block';
      fightSceneApi.playMove(defenderSide, defenseType);
      logFight(
        '<span class="lt">R' + fightState.round + '</span>'
        + '<span class="ln">' + attackerLabel + '</span> threw a '
        + '<strong>' + move.label + '</strong> \u2014 ' + defenderLabel + ' '
        + (defenseType === 'dodge' ? 'slipped' : 'blocked') + '.',
        actorClass + ' miss',
      );
    } else {
      let dmg = rng(move.dmg[0], move.dmg[1]);
      const isCrit = Math.random() < 0.12;
      if (isCrit) dmg *= 1.6;
      if (isLeft) fightState.rightHp = Math.max(0, fightState.rightHp - dmg);
      else        fightState.leftHp  = Math.max(0, fightState.leftHp  - dmg);
      fightSceneApi.playMove(defenderSide, 'hit');
      triggerFlash();
      const dmgTxt = '<strong>' + Math.round(dmg) + '</strong> dmg';
      logFight(
        '<span class="lt">R' + fightState.round + '</span>'
        + '<span class="ln">' + attackerLabel + '</span> connected with a '
        + '<strong>' + move.label + '</strong> \u2014 ' + dmgTxt
        + (isCrit ? ' \u00b7 CRIT' : ''),
        actorClass + (isCrit ? ' crit' : ''),
      );
    }
  }, 220);
}

function showCoachPause() {
  fightState.coachShown = true;
  let line = "He's measuring with the jab. We need to commit and trade.";
  if (fightState.leftHp < fightState.rightHp - 15) {
    line = "We're behind on points. Take the centre, force exchanges.";
  } else if (fightState.leftHp > fightState.rightHp + 15) {
    line = "He's tired. Stay sharp, don't get careless on the cross.";
  }
  fightState.coachPauseText = line;
  fightState.coachPauseOpen = true;
}

export function setCoachStrategy(strat) {
  if (fightState.phase !== 'fight') return;
  fightState.coachStrategy = strat;
  logFight('Coach: <strong>' + labelForStrat(strat) + '</strong>.', 'round');
  fightState.coachPauseOpen = false;
  setTimer(runRound, 800);
}

function endFight() {
  fightState.phase = 'result';
  if (fightState.timer) { clearTimeout(fightState.timer); fightState.timer = null; }
  const won = fightState.leftHp > fightState.rightHp;
  fightState.resultWon = won;
  if (won) {
    const margin = Math.round(fightState.leftHp - Math.max(0, fightState.rightHp));
    fightState.resultSummary =
      'Won by ' + margin + ' HP. Coach call: ' + fightState.coachStrategy + '.';
  } else {
    fightState.resultSummary =
      'Lost. He read the cross. Try a different rhythm next time.';
  }
}

export function resetFight() {
  if (fightState.timer) { clearTimeout(fightState.timer); fightState.timer = null; }
  fightState.phase = 'prep';
  fightState.round = 0;
  fightState.leftHp  = fightState.leftMaxHp;
  fightState.rightHp = fightState.rightMaxHp;
  fightState.coachShown = false;
  fightState.coachPauseOpen = false;
  fightState.coachPauseText = '';
  fightState.resultWon = false;
  fightState.resultSummary = '';
  clearFightLog();
}
