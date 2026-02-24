/**
 * AI Opponent Generator - creates random opponents with decks and archetypes.
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
        archetypes: ['balanced'],
    },
    medium: {
        deckSize: 6,
        rarityWeights: {common: 6, rare: 4, epic: 1, legendary: 0},
        namePrefix: '',
        archetypes: ['balanced', 'aggressor', 'guardian'],
    },
    hard: {
        deckSize: 8,
        rarityWeights: {common: 3, rare: 4, epic: 3, legendary: 1},
        namePrefix: 'Elite ',
        archetypes: ['aggressor', 'guardian', 'brawler'],
    },
};

export class OpponentGenerator {

    /**
     * Generate a random AI opponent with an archetype.
     * @param {CardModel[]} allCards
     * @param {string}      difficulty – 'easy' | 'medium' | 'hard'
     * @returns {{ id, name, avatarUrl, skin, deck, archetype }}
     */
    static generate(allCards, difficulty = 'medium') {
        const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.medium;

        const name = config.namePrefix + OPPONENT_NAMES[Math.floor(Math.random() * OPPONENT_NAMES.length)];
        const skin = OPPONENT_SKINS[Math.floor(Math.random() * OPPONENT_SKINS.length)];
        const archetype = config.archetypes[Math.floor(Math.random() * config.archetypes.length)];

        const deck = OpponentGenerator.buildDeck(allCards, config, archetype);

        return {
            id: 'ai_' + Date.now(),
            name,
            avatarUrl: '',
            skin,
            deck,
            archetype,
        };
    }

    /**
     * Build a deck with rarity-weighted selection, biased by archetype.
     */
    static buildDeck(allCards, config, archetype) {
        const {deckSize, rarityWeights} = config;
        const deck = [];
        const usedIds = new Set();

        // Archetype-preferred card types
        const prefersAttack  = ['aggressor', 'brawler'].includes(archetype);
        const prefersDefense = archetype === 'guardian';

        // Guarantee at least one attack and one defense card
        const attacks  = allCards.filter(c => c.isAttack());
        const defenses = allCards.filter(c => c.isDefense());

        if (attacks.length > 0) {
            const pool = prefersAttack ? attacks.filter(c => c.power >= 20) : attacks;
            const pick = (pool.length > 0 ? pool : attacks)[Math.floor(Math.random() * (pool.length || attacks.length))];
            deck.push(pick);
            usedIds.add(pick.id);
        }
        if (defenses.length > 0) {
            const pool = prefersDefense ? defenses.filter(c => c.power >= 15) : defenses;
            const pick = (pool.length > 0 ? pool : defenses)[Math.floor(Math.random() * (pool.length || defenses.length))];
            if (!usedIds.has(pick.id)) {
                deck.push(pick);
                usedIds.add(pick.id);
            }
        }

        // Fill remaining slots with weighted random
        const remaining = allCards.filter(c => !usedIds.has(c.id));

        // Apply archetype bias to rarity weights
        const biasedWeights = remaining.map(c => {
            let w = rarityWeights[c.rarity] || 1;
            if (prefersAttack  && c.isAttack())  w += 2;
            if (prefersDefense && c.isDefense()) w += 2;
            return Math.max(1, w);
        });

        while (deck.length < deckSize && remaining.length > 0) {
            const idx = OpponentGenerator.weightedRandomIndex(biasedWeights);
            if (idx === -1) break;

            deck.push(remaining[idx]);
            usedIds.add(remaining[idx].id);
            remaining.splice(idx, 1);
            biasedWeights.splice(idx, 1);
        }

        return deck;
    }

    static weightedRandomIndex(weights) {
        const total = weights.reduce((s, w) => s + w, 0);
        if (total <= 0) return -1;
        let r = Math.random() * total;
        for (let i = 0; i < weights.length; i++) {
            r -= weights[i];
            if (r <= 0) return i;
        }
        return weights.length - 1;
    }
}
