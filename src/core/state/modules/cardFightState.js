import { CombatEngine } from '@/core/engine/combatEngine.js';
import { ModuleAIStrategy } from '@/core/engine/aiStrategy.js';
import { OpponentGenerator } from '@/core/engine/opponentGenerator.js';
import { ARCHETYPES } from '@/core/data/archetypes.js';
import router from '@/router/index.js';
import { MAX_HP, MAX_ROUNDS, DICE_MIN_INTERVAL, DICE_MAX_INTERVAL, EMERGENCY_HP_THRESHOLD } from '@/core/constants.js';

const MODULES_STORAGE_KEY = 'hexlash_player_modules';

// ─── Dice items ──────────────────────────────────────────────────────────────
export const DICE_ITEMS = [
    { id: 'heal',       name: 'АПТЕЧКА',    emoji: '💊', effect: 'heal',       desc: '+15 HP' },
    { id: 'adrenaline', name: 'АДРЕНАЛИН',  emoji: '⚡', effect: 'adrenaline', desc: '2x урон' },
    { id: 'shield',     name: 'ЩИТ',        emoji: '🛡️', effect: 'shield',     desc: 'Блок атаки' },
    { id: 'blind',      name: 'ОСЛЕПЛЕНИЕ', emoji: '✨', effect: 'blind',      desc: 'Промах врага' },
    { id: 'rage',       name: 'ЯРОСТЬ',     emoji: '🔥', effect: 'rage',       desc: '-20 HP врагу' },
    { id: 'crit',       name: 'КРИТ',       emoji: '💀', effect: 'crit',       desc: '-30 HP врагу' },
];

// ─── Module-level AI instances (NOT stored in Vuex) ──────────────────────────
let _ai1 = null;
let _ai2 = null;

// ─── Next dice round tracking ────────────────────────────────────────────────
let _nextDiceRound = 0;

function rollNextDiceRound() {
    return DICE_MIN_INTERVAL + Math.floor(Math.random() * (DICE_MAX_INTERVAL - DICE_MIN_INTERVAL + 1));
}

// ─── State ───────────────────────────────────────────────────────────────────
const state = {
    // Module build (replaces card deck)
    playerModules: ['predator', 'analyst', 'ghost'],
    opponent: null,

    // Emergency Protocol
    emergencyProtocol: {
        type: 'medkit',       // medkit | adrenaline | shield
        used: false,
    },

    // Live fight
    liveHP1:  MAX_HP,
    liveHP2:  MAX_HP,
    roundNum: 0,
    roundLog: [],

    // Player modifiers (reset each round)
    playerModifiers: {
        attackMultiplier: 1,
        shieldActive:     false,
        blindActive:      false,
    },

    // Dice of Fate (automatic now)
    diceState: {
        rolling:    false,
        activeItem: null,
    },

    // Event title (replaces override)
    eventTitle: null,
    eventTitleClass: '',

    fightPhase: 'idle',    // idle | preparation | fighting | results
    difficulty: 'medium',

    // Fight statistics
    fightStats: {
        totalDamageDealt:  0,
        totalDamageTaken:  0,
        dicePickedUp:      0,
        diceIgnored:       0,
    },
};

// ─── Getters ─────────────────────────────────────────────────────────────────
const getters = {
    getPlayerModules:    (s) => s.playerModules,
    getOpponent:         (s) => s.opponent,
    getFightPhase:       (s) => s.fightPhase,
    getDifficulty:       (s) => s.difficulty,

    getLiveHP1:          (s) => s.liveHP1,
    getLiveHP2:          (s) => s.liveHP2,
    getRoundNum:         (s) => s.roundNum,
    getRoundLog:         (s) => s.roundLog,
    getCurrentRound:     (s) => s.roundLog[s.roundLog.length - 1] || null,

    getPlayerModifiers:  (s) => s.playerModifiers,
    getDiceState:        (s) => s.diceState,
    getFightStats:       (s) => s.fightStats,
    getEventTitle:       (s) => s.eventTitle,
    getEventTitleClass:  (s) => s.eventTitleClass,

    getEmergencyProtocol: (s) => s.emergencyProtocol,
    getBuildDescription:  (s) => {
        const names = s.playerModules
            .filter(id => id)
            .map(id => ARCHETYPES[id]?.nameRu || id);
        return names.join(' + ');
    },

    // For PreparationView: is the build complete (3 modules selected)?
    isBuildValid: (s) => s.playerModules.every(m => m !== null),
};

