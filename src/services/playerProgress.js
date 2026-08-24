// Player progress — the player's own work, kept across a page refresh.
//
// WHY per-tab (sessionStorage) and not the ordinary browser store:
//   • refresh (F5) — progress survives  ✅ (the whole point of this layer)
//   • tab closed   — progress is gone   ✅ (guest progress is explicitly temporary;
//                                          permanent progress needs an account)
//   • second tab   — its own copy       ✅ (two tabs can never corrupt each other,
//                                          no cross-tab sync to get wrong)
// localStorage would keep a guest's build alive after the tab is closed, which is
// NOT what a guest is promised (see the note on the upgrade screen).
//
// WHY synchronous storage and not IndexedDB: the restore has to be finished
// BEFORE the router's `requireCore` guard runs, otherwise a refresh on
// /play/upgrade or /play/arena bounces the player back to core select while the
// (async) read is still in flight. sessionStorage answers instantly.
//
// SHAPE — one snapshot, split into named sections. Today only `prefight` exists
// (chosen core + lit facets). Roster / resource / fight history get their own
// sections later WITHOUT touching this file:
//   { v: 1, prefight: { core: 'natisk', lit: { a: [1,2], c: [5] } } }
// Sections store the SMALLEST honest thing (ids, not whole trees): a build is
// ~65 bytes this way vs ~3.5 KB if the working tree were dumped verbatim, and
// it keeps working when the facet content in upgradeData.js changes.
//
// FAILURE POLICY (deliberate, see ТЗ §4):
//   • storage blocked (private mode / quota / browser setting) → the game runs
//     exactly as before, just without saving. Noted once, never per write.
//   • stored data corrupt or from an older version → start clean, like a new
//     player. Never try to repair half-broken progress.

const KEY = 'hexlash_progress';
const VERSION = 1;

// No in-memory cache of the snapshot ON PURPOSE. A cache would have to be kept
// in sync with the store, and the one caller that matters most — the route
// guard, which decides whether a refresh keeps the player where they are —
// would then be reading a stale copy instead of the truth. The payload is ~60
// bytes and the storage is synchronous, so re-reading costs nothing measurable.
let available = true;    // flips false the first time storage refuses us
let noticed = false;     // the "saving is off" notice is printed once, not per write

function storage() {
  // Touching window.sessionStorage itself can throw (some privacy settings).
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null;
  } catch (_) {
    return null;
  }
}

function noteUnavailable(reason) {
  available = false;
  if (noticed) return;
  noticed = true;
  // Not an error for the player: the game is fully playable, it just forgets.
  console.info('[hexlash] progress saving is unavailable in this browser —', reason);
}

function load() {
  const s = storage();
  if (!s) { noteUnavailable('no session storage'); return {}; }

  let raw = null;
  try {
    raw = s.getItem(KEY);
  } catch (e) {
    noteUnavailable(e && e.name ? e.name : 'read blocked');
    return {};
  }
  if (!raw) return {};

  let parsed = null;
  try {
    parsed = JSON.parse(raw);
  } catch (_) {
    parsed = null;
  }

  // Corrupt, not an object, or written by an older/newer build → start clean.
  if (!parsed || typeof parsed !== 'object' || parsed.v !== VERSION) {
    try { s.removeItem(KEY); } catch (_) { /* nothing to do — we start clean anyway */ }
    return {};
  }

  return parsed;
}

function flush(snapshot) {
  if (!available) return;
  const s = storage();
  if (!s) { noteUnavailable('no session storage'); return; }
  try {
    s.setItem(KEY, JSON.stringify({ ...snapshot, v: VERSION }));
  } catch (e) {
    // Quota exceeded / write blocked. Keep playing, stop pretending we save.
    noteUnavailable(e && e.name ? e.name : 'write blocked');
  }
}

/** Read one named section of the snapshot. Returns null when absent/unusable. */
export function readSection(name) {
  const section = load()[name];
  return section && typeof section === 'object' ? section : null;
}

/**
 * Write one named section. Pass null/undefined to drop it.
 * Writes are tiny and happen on real player actions (pick a core, light a
 * facet) — never inside a render or fight loop, so there is nothing to debounce.
 */
export function writeSection(name, data) {
  const snapshot = load();
  if (data === null || data === undefined) delete snapshot[name];
  else snapshot[name] = data;
  flush(snapshot);
}

/** Forget everything (used when progress is deliberately reset). */
export function clearProgress() {
  const s = storage();
  if (!s) return;
  try { s.removeItem(KEY); } catch (_) { /* already effectively cleared */ }
}

/** False when the browser refuses to store — lets a screen stay honest about it. */
export function isProgressSaved() {
  load();          // touching storage is what tells us whether it works at all
  return available;
}
