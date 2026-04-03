/**
 * Agent Combat Engine — server-side fight simulation for clan agents.
 *
 * Hybrid of PvE logic (action-based with archetype priorities) and PvP
 * passive modifiers (dmgBonus, dodge, crit from ARCHETYPE_MODIFIERS).
 * Tactics settings drive all decisions (dice, coach, emergency).
 *
 * Pure synchronous function — no Prisma, no WebSocket.
 */

const allMoves = require('../data/moves');
const { ARCHETYPES, SLOT_WEIGHTS } = require('../data/archetypes');
const {
  MAX_HP,
  MAX_ROUNDS,
  BASE_DAMAGE,
  POSITION_BONUS,
  DICE_COOLDOWN_ROUNDS,
  COACH_MIN_ROUND,
  COACH_BOOST_ROUNDS,
  ARCHETYPE_MODIFIERS,
} = require('../config');

// ── Archetype action priorities ──────────────────────────────────────────

/**
 * Calculate combined action priorities from 3 modules (slot weights 50/30/20%).
 */
function calculatePriorities(modules, hpPercent) {
  const hpState = hpPercent > 70 ? 'high' : 'low';
  const combined = { attack: 0, defense: 0, position: 0 };

  for (let i = 0; i < Math.min(modules.length, 3); i++) {
    const arch = ARCHETYPES[modules[i]];
    if (!arch) continue;

    let priorities = arch.priorities[hpState];

    // Maverick at low HP — random spikes
    if (priorities === 'random') {
      const spike = Math.random() < 0.3;
      if (spike) {
        const spikeType = ['attack', 'defense', 'position'][Math.floor(Math.random() * 3)];
        priorities = { attack: 33, defense: 33, position: 34 };
        priorities[spikeType] = 80;
      } else {
        priorities = { attack: 33, defense: 33, position: 34 };
      }
    }

    combined.attack += priorities.attack * SLOT_WEIGHTS[i];
    combined.defense += priorities.defense * SLOT_WEIGHTS[i];
    combined.position += priorities.position * SLOT_WEIGHTS[i];
  }

  return combined;
}

/**
 * Select action based on priorities + aggression + emergency + coach.
 */
function selectAction(modules, hpPercent, aggression, emergencyActive, coachBoost, isOverdrive) {
  // Emergency override: always defend
  if (emergencyActive) return 'defense';

  const priorities = calculatePriorities(modules, hpPercent);

  // Aggression modifier
  if (aggression === 'aggressive') {
    priorities.attack += 20;
    priorities.defense = Math.max(0, priorities.defense - 10);
  } else if (aggression === 'cautious') {
    priorities.defense += 20;
    priorities.attack = Math.max(0, priorities.attack - 10);
  }

  // Coach boost
  if (coachBoost && coachBoost.roundsLeft > 0) {
    priorities[coachBoost.action] += 25;
  }

  // Overdrive: aggressive bias
  if (isOverdrive) {
    priorities.attack += 30;
    priorities.position = Math.max(5, priorities.position - 15);
  }

  const total = priorities.attack + priorities.defense + priorities.position;
  const roll = Math.random() * total;

  if (roll < priorities.attack) return 'attack';
  if (roll < priorities.attack + priorities.defense) return 'defense';
  return 'position';
}

// ── Move selection ───────────────────────────────────────────────────────

/**
 * Build resolved deck: array of { moveId, damage, speed, branch, level }
 */
function resolveDeck(deck, moveLevels) {
  const levelMap = {};
  if (Array.isArray(moveLevels)) {
    for (const m of moveLevels) levelMap[m.moveId] = m.level;
  }

  return deck.map(moveId => {
    const data = allMoves[moveId];
    const level = Math.min(Math.max(levelMap[moveId] || 1, 1), 5);
    return {
      moveId,
      damage: data ? data.damage[level - 1] : BASE_DAMAGE,
      speed: data ? data.speed[level - 1] : 1.0,
      branch: data ? data.branch : null,
      level,
    };
  });
}

/**
 * Pick a move from resolved deck for a given action.
 */
