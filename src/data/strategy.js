// Strategy modifiers (Phase 4.4) — PvE AI behavior override.
// Applied at fight start (player hpMultiplier) and per round
// (player damage/crit/dodge in combatEngine, player module weights in aiStrategy).
// PvE only. PvP and auto-fight are not affected.
//
// Pure buffs design: every non-balanced strategy provides only positive modifiers
// to the player. No tradeoffs. moduleWeights determine player AI behaviour style
// (aggressive favours attack modules, defensive favours defense modules).

export const STRATEGY_LEVELS = ['aggressive', 'balanced', 'defensive'];
export const STRATEGY_DEFAULT = 'balanced';

export const STRATEGY_MODIFIERS = {
  aggressive: {
    moduleWeights: { attack: 1.5, defense: 0.5 },
    hpMultiplier: 1.0,
    damageMultiplier: 1.20,
    critBonus: 0.10,
    dodgeBonus: 0.0,
  },
  defensive: {
    moduleWeights: { attack: 0.5, defense: 1.5 },
    hpMultiplier: 1.15,
    damageMultiplier: 1.0,
    critBonus: 0.0,
    dodgeBonus: 0.10,
  },
  balanced: {
    moduleWeights: { attack: 1.0, defense: 1.0 },
    hpMultiplier: 1.0,
    damageMultiplier: 1.0,
    critBonus: 0.0,
    dodgeBonus: 0.0,
  },
};

export function getStrategyModifiers(level) {
  return STRATEGY_MODIFIERS[level] || STRATEGY_MODIFIERS[STRATEGY_DEFAULT];
}
