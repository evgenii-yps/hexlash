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

   Target average bout length: ~15–40s (Decisions Log 13.06). The escalating-
   damage safeguard guarantees a drawn-out bout still finishes near the top of
   that window (no ties — a bout always runs to an elimination). */
export const COMBAT_BALANCE = {
  // --- Scale: large numbers so the grade system's percentage bonuses read.
  maxHp: 4000, // booster HP (was 100) — крупные числа под процентные грани
  strikePower: 250, // базовая сила удара — панч снимает заметную, не гигантскую долю
  toughness: 200, // базовая прочность — кривая смягчения масштабируется от неё
  mobilityBase: 100, // масштаб читаемого mobility = round(mobilityBase × speedMul)

  // --- Per-move damage multipliers. Reads as the triad быстрый-слабый /
  //     двойной-средний / медленный-сильный — the COMBO is the most painful but
  //     already carries the slowest wind-up in its animation (risk / reward).
  moveMult: {
    punch: 1.0, // single jab — base
    doubleEach: 0.65, // jab–cross — two lighter hits, ≈1.3 in sum (чуть больше панча)
    combo: 1.7, // one heavy commit — the most painful single hit
  },
  jitter: 0.1, // ±10% per-blow variance on outgoing damage

  // --- Toughness softening: PERCENT mitigation of incoming damage, never a
  //     subtract-to-zero — a weak hit still chips through. Saturating curve
  //     soft = toughness / (toughness + K): more prochnost → more softening, with
  //     diminishing returns. At toughness=200, K=1200 → ~14% softening.
  toughnessK: 1200,

  // --- Fight-length safeguard: escalating damage. Past escalateStartSec the
  //     OVERALL damage multiplier on BOTH fighters ramps up (per second), so a
  //     stalling bout is guaranteed to finish around the top of the 15–40s window.
  //     No hard round cap needed while this is running; no ties.
  escalateStartSec: 30, // порог времени (с) — до него множитель = 1
  escalateGrowthPerSec: 0.18, // прирост общего множителя урона в секунду после порога
  escalateMax: 6, // потолок множителя (страховка от бесконечного роста)
};