function pickMove(resolvedDeck, action, roundNum) {
  if (!resolvedDeck.length) return { moveId: null, damage: BASE_DAMAGE, speed: 1.0, branch: null, level: 1 };

  if (action === 'attack') {
    // Highest damage
    return resolvedDeck.reduce((best, m) => m.damage > best.damage ? m : best);
  }
  if (action === 'defense') {
    // Highest speed (quick reaction)
    return resolvedDeck.reduce((best, m) => m.speed > best.speed ? m : best);
  }
  // position: cycle through deck
  return resolvedDeck[(roundNum - 1) % resolvedDeck.length];
}

// ── Passive archetype modifiers (from PvP config) ────────────────────────

function calculateModifiers(modules) {
  let dmgBonus = 0, incomingReduction = 0, dodgeChance = 0, critChance = 0;
  let critMultWeighted = 0, critSlots = 0;

  for (let i = 0; i < Math.min(modules.length, 3); i++) {
    const arch = ARCHETYPE_MODIFIERS[modules[i]];
    if (!arch) continue;
    const w = SLOT_WEIGHTS[i];

    let aDmg = arch.dmgBonus;
    let aInc = arch.incomingReduction;

    if (arch.randomRange) {
      const r = arch.randomRange;
      aDmg = (Math.random() * 2 - 1) * r;
      aInc = (Math.random() * 2 - 1) * r;
    }

    dmgBonus += aDmg * w;
    incomingReduction += aInc * w;
    dodgeChance += arch.dodgeChance * w;
    critChance += arch.critChance * w;

    if (arch.critMult > 1.0) {
      critMultWeighted += arch.critMult * w;
      critSlots += w;
    }
  }

  const critMult = critSlots > 0 ? critMultWeighted / critSlots : 1.5;
  return { dmgBonus, incomingReduction, dodgeChance, critChance, critMult };
}

// ── Dice logic ───────────────────────────────────────────────────────────

const DICE_EFFECTS = ['heal', 'adrenaline', 'shield', 'blind', 'rage', 'crit'];

function rollDice() {
  return DICE_EFFECTS[Math.floor(Math.random() * DICE_EFFECTS.length)];
}

function shouldUseDice(dicePolicy, hpPercent, modules) {
  if (dicePolicy === 'always') return true;
  if (dicePolicy === 'never') return false;
  // smart: use if HP < 50% or archetype has high average dice preference
  if (hpPercent < 50) return true;
  let avgPref = 0;
  for (let i = 0; i < Math.min(modules.length, 3); i++) {
    const arch = ARCHETYPES[modules[i]];
    if (!arch) continue;
    const prefs = Object.values(arch.dicePreferences);
    avgPref += (prefs.reduce((a, b) => a + b, 0) / prefs.length) * SLOT_WEIGHTS[i];
  }
  return avgPref > 50;
}

// ── Coach logic ──────────────────────────────────────────────────────────

function chooseCoachAction(coachPreference, hpPercent) {
  if (coachPreference !== 'auto') return coachPreference;
  if (hpPercent <= 30) return 'defense';
  if (hpPercent <= 60) return 'position';
  return 'attack';
}

// ── Fighter state factory ────────────────────────────────────────────────

function createFighterState(fighter) {
  const modules = [fighter.agent.primaryModule, fighter.agent.secondaryModule, fighter.agent.tertiaryModule];
  const deck = Array.isArray(fighter.progression.deck) ? fighter.progression.deck : [];
  const moves = Array.isArray(fighter.progression.moves) ? fighter.progression.moves : [];

  return {
    modules,
    tactics: fighter.tactics,
    resolvedDeck: resolveDeck(deck, moves),
    modifiers: calculateModifiers(modules),
    hp: MAX_HP,
    diceUsedRound: -DICE_COOLDOWN_ROUNDS,
    coachUsed: false,
    coachBoost: null,
    activeEffects: [], // { type, roundsLeft }
    positionBonus: 0,
    emergencyActive: false,
  };
}

// ── Main simulation ──────────────────────────────────────────────────────

/**
 * Simulate a full fight between two fighters.
 * @param {Object} fighter1 - { agent, tactics, progression }
 * @param {Object} fighter2 - { agent, tactics, progression }
 * @param {Object} options - { mode: 'pve_training'|'ranked'|'free_arena' }
 * @returns {Object} fightResult
 */
