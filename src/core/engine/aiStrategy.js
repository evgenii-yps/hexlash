/**
 * AI Strategy - selects cards for automated fighters.
 * Uses weighted random selection based on card priority + situational conditions.
 */

export class AIStrategy {
    constructor(deck) {
        this.deck = deck;       // array of CardModel
        this.cooldowns = {};    // { cardId: turnsRemaining }
        this.buffs = {
            attackBoost: 0,
            defenseBoost: 0,
        };
    }

    /**
     * Select a card for this round based on current fight state.
     * @param {number} currentHP - fighter's current HP
     * @param {number} maxHP - fighter's max HP
     * @param {number} roundNum - current round number
     * @returns {CardModel} selected card
     */
    selectCard(currentHP, maxHP, roundNum) {
        const availableCards = this.getAvailableCards();
        if (availableCards.length === 0) {
            // All on cooldown, reset cooldowns and pick again
            this.resetCooldowns();
            return this.selectCard(currentHP, maxHP, roundNum);
        }

        const weights = availableCards.map(card => {
            let weight = card.priority;

            // Apply condition bonuses
            for (const condition of card.conditions) {
                weight += this.evaluateCondition(condition, currentHP, maxHP, roundNum);
            }

            // Ensure minimum weight of 1
            return Math.max(1, weight);
        });

        const selected = this.weightedRandom(availableCards, weights);

        // Apply cooldown
        if (selected.cooldown > 0) {
            this.cooldowns[selected.id] = selected.cooldown;
        }

        return selected;
    }

    /**
     * Get cards not currently on cooldown.
     */
    getAvailableCards() {
        return this.deck.filter(card => !this.cooldowns[card.id] || this.cooldowns[card.id] <= 0);
    }

    /**
     * Tick cooldowns down by 1 turn.
     */
    tickCooldowns() {
        for (const cardId of Object.keys(this.cooldowns)) {
            if (this.cooldowns[cardId] > 0) {
                this.cooldowns[cardId]--;
            }
        }
    }

    resetCooldowns() {
        this.cooldowns = {};
    }

    /**
     * Evaluate a condition and return priority boost.
     */
    evaluateCondition(condition, currentHP, maxHP, roundNum) {
        const hpPercent = (currentHP / maxHP) * 100;

        switch (condition.type) {
            case 'hp_below':
                return hpPercent <= condition.threshold ? condition.priorityBoost : 0;
            case 'hp_above':
                return hpPercent >= condition.threshold ? condition.priorityBoost : 0;
            case 'round_after':
                return roundNum >= condition.threshold ? condition.priorityBoost : 0;
            default:
                return 0;
        }
    }

    /**
     * Weighted random selection from an array.
     */
    weightedRandom(items, weights) {
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        let random = Math.random() * totalWeight;

        for (let i = 0; i < items.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return items[i];
            }
        }

        return items[items.length - 1];
    }

    /**
     * Apply a buff effect.
     */
    applyBuff(effect, power) {
        if (effect === 'buff_attack') {
            this.buffs.attackBoost += power;
        } else if (effect === 'buff_defense') {
            this.buffs.defenseBoost += power;
        }
    }

    /**
     * Consume and return attack boost, then reset it.
     */
    consumeAttackBoost() {
        const boost = this.buffs.attackBoost;
        this.buffs.attackBoost = 0;
        return boost;
    }

    /**
     * Consume and return defense boost, then reset it.
     */
    consumeDefenseBoost() {
        const boost = this.buffs.defenseBoost;
        this.buffs.defenseBoost = 0;
        return boost;
    }
}
