/**
 * Power Rating System — calculates fighter strength and generates
 * power-matched opponents based on player build and difficulty.
 */

import { CARD_BASE_POWER, MODULE_BASE_POWER, LEVEL_MULTIPLIERS } from '@/data/cardPower.js';
import { allMoves } from '@/data/moves.js';

// ─── Constants ───────────────────────────────────────────────────────────────

const MIN_OPPONENT_POWER = 25;
const MAX_OPPONENT_POWER = 200;

const DIFFICULTY_RANGES = {
    easy:   { min: 0.70, max: 0.85 },
    medium: { min: 0.90, max: 1.10 },
    hard:   { min: 1.15, max: 1.30 },
};

const POSITION_WEIGHTS = [0.5, 0.3, 0.2]; // Primary, Secondary, Tertiary

// ─── Power Rating Calculation ────────────────────────────────────────────────

/**
 * Calculate the power rating of a fighter based on their build.
 *
 * @param {Object} fighter
 * @param {string[]} fighter.deck - Array of card (move) IDs in the deck
 * @param {Object} fighter.cardLevels - Map of moveId → level (1-5)
 * @param {string[]} fighter.modules - Array of 3 module (archetype) IDs
 * @param {string[]} [fighter.unlockedCards] - All unlocked card IDs (for bonus)
 * @returns {number} Rounded power rating
 */
export function calculatePowerRating(fighter) {
    let power = 0;

    // 1. Power from cards in deck
    if (fighter.deck) {
        fighter.deck.forEach(cardId => {
            const basePower = CARD_BASE_POWER[cardId] || 0;
            const level = (fighter.cardLevels && fighter.cardLevels[cardId]) || 1;
            const multiplier = LEVEL_MULTIPLIERS[level] || 1.0;

            power += basePower * multiplier;
        });
    }

    // 2. Power from modules (archetypes) with position weighting
    if (fighter.modules) {
        fighter.modules.forEach((moduleId, index) => {
            if (!moduleId) return;
            const weight = POSITION_WEIGHTS[index] || 0;
            power += MODULE_BASE_POWER * weight;
        });
    }

    // 3. Bonus for total unlocked cards (+1 per card)
    const unlockedCount = fighter.unlockedCards?.length || (fighter.deck?.length || 3);
    power += unlockedCount;

    return Math.round(power);
}

// ─── Opponent Deck Generation ────────────────────────────────────────────────

/**
 * Generate a deck for an opponent targeting a specific power budget.
 * Picks random cards and adjusts levels to match the target.
 *
 * @param {number} targetPower - Total power the opponent should have
 * @returns {{ deck: string[], cardLevels: Object }}
 */
export function generateDeckForPower(targetPower) {
    const deckSize = randomBetween(3, 5);

    // Subtract estimated module power (15 * (0.5 + 0.3 + 0.2) = 15) and unlocked bonus (~5)
    const modulePower = MODULE_BASE_POWER; // weights sum to 1.0, so total = MODULE_BASE_POWER
    const bonusPower = 5;
    const cardsPowerBudget = Math.max(0, targetPower - modulePower - bonusPower);
    const powerPerCard = cardsPowerBudget / deckSize;

    const allCardIds = Object.keys(CARD_BASE_POWER);
    const deck = [];
    const cardLevels = {};
    const usedCards = new Set();

    for (let i = 0; i < deckSize; i++) {
        // Pick a random card that hasn't been used yet
        const available = allCardIds.filter(id => !usedCards.has(id));
        const cardId = available[Math.floor(Math.random() * available.length)];
        usedCards.add(cardId);

        // Calculate the level needed to match target power per card
        const basePower = CARD_BASE_POWER[cardId];
        // cardPower = basePower * (1 + (level - 1) * 0.2)
        // level = ((cardPower / basePower) - 1) / 0.2 + 1
        let level = Math.round(((powerPerCard / basePower) - 1) / 0.2 + 1);
        level = Math.max(1, Math.min(5, level));

        deck.push(cardId);
        cardLevels[cardId] = level;
    }

    return { deck, cardLevels };
}

// ─── Opponent Generation ─────────────────────────────────────────────────────

/**
 * Calculate target power for an opponent based on player power and difficulty.
 *
 * @param {number} playerPower - Player's calculated power rating
 * @param {string} difficulty - 'easy' | 'medium' | 'hard'
 * @returns {number} Target opponent power (clamped to MIN/MAX)
 */
export function calculateTargetPower(playerPower, difficulty) {
    const range = DIFFICULTY_RANGES[difficulty] || DIFFICULTY_RANGES.medium;
    const minPower = playerPower * range.min;
    const maxPower = playerPower * range.max;

    let targetPower = randomBetween(Math.round(minPower), Math.round(maxPower));
    targetPower = Math.max(MIN_OPPONENT_POWER, targetPower);
    targetPower = Math.min(MAX_OPPONENT_POWER, targetPower);

    return targetPower;
}

/**
 * Build a player fighter object from progression state for power calculation.
 *
 * @param {Object} progressionState - Vuex progression module state
 * @param {string[]} playerModules - Player's 3 selected modules
 * @returns {Object} Fighter object suitable for calculatePowerRating
 */
export function buildPlayerFighter(progressionState, playerModules) {
    const deck = progressionState.deck || [];
    const moves = progressionState.moves || {};

    const cardLevels = {};
    deck.forEach(moveId => {
        cardLevels[moveId] = moves[moveId]?.level || 1;
    });

    const unlockedCards = Object.entries(moves)
        .filter(([, m]) => m.unlocked)
        .map(([id]) => id);

    return {
        deck,
        cardLevels,
        modules: playerModules,
        unlockedCards,
    };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
