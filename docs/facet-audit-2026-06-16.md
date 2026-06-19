# Facet Audit — 2026-06-16

**Type:** read-only diagnostic. No code changed (verify: `git status` → only this file new).
**Scope:** all 60 facets (4 cores × 3 branches × 5 facets), checked by real numbers in the data, not by descriptions.
**Criterion (new model, 16.06):** every facet must read in two languages at once —
- **NUMBER** — a concrete shift in the body (strikePower / toughness / speed / a behaviour axis) that the engine actually consumes.
- **CHARACTER** — a distinct, role-playable personality trait ("I'm about the heavy exchange", "I bait and punish", "I grind you down").

Turned into no number → empty character (defect). Turned into no character → bare number (defect).

> **Re-read of the 09.06 / 13.06 audits.** Those measured facets against the OLD code-translator model and tagged `effects` / `conditionals` as "dead no-op weight". Under the LLM-consciousness model their role flipped: a tag can be a live *personality word* for the model even though the engine never executes it. So tags are **not** flagged as "dead/broken" here — only as **unsupported character** when a facet's whole identity rests on a mechanic that the engine doesn't have AND the facet's real number delivers something different.

---

## 0. Ground truth read from the code

| Layer | Where | Status |
|---|---|---|
| 8 axes (0–100, 50 neutral) | `behavior.js` AXES | distance · initiative · tempo · weight · stick · resilience · counter · slip |
| Axis → engine knob seam | `buildFighter.js:352–452, 882–953` | **All 8 axes consumed** (see map below) |
| `statBonus {stat,pct}` | `upgradeData.js mkBranch` + `combatBalance.js gradeBonusRamp` | Reaches math: strikePower scales `strikeDamage`, toughness scales `toughSoft`. 5 hard branches only. |
| `behaviorReadout {axis,delta}` | `upgradeData.js dominantShift` | Card label = largest-\|Δ\| shift. **null on hard branches.** |
| `effects` / `conditionals` | `behavior.js:85–86`, `upgradeData.js:85–86` | **Stored only.** `resolveBehavior` pushes them into arrays; `buildFighter` never reads `behavior.effects`/`.conditionals`. Pure no-op data → now "personality vocabulary". |

**Axis → knob map (all live):** distance→`character.range` (preferred range, navigate reads both ways) · initiative→`character.aggression` (press/bait odds + press-after-strike) · tempo→decision period + post-strike pause + multi-hit bias · weight→`speedMul`+`accelMul`+attack-style `heavy01`+`mobility` stat · stick→`stickEff` (press-after-strike, bait weight) · resilience→`dmgMulFor`/`stagMulFor` read **live** in `takeDamage` · counter→punish-after-being-hit chance in `takeDamage` · slip→DODGE frequency in `maneuver`.

**Two caveats that matter for the character read:**
1. **DODGE never blocks a hit.** `buildFighter.js:298–299` — "No impact, no damage — it never gates a hit." Slip raises DODGE frequency (body slips ~0.55u) but STRIKE radius is 2.0u and the hit-check uses live position at impact — so slip is *visual evasion*, not damage avoidance. Slip's described "evade" only half-lands.
2. **Hard-branch shifts are invisible on the card.** A hard facet's card shows `statBonus` (e.g. "+10% power"); its behaviour `shifts` (e.g. `resilience+12`) still fire in the fight but never surface as a readout. So a hard facet can have a **card-character** (the stat) that diverges from its **fight-character** (the shift) — see Unshaken / Read the Tell below.

**Number-projection result up front:** every one of the 60 facets carries ≥1 shift on a consumed axis, and 25 of them additionally carry a stat bonus that reaches damage/mitigation math. **No facet is a bare number with no body effect, and none is a character with zero number.** So the *raw* two-projection filter is passed by all 60. The damage is in the three quality defects below: duplicated characters, characters whose number delivers a *different* thing than the name promises, and axes almost no facet wears as its identity.

---

## 1. Full inventory + per-facet verdict

Legend — **Ч (number):** ✓ = real consumed shift; **+stat** = also a damage/mitigation stat bonus. **Х (character):** ✓ distinct · ⚠dup duplicates a sibling/branch archetype (Defect 1) · ✗mech identity rests on an absent mechanic, real number delivers something else (Defect 2).

