/* HEXLASH — pre-fight CONTENT + lookup (stubs · game design owns final copy).
   SINGLE source for all three screens (select → upgrade → arena). Core ids
   (natisk/nalet/skala/zasada) and face states (lit/open/locked) are CONTRACT —
   do not rename. English-only. Geometry lives in upgradeGeometry.js. */

import { COMBAT_BALANCE } from './combatBalance.js';

/* RESOURCE — сколько кристаллов одного бойца может гореть одновременно (из 15).
   ОДНО значение на всё: его читают хранилище бойца, сборка дерева (buildTree),
   карточка ядра (потолок и ряд шестиугольников под кнопкой), SPAR и соперники, собранные под
   число граней игрока. Крутить баланс — здесь и только здесь.
   Было 5; 7 с 30.09.2026. Уже зажжённое у бойцов не трогается: потолок вырос, а
   не сдвинулся. */
export const RESOURCE = 7;

/* Четыре ядра — производственная палитра. id → store (арена читает как есть).
   ix   — номер ядра (карточка «CORE 0N»).
   name — отображаемое имя (EN). sig — сила ядра одним словом.
   hue  — ЕДИНСТВЕННЫЙ цвет ядра (весь экран тонируется через --core).

   Второго тона в палитре нет (Документ А 2.3). Раньше `sup` объявлялся
   отдельным значением у каждого ядра — и все четыре расходились с магазином.
   Теперь пара выводится осветлением по ОДНОМУ правилу на все ядра:
   геттер `sup` ниже зовёт coreSup() из src/data/sceneTokens.js. */
import { coreSup, coreHue } from './sceneTokens.js';

// hue и sup — ГЕТТЕРЫ, а не значения. Цвет ядра объявлен один раз в
// src/styles/tokens.css (Правка 1.3 §1); здесь были его четвёртые копии
// литералами. Ленивость обязательна: этот файл подтягивается через хранилище
// на самом старте, когда стили могут быть ещё не применены.
const core = (id, ix, name, sig, manner) => ({
  id, ix, name, sig, manner,
  get hue() { return coreHue(id); },
  get sup() { return coreSup(coreHue(id)); },
});

export const CORES = [
  core('natisk', '01', 'ONSLAUGHT', 'PRESSURE',
    'Marches in close and never lets the distance go.'),
  core('nalet', '02', 'RAIDER', 'TEMPO',
    'Strikes, drops, strikes again — touches and gone.'),
  core('skala', '03', 'BULWARK', 'DURABILITY',
    'Takes the hit, grinds it down, gives it back later.'),
  core('zasada', '04', 'AMBUSH', 'COUNTER',
    'Waits in silence, then a single, paid-in-full strike.'),
];

/* face: { id, name, state, shifts, conditionals, effects }
   state ∈ 'lit' | 'open' | 'locked'  — DO NOT rename states.

   Facet behaviour contract (data-каркас, src/data/behavior.js). Every facet
   carries three lists; the resolver reads them uniformly:
     shifts       — flat lever changes, each { axis, delta }: axis ∈ behaviour
                    AXES, delta added to the 0..100 lever, result clamped. Read
                    + applied now (cores fight by core profile + lit-facet shifts).
     conditionals — string tags for condition-fired / accruing mechanics. STORED
                    only this pass — behaviour approximated by the shifts above
                    until the tagged mechanic is coded.
     effects      — string tags for branch-tip tricks (vertices). STORED only —
                    coded point-by-point later, approximated by shifts for now.
     bonuses      — optional [{ stat, pct }] competence adds BEYOND the hard-branch
                    ramp (blockPenetration, interruptResist, …). LIVE — resolveBehavior
                    sums them into statBonuses → buildFighter `sb.*` → the real
                    mechanic (block pierce, interrupt resistance). Surfaced on the
                    facet as `extraBonuses`.

   This pass: every facet is 'open' (no lit/locked gating yet) and each branch's
   `limit` is its full size — the global RESOURCE pool is the real cap until
   pricing lands. Lighting many at once pins the axes (temporary, awaits pricing). */
