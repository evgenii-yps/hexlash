// Epic 3A — Fight hit-flash overlay.
// Step 15: module-scoped flag driving .hit-flash.flash class on HudFight.
// Step 16's useFightSimulation calls triggerFlash() on every successful hit
// (doExchange). CSS animation is ~180ms (prototype 1347-1351), so the flag
// is cleared ~200ms after being set to leave the DOM ready for the next
// trigger.
//
// Why the leading reset: Vue reactivity batches updates, so setting the
// same flag to `true` twice in the same tick wouldn't restart the CSS
// animation. The quick false→true toggle on re-trigger forces a class
// re-add (equivalent to prototype's `void f.offsetWidth` reflow hack).
//
// B2 (#24) — port v1 8-color flash map from CardFightView.vue:474-488.
// Color exposed via a separate `flashColor` ref; HudFight consumes it through
// the `--flash-color` CSS custom property (avoids overriding the transparent
// default state of `.hit-flash`). Bare `triggerFlash()` calls continue to
// work — `type=null` falls back to legacy white. 3 existing callsites in
// FightView.vue (lines 98/141/224) untouched.

import { ref } from 'vue';

// B2 (#24): per-effect flash colors via color-mix() с --hex-dice-* tokens
// (Sub-epic 7 token migration intent). `damage`/`overdrive` reuse
// --hex-danger / --hex-warning (no dedicated --hex-dice-{name} tokens).
const FLASH_COLORS = {
  heal:       'color-mix(in srgb, var(--hex-dice-heal) 25%, transparent)',
  adrenaline: 'color-mix(in srgb, var(--hex-dice-adrenaline) 25%, transparent)',
  shield:     'color-mix(in srgb, var(--hex-dice-shield) 25%, transparent)',
  blind:      'color-mix(in srgb, var(--hex-dice-blind) 25%, transparent)',
  rage:       'color-mix(in srgb, var(--hex-dice-rage) 25%, transparent)',
  crit:       'color-mix(in srgb, var(--hex-dice-crit) 25%, transparent)',
  damage:     'color-mix(in srgb, var(--hex-danger) 25%, transparent)',
  overdrive:  'color-mix(in srgb, var(--hex-warning) 25%, transparent)',
};

// Legacy white fallback — preserved for bare triggerFlash() callsites not
// yet type'd (e.g. FightView.vue PvP handlers). Future B3/B4 commits will
// type those callsites with explicit effect names.
const FLASH_DEFAULT = 'rgba(255, 255, 255, 0.18)';

export const flashing = ref(false);
export const flashColor = ref(FLASH_DEFAULT);

let clearTimer = null;

export function triggerFlash(type = null) {
  // B2 (#24): per-type color or legacy white fallback
  flashColor.value = (type && FLASH_COLORS[type]) || FLASH_DEFAULT;

  if (clearTimer) {
    clearTimeout(clearTimer);
    clearTimer = null;
  }
  flashing.value = false;
  // Microtick lets Vue flush the `false` to DOM (class removed) before the
  // `true` re-adds it — otherwise the animation doesn't restart.
  setTimeout(() => {
    flashing.value = true;
    clearTimer = setTimeout(() => {
      flashing.value = false;
      clearTimer = null;
    }, 200);
  }, 10);
}