### CORE 01 — ONSLAUGHT (natisk) · profile init90/stick85/tempo80

**RAM** (hard → strikePower):
| # | Facet | shifts | stat | tags | Ч | Х | note |
|---|---|---|---|---|---|---|---|
|1|Heavy Hit|weight+10|sp 4%|—|✓+stat|⚠dup|anchor "heavy hitter"; duplicated by 2/4/5 + whole STING branch|
|2|Guard Crush|weight+8|sp 7%|—|✓+stat|⚠dup ✗mech|"crush the guard" — no block/guard state; real effect = heavier+harder, = Heavy Hit|
|3|Unshaken|**resilience+12**|sp 10%|—|✓+stat|✗misfile|defensive shift + defensive name inside a *damage* branch; card shows +10% **power** (unrelated to shift)|
|4|Close Power|distance-8, weight+6|sp 14%|close_damage_ramp|✓+stat|⚠dup|"hit harder up close" — close_damage_ramp not coded; reads as heavy in-fighter|
|5|Breakthrough|weight+10|sp 22%|overload_strike|✓+stat|⚠dup|vertex; = Heavy Hit + dead tag|

**CHASE** (behaviour):
| # | Facet | shifts | readout | tags | Ч | Х | note |
|---|---|---|---|---|---|---|---|
|1|Hard Entry|distance-8, init+4|distance-8|—|✓|✓|"close the gap" — one of only 2 distance-headline facets|
|2|Run-Down|stick+8, init+6|stick+8|chase_strike|✓|⚠dup|"sticky chaser"; = Cut Off/Cling/Lockdown + VICE|
|3|Cut Off|stick+8, init+4|stick+8|—|✓|⚠dup|near-identical to Run-Down|
|4|Cling|stick+8, distance-6|stick+8|—|✓|⚠dup|stick again|
|5|Lockdown|stick+12, distance-8|stick+12|lockdown|✓|⚠dup|vertex; biggest stick, otherwise = branch|

**FRENZY** (behaviour) — **one of only 2 branches with a unique character (tempo/flurry)**:
| # | Facet | shifts | readout | tags | Ч | Х | note |
|---|---|---|---|---|---|---|---|
|1|Long Combo|tempo+8|tempo+8|—|✓|✓|anchor flurry|
|2|No Pause|tempo+10|tempo+10|—|✓|⚠dup-internal|same axis, only magnitude differs from 1/3/5|
|3|Building Momentum|tempo+6|tempo+6|hit_accel|✓|⚠dup-internal|hit_accel (ramp on landing) not coded; flat tempo|
|4|No Breather|tempo+6, stick+6|tempo+6|—|✓|✓|tempo+stick = the one varied facet (flurry that also presses)|
|5|Rampage|tempo+12|tempo+12|rampage|✓|⚠dup-internal|vertex; biggest tempo + dead tag|

### CORE 02 — RAIDER (nalet) · profile slip65/init70/tempo65

**JAB** (behaviour):
| # | Facet | shifts | readout | tags | Ч | Х | note |
|---|---|---|---|---|---|---|---|
|1|Quick Out|slip+10|slip+10|—|✓|⚠dup|"evasive poke"; = Far Bounce/Perfect Jab + whole SHADOW branch. Note slip = visual dodge only|
|2|Clean Entry|initiative+6|init+6|—|✓|⚠/✗|**only** behaviour facet that headlines initiative; but init+6 = *more aggression*, at odds with "clean/untouched entry" (no evade-on-entry mechanic)|
|3|Far Bounce|slip+10, distance+6|slip+10|—|✓|⚠dup|slip again, + spacing|
|4|Chain Step|tempo+6|tempo+6|clean_chain|✓|✓|tempo flavour in a slip branch — varied|
|5|Perfect Jab|slip+10, tempo+6|slip+10|perfect_jab|✓|⚠dup|vertex; slip again + dead tag|

