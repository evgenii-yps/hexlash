import { OpponentGenerator } from '@/core/engine/opponentGenerator.js';
import { CombatEngine } from '@/core/engine/combatEngine.js';
import { ModuleAIStrategy } from '@/core/engine/aiStrategy.js';
import { calculatePowerRating, buildPlayerFighter } from '@/utils/powerRating.js';
import {
    MAX_HP, MAX_ROUNDS, ROUND_ANIMATION_MS, COUNTDOWN,
    DICE_COOLDOWN_ROUNDS, EMERGENCY_HP_THRESHOLD,
    COACH_MIN_ROUND, COACH_TRIGGER_CHANCE, COACH_BOOST_ROUNDS,
    AUTO_FIGHT_MIN_INTERVAL, AUTO_FIGHT_MAX_INTERVAL,
    AUTO_FIGHT_MAX_PER_DAY, AUTO_FIGHT_MAX_PER_SESSION,
} from '@/core/constants.js';

const STORAGE_KEY = 'hexlash_autofight_state';
const HISTORY_KEY = 'hexlash_autofight_history';

// ─── Persistence ────────────────────────────────────────────────────────────
function saveState(state) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            enabled: state.enabled,
            enabledAt: state.enabledAt,
            nextFightAt: state.nextFightAt,
            stoppingAfterCurrent: state.stoppingAfterCurrent,
            difficulty: state.difficulty,
            fightsToday: state.fightsToday,
            wins: state.wins,
            losses: state.losses,
            draws: state.draws,
            totalExpGained: state.totalExpGained,
            sessionFights: state.sessionFights,
        }));
    } catch (e) { /* ignore */ }
}

function loadState() {
    try {
        const s = localStorage.getItem(STORAGE_KEY);
        return s ? JSON.parse(s) : null;
    } catch (e) { return null; }
}

function saveHistory(log) {
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(log.slice(-100)));
    } catch (e) { /* ignore */ }
}

function loadHistory() {
    try {
        const s = localStorage.getItem(HISTORY_KEY);
        return s ? JSON.parse(s) : [];
    } catch (e) { return []; }
}

function getRandomInterval() {
    return Math.random() * (AUTO_FIGHT_MAX_INTERVAL - AUTO_FIGHT_MIN_INTERVAL) + AUTO_FIGHT_MIN_INTERVAL;
}

// ─── Fast offline fight simulation ──────────────────────────────────────────
function simulateFullFight(playerModules, difficulty, playerPower = null) {
    const opponent = OpponentGenerator.generate(difficulty, playerPower);
    const ai1 = new ModuleAIStrategy(playerModules);
    const ai2 = new ModuleAIStrategy(opponent.modules);

    let hp1 = MAX_HP;
    let hp2 = MAX_HP;
    let roundNum = 0;
    const playerMods = { attackMultiplier: 1, shieldActive: false, blindActive: false };
    let emergencyUsed = false;
    let coachUsed = false;
    const roundLog = [];

    while (roundNum < MAX_ROUNDS && hp1 > 0 && hp2 > 0) {
        roundNum++;

        const action1 = ai1.selectAction(hp1, MAX_HP);
        const action2 = ai2.selectAction(hp2, MAX_HP);

        const result = CombatEngine.resolveRoundLive(
            action1, action2, hp1, hp2, ai1, ai2, roundNum, playerMods,
        );

        hp1 = result.hp1After;
        hp2 = result.hp2After;
        roundLog.push(result);

        // Reset mods each round
        playerMods.attackMultiplier = 1;
        playerMods.shieldActive = false;
        playerMods.blindActive = false;

        // Emergency protocol (medkit) — auto uses medkit
        if (!emergencyUsed && (hp1 / MAX_HP) * 100 < EMERGENCY_HP_THRESHOLD) {
            hp1 = Math.min(MAX_HP, hp1 + 25);
            emergencyUsed = true;
        }

        // Coach advice — auto picks attack if in danger, else position
        if (!coachUsed && roundNum >= COACH_MIN_ROUND && Math.random() < COACH_TRIGGER_CHANCE) {
            const coachAction = hp1 < 50 ? 'defense' : 'attack';
            ai1.setCoachBoost(coachAction, COACH_BOOST_ROUNDS);
            coachUsed = true;
        }

        if (ai1._coachBoostRounds > 0) {
            ai1.tickCoachBoost();
        }

        if (hp1 <= 0 || hp2 <= 0) break;
    }

    // Tie-break at max rounds
    if (roundNum >= MAX_ROUNDS && hp1 > 0 && hp2 > 0) {
        if (hp1 > hp2) hp2 = 0;
        else if (hp2 > hp1) hp1 = 0;
    }

    let fightResult;
    if (hp1 <= 0 && hp2 <= 0) fightResult = 'draw';
    else if (hp1 > hp2) fightResult = 'win';
    else if (hp2 > hp1) fightResult = 'lose';
    else fightResult = 'draw';

    return {
        opponent,
        result: fightResult,
        rounds: roundNum,
        hp1Final: Math.max(0, hp1),
        hp2Final: Math.max(0, hp2),
        roundLog,
    };
}

