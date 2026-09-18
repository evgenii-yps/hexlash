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
  // --- ПОЛЕ БОЯ (фундамент, бой на нескольких бойцов). Числа, которые нужны не
  //     одному бойцу, а расстановке на плите. Живут здесь, потому что все числа
  //     боя живут в одном файле — второго места для них в проекте нет.
  field: {
    // ЗАСАДА бросает текущую цель и разворачивается на того, кто начал замах,
    // если он не дальше этого. Взято на уровне ударной дистанции бойца (STRIKE
    // = 1.7): засада ловит момент у себя под носом, а не через всю плиту.
    ambushSwitchReach: 1.7,
    // Тела не слипаются: минимальный просвет между ЛЮБЫМИ двумя бойцами. Боец
    // сам держит эту дистанцию только от своей цели (CONTACT внутри бойца), а на
    // плите с шестью телами остальные прошли бы насквозь. Внешний проход по
    // сцене растаскивает всех до этого просвета.
    //
    // Ровно CONTACT бойца (0.74): будь здесь больше, пара разошлась бы шире, чем
    // расходится сегодня, и бой один на один перестал бы быть прежним.
    bodyGap: 0.74,
    // Разлёт при выходе на плиту: минимальный просвет между точками появления.
    // Шире рабочего просвета — иначе первый же кадр начинается с расталкивания.
    spawnGap: 1.15,
  },
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
    // Power hands (hook / uppercut / body shot — arc / vertical / level-change variety
    // on the existing shoulder+elbow joints). Strong SINGLE blows below the combo: the
    // hook + uppercut are power shots, the body shot a lighter wearing strike.
    hook: 1.7, // боковой по дуге — strong arc to the head/body
    uppercut: 1.9, // снизу вверх — the heaviest single short of the combo
    bodyShot: 1.2, // в корпус со сменой уровня — lighter, wears the body down
    // Kicks (straight, forward — trigger-only for now, owner dotunes). Legs hit
    // harder + reach further than the arms: front kick between double-per-hit and
    // combo; teep is a disruptive shove (lighter); knee is a heavy close strike.
    frontKick: 2.2, // прямой фронт-кик стопой
    teep: 1.6, // толчковый (push) — меньше урона, больше сбива
    knee: 2.6, // колено вблизи — тяжёлый
  },
  jitter: 0.1, // ±10% per-blow variance on outgoing damage — proportional to each move's base, below the inter-move gaps

  // --- Per-move STRIKE REACH (world units, fighter-centre → foe). How close the
  //     fighter steps in to land THIS move so the striking limb actually reaches the
  //     foe's body at the contact frame (not the air). Jabs short, kicks longer, knee
  //     in-close. Used by the step-in (decideAttack/lunge) + the contact gate
  //     (resolveImpact). Tunable in one place; owner dotunes by eye.
  strikeReach: {
    punch: 1.0, // jab / cross — step in close
    double: 1.0, // jab–cross
    combo: 1.1, // heavy commit (lunges in on the hips)
    hook: 1.05, // боковой — close-mid, the arc wraps in
    uppercut: 0.95, // снизу вверх — inside, close
    bodyShot: 0.9, // в корпус — closest, you're on the body
    frontKick: 1.45, // foot reaches furthest
    teep: 1.5, // push kick — longest
    knee: 0.85, // вплотную
  },
  // Contact: how far past a move's reach the foe can be and still be struck (slop
  // so a touch still lands), and how much the striking limb tip overlaps the foe
  // body so the contact reads ON the body, not short of it.
  reachHitTol: 0.45, // foe within reach+this at the contact frame → connects
  reachStepMax: 1.3, // gap (above reach) the fighter will close with a step-in before striking
  reachOverlap: 0.12, // step in this much PAST reach so the limb tip sinks into the body
  lungeTimeoutSec: 1.1, // abort a step-in if it can't reach in this long (foe ran)

  // --- Kicks in the autonomous picker (РАЗНООБРАЗИЕ приёмов по дистанции). The legs
  //     (front kick / teep / knee) are part of the strike MIX, not a new intention:
  //     after decideAttack picks a hand move, with a per-intention `share*` chance it
  //     is SWAPPED for the kick whose band fits the CURRENT gap — KNEE вплотную,
  //     FRONT KICK средне, TEEP дальше — so a kick always suits the distance (never a
  //     knee from afar or a teep point-blank; beyond the teep band no kick is thrown,
  //     hands stay and navigation closes). Manner rides the EXISTING intention channel
  //     (no intentionMotion touch): STRIKE (heavy) throws the most kicks and leans into
  //     the close knee, STING (light) fewer + a snappy front kick over a knee, PRESS /
  //     HOLD (free) a moderate mix. Damage / reach / weight of each kick live in
  //     moveMult / strikeReach / moveWeight above (legs hit a touch harder + reach
  //     further than the arms). Kept a MINORITY of the offence so the hands stay
  //     primary — tune the shares up/down by eye. The lab triggers are unaffected.
  kicks: {
    shareFree: 0.3, // PRESS / HOLD — chance a chosen strike becomes a kick (moderate mix)
    shareLight: 0.26, // STING — fewer, lighter kicks (front kick / teep, no knee)
    shareHeavy: 0.36, // STRIKE — the most kicks, leans into the heavy close knee
    kneeMaxGap: 1.05, // gap ≤ this → KNEE (вплотную, тяжёлое колено)
    frontKickMaxGap: 1.55, // (knee, this] → FRONT KICK (средне — джеб/двойка/фронт-кик зона)
    teepMaxGap: 2.0, // (frontKick, this] → TEEP (дальше, толчковый) · further → no kick
  },

  // --- Power hands in the autonomous picker (РАЗНООБРАЗИЕ ударов руками по дистанции).
  //     Same pattern as kicks above, for the three new hand strikes (hook / uppercut /
  //     body shot): after decideAttack picks a straight (jab / double / combo) and the
  //     kick layer passes, with a per-intention `share*` chance the straight is SWAPPED
  //     for a POWER hand that suits the close exchange — body shot / uppercut вплотную,
  //     hook close-mid; beyond the hook band no swap (the straight + lunge cover range).
  //     Manner rides the EXISTING intention channel (no intentionMotion touch): STRIKE
  //     (heavy) commits more hooks/uppercuts, STING (light) stays snappier (the quick
  //     body shot, fewer overall), PRESS/HOLD (free) an even mix. Kept a MINORITY so the
  //     straights stay the backbone of the exchange — tune the shares up/down by eye.
  //     Rolled AFTER the kick layer, so kick frequencies are untouched. Damage / reach /
  //     weight of each live in moveMult / strikeReach / moveWeight above.
  hands: {
    shareFree: 0.3, // PRESS / HOLD — chance a straight becomes a power hand (moderate)
    shareLight: 0.22, // STING — fewer power shots (stays jabby), leans the snappy body shot
    shareHeavy: 0.4, // STRIKE — the most power hands, leans into hook / uppercut
    closeMaxGap: 1.0, // gap ≤ this → вплотную: body shot / uppercut / hook all land
    hookMaxGap: 1.3, // (close, this] → close-mid: hook (its arc reaches) · further → no swap
  },

  // --- Being-hit reaction (defender). A SHORT zone reaction over the recoil — head
  //     snaps back, body осаживает, guard knocked — that never locks the loop (the
  //     existing ai.nextAt hitch already paces the next move). A STRONG hit (weight ≥
  //     reactStrongWeight, e.g. combo) adds a visible step back (отшат шагом).
  reactStrongWeight: 0.7, // outgoing weight at/above which the hit shoves the foe back a step
  reactStepDist: 0.34, // how far a strong hit knocks the defender back (world units)
  hitFlashSec: 0.18, // contact spark lifetime — quick, then gone (no second persistent glow)
  // Outgoing "weight" per move (0..1) — drives the defender's reaction amplitude
  // (light вздрог vs strong отшат). Heavier moves shove harder.
  moveWeight: {
    punch: 0.32, double: 0.5, combo: 1.0,
    hook: 0.7, uppercut: 0.8, bodyShot: 0.45,
    frontKick: 0.7, teep: 0.6, knee: 0.9,
  },

  // --- Footwork (live-bout locomotion look + at-range movement). The fighter never
  //     freezes at range: it circles the foe + holds spacing on real stepping legs.
  //     Manner (intentionMotion) tints it via moveScale; numbers here are the feel.
  footwork: {
    circleSpeed: 0.5, // tangential (circling) weight in the at-range move vector — less lateral
    rangeKeep: 0.9, // radial weight that holds preferred spacing (in/out) — firmer, drifts less
    circleSlowMul: 0.5, // gentle-amble factor on the circling speed — calmer обход (was 0.8)
    // Arc → settle rhythm (calmer footwork, no мельтешение): walk a line for moveMin
    // +rand, then устой for settleMin+rand (light micro-life remains), repeat.
    moveMin: 1.6, moveJit: 1.4, // a movement arc lasts this long (s)
    settleMin: 0.7, settleJit: 0.9, // then a brief pause (s) — settles in the stance, not frozen
    flipChance: 0.3, // chance a new arc flips the circling sense (CW ↔ CCW) — holds a line longer
    strideK: 6.5, // gait cadence (phase rad per unit travelled) — a touch less frequent (was 7)
    stepWidthMul: 1.18, // widen the stride so steps are broader/weightier, not small шажки
    minStepFrac: 0.5, // floor on gait amplitude while MOVING → a slow step still reads (no slide)
    kneeLift: 1.45, // extra knee-flex on the swing leg → the foot clearly lifts + plants
    turnRate: 3.2, // facing turn speed (rad/s) — a touch softer доворот, no snap
  },

  // --- Dodge MOTION (visual execution of a slip — NOT the defence). When the slip
  //     fires (the evade itself is rolled in takeDamage — dodgeChance* below — and is
  //     untouched here), the body now performs a real SIDESTEP off-line through the
  //     SAME locomotion pipeline as circling: velocity ramps up + brakes into a planted
  //     stop (accel/decel — уходит и оседает, no щелчок), and the legs do a real переступ
  //     via animateGait (no static feet under an edying body). The duck-guard rides on
  //     top as an upper-body overlay. A quick lateral burst (speed > a normal step) so it
  //     still clears a strike, but eased on both ends. Defence timing/window is unchanged
  //     (instant in takeDamage). Tunable in one place; owner dotunes by eye.
  dodge: {
    dist: 0.5, // боковой уход — how far off-line the sidestep settles (world units)
    speed: 2.6, // peak sidestep speed (units/s) — faster than a walk (clears the strike), below a sprint
    accel: 14, // push-off ramp (units/s²) — quick but eased (no snap on the start)
    decel: 11, // settle ramp — оседает into a planted stop (no щелчок on the stop)
    stepWidthMul: 1.5, // leg-swing amplitude vs a circle step → a clear приставной шаг
    duckDepth: 0.1, // how low the body ducks behind the guard at the slip's peak (world units)
  },

  // --- Post-strike ВЫДОХ (settle/recovery). After an attack clip's return phase, a
  //     short decaying settle blends the body back into normal stance-life instead of
  //     snapping straight back to circling — the blow oseдает, not щёлкает. NOT a new
  //     clip: a transient pose overlay that eases out. Tinted by the move's weight
  //     (light jab → short/shallow · heavy combo → longer/deeper). Fits inside the
  //     existing ai.nextAt pause, so the bout rhythm doesn't stretch.
  exhale: {
    lightDur: 0.3, heavyDur: 0.55, // settle length (s) by move weight (0 → light, 1 → heavy)
    sink: 0.06, // hip drop at full settle (world units) — weight oseдает then recovers
    torsoEase: 0.07, // slight torso slump-back at full settle
    shoulderDrop: 0.1, // shoulders sag a touch as tension leaves
    strength: 0.8, // overall depth of the settle (0..1) — global feel knob
  },

  // --- Дыхание по дистанции (navigation macro-phase). The fight breathes: an ENGAGE
  //     phase (close in, circle, trade — the existing short-range footwork) alternates
  //     with a BREAK phase (disengage to a larger distance + roam to an anchor point
  //     across the plate, then re-close). Phases switch on time with light randomness
  //     so it's not a metronome. Manner tints willingness to break (PRESS davit, stays
  //     close; STING / defensive roam more, farther). Navigation only — the strike /
  //     intention choice / contact range are untouched (the close trade is unchanged).
  breath: {
    engageMin: 2.6, engageJit: 2.4, // engage (close trade) phase length (s)
    breakMin: 1.8, breakJit: 1.8, // break (disengage + roam) phase length (s)
    breakChance: 0.55, // chance an ended engage flips to a break (else stays engaged a bit more)
    breakDist: 2.6, breakWide: 1.1, // far spacing in break: anchor R ∈ [breakDist, +breakWide] from the foe
    anchorReach: 0.55, // within this of the roam anchor = "arrived" → drift wide there
    pressBias: 0.45, // PRESS: breaks rarer / shorter / closer (×<1)
    spacerBias: 1.6, // STING / defensive: breaks more / longer / farther (×>1)
    boundMargin: 0.92, // keep roam anchors inside the plate (fraction of the nav bounds)
  },

  // --- Grade (facet) bonus ramp by depth (1→5). PERCENT (fraction) added to the
  //     facet's target characteristic on the "hard" branches — strikePower
  //     (RAM / HUNT / STING) and toughness (BASTION / BREAKER). A new layer ON
  //     TOP of the facet's existing behaviour shifts (those are untouched). The
  //     vertex (depth 5) jumps. Naturally capped by the RESOURCE pool (можно
  //     зажечь не все грани). Starting orientation, tunable.
  //       depth 1 ≈ 4% · 2 ≈ 7% · 3 ≈ 10% · 4 ≈ 14% · 5/вершина ≈ 22%
  gradeBonusRamp: [0.04, 0.07, 0.1, 0.14, 0.22],

  // --- Пауза между замиранием боя и панелью поверх него (с). Одна на всех, кто
  //     говорит после боя: итог обычного боя, панель между раундами забега, итог
  //     забега. Нужна затем, что своего показа исхода у самого боя нет — он
  //     просто замирает, — и без паузы панель читается как выскочившая посреди
  //     боя, а не после него.
  panelDelaySec: 1.5,

  // --- ЗАБЕГ (CHAIN) — три боя подряд одним бойцом. Числа режима, не боя: сам
  //     бой ими не меняется, меняются условия, в которых он идёт. Живут здесь,
  //     потому что это ощущение, которое владелец крутит, а не механика.
  //
  //     ⚠️ Поправки — ДОЛИ, та же шкала, что gradeBonusRamp выше, и тот же путь:
  //     они складываются в statBonuses.strikePower / toughness соперника, то есть
  //     идут ровно туда, куда идут грани. Абсолютных чисел здесь нет намеренно —
  //     подними базу силы удара, и поправки поедут за ней сами.
  //
  //     ЗНАК ОТРИЦАТЕЛЬНЫЙ — соперник СЛАБЕЕ игрока. Соперник каждый раунд
  //     выходит свежим, а боец игрока — с остатком здоровья; равный соперник в
  //     каждом раунде делает забег почти непроходимым (≈5-10% прохождений).
  //     Разгон в первых двух раундах, третий — честный бой на равных.
  chain: {
    // Поправка к силе удара И прочности соперника по раундам (индекс = раунд-1).
    // ДЛИНА ЭТОГО МАССИВА И ЕСТЬ ЧИСЛО РАУНДОВ — отдельного числа «сколько боёв в
    // забеге» нет намеренно: два места с одним числом расходятся при первой правке.
    // ⚠️ ЛЕСТНИЦА ОБЯЗАТЕЛЬНА: поправка следующего раунда не ниже предыдущей —
    //    соперник не слабеет к концу забега. Ниже -0.60 не опускать.
    //
    // История замеров на 640×360:
    //   -20 / -10 /   0 → целиком 0 из 10 и 0 из 10. Раунд 3 не взяли ни разу.
    //   -35 / -30 / -25 → целиком 1 из 10 (с гранями) и 0 из 10 (без граней).
    //
    // Что показал второй замер: в раунд 2 боец входит в среднем на 58-60, в
    // раунд 3 — на 42-52, а соперник всегда выходит со ста. Нехватка здоровья
    // в 1.7-2.4 раза, и скидка к силе удара отыгрывает её плохо: 10% поправки
    // стоят около 6 процентных пунктов победы в раунде.
    //
    // Отсюда нынешние числа: давим на РАННИЕ раунды, а не на поздний. Слабый
    // соперник первых раундов забирает у бойца меньше здоровья, тот входит в
    // третий раунд свежее — и третий чинится сам, без ослабления его соперника.
    // Поправка раунда 3 поэтому не тронута: там бой должен остаться настоящим.
    roundBonus: [-0.5, -0.4, -0.25],
    // Сколько здоровья боец возвращает между раундами — доля от максимума.
    // Не лечение до полного: остаток прошлого боя и есть цена прошлой победы.
    healBetweenRounds: 0.25,
  },

  // --- РЕЙД (RAID) — команда из четырёх против босса и двух его бойцов. Числа
  //     режима, не боя: сам бой ими не меняется, меняются те, кто в него выходит.
  //     Живут здесь по общему правилу — все числа боя в одном файле.
  //
  //     ЖИВУЧЕСТЬ БОССА ЗАДАЁТСЯ БРОНЁЙ, А НЕ ЗАПАСОМ ЗДОРОВЬЯ. Урон считается
  //     ДОЛЕЙ от здоровья цели (damageFracBase × maxHp в takeDamage), поэтому
  //     раздутый запас здоровья босса живучее НЕ делает вовсе: удары снимут ту же
  //     долю, и число попаданий до смерти останется прежним. Работает только то,
  //     что стоит в расчёте множителем, — прочность из листа характеристик.
  //     Решение владельца 16.09.2026: живучесть босса выражается ТОЙ ЖЕ
  //     характеристикой, что у всех бойцов, а не отдельным скрытым правилом.
  //     Отклонён множитель входящего урона снаружи — он был бы вторым, невидимым
  //     в листе способом быть живучим.
  //
  //     ⚠️ КРУТИТЬ НАДО `bossDurability` — «во сколько раз босс живучее обычного
  //     бойца». Надбавка прочности из него СЧИТАЕТСЯ (toughnessBonusFor ниже) и
  //     руками не пишется: кривая смягчения насыщается, и равные шаги надбавки
  //     дают НЕравные шаги живучести. ×3 — это +1400% прочности, ×4 — уже +2200%.
  //     Писать надбавку руками значит крутить ручку, у которой не размечена шкала.
  // ТУРНИР COLLAPSE — сетка на выбывание. Своих правил боя у турнира нет: пары
  // сходятся тем же боем, что и везде. Здесь живёт только то, что турнир
  // добавляет между боями.
  collapse: {
    // Сколько здоровья возвращается бойцу между волнами, долей от полного.
    // Он выходит с ОСТАТКОМ прошлого боя плюс эта добавка, не выше полного.
    //
    // ⚠️ ЧИСЛО СВОЁ, ХОТЬ И СОВПАДАЕТ С ЗАБЕГОМ. У забега (chain.healBetweenRounds)
    //    ровно столько же, и соблазн сослаться на него велик. Нельзя: это разные
    //    правила разных режимов, и подкрутка забега молча поехала бы в турнир.
    healBetweenWaves: 0.25,
    // Сколько граней достаётся стороне ботов. На старте турнира КАЖДОЙ стороне
    // выпадает одно число отсюда, все значения равновероятны, и все её бойцы
    // получают столько.
    //
    // ⚠️ ЧИСЛО ГРАНЕЙ БОТОВ НЕ ЗАВИСИТ ОТ ИГРОКА НИ В ЧЁМ — решение владельца, и
    //    оно оплачено уроком рейда (17.09.2026): когда грани игрока раздавались
    //    врагам, прокачка работала ПРОТИВ того, кто её делал. В турнире прокачка
    //    должна только помогать, поэтому поле вокруг игрока живёт само по себе.
    //
    // ⚠️ ОДНО ЧИСЛО НА СТОРОНУ, А НЕ НА БОЙЦА. Так в поле есть и слабые команды, и
    //    сильные. Тяни отдельно на каждого — команды усреднятся и станут
    //    одинаковыми, а «я иду сквозь поле» превратится в ровную серую стену.
    botFacetsMin: 0,
    botFacetsMax: 5,
  },
  raid: {
    // Команда игрока: боец игрока + столько ботов-союзников. Всего четверо.
    allies: 3,
    // Сторона босса: босс + столько бойцов охраны.
    guards: 2,
    // Во сколько раз босс живучее обычного бойца. Ручка подстройки §7.7.
    bossDurability: 3,
    // Надбавка к силе удара босса, доля — в тот же лист характеристик, куда идут
    // грани. 0 = бьёт как обычный боец. Вторая ручка подстройки §7.7.
    // ⚠️ Побочное действие, намеренное: BULWARK выбирает целью самого сильного по
    // силе удара, поэтому любое число выше нуля заставляет его брать босса
    // детерминированно, а не по порядку выхода.
    bossPowerBonus: 0,
    // Во сколько раз босс крупнее. Домножается к масштабу, который боец ставит
    // себе сам, — абсолютное число размера снаружи не пишется.
    bossScale: 1.35,
    // ЗАПАСНОЙ ХОД ПО НАКАЛУ — СВОИ ЧАСЫ ДЛИНЫ ДЛЯ РЕЙДА.
    //
    // Разрешён владельцем только по замеру, и замер его потребовал. Три захода
    // ручками босса (живучесть ×3 / ×2.75 / ×2.6 с уроном +20%) взяли и долю
    // побед, и медиану, но НИ ОДИН не убрал хвост «дольше 100 с»: он держался
    // 104 / 104 / 112 с. Урон босса хвост даже удлинил — сильнее бьющий босс
    // быстрее выбивает команду, и бой не кончается, а вязнет вчетвером на троих.
    // Значит хвост родом не от босса, а от длины боя на большом поле: SQUAD на
    // шести телах уже давал 88 с при пороге внимания 90.
    //
    // Общие часы длины (escalateStartSec = 25) не тронуты — на них стоят DUEL,
    // SQUAD и забег. Рейду дан свой порог: накал выходит на потолок раньше, и
    // затянувшийся бой добивается, а не тянется. На бои нормальной длины это не
    // влияет — они кончаются до того, как накал вообще начинает расти.
    //
    // ⚠️ 18 ПОДОБРАНО ЗАМЕРОМ, А НЕ НА ГЛАЗ, и это НЕ ручка одного хвоста: порог
    // двигает ВСЮ раздачу длин. 15 с убирали хвост начисто, но роняли медиану до
    // 50 с — ниже вилки 60-80; 20 и 25 с держали медиану, но оставляли один бой
    // из двадцати за сотней. На 18 сошлось всё сразу: 12 побед из 20, медиана
    // 65 с, самый долгий бой 82 с. Тронешь это число — поедет и медиана, поэтому
    // после правки серию из двадцати рейдов надо перемерить целиком.
    escalateStartSec: 18,
    // Просвет при расталкивании для ПАР С БОССОМ. Общий просвет тел (field.bodyGap
    // = 0.74) трогать нельзя — на нём стоит бой один на один, — а босс шире
    // обычного тела и на общем просвете входил бы в соседей.
    bossBodyGap: 1.0,
  },

  // --- ОТКРЫТОЕ ПОЛЕ (openfield). Двадцать тел на одной большой плите, стороны
  //     дерутся все против всех. Блок стоит рядом с рейдом, потому что это второй
  //     режим со СВОИМИ числами поля, и оба должны быть видны в одном взгляде.
  //
  //     ⚠️ НИ ОДНО ЧИСЛО ОТСЮДА НЕ ЧИТАЕТСЯ БЕЗ ПРИЗНАКА РЕЖИМА. Пять прежних
  //        режимов на эти числа не смотрят вовсе — ни одно из них не подменяет
  //        общее. Это правило, а не совпадение: подмени здесь общий просвет или
  //        общий порог часов, и открытое поле молча переписало бы бой один на
  //        один, который уже принят глазами.
  openField: {
    // ПРОСВЕТ МЕЖДУ СОСЕДНИМИ СТОРОНАМИ НА СТАРТЕ, в мировых единицах. Через него
    // считается радиус кольца выхода, а через радиус — размер поля: поле ровно
    // такое, чтобы двадцать сторон встали по краю не в упоре друг к другу.
    //
    // ⚠️ ЭТО ГЛАВНАЯ РУЧКА ДЛИНЫ БОЯ. Больше просвет — дальше бежать, дольше
    //    сходятся, дольше бой. Она же задаёт «от старта до первого удара»: ТЗ
    //    просит медиану 5-10 с. Тронешь — перемеряй обе серии целиком.
    //
    //    Нижняя граница жёсткая: ударная дистанция бойца 1.7. Ниже неё стороны
    //    начинают бой в упоре, и «все против всех» вырождается в пары у края.
    //
    // ⚠️ 9 ПОДОБРАНО ЗАМЕРОМ, И У НЕГО ЕСТЬ ОБРЫВ СПРАВА. Замер по всей вилке
    //    (7.2 / 9 / 11 / 14 / 18) показал: до 11 поле доигрывает до одной стороны
    //    всегда, а начиная с 14 — НЕ ДОИГРЫВАЕТ НИКОГДА: восемь прогонов из восьми
    //    упёрлись в потолок 240 с. Причина видна в самом бою: последние выжившие
    //    оказываются так далеко друг от друга, что идут навстречу дольше, чем
    //    длится сам размен. Поднимешь это число выше 11 — бой перестанет кончаться,
    //    и заметно это будет не сразу.
    //
    //    9 стоит с запасом от обрыва и даёт самое позднее первое касание среди
    //    безопасных значений. Полные числа всех заходов — в отчёте работы.
    sideGap: 9,
    // РАДИУС ВНИМАНИЯ. Боец выбирает цель по правилу своего ядра только среди
    // врагов не дальше этого. Никого в радиусе нет — идёт к ближайшему врагу, и
    // как только кто-то вошёл, выбирает по ядру.
    //
    // ЗАЧЕМ ЭТО ВООБЩЕ. Без радиуса ONSLAUGHT берёт самого слабого по здоровью на
    // всём поле, а BULWARK — самого сильного бьющего; на девятнадцати врагах оба
    // побегут через всю карту мимо того, кто стоит рядом и уже бьёт. Читается это
    // не как охота, а как бессмыслица, и бой не кончается.
    //
    // ⚠️ НА ДЛИНУ БОЯ ЭТО ЧИСЛО ПОЧТИ НЕ ВЛИЯЕТ — проверено: 4, 6 и 9 дали 189 /
    //    184 / 195 с, разница внутри разброса. Оно выбрано по ЧИТАЕМОСТИ, а не по
    //    длине: при поле в 58 единиц шесть — это «сосед и соседи соседа», то есть
    //    та связка, внутри которой правило ядра ещё что-то значит. Крутить его
    //    ради длины бесполезно, для длины есть sideGap.
    //
    // ⚠️ ПРАВИЛО ТОЛЬКО ЭТОГО РЕЖИМА. В пяти прежних выбор цели не меняется
    //    ничем: там врагов немного и они рядом, а радиус, введённый всем, тихо
    //    переписал бы бой один на один.
    attentionRadius: 6.0,
    // ⚠️ СВОИХ ЧАСОВ ДЛИНЫ У ЭТОГО РЕЖИМА НЕТ — И ЭТО РЕЗУЛЬТАТ ЗАМЕРА, А НЕ
    //    НЕДОДЕЛКА. Сначала они были заведены по образцу рейда: двадцать тел
    //    вязнут дольше семи, логично дать свой порог. Замер этого не подтвердил —
    //    при 25, 30 и 40 секундах длина поля вышла 188 / 178 / 202 с, то есть
    //    разница внутри разброса. Число, которое ничего не двигает, — это второе
    //    место, где живёт общий порог, и первое, которое однажды с ним разойдётся.
    //    Поэтому открытое поле стоит на ОБЩЕМ пороге, как DUEL, SQUAD, забег и
    //    турнир. Понадобится свой — заводить его снова только по замеру.
    // РАЗМЕР ПОЛЯ — ЗАПАС ОТ КОЛЬЦА ВЫХОДА ДО КРАЯ ПЛИТЫ, в мировых единицах.
    //
    // Само поле не задаётся числом намеренно: оно считается от кольца, а кольцо —
    // от числа сторон и просвета между ними. Напиши размер числом, и он разойдётся
    // с кольцом при первой же правке просвета — стороны либо вылезут за край, либо
    // соберутся в середине непонятно зачем.
    edgeMargin: 2.2,
    // КОРИДОР УДАЛЕНИЯ КАМЕРЫ. Она следит за стороной игрока, а не за всем полем.
    //
    // ⚠️ ПОТОЛОК ЗДЕСЬ — НЕ «ЧТОБЫ ВСЕ ВЛЕЗЛИ», А ПОЛ ЧИТАЕМОСТИ. Сначала стояло
    //    22 — с расчётом вместить четвёрку QUAD, когда она разбежится по полю.
    //    Снимок показал цену: боец игрока стал втрое мельче, чем тот же боец в
    //    турнире QUAD, а ТЗ прямо требует обратного — не мельче.
    //
    //    12 — это то удаление, на которое кадр становится в турнире QUAD (восемь
    //    тел на боевой плите; считается тем же frameLiving). Выше него камера не
    //    поднимается никогда, поэтому свой боец на открытом поле не может стать
    //    мельче, чем там. Расплата честная и названа в ТЗ словом «когда это
    //    возможно»: если своя четвёрка разбежалась по всему полю, часть её в кадр
    //    не войдёт. Свой боец крупный важнее, чем вся сторона мелкой.
    camMinDistance: 6,
    camMaxDistance: 12,
    // --- КАМЕРА В РУКАХ ИГРОКА. Второе состояние камеры: слежение выключено,
    //     кадром распоряжается игрок. Пределы здесь СВОИ и шире, потому что
    //     правило «свой боец не мельче, чем в турнире QUAD» в руке не действует —
    //     игрок вправе отдалиться так, что боец станет точкой.
    //
    // Ближний предел — чуть ближе рабочего (6), чтобы можно было рассмотреть
    // бойца и его замах.
    camMinFree: 4,
    // ДАЛЬНИЙ ПРЕДЕЛ ЧИСЛОМ НЕ ЗАДАН НАМЕРЕННО. Он считается от размера поля и
    // от пропорций экрана: в портрете кадр узкий, и туда же поле влезает только
    // с гораздо большего отъезда, чем в горизонтали. Напиши предел числом — и он
    // будет верен ровно для одной ориентации одного телефона.
    //
    // Здесь только ЗАПАС вокруг поля на дальнем пределе: 1 — поле впритык по
    // кромке, больше — с воздухом. Считается от ДИАГОНАЛИ плиты (камера может
    // смотреть на квадрат с угла), поэтому запас нужен небольшой.
    camFitMargin: 1.05,
    // ЗАПАС КАДРА ПОД ЦЕЛЬ. Кадр строится по СВОЕЙ стороне, а этот запас
    // добавляется к её радиусу, чтобы тот, с кем свой дерётся, тоже попадал в
    // кадр: сходятся бойцы примерно на этой дистанции.
    //
    // ⚠️ ПОЧЕМУ НЕ «ДЕРЖАТЬ В КАДРЕ САМИ ЦЕЛИ». Пробовать считать кадр по своим
    //    ПЛЮС их целям нельзя: цель может стоять на другом конце поля, кадр
    //    отъедет к потолку, и свой боец станет точкой. ТЗ прямо просит обратного —
    //    свой боец не мельче, чем в турнире QUAD. Запас решает то же самое и не
    //    зависит от того, куда убежала цель.
    camEngageRoom: 2.2,
    // --- КАМЕРА СТОИТ, А НЕ СЛЕДИТ. Решение владельца после просмотра превью:
    //     сама по себе камера не двигается вовсе. Она стоит там, где её оставил
    //     игрок, и только если он долго ничего не делает И своих в кадре нет —
    //     наводится на них один раз.
    //
    // ТИШИНА ПЕРЕД НАВОДКОЙ, в секундах. Отсчёт идёт от последнего прикосновения
    // и от конца прошлой наводки.
    //
    // ⚠️ ЭТО НЕ «КАК ЧАСТО ПОДПРАВЛЯТЬ КАДР». Наводка — событие для случая «игрок
    //    засмотрелся в чужой угол поля и потерял своих»; если свои на экране, она
    //    не сработает ни через пятнадцать секунд, ни через минуту. Уменьшишь это
    //    число — камера начнёт дёргать игрока за руку, а не ждать.
    camHoldSec: 15,
    // СКОЛЬКО ЕДЕТ САМА НАВОДКА, в секундах. Полторы — это «камера повернулась», а
    // не «кадр подменили»: рывок на двадцати телах читается как сбой картинки.
    camAimSec: 1.5,
    // СПОКОЙНАЯ СЕРЕДИНА — доля экрана по ширине и по высоте, внутри которой боец
    // считается «в кадре» и наводка не нужна. Две трети, а не весь экран: боец у
    // самой кромки формально виден, но следить за ним нельзя, и именно ради этого
    // случая наводка и заведена.
    //
    // ⚠️ КРУПНОСТЬ ПРОВЕРЯЕТСЯ ТЕМ ЖЕ ЧИСЛОМ, ЧТО И ПОТОЛОК КАДРА (camMaxDistance).
    //    ТЗ просит «не мельче, чем в турнире QUAD», а 12 — это ровно то удаление,
    //    на которое кадр встаёт в QUAD (см. выше). Второго числа для той же
    //    крупности заводить нельзя: они разойдутся.
    camCalmFrac: 2 / 3,
    // СЛАБИНА НА ДРОЖЬ при сравнении «не дальше, чем встала бы наводка».
    //
    // ⚠️ ЭТО НЕ РУЧКА НАСТРОЙКИ. Камеру каждый кадр подталкивают затухание
    //    управления и зажим сдвига, и без слабины сравнение «ровно на своём
    //    удалении» не выполняется никогда. Крутить это число незачем: поведение
    //    задаётся не им, а camMaxDistance и camCalmFrac.
    camAimSlack: 0.5,
    // --- УКРЫТИЯ. Низкие толстые блоки, дробящие общую свалку на местные стычки.
    //
    //     ⚠️ СЛОВО «СТЕНА» ЗДЕСЬ НЕ УПОТРЕБЛЯЕТСЯ — решение владельца 17.09.2026.
    //        При росте бойца 1.85 и плече 1.50 получается предмет ШИРЕ, ЧЕМ ВЫШЕ:
    //        1.7 на 1.5. Это не стена и не лабиринт, это бетонный блок на боевом
    //        поле, и называть его стеной значит обещать глазу не то.
    cover: {
      // ТОЛЩИНА — ГЛАВНОЕ ЧИСЛО, И ОНО НЕ ПРО ВИД, А ПРО ПРАВИЛО.
      //
      // Требование: сквозь укрытие нельзя достать. Проверка удара в этой игре —
      // расстояние между ЦЕНТРАМИ тел, угол не учитывается вовсе. Самая длинная
      // дотяжка — сбив: гейт 1.7, а фактический контакт разрешается ещё на 0.45
      // дальше, то есть 2.15 между центрами. Тела не сходятся ближе 0.74, значит
      // прижавшись к укрытию с двух сторон они разойдутся на «толщина + 0.74».
      //
      // Отсюда минимум 1.41. Взято 1.7 — ровно тот радиус удара, что уже живёт в
      // игре (STRIKE), с запасом 0.29 сверх самой длинной дотяжки. Второго числа
      // для той же величины не заводим.
      //
      // ⚠️ ТОЛЩИНА РАБОТАЕТ НА КАМЕРУ, А НЕ ПРОТИВ. Камера стоит под 33°; боец за
      //    ТОНКИМ укрытием (0.6) закрыт на 47 % — это нарушение правила «не больше
      //    трети». За толстым он закрыт на 9 %: толщина отодвигает его от
      //    заслоняющей кромки. Утоньшишь — сломаешь кадр, а не только правило.
      thickness: 1.7,
      // ВЫСОТА — ПО ПЛЕЧО. Плечо бойца 1.50 (бедро 0.93 + 0.57), рост 1.85.
      // Камера сверху должна видеть бойца за укрытием — на этом стоит число.
      height: 1.5,
      // ПРОХОД между соседними укрытиями, в мировых единицах. Не «два бойца бок о
      // бок» (это 1.5 и при двадцати телах даёт затор), а три — решение владельца
      // 17.09.2026. Сам не крутить: появятся заторы — доложить числом.
      gap: 3.0,
      // ДВА КОЛЬЦА, ОБА ПО ДВАДЦАТЬ ЭЛЕМЕНТОВ.
      //
      // ⚠️ ДВАДЦАТЬ — НЕ ВКУС, А СИММЕТРИЯ. Сторон на поле 20, 10 или 5, и все три
      //    числа делят двадцать. Раскладка с двадцатикратной симметрией одинакова
      //    для КАЖДОГО стартового места во ВСЕХ ТРЁХ раскладках разом. Возьми 10
      //    или 12 — и в SOLO половина сторон стартовала бы против прохода, а
      //    половина против блока, то есть старт давал бы выгоду.
      //
      // Внешнее кольцо — вытянутые блоки, внутреннее — квадратные столбы. Радиусы
      // подобраны так, чтобы просвет на обоих вышел ровно `gap`.
      // ⚠️ РАДИУСЫ — ДОЛИ ОТ КОЛЬЦА ВЫХОДА, А НЕ МИРОВЫЕ ЕДИНИЦЫ. Поле считается
      //    от кольца выхода; напиши радиусы числами — и при первой же правке
      //    просвета между сторонами укрытия остались бы там, где стояли, а поле
      //    уехало. При уменьшении поля внешнее кольцо село бы на точки выхода.
      //
      //    ДЛИН БЛОКОВ ЗДЕСЬ НЕТ НАМЕРЕННО: требование — просвет (`gap`), а длина
      //    из него и следует. Держать оба числа значило бы держать два имени у
      //    одной величины, и они разошлись бы.
      outerCount: 20,
      outerRadiusFrac: 0.77,
      innerCount: 20,
      innerRadiusFrac: 0.52,
      // ВНУТРЕННЕЕ КОЛЬЦО ПОВЁРНУТО НА ПОЛШАГА. Иначе через оба кольца шли бы
      // прямые радиальные коридоры, и укрытия не дробили бы свалку, а канализовали
      // её: все побежали бы одними и теми же двадцатью дорожками.
      innerPhaseHalfStep: true,
      // --- ОБХОД. Сетка проходимости печётся один раз при сборке поля.
      // Шаг ячейки: просвет 3.0 при шаге 1.0 — это три клетки, и после раздутия на
      // радиус тела остаётся две. Мельче — сетка дорожает квадратом и ничего не
      // добавляет.
      cellSize: 1.0,
      // Радиус тела для раздутия препятствий и для выталкивания из укрытия.
      // Половина просвета тел (0.74) — то же число, которым тела держат друг друга.
      bodyRadius: 0.37,
      // Как часто боец пересчитывает путь. Заходы разведены по номеру бойца, иначе
      // все двадцать считали бы в одном кадре.
      repathSec: 1.0,
      // БЛИЖЕ ЭТОГО ОБХОД НЕ ВМЕШИВАЕТСЯ ВОВСЕ — боец видит настоящую цель.
      //
      // ⚠️ ЧИСЛО ОБЯЗАНО БЫТЬ БОЛЬШЕ САМОЙ ДЛИННОЙ ДОТЯЖКИ (2.15). Обход работает
      //    подменой ТОЧКИ, в которой боец видит врага; попади подмена в дистанцию
      //    удара — боец повернулся бы в сторону обхода и ударил в пустое место.
      //    Четыре даёт почти двойной запас.
      steerMinDist: 4.0,
    },
    // --- ЛИДЕР. Магнит поля: одна сторона объявляется лидером, и все остальные
    //     сходятся на неё. Без него двадцать сторон дерутся двадцатью отдельными
    //     стычками и поле не читается как один бой.
    leader: {
      // ЗАПАС СИЛЫ НА ЗАМЕНУ КОРОНЫ. Претендент должен быть сильнее носителя на
      // эту долю, иначе корона остаётся.
      //
      // ⚠️ НА ПЕРВУЮ КОРОНУ НЕ РАСПРОСТРАНЯЕТСЯ. Когда короны нет, берётся простой
      //    максимум — иначе на старте, где у всех полное здоровье и почти у всех
      //    сила ровно 1.0, лидер не появился бы за бой ни разу.
      margin: 0.10,
      // ДО ЭТОЙ СЕКУНДЫ ЛИДЕРА НЕТ ВОВСЕ. Стороны ещё стоят на кольце выхода с
      // полным здоровьем, и объявлять лидером того, кто просто выше бросил грани,
      // — значит назначить его до боя, а не по бою.
      delaySec: 10,
      // КАК ЧАСТО ПЕРЕСЧИТЫВАЕТСЯ СИЛА СТОРОН.
      recalcSec: 2,
      // КАК ЧАСТО КОРОНА ВООБЩЕ МОЖЕТ МЕНЯТЬ ХОЗЯИНА. Отдельное число от
      // пересчёта, и оно БОЛЬШЕ его намеренно: приёмка требует «ни одной смены
      // раньше 3 с после предыдущей», а пересчёт раз в 2 с сам по себе позволил бы
      // две смены с зазором в две секунды.
      //
      // ⚠️ ВЫБЫВАНИЕ СТОРОНЫ-ЛИДЕРА ЭТИМ ЧИСЛОМ НЕ ЗАДЕРЖИВАЕТСЯ: держать корону
      //    на стороне, которой больше нет, нельзя ни одной секунды.
      holdSec: 3,
      // --- ЛУЧ НАД БОЙЦОМ ЛИДЕРА. Единственное новое свечение на поле.
      // Тонкий и высокий: столб, а не конус и не шапка. Радиус мал намеренно —
      // луч отмечает точку, а не накрывает бойца.
      beamRadius: 0.16,
      beamHeight: 7.0,
      beamOpacity: 0.34,
      // ПЛАВНОЕ ПОЯВЛЕНИЕ И УХОД ПРИ СМЕНЕ КОРОНЫ, в секундах. Мгновенная
      // перестановка двадцати лучей читается как сбой картинки.
      beamFadeSec: 0.3,
    },
  },

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
  // ЧАСЫ ДЛИНЫ БОЯ — второй сторож. Вернуты 16.09.2026 на место удалённых
  // правкой 4b63c95d (19.06): та заменила накал по длине боя накалом по тишине
  // и тем сняла гарантию длины — активный бой не разогревался никогда, и пара
  // стойких не добивалась вовсе. Числа те же, что стояли до удаления: порог 25 с,
  // а разгон 28 с — это ровно прежний прирост 0.18 множителя в секунду, дошедший
  // до потолка ×6, переписанный в нынешнюю форму 0..1.
  escalateStartSec: 25, // с начала боя; до порога накал по длине = 0
  // Разгон подрезан 28 → 20 по замеру 16.09. 28 — это арифметика прежнего
  // прироста 0.18/с, и она честно вернула бои в 53-66 с, но мимо вилки: бои
  // кончались ровно тогда, когда накал доходил до потолка. Двадцать выводит
  // потолок на 45-ю секунду — в середину вилки. Порог 25 с не тронут: это
  // решение владельца от 16.06, а разгон был моей реконструкцией.
  escalateLengthRampSec: 20, // за сколько секунд после порога накал по длине доходит до 1
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

// Живучесть босса рейда → надбавка прочности в лист характеристик.
//
// Смягчение входящего урона = T / (T + K) и НАСЫЩАЕТСЯ: удвоив прочность, живучесть
// не удвоишь. Поэтому владелец крутит понятное «во сколько раз живучее», а надбавку
// считает эта функция — единственное место, где живёт обратный пересчёт.
//
//   живучесть D = (1 − soft(базовая)) / (1 − soft(T)), а 1 − soft(T) = K/(T+K),
//   поэтому D = (T + K) / (базовая + K)   →   T = D·(базовая + K) − K.
//   Надбавка = T / базовая − 1.
//
// Проверка: базовая 200, K = 1200, D = 3 → T = 3·1400 − 1200 = 3000 → +1400%.
export function toughnessBonusFor(durability) {
  const base = COMBAT_BALANCE.toughness;
  const K = COMBAT_BALANCE.toughnessK;
  const D = Math.max(1, Number(durability) || 1);
  const T = D * (base + K) - K;
  return T / base - 1;
}
