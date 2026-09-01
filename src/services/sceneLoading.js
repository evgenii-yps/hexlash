// Unified loading screen — ONE cover for every heavy 3D entry, and one honest
// answer to "is the scene actually there yet?".
//
// It replaces the old sceneTransition controller, which had two visuals (a light
// dim + a full "Fight Card") and lifted on a scene's FIRST rendered frame. That
// first frame is submitted in the same synchronous tick the scene finishes
// building — before the browser has composited it, before Three.js has finished
// lazily compiling shaders and uploading textures, and before the ResizeObserver's
// initial callback has re-fitted the canvas. So the player watched the scene
// assemble. Now a scene must declare its build stages, mark them as it passes
// them, and render three CONSECUTIVE settled frames before it may claim ready.
//
// ── The contract, scene side ───────────────────────────────────────────────
//   const load = beginSceneLoad(['renderer', 'slab', 'fighter']);
//   ... build ...            load.stage('renderer');
//   ... in the render loop, AFTER renderer.render():   load.frame();
//   ... whenever the scene re-fits itself (resize):    load.unsettle();
//   ... onBeforeUnmount:                               load.dispose();
//
// ── The contract, shell side ───────────────────────────────────────────────
//   openLoading(routeName, { surface })  — router / bootstrap raises the screen
//   cancelLoading()                      — navigated away; drop it, drop the wait
//   loadingState                         — what the two surfaces render
//
// TWO surfaces render this ONE state, because the very first paint has to happen
// before the bundle exists: 'splash' is #hx-load in index.html (driven from
// src/main.js), 'overlay' is SceneLoadingOverlay.vue. They are the same picture;
// which one is up is an implementation detail of WHEN, not WHAT.
import { reactive } from 'vue';

// ── The three numbers the player feels. All of them, in one place. ─────────
export const LOADING = {
  MIN_SHOW_MS: 600,    // floor on how long the screen is up (kills the flash)
  FADE_OUT_MS: 200,    // opacity leave — both surfaces, same duration
  SAFETY_MS: 15000,    // hard release; logs which stage never finished
};

// Stages own 0..95. The last 5 belong to stabilisation, so the bar is still
// visibly alive while the scene settles and nothing has to lie to fill it.
const STAGE_CEILING = 95;
// Consecutive settled frames before a scene may claim readiness. This is the
// whole fix: one frame is "drawn", three in a row is "standing still".
const STABLE_FRAMES = 3;
// Waiting on a stage, the bar creeps this far into the gap to the next one and
// stops. It may not reach the gap's end — arriving there would claim a stage
// that has not happened.
const CREEP_GAP = 0.9;
const CREEP_MS = 120;
// An implicit first stage, prepended to whatever the scene declares and marked
// done the moment it declares. It stands for work that really happened and that
// the scene cannot report on its own: the route's chunk was fetched and parsed
// and its component is now executing. On a cold cache that is the largest single
// step of a hop, and leaving it unreported is what left the bar sitting near zero
// and then snapping.
const MOUNT_STAGE = '\u2014mount';

// active   — a screen is up (gates the overlay, and the splash's hold)
// surface  — 'splash' | 'overlay' | null (which element is painting it)
// progress — 0..100, monotonic WITHIN one load; a new load starts from zero
export const loadingState = reactive({
  active: false,
  surface: null,
  progress: 0,
});

// ── Session state. Plain module locals — only `loadingState` needs to be
//    reactive, and a token is cheaper (and harder to misread) than a ref. ─────
//
// The SCREEN (sessionId) and the SCENE's build TRACK (trackToken) are separate
// counters on purpose. Which of the two starts first is not something this file
// should have to know: on an in-app hop the router raises the screen and the
// component mounts after it, but on a cold page load the initial navigation and
// the first render settle in the same microtask flush, and the order there is a
// Vue-internal detail that could change under us. So a scene may declare its
// stages before any screen exists — it becomes a PENDING track (trackOwner 0),
// and the next openLoading adopts it instead of wiping it. Either order works,
// and nothing has to be timed.
let sessionId = 0;        // bumped by every open/cancel; orphans stale handles
let trackToken = 0;       // bumped by every scene declaration
let trackOwner = 0;       // sessionId owning the track; 0 = declared, no screen yet
let routeLabel = null;    // for the safety log only
let stages = [];          // declared names, in build order
let completed = new Set();
let stable = 0;           // consecutive settled frames
let ready = false;
let shownAt = 0;
let baseline = 0;         // progress already earned before the scene started
let releaseWhenVisible = false;

function resetTrack() {
  trackToken += 1;
  trackOwner = 0;
  stages = [];
  completed = new Set();
  stable = 0;
  ready = false;
}