// ─── State ──────────────────────────────────────────────────────────────────
const state = {
    enabled: false,
    enabledAt: null,
    nextFightAt: null,
    stoppingAfterCurrent: false,
    difficulty: 'medium',

    // Session stats
    fightsToday: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    totalExpGained: { speed: 0, power: 0, technique: 0 },
    sessionFights: 0,

    // Fight log (persisted separately)
    fightLog: [],

    // Current live auto fight (for spectating)
    liveFight: null, // { id, opponent, status, startedAt, hp1, hp2, round, roundLog }
};

// ─── Getters ────────────────────────────────────────────────────────────────
const getters = {
    isEnabled: (s) => s.enabled,
    getNextFightAt: (s) => s.nextFightAt,
    getFightsToday: (s) => s.fightsToday,
    getWins: (s) => s.wins,
    getLosses: (s) => s.losses,
    getDraws: (s) => s.draws,
    getTotalExpGained: (s) => s.totalExpGained,
    getFightLog: (s) => s.fightLog,
    getLiveFight: (s) => s.liveFight,
    getDifficulty: (s) => s.difficulty,
    getSessionFights: (s) => s.sessionFights,
    isStoppingAfterCurrent: (s) => s.stoppingAfterCurrent,

    canStartAutoFight: (s) => {
        if (s.fightsToday >= AUTO_FIGHT_MAX_PER_DAY) return { allowed: false, reason: 'dailyLimit' };
        if (s.sessionFights >= AUTO_FIGHT_MAX_PER_SESSION) return { allowed: false, reason: 'sessionLimit' };
        return { allowed: true };
    },

    getTimeUntilNextFight: (s) => {
        if (!s.enabled || !s.nextFightAt) return null;
        const diff = s.nextFightAt - Date.now();
        return diff > 0 ? diff : 0;
    },
};

// ─── Mutations ──────────────────────────────────────────────────────────────
const mutations = {
    setEnabled(s, v) { s.enabled = v; },
    setEnabledAt(s, v) { s.enabledAt = v; },
    setNextFightAt(s, v) { s.nextFightAt = v; },
    setStoppingAfterCurrent(s, v) { s.stoppingAfterCurrent = v; },
    setDifficulty(s, v) { s.difficulty = v; },
    setFightsToday(s, v) { s.fightsToday = v; },
    setWins(s, v) { s.wins = v; },
    setLosses(s, v) { s.losses = v; },
    setDraws(s, v) { s.draws = v; },
    setTotalExpGained(s, v) { s.totalExpGained = v; },
    setSessionFights(s, v) { s.sessionFights = v; },
    setFightLog(s, v) { s.fightLog = v; },
    setLiveFight(s, v) { s.liveFight = v; },

    addFightToLog(s, entry) {
        s.fightLog.unshift(entry);
        if (s.fightLog.length > 100) s.fightLog.pop();
    },

    incrementStats(s, result) {
        s.fightsToday++;
        s.sessionFights++;
        if (result === 'win') s.wins++;
        else if (result === 'lose') s.losses++;
        else s.draws++;
    },

    addExp(s, exp) {
        s.totalExpGained = {
            speed: s.totalExpGained.speed + (exp.speed || 0),
            power: s.totalExpGained.power + (exp.power || 0),
            technique: s.totalExpGained.technique + (exp.technique || 0),
        };
    },

    resetState(s) {
        s.enabled = false;
        s.enabledAt = null;
        s.nextFightAt = null;
        s.stoppingAfterCurrent = false;
        s.fightsToday = 0;
        s.wins = 0;
        s.losses = 0;
        s.draws = 0;
        s.totalExpGained = { speed: 0, power: 0, technique: 0 };
        s.sessionFights = 0;
        s.liveFight = null;
    },
};

