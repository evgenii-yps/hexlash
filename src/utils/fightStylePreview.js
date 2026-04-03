/**
 * Generate a fight style description based on 3 archetype modules.
 * Template-based: primary sets base, secondary adds modifier, tertiary finishes.
 */

const BASE = {
  predator: 'Aggressive attacker who pressures relentlessly',
  sentinel: 'Defensive wall that waits for the perfect counter',
  ghost: 'Elusive fighter who strikes from the shadows',
  analyst: 'Calculated fighter who reads and adapts to patterns',
  maverick: 'Chaotic wildcard with unpredictable decisions',
  juggernaut: 'Unstoppable force that never lets up',
};

const MODIFIER = {
  predator: 'with bursts of raw aggression',
  sentinel: 'backed by solid defensive instincts',
  ghost: 'with evasive positioning',
  analyst: 'enhanced by analytical precision',
  maverick: 'with flashes of unpredictable brilliance',
  juggernaut: 'with relentless forward pressure',
};

const FINISHER = {
  predator: 'Finishes fights fast.',
  sentinel: 'Hard to take down.',
  ghost: 'Impossible to pin down.',
  analyst: 'Always one step ahead.',
  maverick: 'Expect the unexpected.',
  juggernaut: 'Breaks through any defense.',
};

/**
 * @param {string} primary
 * @param {string} secondary
 * @param {string} tertiary
 * @returns {string}
 */
export function generateFightStylePreview(primary, secondary, tertiary) {
  if (!primary || !secondary || !tertiary) return '';

  const base = BASE[primary] || BASE.predator;
  const mod = secondary !== primary ? ` ${MODIFIER[secondary]}` : '';
  const fin = FINISHER[tertiary] || '';

  return `${base}${mod}. ${fin}`;
}
