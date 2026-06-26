// homeFighterTag.js — a tiny module-scoped reactive bridge between the home 3D
// scene and the home 2D layer (the same sibling-state pattern the v2 scenes use
// for hover/click hints).
//
// HomeScene (3D) each frame projects the point above the fighter's head to screen
// pixels and computes a hysteresis "near" flag from the camera zoom distance, then
// writes it here. HomeView (2D) reads it to anchor the fighter-identity label over
// the fighter and fade it in on zoom-in. The label text is sharp DOM, not a 3D
// sprite — this only carries the screen position + the show flag.
import { reactive } from 'vue';

export const homeFighterTag = reactive({
  x: 0,      // screen px (CSS) of the anchor point above the fighter's head
  y: 0,
  near: false, // camera zoomed into the near part of the corridor (with hysteresis)
});

export function setHomeFighterTag(x, y, near) {
  // round to whole px — avoids sub-pixel reactive churn every frame while idle
  homeFighterTag.x = Math.round(x);
  homeFighterTag.y = Math.round(y);
  homeFighterTag.near = near;
}

export function clearHomeFighterTag() {
  homeFighterTag.near = false;
}
