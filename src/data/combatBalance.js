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
  accuracy: 50, // базовая ТОЧНОСТЬ бойца (0..100, общая база; пока грани её не двигают). Компетенция, не ось манеры — двигает шанс промаха.

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

  // --- Slip → reflex dodge. Per-incoming-hit chance the defender FULLY evades a
  //     hit (0 damage, no stagger, plays the existing DODGE animation). A pure
  //     body reflex — fires on probability from the defender's slip axis (0..100),
  //     no player input, no resource / cooldown (fatigue may cap it in a later
  //     pass). Each incoming impact rolls its own check, so a DOUBLE / COMBO gives
  //     several chances in a row. Chance = dodgeChanceMax × (slip/100)^dodgeChanceCurve:
  //     slip 0 → ~0%, slip 100 → dodgeChanceMax. Capped BELOW 1 so a bout always
  //     finishes even at max slip (no invulnerable fighter). Tunable.
  //       slip 15 ≈ 3% · 65 ≈ 29% · 75 ≈ 36% · 100 = 55%  (at max 0.55, curve 1.5)
  dodgeChanceMax: 0.55, // потолок шанса уворота при slip=100 (бой обязан доигрываться)
  dodgeChanceCurve: 1.5, // показатель кривой (slip/100)^curve — >1 «заднегружёная»: низкий slip уворачивается почти никогда

  // --- Accuracy → attacker MISS. Per-impact chance the ATTACKER's own strike
  //     goes wide (the fist doesn't connect) — rolled BEFORE the defender's dodge
  //     and independent of the defender. A competence, not a movement axis. At the
  //     neutral accuracy (accuracyMid) the chance is missChanceBase; the attacker's
  //     accuracy swings it (high → almost never, low → more often) by
  //     accuracyMissSwing, clamped [missChanceFloor, missChanceCap] so even a
  //     sloppy fighter still lands enough — the bout always finishes. Rolled per
  //     impact, so a DOUBLE / COMBO rolls each hit on its own. Tunable.
  //       acc 100 → 0% · acc 50 → 10% · acc 0 → 20%   (base 0.10, swing 0.20)
  missChanceBase: 0.1, // базовый шанс промаха на нейтральной точности
  accuracyMid: 50, // нейтральная точность → ровно missChanceBase
  accuracyMissSwing: 0.2, // насколько ±точность (на полную шкалу 0..100) двигает шанс промаха
  missChanceFloor: 0.0, // минимум (идеальная точность может не мазать вовсе)
  missChanceCap: 0.35, // потолок — даже мазила достаточно попадает (бой обязан доигрываться)

  // --- Block stance. A held defensive POSE (not a dodge): while the defender is
  //     in stance, a hit that ALREADY landed (not missed, not dodged) is SOFTENED
  //     — resolved in takeDamage AFTER the dodge roll, BEFORE HP loss. Cuts ~half,
  //     never to zero (stays penetrable — that's what separates it from a dodge).
  //     Final cut = blockMitigation × (1 − blockPenetration of the ATTACKER). Both
  //     are crutening seams: blockMitigation = defender's block STRENGTH (shared
  //     base; a future facet may raise it), blockPenetration = attacker's PIERCE
  //     (shared base 0; a future grain like ТАРАН-2 «хуже блокируется» may raise
  //     it) — neither wired to facets yet. No resource / cooldown (fatigue later).
  blockMitigation: 0.5, // доля урона, срезаемая стойкой (≈половина, НЕ в ноль)
  blockPenetration: 0.0, // пробитие блока атакующим (база 0; ШОВ под будущую грань)

  // --- Reflex block tendency (TEMPORARY spinal cord). Per incoming attack, the
  //     chance the defender raises its guard for that exchange, from its LIVE
  //     (base + ДЕРЖАТЬ) resilience + stick — dug-in cores guard often, brash ones
  //     almost never; a ДЕРЖАТЬ call (resilience/stick ↑) naturally lifts it and it
  //     falls again as the call expires. resilience-led so a high-stick presser
  //     doesn't read as a turtle. Clamped to blockTendencyMax so a bout finishes.
  //     This is the ONLY knob of the throwaway reflex — the model's «brace» intent
  //     replaces the TRIGGER later, leaving stance / mitigation / event untouched.
  //       skala ≈ 0.60 · natisk ≈ 0.46 · nalet/zasada ≈ 0.22   (res-led)
  blockTendencyBase: 0.0,
  blockTendencyResWeight: 0.55, // вклад resilience01 в тяготение к блоку
  blockTendencyStickWeight: 0.15, // вклад stick01 (меньше — наглый прессер не «черепаха»)
  blockTendencyMax: 0.65, // потолок частоты блока
  blockHoldSec: 1.4, // как долго держится рефлекторная стойка на обмен (с; покрывает импакт COMBO)

  // --- Stamina (запас сил). A per-fighter pool spent on actions, recovered at
  //     rest. Low stamina SMOOTHLY weakens + slows attacks (a curve, NOT a hard
  //     lockout — a spent fighter still acts, just sluggishly). Start full. The
  //     pool is read externally (buildFighter.getStamina*) — the seam ТЕНЬ-3
  //     «враг выматывается, гоняясь» (chasing already drains it via the move cost
  //     below; that facet later amplifies). A future «копит заряд» (ОХОТА/ЖАЛО)
  //     charge stat would hook ALONGSIDE this (not built — facet layer). Fatigue
  //     could later also cut dodge / block (left as a seam, NOT wired, so the
  //     fight isn't penalised on every axis at once). All numbers tunable.
  staminaMax: 100, // полный запас
  staminaRegenPerSec: 14, // восстановление в покое / в стойке (собран, не атакует, не идёт)
  staminaMoveDrainPerSec: 6, // трата на перемещение (× доля от макс. скорости) — преследование выматывает
  staminaCostPunch: 6, // джеб — дёшево
  staminaCostDouble: 11, // двойка — дороже
  staminaCostCombo: 16, // комбо — дороже всего (списывается на старте приёма)
  // Low-stamina penalty (smooth, по кривой). Power: full → ×1, empty → floor.
  // Cadence: full → ×1 пауза между атаками, empty → ×stretchMax (реже бьёт).
  // Floors подобраны так, чтобы выдохшийся боец был слабее, но бой не вис
  // (эскалация добивает затяг).
  staminaPowerFloor: 0.55, // множитель к strikePower при пустом запасе
  staminaCadenceStretchMax: 1.8, // во столько растягивается пауза между атаками при пустом
  staminaPenaltyCurve: 1.0, // показатель кривой fatigue→штраф (1 = линейно)

  // --- Fight-length safeguard: escalating damage. Past escalateStartSec the
  //     OVERALL damage multiplier on BOTH fighters ramps up (per second), so a
  //     stalling bout is guaranteed to finish past the ~40-50s target window.
  //     No hard round cap needed while this is running; no ties.
  escalateStartSec: 40, // порог времени (с) — до него множитель = 1 (нормальный бой ~40-50s укладывается, страховка только от затягивания; был 30)
  escalateGrowthPerSec: 0.18, // прирост общего множителя урона в секунду после порога
  escalateMax: 6, // потолок множителя (страховка от бесконечного роста)
};
