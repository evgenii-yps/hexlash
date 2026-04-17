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
import { getStrategyModifiers } from '@/data/strategy.js';

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
            stakeLevel:        state.stakeLevel,
            strategyLevel:     state.strategyLevel,
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
    if (nextRound > TOTAL_ROUNDS) {
        commit('setFightPhase', 'results');
        return false;
    }

    // After MAX_ROUNDS (10), only enter Overdrive if both are alive
    if (nextRound > MAX_ROUNDS && state.liveHP1 > 0 && state.liveHP2 > 0) {
        // Overdrive rounds — dice/coach disabled, damage x2 handled by CombatEngine
    } else if (nextRound > MAX_ROUNDS) {
        // One is already dead — end fight
        commit('setFightPhase', 'results');
        return false;
    }

    const isOverdrive = nextRound > MAX_ROUNDS;

    // Phase 4.4: strategy modifiers (player AI behavior). Same instance used
    // for action selection (moduleWeights) and round resolution (damage/crit/dodge).
    const strategyMods = getStrategyModifiers(state.strategyLevel || 'balanced');

    const action1 = _ai1.selectAction(state.liveHP1, MAX_HP, isOverdrive, strategyMods.moduleWeights);
    const action2 = _ai2.selectAction(state.liveHP2, MAX_HP, isOverdrive);

    const moveInfo = CombatEngine.getMoveInfo(
        nextRound,
        state.playerDeck, state.playerCardLevels,
        state.opponentDeck, state.opponentCardLevels,
    );

    // In Overdrive, strip player modifiers (no dice effects carry over)
    const modsToUse = isOverdrive
        ? { attackMultiplier: 1, shieldActive: false, blindActive: false }
        : state.playerModifiers;

    const result = CombatEngine.resolveRoundLive(
        action1, action2,
        state.liveHP1, state.liveHP2,
        _ai1, _ai2,
        nextRound,
        modsToUse,
        moveInfo,
        state.strategyLevel || 'balanced',
    );

    commit('setLiveHP1', result.hp1After);
    commit('setLiveHP2', result.hp2After);
    commit('setRoundNum', nextRound);
    commit('addRoundToLog', result);
    const playerCrits = result.events.filter(e => e.fighter === 2 && e.type === 'crit').length;
    commit('addStats', { totalDamageDealt: result.damage2, totalDamageTaken: result.damage1, criticalHits: playerCrits });
    commit('resetPlayerModifiers');

    if (result.hp1After <= 0 || result.hp2After <= 0) {
        commit('setFightPhase', 'results');
        return false;
    }
    // After all TOTAL_ROUNDS: higher HP wins
    if (nextRound >= TOTAL_ROUNDS) {
        if (result.hp1After > result.hp2After) {
            commit('addStats', { totalDamageDealt: result.hp2After });
            commit('setLiveHP2', 0);
        } else if (result.hp2After > result.hp1After) {
            commit('addStats', { totalDamageTaken: result.hp1After });
            commit('setLiveHP1', 0);
        }
        commit('setFightPhase', 'results');
        return false;
    }
    return true;
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
    xpAwarded: false,  // true after XP display (agent XP awarded via backend, not progressionState)

    stakeLevel: null,  // Phase 4.3: 'low' | 'medium' | 'high' | null — PvE stake applied to this fight
    strategyLevel: 'balanced',  // Phase 4.4: 'aggressive' | 'balanced' | 'defensive' — PvE player AI behavior
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

    getStakeLevel:        (s) => s.stakeLevel,
    getStrategyLevel:     (s) => s.strategyLevel,

    getBuildDescription: (s) => {
        const names = s.playerModules
            .filter(id => id)
            .map(id => t.value.arena.archetypes[id] || ARCHETYPES[id]?.name || id);
        return names.join(' + ');
    },

    isOverdrive:    (s) => s.roundNum > MAX_ROUNDS,
    isBuildValid:   (s) => s.playerModules.every(m => m !== null),
    hasSavedFight:  ()  => !!loadFightState(),
};

