// Epic 3A — Fighter Detail branch-label tracking.
// Step 8a: module-scoped reactive store for the 3 DOM labels floating above
// the branch columns. FighterDetailScene.tick projects each column's world
// position to screen pixels and writes {x, y, visible} via updateFdLabel.
// HudFighterDetail binds these reactively to each <div class="branch-label">.
//
// Pattern parity with Epic 2: useHoverState, useClickState.

import { reactive } from 'vue';

export const fdLabels = reactive({
  speed:     { x: 0, y: 0, visible: false },
  power:     { x: 0, y: 0, visible: false },
  technique: { x: 0, y: 0, visible: false },
});

export function updateFdLabel(id, pos) {
  const entry = fdLabels[id];
  if (!entry) return;
  entry.x = pos.x;
  entry.y = pos.y;
  entry.visible = pos.visible;
}