**FEINT** (behaviour) — **worst branch: whole identity on an absent mechanic + counter-duplicate**:
| # | Facet | shifts | readout | tags | Ч | Х | note |
|---|---|---|---|---|---|---|---|
|1|Fake-In|counter+8|counter+8|feint|✓|✗mech ⚠dup|"feint" mechanic does not exist; counter+8 = punish-AFTER-being-hit, not bait-a-reaction. = TRAP|
|2|Punish Reaction|counter+8, tempo+4|counter+8|—|✓|✗mech ⚠dup|punishes "the reaction to a feint" — no feint/reaction trigger; generic counter|
|3|Broken Rhythm|tempo+6|tempo+6|rhythm_break|✓|✗mech|tempo+6 = *more/steadier* flurries — the **opposite** of "break your rhythm"|
|4|Cut the Wind-up|counter+8|counter+8|interrupt|✓|✗mech ⚠dup|no interrupt mechanic; counter+8 = post-hit punish|
|5|Feint Combo|counter+8, tempo+6|counter+8|feint_combo|✓|✗mech ⚠dup|vertex; generic counter + tempo|

**HUNT** (hard → strikePower):
| # | Facet | shifts | stat | tags | Ч | Х | note |
|---|---|---|---|---|---|---|---|
|1|Read the Tell|init-6, counter+6|sp 4%|—|✓+stat|✓/misfile|patient counter-puncher (good character) but in a *damage* branch; card shows +4% power, shift is init/counter|
|2|Strike the Open|weight+8|sp 7%|punish_open|✓+stat|⚠dup|punish_open not coded; = heavy hit|
|3|Charged Run|weight+8|sp 10%|charge|✓+stat|⚠dup ✗mech|"charge" (wind-up accrual) not coded; flat weight, = Strike the Open|
|4|Punish Aggression|counter+6, init+4|sp 14%|punish_aggression|✓+stat|⚠dup|counter — but card shows power; punish_aggression not coded|
|5|Lethal Entry|weight+12|sp 22%|lethal_entry|✓+stat|⚠dup|vertex; = heavy hit + dead tag|

### CORE 03 — BULWARK (skala) · profile resilience90/counter60/stick70

**BASTION** (hard → toughness) — **one of only 2 unique-character branches (resilience/tank)**, but **internally flat 5/5**:
| # | Facet | shifts | stat | tags | Ч | Х | note |
|---|---|---|---|---|---|---|---|
|1|Tough Hide|resilience+10|tough 4%|—|✓+stat|✓|anchor tank (resilience axis + toughness stat = double defensive support, clean)|
|2|Steady|resilience+8|tough 7%|—|✓+stat|⚠dup-internal|= Tough Hide, smaller|
|3|Catch Breath|resilience+6|tough 10%|breather_regen|✓+stat|✗mech|"catch breath / recover" implies HP **regen** — none exists; number delivers only mitigation|
|4|Dig In|resilience+8, distance-6|tough 14%|dig_in|✓+stat|⚠dup-internal|resilience again + close|
|5|Unbreakable|resilience+12|tough 22%|fortress|✓+stat|⚠dup-internal|vertex; resilience again|

**BREAKER** (hard → toughness):
| # | Facet | shifts | stat | tags | Ч | Х | note |
|---|---|---|---|---|---|---|---|
|1|Block & Jab|counter+8, distance-4|tough 4%|—|✓+stat|⚠dup ✗mech|no block-state; counter+toughness reads as "tank that hits back" (ok) but = TRAP/FEINT character|
|2|Catch the Wind-up|counter+8|tough 7%|—|✓+stat|⚠dup ✗mech|"catch the wind-up" — no interrupt; generic counter|
|3|Hard Meet|counter+8|tough 10%|—|✓+stat|⚠dup|counter again|
|4|Retaliation|counter+8|tough 14%|retaliate_ramp|✓+stat|⚠dup|counter; retaliate_ramp not coded|
|5|Counter Wall|counter+8, weight+6|tough 22%|counter_trap|✓+stat|⚠dup|vertex; counter again|

**VICE** (behaviour):
| # | Facet | shifts | readout | tags | Ч | Х | note |
|---|---|---|---|---|---|---|---|
|1|Body Shove|stick+8, distance-6|stick+8|—|✓|⚠dup|"grind/clinch"; = CHASE branch|
|2|Heavy Slam|weight+10|weight+10|—|✓|⚠dup|lone weight facet in a stick branch; = RAM/STING|
|3|No Way Around|stick+8|stick+8|—|✓|⚠dup|stick again|
|4|Pin|stick+8, distance-6|stick+8|pin|✓|⚠dup|= Body Shove + dead tag|
|5|Clinch|stick+10, weight+6|stick+10|clinch|✓|⚠dup|vertex; stick again|

