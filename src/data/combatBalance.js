/* HEXLASH — combat balance.  BALANCE — tunable.
   SINGLE tuning point for the fight's NUMBERS — every balance constant the
   damage model touches lives here, so the maths can be crutened in one place
   without hopping between files. Imported by scene/buildFighter.js (stats sheet
   + strike damage + toughness softening + booster HP) and scene/ArenaScene.vue
   (the fight-length safeguard). These are STARTING orientations, not final —
   tune freely; they're meant to be crunched once the grade system lays its
   percentage bonuses on top of the three characteristics.

   Fighter characteristics sheet (per fighter):
     strikePower — how hard this fighter hits (drives outgoing damage)
     toughness   — how well it shrugs hits (softens incoming damage, never to 0)
     mobility    — speed/manoeuvre — REFLECTS the existing weight→speed mapping
                   (speedMul) in buildFighter; NOT a second movement system, just
                   a readable number for the sheet (mobilityBase is its scale).

   Target average bout length: ~40–50s (~16–17 landed hits, neutral vs neutral).
   The escalating-damage safeguard only kicks in PAST escalateStartSec, so it
   guarantees a STALLING bout still finishes (no ties — a bout always runs to an
   elimination) without cutting a normal 40–50s bout short. */
export const COMBAT_BALANCE = {
  // --- Scale: large numbers so the grade system's percentage bonuses read.
  maxHp: 4000, // booster HP (was 100) — крупные числа под процентные грани
  strikePower: 180, // базовая сила удара (был 250) — на нейтрале панч ≈3% HP, бой ~16–17 ударов
  toughness: 200, // базовая прочность — кривая смягчения масштабируется от неё
  mobilityBase: 100, // масштаб читаемого mobility = round(mobilityBase × speedMul)

  // --- Per-move damage multipliers. The triad быстрый-слабый / двойной-средний /
  //     медленный-сильный — on a NEUTRAL target each move lands ≈ punch 3% /
  //     double 8% (two hits summed) / combo 11% of max HP (the design triad
  //     3/8/11). The COMBO is the most painful single hit but carries the slowest
  //     wind-up in its animation (risk / reward). Per-impact ratios punch :
  //     doubleEach : combo = 1 : 1.33 : 3.67 — double's TWO hits sum to ≈2.7× a
  //     punch, so a jab–cross clearly beats a single jab. Jitter (below) stays
  //     well under the gaps, so a high-rolled punch never reaches a double.
  moveMult: {
    punch: 1.0, // single jab — base (~3% HP felt on neutral)
    doubleEach: 1.33, // jab–cross — two hits, EACH stronger than a jab; ≈8% HP summed (был 0.65)
    combo: 3.67, // one heavy commit — the most painful single hit, ~11% HP (был 1.7)
  },
  jitter: 0.1, // ±10% per-blow variance on outgoing damage — proportional to each move's base, below the inter-move gaps

  // --- Grade (facet) bonus ramp by depth (1→5). PERCENT (fraction) added to the
  //     facet's target characteristic on the "hard" branches — strikePower
  //     (RAM / HUNT / STING) and toughness (BASTION / BREAKER). A new layer ON
  //     TOP of the facet's existing behaviour shifts (those are untouched). The
  //     vertex (depth 5) jumps. Naturally capped by the RESOURCE pool (можно
  //     зажечь не все грани). Starting orientation, tunable.
  //       depth 1 ≈ 4% · 2 ≈ 7% · 3 ≈ 10% · 4 ≈ 14% · 5/вершина ≈ 22%
  gradeBonusRamp: [0.04, 0.07, 0.1, 0.14, 0.22],

  // --- Toughness softening: PERCENT mitigation of incoming damage, never a
  //     subtract-to-zero — a weak hit still chips through. Saturating curve
  //     soft = toughness / (toughness + K): more prochnost → more softening, with
  //     diminishing returns. At toughness=200, K=1200 → ~14% softening.
  toughnessK: 1200,

  // --- Fight-length safeguard: escalating damage. Past escalateStartSec the
  //     OVERALL damage multiplier on BOTH fighters ramps up (per second), so a
  //     stalling bout is guaranteed to finish past the ~40-50s target window.
  //     No hard round cap needed while this is running; no ties.
  escalateStartSec: 40, // порог времени (с) — до него множитель = 1 (нормальный бой ~40-50s укладывается, страховка только от затягивания; был 30)
  escalateGrowthPerSec: 0.18, // прирост общего множителя урона в секунду после порога
  escalateMax: 6, // потолок множителя (страховка от бесконечного роста)
};