function simulateAgentFight(fighter1, fighter2, options = {}) {
  const mode = options.mode || 'pve_training';
  const legendBuff = options.legendBuff || null; // { xpBonus, dmgBonus, archetype }
  const f1 = createFighterState(fighter1);
  const f2 = createFighterState(fighter2);

  // Apply legend damage multiplier
  if (legendBuff && legendBuff.dmgBonus) {
    f1.legendDmgMult = 1 + (f1.modules[0] === legendBuff.archetype ? legendBuff.dmgBonus * 1.5 : legendBuff.dmgBonus);
    f2.legendDmgMult = 1 + (f2.modules[0] === legendBuff.archetype ? legendBuff.dmgBonus * 1.5 : legendBuff.dmgBonus);
  }

  const roundLog = [];
  let totalDice = { fighter1: 0, fighter2: 0 };
  let totalCoach = { fighter1: 0, fighter2: 0 };
  const maxRounds = MAX_ROUNDS + 10; // overdrive cap

  for (let round = 1; round <= maxRounds; round++) {
    if (f1.hp <= 0 || f2.hp <= 0) break;

    const isOverdrive = round > MAX_ROUNDS;

    // Check emergency threshold
    checkEmergency(f1);
    checkEmergency(f2);

    // ── Coach (once per fight, round >= COACH_MIN_ROUND, not in overdrive) ──
    if (!isOverdrive && round >= COACH_MIN_ROUND) {
      if (!f1.coachUsed) {
        const action = chooseCoachAction(f1.tactics.coachPreference, (f1.hp / MAX_HP) * 100);
        f1.coachBoost = { action, roundsLeft: COACH_BOOST_ROUNDS };
        f1.coachUsed = true;
        totalCoach.fighter1++;
      }
      if (!f2.coachUsed) {
        const action = chooseCoachAction(f2.tactics.coachPreference, (f2.hp / MAX_HP) * 100);
        f2.coachBoost = { action, roundsLeft: COACH_BOOST_ROUNDS };
        f2.coachUsed = true;
        totalCoach.fighter2++;
      }
    }

    // ── Dice (not in overdrive, respects cooldown) ──
    let f1DiceUsed = false, f1DiceEffect = null;
    let f2DiceUsed = false, f2DiceEffect = null;

    if (!isOverdrive) {
      if ((round - f1.diceUsedRound) >= DICE_COOLDOWN_ROUNDS &&
          shouldUseDice(f1.tactics.dicePolicy, (f1.hp / MAX_HP) * 100, f1.modules)) {
        f1DiceEffect = rollDice();
        applyDiceEffect(f1, f2, f1DiceEffect);
        f1.diceUsedRound = round;
        f1DiceUsed = true;
        totalDice.fighter1++;
        // Rage/crit can kill
        if (f2.hp <= 0) {
          roundLog.push(buildRoundEntry(round, f1, f2, null, null, null, null,
            f1DiceUsed, f1DiceEffect, f2DiceUsed, f2DiceEffect, false, false, isOverdrive));
          break;
        }
      }

      if ((round - f2.diceUsedRound) >= DICE_COOLDOWN_ROUNDS &&
          shouldUseDice(f2.tactics.dicePolicy, (f2.hp / MAX_HP) * 100, f2.modules)) {
        f2DiceEffect = rollDice();
        applyDiceEffect(f2, f1, f2DiceEffect);
        f2.diceUsedRound = round;
        f2DiceUsed = true;
        totalDice.fighter2++;
        if (f1.hp <= 0) {
          roundLog.push(buildRoundEntry(round, f1, f2, null, null, null, null,
            f1DiceUsed, f1DiceEffect, f2DiceUsed, f2DiceEffect, false, false, isOverdrive));
          break;
        }
      }
    }

    // ── Select actions ──
    const f1HpPct = (f1.hp / MAX_HP) * 100;
    const f2HpPct = (f2.hp / MAX_HP) * 100;
    const action1 = selectAction(f1.modules, f1HpPct, f1.tactics.aggression, f1.emergencyActive, f1.coachBoost, isOverdrive);
    const action2 = selectAction(f2.modules, f2HpPct, f2.tactics.aggression, f2.emergencyActive, f2.coachBoost, isOverdrive);

    // ── Select moves ──
    const move1 = pickMove(f1.resolvedDeck, action1, round);
    const move2 = pickMove(f2.resolvedDeck, action2, round);

    // ── Resolve combat ──
    const overdriveMult = isOverdrive ? 2 : 1;
    const result = resolveRound(f1, f2, action1, action2, move1, move2, overdriveMult);

    // Overdrive: both lose 5 HP extra
    if (isOverdrive) {
      f1.hp = Math.max(0, f1.hp - 5);
      f2.hp = Math.max(0, f2.hp - 5);
    }

    // Tick effects
    tickEffects(f1);
    tickEffects(f2);
    tickCoachBoost(f1);
    tickCoachBoost(f2);

    roundLog.push(buildRoundEntry(round, f1, f2, action1, action2, move1, move2,
      f1DiceUsed, f1DiceEffect, f2DiceUsed, f2DiceEffect,
      f1.coachUsed && round === COACH_MIN_ROUND, f2.coachUsed && round === COACH_MIN_ROUND, isOverdrive,
      result));
  }

  // Determine result
  const result = determineResult(f1.hp, f2.hp);

  return {
    result,
    rounds: roundLog.length,
    fighter1HpLeft: f1.hp,
    fighter2HpLeft: f2.hp,
    roundLog,
    fighter1Build: { primaryModule: fighter1.agent.primaryModule, secondaryModule: fighter1.agent.secondaryModule, tertiaryModule: fighter1.agent.tertiaryModule },
    fighter2Build: { primaryModule: fighter2.agent.primaryModule, secondaryModule: fighter2.agent.secondaryModule, tertiaryModule: fighter2.agent.tertiaryModule },
    fighter1Deck: Array.isArray(fighter1.progression.deck) ? fighter1.progression.deck : [],
    fighter2Deck: Array.isArray(fighter2.progression.deck) ? fighter2.progression.deck : [],
    mode,
    totalDiceUsed: totalDice,
    totalCoachUsed: totalCoach,
  };
}