// ─── Mutations ────────────────────────────────────────────────────────────────
const mutations = {
    setPlayerModules(s, modules) { s.playerModules = modules; },
    setOpponent(s, v)            { s.opponent = v; },
    setPlayerDeck(s, { deck, cardLevels }) { s.playerDeck = deck; s.playerCardLevels = cardLevels; },
    setOpponentDeck(s, { deck, cardLevels }) { s.opponentDeck = deck; s.opponentCardLevels = cardLevels; },
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
            criticalHits:     s.fightStats.criticalHits     + (delta.criticalHits     || 0),
        };
    },
    resetStats(s) {
        s.fightStats = { totalDamageDealt: 0, totalDamageTaken: 0, dicePickedUp: 0, diceIgnored: 0, criticalHits: 0 };
    },

    setXpEarned(s, v)  { s.xpEarned  = v; },
    setXpAwarded(s, v) { s.xpAwarded = v; },

    setStakeLevel(s, v) { s.stakeLevel = v; },
    setStrategyLevel(s, v) { s.strategyLevel = v; },
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

    setPlayerModules({ commit, dispatch }, modules) {
        commit('setPlayerModules', modules);
        localStorage.setItem(MODULES_STORAGE_KEY, JSON.stringify(modules));
        dispatch('progressionState/syncProgression', null, { root: true });
    },

    setEmergencyProtocol({ commit }, type) {
        commit('setEmergencyProtocol', type);
    },

    /** Start a live fight: generate opponent, init AI, reset state, save to localStorage. */
    async startFight({ commit, state, rootState, rootGetters }, options = {}) {
        // Load active agent data for combat
        const agent = rootGetters['agent/activeAgent'];
        if (!agent) return;

        const agentProg = agent.progression || {};
        const agentDeck = Array.isArray(agentProg.deck) ? agentProg.deck : [];
        const agentMoves = Array.isArray(agentProg.moves) ? agentProg.moves : [];
        const agentModules = [agent.primaryModule, agent.secondaryModule, agent.tertiaryModule].filter(Boolean);
        if (agentModules.length < 3) return; // Need all 3 modules

        // Set modules from active agent
        commit('setPlayerModules', agentModules);

        // Build card levels from agent's move list [{moveId, level}]
        const playerCardLevels = {};
        for (const m of agentMoves) {
          if (m.moveId && agentDeck.includes(m.moveId)) {
            playerCardLevels[m.moveId] = m.level || 1;
          }
        }

        // Calculate power for opponent scaling
        const progressionState = rootState.progression;
        const playerFighter = buildPlayerFighter(progressionState, agentModules);
        const playerPower = calculatePowerRating(playerFighter);

        const opponent = OpponentGenerator.generate(state.difficulty, playerPower);
        commit('setOpponent', opponent);

        commit('setPlayerDeck', { deck: agentDeck, cardLevels: playerCardLevels });
        commit('setOpponentDeck', {
            deck: opponent.deck || [],
            cardLevels: opponent.cardLevels || {},
        });

        _ai1 = new ModuleAIStrategy(agentModules);
        _ai2 = new ModuleAIStrategy(opponent.modules);

        // Phase 4.4: apply strategy hpMultiplier to player only
        const strategyMods = getStrategyModifiers(state.strategyLevel || 'balanced');
        commit('setLiveHP1', Math.round(MAX_HP * strategyMods.hpMultiplier));
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

        await router.push(options.targetRoute || '/fight');
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

        const isOverdrive = state.roundNum > MAX_ROUNDS;

        // In Overdrive: no emergency, no dice, no coach
        if (!isOverdrive) {
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
            commit('setEventTitle', { title: t.value.fight.lblEventEmergency, cls: 'event-emergency', image: PROTOCOL_IMAGES[protocol.type] });
        }
    },

    // ── Manual Dice ──────────────────────────────────────────────────────
    rollDiceManual({ commit, state }) {
        if (!state.diceState.ready || state.fightPhase !== 'fighting') return;
        // Dice disabled in Overdrive
        if (state.roundNum > MAX_ROUNDS) return;

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
                commit('addStats', { totalDamageDealt: 20 });
                if (hp2 <= 0) commit('setFightPhase', 'results');
                break;
            }
            case 'crit': {
                const hp2 = state.liveHP2 - 30;
                commit('setLiveHP2', hp2);
                commit('addStats', { totalDamageDealt: 30 });
                if (hp2 <= 0) commit('setFightPhase', 'results');
                break;
            }
        }

        commit('addStats', { dicePickedUp: 1 });

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
        commit('setPlayerDeck', { deck: saved.playerDeck || [], cardLevels: saved.playerCardLevels || {} });
        commit('setOpponentDeck', { deck: saved.opponentDeck || [], cardLevels: saved.opponentCardLevels || {} });
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
        commit('setStakeLevel', saved.stakeLevel || null);
        commit('setStrategyLevel', saved.strategyLevel || 'balanced');

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
                TOTAL_ROUNDS - saved.roundNum,
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
            TOTAL_ROUNDS - state.roundNum,
        );
        if (missedRounds <= 0) return;

        for (let i = 0; i < missedRounds && state.fightPhase === 'fighting'; i++) {
            _simulateOneRound(state, commit);
        }
        _fightLastUpdateAt = Date.now();
        saveFightState(state);
    },

    // ── Navigation ────────────────────────────────────────────────────────

    clearSavedFight() {
        clearFightState();
    },

    async resetToPreparation({ commit }) {
        _ai1 = null;
        _ai2 = null;
        _fightLastUpdateAt = null;
        clearFightState();
        commit('clearRoundLog');
        commit('setOpponent', null);
        commit('setXpEarned', null);
        commit('setXpAwarded', false);
        commit('setStakeLevel', null);
        commit('setStrategyLevel', 'balanced');
        commit('setFightPhase', 'preparation');
        await router.push('/arena');
    },

    async fightAgain({ dispatch }, options = {}) {
        await dispatch('startFight', options);
    },

};

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};
