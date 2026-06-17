# Combat Math Snapshot (read-only)

A factual dump of the current fight maths, to inform bout-length tuning. **No code
changed** — every number below is read from source as of this snapshot.

- Constants: `src/data/combatBalance.js` (`COMBAT_BALANCE`)
- Damage formula + cadence: `src/scene/buildFighter.js` (`strikeDamage`, `takeDamage`, `resolveImpact`, `decideAttack`)
- Escalation: `src/scene/ArenaScene.vue` (`escalationMult`)

Target stated in code header: **~40–50 s / ~16–17 landed hits**. Current tuning
goal (per request): **~25–30 s**. The header target was never retuned down, so the
constants still aim at the longer bout.

---

## 1. Fighter HP

| | Value | Source |
|---|---|---|
| Max HP (both fighters, identical) | **4000** | `maxHp` |

Both fighters start at the same `maxHp` (4000). No HP asymmetry anywhere — the
player and the random opponent both call `buildFighter` with the same `maxHp`
default.

---

## 2. Base damage per move (raw, before any multiplier)

`strikeDamage(c) = strikePower × moveMult × staminaPowerMul() × (1 + jitter)`

With `strikePower = 180` and full stamina / average jitter:

| Move | `moveMult` | Impacts | Raw dmg / impact | Raw dmg / action |
|---|---|---|---|---|
| **Punch** (jab) | 1.0 | 1 | **180** | 180 |
| **Double** (jab–cross) | 1.33 (each) | 2 | **239.4** | 478.8 |
| **Combo** (heavy commit) | 3.67 | 1 | **660.6** | 660.6 |

Move clip lengths (drive cadence, §7): Punch `dur 1.3`, Double `dur 1.45`,
Combo `dur 2.0` s.

---

## 3. All damage multipliers

### Outgoing (attacker side) — applied in `strikeDamage` / `resolveImpact`

| Multiplier | Neutral | Range | Note |
|---|---|---|---|
| `strikePower` | 180 | ×1 … ×1.57 | grade ramp `+0.04/0.07/0.10/0.14/0.22` per hard facet (max +57% all 5 lit) |
| `moveMult` | — | 1.0 / 1.33 / 3.67 | per move (above) |
| `staminaPowerMul()` | ×1.0 | **×0.55 … ×1.0** | linear in stamina; floor `staminaPowerFloor 0.55` when empty |
| jitter `(1 + jit)` | ×1.0 | ×0.90 … ×1.10 | `jitter 0.1`, per blow |
| **charge power** `dmgBonus` | +0 | **+0 … +0.6** base | `chargePowerBonusMax 0.6`; ЖАЛО seam pushes the cap to ~+138% (sb.chargePower up to +1.3) |
| **feint payoff** `dmgBonus` | +0 | +0.25 base | `feintDamageBonus 0.25`; ФИНТ seam ×1.5–×2.2 |
| **riposte** `dmgBonus` | +0 | +0.5 … +1.0 | block/dodge/miss counter (ВОЛНОЛОМ/КАПКАН), one strike after a defensive win |
| `escalationMult()` | ×1.0 | **×1 … ×6** | time safeguard, §5 |

`dmgBonus` terms are **additive** and **situational** (charge release, feint
payoff, riposte) — a neutral exchange carries none of them.

### Incoming (defender side) — applied in `takeDamage`

```
hp -= dmg × dmgMulFor(res01) × (1 − toughSoft) × blockMul × interruptMul
```

| Multiplier | Neutral (axis/stat 50/200) | Range | Source |
|---|---|---|---|
| `dmgMulFor(res01)` = `lerp(1.15, 0.38, res01)` | **×0.765** (res 50) | ×1.15 (glass) … ×0.38 (max resilience) | resilience axis |
| `(1 − toughSoft)`, `toughSoft = T/(T+1200)` | **×0.857** (T 200 → 14.3% soft) | →×0.77 as toughness climbs | `toughnessK 1200` |
| `blockMul` = `1 − clamp(blockMitigation×(1−pen), 0, 0.9)` | ×1.0 (not blocking) / **×0.5** (blocking) | ×1.0 … ×0.1 (pierced guard → ×1.0) | `blockMitigation 0.5`, `blockPenetration 0` base |
| `interruptMul` | ×1.0 | ×1.0 … ×(1 + bonus) | only on an interrupting hit; `interruptDamageBonus 0` base + attacker seam |