// ── Round resolution ─────────────────────────────────────────────────────

function resolveRound(f1, f2, action1, action2, move1, move2, overdriveMult) {
  let dmg1to2 = 0; // damage f1 deals to f2
  let dmg2to1 = 0; // damage f2 deals to f1
  let f1Dodge = false, f2Dodge = false;
  let f1Crit = false, f2Crit = false;

  // Calculate base damages (with legend buff if present)
  const baseDmg1 = (move1.damage + f1.positionBonus) * overdriveMult * (f1.legendDmgMult || 1);
  const baseDmg2 = (move2.damage + f2.positionBonus) * overdriveMult * (f2.legendDmgMult || 1);

  // Reset position bonus after use
  f1.positionBonus = 0;
  f2.positionBonus = 0;

  // Apply active effects (adrenaline, shield, blind, coach)
  const effectiveDmg1 = applyAttackerEffects(baseDmg1, f1);
  const effectiveDmg2 = applyAttackerEffects(baseDmg2, f2);

  // Action-based resolution
  if (action1 === 'attack') {
    let rawDmg = effectiveDmg1;

    if (action2 === 'defense') {
      // Defender blocks 60%
      rawDmg = Math.max(0, rawDmg - Math.floor(rawDmg * 0.6));
    }

    // Apply archetype modifiers
    rawDmg = Math.round(rawDmg * (1 + f1.modifiers.dmgBonus) * (1 - f2.modifiers.incomingReduction));

    // Apply defender effects (shield, blind, coach_defense)
    rawDmg = applyDefenderEffects(rawDmg, f2);

    // Dodge check
    if (Math.random() < f2.modifiers.dodgeChance) {
      rawDmg = 0;
      f2Dodge = true;
    }

    // Crit check (only if not dodged)
    if (!f2Dodge && Math.random() < f1.modifiers.critChance) {
      rawDmg = Math.round(rawDmg * f1.modifiers.critMult);
      f1Crit = true;
    }

    dmg1to2 = rawDmg;
  } else if (action1 === 'position') {
    f1.positionBonus = POSITION_BONUS;
  }

  if (action2 === 'attack') {
    let rawDmg = effectiveDmg2;

    if (action1 === 'defense') {
      rawDmg = Math.max(0, rawDmg - Math.floor(rawDmg * 0.6));
    }

    rawDmg = Math.round(rawDmg * (1 + f2.modifiers.dmgBonus) * (1 - f1.modifiers.incomingReduction));
    rawDmg = applyDefenderEffects(rawDmg, f1);

    if (Math.random() < f1.modifiers.dodgeChance) {
      rawDmg = 0;
      f1Dodge = true;
    }

    if (!f1Dodge && Math.random() < f2.modifiers.critChance) {
      rawDmg = Math.round(rawDmg * f2.modifiers.critMult);
      f2Crit = true;
    }

    dmg2to1 = rawDmg;
  } else if (action2 === 'position') {
    f2.positionBonus = POSITION_BONUS;
  }

  // Speed-based KO: both attacking — faster hits first, KO prevents counter
  if (action1 === 'attack' && action2 === 'attack' && dmg1to2 > 0 && dmg2to1 > 0) {
    if (move1.speed >= move2.speed) {
      f2.hp = Math.max(0, f2.hp - dmg1to2);
      if (f2.hp <= 0) { dmg2to1 = 0; }
      f1.hp = Math.max(0, f1.hp - dmg2to1);
    } else {
      f1.hp = Math.max(0, f1.hp - dmg2to1);
      if (f1.hp <= 0) { dmg1to2 = 0; }
      f2.hp = Math.max(0, f2.hp - dmg1to2);
    }
  } else {
    f1.hp = Math.max(0, f1.hp - dmg2to1);
    f2.hp = Math.max(0, f2.hp - dmg1to2);
  }

  return { dmg1to2, dmg2to1, f1Dodge, f2Dodge, f1Crit, f2Crit };
}

