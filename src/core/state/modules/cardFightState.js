import { CombatEngine } from '@/core/engine/combatEngine.js';
import { ModuleAIStrategy } from '@/core/engine/aiStrategy.js';
import { OpponentGenerator } from '@/core/engine/opponentGenerator.js';
import { ARCHETYPES } from '@/core/data/archetypes.js';
import router from '@/router/index.js';
import { MAX_HP, MAX_ROUNDS, DICE_COOLDOWN_ROUNDS, EMERGENCY_HP_THRESHOLD, COACH_MIN_ROUND, COACH_TRIGGER_CHANCE, COACH_BOOST_ROUNDS, ROUND_ANIMATION_MS } from '@/core/constants.js';
import iconHeal from '@/assets/images/icons/heal.svg';
import iconAdrenaline from '@/assets/images/icons/adrenaline.svg';
import iconShield from '@/assets/images/icons/shield.svg';
import iconBlind from '@/assets/images/icons/blind.svg';
import iconRage from '@/assets/images/icons/rage.svg';
import iconCrit from '@/assets/images/icons/crit.svg';

const MODULES_STORAGE_KEY = 'hexlash_player_modules';
const FIGHT_STORAGE_KEY   = 'hexlash_current_fight';

// ─── Dice items ──────────────────────────────────────────────────────────────
export const DICE_ITEMS = [
    { id: 'heal',       name: 'АПТЕЧКА',    emoji: '💊', image: iconHeal,       effect: 'heal',       desc: '+15 HP' },
    { id: 'adrenaline', name: 'АДРЕНАЛИН',  emoji: '⚡', image: iconAdrenaline, effect: 'adrenaline', desc: '2x урон' },
    { id: 'shield',     name: 'ЩИТ',        emoji: '🛡️', image: iconShield,     effect: 'shield',     desc: 'Блок атаки' },
    { id: 'blind',      name: 'ОСЛЕПЛЕНИЕ', emoji: '✨', image: iconBlind,      effect: 'blind',      desc: 'Промах врага' },
    { id: 'rage',       name: 'ЯРОСТЬ',     emoji: '🔥', image: iconRage,       effect: 'rage',       desc: '-20 HP врагу' },
    { id: 'crit',       name: 'КРИТ',       emoji: '💀', image: iconCrit,       effect: 'crit',       desc: '-30 HP врагу' },
];

// ─── Module-level AI instances (NOT stored in Vuex) ──────────────────────────
let _ai1 = null;
let _ai2 = null;
let _fightLastUpdateAt = null;

// ─── Persistence helpers ──────────────────────────────────────────────────────
function saveFightState(state) {
    try {
        localStorage.setItem(FIGHT_STORAGE_KEY, JSON.stringify({
            playerModules:     state.playerModules,
            opponent:          state.opponent,
            liveHP1:           state.liveHP1,
            liveHP2:           state.liveHP2,
            roundNum:          state.roundNum,
            roundLog:          state.roundLog,
            playerModifiers:   state.playerModifiers,
            // Don't save active dice animation; reset to ready
            diceState:         { activeItem: null, cooldownLeft: state.diceState.cooldownLeft, ready: state.diceState.cooldownLeft <= 0 },
            coachAdvice:       state.coachAdvice,
            emergencyProtocol: state.emergencyProtocol,
            fightStats:        state.fightStats,
            fightPhase:        state.fightPhase,
            difficulty:        state.difficulty,
            xpEarned:          state.xpEarned,
            xpAwarded:         state.xpAwarded,
            lastUpdateAt:      _fightLastUpdateAt || Date.now(),
        }));
    } catch(e) { /* ignore */ }
}

function clearFightState() {
    localStorage.removeItem(FIGHT_STORAGE_KEY);
}

function loadFightState() {
    try {
        const s = localStorage.getItem(FIGHT_STORAGE_KEY);
        return s ? JSON.parse(s) : null;
    } catch(e) { return null; }
}

