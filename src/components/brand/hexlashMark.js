// hexlashMark.js — the Hexlash brand mark, as inline vector.
//
// THREE DRAWINGS, NOT ONE SCALED. The mark is drawn three times, each for its own
// size band: the full figure loses its joints below ~64px, and the compact one
// turns to mush below ~24px, so the small end is redrawn on a 16×16 pixel grid
// with no diagonals at all. Scaling one in place of another throws away exactly
// the work these were made for. Rule (design_handoff_hexlash_mark/README.md):
//
//     >= 64px  full     |  24-48px  compact  |  <= 20px  micro
//
// Between 20 and 24 take micro — recognisable beats accurate at that size.
//
// PAINTED BY COLOUR, NOT FILL. Every variant is fill="currentColor" with no colour
// of its own, so it inherits from whatever it sits in and a light background only
// has to flip `color` (there is no separate inverse asset to wire — the handoff's
// inverse file is the same geometry with a different default colour).
//
// Brand rule: the mark is monochrome. No pink, no glow, no gradient, ever —
// see .claude/skills/hexlash-design §6.
import { h } from 'vue';

export const MARK_VARIANTS = {
  full:    { viewBox: '0 0 64 64', d: 'M32 4 L56 18 L56 46 L32 60 L8 46 L8 18ZM11.6 20.07 L11.6 43.93 L32 55.84 L52.4 43.93 L52.4 20.07 L32 8.16ZM27.87 13.07 L36.13 13.07 L38.27 17.87 L36.13 22.67 L27.87 22.67 L25.73 17.87ZM26.93 25.33 L37.07 25.33 L39.20 30.13 L36.80 40.53 L27.20 40.53 L24.80 30.13ZM24.80 24.00 L19.73 31.20 L15.87 30.13 L21.60 19.20ZM19.73 31.20 L20.53 37.07 L14.93 36.27 L15.87 30.13ZM42.40 19.2 L48.13 30.13 L44.27 31.2 L39.20 24ZM48.13 30.13 L49.07 36.27 L43.47 37.07 L44.27 31.2ZM31.20 38.40 L29.60 44.80 L24.53 44.80 L26.13 38.40ZM29.6 44.8 L28.4 49.2 L24.2 49.2 L24.53 44.8ZM37.87 38.4 L39.47 44.8 L34.40 44.8 L32.80 38.4ZM39.47 44.8 L39.80 49.2 L35.60 49.2 L34.40 44.8Z' },
  compact: { viewBox: '0 0 48 48', d: 'M24 1 L44 12.5 L44 35.5 L24 47 L4 35.5 L4 12.5ZM6.8 14.12 L6.8 33.88 L24 43.77 L41.2 33.88 L41.2 14.12 L24 4.23ZM20.9 9.8 L27.1 9.8 L28.7 13.4 L27.1 17 L20.9 17 L19.3 13.4ZM20.2 19 L27.8 19 L29.4 22.6 L27.6 30.4 L20.4 30.4 L18.6 22.6ZM18.6 18 L14.8 23.4 L11.9 22.6 L16.2 14.4ZM14.8 23.4 L15.4 27.6 L11.4 27 L11.9 22.6ZM31.80 14.4 L36.10 22.6 L33.20 23.4 L29.40 18ZM36.10 22.6 L36.60 27 L32.60 27.6 L33.20 23.4ZM23.4 28.8 L21.4 38.2 L17.6 38.2 L19.6 28.8ZM28.40 28.8 L30.40 38.2 L26.60 38.2 L24.60 28.8Z' },
  micro:   { viewBox: '0 0 16 16', d: 'M6 0h4v1h-4ZM4 1h2v1h-2ZM10 1h2v1h-2ZM2 2h2v1h-2ZM12 2h2v1h-2ZM2 3h1v1h-1ZM13 3h1v1h-1ZM2 4h1v1h-1ZM13 4h1v1h-1ZM2 5h1v1h-1ZM13 5h1v1h-1ZM2 6h1v1h-1ZM13 6h1v1h-1ZM2 7h1v1h-1ZM13 7h1v1h-1ZM2 8h1v1h-1ZM13 8h1v1h-1ZM2 9h1v1h-1ZM13 9h1v1h-1ZM2 10h1v1h-1ZM13 10h1v1h-1ZM2 11h1v1h-1ZM13 11h1v1h-1ZM2 12h1v1h-1ZM13 12h1v1h-1ZM2 13h2v1h-2ZM12 13h2v1h-2ZM4 14h2v1h-2ZM10 14h2v1h-2ZM6 15h4v1h-4ZM7 4h2v1h-2ZM6 5h4v1h-4ZM4 6h2v3h-2ZM10 6h2v3h-2ZM7 6h2v3h-2ZM6 9h4v2h-4ZM5 11h2v2h-2ZM9 11h2v2h-2Z' },
};

// The switch from the README, in one place so no call site has to remember it.
export function markVariantFor(size) {
  return size >= 64 ? 'full' : size >= 24 ? 'compact' : 'micro';
}

// `size` is the box the mark is drawn in — pass the CSS box it actually occupies,
// because that, not the viewBox, decides which drawing is right. CSS may still own
// the final width/height (the attributes below are a fallback and a hint).
export const HexlashMark = (props) => {
  const size = Number(props?.size) || 40;
  const name = markVariantFor(size);
  const v = MARK_VARIANTS[name];

  // The micro drawing is authored ON the pixel grid — whole coordinates, no
  // diagonals, every line and gap exactly 1px. Stretching it to 17-23px would put
  // its edges between device pixels and undo the entire reason it exists. So above
  // 16 it is PADDED, not scaled: the viewBox grows around the artwork while the
  // artwork keeps its 1 unit = 1 px. (README: "20px = the same 16px core with 2px
  // of field around it — not a scale-up".)
  let viewBox = v.viewBox;
  if (name === 'micro' && size > 16) {
    const pad = (size - 16) / 2;
    viewBox = `${-pad} ${-pad} ${size} ${size}`;
  }

  return h(
    'svg',
    {
      class: 'logo-mark',
      viewBox,
      width: size,
      height: size,
      fill: 'currentColor',
      'aria-hidden': 'true',
      focusable: 'false',
    },
    [h('path', { d: v.d })],
  );
};
HexlashMark.props = ['size'];
