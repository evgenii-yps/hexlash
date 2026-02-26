import { ModuleAIStrategy } from '@/core/engine/aiStrategy.js';
import { RoundResult, CombatResultModel } from '@/core/models/combatResultModel.js';
import { MAX_HP, MAX_ROUNDS, BASE_DAMAGE, POSITION_BONUS } from '@/core/constants.js';

const DODGE_CHANCE = 0.12;
const CRIT_CHANCE  = 0.10;
const CRIT_MULT    = 1.5;

/**
 * Combat Engine - runs action-based fights.
 *
 * Actions: 'attack' | 'defense' | 'position'
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
     * @returns {RoundResult}
     */
    static resolveRoundLive(action1, action2, hp1, hp2, ai1, ai2, roundNum, playerMods = {}) {
        const {
            attackMultiplier = 1,
            shieldActive     = false,
            blindActive      = false,
        } = playerMods;

        let damage1 = 0;  // damage TO player
        let damage2 = 0;  // damage TO opponent
        const events = [];

        // ── Fighter 1 actions ──

        if (action1 === 'attack') {
            if (action2 === 'defense') {
                // Opponent is defending — reduced damage
                const baseDmg = (BASE_DAMAGE + ai1.consumeAttackBoost()) * attackMultiplier;
                const blocked = Math.floor(baseDmg * 0.6);
                damage2 = Math.max(0, baseDmg - blocked);
                events.push({ fighter: 2, type: 'block', value: blocked });
                if (damage2 > 0) events.push({ fighter: 2, type: 'damage', value: damage2 });
            } else if (action2 === 'position') {
                // Opponent is positioning — might dodge
                if (Math.random() < DODGE_CHANCE + 0.1) {
                    events.push({ fighter: 2, type: 'dodge', value: 0 });
                } else {
                    const baseDmg = (BASE_DAMAGE + ai1.consumeAttackBoost()) * attackMultiplier;
                    const isCrit = Math.random() < CRIT_CHANCE;
                    damage2 = isCrit ? Math.floor(baseDmg * CRIT_MULT) : baseDmg;
                    if (isCrit) events.push({ fighter: 2, type: 'crit', value: damage2 });
                    else events.push({ fighter: 2, type: 'damage', value: damage2 });
                }
            } else {
                // Both attacking — exchange blows
                const baseDmg = (BASE_DAMAGE + ai1.consumeAttackBoost()) * attackMultiplier;
                const isCrit = Math.random() < CRIT_CHANCE;
                damage2 = isCrit ? Math.floor(baseDmg * CRIT_MULT) : baseDmg;
                if (isCrit) events.push({ fighter: 2, type: 'crit', value: damage2 });
                else events.push({ fighter: 2, type: 'damage', value: damage2 });
            }
        } else if (action1 === 'position') {
            // Positioning gives attack bonus for next round
            ai1.applyBuff('attack', POSITION_BONUS);
            events.push({ fighter: 1, type: 'position', value: POSITION_BONUS });
        }
        // defense — no active action

        // ── Fighter 2 actions ──

        if (action2 === 'attack') {
            if (blindActive) {
                // Dice BLIND: opponent misses entirely
                events.push({ fighter: 1, type: 'missed', value: 0 });
            } else if (shieldActive) {
                // Dice SHIELD: block entire attack
                events.push({ fighter: 1, type: 'shield', value: 0 });
            } else if (action1 === 'defense') {
                const baseDmg = BASE_DAMAGE + ai2.consumeAttackBoost();
                const blocked = Math.floor(baseDmg * 0.6);
                damage1 = Math.max(0, baseDmg - blocked);
                events.push({ fighter: 1, type: 'block', value: blocked });
                if (damage1 > 0) events.push({ fighter: 1, type: 'damage', value: damage1 });
            } else if (action1 === 'position') {
                // Player positioning — might dodge
                if (Math.random() < DODGE_CHANCE + 0.1) {
                    events.push({ fighter: 1, type: 'dodge', value: 0 });
                } else {
                    const baseDmg = BASE_DAMAGE + ai2.consumeAttackBoost();
                    const isCrit = Math.random() < CRIT_CHANCE;
                    damage1 = isCrit ? Math.floor(baseDmg * CRIT_MULT) : baseDmg;
                    if (isCrit) events.push({ fighter: 1, type: 'crit', value: damage1 });
                    else events.push({ fighter: 1, type: 'damage', value: damage1 });
                }
            } else {
                // Both attacking — exchange blows
                const baseDmg = BASE_DAMAGE + ai2.consumeAttackBoost();
                const isCrit = Math.random() < CRIT_CHANCE;
                damage1 = isCrit ? Math.floor(baseDmg * CRIT_MULT) : baseDmg;
                if (isCrit) events.push({ fighter: 1, type: 'crit', value: damage1 });
                else events.push({ fighter: 1, type: 'damage', value: damage1 });
            }
        } else if (action2 === 'position') {
            ai2.applyBuff('attack', POSITION_BONUS);
            events.push({ fighter: 2, type: 'position', value: POSITION_BONUS });
        }

        const hp1After = Math.max(0, hp1 - damage1);
        const hp2After = Math.max(0, hp2 - damage2);

        return new RoundResult({ roundNum, action1, action2, damage1, damage2, hp1After, hp2After, events });
    }

    // ─── Batch mode ───────────────────────────────────────────────────────

    static runCombat(modules1, modules2) {
        let hp1 = MAX_HP;
        let hp2 = MAX_HP;
        const rounds = [];

        const ai1 = new ModuleAIStrategy(modules1);
        const ai2 = new ModuleAIStrategy(modules2);

        for (let roundNum = 1; roundNum <= MAX_ROUNDS; roundNum++) {
            const action1 = ai1.selectAction(hp1, MAX_HP);
            const action2 = ai2.selectAction(hp2, MAX_HP);

            const result = CombatEngine.resolveRoundLive(
                action1, action2, hp1, hp2, ai1, ai2, roundNum
            );

            hp1 = result.hp1After;
            hp2 = result.hp2After;
            rounds.push(result);

            if (hp1 <= 0 || hp2 <= 0) break;
        }

        return CombatEngine.buildResult(rounds, hp1, hp2);
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
