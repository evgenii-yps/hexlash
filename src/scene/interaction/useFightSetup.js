// Epic 3Bb — Fight setup pass-through from Matchmaking (and future pairs)
// to FightView. Reactive store so FightView.onMounted can read what was
// selected. Step 1: stub. Real setters/getters in Step 9.

import { reactive } from 'vue';

const state = reactive({ current: null });

export function setFightSetup(/* setup */) {}
export function getFightSetup() { return null; }
export function clearFightSetup() {}

// Exposed for debugging only — not consumed by app code.
export const _state = state;
