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

import { ref } from 'vue';

export const flashing = ref(false);

let clearTimer = null;

export function triggerFlash() {
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