// ─── Actions ────────────────────────────────────────────────────────────────
const actions = {

    /** Initialize auto fight state from localStorage. */
    init({ commit }) {
        const saved = loadState();
        if (saved) {
            commit('setEnabled', saved.enabled);
            commit('setEnabledAt', saved.enabledAt);
            commit('setNextFightAt', saved.nextFightAt);
            commit('setStoppingAfterCurrent', saved.stoppingAfterCurrent || false);
            commit('setDifficulty', saved.difficulty || 'medium');
            commit('setFightsToday', saved.fightsToday || 0);
            commit('setWins', saved.wins || 0);
            commit('setLosses', saved.losses || 0);
            commit('setDraws', saved.draws || 0);
            commit('setTotalExpGained', saved.totalExpGained || { speed: 0, power: 0, technique: 0 });
            commit('setSessionFights', saved.sessionFights || 0);
        }
        commit('setFightLog', loadHistory());
    },

    /** Enable auto fight mode. */
    enable({ commit, state, rootGetters }) {
        const modules = rootGetters['fight/getPlayerModules'];
        if (!modules || !modules.every(m => m !== null)) return false;

        commit('setEnabled', true);
        commit('setEnabledAt', Date.now());
        commit('setNextFightAt', Date.now() + getRandomInterval());
        commit('setStoppingAfterCurrent', false);
        saveState(state);

        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        return true;
    },

    /** Disable auto fight mode. */
    disable({ commit, state }) {
        if (state.liveFight) {
            commit('setStoppingAfterCurrent', true);
        } else {
            commit('setEnabled', false);
            commit('setNextFightAt', null);
        }
        saveState(state);
    },

    /** Force stop (even during fight). */
    forceStop({ commit, state }) {
        commit('setEnabled', false);
        commit('setNextFightAt', null);
        commit('setStoppingAfterCurrent', false);
        commit('setLiveFight', null);
        saveState(state);
    },

    /**
     * Check and run any pending auto fights.
     * Called on app load / visibility change.
     * Simulates missed fights instantly and schedules next one.
     */
    checkAndRunPending({ commit, state, dispatch, rootGetters, rootState }) {
        if (!state.enabled || state.stoppingAfterCurrent) return;

        const now = Date.now();
        const modules = rootGetters['fight/getPlayerModules'];
        if (!modules || !modules.every(m => m !== null)) return;

        // Check if there's an active manual fight
        const fightPhase = rootGetters['fight/getFightPhase'];
        if (fightPhase === 'fighting' || fightPhase === 'coach') return;

        // Calculate player power for matchmaking
        const progressionState = rootState.progression;
        const playerFighter = buildPlayerFighter(progressionState, modules);
        const playerPower = calculatePowerRating(playerFighter);

        // Simulate missed fights
        let nextAt = state.nextFightAt;
        while (nextAt && now >= nextAt && state.fightsToday < AUTO_FIGHT_MAX_PER_DAY && state.sessionFights < AUTO_FIGHT_MAX_PER_SESSION) {
            const fightData = simulateFullFight(modules, state.difficulty, playerPower);
            const expGain = fightData.result === 'win' ? 10 : 5;
            const exp = { speed: Math.floor(expGain / 3), power: Math.floor(expGain / 3), technique: expGain - 2 * Math.floor(expGain / 3) };

            const logEntry = {
                id: 'autofight_' + nextAt,
                timestamp: nextAt,
                opponent: fightData.opponent.name,
                opponentSkin: fightData.opponent.skin,
                result: fightData.result,
                rounds: fightData.rounds,
                hp1Final: fightData.hp1Final,
                hp2Final: fightData.hp2Final,
                expGained: exp,
            };

            commit('addFightToLog', logEntry);
            commit('incrementStats', fightData.result);
            commit('addExp', exp);

            // Award XP to progression
            dispatch('progression/onFightEnd', {
                result: fightData.result === 'win' ? 'win' : 'lose',
                deck: rootGetters['progression/getDeck'],
            }, { root: true });

            // Send notification
            dispatch('sendNotification', { fight: logEntry });

            nextAt = nextAt + getRandomInterval();
        }

        commit('setNextFightAt', nextAt);
        saveState(state);
        saveHistory(state.fightLog);
    },

    /**
     * Run a single auto fight live (player is watching).
     * This uses the existing cardFightState to run the fight.
     */
    async startLiveFight({ commit, state, dispatch, rootGetters }) {
        if (!state.enabled) return;

        const canStart = rootGetters['autoFight/canStartAutoFight'];
        if (!canStart.allowed) {
            dispatch('disable');
            return;
        }

        // Start a real fight through the fight module
        await dispatch('fight/startFight', null, { root: true });
    },

    /**
     * Called when a fight ends (from CardFightView watcher).
     * If auto fight is enabled, log the result and schedule next.
     */
    onFightEnd({ commit, state, dispatch, rootGetters }, { result, rounds, hp1, hp2 }) {
        if (!state.enabled) return;

        const opponent = rootGetters['fight/getOpponent'];
        const expGain = result === 'win' ? 10 : 5;
        const exp = { speed: Math.floor(expGain / 3), power: Math.floor(expGain / 3), technique: expGain - 2 * Math.floor(expGain / 3) };

        const logEntry = {
            id: 'autofight_' + Date.now(),
            timestamp: Date.now(),
            opponent: opponent?.name || 'Unknown',
            opponentSkin: opponent?.skin || 'skin_m_1.png',
            result,
            rounds,
            hp1Final: hp1,
            hp2Final: hp2,
            expGained: exp,
        };

        commit('addFightToLog', logEntry);
        commit('incrementStats', result);
        commit('addExp', exp);

        if (state.stoppingAfterCurrent) {
            commit('setEnabled', false);
            commit('setNextFightAt', null);
            commit('setStoppingAfterCurrent', false);
        } else {
            commit('setNextFightAt', Date.now() + getRandomInterval());
        }

        saveState(state);
        saveHistory(state.fightLog);

        dispatch('sendNotification', { fight: logEntry });
    },

    /** Send push notification for fight result. */
    sendNotification(_, { fight }) {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;
        try {
            const body = fight.result === 'win'
                ? `Victory vs ${fight.opponent}! +${Object.values(fight.expGained).reduce((a, b) => a + b, 0)} XP`
                : fight.result === 'lose'
                    ? `Defeat vs ${fight.opponent}. +${Object.values(fight.expGained).reduce((a, b) => a + b, 0)} XP`
                    : `Draw vs ${fight.opponent}. +${Object.values(fight.expGained).reduce((a, b) => a + b, 0)} XP`;

            new Notification('Hexlash Auto Fight', {
                body,
                icon: '/favicon.ico',
                tag: 'autofight-' + fight.id,
            });
        } catch (e) { /* ignore */ }
    },


    /** Clear fight history. */
    clearHistory({ commit }) {
        commit('setFightLog', []);
        saveHistory([]);
    },
};

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};