let creepTimer = null;
let safetyTimer = null;
let minShowTimer = null;
let cleanupTimer = null;

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

function clearTimers() {
  if (creepTimer) { clearInterval(creepTimer); creepTimer = null; }
  if (safetyTimer) { clearTimeout(safetyTimer); safetyTimer = null; }
  if (minShowTimer) { clearTimeout(minShowTimer); minShowTimer = null; }
  if (cleanupTimer) { clearTimeout(cleanupTimer); cleanupTimer = null; }
}

// The only writer of `progress`, and it only ever goes up. Every "the bar jumped
// backwards" bug class is closed here rather than at each call site.
function bump(v) {
  const n = Math.max(0, Math.min(100, v));
  if (n > loadingState.progress) loadingState.progress = n;
}

const doneCount = () => (completed ? completed.size : 0);
const total = () => stages.length;
const allStagesIn = () => total() > 0 && doneCount() >= total();

// Stages fill the band between what was already earned and the ceiling. On a cold
// load `baseline` is the bootstrap's real progress (bundle parsed → store ready →
// app mounted); those milestones are as true as the scene's own, and starting the
// scene's count from zero underneath them is exactly how a bar ends up going
// backwards. On an in-app hop there is no such prelude and the baseline is 0.
const band = () => STAGE_CEILING - baseline;
// Value the bar has EARNED: the share of stages actually finished.
function stageFloor() {
  return total() ? baseline + (doneCount() / total()) * band() : baseline;
}
// Value the next unfinished stage would earn. The bar may approach this and wait,
// never pass it.
function stageCeil() {
  return total() ? baseline + (Math.min(doneCount() + 1, total()) / total()) * band() : STAGE_CEILING;
}

// Honest filler: the bar keeps moving so it never reads as frozen, but it is
// always crawling toward a ceiling it cannot cross. Stages have not been reached
// yet? Then the number says so.
function creepTick() {
  if (ready) return;
  let target;
  if (!total()) {
    // A screen is up but no scene has declared itself yet (the component has not
    // mounted). Hold just above the baseline — there is nothing else to report yet.
    target = baseline + band() * 0.08;
  } else if (allStagesIn()) {
    // Stabilisation band: 95 → 99 as the settled frames come in. The last point
    // belongs to the lift itself.
    target = STAGE_CEILING + (99 - STAGE_CEILING) * (stable / STABLE_FRAMES);
  } else {
    const floor = stageFloor();
    target = floor + (stageCeil() - floor) * CREEP_GAP;
  }
  if (target <= loadingState.progress) return;
  const step = Math.max(0.35, (target - loadingState.progress) * 0.18);
  bump(Math.min(target, loadingState.progress + step));
}

function onSafety() {
  const stalled = stages.find((s) => s !== MOUNT_STAGE && !completed?.has(s));
  console.warn(
    `[hexlash] loading safety net fired after ${LOADING.SAFETY_MS}ms on "${routeLabel || 'unknown route'}" — ` +
    (total()
      ? `stage "${stalled || '(all stages in)'}" never completed` +
        (stalled ? '' : `; only ${stable}/${STABLE_FRAMES} settled frames arrived`)
      : 'the scene never declared its stages (did it fail to mount?)'),
  );
  ready = true;
  release();
}

function markReady() {
  if (ready && minShowTimer) return;   // already counting down to the lift
  ready = true;
  if (!loadingState.active) return;    // pending track — the adopting open re-arms this
  if (creepTimer) { clearInterval(creepTimer); creepTimer = null; }
  // Built faster than the eye can follow? Hold anyway — a screen that flashes for
  // 80ms reads as a glitch, which is worse than the wait it saved.
  const waited = now() - shownAt;
  minShowTimer = setTimeout(release, Math.max(0, LOADING.MIN_SHOW_MS - waited));
}

function release() {
  if (!loadingState.active) return;
  // Released while the tab is in the background: hold it. Coming back to a screen
  // that vanishes under your eyes is the jerk we are trying to avoid — and the
  // scene has not been rendering, so it may well not be settled either.
  if (typeof document !== 'undefined' && document.hidden) {
    releaseWhenVisible = true;
    return;
  }
  clearTimers();
  releaseWhenVisible = false;
  // 100 and the lift are ONE moment: the number is only allowed to say "done"
  // while the screen is actually going away.
  loadingState.progress = 100;
  loadingState.active = false;
  cleanupTimer = setTimeout(() => {
    loadingState.surface = null;
    cleanupTimer = null;
  }, LOADING.FADE_OUT_MS + 40);
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && releaseWhenVisible) release();
  });
}

// ── Shell side ─────────────────────────────────────────────────────────────

