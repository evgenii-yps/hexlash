// Epic 3Bb Step 9 — Cross-scene setup for FightView.
// Matchmaking writes what opponent was picked; FightView reads on mount.
// FD's FIGHT button doesn't call setFightSetup — fallback DEFAULT_SETUP
// keeps that path working.
//
// Refresh on /v2/fight loses state.current — defaults apply. Acceptable
// in 3Bb; Epic 4 replaces with real match state from backend/WebSocket.

import { reactive } from 'vue';

const DEFAULT_SETUP = {
  leftName: 'YURII.VARVAROV',
  leftArch: 'Captain · Warden',
  rightName: 'PREDATOR',
  rightArch: 'Predator',
};

const state = reactive({ current: null });

export function setFightSetup(setup) {
  state.current = {
    leftName:  setup.leftName  || DEFAULT_SETUP.leftName,
    leftArch:  setup.leftArch  || DEFAULT_SETUP.leftArch,
    rightName: setup.rightName || DEFAULT_SETUP.rightName,
    rightArch: setup.rightArch || DEFAULT_SETUP.rightArch,
  };
}

export function getFightSetup() {
  // Return a shallow copy so callers can't mutate the stored setup.
  // Note: prefers state.current if present (Matchmaking pick survives across
  // Rematch because we DO NOT clear on FightView unmount).
  return state.current
    ? { ...state.current }
    : { ...DEFAULT_SETUP };
}

export function clearFightSetup() {
  state.current = null;
}
