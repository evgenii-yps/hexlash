// Epic 3Bb — Matchmaking state reactive store.
// Step 1: stub. Real fields + resetMmState + phase transitions in Steps 5/7.
// Pattern parity with Epic 3A useFightSimulation / Epic 3Ba useTrainingState.

import { reactive } from 'vue';

export const mmState = reactive({});

export const MY_ELO = 1247;

export function resetMmState() {}
export function enterSearchPhase() {}
export function enterResultsPhase() {}
export function getEloRange() { return ''; }