// ── Effect helpers ───────────────────────────────────────────────────────

function applyAttackerEffects(baseDmg, fighter) {
  let dmg = baseDmg;
  for (const e of fighter.activeEffects) {
    if (e.type === 'adrenaline') dmg = Math.round(dmg * 2);
    if (e.type === 'coach_attack') dmg = Math.round(dmg * 1.25);
    if (e.type === 'coach_position') dmg = Math.round(dmg * 1.15);
  }
  return dmg;
}

function applyDefenderEffects(dmg, defender) {
  for (const e of defender.activeEffects) {
    if (e.type === 'shield') return 0;
    if (e.type === 'blind') return 0;
    if (e.type === 'coach_defense') dmg = Math.round(dmg * 0.7);
    if (e.type === 'coach_position') dmg = Math.round(dmg * 0.85);
  }
  return dmg;
}

function applyDiceEffect(fighter, opponent, effect) {
  switch (effect) {
    case 'heal':
      fighter.hp = Math.min(MAX_HP, fighter.hp + 15);
      break;
    case 'rage':
      opponent.hp = Math.max(0, opponent.hp - 20);
      break;
    case 'crit':
      opponent.hp = Math.max(0, opponent.hp - 30);
      break;
    case 'adrenaline':
      fighter.activeEffects.push({ type: 'adrenaline', roundsLeft: 1 });
      break;
    case 'shield':
      fighter.activeEffects.push({ type: 'shield', roundsLeft: 1 });
      break;
    case 'blind':
      fighter.activeEffects.push({ type: 'blind', roundsLeft: 1 });
      break;
  }
}

function tickEffects(fighter) {
  fighter.activeEffects = fighter.activeEffects.filter(e => {
    e.roundsLeft--;
    return e.roundsLeft > 0;
  });
}

function tickCoachBoost(fighter) {
  if (fighter.coachBoost && fighter.coachBoost.roundsLeft > 0) {
    fighter.coachBoost.roundsLeft--;
    if (fighter.coachBoost.roundsLeft <= 0) fighter.coachBoost = null;
  }
}

function checkEmergency(fighter) {
  const threshold = fighter.tactics.emergencyThreshold || 0;
  if (threshold > 0 && (fighter.hp / MAX_HP) * 100 <= threshold) {
    fighter.emergencyActive = true;
  }
}

// ── Result helpers ───────────────────────────────────────────────────────

function determineResult(hp1, hp2) {
  if (hp1 <= 0 && hp2 <= 0) return 'draw';
  if (hp1 <= 0) return 'defeat';
  if (hp2 <= 0) return 'victory';
  if (hp1 > hp2) return 'victory';
  if (hp2 > hp1) return 'defeat';
  return 'draw';
}