**Standing "tax" before any miss/dodge/block:** at neutral, every hit is already
multiplied by `dmgMulFor 0.765 × toughSoft-survivor 0.857 = ×0.656` — i.e. **~34 %
of raw damage is shaved by resilience + toughness alone**, before the probabilistic
gasители in §6.

---

## 4. Felt damage per hit & hits-to-kill (neutral fighter)

Neutral = all axes 50, toughness 200, full stamina, no block, no escalation,
average jitter.

| Move | Raw | × `dmgMulFor` 0.765 | × toughness 0.857 | **Felt** | % of 4000 HP |
|---|---|---|---|---|---|
| Punch | 180 | 137.7 | — | **118.0** | **2.95 %** |
| Double (per impact) | 239.4 | 183.1 | — | **157.0** | 3.93 % (×2 = 7.85 %) |
| Combo | 660.6 | 505.4 | — | **433.2** | **10.8 %** |

→ matches the design triad **3 % / 8 % / 11 %**.

**Hits to kill (pure HP ÷ felt, NO miss/dodge/block):**

| Diet | Felt/hit | Hits to 4000 |
|---|---|---|
| All punches | 118 | **~34** |
| All doubles | 157/impact | ~25 impacts (~13 doubles) |
| All combos | 433 | **~9** |
| Realistic mix¹ | ~170/impact | **~24 landed impacts** |

¹ Move mix at neutral (`punchW = 0.47`): **47 % Punch / 40 % Double / 13 % Combo**
per attack action.

**With neutral gasители applied (§6, ×0.60 delivered):** an *attempted* attack
action delivers on average **~142 HP** (expected, after miss + dodge + block).

---

## 5. Escalation (fight-length safeguard)

`escalationMult()` in `ArenaScene.vue`, applied to **both** fighters' raw outgoing
damage on the same clock:

| Phase | Multiplier | Source |
|---|---|---|
| `elapsed ≤ 40 s` | **×1.0 (does nothing)** | `escalateStartSec 40` |
| after 40 s | `1 + (elapsed − 40) × 0.18`, capped | `escalateGrowthPerSec 0.18` |
| ceiling | **×6.0** | `escalateMax 6` |

Worked points: 40 s → ×1.0 · 45 s → ×1.9 · 50 s → ×2.8 · ~67.8 s → ×6 (cap).

**The safeguard is inert for the entire 25–30 s target window** — it only starts
biting at 40 s, by which point the bout is already long past target.

---

## 6. Damage gasители (the "tax") in one place

Three independent reducers. Two remove a hit outright (miss, dodge), one halves it
(block). Rolled per impact (miss, dodge) or per attack (block).

| Gasитель | Neutral chance | Effect | Formula / constants |
|---|---|---|---|
| **Miss** (attacker) | **10 %** | hit voided | `clamp(0.10 + (50−acc)/100 × 0.20, 0, 0.35)`; acc 50 base |
| **Dodge** (defender) | **19.4 %** | hit voided | `0.55 × (slip/100)^1.5`; cap 0.55 at slip 100 |
| **Block** (defender) | **35 %** raise guard | dmg **×0.5** | tendency `clamp(res01×0.55 + stick01×0.15, 0, 0.65)`; cut `0.5×(1−pen)` |

**Combined at neutral:** P(contact) = (1−0.10)(1−0.194) = **0.725**; expected
block factor ≈ 0.35×0.5 + 0.65 = **0.825** → only **~60 % of felt damage is
delivered**; **~40 % is taxed away** by gasители (on top of the ~34 % resilience/
toughness shave in §3).

