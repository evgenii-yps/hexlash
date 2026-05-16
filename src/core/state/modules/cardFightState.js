import { CombatEngine } from '@/core/engine/combatEngine.js';
import { ModuleAIStrategy } from '@/core/engine/aiStrategy.js';
import { OpponentGenerator } from '@/core/engine/opponentGenerator.js';
import { ARCHETYPES } from '@/core/data/archetypes.js';
import { calculatePowerRating, buildPlayerFighter } from '@/utils/powerRating.js';
import { t } from '@/locales/index.js';
import router from '@/router/index.js';
import { MAX_HP, MAX_ROUNDS, TOTAL_ROUNDS, DICE_COOLDOWN_ROUNDS, EMERGENCY_HP_THRESHOLD, COACH_MIN_ROUND, COACH_TRIGGER_CHANCE, COACH_BOOST_ROUNDS, ROUND_ANIMATION_MS } from '@/core/constants.js';
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
    { id: 'heal',       emoji: '💊', image: iconHeal,       effect: 'heal' },
    { id: 'adrenaline', emoji: '⚡', image: iconAdrenaline, effect: 'adrenaline' },
    { id: 'shield',     emoji: '🛡️', image: iconShield,     effect: 'shield' },
    { id: 'blind',      emoji: '✨', image: iconBlind,      effect: 'blind' },
    { id: 'rage',       emoji: '🔥', image: iconRage,       effect: 'rage' },
    { id: 'crit',       emoji: '💀', image: iconCrit,       effect: 'crit' },
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
            playerDeck:        state.playerDeck,
            playerCardLevels:  state.playerCardLevels,
            opponentDeck:      state.opponentDeck,
            opponentCardLevels: state.opponentCardLevels,
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

// ─── State ───────────────────────────────────────────────────────────────────
const state = {
    playerModules: ['predator', 'analyst', 'ghost'],
    opponent: null,

    // Deck data for move-based combat
    playerDeck: [],         // array of move IDs
    playerCardLevels: {},   // { moveId: level }
    opponentDeck: [],
    opponentCardLevels: {},

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

    fightStats: { totalDamageDealt: 0, totalDamageTaken: 0, dicePickedUp: 0, diceIgnored: 0, criticalHits: 0 },

    xpEarned:  null,   // { speed, power, technique } — set when fight ends
    xpAwarded: false,  // true after XP display (Captain XP persisted by backend)
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
            .map(id => t.value.arena.archetypes[id] || ARCHETYPES[id]?.name || id);
        return names.join(' + ');
    },

    isOverdrive:    (s) => s.roundNum > MAX_ROUNDS,
    isBuildValid:   (s) => s.playerModules.every(m => m !== null),
};

// ─── Mutations ────────────────────────────────────────────────────────────────
const mutations = {
    setPlayerModules(s, modules) { s.playerModules = modules; },
    setOpponent(s, v)            { s.opponent = v; },
    setPlayerDeck(s, { deck, cardLevels }) { s.playerDeck = deck; s.playerCardLevels = cardLevels; },
    setOpponentDeck(s, { deck, cardLevels }) { s.opponentDeck = deck; s.opponentCardLevels = cardLevels; },
    setFightPhase(s, v)          { s.fightPhase = v; },

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
            criticalHits:     s.fightStats.criticalHits     + (delta.criticalHits     || 0),
        };
    },
    resetStats(s) {
        s.fightStats = { totalDamageDealt: 0, totalDamageTaken: 0, dicePickedUp: 0, diceIgnored: 0, criticalHits: 0 };
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
    async startFight({ commit, state, rootState, rootGetters }) {
        // Load Captain's data for combat
        const captain = rootGetters['agent/currentCaptain'];
        if (!captain) return;

        const captainProg = captain.progression || {};
        const captainDeck = Array.isArray(captainProg.deck) ? captainProg.deck : [];
        const captainMoves = Array.isArray(captainProg.moves) ? captainProg.moves : [];
        const captainModules = [captain.primaryModule, captain.secondaryModule, captain.tertiaryModule].filter(Boolean);
        if (captainModules.length < 3) return; // Need all 3 modules

        // Set modules from Captain
        commit('setPlayerModules', captainModules);

        // Build card levels from Captain's move list [{moveId, level}]
        const playerCardLevels = {};
        for (const m of captainMoves) {
          if (m.moveId && captainDeck.includes(m.moveId)) {
            playerCardLevels[m.moveId] = m.level || 1;
          }
        }

        // Calculate power for opponent scaling.
        // Phase 7-pre-2 Part B cascade: progression module retired, so
        // rootState.progression is undefined. buildPlayerFighter handles
        // empty {} via its own defaults (.deck || [], .moves || {}).
        const progressionState = rootState.progression || {};
        const playerFighter = buildPlayerFighter(progressionState, captainModules);
        const playerPower = calculatePowerRating(playerFighter);

        const opponent = OpponentGenerator.generate(state.difficulty, playerPower);
        commit('setOpponent', opponent);

        commit('setPlayerDeck', { deck: captainDeck, cardLevels: playerCardLevels });
        commit('setOpponentDeck', {
            deck: opponent.deck || [],
            cardLevels: opponent.cardLevels || {},
        });

        _ai1 = new ModuleAIStrategy(captainModules);
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
            commit('setEventTitle', { title: t.value.fight.lblEventEmergency, cls: 'event-emergency', image: PROTOCOL_IMAGES[protocol.type] });
        }
    },

};

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};