// ─── Mutations ────────────────────────────────────────────────────────────────
const mutations = {
    setPlayerModules(s, modules) { s.playerModules = modules; },
    setOpponent(s, v)            { s.opponent = v; },
    setFightPhase(s, v)          { s.fightPhase = v; },
    setDifficulty(s, v)          { s.difficulty = v; },

    setLiveHP1(s, v)    { s.liveHP1  = Math.max(0, Math.min(MAX_HP, v)); },
    setLiveHP2(s, v)    { s.liveHP2  = Math.max(0, Math.min(MAX_HP, v)); },
    setRoundNum(s, v)   { s.roundNum = v; },
    addRoundToLog(s, r) { s.roundLog.push(r); },
    clearRoundLog(s)    { s.roundLog = []; },

    setPlayerModifiers(s, mods) {
        s.playerModifiers = { ...s.playerModifiers, ...mods };
    },
    resetPlayerModifiers(s) {
        s.playerModifiers = { attackMultiplier: 1, shieldActive: false, blindActive: false };
    },

    setDiceState(s, v) { s.diceState = { ...s.diceState, ...v }; },
    clearDice(s)       { s.diceState = { rolling: false, activeItem: null }; },

    setEventTitle(s, { title, cls = '' }) {
        s.eventTitle = title;
        s.eventTitleClass = cls;
    },
    clearEventTitle(s) {
        s.eventTitle = null;
        s.eventTitleClass = '';
    },

    setEmergencyProtocol(s, type)  { s.emergencyProtocol.type = type; },
    setEmergencyUsed(s, used)      { s.emergencyProtocol.used = used; },

    addStats(s, delta) {
        s.fightStats = {
            totalDamageDealt:  s.fightStats.totalDamageDealt  + (delta.totalDamageDealt  || 0),
            totalDamageTaken:  s.fightStats.totalDamageTaken  + (delta.totalDamageTaken  || 0),
            dicePickedUp:      s.fightStats.dicePickedUp      + (delta.dicePickedUp      || 0),
            diceIgnored:       s.fightStats.diceIgnored       + (delta.diceIgnored       || 0),
        };
    },
    resetStats(s) {
        s.fightStats = { totalDamageDealt: 0, totalDamageTaken: 0, dicePickedUp: 0, diceIgnored: 0 };
    },
};

