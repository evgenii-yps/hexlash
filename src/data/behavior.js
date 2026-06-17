/* HEXLASH — behaviour data-каркас. A fighter is mechanically 8 LEVERS ("axes"),
   each a 0..100 scale with 50 = neutral. The chosen CORE gives the starting
   profile of these levers (so the four cores fight differently for free); LIT
   FACETS shift the levers on top. This file is the SINGLE place to tune that:
   the axis definitions, the four core start-profiles, and the resolver that the
   arena reads. The axis → engine-knob mapping lives in scene/buildFighter.js
   (one seam there). Facet shift numbers are filled in a later pass — the
   contract is wired now, the values start empty (no-op).

   Axis meaning (0 … 100):
     distance   — 0 in-close      … 100 far out
     initiative — 0 waits         … 100 drives in at the foe
     tempo      — 0 rare singles  … 100 flurries
     weight     — 0 light/fast    … 100 heavy/slow
     stick      — 0 hits & leaves … 100 sticks and keeps pressing
     resilience — 0 glass         … 100 unshakable (cuts damage + holds rhythm)
     counter    — 0 passive       … 100 punishes the foe's opening
     slip       — 0 easy to hit   … 100 elusive (evade + spacing) */

export const AXES = [
  { id: 'distance', neutral: 50, desc: '0 in-close … 100 far out' },
  { id: 'initiative', neutral: 50, desc: '0 waits … 100 drives in' },
  { id: 'tempo', neutral: 50, desc: '0 rare singles … 100 flurries' },
  { id: 'weight', neutral: 50, desc: '0 light/fast … 100 heavy/slow' },
  { id: 'stick', neutral: 50, desc: '0 hits & leaves … 100 sticks' },
  { id: 'resilience', neutral: 50, desc: '0 glass … 100 unshakable' },
  { id: 'counter', neutral: 50, desc: '0 passive … 100 punishes' },
  { id: 'slip', neutral: 50, desc: '0 easy to hit … 100 elusive' },
];

export const AXIS_IDS = AXES.map((a) => a.id);

export const AXIS_MIN = 0;
export const AXIS_MAX = 100;
export const AXIS_NEUTRAL = 50;

/* Core start profiles (tunable). coreId → an 8-axis snapshot. ids match
   upgradeData CORES (natisk/nalet/skala/zasada). Draft numbers — turn here. */
export const CORE_PROFILES = {
  natisk: { distance: 15, initiative: 90, tempo: 80, weight: 55, stick: 85, resilience: 60, counter: 30, slip: 20 },
  nalet: { distance: 55, initiative: 70, tempo: 65, weight: 35, stick: 15, resilience: 35, counter: 45, slip: 65 },
  skala: { distance: 20, initiative: 25, tempo: 30, weight: 65, stick: 70, resilience: 90, counter: 60, slip: 15 },
  zasada: { distance: 80, initiative: 15, tempo: 20, weight: 75, stick: 20, resilience: 35, counter: 90, slip: 75 },
};

/* Clamp a lever back into 0..100. */
export const clampAxis = (v) => (v < AXIS_MIN ? AXIS_MIN : v > AXIS_MAX ? AXIS_MAX : v);

/* A core's start profile as a fresh 8-axis object. Unknown / empty id falls back
   to skala — mirrors getCore()'s BULWARK fallback so the arena stays sane when
   the pick is missing (the route guard normally blocks that). */
export function startProfile(coreId) {
  const base = CORE_PROFILES[coreId] || CORE_PROFILES.skala;
  const out = {};
  for (const id of AXIS_IDS) out[id] = clampAxis(base[id] == null ? AXIS_NEUTRAL : base[id]);
  return out;
}

/* resolveBehavior(coreId, litFacets) — PURE. Start from the core profile, apply
   every lit facet's flat `shifts` (each { axis, delta }), clamp, and gather the
   facet `effects` (tagged tricks) + `conditionals` for later coding. `litFacets`
   is the list of lit facet objects (each carrying { shifts, conditionals,
   effects } from upgradeData) — the caller pulls them from prefight.upgradeTree
   (player) or the core's CRYSTALS defaults (opponent).

   `statBonuses` sums every facet competence add into one fractions object: the
   "hard" branch ramp (`statBonus { stat, pct }` → strikePower / toughness) PLUS
   each facet's optional `extraBonuses [{ stat, pct }]` — the seam that feeds the
   non-ramp `sb.*` reads in buildFighter (blockPenetration, interruptResist, …).
   buildFighter applies each to its base (multiplicative or additive per stat).
   Facets without bonuses contribute nothing; keys no facet touches stay 0 → base.
   Naturally capped by the RESOURCE pool (можно зажечь не все грани).

   Returns { axes:{…8…}, effects:[…], conditionals:[…], statBonuses:{…} }. No side
   effects — easy to test and to call per fighter. */
export function resolveBehavior(coreId, litFacets = []) {
  const axes = startProfile(coreId);
  const effects = [];
  const conditionals = [];
  // statBonuses carries every facet competence add that buildFighter reads as a
  // `sb.*` seam: the hard-branch ramp (strikePower / toughness) PLUS per-facet
  // `extraBonuses` (blockPenetration, interruptResist; the charge / accuracy /
  // block-mitigation seams stay 0 until a later заход wires a grain to them). A
  // key no facet touches stays 0 → buildFighter falls back to the shared base.
  const statBonuses = {
    strikePower: 0, toughness: 0,
    blockPenetration: 0, interruptResist: 0,
    accuracy: 0, blockMitigation: 0,
    chargeMax: 0, chargeGain: 0, chargePower: 0, chargePen: 0,
  };
  const addBonus = (st, pct) => { if (st && statBonuses[st] != null) statBonuses[st] += pct || 0; };
  for (const f of litFacets) {
    if (!f) continue;
    for (const s of f.shifts || []) {
      if (s && AXIS_IDS.includes(s.axis)) axes[s.axis] = clampAxis(axes[s.axis] + (s.delta || 0));
    }
    for (const c of f.conditionals || []) conditionals.push(c);
    for (const e of f.effects || []) effects.push(e);
    if (f.statBonus) addBonus(f.statBonus.stat, f.statBonus.pct); // hard-branch ramp (one per facet)
    for (const eb of f.extraBonuses || []) addBonus(eb.stat, eb.pct); // per-facet seam bonuses (0+)
  }
  return { axes, effects, conditionals, statBonuses };
}
