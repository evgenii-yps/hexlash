import { ModuleAIStrategy } from '@/core/engine/aiStrategy.js';
import { RoundResult, CombatResultModel } from '@/core/models/combatResultModel.js';
import { MAX_HP, MAX_ROUNDS, TOTAL_ROUNDS, EXTRA_ROUND_DAMAGE_MULTIPLIER, BASE_DAMAGE, POSITION_BONUS } from '@/core/constants.js';
import { allMoves } from '@/data/moves.js';

const DODGE_CHANCE = 0.12;
const CRIT_CHANCE  = 0.10;
const CRIT_MULT    = 1.5;

/**
 * Combat Engine - runs action-based fights with move-based damage.
 *
 * Actions: 'attack' | 'defense' | 'position' (chosen by archetype AI)
 * Damage: from move data (moves.js) instead of BASE_DAMAGE constant
 * Speed:  from move data — faster attacker hits first on attack vs attack
 *
 * resolveRoundLive  - one round at a time (live fight)
 * runCombat         - batch mode (all rounds at once)
 */
export class CombatEngine {

    // ─── Live fight (one round at a time) ─────────────────────────────────

    /**
     * Resolve ONE round of the live fight.
     *
     * @param {string}            action1    - fighter 1's action ('attack'|'defense'|'position')
     * @param {string}            action2    - fighter 2's action
     * @param {number}            hp1        - player's current HP
     * @param {number}            hp2        - opponent's current HP
     * @param {ModuleAIStrategy}  ai1        - player AI instance
     * @param {ModuleAIStrategy}  ai2        - opponent AI instance
     * @param {number}            roundNum
     * @param {object}            playerMods - dice-granted modifiers
     * @param {object}            [moveInfo] - move data for this round
     * @param {object}            [moveInfo.move1] - { id, damage, speed, branch }
     * @param {object}            [moveInfo.move2] - { id, damage, speed, branch }
     * @returns {RoundResult}
     */
    static resolveRoundLive(action1, action2, hp1, hp2, ai1, ai2, roundNum, playerMods = {}, moveInfo = null) {
        const {
            attackMultiplier = 1,
            shieldActive     = false,
            blindActive      = false,
        } = playerMods;

        // Overdrive: rounds > MAX_ROUNDS get damage multiplied
        const isOverdrive = roundNum > MAX_ROUNDS;
        const overdriveMult = isOverdrive ? EXTRA_ROUND_DAMAGE_MULTIPLIER : 1;

        // Get move damage for each fighter (fallback to BASE_DAMAGE for backward compat)
        const moveDmg1 = ((moveInfo?.move1?.damage ?? BASE_DAMAGE) * overdriveMult);
        const moveDmg2 = ((moveInfo?.move2?.damage ?? BASE_DAMAGE) * overdriveMult);
        const moveSpeed1 = moveInfo?.move1?.speed ?? 1.0;
        const moveSpeed2 = moveInfo?.move2?.speed ?? 1.0;

        let damage1 = 0;  // damage TO player
        let damage2 = 0;  // damage TO opponent
        const events = [];

        // Speed determines attack order when both attack
        const bothAttacking = action1 === 'attack' && action2 === 'attack';
        let fighter1First = moveSpeed1 >= moveSpeed2;

        // ── Calculate potential damages ──

        const calcAttackDamage = (baseDmg, attackerAi, mult, defenderAction, dodgeChanceBonus) => {
            if (defenderAction === 'defense') {
                const dmg = (baseDmg + attackerAi.consumeAttackBoost()) * mult;
                const blocked = Math.floor(dmg * 0.6);
                const finalDmg = Math.max(0, dmg - blocked);
                return { damage: finalDmg, event: { type: 'block', value: blocked }, extraEvent: finalDmg > 0 ? { type: 'damage', value: finalDmg } : null };
            } else if (defenderAction === 'position') {
                if (Math.random() < DODGE_CHANCE + dodgeChanceBonus) {
                    return { damage: 0, event: { type: 'dodge', value: 0 }, extraEvent: null };
                }
                const dmg = (baseDmg + attackerAi.consumeAttackBoost()) * mult;
                const isCrit = Math.random() < CRIT_CHANCE;
                const finalDmg = isCrit ? Math.floor(dmg * CRIT_MULT) : dmg;
                return { damage: finalDmg, event: { type: isCrit ? 'crit' : 'damage', value: finalDmg }, extraEvent: null };
            } else {
                // Both attacking or attacker vs non-attack
                const dmg = (baseDmg + attackerAi.consumeAttackBoost()) * mult;
                const isCrit = Math.random() < CRIT_CHANCE;
                const finalDmg = isCrit ? Math.floor(dmg * CRIT_MULT) : dmg;
                return { damage: finalDmg, event: { type: isCrit ? 'crit' : 'damage', value: finalDmg }, extraEvent: null };
            }
        };

        // ── Fighter 1 attacks ──
        if (action1 === 'attack') {
            const result = calcAttackDamage(moveDmg1, ai1, attackMultiplier, action2, 0.1);
            damage2 = result.damage;
            events.push({ fighter: 2, ...result.event });
            if (result.extraEvent) events.push({ fighter: 2, ...result.extraEvent });
        } else if (action1 === 'position') {
            ai1.applyBuff('attack', POSITION_BONUS);
            events.push({ fighter: 1, type: 'position', value: POSITION_BONUS });
        }
        // defense — no active action

        // ── Fighter 2 attacks ──
        if (action2 === 'attack') {
            if (blindActive) {
                events.push({ fighter: 1, type: 'missed', value: 0 });
            } else if (shieldActive) {
                events.push({ fighter: 1, type: 'shield', value: 0 });
            } else {
                const result = calcAttackDamage(moveDmg2, ai2, 1, action1, 0.1);
                damage1 = result.damage;
                events.push({ fighter: 1, ...result.event });
                if (result.extraEvent) events.push({ fighter: 1, ...result.extraEvent });
            }
        } else if (action2 === 'position') {
            ai2.applyBuff('attack', POSITION_BONUS);
            events.push({ fighter: 2, type: 'position', value: POSITION_BONUS });
        }

        // ── Speed-based knockout: faster attacker can KO before slower responds ──
        let hp1After, hp2After;
        if (bothAttacking && damage1 > 0 && damage2 > 0) {
            if (fighter1First) {
                // Fighter 1 hits first
                hp2After = Math.max(0, hp2 - damage2);
                if (hp2After <= 0) {
                    // KO — fighter 2 doesn't get to hit back
                    damage1 = 0;
                    // Remove fighter 1 damage events
                    for (let i = events.length - 1; i >= 0; i--) {
                        if (events[i].fighter === 1 && (events[i].type === 'damage' || events[i].type === 'crit' || events[i].type === 'block')) {
                            events.splice(i, 1);
                        }
                    }
                }
                hp1After = Math.max(0, hp1 - damage1);
            } else {
                // Fighter 2 hits first
                hp1After = Math.max(0, hp1 - damage1);
                if (hp1After <= 0) {
                    // KO — fighter 1 doesn't get to hit back
                    damage2 = 0;
                    // Remove fighter 2 damage events
                    for (let i = events.length - 1; i >= 0; i--) {
                        if (events[i].fighter === 2 && (events[i].type === 'damage' || events[i].type === 'crit' || events[i].type === 'block')) {
                            events.splice(i, 1);
                        }
                    }
                }
                hp2After = Math.max(0, hp2 - damage2);
            }
        } else {
            hp1After = Math.max(0, hp1 - damage1);
            hp2After = Math.max(0, hp2 - damage2);
        }

        // Include move info in result for UI display
        const resultData = { roundNum, action1, action2, damage1, damage2, hp1After, hp2After, events, isOverdrive };
        if (moveInfo) {
            resultData.move1 = moveInfo.move1;
            resultData.move2 = moveInfo.move2;
        }

        return new RoundResult(resultData);
    }

