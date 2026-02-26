/**
 * Module AI Strategy - selects actions based on archetype combinations.
 *
 * Each fighter has 3 module slots with weighted influence:
 *   slot1 (50%), slot2 (30%), slot3 (20%)
 *
 * Actions: 'attack' | 'defense' | 'position'
 */

import { ARCHETYPES, SLOT_WEIGHTS } from '@/core/data/archetypes.js';

export class ModuleAIStrategy {
    /**
     * @param {string[]} modules - array of 3 archetype IDs, e.g. ['predator', 'analyst', 'ghost']
     */
    constructor(modules) {
        this.modules = modules.map(id => ARCHETYPES[id]);
        this.buffs = { attackBoost: 0, defenseBoost: 0 };
    }

    /**
     * Calculate combined action priorities from 3 modules.
     */
    calculatePriorities(currentHP, maxHP) {
        const hpPercent = (currentHP / maxHP) * 100;
        const hpState = hpPercent > 70 ? 'high' : 'low';

        let combined = { attack: 0, defense: 0, position: 0 };
        const weights = [SLOT_WEIGHTS.slot1, SLOT_WEIGHTS.slot2, SLOT_WEIGHTS.slot3];

        this.modules.forEach((module, index) => {
            let priorities = module.priorities[hpState];

            // Maverick at low HP — random spikes
            if (priorities === 'random') {
                const spike = Math.random() < 0.3; // 30% chance of spike
                if (spike) {
                    const spikeType = ['attack', 'defense', 'position'][Math.floor(Math.random() * 3)];
                    priorities = { attack: 33, defense: 33, position: 34 };
                    priorities[spikeType] = 80;
                } else {
                    priorities = { attack: 33, defense: 33, position: 34 };
                }
            }

            combined.attack   += priorities.attack   * weights[index];
            combined.defense  += priorities.defense  * weights[index];
            combined.position += priorities.position * weights[index];
        });

        return combined;
    }

    /**
     * Select an action based on weighted priorities.
     * @returns {'attack' | 'defense' | 'position'}
     */
    selectAction(currentHP, maxHP) {
        const priorities = this.calculatePriorities(currentHP, maxHP);
        const total = priorities.attack + priorities.defense + priorities.position;
        const roll = Math.random() * total;

        if (roll < priorities.attack) return 'attack';
        if (roll < priorities.attack + priorities.defense) return 'defense';
        return 'position';
    }

    /**
     * Decide whether to pick up a dice item.
     * @param {string} itemId - 'heal' | 'shield' | 'rage' | 'crit' | 'adrenaline' | 'blind'
     * @returns {boolean}
     */
    shouldPickupDiceItem(itemId) {
        let combinedChance = 0;
        const weights = [SLOT_WEIGHTS.slot1, SLOT_WEIGHTS.slot2, SLOT_WEIGHTS.slot3];

        this.modules.forEach((module, index) => {
            const preference = module.dicePreferences[itemId] || 50;
            combinedChance += preference * weights[index];
        });

        return Math.random() * 100 < combinedChance;
    }

    /**
     * Get a human-readable build description.
     */
    getBuildDescription() {
        const names = this.modules.map(m => m.nameRu).join(' + ');
        const priorities = this.calculatePriorities(100, 100);
        let style = '';
        if (priorities.attack > 50) style = 'Агрессивный';
        else if (priorities.defense > 40) style = 'Оборонительный';
        else style = 'Сбалансированный';

        return `${style}: ${names}`;
    }

    // ── Buffs ────────────────────────────────────────────────────────────────

    applyBuff(type, power) {
        if (type === 'attack')  this.buffs.attackBoost  += power;
        if (type === 'defense') this.buffs.defenseBoost += power;
    }

    consumeAttackBoost() {
        const v = this.buffs.attackBoost;
        this.buffs.attackBoost = 0;
        return v;
    }

    consumeDefenseBoost() {
        const v = this.buffs.defenseBoost;
        this.buffs.defenseBoost = 0;
        return v;
    }
}