// ─── Actions ─────────────────────────────────────────────────────────────────
const actions = {

    /** Load saved player modules from localStorage. */
    loadModules({ commit }) {
        const saved = localStorage.getItem(MODULES_STORAGE_KEY);
        if (saved) {
            try {
                const modules = JSON.parse(saved);
                if (Array.isArray(modules) && modules.length === 3) {
                    commit('setPlayerModules', modules);
                }
            } catch { /* ignore */ }
        }
        commit('setFightPhase', 'preparation');
    },

    setPlayerModules({ commit }, modules) {
        commit('setPlayerModules', modules);
        localStorage.setItem(MODULES_STORAGE_KEY, JSON.stringify(modules));
    },

    setEmergencyProtocol({ commit }, type) {
        commit('setEmergencyProtocol', type);
    },

    /** Start a live fight: generate opponent, init AI, reset state. */
    async startFight({ commit, state }) {
        if (!state.playerModules.every(m => m !== null)) return;

        const opponent = OpponentGenerator.generate(state.difficulty);
        commit('setOpponent', opponent);

        // Create AI instances
        _ai1 = new ModuleAIStrategy(state.playerModules);
        _ai2 = new ModuleAIStrategy(opponent.modules);

        // Init dice round
        _nextDiceRound = rollNextDiceRound();

        // Reset live fight state
        commit('setLiveHP1', MAX_HP);
        commit('setLiveHP2', MAX_HP);
        commit('setRoundNum', 0);
        commit('clearRoundLog');
        commit('resetPlayerModifiers');
        commit('clearDice');
        commit('clearEventTitle');
        commit('setEmergencyUsed', false);
        commit('resetStats');
        commit('setFightPhase', 'fighting');

        await router.push('/fight');
    },

    /**
     * Compute and commit the next round (fully automatic).
     * AI selects actions for both fighters.
     */
    computeNextRound({ commit, state, dispatch }) {
        const nextRound = state.roundNum + 1;

        if (state.liveHP1 <= 0 || state.liveHP2 <= 0 || state.fightPhase !== 'fighting') {
            commit('setFightPhase', 'results');
            return;
        }
        if (nextRound > MAX_ROUNDS) {
            commit('setFightPhase', 'results');
            return;
        }

        // AI selects actions automatically
        const action1 = _ai1.selectAction(state.liveHP1, MAX_HP);
        const action2 = _ai2.selectAction(state.liveHP2, MAX_HP);

        const result = CombatEngine.resolveRoundLive(
            action1, action2,
            state.liveHP1, state.liveHP2,
            _ai1, _ai2,
            nextRound,
            state.playerModifiers,
        );

        commit('setLiveHP1', result.hp1After);
        commit('setLiveHP2', result.hp2After);
        commit('setRoundNum', nextRound);
        commit('addRoundToLog', result);
        commit('addStats', { totalDamageDealt: result.damage2, totalDamageTaken: result.damage1 });
        commit('resetPlayerModifiers');

        // Check end conditions
        if (result.hp1After <= 0 || result.hp2After <= 0 || nextRound >= MAX_ROUNDS) {
            commit('setFightPhase', 'results');
            return;
        }

        // Check Emergency Protocol
        dispatch('checkEmergencyProtocol');

        // Check automatic dice roll
        if (nextRound >= _nextDiceRound) {
            dispatch('rollDiceAutomatic');
            _nextDiceRound = nextRound + rollNextDiceRound();
        }
    },

    // ── Emergency Protocol ─────────────────────────────────────────────────

    checkEmergencyProtocol({ commit, state }) {
        if (state.emergencyProtocol.used) return;

        const hpPercent = (state.liveHP1 / MAX_HP) * 100;
        const protocol = state.emergencyProtocol;
        let shouldTrigger = false;

        switch (protocol.type) {
            case 'medkit':
                shouldTrigger = hpPercent < EMERGENCY_HP_THRESHOLD;
                break;
            case 'adrenaline':
                shouldTrigger = hpPercent < 20 && (state.liveHP2 / MAX_HP) * 100 < 30;
                break;
            case 'shield': {
                const lastRounds = state.roundLog.slice(-3);
                shouldTrigger = lastRounds.length >= 3 && lastRounds.every(r => r.damage1 > 0);
                break;
            }
        }

        if (shouldTrigger) {
            switch (protocol.type) {
                case 'medkit':
                    commit('setLiveHP1', Math.min(MAX_HP, state.liveHP1 + 25));
                    break;
                case 'adrenaline':
                    commit('setPlayerModifiers', { attackMultiplier: 2 });
                    break;
                case 'shield':
                    commit('setPlayerModifiers', { shieldActive: true });
                    break;
            }

            commit('setEmergencyUsed', true);
            commit('setEventTitle', { title: '⚡ ЭКСТРЕННЫЙ ПРОТОКОЛ', cls: 'event-emergency' });
        }
    },

    // ── Automatic Dice ─────────────────────────────────────────────────────

    rollDiceAutomatic({ commit, state }) {
        if (!_ai1) return;

        const item = DICE_ITEMS[Math.floor(Math.random() * DICE_ITEMS.length)];
        const willPickup = _ai1.shouldPickupDiceItem(item.id);

        commit('setDiceState', { rolling: false, activeItem: item });

        if (willPickup) {
            switch (item.effect) {
                case 'heal':
                    commit('setLiveHP1', state.liveHP1 + 15);
                    break;
                case 'adrenaline':
                    commit('setPlayerModifiers', { attackMultiplier: 2 });
                    break;
                case 'shield':
                    commit('setPlayerModifiers', { shieldActive: true });
                    break;
                case 'blind':
                    commit('setPlayerModifiers', { blindActive: true });
                    break;
                case 'rage': {
                    const hp2 = state.liveHP2 - 20;
                    commit('setLiveHP2', hp2);
                    if (hp2 <= 0) commit('setFightPhase', 'results');
                    break;
                }
                case 'crit': {
                    const hp2 = state.liveHP2 - 30;
                    commit('setLiveHP2', hp2);
                    if (hp2 <= 0) commit('setFightPhase', 'results');
                    break;
                }
            }

            commit('addStats', { dicePickedUp: 1 });
            commit('setEventTitle', { title: `${item.emoji} ${item.name}!`, cls: 'event-dice-pickup' });
        } else {
            commit('addStats', { diceIgnored: 1 });
            commit('setEventTitle', { title: `${item.emoji} Проигнорировано`, cls: 'event-dice-ignore' });
        }

        // Clear dice display after short delay
        setTimeout(() => {
            commit('clearDice');
        }, 1500);
    },

    // ── Navigation ────────────────────────────────────────────────────────

    async resetToPreparation({ commit }) {
        _ai1 = null;
        _ai2 = null;
        commit('clearRoundLog');
        commit('setOpponent', null);
        commit('setFightPhase', 'preparation');
        await router.push('/arena');
    },

    async fightAgain({ dispatch }) {
        await dispatch('startFight');
    },

    setDifficulty({ commit }, difficulty) {
        commit('setDifficulty', difficulty);
    },
};

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};
