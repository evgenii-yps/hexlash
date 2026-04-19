// Epic 2 — pit-view hub. Step 17.
// Shared reactive click state. CanvasLayer calls `pick(id)` when a clickable
// target was clicked (not dragged). PitViewV2 watches `seq` to re-open the
// modal even if the same id is clicked twice in a row.
//
// Why a counter: `watch(() => state.id, ...)` wouldn't fire for id -> id.

import { reactive } from 'vue';

const state = reactive({
  id: '',
  seq: 0,
});

export function useClickState() {
  return state;
}

export function pickClick(id) {
  state.id = id;
  state.seq += 1;
}
