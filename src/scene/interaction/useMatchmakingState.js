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

// Reset + phase transitions (Step 7). resetMmState seeds mount +
// onBeforeUnmount; enterSearchPhase re-initialises search fields for
// fresh rescans; enterResultsPhase flips the UI to the candidate grid
// (candidates themselves land from generateCandidates in Step 8).
export function resetMmState() {
  mmState.phase = 'search';
  mmState.eloDelta = 100;
  mmState.archFilter = 'any';
  mmState.beltFilter = 'any';
  mmState.candidates = [];
  mmState.selected = null;
  mmState.searchProgress = 0;
  mmState.searchLog = [];
}

export function enterSearchPhase() {
  mmState.phase = 'search';
  mmState.candidates = [];
  mmState.selected = null;
  mmState.searchProgress = 0;
  mmState.searchLog = [];
}

export function enterResultsPhase() {
  mmState.phase = 'results';
  // candidates populated by generateCandidates in Step 8 before this call.
}
