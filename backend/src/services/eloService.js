/**
 * ELO Rating Service for agent ranked fights.
 */

const { ELO_K_FACTOR, ELO_MIN, ELO_MAX } = require('../config');

/**
 * Calculate ELO changes after a fight.
 * @param {number} ratingA - ELO of fighter A
 * @param {number} ratingB - ELO of fighter B
 * @param {string} result - 'victory'|'defeat'|'draw' from A's perspective
 * @returns {{ changeA, changeB, newRatingA, newRatingB }}
 */
function calculateElo(ratingA, ratingB, result) {
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));

  let actualA;
  if (result === 'victory') actualA = 1;
  else if (result === 'draw') actualA = 0.5;
  else actualA = 0;

  const changeA = Math.round(ELO_K_FACTOR * (actualA - expectedA));
  const changeB = -changeA;

  const newRatingA = Math.min(ELO_MAX, Math.max(ELO_MIN, ratingA + changeA));
  const newRatingB = Math.min(ELO_MAX, Math.max(ELO_MIN, ratingB + changeB));

  return { changeA, changeB, newRatingA, newRatingB };
}

module.exports = { calculateElo };