### CORE 04 — AMBUSH (zasada) · profile counter90/distance80/slip75

**TRAP** (behaviour):
| # | Facet | shifts | readout | tags | Ч | Х | note |
|---|---|---|---|---|---|---|---|
|1|Hard Counter|counter+10|counter+10|—|✓|✓|anchor counter-puncher (clean, supported by coded counter chance)|
|2|Slip & Punish|counter+8, slip+6|counter+8|—|✓|✓|counter+slip = the one varied facet|
|3|Punish Aggression|counter+10|counter+10|punish_aggression|✓|⚠dup|= Hard Counter; punish_aggression-trigger not coded|
|4|Punish Whiff|counter+8|counter+8|punish_whiff|✓|⚠dup ✗mech|no whiff-detection/whiff-punish; counter+8 = post-hit punish, = Hard Counter|
|5|Perfect Trap|counter+10, slip+4|counter+10|perfect_trap|✓|⚠dup|vertex; counter again|

**SHADOW** (behaviour) — **internally flat 5/5 slip**:
| # | Facet | shifts | readout | tags | Ч | Х | note |
|---|---|---|---|---|---|---|---|
|1|Long Slip|slip+10|slip+10|—|✓|⚠dup|"elusive"; = JAB branch (and slip = visual dodge only)|
|2|Hard to Reach|slip+8, distance+6|slip+8|—|✓|⚠dup|slip + spacing|
|3|Run 'Em Ragged|slip+8|slip+8|exhaust|✓|✗mech|"tire the foe out" — no stamina/fatigue system; number = more dodges|
|4|Open Window|slip+8, distance+6|slip+8|evade_window|✓|⚠dup|= Hard to Reach + dead tag|
|5|Phantom|slip+12|slip+12|phantom|✓|⚠dup|vertex; slip again|

**STING** (hard → strikePower) — **internally flat 5/5 weight**:
| # | Facet | shifts | stat | tags | Ч | Х | note |
|---|---|---|---|---|---|---|---|
|1|Loaded Hit|weight+10|sp 4%|—|✓+stat|⚠dup|"heavy hitter"; = RAM branch|
|2|Longer Charge|weight+8, init-4|sp 7%|charge|✓+stat|⚠dup ✗mech|charge not coded; weight|
|3|Hit the Opening|weight+8, init-6|sp 10%|vulnerable_strike|✓+stat|⚠dup ✗mech|vulnerable_strike (opening-detection) not coded; weight|
|4|Pierce|weight+8|sp 14%|pierce|✓+stat|⚠dup|armor-pierce — no armor layer; flat weight|
|5|Execution|weight+14|sp 22%|execute|✓+stat|⚠dup|vertex; execute (HP-threshold finish) not coded; biggest weight|

---

## 2. Defect 1 — duplicated characters (CONFIRMED, strong)

### 2a. Shift-budget concentration (personality lever budget)

Sum of \|Δ\| across all 60 facets' shifts, per axis (total 660):

| Axis | Σ\|Δ\| | share | facets touching | dominant-readout count |
|---|---|---|---|---|
| **weight** | **132** | **20.0%** | 15 | 12 |
| **counter** | **130** | **19.7%** | 16 | 15 |
| slip | 86 | 13.0% | 10 | 8 |
| stick | 76 | 11.5% | 9 | 8 |
| tempo | 70 | 10.6% | 10 | 7 |
| distance | 70 | 10.6% | 11 | 2 |
| resilience | 56 | 8.5% | 6 | 6 |
| initiative | 40 | 6.1% | 8 | 2 |

- **weight + counter = 262 / 660 = 39.7%** of the entire personality budget on 2 of 8 axes (even split would be 25%).
- **The prior "~47%" estimate is REFUTED for current code** — it reflects the *pre-tuning* state. CLAUDE.md "Behaviour strength tuning" moved budget off counter (Σ 156→130) and weight (144→132) onto initiative (14→40), tempo, distance, slip. Post-tuning the figure is **39.7%**. Still the top-2 axes, still ~1.6× the even share, but no longer ~half.

### 2b. Branch-character collapse (the real duplication)

