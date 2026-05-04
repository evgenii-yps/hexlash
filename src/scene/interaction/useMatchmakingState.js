// Sub-epic 5 C1 — Real matchmaking state migration.
// Pattern parity preserved (Epic 3Ba useTrainingState — direct store import
// at module scope, useTrainingState.js:8 + useClickToHit.js:17 precedent
// per Lesson #32 convention discovery).
//
// Phase enum migration ('search' | 'results' → 'searching' | 'found' | 'timeout')
// reflects real BE flow vs mock-only candidate browsing. Mock files
// (mmCandidatesMock + useMatchmakingScreen) deleted in C2.

import { reactive, computed } from 'vue';
import store from '@/core/state/store.js';

// Reactive captain ELO — reads from agent/currentCaptain getter.
// Replaces hardcoded MY_ELO=1247 mock constant (Sub-epic 5 C1).
// Fallback 1000 matches BE Captain.elo @default(1000) per Phase 0 Q3.2.
export const myElo = computed(() => store.getters['agent/currentCaptain']?.elo || 1000);

export const mmState = reactive({
  phase: 'searching',     // 'searching' | 'found' | 'timeout'
  // ── Filter fields preserved для future BE work (carry-over #29 — BE doesn't
  // accept archetype/belt/eloDelta as queue params currently; UI hidden in C3).
  eloDelta: 100,
  archFilter: 'any',
  beltFilter: 'any',
  // ── Sub-epic 5 real matchmaking state.
  searchTime: 0,          // seconds elapsed since search start (mm:ss display)
  queueSize: 0,           // total players в BE queue (from MatchmakingQueueMsg)
  onlineCount: 0,         // total online players (REST poll, C10)
  countdown: 0,           // match-found countdown seconds (3 → 0, C8)
  matchData: null,        // { matchId, opponent } from MatchFoundMsg
  // ── Mock-flow fields preserved до C2 cleanup (mmCandidatesMock removal).
  candidates: [],
  selected: null,
  searchProgress: 0,
  searchLog: [],
});

// Reset + phase transitions. resetMmState seeds mount + onBeforeUnmount;
// enterSearchPhase re-initialises search fields for fresh rescans;
// enterFoundPhase / enterTimeoutPhase added for C6/C7 wiring.
export function resetMmState() {
  mmState.phase = 'searching';
  mmState.eloDelta = 100;
  mmState.archFilter = 'any';
  mmState.beltFilter = 'any';
  mmState.searchTime = 0;
  mmState.queueSize = 0;
  mmState.onlineCount = 0;
  mmState.countdown = 0;
  mmState.matchData = null;
  mmState.candidates = [];
  mmState.selected = null;
  mmState.searchProgress = 0;
  mmState.searchLog = [];
}

export function enterSearchPhase() {
  mmState.phase = 'searching';
  mmState.searchTime = 0;
  mmState.queueSize = 0;
  mmState.countdown = 0;
  mmState.matchData = null;
  mmState.candidates = [];
  mmState.selected = null;
  mmState.searchProgress = 0;
  mmState.searchLog = [];
  // onlineCount preserved cross-phase (REST-polled value, не reset on rescan)
}

export function enterFoundPhase() {
  mmState.phase = 'found';
  // matchData populated by C6 listener before this call.
  // countdown initialised by C8 inline timer.
}

export function enterTimeoutPhase() {
  mmState.phase = 'timeout';
  // Search timer cleared by caller (MatchmakingView listener — C7).
}

// Sub-epic 5 C1 — legacy stubs for mock-flow callers preserved до C2 cleanup.
// Rollup prod build strict on missing named exports — empty bodies until
// useMatchmakingScreen.js + mmCandidatesMock.js + MatchmakingView mock-flow
// gutted в C2.
export function enterResultsPhase() {
  // no-op — caller MatchmakingView.vue:90 being deleted in C2.
}
export function getEloRange() {
  // no-op stub — caller useMatchmakingScreen.js:37 being deleted in C2.
  return '';
}
