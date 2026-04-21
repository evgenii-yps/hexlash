// Epic 3Bb Step 8 — Mock candidate generator for Matchmaking.
// Source: prototype hexlash_v24.html lines 10531-10613.
// Replaced by real backend API in Epic 4. Rescan reseeds via Date.now() —
// same-second rescans return identical picks (prototype-parity; not a bug).

const MY_ELO = 1247;

export const MM_POOL_NAMES = [
  'NoxGlass', 'Veridan', 'KorvusNet', 'Hale.03', 'Rev.Zero',
  'TineMara', 'Brixenth', 'UlvurVx', 'NovaTrack', 'Serpus',
  'Dahlman', 'Cartus.k', 'MarrowJin', 'Obeliskus', 'Echo.Ven',
  'SilentMarr', 'Firework.9', 'HornedDusk', 'Steelwren', 'ClangRow',
  'WillowFrost', 'BoneCaster', 'ObsidianVei', 'RustHexa', 'LatticeK',
  'MidHollow', 'Ragewire', 'WardenX', 'StillMarr', 'CliffnightR',
];

export const MM_ARCHS = [
  { id: 'pre', name: 'Predator',   colorHex: '#FF066F' },
  { id: 'ana', name: 'Analyst',    colorHex: '#4dd9ff' },
  { id: 'gho', name: 'Ghost',      colorHex: '#A855F7' },
  { id: 'sen', name: 'Sentinel',   colorHex: '#2ee07f' },
  { id: 'mav', name: 'Maverick',   colorHex: '#FFA133' },
  { id: 'jug', name: 'Juggernaut', colorHex: '#D4A843' },
];

export const MM_BELTS = ['White', 'Yellow', 'Orange', 'Green'];

function mmPick(arr, rng) {
  return arr[Math.floor(rng() * arr.length)];
}

// Mulberry32-style seeded PRNG. Deterministic for a given seed so rescans
// within the same millisecond window are reproducible.
function mmSeed(s) {
  return function () {
    s |= 0;
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateCandidates(mmState) {
  const rng = mmSeed(Date.now() & 0xffffff);
  const range = mmState.eloDelta;
  const minElo = MY_ELO - range;
  const maxElo = MY_ELO + range;

  // 3-6 candidates.
  const count = 3 + Math.floor(rng() * 4);
  const used = new Set();
  const out = [];

  for (let i = 0; i < count; i++) {
    // Unique name pick — up to 20 retries, then accept whatever.
    let name;
    let tries = 0;
    do {
      name = MM_POOL_NAMES[Math.floor(rng() * MM_POOL_NAMES.length)];
      tries++;
    } while (used.has(name) && tries < 20);
    used.add(name);

    // Arch + belt obey filters; 'any' = random.
    let arch;
    if (mmState.archFilter === 'any') {
      arch = mmPick(MM_ARCHS, rng);
    } else {
      arch = MM_ARCHS.find((a) => a.id === mmState.archFilter) || mmPick(MM_ARCHS, rng);
    }

    const belt = (mmState.beltFilter === 'any')
      ? mmPick(MM_BELTS, rng)
      : mmState.beltFilter;

    const elo = minElo + Math.floor(rng() * (maxElo - minElo));
    const wins = 5 + Math.floor(rng() * 40);
    const losses = 2 + Math.floor(rng() * 30);
    const wr = Math.round(100 * wins / (wins + losses));
    const streakN = Math.floor(rng() * 7);
    const streakKind = rng() < 0.65 ? 'W' : 'L';

    // Difficulty vs myElo. Thresholds match prototype 10601-10603.
    const diff = elo - MY_ELO;
    let diffLabel = 'Even';
    let diffClass = 'even';
    if (diff < -50) { diffLabel = 'Easier'; diffClass = 'easy'; }
    else if (diff > 50) { diffLabel = 'Harder'; diffClass = 'hard'; }

    out.push({
      name, arch, belt, elo, wins, losses, wr,
      streak: { n: streakN, kind: streakKind },
      diff, diffLabel, diffClass,
      initials: name.slice(0, 2).toUpperCase(),
    });
  }

  // Strongest first.
  out.sort((a, b) => b.elo - a.elo);
  return out;
}
