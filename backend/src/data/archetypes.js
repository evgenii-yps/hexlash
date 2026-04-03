/**
 * Archetype data for agent combat (backend copy of src/core/data/archetypes.js).
 * No icons/images — only priorities and dice preferences.
 * Keep in sync with frontend archetypes.js.
 */

const ARCHETYPES = {
  predator: {
    id: 'predator',
    priorities: {
      high: { attack: 80, defense: 10, position: 10 },
      low:  { attack: 90, defense: 5,  position: 5  },
    },
    dicePreferences: { rage: 95, crit: 90, adrenaline: 85, heal: 15, shield: 20, blind: 60 },
  },
  sentinel: {
    id: 'sentinel',
    priorities: {
      high: { attack: 20, defense: 50, position: 30 },
      low:  { attack: 10, defense: 70, position: 20 },
    },
    dicePreferences: { shield: 95, heal: 90, rage: 15, crit: 30, adrenaline: 25, blind: 40 },
  },
  ghost: {
    id: 'ghost',
    priorities: {
      high: { attack: 30, defense: 20, position: 50 },
      low:  { attack: 40, defense: 10, position: 50 },
    },
    dicePreferences: { blind: 95, crit: 80, heal: 25, shield: 30, rage: 50, adrenaline: 60 },
  },
  analyst: {
    id: 'analyst',
    priorities: {
      high: { attack: 35, defense: 30, position: 35 },
      low:  { attack: 30, defense: 30, position: 40 },
    },
    dicePreferences: { heal: 75, shield: 70, rage: 65, crit: 70, adrenaline: 70, blind: 65 },
  },
  maverick: {
    id: 'maverick',
    priorities: {
      high: { attack: 33, defense: 33, position: 34 },
      low: 'random',
    },
    dicePreferences: { heal: 50, shield: 50, rage: 50, crit: 50, adrenaline: 50, blind: 50 },
  },
  juggernaut: {
    id: 'juggernaut',
    priorities: {
      high: { attack: 50, defense: 35, position: 15 },
      low:  { attack: 50, defense: 35, position: 15 },
    },
    dicePreferences: { adrenaline: 90, rage: 85, crit: 75, heal: 40, shield: 30, blind: 20 },
  },
};

const SLOT_WEIGHTS = [0.5, 0.3, 0.2];

module.exports = { ARCHETYPES, SLOT_WEIGHTS };