const s = (axis, delta) => ({ axis, delta }); // axis-shift shorthand (movement manner)
const b = (stat, pct) => ({ stat, pct }); // competence-bonus shorthand (facet → sb.* seam)

/* Largest-magnitude axis shift of a facet (its dominant lever), as the
   behaviour READOUT for the future card: { axis, delta } of the biggest |delta|
   (first wins on a tie → deterministic). Pure read of the EXISTING shifts — no
   new logic, no extra fight effect. null if the facet has no shifts. */
function dominantShift(shifts) {
  let best = null;
  for (const sh of shifts || []) {
    if (!sh) continue;
    if (!best || Math.abs(sh.delta) > Math.abs(best.delta)) best = sh;
  }
  return best ? { axis: best.axis, delta: best.delta } : null;
}

/* mkBranch(id, name, faces, stat?) — `stat` tags a "hard" branch (strikePower /
   toughness): each facet then carries a `statBonus { stat, pct }` — a percent to
   that characteristic, sized by depth from COMBAT_BALANCE.gradeBonusRamp (this is
   the NEW number layer; the facet's behaviour shifts are untouched). On the other
   (behaviour) branches `stat` is null and each facet instead surfaces a
   `behaviorReadout { axis, delta }` from its dominant existing shift — DATA ONLY
   for the card, no new fight effect. Each facet ends up with exactly one readout:
   `statBonus` (hard) or `behaviorReadout` (behaviour); the other is null. */
function mkBranch(id, name, faces, stat = null, key = null) {
  const ramp = (key && COMBAT_BALANCE.branchRamp[key]) || COMBAT_BALANCE.gradeBonusRamp;
  const extra = (i) => Object.entries((key && COMBAT_BALANCE.facetBonus[`${key}.${i + 1}`]) || {}).map(([stat, pct]) => ({ stat, pct }));
  return {
    id,
    name,
    limit: faces.length, // full branch openable; RESOURCE pool is the live cap
    faces: faces.map((f, i) => {
      const shifts = f.shifts || [];
      // statBonus pct by depth (i=0..4 → grade 1..5); clamp the index defensively.
      const statBonus = stat
        ? { stat, pct: ramp[Math.min(i, ramp.length - 1)] }
        : null;
      return {
        id: i + 1,
        branch: id, // id ветки (a/b/c): резонанс ветки считает кристаллы по нему (TZ_grani_tags_v1)
        name: f.name,
        state: 'open',
        shifts,
        conditionals: f.conditionals || [],
        effects: f.effects || [],
        // Competence adds beyond the hard-branch ramp — flow to statBonuses → sb.*
        // (blockPenetration, interruptResist, …). LIVE; empty on most facets.
        extraBonuses: [...(f.bonuses || []), ...extra(i)],
        // UI readout (data only; rendered by a later upgrade-screen pass):
        statBonus, // hard branches: { stat, pct } — % to the characteristic
        behaviorReadout: stat ? null : dominantShift(shifts), // behaviour branches: { axis, delta }
      };
    }),
  };
}

/* CRYSTALS[coreId] = [{ id, name, limit, faces:[{ id, name, state, shifts,
   conditionals, effects }] }]. Three branches per core, five facets each (1→5,
   the 5th is the branch tip / vertex). limit — per-crystal cap (= branch size
   here); double-clamp with the global RESOURCE pool. */
