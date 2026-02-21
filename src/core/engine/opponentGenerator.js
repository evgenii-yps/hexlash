/**
 * AI Opponent Generator - creates random opponents with decks.
 */

const OPPONENT_NAMES = [
    'Shadow', 'Viper', 'Thunder', 'Blaze', 'Frost',
    'Raven', 'Storm', 'Phantom', 'Cobra', 'Wolf',
    'Hawk', 'Steel', 'Ash', 'Onyx', 'Titan',
    'Fury', 'Ghost', 'Blade', 'Spark', 'Dusk',
];

const OPPONENT_SKINS = [
    'skin_m_1.png',
    'skin_m_2.png',
    'skin_m_3.png',
];

const DIFFICULTY_CONFIG = {
    easy: {
        deckSize: 4,
        rarityWeights: {common: 10, rare: 2, epic: 0, legendary: 0},
        namePrefix: 'Rookie ',
    },
    medium: {
        deckSize: 6,
        rarityWeights: {common: 6, rare: 4, epic: 1, legendary: 0},
        namePrefix: '',
    },
    hard: {
        deckSize: 8,
        rarityWeights: {common: 3, rare: 4, epic: 3, legendary: 1},
        namePrefix: 'Elite ',
    },
};

export class OpponentGenerator {

    /**
     * Generate a random AI opponent.
     * @param {CardModel[]} allCards - all available card definitions
     * @param {string} difficulty - 'easy' | 'medium' | 'hard'
     * @returns {{ name, avatarUrl, skin, deck: CardModel[] }}
     */
    static generate(allCards, difficulty = 'medium') {
        const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.medium;

        const name = config.namePrefix + OPPONENT_NAMES[Math.floor(Math.random() * OPPONENT_NAMES.length)];
        const skin = OPPONENT_SKINS[Math.floor(Math.random() * OPPONENT_SKINS.length)];

        const deck = OpponentGenerator.buildDeck(allCards, config);

        return {
            id: 'ai_' + Date.now(),
            name,
            avatarUrl: '',
            skin,
            deck,
        };
    }

    /**
     * Build a deck for the AI opponent with rarity-weighted selection.
     */
    static buildDeck(allCards, config) {
        const {deckSize, rarityWeights} = config;
        const deck = [];
        const usedIds = new Set();

        // Ensure at least 1 attack and 1 defense card
        const attacks = allCards.filter(c => c.isAttack());
        const defenses = allCards.filter(c => c.isDefense());

        if (attacks.length > 0) {
            const pick = attacks[Math.floor(Math.random() * attacks.length)];
            deck.push(pick);
            usedIds.add(pick.id);
        }
        if (defenses.length > 0) {
            const pick = defenses[Math.floor(Math.random() * defenses.length)];
            if (!usedIds.has(pick.id)) {
                deck.push(pick);
                usedIds.add(pick.id);
            }
        }

        // Fill remaining slots with weighted random
        const remaining = allCards.filter(c => !usedIds.has(c.id));
        const weights = remaining.map(c => rarityWeights[c.rarity] || 1);

        while (deck.length < deckSize && remaining.length > 0) {
            const idx = OpponentGenerator.weightedRandomIndex(weights);
            if (idx === -1) break;

            deck.push(remaining[idx]);
            usedIds.add(remaining[idx].id);

            // Remove selected card from pool
            remaining.splice(idx, 1);
            weights.splice(idx, 1);
        }

        return deck;
    }

    static weightedRandomIndex(weights) {
        const total = weights.reduce((s, w) => s + w, 0);
        if (total <= 0) return -1;

        let random = Math.random() * total;
        for (let i = 0; i < weights.length; i++) {
            random -= weights[i];
            if (random <= 0) return i;
        }
        return weights.length - 1;
    }
}
