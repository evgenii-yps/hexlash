// Epic 5 — Sub-Epic 5C Step 7.
// Client-side mock leaderboard data for /v2/ratings.
// Port from prototype hexlash_v24.html 10188-10272 (Mulberry32 seedable RNG).
// Real API wiring deferred to PvP-integration sub-epic (after 5G).
//
// NOTE: short-IDs ('pre', 'ana', ...) match arch-tag-{id} CSS classes in
// create.css (app-wide .app-v2 scope). Real user data from
// master.userData.captain.primaryModule is a full name (e.g. 'predator');
// HudRatings.vue uses archetypeIdShort() to map full name → short id for
// the sticky your-row (Step 8).

const RATINGS_ARCHS = [
  { id: 'pre', name: 'Predator' },
  { id: 'ana', name: 'Analyst' },
  { id: 'gho', name: 'Ghost' },
  { id: 'sen', name: 'Sentinel' },
  { id: 'mav', name: 'Maverick' },
  { id: 'jug', name: 'Juggernaut' },
];

const BELTS = ['White', 'Yellow', 'Orange', 'Green', 'Blue', 'Purple', 'Brown', 'Black'];

// 40 names — prototype 10198-10207 verbatim. Enough for scroll in Global
// (n=40) + overflow suffix for larger lists (see generateLeaderboard).
const TOP_NAMES = [
  'LordNoctis', 'Kestrel.7', 'Crowhaven', 'SablePrey', 'RuinPact',
  'Vex.01', 'HaloRune', 'SlateWolf', 'Frost.X', 'EchoVein',
  'NobleRust', 'WraithMk2', 'EmberGrit', 'DuskFenrir', 'RazorHowl',
  'TraceBurn', 'NovaKell', 'GhostGrid', 'ObsidianK', 'SpecterLine',
  'CobaltCrow', 'Mire.99', 'AshenVow', 'HollowStrk', 'VanguardX',
  'PulseWard', 'CinderFox', 'CipherRiot', 'ThornyEdge', 'MidnightRai',
  'SleetProxy', 'VeilRune', 'FrayedHook', 'StillStorm', 'BoneEtcher',
  'QuietRiot', 'BlackWire', 'AconiteK', 'TesselV', 'SpireJade',
];

function seedRng(seed) {
  // Mulberry32 — prototype 10218-10225 verbatim.
  return function () {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateLeaderboard(seed, n) {
  const rng = seedRng(seed);
  const rows = [];
  let elo = 2060;
  for (let i = 0; i < n; i++) {
    elo -= Math.floor(rng() * 14) + 2;
    const archIdx = Math.floor(rng() * RATINGS_ARCHS.length);
    const wins = 20 + Math.floor(rng() * 180);
    const losses = Math.max(2, Math.floor(wins * (0.25 + rng() * 0.5)));
    const wr = wins / (wins + losses);
    const streak = Math.floor(rng() * 9);
    const streakKind = rng() < 0.65 ? 'W' : 'L';
    const beltIdx = Math.min(BELTS.length - 1, Math.floor((elo - 1000) / 150));
    rows.push({
      rank: i + 1,
      handle: TOP_NAMES[i % TOP_NAMES.length] +
        (i >= TOP_NAMES.length ? String(Math.floor(rng() * 90) + 10) : ''),
      arch: RATINGS_ARCHS[archIdx],
      belt: BELTS[Math.max(0, beltIdx)],
      elo,
      wins,
      losses,
      wr: Math.round(wr * 100),
      streak: { n: streak, kind: streakKind },
    });
  }
  return rows;
}

// 10 pre-generated datasets — 5 scopes × 2 seasons.
// Prototype 10262-10271 ships 8 (global/friends/clan/country × s1/all).
// 'live' added here for the Live tab (smaller, simulates "currently
// active"). Real API would push diff; mock swap keeps the UI exercised.
export const RATINGS_DATA = {
  'global|s1': generateLeaderboard(101, 40),
  'global|all': generateLeaderboard(202, 40),
  'friends|s1': generateLeaderboard(303, 12),
  'friends|all': generateLeaderboard(404, 12),
  'clan|s1': generateLeaderboard(505, 18),
  'clan|all': generateLeaderboard(606, 18),
  'country|s1': generateLeaderboard(707, 28),
  'country|all': generateLeaderboard(808, 28),
  'live|s1': generateLeaderboard(909, 8),
  'live|all': generateLeaderboard(1010, 8),
};
