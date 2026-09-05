// hexlashMark.js — the Hexlash brand mark, as a picture.
//
// ONE PLACE. Every surface that shows the mark goes through this module: the top
// strip, both loading screens, the landing nav and footer, auth, password reset,
// 404. None of them names a file. Replacing the mark is replacing the files in
// docs/design-handoff/hexlash_mark/brand/ and running scripts/sync-brand-icons.mjs
// — no markup is edited at eight call sites, which is the whole point.
//
// NOTHING HERE DRAWS THE MARK. No paths, no coordinates, no "we'll just draw the
// hexagon in code, it's easier". A hand-copied set of coordinates is exactly how
// this project once shipped TWO different logos at the same time — the mark in the
// app was replaced and the copy in the icon generator was not, and the browser tab
// and the game disagreed for months without anyone editing either on purpose.
//
// TWO DRAWINGS, NOT ONE SCALED. The full figure loses its small shards below ~48px,
// so the small end is a separate drawing with a thicker outline and those shards
// removed. The switch is by the BOX the mark occupies:
//
//     >= 48px  full  |  < 48px  micro
//
// (An earlier arrangement used more than one threshold. That is gone — this pack
// ships two drawings, one threshold, and there is nothing below micro. Never put
// the mark in a box under 32px; the tab icon is the only exception and the browser
// picks that size, not us.)
//
// ONE SOURCE FILE. Both drawings come from the same geometry — the small one is the
// full one with shards THINNED OUT, not a second figure drawn by hand. Adding sizes
// means re-exporting from that source, then laying every size side by side on the
// real dark ground and checking by eye: that the small files carry the simplified
// figure, and that the shape is the same in all of them. File names show neither.
//
// ⚠️ KNOWN DEFECT, do not "fix" here: the micro ladder currently holds TWO shapes.
// 32/64 fuse the pink shard into the white one; 96/128/192 keep it separate. They
// sit in one srcset, so a 40px box (top strip) and a 44px box (landing footer) show
// a DIFFERENT mark on a 1x screen than on a 3x one. The cure is re-exporting the
// pictures from one source — this file stays as it is. See the handoff README.
//
// RASTER, FOR NOW. The mark is supplied as pictures; there is no vector version and
// no geometry yet. It will be redrawn as vector and swapped again — see the handoff
// README. Until then `srcset` carries the sizes and the browser picks the right one
// for the screen's pixel density; a picture served 1:1 against its box is mush on a
// phone.
//
// Both drawings reach 3x on every box the app uses. The micro list once stopped at
// 64px, which left the 40px top strip and the 44px landing footer soft on a
// triple-density phone (they need 120-132 device pixels); 96/128/192 closed that on
// 05.09.2026. Adding a size is adding it to the list below — nothing else.
//
// PAINTED BY THE FILE, NOT BY `color`. The retired mark was monochrome
// `fill="currentColor"` and inherited its colour. This one is two-colour — white
// #F6F4F6 plus the single pink #FF0069 slash — so it carries its own colours and
// setting `color` on it does nothing. Every stale `color` declaration that existed
// only to paint the mark was removed with this change.
//
// Brand rules live in docs/design-handoff/hexlash_mark/README.md.
import { h } from 'vue';

// Public path, not a bundled import: index.html's first-paint splash needs the same
// files under a stable URL, and it cannot reach into the bundle. Both halves of the
// loading screen therefore point at one set of files.
const BASE = '/brand';

export const MARK_SOURCES = {
  full: {
    src: `${BASE}/mark-full-256.png`,
    srcset: `${BASE}/mark-full-128.png 128w, ${BASE}/mark-full-256.png 256w, ${BASE}/mark-full-512.png 512w`,
  },
  micro: {
    src: `${BASE}/mark-micro-64.png`,
    srcset: `${BASE}/mark-micro-32.png 32w, ${BASE}/mark-micro-64.png 64w, `
      + `${BASE}/mark-micro-96.png 96w, ${BASE}/mark-micro-128.png 128w, `
      + `${BASE}/mark-micro-192.png 192w`,
  },
};

// The switch from the README, in one place so no call site has to remember it.
export function markVariantFor(size) {
  return size >= 48 ? 'full' : 'micro';
}

// `size` is the box the mark is drawn in, in px. It decides which drawing is right,
// so pass the box the mark ACTUALLY occupies — CSS still owns the final width and
// height (the attributes below are a fallback and a layout hint).
//
// `sizes` overrides the width handed to the browser when the box is fluid rather
// than a fixed pixel value (the loading screen and 404 size their mark in vmin).
// Give the LARGEST width the box can reach across breakpoints: over-fetching costs
// a few KB, under-fetching is visibly soft.
export const HexlashMark = (props) => {
  const size = Number(props?.size) || 40;
  const source = MARK_SOURCES[markVariantFor(size)];

  return h('img', {
    class: 'logo-mark',
    src: source.src,
    srcset: source.srcset,
    sizes: props?.sizes || `${size}px`,
    width: size,
    height: size,
    alt: '',
    'aria-hidden': 'true',
    draggable: 'false',
  });
};
HexlashMark.props = ['size', 'sizes'];
