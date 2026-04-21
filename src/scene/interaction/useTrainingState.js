// Epic 3Ba Step 6 — Training session state.
// Module-scoped reactive store: HUD binds via v-model, scene + click-to-hit
// mutate. Pattern parity with Epic 3A useFightSimulation.
//
// Source: prototype hexlash_v24.html lines 9738-9759 (trState + multiplierForCombo).

import { reactive } from 'vue';

const ENERGY_INITIAL = 42;
const ENERGY_MAX = 60;
const ENERGY_REGEN = 0.4; // per second

export const trState = reactive({
  active: false,
  startedAt: 0,
  tapsEarned: 0,

  energy: ENERGY_INITIAL,
  energyMax: ENERGY_MAX,
  energyRegen: ENERGY_REGEN,

  lastHitAt: 0,
  comboCount: 0,
  comboTimerExpiresAt: 0,
  multiplier: 1,

  taskHits: 0,
  taskHitsGoal: 100,
  taskHitsDone: false,
  taskCombos: 0,
  taskCombosGoal: 5,
  taskCombosDone: false,

  // UI-derived (updated by scene.tick at 10Hz).
  elapsedStr: '00:00',
  comboVisible: false,
});

export function resetTrainingState() {
  trState.active = false;
  trState.startedAt = 0;
  trState.tapsEarned = 0;
  trState.energy = ENERGY_INITIAL;
  trState.lastHitAt = 0;
  trState.comboCount = 0;
  trState.comboTimerExpiresAt = 0;
  trState.multiplier = 1;
  trState.taskHits = 0;
  trState.taskHitsDone = false;
  trState.taskCombos = 0;
  trState.taskCombosDone = false;
  trState.elapsedStr = '00:00';
  trState.comboVisible = false;
}

export function startTrainingSession() {
  resetTrainingState();
  trState.active = true;
  trState.startedAt = performance.now();
}

// Source: prototype 9754-9759.
export function multiplierForCombo(c) {
  if (c >= 25) return 5;
  if (c >= 12) return 3;
  if (c >= 5)  return 2;
  return 1;
}
