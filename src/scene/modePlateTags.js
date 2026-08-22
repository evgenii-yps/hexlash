// modePlateTags.js — the bridge between the 3D mode plates (HomeScene) and their
// 2D captions (HomeView). Same shape as homeFighterTag.js: one module-scoped
// reactive record the scene WRITES every frame and the view READS, so the labels
// stay sharp DOM text anchored over real 3D plates without a per-frame Vue event.
//
// x/y are canvas CSS pixels of the caption anchor — the top-centre of the caption
// block, derived from the plate's projected SILHOUETTE rather than from a fixed point
// in the world, so the label clears whichever edge is nearest the camera at any angle
// (see modePlates.captionScreen). `visible` is false while the plate is behind the
// camera or the mode stage is not on screen. `hovered` is the lit plate id (or null)
// so the captions can follow the ONE-glow rule the 3D plates enforce.
import { reactive } from 'vue';

export const modePlateTags = reactive({
  pve: { x: 0, y: 0, visible: false },
  pvp: { x: 0, y: 0, visible: false },
  hovered: null, // 'pve' | 'pvp' | null
});

export function setModePlateTag(id, x, y, visible) {
  const tag = modePlateTags[id];
  if (!tag) return;
  tag.x = x;
  tag.y = y;
  tag.visible = visible;
}

export function setModePlateHover(id) {
  modePlateTags.hovered = id || null;
}

// Hide both captions (stage left / scene unmounted) without touching `hovered`
// bookkeeping the scene owns.
export function clearModePlateTags() {
  modePlateTags.pve.visible = false;
  modePlateTags.pvp.visible = false;
  modePlateTags.hovered = null;
}