// ─── Internal round simulation (sync, no coach/dice/emergency side-effects) ───
function _simulateOneRound(state, commit) {
    if (state.liveHP1 <= 0 || state.liveHP2 <= 0 || state.fightPhase !== 'fighting') {
        commit('setFightPhase', 'results');
        return false;
    }
    const nextRound = state.roundNum + 1;
    if (nextRound > MAX_ROUNDS) {
        commit('setFightPhase', 'results');
        return false;
    }

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

    if (result.hp1After <= 0 || result.hp2After <= 0) {
        commit('setFightPhase', 'results');
        return false;
    }
    if (nextRound >= MAX_ROUNDS) {
        if (result.hp1After > result.hp2After)       commit('setLiveHP2', 0);
        else if (result.hp2After > result.hp1After)  commit('setLiveHP1', 0);
        commit('setFightPhase', 'results');
        return false;
    }
    return true;
}

// ─── State ───────────────────────────────────────────────────────────────────
const state = {
    playerModules: ['predator', 'analyst', 'ghost'],
    opponent: null,

    emergencyProtocol: { type: 'medkit', used: false },

    liveHP1:  MAX_HP,
    liveHP2:  MAX_HP,
    roundNum: 0,
    roundLog: [],

    playerModifiers: { attackMultiplier: 1, shieldActive: false, blindActive: false },
    diceState:       { activeItem: null, cooldownLeft: 0, ready: true },
    coachAdvice:     { used: false, active: false, action: null, roundsLeft: 0 },

    eventTitle:      null,
    eventTitleClass: '',
    eventImage:      null,

    fightPhase: 'idle',    // idle | preparation | fighting | coach | results
    difficulty: 'medium',

    fightStats: { totalDamageDealt: 0, totalDamageTaken: 0, dicePickedUp: 0, diceIgnored: 0 },

    xpEarned:  null,   // { speed, power, technique } — set when fight ends
    xpAwarded: false,  // true after progression/onFightEnd dispatched (prevent double-award)
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
    getEventImage:       (s) => s.eventImage,

    getCoachAdvice:       (s) => s.coachAdvice,
    getEmergencyProtocol: (s) => s.emergencyProtocol,
    getXpEarned:          (s) => s.xpEarned,
    getXpAwarded:         (s) => s.xpAwarded,

    getBuildDescription: (s) => {
        const names = s.playerModules
            .filter(id => id)
            .map(id => ARCHETYPES[id]?.nameRu || id);
        return names.join(' + ');
    },

    isBuildValid:   (s) => s.playerModules.every(m => m !== null),
    hasSavedFight:  ()  => !!loadFightState(),
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
    clearDice(s)       { s.diceState = { activeItem: null, cooldownLeft: 0, ready: true }; },

    setEventTitle(s, { title, cls = '', image = null }) {
        s.eventTitle      = title;
        s.eventTitleClass = cls;
        s.eventImage      = image;
    },
    clearEventTitle(s) {
        s.eventTitle      = null;
        s.eventTitleClass = '';
        s.eventImage      = null;
    },

    setCoachAdvice(s, v)  { s.coachAdvice = { ...s.coachAdvice, ...v }; },
    resetCoachAdvice(s)   { s.coachAdvice = { used: false, active: false, action: null, roundsLeft: 0 }; },

    setEmergencyProtocol(s, type) { s.emergencyProtocol.type = type; },
    setEmergencyUsed(s, used)     { s.emergencyProtocol.used = used; },

    addStats(s, delta) {
        s.fightStats = {
            totalDamageDealt: s.fightStats.totalDamageDealt + (delta.totalDamageDealt || 0),
            totalDamageTaken: s.fightStats.totalDamageTaken + (delta.totalDamageTaken || 0),
            dicePickedUp:     s.fightStats.dicePickedUp     + (delta.dicePickedUp     || 0),
            diceIgnored:      s.fightStats.diceIgnored      + (delta.diceIgnored      || 0),
        };
    },
    resetStats(s) {
        s.fightStats = { totalDamageDealt: 0, totalDamageTaken: 0, dicePickedUp: 0, diceIgnored: 0 };
    },

    setXpEarned(s, v)  { s.xpEarned  = v; },
    setXpAwarded(s, v) { s.xpAwarded = v; },
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

    /** Start a live fight: generate opponent, init AI, reset state, save to localStorage. */
    async startFight({ commit, state }) {
        if (!state.playerModules.every(m => m !== null)) return;

        const opponent = OpponentGenerator.generate(state.difficulty);
        commit('setOpponent', opponent);

        _ai1 = new ModuleAIStrategy(state.playerModules);
        _ai2 = new ModuleAIStrategy(opponent.modules);

        commit('setLiveHP1', MAX_HP);
        commit('setLiveHP2', MAX_HP);
        commit('setRoundNum', 0);
        commit('clearRoundLog');
        commit('resetPlayerModifiers');
        commit('clearDice');
        commit('clearEventTitle');
        commit('resetCoachAdvice');
        commit('setEmergencyUsed', false);
        commit('resetStats');
        commit('setXpEarned', null);
        commit('setXpAwarded', false);
        commit('setFightPhase', 'fighting');

        _fightLastUpdateAt = Date.now();
        saveFightState(state);

        await router.push('/fight');
    },

    /**
     * Compute and commit the next round (fully automatic).
     * AI selects actions for both fighters.
     */
    computeNextRound({ commit, state, dispatch }) {
        const continued = _simulateOneRound(state, commit);
        if (!continued) {
            _fightLastUpdateAt = Date.now();
            saveFightState(state);
            return;
        }

        // Check Emergency Protocol
        dispatch('checkEmergencyProtocol');

        // Tick dice cooldown
        if (state.diceState.cooldownLeft > 0) {
            const newCd = state.diceState.cooldownLeft - 1;
            commit('setDiceState', { cooldownLeft: newCd, ready: newCd <= 0 });
        }

        // Tick coach boost
        if (state.coachAdvice.active && state.coachAdvice.roundsLeft > 0) {
            const newLeft = state.coachAdvice.roundsLeft - 1;
            if (_ai1) _ai1.tickCoachBoost();
            if (newLeft <= 0) {
                commit('setCoachAdvice', { active: false, roundsLeft: 0, action: null });
            } else {
                commit('setCoachAdvice', { roundsLeft: newLeft });
            }
        }

        // Check coach advice trigger (once per fight, from round COACH_MIN_ROUND)
        if (!state.coachAdvice.used && state.roundNum >= COACH_MIN_ROUND && Math.random() < COACH_TRIGGER_CHANCE) {
            commit('setFightPhase', 'coach');
            _fightLastUpdateAt = Date.now();
            saveFightState(state);
            return;
        }

        _fightLastUpdateAt = Date.now();
        saveFightState(state);
    },

    // ── Emergency Protocol ─────────────────────────────────────────────────
    checkEmergencyProtocol({ commit, state }) {
        if (state.emergencyProtocol.used) return;

        const hpPercent = (state.liveHP1 / MAX_HP) * 100;
        const protocol  = state.emergencyProtocol;
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
            const PROTOCOL_IMAGES = { medkit: iconHeal, adrenaline: iconAdrenaline, shield: iconShield };
            commit('setEmergencyUsed', true);
            commit('setEventTitle', { title: 'ЭКСТРЕННЫЙ ПРОТОКОЛ', cls: 'event-emergency', image: PROTOCOL_IMAGES[protocol.type] });
        }
    },

    // ── Manual Dice ──────────────────────────────────────────────────────
    rollDiceManual({ commit, state }) {
        if (!state.diceState.ready || state.fightPhase !== 'fighting') return;

        const item = DICE_ITEMS[Math.floor(Math.random() * DICE_ITEMS.length)];
        commit('setDiceState', { activeItem: item, ready: false, cooldownLeft: DICE_COOLDOWN_ROUNDS });

        switch (item.effect) {
            case 'heal':
                commit('setLiveHP1', Math.min(MAX_HP, state.liveHP1 + 15));
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
        commit('setEventTitle', { title: `${item.name}!`, cls: 'event-dice-pickup', image: item.image });

        setTimeout(() => {
            commit('setDiceState', { activeItem: null });
        }, 1500);
    },

    // ── Coach Advice ──────────────────────────────────────────────────────
    applyCoachAdvice({ commit }, action) {
        if (_ai1) _ai1.setCoachBoost(action, COACH_BOOST_ROUNDS);
        commit('setCoachAdvice', { used: true, active: true, action, roundsLeft: COACH_BOOST_ROUNDS });
        commit('setFightPhase', 'fighting');
    },

    skipCoachAdvice({ commit }) {
        commit('setCoachAdvice', { used: true, active: false, action: null, roundsLeft: 0 });
        commit('setFightPhase', 'fighting');
    },

    // ── Fight persistence ─────────────────────────────────────────────────

    /**
     * Restore fight from localStorage (called on CardFightView mount).
     * Dosimulates rounds missed while away. Returns true if fight was restored.
     */
    initFromStorage({ commit, state }) {
        const saved = loadFightState();
        if (!saved) return false;
        if (saved.fightPhase === 'idle' || saved.fightPhase === 'preparation') {
            clearFightState();
            return false;
        }

        // Restore all persisted state
        commit('setPlayerModules', saved.playerModules);
        commit('setOpponent', saved.opponent);
        commit('setLiveHP1', saved.liveHP1);
        commit('setLiveHP2', saved.liveHP2);
        commit('setRoundNum', saved.roundNum);
        commit('clearRoundLog');
        (saved.roundLog || []).forEach(r => commit('addRoundToLog', r));
        commit('setPlayerModifiers', saved.playerModifiers);
        commit('setDiceState', saved.diceState);
        commit('setCoachAdvice', saved.coachAdvice);
        commit('setEmergencyProtocol', saved.emergencyProtocol.type);
        commit('setEmergencyUsed', saved.emergencyProtocol.used);
        commit('resetStats');
        if (saved.fightStats) commit('addStats', saved.fightStats);
        commit('setDifficulty', saved.difficulty);
        commit('setXpEarned', saved.xpEarned || null);
        commit('setXpAwarded', saved.xpAwarded || false);

        // Results phase: just restore UI, no need to recreate AI
        if (saved.fightPhase === 'results') {
            commit('setFightPhase', 'results');
            return true;
        }

        // Recreate AI instances
        _ai1 = new ModuleAIStrategy(saved.playerModules);
        _ai2 = new ModuleAIStrategy(saved.opponent.modules);

        // Re-apply coach boost if it was active
        if (saved.coachAdvice?.active && saved.coachAdvice?.action) {
            _ai1.setCoachBoost(saved.coachAdvice.action, saved.coachAdvice.roundsLeft);
        }

        // Coach phase: waiting for player input, just restore
        if (saved.fightPhase === 'coach') {
            commit('setFightPhase', 'coach');
            return true;
        }

        // Fighting phase: dosimulate rounds missed while away
        commit('setFightPhase', 'fighting');
        if (saved.lastUpdateAt) {
            const elapsed      = Date.now() - saved.lastUpdateAt;
            const missedRounds = Math.min(
                Math.floor(elapsed / ROUND_ANIMATION_MS),
                MAX_ROUNDS - saved.roundNum,
            );
            for (let i = 0; i < missedRounds && state.fightPhase === 'fighting'; i++) {
                _simulateOneRound(state, commit);
            }
        }

        _fightLastUpdateAt = Date.now();
        saveFightState(state);
        return true;
    },

    /**
     * Dosimulate rounds missed while the tab was backgrounded.
     * Called from CardFightView on visibilitychange.
     */
    resumeMissedRounds({ commit, state }) {
        if (state.fightPhase !== 'fighting' || !_fightLastUpdateAt || !_ai1 || !_ai2) return;

        const elapsed      = Date.now() - _fightLastUpdateAt;
        const missedRounds = Math.min(
            Math.floor(elapsed / ROUND_ANIMATION_MS),
            MAX_ROUNDS - state.roundNum,
        );
        if (missedRounds <= 0) return;

        for (let i = 0; i < missedRounds && state.fightPhase === 'fighting'; i++) {
            _simulateOneRound(state, commit);
        }
        _fightLastUpdateAt = Date.now();
        saveFightState(state);
    },

    // ── Navigation ────────────────────────────────────────────────────────
    async resetToPreparation({ commit }) {
        _ai1 = null;
        _ai2 = null;
        _fightLastUpdateAt = null;
        clearFightState();
        commit('clearRoundLog');
        commit('setOpponent', null);
        commit('setXpEarned', null);
        commit('setXpAwarded', false);
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