By dominant fight-shift, the 12 branches collapse into **6 archetypes — and only 2 are unique**:

| Archetype | Branches | facets |
|---|---|---|
| **counter-puncher** | FEINT · BREAKER · TRAP (+ HUNT partial) | **15** |
| **heavy hitter** | RAM · STING (+ HUNT partial) | **12** |
| sticky/clinch | CHASE · VICE | 8 |
| evasive/slip | JAB · SHADOW | 8 |
| **flurry (tempo)** — UNIQUE | FRENZY | 5 |
| **tank (resilience)** — UNIQUE | BASTION | 6 |

- **10 of 12 branches** share a character with at least one other branch. Only **FRENZY** (tempo) and **BASTION** (resilience) own a character no other branch repeats.
- **counter + heavy = 27/60 facets (45%)** headline as one of just two personalities.

### 2c. ТЗ suspicions — checked

| Claim | Verdict |
|---|---|
| ВОЛНОЛОМ (BREAKER) ≈ КАПКАН (TRAP) by "counter" character | **CONFIRMED.** Both 5/5 counter shifts. Divergence is only BREAKER's toughness stat + distance-4 (f1) / weight+6 (f5). |
| БАСТИОН (BASTION) — 4/5 "tank" | **CONFIRMED, stronger: 5/5** resilience shifts (+ 5/5 toughness stat). |
| ТАРАН (RAM) 1/4/5 — "heavy damage" | **CONFIRMED, broader: 4/5** (1 Heavy Hit, 2 Guard Crush, 4 Close Power, 5 Breakthrough are all weight). Only 3 Unshaken (resilience) breaks. |

### 2d. Internal flatness (same axis, only magnitude varies within a branch)

5/5 identical-axis branches: **BASTION** (resilience 10/8/6/8/12), **BREAKER** (counter ×5), **TRAP** (counter ×5), **SHADOW** (slip ×5), **STING** (weight ×5), **FRENZY** (tempo ×5). In these, the 5 facets differ only by number size + a dead flavour tag — the "five distinct upgrades" promise is, by character, one trait at five strengths.

---

## 3. Defect 2 — character without number support (CONFIRMED)

Engine **has**: range/positioning, aggression press/bait, tempo cadence, weight speed+attack-style, stick press-follow, resilience live mitigation+stagger, **counter = punish-after-being-HIT**, **slip = DODGE-frequency (cosmetic, no hit-block)**, strikePower/toughness stats. *(Audit-dated list also named the klich temporary-axis-delta system — since removed; see CLAUDE.md klich-removal record.)*

Engine **does NOT have**: accuracy / whiff-detection / whiff-punish · block-as-state · interrupt / wind-up cut · feint / bait-a-reaction · HP regen / "catch breath" · stamina / fatigue / "exhaust" · charge / wind-up accrual · armor / pierce · HP-threshold execute · on-landing damage ramp · opening/vulnerable detection.

Facets whose **named character rests on an absent mechanic while the real number delivers a different thing** (the dead tag is fine as a *word*; the defect is the number↔name mismatch):

| Facet | Promised character | What the number actually does |
|---|---|---|
| **FEINT 1 Fake-In** | feint / bait a reaction | counter+8 = punish after *I* get hit |
| **FEINT 2 Punish Reaction** | punish the foe's reaction | generic counter |
| **FEINT 3 Broken Rhythm** | break my rhythm to bait | tempo+6 = *steadier/faster* flurry (opposite) |
| **FEINT 4 Cut the Wind-up** | interrupt the wind-up | counter+8 post-hit punish |
| **FEINT 5 Feint Combo** | feint into combo | counter+tempo |
| **TRAP 4 Punish Whiff** | punish a whiff | counter+8 post-hit punish (no whiff trigger) |
| **BASTION 3 Catch Breath** | recover / regen HP | resilience+6 = mitigation only, no HP back |
| **SHADOW 3 Run 'Em Ragged** | tire the foe out | slip+8 = I dodge more (no stamina drain) |
| **HUNT 3 Charged Run** | charge a big hit | flat weight+8 (no accrual) |
| **STING 2 Longer Charge** | longer charge → bigger hit | flat weight+8 |
| **STING 3 Hit the Opening** | strike a detected opening | weight+8 (no opening detection) |
| **STING 5 Execution** | finish low-HP foe | biggest weight, no HP-threshold |
| **RAM 2 Guard Crush** | break the guard | heavier+harder hit (no guard state) |

