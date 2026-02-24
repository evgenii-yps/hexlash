import {AIStrategy} from "@/core/engine/aiStrategy.js";
import {RoundResult, CombatResultModel} from "@/core/models/combatResultModel.js";
import {MAX_HP, MAX_ROUNDS} from "@/core/constants.js";

const DODGE_CHANCE = 0.12;  // 12% chance to fully dodge an attack
const CRIT_CHANCE  = 0.10;  // 10% chance for 1.5x damage
const CRIT_MULT    = 1.5;

/**
 * Combat Engine - runs card-based fights.
 *
 * resolveRoundLive  – used by the live step-by-step fight (player can interact).
 * runCombat        – legacy batch-mode: runs all rounds at once.
 */
export class CombatEngine {

    // ─── Live fight (one round at a time) ─────────────────────────────────────

    /**
     * Resolve ONE round for the live fight.
     *
     * @param {CardModel}    card1      – fighter 1's selected card (player)
     * @param {CardModel}    card2      – fighter 2's selected card (AI)
     * @param {number}       hp1        – player's current HP before this round
     * @param {number}       hp2        – opponent's current HP before this round
     * @param {AIStrategy}   ai1        – player AI instance (for buff consumption)
     * @param {AIStrategy}   ai2        – opponent AI instance
     * @param {number}       roundNum
     * @param {object}       playerMods – dice-granted modifiers for this round
     *   { attackMultiplier: number, shieldActive: bool, blindActive: bool }
     * @returns {RoundResult}
     */
    static resolveRoundLive(card1, card2, hp1, hp2, ai1, ai2, roundNum, playerMods = {}) {
        const {
            attackMultiplier = 1,
            shieldActive     = false,
            blindActive      = false,
        } = playerMods;

        let damage1 = 0;  // damage TO player (fighter 1)
        let damage2 = 0;  // damage TO opponent (fighter 2)
        const events = [];

        // ── Special cards (heal / buff) ──
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
        if (special1.buffed) events.push({fighter: 1, type: 'buff', value: special1.buffed});
        if (special2.buffed) events.push({fighter: 2, type: 'buff', value: special2.buffed});

        // ── Fighter 1 attacks Fighter 2 ──
        if (card1.isAttack()) {
            if (Math.random() < DODGE_CHANCE) {
                // Opponent dodges
                events.push({fighter: 2, type: 'dodge', value: 0});
            } else {
                let power = (card1.power + ai1.consumeAttackBoost()) * attackMultiplier;
                const isCrit = Math.random() < CRIT_CHANCE;
                if (isCrit) {
                    power = Math.floor(power * CRIT_MULT);
                    events.push({fighter: 2, type: 'crit', value: power});
                }

                const blocked = CombatEngine.calculateBlock(card1, card2, ai2);
                const dealt = Math.max(0, power - blocked);
                damage2 += dealt;

                if (blocked > 0) events.push({fighter: 2, type: 'block', value: blocked});
                if (dealt > 0) events.push({fighter: 2, type: 'damage', value: dealt});

                // Counter-attack: if fighter2 played counter AND it blocked
                if (special2.counter && blocked > 0) {
                    const ctr = Math.floor(power * 0.5);
                    damage1 += ctr;
                    events.push({fighter: 1, type: 'counter', value: ctr});
                }
            }
        }

        // ── Fighter 2 attacks Fighter 1 ──
        if (card2.isAttack()) {
            if (blindActive) {
                // Dice ОСЛЕПЛЕНИЕ: opponent misses entirely
                events.push({fighter: 1, type: 'missed', value: 0});
            } else if (Math.random() < DODGE_CHANCE) {
                // Player dodges
                events.push({fighter: 1, type: 'dodge', value: 0});
            } else {
                let power = card2.power + ai2.consumeAttackBoost();
                const isCrit = Math.random() < CRIT_CHANCE;
                if (isCrit) {
                    power = Math.floor(power * CRIT_MULT);
                    events.push({fighter: 1, type: 'crit', value: power});
                }

                if (shieldActive) {
                    // Dice ЩИТ: block entire attack
                    events.push({fighter: 1, type: 'shield', value: power});
                    // no damage to player
                } else {
                    const blocked = CombatEngine.calculateBlock(card2, card1, ai1);
                    const dealt = Math.max(0, power - blocked);
                    damage1 += dealt;

                    if (blocked > 0) events.push({fighter: 1, type: 'block', value: blocked});
                    if (dealt > 0) events.push({fighter: 1, type: 'damage', value: dealt});

                    if (special1.counter && blocked > 0) {
                        const ctr = Math.floor(power * 0.5);
                        damage2 += ctr;
                        events.push({fighter: 2, type: 'counter', value: ctr});
                    }
                }
            }
        }

        const hp1After = Math.max(0, hp1 - damage1);
        const hp2After = Math.max(0, hp2 - damage2);

        return new RoundResult({roundNum, card1, card2, damage1, damage2, hp1After, hp2After, events});
    }

    // ─── Legacy batch mode ────────────────────────────────────────────────────

    static runCombat(deck1, deck2) {
        let hp1 = MAX_HP;
        let hp2 = MAX_HP;
        const rounds = [];

        const ai1 = new AIStrategy(deck1);
        const ai2 = new AIStrategy(deck2);

        for (let roundNum = 1; roundNum <= MAX_ROUNDS; roundNum++) {
            const card1 = ai1.selectCard(hp1, MAX_HP, roundNum);
            const card2 = ai2.selectCard(hp2, MAX_HP, roundNum);

            const result = CombatEngine.resolveRoundLive(card1, card2, hp1, hp2, ai1, ai2, roundNum);

            hp1 = result.hp1After;
            hp2 = result.hp2After;
            rounds.push(result);

            ai1.tickCooldowns();
            ai2.tickCooldowns();

            if (hp1 <= 0 || hp2 <= 0) break;
        }

        return CombatEngine.buildResult(rounds, hp1, hp2);
    }

    // ─── Shared helpers ───────────────────────────────────────────────────────

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

    static calculateBlock(attackCard, defenseCard, defenderAI) {
        if (!defenseCard.isDefense()) return 0;
        const defenseBoost = defenderAI.consumeDefenseBoost();
        const total = defenseCard.power + defenseBoost;
        if (defenseCard.target === 'both' || defenseCard.target === attackCard.target) {
            return total;
        }
        return 0;
    }

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