export const CRYSTALS = {
  natisk: [
    // RAM — a slow, heavy fighter that breaks straight THROUGH the guard. Number:
    // strikePower (the branch's OWN ramp, combatBalance.branchRamp['natisk.a'] — 1…4%,
    // not the shared gradeBonusRamp) + blockPenetration (Guard Crush / Breakthrough,
    // the REAL pierce seam) + interrupt resistance (Unshaken).
    // Movement: weight UP = a heavier, slower gait — manner, NOT damage (that's
    // strikePower). No counter (not RAM's home).
    mkBranch('a', 'RAM', [
      // Heavier, slower, more crushing blow: strikePower (ramp + facetBonus +8%) + a weightier gait. Темп −25 — компенсация внутри кристалла
      // («Heavy and unhurried. Trades speed for mass»): без неё +8% силы выводили Ц2 ONS BODY к +23 (≤ +25).
      { name: 'Heavy Hit', shifts: [s('weight', 14), s('tempo', -25)] },
      // Caves a raised guard: really pierces part of the block (blockPenetration seam, +12%).
      { name: 'Guard Crush', shifts: [s('weight', 8)], bonuses: [b('blockPenetration', COMBAT_BALANCE.ramGuardCrushPen)], conditionals: ['guard_crush'] },
      // Hard to knock off the swing: interrupt-resistance seam (+10%) + holds steady.
      { name: 'Unshaken', shifts: [s('resilience', 5)], bonuses: [b('interruptResist', COMBAT_BALANCE.ramUnshakenInterruptResist)], conditionals: ['unshaken'] },
      // The closer it gets, the more it breaks (close_damage_ramp — conditional,
      // approximated by the close-in shift until the ramp mechanic is coded).
      { name: 'Close Power', shifts: [s('distance', -8), s('weight', 6)], conditionals: ['close_damage_ramp'] },
      // VERTEX — through the guard: the branch's strongest block pierce (+20%) + an overload hit.
      { name: 'Breakthrough', shifts: [s('weight', 10)], bonuses: [b('blockPenetration', COMBAT_BALANCE.ramBreakthroughPen)], effects: ['overload_strike'] },
    ], 'strikePower', 'natisk.a'),
    // CHASE — a fast, clingy pursuer that captures distance and won't let go.
    // Number/movement: initiative + distance (close the gap) up front, then stick
    // (cling, cut escape) through the tip. Stays light/quick — no weight; no counter.
    mkBranch('b', 'CHASE', [
      // Explodes into range — a sharp entry that closes the gap.
      { name: 'Hard Entry', shifts: [s('distance', -6), s('initiative', 6)], conditionals: ['hard_entry'] },
      // Runs down a retreating foe: presses + keeps closing (chase_strike conditional).
      { name: 'Run-Down', shifts: [s('stick', 5), s('distance', -4)], conditionals: ['chase_strike'] },
      // Cuts off the angles / escape routes — pure cling.
      { name: 'Cut Off', shifts: [s('stick', 6)], conditionals: ['cut_off'] },
      // Clings on, won't be shaken off, and stays glued in close.
      { name: 'Cling', shifts: [s('stick', 6), s('distance', -4)], conditionals: ['cling'] },
      // VERTEX — pins the foe in close: stick to the ceiling, almost no disengage.
      { name: 'Lockdown', shifts: [s('stick', 8), s('distance', -6)], effects: ['lockdown'] },
    ], null, 'natisk.b'),
    // FRENZY — accelerating, relentless TEMPO. Number/movement: tempo across the
    // whole branch — longer strings, shorter gaps, ramps as it lands. No weight,
    // no counter. No Breather wants enemy-regen suppression (a CROSS-FIGHTER seam,
    // NOT built — see report); its tempo+stick approximate the relentlessness for
    // now. Rampage ramps with no ceiling, the escalate safeguard as the backstop.
    mkBranch('c', 'FRENZY', [
      // Longer strings of blows.
      // Заход 6: серии + короче пауза в радиусе (facetBonus natisk.c.1). Компенсация внутри кристалла — accuracy −65% (facetBonus: серия размашистее, больше промахов — «Looser aim»): штраф множится на силу самой сборки, поэтому не даёт перекоса между одиночкой, гранью и сборками.
      { name: 'Long Combo', shifts: [s('tempo', 3)], conditionals: ['long_combo'] },
      // Shorter gaps between attacks.
      { name: 'No Pause', shifts: [s('tempo', 3)], conditionals: ['no_pause'] },
      // Speeds up as it lands (hit_accel — conditional, accruing accel later).
      // Заход 6: разгон со временем боя (facetBonus natisk.c.3 lateRamp). Компенсация — accuracy −42% (facetBonus): разогнавшийся чаще мажет.
      { name: 'Building Momentum', shifts: [s('tempo', 2)], conditionals: ['hit_accel'] },
      // Never lets the foe recover (no_breather — REQUIRES a cross-fighter regen-
      // suppression seam; tagged + approximated by tempo+stick pressure for now).
      { name: 'No Breather', shifts: [s('tempo', 3), s('stick', 6)], conditionals: ['no_breather'] },
      // VERTEX — ramps with no ceiling.
      { name: 'Rampage', shifts: [s('tempo', 3)], effects: ['rampage'] },
    ], null, 'natisk.c'),
  ],
  nalet: [
    // JAB (УКОЛ) — hit-and-run pricker: accurate first strike, big bounce out past
    // the answer, quick in-out tempo. Number: accuracy (Pinpoint Entry — REAL miss
    // seam) + distance (the bounce). Movement: light/quick (low weight kept, no
    // dump up). No counter (not its home).
    mkBranch('a', 'JAB', [
      // Strike then bounce out fast — a quick in-out exchange.
      { name: 'Quick Out', shifts: [s('distance', 8), s('tempo', 6)], conditionals: ['quick_out'] },
      // Pinpoint first strike: a better-aimed entry (accuracy seam, +20%).
      { name: 'Pinpoint Entry', shifts: [s('initiative', 9)], bonuses: [b('accuracy', COMBAT_BALANCE.jabPinpointAccuracy)], conditionals: ['pinpoint_entry'] },
      // Bounces out beyond the foe's counter-range, elusive on the way.
      { name: 'Far Bounce', shifts: [s('distance', 10), s('slip', 6)] },
      // A clean trade speeds the next dart-in (clean_chain — conditional).
      { name: 'Clean Exchange', shifts: [s('tempo', 8)], conditionals: ['clean_chain'] },
      // VERTEX — enter-hit-exit as one motion: almost nothing to answer with.
      { name: 'Perfect Prick', shifts: [s('initiative', 10), s('distance', 8), s('slip', 6)], effects: ['perfect_jab'] },
    ], null, 'nalet.a'),
    // FEINT (ФИНТ) — a real trickster on the LIVE feint mechanic: fakes often,
    // punishes the bite hard, and breaks its own rhythm so the foe can't read the
    // real attack. Number: feintChance / feintPayoff seams + variable tempo. No
    // counter, no weight (light).
    mkBranch('b', 'FEINT', [
      // Throws a few more fakes — the feint-frequency seam (a small lift).
      { name: 'Fake-In', shifts: [s('tempo', 4)], bonuses: [b('feintChance', COMBAT_BALANCE.feintFakeInChance)], conditionals: ['fake_in'] },
      // When the foe bites a feint, the punish strike bites harder (payoff seam).
      { name: 'Punish Reaction', shifts: [s('tempo', 4)], bonuses: [b('feintPayoff', COMBAT_BALANCE.feintPunishPayoff)], conditionals: ['punish_reaction'] },
      // Breaks the rhythm — variable cadence, the real attack hides in the noise.
      { name: 'Broken Rhythm', shifts: [s('tempo', 8)], conditionals: ['rhythm_break'] },
      // Jolts the foe's swing with a fake (feint → interrupt). REQUIRES a seam —
      // a feint lands nothing, so it can't interrupt today (tagged, see report).
      { name: 'Feint to Interrupt', shifts: [s('tempo', 6)], conditionals: ['feint_interrupt'] },
      // VERTEX — fake → opening → clean strike: the branch's biggest feint payoff + some block pierce.
      { name: 'Setup Combo', shifts: [s('tempo', 6)], bonuses: [b('feintPayoff', COMBAT_BALANCE.feintSetupPayoff)], effects: ['feint_combo'] },
    ], null, 'nalet.b'),
    // HUNT (ОХОТА) — a patient hunter that loads a charged haymaker and reads the
    // opening. Number: strikePower (own ramp, branchRamp['nalet.c']) + charge (Charged Run gain, Killing Run
    // power — REAL charge seams) + accuracy (Read the Tell). counter ONLY on
    // Punish Aggression. Light — no weight dump (was heavy; removed).
    mkBranch('c', 'HUNT', [
      // Studies the foe (waits a touch longer), then answers with better aim (accuracy seam).
      { name: 'Read the Tell', shifts: [s('initiative', -6)], bonuses: [b('accuracy', COMBAT_BALANCE.huntReadAccuracy)], conditionals: ['read_tell'] },
      // Harder on a spent / open foe (punish_exhausted). REQUIRES a seam — needs to
      // read the foe's stamina for the damage bonus (tagged, see report).
      { name: 'Strike the Open', shifts: [s('initiative', 4)], conditionals: ['punish_exhausted'] },
      // Builds the charge while spacing / circling out (charge-gain seam).
      { name: 'Charged Run', shifts: [s('distance', 6)], bonuses: [b('chargeGain', COMBAT_BALANCE.huntChargedGain)], conditionals: ['charged_run'] },
      // The ONLY counter in RAIDER — the more the foe presses, the more it pays.
      { name: 'Punish Aggression', shifts: [s('counter', 10)], conditionals: ['hunt_reply'] },
      // VERTEX — one loaded, devastating run: a full charge releases at max power.
      { name: 'Killing Run', shifts: [s('distance', 6)], bonuses: [b('chargePower', COMBAT_BALANCE.huntKillingPower)], effects: ['lethal_entry'] },
    ], 'strikePower', 'nalet.c'),
  ],
  skala: [
    // BASTION (БАСТИОН) — a sturdy wall that recovers its wind. Number:
    // toughness (the branch's OWN ramp, branchRamp['skala.a']) + blockMitigation (Unbreakable — REAL block
    // strength) + stamina regen (Catch Breath — REAL breathing seam). Movement:
    // resilience (holds steady / digs in close). No counter (not its home).
    mkBranch('a', 'BASTION', [
      // Takes the blow better — shrugs more off (toughness ramp), holds steady.
      { name: 'Tough Hide', shifts: [s('resilience', 3)], conditionals: ['tough_hide'] },
      // Rarely knocked off its rhythm by incoming hits (resilience holds the beat).
      { name: 'Steady Guard', shifts: [s('resilience', 2)], conditionals: ['steady_guard'] },
      // Catches its breath in the lulls — recovers stamina faster (regen seam).
      { name: 'Catch Breath', shifts: [s('resilience', 3)], bonuses: [b('staminaRegen', COMBAT_BALANCE.bastionBreathRegen)], conditionals: ['catch_breath'] },
      // The longer it holds ground, the harder it gets (dig_in — time-ramp of
      // toughness; conditional, approximated by planting close until it's coded).
      { name: 'Dig In', shifts: [s('distance', -6)], conditionals: ['dig_in'] },
      // VERTEX — a stronger held guard: +15% block strength on top of the base cut (blockMitigation).
      { name: 'Unbreakable', shifts: [s('resilience', 2)], bonuses: [b('blockMitigation', COMBAT_BALANCE.bastionFortressMitigation)], effects: ['fortress'] },
    ], 'toughness', 'skala.a'),
    // BREAKER (ВОЛНОЛОМ) — a close-range block-counter wall. Number: toughness
    // (own ramp, branchRamp['skala.b']) + the REAL onBlock riposte (sb.blockCounter) + the interrupt-catch
    // reward (sb.interruptBonus) + counter (its HOME). Kept in the near zone: NO
    // slip (it stands and blocks, never weaves) — that splits it from the future
    // КАПКАН (a far-range slip-counter). High stick/resilience (core + stick adds).
    mkBranch('b', 'BREAKER', [
      // After a block, the answer bites — the next strike ripostes harder (onBlock).
      { name: 'Riposte', shifts: [s('counter', 8), s('stick', 6)], bonuses: [b('blockCounter', COMBAT_BALANCE.breakerRiposteBonus)], conditionals: ['riposte'] },
      // Punishes a caught swing — catching the foe's windup hits harder (interrupt).
      { name: 'Catch & Punish', shifts: [s('counter', 8)], bonuses: [b('interruptBonus', COMBAT_BALANCE.breakerInterruptBonus)], conditionals: ['catch_punish'] },
      // Meets the incoming fighter harder — counter + close stick.
      { name: 'Hard Meet', shifts: [s('counter', 10), s('stick', 6)], conditionals: ['hard_meet'] },
      // The more it has eaten, the harder it answers (retaliate_ramp — damage-taken
      // ramp of the counter; conditional, approximated by counter until coded).
      { name: 'Retaliation', shifts: [s('counter', 7)], conditionals: ['retaliate_ramp'] },
      // VERTEX — sea wall: the branch's strongest post-block riposte (+60%) and a
      // catch bonus (+60%; Hard Meet's +90% is higher) + counter.
      { name: 'Sea Wall', shifts: [s('counter', 8), s('stick', 6)], bonuses: [b('blockCounter', COMBAT_BALANCE.breakerTrapRiposte), b('interruptBonus', COMBAT_BALANCE.breakerTrapInterrupt)], effects: ['counter_trap'] },
    ], 'toughness', 'skala.b'),
    // VICE (ТИСКИ) — locks the foe in place with mass. Number/movement: stick (hold
    // the foe in front) + heavy weight (slow, weighty) + blockPenetration (a heavy
    // press is hard to block). Does NOT chase — initiative stays low (core), which
    // splits it from ТАРАН (the chasing hammer). No counter.
    mkBranch('c', 'VICE', [
      // Shoves the foe with its body — presses in close.
      { name: 'Body Shove', shifts: [s('stick', 6), s('distance', -6)], conditionals: ['body_shove'] },
      // A heavy, slow blow that's hard to block (weight + block pierce).
      { name: 'Heavy Slam', shifts: [s('weight', 10)], bonuses: [b('blockPenetration', COMBAT_BALANCE.viceSlamPen)], conditionals: ['heavy_slam'] },
      // Won't let the foe slip around it — holds it in front (stick, no chase).
      { name: 'No Way Around', shifts: [s('stick', 7)], conditionals: ['no_way_around'] },
      // Pins it: the closer it gets, the tighter the hold (pin — close-grip ramp;
      // conditional, approximated by stick + closing in until coded).
      { name: 'Pin', shifts: [s('stick', 6), s('distance', -6)], conditionals: ['pin'] },
      // VERTEX — clinch: stick to the ceiling + a heavy grinding, piercing press.
      { name: 'Clinch', shifts: [s('stick', 11), s('weight', 8)], bonuses: [b('blockPenetration', COMBAT_BALANCE.viceClinchPen)], effects: ['clinch'] },
    ], null, 'skala.c'),
  ],
  zasada: [
    // TRAP (КАПКАН) — counters from RANGE: a dodge or a foe whiff turns into a heavy
    // answer. Number: counter (its HOME) + the REAL dodge-counter (sb.dodgeCounter)
    // + the REAL miss-counter (sb.missCounter, activates onMiss). Anchor: high slip
    // + high distance (punishes while slipping away) — this splits it from ВОЛНОЛОМ
    // (slip 15, stands & blocks). Both counter, but at opposite ranges.
    mkBranch('a', 'TRAP', [
      // Bites back harder on the foe's attack — more punishing counter.
      { name: 'Hard Counter', shifts: [s('counter', 6)], conditionals: ['hard_counter'] },
      // Off the line, a counter — a slipped hit arms the riposte (dodge-counter +30%, заход 6: обещание карточки «stronger counter» теперь читается;
      // увод slip +4 → +1 — компенсация внутри кристалла, чтобы одиночка остался в Ц3 ≤ +12).
      { name: 'Slip Counter', shifts: [s('slip', 1)], bonuses: [b('dodgeCounter', COMBAT_BALANCE.trapDodgeCounter)], conditionals: ['slip_counter'] },
      // The harder the foe presses, the harder the answer (punish_aggression —
      // counter-ramp by foe aggression; conditional, approximated by counter).
      { name: 'Punish Aggression', shifts: [s('counter', 5)], conditionals: ['punish_aggression'] },
      // Punishes a whiff — the foe's miss opens the counter window (onMiss seam).
      { name: 'Punish Whiff', shifts: [s('counter', 5)], bonuses: [b('missCounter', COMBAT_BALANCE.trapMissCounter)], conditionals: ['punish_whiff'] },
      // VERTEX — perfect trap: the branch's strongest post-dodge counter (+40%, above Slip Counter's +30%; заход 6); the post-whiff
      // counter is +5% (Punish Whiff's +40% is higher). Оси вершины (counter +2, slip +2) убраны — компенсация внутри вершины, одиночка в Ц3 ≤ +12.
      { name: 'Perfect Trap', shifts: [], bonuses: [b('dodgeCounter', COMBAT_BALANCE.trapPerfectDodge), b('missCounter', COMBAT_BALANCE.trapPerfectMiss)], effects: ['perfect_trap'] },
    ], null, 'zasada.a'),
    // SHADOW (ТЕНЬ) — an untouchable that wears the foe down with distance. Number/
    // movement: high slip + distance (elusive, far). No counter (not its home).
    mkBranch('b', 'SHADOW', [
      // Slips further / sharper away.
      { name: 'Long Slip', shifts: [s('slip', 8), s('distance', 5)], conditionals: ['long_slip'] },
      // Harder to reach — holds the distance more cunningly.
      { name: 'Hard to Reach', shifts: [s('slip', 6), s('distance', 5)], conditionals: ['hard_to_reach'] },
      // Wears the foe ragged: the distance forces a chase, and chasing already
      // drains the foe's stamina (move-drain). EMERGENT — approximated by distance;
      // an amplified version wants a foe-stamina-drain seam (see report).
      { name: "Run 'Em Ragged", shifts: [s('distance', 4), s('slip', 4)], conditionals: ['exhaust'] },
      // After a slip, the window for its OWN entry opens wider (shared dodge-counter
      // channel — the dodge sets up the next strike).
      { name: 'Open Window', shifts: [s('slip', 6)], bonuses: [b('dodgeCounter', COMBAT_BALANCE.shadowDodgeWindow)], conditionals: ['open_window'] },
      // VERTEX — phantom: slips a whole series, then a clean answer (very high slip).
      { name: 'Phantom', shifts: [s('slip', 9), s('distance', 5)], effects: ['phantom'] },
    ], null, 'zasada.b'),
    // STING (ЖАЛО) — a standing charge bomb. Number: strikePower (ramp) + the REAL
    // charge seams — power (Loaded / Execution), ceiling (Long Charge), pierce; strikePower
    // rides the branch's OWN ramp (branchRamp['zasada.c']). Anchor:
    // LOW initiative + high distance (stands far and loads its moment) — this splits
    // it from ОХОТА (mobile, fast chargeGain). ЖАЛО waits LONGER for a BIGGER hit.
    mkBranch('c', 'STING', [
      // The loaded blow lands heavier — a little more charge-release power (+5%).
      { name: 'Loaded Hit', shifts: [s('distance', 6)], bonuses: [b('chargePower', COMBAT_BALANCE.stingLoadedPower)], conditionals: ['loaded_hit'] },
      // Waits longer for a bigger charge — a higher ceiling (+60%), and stands to load it
      // (low initiative, far distance — patient spacing, not a lunge).
      { name: 'Long Charge', shifts: [s('distance', 4)], bonuses: [b('chargeMax', COMBAT_BALANCE.stingLongChargeMax)], conditionals: ['long_charge'] },
      // Strikes at the foe's vulnerable moment (vulnerable_strike — reads the foe's
      // stamina for the opening; conditional, REQUIRES a foe-state seam, see report).
      { name: 'Hit the Opening', shifts: [s('initiative', -6)], conditionals: ['vulnerable_strike'] },
      // One charged strike pierces any guard — charge-release block pierce.
      { name: 'Pierce', shifts: [s('distance', 6)], bonuses: [b('chargePen', COMBAT_BALANCE.stingPiercePen)], conditionals: ['pierce'] },
      // VERTEX — the heaviest charged blow in the branch (+7% release power over Loaded Hit's +5%).
      { name: 'Execution', shifts: [s('distance', 5)], bonuses: [b('chargePower', COMBAT_BALANCE.stingExecutionPower)], effects: ['execute'] },
    ], 'strikePower', 'zasada.c'),
  ],
};

/* Look up a core by id. One id contract across all three screens — no bridge.
   Fallback to BULWARK (CORES[2]) keeps upgrade/arena sane if the pick is empty
   (the route guard normally blocks that). */
export const getCore = (id) => CORES.find((c) => c.id === id) || CORES[2];