**Whole-branch failure: FEINT (nalet b).** All 5 facets' identity is the feint/interrupt/rhythm family — none of which exists — and their real numbers are counter (4/5) + tempo, i.e. indistinguishable from TRAP. FEINT is the single weakest branch: Defect 2 (entire identity unsupported) **and** Defect 1 (counter-duplicate). This confirms the ТЗ "вся ветка ФИНТ".

**Bonus mismatch (not absent-mechanic, but number↔card):** **RAM 3 Unshaken** and **HUNT 1 Read the Tell** carry *defensive/patient* shifts (resilience+12 / init-6+counter) inside *damage* branches whose card shows a strikePower %. Their fight-character and card-character point in different directions.

**Slip caveat (affects 10 facets — JAB ×3, SHADOW ×5, TRAP 2/5):** "elusive / hard to hit" is only half-supported. Slip raises DODGE frequency, but DODGE explicitly never blocks a hit (`buildFighter.js:298`). So the evasive character reads visually but does not actually make the fighter harder to damage.

---

## 4. Defect 3 — frozen axes (CONFIRMED)

Coverage of the 8 axes across 60 facets:

| Axis | facets touching (any shift) | facets headlining it (dominant) | behaviour-readout headline (card) |
|---|---|---|---|
| counter | 16 | 15 | 9 (6 are inside hard branches → no readout) |
| weight | 15 | 12 | 4 (8 inside hard branches) |
| distance | 11 | **2** | 2 |
| slip | 10 | 8 | 8 |
| tempo | 10 | 7 | 7 |
| stick | 9 | 8 | 8 |
| initiative | **8** | **2** | **1** |
| resilience | 6 | 6 | **0** (all 6 inside hard branches → card shows toughness/strikePower, never "resilience") |

- **initiative** — ТЗ guessed "≈3 facets". Numerically 8 facets nudge it, but always as a small ±4/±6 *rider* behind a bigger shift: it is the dominant headline of **only 2** facets (JAB Clean Entry, HUNT Read the Tell), and the **behaviour readout of only 1** (Clean Entry). So as a *character*, initiative is effectively frozen — the ТЗ instinct is right.
- **resilience** — touched by 6 facets, but **all 6 sit inside hard branches** (BASTION ×5, RAM Unshaken). It is **never** a behaviour-card readout — the card always shows a toughness/strikePower %, so "resilience" never appears to the player/model as a personality at all. Fully frozen as a character lever.
- **distance** — headlines only 2 facets (CHASE Hard Entry, RAM Close Power), despite 11 touches; it's mostly a rider on stick/weight/slip facets.

**Frozen-as-character ranking:** resilience (0 behaviour readouts) > initiative (1) > distance (2). The arena drives all three live, so the engine isn't the bottleneck — the *facet set* simply almost never wears them as identity.

---

## 5. Summary

- **Two-projection raw filter:** 60/60 pass — every facet moves a consumed axis (35 via a behaviour readout, 25 via a stat bonus). No bare numbers, no empty characters at the crude level.
- **Defect 1 (duplicate character): CONFIRMED, strong.** weight+counter = 39.7% of shift budget (refutes "47%", which was pre-tuning). 10/12 branches collapse into 4 repeated archetypes; only FRENZY (tempo) and BASTION (resilience) are unique. counter+heavy = 45% of all facets. 6 branches are internally flat (one axis ×5). BREAKER≈TRAP, BASTION 5/5, RAM 4/5 — all confirmed.
- **Defect 2 (character w/o number): CONFIRMED.** 13 facets' named identity rests on a mechanic the engine lacks while the number delivers something else; the entire **FEINT** branch is unsupported (feint/interrupt/rhythm don't exist → it's just counter). Slip's "evasive" half-fails (DODGE doesn't block). 2 hard facets (Unshaken, Read the Tell) point their fight-character and card-character in opposite directions.
- **Defect 3 (frozen axis): CONFIRMED.** As *character* headlines: resilience 0 behaviour-readouts, initiative 1, distance 2 — three axes the facet set barely wears, though the engine drives all three.

**No code was modified. This file is the only change.**
