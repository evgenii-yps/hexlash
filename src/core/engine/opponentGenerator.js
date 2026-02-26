/**
 * AI Opponent Generator - creates random opponents with module builds.
 */

import { ARCHETYPES } from '@/core/data/archetypes.js';

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

const ARCHETYPE_IDS = Object.keys(ARCHETYPES);

const DIFFICULTY_CONFIG = {
    easy: {
        namePrefix: 'Rookie ',
        // Easy opponents use balanced/defensive archetypes
        preferredArchetypes: ['analyst', 'sentinel', 'maverick'],
    },
    medium: {
        namePrefix: '',
        preferredArchetypes: null, // any archetype
    },
    hard: {
        namePrefix: 'Elite ',
        // Hard opponents use aggressive/synergistic archetypes
        preferredArchetypes: ['predator', 'juggernaut', 'ghost', 'analyst'],
    },
};

export class OpponentGenerator {

    /**
     * Generate a random AI opponent with a module build.
     * @param {string} difficulty - 'easy' | 'medium' | 'hard'
     * @returns {{ id, name, avatarUrl, skin, modules: string[] }}
     */
    static generate(difficulty = 'medium') {
        const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.medium;

        const name = config.namePrefix + OPPONENT_NAMES[Math.floor(Math.random() * OPPONENT_NAMES.length)];
        const skin = OPPONENT_SKINS[Math.floor(Math.random() * OPPONENT_SKINS.length)];
        const modules = OpponentGenerator.buildModuleSet(config);

        return {
            id: 'ai_' + Date.now(),
            name,
            avatarUrl: '',
            skin,
            modules,
        };
    }

    /**
     * Build a set of 3 archetype modules for the opponent.
     * No duplicate archetypes in the same build.
     */
    static buildModuleSet(config) {
        const pool = config.preferredArchetypes || ARCHETYPE_IDS;
        const modules = [];
        const used = new Set();

        for (let i = 0; i < 3; i++) {
            // Pick from preferred pool first, fallback to all archetypes
            let available = pool.filter(id => !used.has(id));
            if (available.length === 0) {
                available = ARCHETYPE_IDS.filter(id => !used.has(id));
            }

            const pick = available[Math.floor(Math.random() * available.length)];
            modules.push(pick);
            used.add(pick);
        }

        return modules;
    }
}
