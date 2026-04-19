// Epic 2 — pit-view hub. Step 16.
// Shared reactive hover state for the pit scene. CanvasLayer (writer) and
// PitViewV2 (reader) are siblings inside AppV2 — emit/props flow doesn't
// connect them directly, so we use a module-scoped reactive object as a
// lightweight shared store. Vue 3 idiom for cross-component transient UI.

import { reactive } from 'vue';

const state = reactive({
  text: '',
  x: 0,
  y: 0,
  visible: false,
});

export function useHoverState() {
  return state;
}
