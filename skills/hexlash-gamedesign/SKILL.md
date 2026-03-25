---
name: hexlash-gamedesign
description: Hexlash game design — combat balance, archetypes, move formulas, progression requirements, deck building, dice effects, new mechanics design. Use this skill when discussing game balance, proposing new features, adjusting damage/speed values, working with archetypes, designing new game mechanics, or evaluating combat math. Triggers on mentions of balance, game design, archetype, module, damage, speed, XP, taps, progression, unlock, levelup, level up, deck, meta, mechanics, power rating, card power, branch, move tree, fighter, strategy, win rate, difficulty, fairness, design philosophy, game feel, player experience.
---

# Hexlash Game Design

## Philosophy

**"A fighting game where you never press a button."**

The player is the coach, not the fighter. You build the deck, choose the strategy, pick the coach advice — but the fighter acts autonomously. Every fight should feel unique. Depth over complexity. Emotional investment in your fighter. Social by default.

### Core Principles

1. **Player thinks, fighter acts** — Strategic decisions before and during fight, execution is automatic
2. **Every fight is unique** — Dice, coach, emergency create variance
3. **Depth over complexity** — Simple rules, deep strategy
4. **Emotional investment** — Your fighter grows, your decisions matter
5. **Social by default** — PvP, clubs, friends, challenges, spectate

## Fighter Archetypes (6 NFT Modules)

| Archetype | Style | Strengths | Weaknesses |
|-----------|-------|-----------|------------|
| **Predator** | Aggressive rushdown | High burst damage, early pressure | Low defense, vulnerable late |
| **Sentinel** | Defensive wall | Damage reduction, sustain | Low damage output |
| **Ghost** | Evasion specialist | High dodge, counter-attacks | Low HP, weak to AoE |
| **Analyst** | Adaptive strategy | Counters opponent patterns | Slow start, needs data |
| **Maverick** | Unpredictable | Random bonuses, dice synergy | Inconsistent results |
| **Juggernaut** | Tank | Massive HP, steady damage | Slow, predictable |

## Branches (3)

### Speed Branch
Moves: jab, double_jab, rapid_fire, combo_strike, flurry, hurricane
Focus: Fast attacks, multiple hits, combo potential

### Power Branch
Moves: straight, hook, uppercut, haymaker, hammer_fist, knockout_blow
Focus: High damage per hit, knockout potential

### Technique Branch
Moves: block_strike, counter_jab, feint_cross, parry_punish, slip_counter, precision_strike
Focus: Counter-attacks, defense + offense hybrid, positioning

## Moves (18 Total)

Each move has damage[5] and speed[5] arrays — values per level (1-5).

Data source: `/src/data/moves.js`
Names/descriptions: i18n via `t.gameData.moves[id].name/description`

### Speed Moves
| Move | Damage (L1-L5) | Speed (L1-L5) |
|------|----------------|----------------|
| jab | Low-Med | Very High |
| double_jab | Low-Med | High |
| rapid_fire | Low | Very High |
| combo_strike | Med | Med-High |
| flurry | Med-High | High |
| hurricane | High | Med |

### Power Moves
| Move | Damage (L1-L5) | Speed (L1-L5) |
|------|----------------|----------------|
| straight | Med | Med |
| hook | Med-High | Med |
| uppercut | High | Low-Med |
| haymaker | Very High | Low |
| hammer_fist | High | Low |
| knockout_blow | Very High | Very Low |

### Technique Moves
| Move | Damage (L1-L5) | Speed (L1-L5) |
|------|----------------|----------------|
| block_strike | Low-Med | Med |
| counter_jab | Med | Med-High |
| feint_cross | Med | Med |
| parry_punish | Med-High | Med |
| slip_counter | Med-High | Med-High |
| precision_strike | High | Med |

*Exact numeric values in `/src/data/moves.js`*

## Progression Requirements

### Level Up (upgrade move level)
```js
levelUpRequirements: {
  2: { taps: 100, exp: 50 },
  3: { taps: 200, exp: 100 },
  4: { taps: 350, exp: 200 },
  5: { taps: 500, exp: 350 }
}
```

### Unlock (unlock new move in branch)
```js
unlockRequirements: {
  3: { taps: 300, exp: 150 },   // 3rd move in branch
  4: { taps: 250, exp: 120 },   // 4th move
  5: { taps: 200, exp: 100 },   // 5th move
  // 6th move: highest requirement
}
```

Data source: `/src/data/requirements.js`

## Deck Building

- Deck size: 4-8 modules (MIN_DECK_SIZE / MAX_DECK_SIZE)
- Player selects moves from unlocked pool
- Balance calculation: `/src/data/cardPower.js` + `/src/utils/powerRating.js`
- Opponent generation matches player deck power level

## Combat Balance Constants

```js
MAX_HP = 100
MAX_ROUNDS = 10
BASE_DAMAGE = 15
POSITION_BONUS = 5
DICE_COOLDOWN_ROUNDS = 3
EMERGENCY_HP_THRESHOLD = 30
COACH_MIN_ROUND = 6
COACH_BOOST_ROUNDS = 4
```

## Dice Effects

### PvE (Client-Side)
| Effect | Impact |
|--------|--------|
| Heal | +15 HP |
| Adrenaline | 2x ATK |
| Shield | Damage reduction |
| Blind | Opponent accuracy down |
| Rage | -20 HP to opponent |
| Crit | -30 HP to opponent |

### PvP (Server-Side)
| Effect | Impact | Duration |
|--------|--------|----------|
| Heal | +20 HP | Instant |
| Adrenaline | +30% dmg | 2 rounds |
| Shield | -50% incoming | 2 rounds |
| Blind | 50% miss | 2 rounds |
| Rage | +50% dmg | 2 rounds |
| Crit | x2 dmg | 1 round |

## Economy

```js
COST_PER_CLICK = 2        // Tokens earned per tap
COST_CREATE_CLUB = 10000  // Club creation cost
DECIMALS = 6              // Token decimals
```

## Planned Mechanics

### Fighter Lifecycle
Fighters age and evolve through fights. Veteran fighters gain passive bonuses but may retire.

### Rivalry System
Repeated PvP matches against same opponent create rivalries with bonus stakes.

### Night Fights
Time-based events with special rules and increased rewards.

### Chaos Arenas
Randomized arena modifiers that change combat rules each fight.

### Trainer Reputation
Players earn reputation as trainers, unlocking special abilities and cosmetics.

## Design Guidelines for New Mechanics

1. Does it add meaningful decisions for the player?
2. Does it maintain the "coach not fighter" philosophy?
3. Is it simple to understand but deep to master?
4. Does it create interesting counter-play?
5. Can it be expressed through the existing branch/move/deck system?
6. Is it testable in Auto Fight mode?
7. Does it work in both PvE and PvP?