// Raise the screen for a heavy 3D entry. Every call starts a CLEAN load: a new
// token (which orphans any handle the outgoing scene still holds) and the bar back
// to its baseline. Rapid hops therefore each get their own honest bar rather than
// inheriting the last one's.
//
// `from` — progress already honestly earned before this call: on a cold load the
// bootstrap milestones (bundle parsed → store ready → app mounted). The scene's
// stages fill upward from there, so the one number the player watches never has
// two writers fighting over it and never restarts under itself.
export function openLoading(routeName, { surface = 'overlay', from = 0 } = {}) {
  clearTimers();
  sessionId += 1;
  routeLabel = routeName || null;
  // A scene that declared itself before the screen went up keeps its stages —
  // wiping them here would throw away real progress and leave the bar with
  // nothing to report for the rest of the load.
  const adopting = trackOwner === 0 && stages.length > 0;
  if (adopting) trackOwner = sessionId;
  else resetTrack();
  releaseWhenVisible = false;
  baseline = Math.max(0, Math.min(STAGE_CEILING - 1, from));
  loadingState.progress = baseline;
  loadingState.surface = surface;
  loadingState.active = true;
  shownAt = now();
  if (adopting) bump(stageFloor());
  // First load hands over to the SPA overlay: take the page-load splash off in
  // the same tick so the two never stack (they are the same picture, and a
  // crossfade between identical pictures is just a flicker).
  if (surface === 'overlay' && typeof window !== 'undefined') window.HexlashLoader?.handoff?.();
  creepTimer = setInterval(creepTick, CREEP_MS);
  safetyTimer = setTimeout(onSafety, LOADING.SAFETY_MS);
  // Adopted a track that had already settled: honour it now, so the minimum
  // show time is the only thing left between the player and the scene.
  if (ready) markReady();
  return sessionId;
}

// Navigated away mid-load (back button, a guard bouncing an entry). Drop the
// screen and the wait; the token bump means a late signal from the abandoned
// scene can never dismiss the NEXT load's screen.
export function cancelLoading() {
  if (!loadingState.active) { resetTrack(); return; }
  sessionId += 1;
  resetTrack();
  ready = true;
  release();
}

// A Vue component threw (wired to app.config.errorHandler in main.js). A crashed
// scene will never signal, so let the player out now instead of after the full
// safety wait — the console already carries the real error.
export function noteSceneError(info) {
  if (!loadingState.active) return;
  console.warn(`[hexlash] releasing the loading screen early — a component failed (${info || 'unknown'})`);
  cancelLoading();
}

// ── Scene side ─────────────────────────────────────────────────────────────

// Declare this scene's build stages and get the handle that drives them. Called
// from onMounted.
//
// Mounting with NO screen up is legal and does the right thing in both readings:
//   · a route nobody covers (/dev/lab, a hot reload) — the handle simply drives
//     a track no surface is showing, and the scene behaves exactly as before;
//   · a cold load where the first render beat the bootstrap to it — the track is
//     left PENDING and the openLoading that follows adopts it, stages and all.
// So this never has to know whether the screen came first.
export function beginSceneLoad(stageNames) {
  resetTrack();
  const mine = trackToken;
  trackOwner = loadingState.active ? sessionId : 0;   // 0 ⇒ pending, adoptable
  stages = [MOUNT_STAGE, ...(Array.isArray(stageNames) ? stageNames : [])];
  completed.add(MOUNT_STAGE);   // getting here IS the milestone
  if (loadingState.active) bump(stageFloor());

  // Live while this is still THE track and no newer screen has taken over.
  const live = () => mine === trackToken && (trackOwner === 0 || trackOwner === sessionId);

  return {
    // Mark a build stage finished. Idempotent; an undeclared name is a wiring
    // bug, so say so rather than silently skewing the bar.
    stage(name) {
      if (!live() || ready) return;
      if (name === MOUNT_STAGE || !stages.includes(name)) {
        console.warn(`[hexlash] undeclared load stage "${name}" on "${routeLabel}"`);
        return;
      }
      if (completed.has(name)) return;
      completed.add(name);
      bump(stageFloor());
    },
    // One rendered frame. Only counts once every stage is in — before that the
    // scene is still being built, so "settled" means nothing.
    frame() {
      if (!live() || ready || !allStagesIn()) return;
      stable += 1;
      if (stable >= STABLE_FRAMES) markReady();
    },
    // The scene just changed something under itself (a resize re-fit, a rebuild).
    // Those three frames have to be three frames of the SAME picture, so start
    // the count again.
    unsettle() {
      if (!live() || ready) return;
      stable = 0;
    },
    dispose() {
      if (!live()) return;   // a newer load already owns the screen — leave it be
      cancelLoading();       // (also clears a pending track, so it is never adopted)
    },
  };
}