function buildRoundEntry(round, f1, f2, action1, action2, move1, move2,
  f1DiceUsed, f1DiceEffect, f2DiceUsed, f2DiceEffect,
  f1CoachUsed, f2CoachUsed, isOverdrive, combatResult) {
  return {
    round,
    isOverdrive,
    fighter1: {
      action: action1,
      move: move1 ? { moveId: move1.moveId, damage: move1.damage, speed: move1.speed } : null,
      damageDealt: combatResult ? combatResult.dmg1to2 : 0,
      damageTaken: combatResult ? combatResult.dmg2to1 : 0,
      hpAfter: f1.hp,
      dodge: combatResult ? combatResult.f1Dodge : false,
      crit: combatResult ? combatResult.f1Crit : false,
      diceUsed: f1DiceUsed,
      diceEffect: f1DiceEffect,
      coachUsed: f1CoachUsed,
      coachChoice: f1CoachUsed ? f1.coachBoost?.action || null : null,
      emergencyTriggered: f1.emergencyActive,
    },
    fighter2: {
      action: action2,
      move: move2 ? { moveId: move2.moveId, damage: move2.damage, speed: move2.speed } : null,
      damageDealt: combatResult ? combatResult.dmg2to1 : 0,
      damageTaken: combatResult ? combatResult.dmg1to2 : 0,
      hpAfter: f2.hp,
      dodge: combatResult ? combatResult.f2Dodge : false,
      crit: combatResult ? combatResult.f2Crit : false,
      diceUsed: f2DiceUsed,
      diceEffect: f2DiceEffect,
      coachUsed: f2CoachUsed,
      coachChoice: f2CoachUsed ? f2.coachBoost?.action || null : null,
      emergencyTriggered: f2.emergencyActive,
    },
  };
}

// ── PvE Bot Generator ────────────────────────────────────────────────────

const BOT_NAMES = [
  'Iron Fist', 'Shadow Boxer', 'Steel Guard', 'Quick Jab', 'Thunder',
  'Viper', 'Stone Wall', 'Blaze', 'Phantom', 'Crusher',
  'Razor', 'Bulldog', 'Cyclone', 'Hammer', 'Cobra',
];

const ALL_ARCHETYPES = ['predator', 'sentinel', 'ghost', 'analyst', 'maverick', 'juggernaut'];
const ALL_MOVE_IDS = Object.keys(allMoves);

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate a PvE training bot scaled to agent ELO.
 * @param {number} agentElo
 * @returns {Object} fighter in { agent, tactics, progression } format
 */
function generatePveBot(agentElo) {
  const name = randomFrom(BOT_NAMES);
  const primary = randomFrom(ALL_ARCHETYPES);
  const secondary = randomFrom(ALL_ARCHETYPES);
  const tertiary = randomFrom(ALL_ARCHETYPES);

  let moveCount, maxLevel, aggression;

  if (agentElo < 900) {
    moveCount = 2 + Math.floor(Math.random() * 2); // 2-3
    maxLevel = 2;
    aggression = 'cautious';
  } else if (agentElo <= 1100) {
    moveCount = 3 + Math.floor(Math.random() * 2); // 3-4
    maxLevel = 3;
    aggression = 'balanced';
  } else {
    moveCount = 5 + Math.floor(Math.random() * 2); // 5-6
    maxLevel = 5;
    aggression = 'aggressive';
  }

  // Pick random moves
  const shuffled = [...ALL_MOVE_IDS].sort(() => Math.random() - 0.5);
  const selectedMoves = shuffled.slice(0, Math.min(moveCount, shuffled.length));
  const moves = selectedMoves.map(moveId => ({
    moveId,
    level: Math.max(1, Math.floor(Math.random() * maxLevel) + 1),
  }));
  const deck = selectedMoves.slice(0, Math.max(4, selectedMoves.length));

  return {
    agent: {
      name,
      primaryModule: primary,
      secondaryModule: secondary,
      tertiaryModule: tertiary,
    },
    tactics: {
      aggression,
      dicePolicy: agentElo > 1100 ? 'smart' : (agentElo < 900 ? 'never' : 'smart'),
      coachPreference: 'auto',
      emergencyThreshold: 30,
      restPeriod: 600000,
    },
    progression: { moves, deck },
  };
}

module.exports = { simulateAgentFight, generatePveBot };
