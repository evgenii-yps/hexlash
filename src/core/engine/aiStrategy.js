/**
 * AI Strategy - selects cards for automated fighters.
 *
 * Archetypes change how cards are weighted:
 *  'aggressor' – prefers attacks, goes berserk at low HP
 *  'guardian'  – prefers defense and counter-attacks, heals when available
 *  'brawler'   – ignores defense, only high-power attacks
 *  'balanced'  – no modifier (default)
 */

export class AIStrategy {
    /**
     * @param {CardModel[]} deck
     * @param {string}      archetype – 'aggressor' | 'guardian' | 'brawler' | 'balanced'
     */
    constructor(deck, archetype = 'balanced') {
        this.deck = deck;
        this.archetype = archetype;
        this.cooldowns = {};
        this.buffs = {
            attackBoost: 0,
            defenseBoost: 0,
        };
    }

    /**
     * Select a card for this round.
     */
    selectCard(currentHP, maxHP, roundNum) {
        const available = this.getAvailableCards();
        if (available.length === 0) {
            this.resetCooldowns();
            return this.selectCard(currentHP, maxHP, roundNum);
        }

        const weights = available.map(card => {
            let w = card.priority;

            // Condition bonuses
            for (const cond of card.conditions) {
                w += this.evaluateCondition(cond, currentHP, maxHP, roundNum);
            }

            // Archetype modifier
            w += this.evaluateArchetype(card, currentHP, maxHP);

            return Math.max(1, w);
        });

        const selected = this.weightedRandom(available, weights);

        if (selected.cooldown > 0) {
            this.cooldowns[selected.id] = selected.cooldown;
        }

        return selected;
    }

    getAvailableCards() {
        return this.deck.filter(c => !this.cooldowns[c.id] || this.cooldowns[c.id] <= 0);
    }

    tickCooldowns() {
        for (const id of Object.keys(this.cooldowns)) {
            if (this.cooldowns[id] > 0) this.cooldowns[id]--;
        }
    }

    resetCooldowns() {
        this.cooldowns = {};
    }

    evaluateCondition(condition, currentHP, maxHP, roundNum) {
        const hpPct = (currentHP / maxHP) * 100;
        switch (condition.type) {
            case 'hp_below':  return hpPct <= condition.threshold ? condition.priorityBoost : 0;
            case 'hp_above':  return hpPct >= condition.threshold ? condition.priorityBoost : 0;
            case 'round_after': return roundNum >= condition.threshold ? condition.priorityBoost : 0;
            default:          return 0;
        }
    }

    /**
     * Archetype-based weight modifier.
     */
    evaluateArchetype(card, currentHP, maxHP) {
        const hpPct = (currentHP / maxHP) * 100;

        switch (this.archetype) {
            case 'aggressor':
                // Loves attacks; at low HP goes fully berserk
                if (card.isAttack()) {
                    return hpPct < 30 ? 7 : 3;
                }
                if (card.isDefense()) return -1;
                return 0;

            case 'guardian':
                // Loves defense and counter; heals when able
                if (card.isDefense()) return 3;
                if (card.effect === 'counter') return 4;
                if (card.effect === 'heal') return hpPct < 60 ? 5 : 2;
                if (card.effect === 'buff_defense') return 2;
                if (card.isAttack()) return -1;
                return 0;

            case 'brawler':
                // High-power attacks only, skips defense entirely
                if (card.isAttack() && card.power >= 20) return 5;
                if (card.isAttack()) return 2;
                if (card.isDefense()) return -3;
                return 0;

            case 'balanced':
            default:
                return 0;
        }
    }

    weightedRandom(items, weights) {
        const total = weights.reduce((s, w) => s + w, 0);
        let r = Math.random() * total;
        for (let i = 0; i < items.length; i++) {
            r -= weights[i];
            if (r <= 0) return items[i];
        }
        return items[items.length - 1];
    }

    applyBuff(effect, power) {
        if (effect === 'buff_attack')   this.buffs.attackBoost  += power;
        if (effect === 'buff_defense')  this.buffs.defenseBoost += power;
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