### Per-core defensive spread (gasители are far heavier than neutral on real cores)

The four cores are **not** neutral — their resilience/slip/stick skew the tax hard:

| Core | resil → `dmgMulFor` | slip → dodge | block tendency | Reads as |
|---|---|---|---|---|
| `natisk` (ONSLAUGHT) | 60 → ×0.688 | 20 → 4.9 % | 45.8 % | takes hits, low dodge |
| `nalet` (RAIDER) | 35 → ×0.881 | 65 → 28.8 % | 21.5 % | fragile but slippery |
| `skala` (BULWARK) | 90 → **×0.457** | 15 → 3.2 % | **60 %** | **damage sponge** |
| `zasada` (AMBUSH) | 35 → ×0.881 | 75 → **35.7 %** | 22.3 % | **evasion wall** |

A `skala` defender takes ~×0.457 per hit **and** blocks 60 % of exchanges; a
`zasada` defender dodges ~36 % outright. Bouts involving these cores run *much*
longer than the neutral estimate.

---

## 7. Cadence & rough bout time

Per fighter, after an attack: `ai.nextAt = t + atk.dur + pause`.

`pause` (neutral, full stamina) = `max(0.06, lerp(0.85,0.18,tempo01) + heavyPause)
+ rand×lerp(0.9,0.3,tempo01)`, `heavyPause = lerp(−0.12,0.4,weight01)` →
**≈ 0.96 s** average. `× staminaCadenceMul` (1.0 full → up to ×1.8 empty).

| Move | `dur` | + pause | Cycle |
|---|---|---|---|
| Punch | 1.3 | 0.96 | 2.26 s |
| Double | 1.45 | 0.96 | 2.41 s |
| Combo | 2.0 | 0.96 | 2.96 s |
| **Weighted avg** | | | **~2.40 s / attack action** |

**Damage rate (one fighter receiving, continuous in-range pressure):**
~142 HP/action ÷ 2.40 s ≈ **~59 HP/s**.

**Time to deplete 4000 HP ≈ 4000 / 59 ≈ ~68 s** — and that assumes *uninterrupted
in-range attacking*. Real bouts spend time circling, baiting, spacing, approaching,
and recovering from staggers (no damage during those), so the **actual neutral
bout is longer still (~70–100 s+)**, and longer again against tanky/slippery cores.

This is **~2.5–3× the 25–30 s target**.

---

## 8. Verdict — where the bout sags

It is **all three**, reinforcing each other, but in order of impact for the
**25–30 s** goal:

1. **Late escalation (biggest lever for the target window).** The only
   length-control knob, `escalateStartSec`, is **40 s** — it does *nothing* for the
   entire 25–30 s window and even at 45 s is only ×1.9. The safeguard is tuned for
   the old 40–50 s target, not the new one.

2. **Heavy gasители tax.** At neutral ~40 % of damage is removed (miss 10 % + dodge
   19 % + block 35 %×½); against `skala` (60 % block, ×0.457) or `zasada` (36 %
   dodge) it climbs past 50 %. Every voided/halved hit stretches the bout.

3. **Low HP-per-hit by design, then shaved further.** Felt damage is on the
   intended 3 / 8 / 11 % triad, but that triad was sized for **16–17 hits / 40–50 s**.
   On top of it, resilience (×0.765 neutral, ×0.457 on `skala`) + toughness (×0.857)
   shave ~34 % before gasители even roll.

**Net:** the per-hit damage is "on design," but the design itself targets a ~2×
longer bout, and the one dynamic safeguard (escalation) sits entirely outside the
new target window. The shortest-path tuning levers are: pull `escalateStartSec`
down toward ~20–25 s (and/or steepen `escalateGrowthPerSec`); and/or trim the
gasитель ceilings (`dodgeChanceMax 0.55`, `blockMitigation 0.5`, `missChanceBase
0.10`) and the per-hit shave (`dmgMulFor` floor 0.38, `toughnessK 1200`); and/or
lift base `strikePower`/`moveMult` or drop `maxHp`.
