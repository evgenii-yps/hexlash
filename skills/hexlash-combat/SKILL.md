---
name: hexlash-combat
description: Hexlash combat system — PvE, PvP, and Auto Fight engines. Use this skill when working on fight logic, combat engine, AI strategy, opponent generation, dice mechanics, coach advice, HP calculations, round simulation, emergency protocols, damage formulas, deck building, module selection, fight results, overdrive, or any battle-related feature. Triggers on mentions of fight, combat, battle, dice, coach, HP, rounds, damage, deck, modules, PvE, PvP, auto fight, autofight, matchmaking, round simulation, knockout, overdrive, emergency, heal, adrenaline, shield, blind, rage, crit.
---

# Hexlash Combat System

## Combat Constants

```js
// Core
MAX_HP = 100
MAX_ROUNDS = 10
MAX_DECK_SIZE = 8
MIN_DECK_SIZE = 4
COUNTDOWN = 3              // seconds before fight
ROUND_ANIMATION_MS = 1500

// Damage
BASE_DAMAGE = 15
POSITION_BONUS = 5

// Dice
DICE_COOLDOWN_ROUNDS = 3
DICE_PAUSE_TIMEOUT_MS = 10000  // PvP server timeout

// Coach
COACH_MIN_ROUND = 6
COACH_TRIGGER_CHANCE = 1.0
COACH_BOOST_ROUNDS = 4
COACH_PAUSE_TIMEOUT_MS = 10000 // PvP server timeout

// Emergency
EMERGENCY_HP_THRESHOLD = 30

// Auto Fight
AUTO_FIGHT_MIN_INTERVAL = 600000   // 10 min
AUTO_FIGHT_MAX_INTERVAL = 600000   // 10 min
AUTO_FIGHT_MAX_PER_DAY = 144
AUTO_FIGHT_MAX_PER_SESSION = 288
```

## Engine Files

| File | Location | Purpose |
|------|----------|---------|
| `combatEngine.js` | `/src/core/engine/` | PvE round simulation |
| `aiStrategy.js` | `/src/core/engine/` | AI decision logic + coach boost (+25 priority) |
| `opponentGenerator.js` | `/src/core/engine/` | Random opponent creation |
| `pvpCombatEngine.js` | `/backend/src/services/` | PvP round simulation, dice/coach effects |
| `pvpMatchManager.js` | `/backend/src/services/` | PvP match lifecycle management |
| `pvpHandler.js` | `/backend/src/websocket/` | PvP WebSocket message handling |

## PvE Flow

1. Player builds deck (4-8 modules) in DeckBuilderView
2. Player starts fight from PreparationView (Arena)
3. `opponentGenerator.js` creates AI opponent matching player level
4. `combatEngine.js` simulates rounds:
   - Each round: both fighters select moves based on deck/strategy
   - Damage = BASE_DAMAGE + move.damage[level] + POSITION_BONUS (if applicable)
   - HP reduced, round result displayed with 1500ms animation
5. Dice available after round 1, cooldown 3 rounds
6. Coach advice triggers from round 6 (once per fight)
7. Emergency protocol at HP <= 30
8. Fight ends: winner determined, XP awarded, result saved via POST /fight/save

## PvP Flow

1. Player joins matchmaking queue or receives friend challenge
2. Match found → both players send `pvp_ready` with deck
3. Server starts round simulation via `pvpCombatEngine.js`
4. Each round: `round_result` sent to both players
5. Dice: server sends `dice_available` → player sends `dice_roll` → server responds `dice_rolled`
6. Coach: server sends `coach_pause` → both players choose → `coach_result`
7. If rounds > MAX_ROUNDS → `overdrive_start` (sudden death)
8. `fight_end` sent with winner, reason, XP

## Dice Mechanics

### PvE Dice (Client-Side)
Available after round 1, cooldown 3 rounds. Player clicks → random effect. Disabled in Overdrive.

| Effect | Value |
|--------|-------|
| Heal | +15 HP |
| Adrenaline | 2x ATK |
| Shield | Damage reduction |
| Blind | Opponent accuracy reduced |
| Rage | -20 HP to opponent |
| Crit | -30 HP to opponent |

### PvP Dice (Server-Side)
Same trigger rules. `dice_available` → `dice_roll` → `dice_rolled`. Rounds continue while dice visible.

| Effect | Value | Duration |
|--------|-------|----------|
| Heal | +20 HP | Instant |
| Adrenaline | +30% dmg | 2 rounds |
| Shield | -50% incoming | 2 rounds |
| Blind | 50% miss chance | 2 rounds |
| Rage | +50% dmg | 2 rounds |
| Crit | x2 dmg | 1 round |

## Coach Advice

### PvE Coach
- Triggers once per fight from round 6 (100% chance)
- Fight pauses, 15s timer
- 3 options: Attack (+25 priority), Defense (+25 priority), Position (+25 priority)
- Boost lasts 4 rounds via `aiStrategy.setCoachBoost()`
- Coach active bar shows remaining rounds

### PvP Coach
- Same UI, but 10s timer
- Fight pauses for BOTH players
- Each player picks independently
- Effects: `coach_attack` (+25% dmg), `coach_defense` (-30% incoming), `coach_position` (+15% dmg & -15% incoming)
- Lasts 4 rounds
- "Waiting for opponent..." until both decide or timer expires
- No boost if player doesn't choose

## Auto Fight System

- Toggle on Arena screen (PreparationView)
- Fights every 10 min (offline capable)
- Uses `CombatEngine` + `ModuleAIStrategy`
- localStorage persist: `hexlash_autofight_state`, `hexlash_autofight_history`
- Push notifications via Notification API
- Limits: 144/day, 288/session
- Auto-catches up missed fights on tab focus
- Daily auto-reset: new day clears fight log, wins/losses/draws/XP counters
- Results sync to server via `POST /fight/save`
- AI series analysis via `POST /v1/ai/auto-fight-summary`
- Log entries include: playerModules, opponentModules, diceUsed, diceEffect, coachUsed, coachChoice, emergencyUsed

## Emergency Protocol

Triggers when player HP drops to <= EMERGENCY_HP_THRESHOLD (30).
Three options available to the player — specific behavior defined in combat engine.

## Frontend Components

- `CardFightView.vue` — Main fight screen (PvE + PvP)
- `HPBar.vue` — Health bar display
- `Fighter.vue` — Fighter avatar in combat
- `DeckBuilderView.vue` — Deck editor (4-8 modules)
- `PreparationView.vue` — Arena with mode select and auto fight
- `AutoFightToggle.vue` — Auto fight on/off
- `AutoFightStatus.vue` — Live status + countdown
- `AiTrainerAnalysis.vue` — Post-fight AI analysis
- `AutoFightAnalysis.vue` — Auto fight series analysis

## Vuex State

- `cardFightState` — Active fight state, rounds, HP, dice, coach, playerModules
- `autoFightState` — Auto fight scheduling, log, AI analysis
- `pvpState` — PvP matchmaking and fights
