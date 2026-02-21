import {AIStrategy} from "@/core/engine/aiStrategy.js";
import {RoundResult, CombatResultModel} from "@/core/models/combatResultModel.js";
import {MAX_HP, MAX_ROUNDS} from "@/core/constants.js";

/**
 * Combat Engine - runs fully automated card-based fights.
 * Both fighters select cards via AI, then the round resolves.
 */
export class CombatEngine {

    /**
     * Run a full combat simulation.
     * @param {CardModel[]} deck1 - fighter 1's deck (player)
     * @param {CardModel[]} deck2 - fighter 2's deck (opponent)
     * @returns {CombatResultModel}
     */
    static runCombat(deck1, deck2) {
        let hp1 = MAX_HP;
        let hp2 = MAX_HP;
        const rounds = [];

        const ai1 = new AIStrategy(deck1);
        const ai2 = new AIStrategy(deck2);

        for (let roundNum = 1; roundNum <= MAX_ROUNDS; roundNum++) {
            const card1 = ai1.selectCard(hp1, MAX_HP, roundNum);
            const card2 = ai2.selectCard(hp2, MAX_HP, roundNum);

            const result = CombatEngine.resolveRound(
                card1, card2, hp1, hp2, ai1, ai2, roundNum
            );

            hp1 = result.hp1After;
            hp2 = result.hp2After;
            rounds.push(result);

            // Tick cooldowns
            ai1.tickCooldowns();
            ai2.tickCooldowns();

            // Check if fight is over
            if (hp1 <= 0 || hp2 <= 0) break;
        }

        return CombatEngine.buildResult(rounds, hp1, hp2);
    }

    /**
     * Resolve a single round of combat.
     */
    static resolveRound(card1, card2, hp1, hp2, ai1, ai2, roundNum) {
        let damage1 = 0; // damage TO fighter 1
        let damage2 = 0; // damage TO fighter 2
        const events = [];

        // Handle special cards first
        const special1 = CombatEngine.handleSpecial(card1, ai1, hp1);
        const special2 = CombatEngine.handleSpecial(card2, ai2, hp2);

        if (special1.healed) {
            hp1 = Math.min(MAX_HP, hp1 + special1.healed);
            events.push({fighter: 1, type: 'heal', value: special1.healed});
        }
        if (special2.healed) {
            hp2 = Math.min(MAX_HP, hp2 + special2.healed);
            events.push({fighter: 2, type: 'heal', value: special2.healed});
        }
        if (special1.buffed) {
            events.push({fighter: 1, type: 'buff', value: special1.buffed});
        }
        if (special2.buffed) {
            events.push({fighter: 2, type: 'buff', value: special2.buffed});
        }

        // Calculate attack damage from card1 → card2
        if (card1.isAttack()) {
            const attackPower = card1.power + ai1.consumeAttackBoost();
            const blocked = CombatEngine.calculateBlock(card1, card2, ai2);
            damage2 = Math.max(0, attackPower - blocked);
            if (blocked > 0) {
                events.push({fighter: 2, type: 'block', value: blocked});
            }
            if (damage2 > 0) {
                events.push({fighter: 2, type: 'damage', value: damage2});
            }

            // Counter-attack check
            if (special2.counter && blocked > 0) {
                const counterDamage = Math.floor(attackPower * 0.5);
                damage1 += counterDamage;
                events.push({fighter: 1, type: 'counter', value: counterDamage});
            }
        }

        // Calculate attack damage from card2 → card1
        if (card2.isAttack()) {
            const attackPower = card2.power + ai2.consumeAttackBoost();
            const blocked = CombatEngine.calculateBlock(card2, card1, ai1);
            damage1 += Math.max(0, attackPower - blocked);
            if (blocked > 0) {
                events.push({fighter: 1, type: 'block', value: blocked});
            }
            if (Math.max(0, attackPower - blocked) > 0) {
                events.push({fighter: 1, type: 'damage', value: Math.max(0, attackPower - blocked)});
            }

            // Counter-attack check
            if (special1.counter && blocked > 0) {
                const counterDamage = Math.floor(attackPower * 0.5);
                damage2 += counterDamage;
                events.push({fighter: 2, type: 'counter', value: counterDamage});
            }
        }

        const hp1After = Math.max(0, hp1 - damage1);
        const hp2After = Math.max(0, hp2 - damage2);

        return new RoundResult({
            roundNum,
            card1,
            card2,
            damage1,
            damage2,
            hp1After,
            hp2After,
            events,
        });
    }

    /**
     * Handle special card effects (heal, buff, counter setup).
     */
    static handleSpecial(card, ai, currentHP) {
        const result = {healed: 0, buffed: null, counter: false};

        if (!card.isSpecial()) return result;

        switch (card.effect) {
            case 'heal':
                result.healed = card.power;
                break;
            case 'buff_attack':
                ai.applyBuff('buff_attack', card.power);
                result.buffed = 'attack';
                break;
            case 'buff_defense':
                ai.applyBuff('buff_defense', card.power);
                result.buffed = 'defense';
                break;
            case 'counter':
                result.counter = true;
                break;
        }

        return result;
    }

    /**
     * Calculate how much damage a defense card blocks against an attack.
     */
    static calculateBlock(attackCard, defenseCard, defenderAI) {
        if (!defenseCard.isDefense()) return 0;

        const defenseBoost = defenderAI.consumeDefenseBoost();
        const totalDefense = defenseCard.power + defenseBoost;

        // Defense target must match attack target (or be 'both')
        if (defenseCard.target === 'both' ||
            defenseCard.target === attackCard.target) {
            return totalDefense;
        }

        return 0; // Defense doesn't match attack target
    }

    /**
     * Build the final combat result.
     */
    static buildResult(rounds, finalHP1, finalHP2) {
        let winnerId = null;
        let isDraw = false;

        if (finalHP1 <= 0 && finalHP2 <= 0) {
            isDraw = true;
        } else if (finalHP1 <= 0) {
            winnerId = 'fighter2';
        } else if (finalHP2 <= 0) {
            winnerId = 'fighter1';
        } else if (finalHP1 > finalHP2) {
            winnerId = 'fighter1';
        } else if (finalHP2 > finalHP1) {
            winnerId = 'fighter2';
        } else {
            isDraw = true;
        }

        return new CombatResultModel({
            rounds,
            winnerId,
            isDraw,
            fighter1FinalHP: finalHP1,
            fighter2FinalHP: finalHP2,
            totalRounds: rounds.length,
        });
    }
}
