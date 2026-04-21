// Epic 3Bb Step 5 — Matchmaking state reactive store.
// Pattern parity with Epic 3A useFightSimulation / Epic 3Ba useTrainingState.
// Source: prototype hexlash_v24.html lines 10616-10629.

import { reactive } from 'vue';

export const MY_ELO = 1247;

export const mmState = reactive({
  phase: 'search',        // 'search' | 'results'
  eloDelta: 100,
  archFilter: 'any',
  beltFilter: 'any',
  candidates: [],
  selected: null,
  searchProgress: 0,
  searchLog: [],
});

// Prototype computes eloRange via a getter inside the object literal; for a
// reactive store we expose a plain function — callers read it imperatively.
// Format matches prototype 10625-10627: "1147 — 1347" (em-dash + spaces, no
// ±prefix, that's in the HUD label).
export function getEloRange() {
  return (MY_ELO - mmState.eloDelta) + ' — ' + (MY_ELO + mmState.eloDelta);
}

// Reset + phase transitions are stubs for Step 7. Step 5 only needs the
// shape to exist so refreshScreen can read fields.
export function resetMmState() {}
export function enterSearchPhase() {}
export function enterResultsPhase() {}