    // ─── Batch mode ───────────────────────────────────────────────────────

    static runCombat(modules1, modules2, deck1 = null, cardLevels1 = null, deck2 = null, cardLevels2 = null) {
        let hp1 = MAX_HP;
        let hp2 = MAX_HP;
        const rounds = [];

        const ai1 = new ModuleAIStrategy(modules1);
        const ai2 = new ModuleAIStrategy(modules2);

        for (let roundNum = 1; roundNum <= TOTAL_ROUNDS; roundNum++) {
            const action1 = ai1.selectAction(hp1, MAX_HP);
            const action2 = ai2.selectAction(hp2, MAX_HP);

            const moveInfo = CombatEngine.getMoveInfo(roundNum, deck1, cardLevels1, deck2, cardLevels2);

            const result = CombatEngine.resolveRoundLive(
                action1, action2, hp1, hp2, ai1, ai2, roundNum, {}, moveInfo
            );

            hp1 = result.hp1After;
            hp2 = result.hp2After;
            rounds.push(result);

            if (hp1 <= 0 || hp2 <= 0) break;
        }

        return CombatEngine.buildResult(rounds, hp1, hp2);
    }

    // ─── Move info helper ─────────────────────────────────────────────────

    /**
     * Get move damage/speed for a round from decks.
     * Returns null if no deck data available (backward compat).
     */
    static getMoveInfo(roundNum, deck1, cardLevels1, deck2, cardLevels2) {
        if (!deck1?.length && !deck2?.length) return null;

        const getMove = (deck, cardLevels) => {
            if (!deck?.length) return { id: null, damage: BASE_DAMAGE, speed: 1.0, branch: null };
            const moveId = deck[(roundNum - 1) % deck.length];
            const moveData = allMoves[moveId];
            if (!moveData) return { id: moveId, damage: BASE_DAMAGE, speed: 1.0, branch: null };
            const level = Math.min(Math.max((cardLevels && cardLevels[moveId]) || 1, 1), 5);
            return {
                id: moveId,
                damage: moveData.damage[level - 1],
                speed: moveData.speed[level - 1],
                branch: moveData.branch,
                level,
            };
        };

        return {
            move1: getMove(deck1, cardLevels1),
            move2: getMove(deck2, cardLevels2),
        };
    }

    // ─── Shared helpers ───────────────────────────────────────────────────

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
