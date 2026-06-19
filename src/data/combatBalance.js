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

   Damage model: STANDARD base HP = 100 (both fighters). Strike damage is a
   FRACTION of the TARGET's max HP, never an absolute — so a future HP upgrade
   (to 1000+) does NOT rebalance the fight (раздуй пул, доли держат тот же бой).
   A clean (unmitigated) mixed series kills in ~15-18 hits; toughness / dodge /
   block / miss lengthen the real bout to ~40-45s, and the stalemate safeguard
   (rising накал — escalate* below — triggered by time WITHOUT a clean exchange)
   guarantees even a STARING-contest bout still finishes — no ties, a bout always
   runs to an elimination — without heating up a normal, actively-trading bout. */
export const COMBAT_BALANCE = {
  // --- Standard base. maxHp = 100 for BOTH fighters. Strike damage is a FRACTION
  //     of the TARGET's max HP (see damageFracBase + strikeDamage in buildFighter),
  //     so HP scaling (a future upgrade to 1000+) does NOT rebalance the fight —
  //     a bigger pool just means proportionally bigger numbers, same hits to kill.
  maxHp: 100, // стандартная база HP обоих бойцов (был 4000)
  // Readable strikePower CHARACTERISTIC (sheet number, base 100) — the grade
  // system lays its PERCENT bonuses on top (122 = +22%) and the damage fraction
  // scales by strikePower/100. NOT the damage amount itself (that's a fraction of
  // the target's HP — damageFracBase below).
  strikePower: 100, // сила удара как ЧИТАЕМАЯ характеристика (был 180-абсолют); урон = доля HP × (strikePower/100)
  // Neutral PUNCH = this fraction of the TARGET's max HP, RAW/unmitigated (before
  // toughness / resilience / block / dodge). doubleEach + combo scale it by
  // moveMult, keeping the 1 : 1.33 : 3.67 per-impact triad. Calibrated so a mixed
  // series kills in ~15-18 clean hits: at neutral AI weights (punch .47 / double
  // .40 / combo .13) ≈ 2.0% raw per attack → ~11 attacks ≈ ~15-16 individual
  // impacts to a clean kill. Mitigation lengthens the real bout to ~40-45s.
  // Tunable — the single knob for "how fast HP drains".
  damageFracBase: 0.045, // доля max HP цели за нейтральный панч (сырой, до митигации)
  toughness: 200, // базовая прочность — кривая смягчения = РАТИО toughness/(toughness+K), не зависит от шкалы HP
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
  //     chance the defender raises its guard for that exchange, from its
  //     resilience + stick — dug-in cores guard often, brash ones almost never;
  //     the current intention's guard flag biases it on top (HOLD / CATCH lift it).
  //     resilience-led so a high-stick presser
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

  // --- Feint (обманный удар). A fake: the same opening as a real strike (sends
  //     the SAME threat signal, onAttackStart, so the foe's block/dodge reflex
  //     fires) but no contact, no damage — it just spends a little stamina. PAYOFF:
  //     if the foe takes the bait (blocks / dodges) inside feintBaitWindowSec, an
  //     advantage window opens; a REAL strike thrown inside feintAdvantageWindowSec
  //     pierces the guard (raises the attacker's existing blockPenetration to
  //     feintPenetrationBonus for that hit) + hits a bit harder (feintDamageBonus).
  //     No new pierce system — reuses blockPenetration. If the foe doesn't bite,
  //     the feint just cost stamina (the honest price of the bluff). All tunable.
  feintStaminaCost: 4, // дешевле полного удара (punch 6), но не бесплатно
  feintBaitWindowSec: 0.6, // окно после финта — следим, среагировал ли враг
  feintAdvantageWindowSec: 1.2, // окно преимущества после того, как враг купился
  feintPenetrationBonus: 0.6, // пробитие блока у удара-расплаты (поднимает blockPenetration на этот удар)
  feintDamageBonus: 0.25, // небольшой бонус урона удара-расплаты (+25%)
  // Reflex «when to feint» (TEMPORARY spinal cord) — chance to fake instead of a
  // real strike: base + light weight from counter (feint ≈ «ловлю на реакции»).
  feintChanceBase: 0.12,
  feintChanceCounterWeight: 0.25, // вклад counter01 в шанс финта
  feintChanceMax: 0.45, // потолок частоты финта

  // --- Interrupt (сбив замаха). A landed hit (not missed, not dodged) on a
  //     fighter that is in the EARLY part of its OWN attack windup срывает that
  //     attack: cancel the clip, drop its pending impacts (a DOUBLE/COMBO остаток
  //     отменяется), play STAGGER, and lock it (no attack / move) for
  //     staggerDurationSec. The hit's damage still applies (+ optional
  //     interruptDamageBonus, base 0 = off — a seam). Vulnerable window = attack
  //     start → interruptWindowFrac of the windup, BEFORE contact — only the early
  //     swing is catchable (any attack, incl. FEINT); a late-swing / recoil hit is
  //     a normal exchange. Arises by TIMING (auto-bout: by chance); smart timing
  //     is the future model's job — NO decision stub here. Tunable.
  interruptWindowFrac: 0.5, // доля замаха (от старта), пока атака уязвима к сбиву
  staggerDurationSec: 0.5, // на сколько запирается сбитый боец (= длина клипа STAGGER)
  interruptDamageBonus: 0.0, // бонус урона прерывающему удару (база 0 = выкл; ШОВ)

  // --- Charge (заряд). A resource built by PATIENCE — not attacking AND holding /
  //     gaining distance (not jammed in close) — and spent on ONE empowered strike
  //     that hits harder + pierces the guard more, ∝ how full it is. NOT stamina:
  //     stamina is "can I act" (spent on everything, recovers at rest); charge is
  //     "saved a haymaker" (built only by waiting, spent on the release). Makes the
  //     HUNT / STING branches («терпи и копи на один убойный») honest. Starts empty.
  //     Accumulates only while spacing (no attack clip + foe ≥ chargePatientDist);
  //     while actively attacking it doesn't grow (optional slow drain = chargeDecay).
  //     Release boosts ∝ charge level then spends (chargeReleaseFraction, default
  //     full). Bonus ceilings keep a charged hit scary but NOT a one-shot at base —
  //     owner tunes by eye. All tunable; per-fighter seams (sb.*) in buildFighter.
  chargeMax: 100, // потолок заряда
  chargeGainPerSec: 12, // набор в терпеливой игре (≈8s spacing до полного)
  chargeDecayPerSec: 0.0, // слив, пока активно атакует (база 0 = выкл; ШОВ)
  chargePatientDist: 1.6, // дистанция до врага, дальше которой набор идёт (не наседает вплотную)
  chargePowerBonusMax: 0.6, // макс. бонус урона заряженного удара (при полном)
  chargePenetrationBonusMax: 0.7, // макс. бонус пробития блока заряженного удара (через blockPenetration)
  chargeReleaseFraction: 1.0, // сколько заряда тратит один удар (1 = полная разрядка «выстрелил накопленным»)
  chargeReleaseThreshold: 0.8, // (TEMPORARY decision) разряжается, когда заряд ≥ этого и враг в досягаемости

  // --- Facet seam bonuses (ONSLAUGHT pass; grows as the per-core заходы land).
  //     A facet's competence add flows facet → resolveBehavior.statBonuses →
  //     `sb.*` in buildFighter → the LIVE mechanic. Kept HERE so the maths tunes
  //     in one place — upgradeData.js references these by name, no inline magic.
  //     The mechanics already exist (block pierce in takeDamage; the early-windup
  //     interrupt window in play()); these only FEED them from a grain. Fractions.
  ramGuardCrushPen: 0.4, // ТАРАН-2 «хуже блокируется» — blockPenetration add (block cut 0.50 → 0.30)
  ramBreakthroughPen: 0.95, // ТАРАН-5 «пролом насквозь» — near-total pierce (raised guard ≈ moot)
  ramUnshakenInterruptResist: 0.7, // ТАРАН-3 «почти не сбивается» — shrinks the early-windup vuln window (×0.30 of base)

  // RAIDER (заход 2). Fed via sb.* into the LIVE miss / feint / charge mechanics.
  //   accuracy — УКОЛ-2 / ОХОТА-1 read the opening, the first strike misses less.
  //   feint    — ФИНТ-1 fakes more often; ФИНТ-2 / -5 make the punish bite harder.
  //   charge   — ОХОТА-3 fills the haymaker faster; ОХОТА-5 makes its release hurt.
  jabPinpointAccuracy: 0.35, // УКОЛ-2 «точнее на входе» — +accuracy (miss ≈10% → ≈6.5%)
  huntReadAccuracy: 0.3, // ОХОТА-1 «дольше читает» — +accuracy, aimed entry
  feintFakeInChance: 0.2, // ФИНТ-1 «ложный заход» — +feint frequency (into decideFeint, capped feintChanceMax)
  feintPunishPayoff: 0.5, // ФИНТ-2 «наказывает раскрытие» — ×1.5 the feint payoff (pierce + dmg)
  feintSetupPayoff: 1.2, // ФИНТ-5 «развод-связка» (vertex) — ×2.2 the feint payoff (guard ≈ moot on the punish)
  huntChargedGain: 0.6, // ОХОТА-3 «копит в маневрировании» — +60% charge gain (full ≈5s vs ≈8s)
  huntKillingPower: 0.6, // ОХОТА-5 «смертельный заход» (vertex) — +60% charge-release power

  // BULWARK (заход 3). Fed via sb.* into the LIVE toughness / block / breathing /
  // block-counter / interrupt mechanics.
  //   stamina regen — БАСТИОН-3 «дыхание»: recovers stamina faster при покое.
  //   block mitigation — БАСТИОН-5 «несокрушим»: a blocked hit loses far more.
  //   block-counter — ВОЛНОЛОМ-1/5: after a block, the next strike ripostes harder
  //                   (activates the onBlock hook internally — see buildFighter).
  //   interrupt bonus — ВОЛНОЛОМ-2/5: catching the foe's windup punishes harder
  //                   (attacker-side interrupt reward, через onImpact — see report).
  //   block pierce — ТИСКИ-2/5: a heavy press is hard to block (blockPenetration).
  bastionBreathRegen: 0.6, // БАСТИОН-3 «восстанавливает дыхание» — +60% stamina regen в покое
  bastionFortressMitigation: 0.6, // БАСТИОН-5 «несокрушим» — +60% block strength (cut 0.50 → ~0.80, capped 0.90)
  breakerRiposteBonus: 0.5, // ВОЛНОЛОМ-1 «ответный тычок» — +50% dmg on the strike after a block
  breakerInterruptBonus: 0.5, // ВОЛНОЛОМ-2 «наказывает прерванную атаку» — +50% dmg when this hit catches a windup
  breakerTrapRiposte: 1.0, // ВОЛНОЛОМ-5 «стена-капкан» (vertex) — +100% post-block riposte dmg
  breakerTrapInterrupt: 1.0, // ВОЛНОЛОМ-5 «стена-капкан» (vertex) — +100% interrupt-catch dmg
  riposteWindowSec: 1.5, // how long a defensive win (block / dodge / foe whiff) keeps the riposte armed (covers the counter-jab)
  viceSlamPen: 0.35, // ТИСКИ-2 «тяжёлый, трудно блокировать» — blockPenetration add (block cut 0.50 → ~0.33)
  viceClinchPen: 0.5, // ТИСКИ-5 «захват» (vertex) — blockPenetration add (heavy grind through the guard)

  // AMBUSH (заход 4 — финал). Fed via sb.* into the LIVE dodge / onMiss / charge
  // mechanics. КАПКАН counters from RANGE (dodge + foe whiff), ЖАЛО is the standing
  // charge bomb (the twin-splits from ВОЛНОЛОМ's block-counter and ОХОТА's fast fill).
  //   dodge-counter — КАПКАН-2/5 · ТЕНЬ-4: a slipped hit arms the riposte window
  //                   (mirror of ВОЛНОЛОМ's blockCounter — same window, dodge trigger).
  //   miss-counter  — КАПКАН-4: the foe's whiff arms the riposte (activates onMiss).
  //   charge        — ЖАЛО: power (Loaded / Execution), ceiling (Long Charge), pierce.
  trapDodgeCounter: 0.5, // КАПКАН-2 «уход + контр» — +50% dmg on the strike after a dodge
  trapMissCounter: 0.5, // КАПКАН-4 «наказывает промах» — +50% dmg after the foe whiffs
  trapPerfectDodge: 1.0, // КАПКАН-5 «идеальный капкан» (vertex) — +100% post-dodge riposte
  trapPerfectMiss: 1.0, // КАПКАН-5 «идеальный капкан» (vertex) — +100% post-whiff riposte
  shadowDodgeWindow: 0.4, // ТЕНЬ-4 «окно для своего захода шире» — +40% dmg after a dodge (own opening)
  stingLoadedPower: 0.5, // ЖАЛО-1 «накопленный удар тяжёлый» — +50% charge-release power
  stingLongChargeMax: 0.6, // ЖАЛО-2 «дольше выжидает — сильнее» — +60% charge ceiling (loads longer, hits bigger)
  stingPiercePen: 0.6, // ЖАЛО-4 «пробивает любую защиту» — +60% charge-release block pierce
  stingExecutionPower: 0.8, // ЖАЛО-5 «казнь» (vertex) — +80% charge-release power (with the escalate safeguard, not a start one-shot)

  // --- Stalemate safeguard: rising накал (escalation by SILENCE, NOT fight time).
  //     The hole this closes: two patient cores (both CATCH / HOLD) могут встать в
  //     гляделки — neither attacks, so the old time-based damage ramp had nothing to
  //     multiply (no hits = nothing to grow). The trigger is now время БЕЗ размена:
  //     while NEITHER fighter lands damage, накал (escalation01, 0→1) climbs after
  //     escalateSilenceSec of quiet, reaching full over escalateRampSec. накал feeds
  //     BOTH outputs off the ONE silence clock (накал = злее И больнее):
  //       • aggression — the picker (intentions.js) leans to the attacking intents
  //         (PRESS / STRIKE) and away from the passive / disengage ones (HOLD / CATCH
  //         / BREAK / BREATHE), and the body (refreshAxes) gets a forward + aggression
  //         pull (escalateForwardMax / escalateAggroMax) — so a staring contest is
  //         FORCED into a clash, guaranteed once накал saturates.
  //       • damage — the OVERALL outgoing multiplier ramps 1 → escalateMax, so the
  //         forced clash bites (a high-накал landed combo is near-decisive).
  //     RESET is instant: ANY landed damage (a clean exchange, by EITHER side — see
  //     noteExchange in ArenaScene, gated on real HP loss so a pure dodge / miss does
  //     NOT count) snaps the silence clock back to 0, so an ACTIVE bout never heats up
  //     (frequent trades keep накал ≈ 0). Засада plays normally below the threshold —
  //     накал only starts once the гляделка has really dragged. No ties; the bout
  //     always resolves. Single tuning point; all tunable.
  escalateSilenceSec: 5, // тишина (с) без размена до старта накала — до неё засада выжидает как обычно
  escalateRampSec: 12, // за сколько секунд непрерывной тишины накал доходит до 1 (полного)
  escalateAggroMax: 0.5, // потолок добавки к агрессии обоих на полном накале (шкала aggression 0..1)
  escalateForwardMax: 30, // потолок тяги вперёд по дистанции на полном накале (ось distance 0..100 → ближе)
  escalateMax: 6, // потолок множителя урона на полном накале (накал = больнее; страховка от бесконечного роста сохранена)

  // --- Reading the foe's action phase (ЧТЕНИЕ ФАЗЫ — навык бойца, не данность).
  //     The foe exposes its action phase (windup / commit / recovery / stagger /
  //     neutral — buildFighter.getActionPhase); the READER does NOT get it raw. It
  //     perceives a DELAYED + occasionally WRONG copy, and quality scales with the
  //     reader's COUNTER axis (counter01): low counter → slow, mistake-prone read;
  //     high counter → fast, rarely wrong — but NEVER perfect. The reliability cap
  //     is < 1.0 on purpose (missChanceHigh > 0): even a maxed ambusher misses some
  //     reads, so attacking it is still possible and the bout never locks into an
  //     eternal сбив. A good read FEEDS two conscious reactions in buildFighter —
  //     сбив замаха (interrupt a read windup) and контра (punish a read opening) —
  //     and biases the picker toward CATCH. Endpoints here, scaled by counter01 via
  //     the helpers below (one tuning point).
  read: {
    delayMsLow: 460, delayMsHigh: 95, // perception latency (ms): counter01 0 → 1
    missChanceLow: 0.6, missChanceHigh: 0.12, // miss a real transition; HIGH ≠ 0 = reliability cap < 1
    falseChanceLow: 0.16, falseChanceHigh: 0.025, // ложное чтение — act on an opening that isn't there
    windupReactLow: 0.18, windupReactHigh: 0.85, // chance to commit a сбив on a READ windup
    openReactLow: 0.3, openReactHigh: 0.95, // chance to punish a READ opening (recovery / stagger)
    catchBoost: 1.35, // CATCH (засада) — the dedicated waiter, reads + pounces hardest
    holdBoost: 1.12, // HOLD leans into the read a little
    reactCooldownSec: 0.7, // min gap between conscious read-reactions (anti-spam)
    gatherSec: 0.16, // visible "собрался" coil beat before a контра lunge (the улов reads as a moment)
  },

  // --- Micro-life in the planted stance (сдержанная жизнь между ударами). A LOW-
  //     amplitude secondary layer ADDED on top of a held idle / intention stance in
  //     buildFighter (idlePose / intentionStance only — never clips / gather / gait /
  //     block, never under reduced motion): a slow weight shift (loaded-leg knee
  //     softens + hip follows + torso settles toward it), a slow fwd/back body sway,
  //     and a fuller breath (hips rise + torso pitch + shoulders lift on the inhale).
  //     It sits BELOW the intention SILHOUETTE — every amplitude is well under the
  //     stance deltas (intentionMotion.js), so HOLD / CATCH / BREATHE stay three
  //     distinct, sharp reads and the upper-body guard/lean is untouched. Goal is
  //     «собран и готов», NOT a boxer's bounce: slow cycles, tiny amplitudes. Pure
  //     maths over loop time (no new geometry). Single tuning point — crank by eye.
  //     `cap` is the global сдержанность ceiling (×the whole layer; 0 = off).
  microLife: {
    cap: 1.0, // global ceiling on the whole layer (×amp; 0 disables, >1 livelier)
    breathHipY: 0.012, // extra hip rise on the breath (world units)
    breathTorsoX: 0.015, // breath pitch of the torso (rad)
    breathShoulder: 0.05, // shoulders lift on the inhale (rad) — chest expand reads here
    shiftPeriodSec: 4.5, // weight-shift cycle (s) — slow переминание, NOT a bounce
    kneeFlex: 0.06, // loaded-leg knee softening (rad, ≈3.4° peak — well under any stance knee)
    hipFollow: 0.025, // hip pitch following the weighted leg (rad)
    twist: 0.022, // torso settles toward the weighted leg (rad, ≈1.3°)
    swayPeriodSec: 6.0, // slow fwd/back body-sway cycle (s)
    swayHipZ: 0.012, // body sway amplitude (world units)
    // Per-intention MANNER — not separate anims, one layer SCALED: amplitude + cycle
    // rate. Livelier press, quieter catch, sluggish (slow + small) breathe. Keys =
    // intention ids; an unknown id falls back to neutral (amp 1, rate 1).
    byIntention: {
      press: { amp: 1.2, rate: 1.15 }, // давит — живее, чуть напористее
      strike: { amp: 1.0, rate: 1.0 },
      sting: { amp: 1.15, rate: 1.2 }, // лёгкий, на носках
      hold: { amp: 0.85, rate: 0.95 }, // упёрся — собран
      catch: { amp: 0.65, rate: 0.8 }, // ждёт — тише, собраннее
      break: { amp: 1.0, rate: 1.05 },
      breathe: { amp: 0.5, rate: 0.65 }, // выдохся — вяло, тяжело
    },
  },
};

// Read-quality helpers — the perception numbers above as functions of the reader's
// counter01 (0..1). One place, so the читать-навык curve tunes here. The miss cap
// (<1 reliability) lives in the HIGH endpoint being non-zero.
const _R = COMBAT_BALANCE.read;
const _clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const _lerp = (a, b, t) => a + (b - a) * _clamp01(t);
export const readDelaySec = (c) => _lerp(_R.delayMsLow, _R.delayMsHigh, c) / 1000;
export const readMissChance = (c) => _lerp(_R.missChanceLow, _R.missChanceHigh, c);
export const readFalseChance = (c) => _lerp(_R.falseChanceLow, _R.falseChanceHigh, c);
export const readWindupReactChance = (c) => _lerp(_R.windupReactLow, _R.windupReactHigh, c);
export const readOpenReactChance = (c) => _lerp(_R.openReactLow, _R.openReactHigh, c);
