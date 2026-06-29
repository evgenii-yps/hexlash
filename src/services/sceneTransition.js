// Ephemeral SPA scene-transition cover. Distinct from the page-load splash
// (#hx-load in index.html, driven by src/main.js): that one covers the FIRST
// page load only. This controller covers IN-APP navigation into a heavy 3D
// route and lifts on the target scene's real first frame (event-driven), with a
// safety timeout so it can never hang.
//
// API:
//   beginFade(readyEvent)  — light translucent dim for a home/pve hop
//   beginFightCard()       — full "Fight Card" cover for entering the arena
//   markSceneReady()       — target scene rendered its first frame (or safety)
//   end()                  — start the fade-out + tear the overlay down
//
// State is plain reactive UI state (no Vuex — it's throwaway transition state).
import { reactive } from 'vue';

const FADE_SAFETY_MS = 3000;       // home/pve hop never hangs past this
const FIGHTCARD_SAFETY_MS = 8000;  // arena entry never hangs past this
const LEAVE_MS = 280;              // must outlast the overlay's CSS leave (.2s)
const FIGHTCARD_HOLD_MS = 480;     // hold 100% before fading (mirrors splash done)
const TRICKLE_MS = 180;            // honest filler cadence toward 92

// mode  — 'none' | 'fade' | 'fightcard' (drives which visual the overlay shows)
// visible — gates the overlay v-if; flipped false first so the CSS leave can run
//           while `mode` still holds the visual (reset to 'none' after LEAVE_MS).
// progress — 0..100, only meaningful in 'fightcard'.
export const transitionState = reactive({
  mode: 'none',
  visible: false,
  progress: 0,
});

let safetyTimer = null;
let trickleTimer = null;
let holdTimer = null;
let cleanupTimer = null;
let readyEventName = null;
let readyListener = null;

function clearTimers() {
  if (safetyTimer) { clearTimeout(safetyTimer); safetyTimer = null; }
  if (trickleTimer) { clearInterval(trickleTimer); trickleTimer = null; }
  if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
  if (cleanupTimer) { clearTimeout(cleanupTimer); cleanupTimer = null; }
}

function detachReady() {
  if (readyListener && readyEventName) {
    window.removeEventListener(readyEventName, readyListener);
  }
  readyListener = null;
  readyEventName = null;
}

// Listen once for the target scene's real first-frame event. We rely on the
// EVENT (not the window latch) because the latch is sticky from a prior mount;
// the scene's per-mount latch re-emits the event on every fresh mount.
function attachReady(eventName) {
  detachReady();
  readyEventName = eventName;
  readyListener = () => markSceneReady();
  window.addEventListener(eventName, readyListener, { once: true });
}

export function beginFade(readyEvent) {
  clearTimers();
  // Drop stale readiness latches so a prior mount's flag can't dismiss early.
  window.__hexHomeReady = false;
  window.__hexPveReady = false;
  transitionState.mode = 'fade';
  transitionState.progress = 0;
  transitionState.visible = true;
  attachReady(readyEvent || 'hexlash:home-ready');
  safetyTimer = setTimeout(() => markSceneReady(), FADE_SAFETY_MS);
}

export function beginFightCard() {
  clearTimers();
  window.__hexArenaReady = false;
  transitionState.mode = 'fightcard';
  transitionState.progress = 0;
  transitionState.visible = true;
  attachReady('hexlash:arena-ready');
  safetyTimer = setTimeout(() => markSceneReady(), FIGHTCARD_SAFETY_MS);
  // Honest trickle toward 92 while the scene builds; the real first frame snaps
  // it to 100 (markSceneReady). Mirrors the page-load splash cadence.
  trickleTimer = setInterval(() => {
    if (transitionState.progress < 92) {
      transitionState.progress = Math.min(92, transitionState.progress + 1.5);
    }
  }, TRICKLE_MS);
}

export function markSceneReady() {
  if (transitionState.mode === 'none') return;
  detachReady();
  if (safetyTimer) { clearTimeout(safetyTimer); safetyTimer = null; }
  if (trickleTimer) { clearInterval(trickleTimer); trickleTimer = null; }
  if (transitionState.mode === 'fightcard') {
    transitionState.progress = 100;       // snap the counter home before fade
    holdTimer = setTimeout(() => end(), FIGHTCARD_HOLD_MS);
  } else {
    end();
  }
}

export function end() {
  clearTimers();
  detachReady();
  transitionState.visible = false;        // triggers the CSS leave transition
  // Keep `mode` (and the fightcard content) intact through the leave, then reset.
  cleanupTimer = setTimeout(() => {
    transitionState.mode = 'none';
    transitionState.progress = 0;
    cleanupTimer = null;
  }, LEAVE_MS);
}
