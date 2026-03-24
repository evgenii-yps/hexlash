import { OpponentGenerator } from '@/core/engine/opponentGenerator.js';
import { CombatEngine } from '@/core/engine/combatEngine.js';
import { ModuleAIStrategy } from '@/core/engine/aiStrategy.js';
import { calculatePowerRating, buildPlayerFighter } from '@/utils/powerRating.js';
import {
    MAX_HP, MAX_ROUNDS, TOTAL_ROUNDS, ROUND_ANIMATION_MS, COUNTDOWN,
    DICE_COOLDOWN_ROUNDS, EMERGENCY_HP_THRESHOLD,
    COACH_MIN_ROUND, COACH_TRIGGER_CHANCE, COACH_BOOST_ROUNDS,
    AUTO_FIGHT_MIN_INTERVAL, AUTO_FIGHT_MAX_INTERVAL,
    AUTO_FIGHT_MAX_PER_DAY, AUTO_FIGHT_MAX_PER_SESSION,
} from '@/core/constants.js';
import apiClient from '@/core/api/apiClient.js';

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
            lastFightDate: state.lastFightDate,
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

function getTodayDate() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`; // Local date "YYYY-MM-DD"
}

// ─── Dice effects for auto fight simulation ────────────────────────────────
const DICE_EFFECTS = ['heal', 'adrenaline', 'shield', 'blind', 'rage', 'crit'];

// ─── Fast offline fight simulation ──────────────────────────────────────────
function simulateFullFight(playerModules, difficulty, playerPower = null, playerDeck = null, playerCardLevels = null) {
    const opponent = OpponentGenerator.generate(difficulty, playerPower);
    const ai1 = new ModuleAIStrategy(playerModules);
    const ai2 = new ModuleAIStrategy(opponent.modules);

    let hp1 = MAX_HP;
    let hp2 = MAX_HP;
    let roundNum = 0;
    const playerMods = { attackMultiplier: 1, shieldActive: false, blindActive: false };
    let emergencyUsed = false;
    let coachUsed = false;
    let coachChoice = null;
    let diceUsed = false;
    let diceEffect = null;
    let diceCooldown = 0;
    const roundLog = [];

    while (roundNum < TOTAL_ROUNDS && hp1 > 0 && hp2 > 0) {
        roundNum++;

        // After MAX_ROUNDS, only continue into Overdrive if both alive
        if (roundNum > MAX_ROUNDS && (hp1 <= 0 || hp2 <= 0)) break;

        const isOverdrive = roundNum > MAX_ROUNDS;

        const action1 = ai1.selectAction(hp1, MAX_HP, isOverdrive);
        const action2 = ai2.selectAction(hp2, MAX_HP, isOverdrive);

        const moveInfo = CombatEngine.getMoveInfo(
            roundNum,
            playerDeck, playerCardLevels,
            opponent.deck || [], opponent.cardLevels || {},
        );

        // In Overdrive: no dice effects (clear mods)
        const modsToUse = isOverdrive
            ? { attackMultiplier: 1, shieldActive: false, blindActive: false }
            : playerMods;

        const result = CombatEngine.resolveRoundLive(
            action1, action2, hp1, hp2, ai1, ai2, roundNum, modsToUse, moveInfo,
        );

        hp1 = result.hp1After;
        hp2 = result.hp2After;
        roundLog.push(result);

        // Reset mods each round
        playerMods.attackMultiplier = 1;
        playerMods.shieldActive = false;
        playerMods.blindActive = false;

        // In Overdrive: no emergency, no coach, no dice
        if (!isOverdrive) {
            // Dice simulation — available after round 1, with cooldown
            if (diceCooldown > 0) diceCooldown--;
            if (!diceUsed && roundNum > 1 && diceCooldown === 0 && Math.random() < 0.4) {
                diceEffect = DICE_EFFECTS[Math.floor(Math.random() * DICE_EFFECTS.length)];
                diceUsed = true;
                diceCooldown = DICE_COOLDOWN_ROUNDS;

                switch (diceEffect) {
                    case 'heal':
                        hp1 = Math.min(MAX_HP, hp1 + 15);
                        break;
                    case 'adrenaline':
                        playerMods.attackMultiplier = 2;
                        break;
                    case 'shield':
                        playerMods.shieldActive = true;
                        break;
                    case 'blind':
                        playerMods.blindActive = true;
                        break;
                    case 'rage':
                        hp1 = Math.max(1, hp1 - 20);
                        playerMods.attackMultiplier = 2;
                        break;
                    case 'crit':
                        hp2 = Math.max(0, hp2 - 30);
                        break;
                }
            }

            // Emergency protocol (medkit) — auto uses medkit
            if (!emergencyUsed && (hp1 / MAX_HP) * 100 < EMERGENCY_HP_THRESHOLD) {
                hp1 = Math.min(MAX_HP, hp1 + 25);
                emergencyUsed = true;
            }

            // Coach advice — auto picks attack if in danger, else position
            if (!coachUsed && roundNum >= COACH_MIN_ROUND && Math.random() < COACH_TRIGGER_CHANCE) {
                coachChoice = hp1 < 50 ? 'defense' : 'attack';
                ai1.setCoachBoost(coachChoice, COACH_BOOST_ROUNDS);
                coachUsed = true;
            }

            if (ai1._coachBoostRounds > 0) {
                ai1.tickCoachBoost();
            }
        }

        if (hp1 <= 0 || hp2 <= 0) break;
    }

    // Tie-break at max total rounds
    if (roundNum >= TOTAL_ROUNDS && hp1 > 0 && hp2 > 0) {
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
        playerModules,
        diceUsed,
        diceEffect,
        coachUsed,
        coachChoice,
        emergencyUsed,
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
    lastFightDate: null, // YYYY-MM-DD string for daily reset
    wins: 0,
    losses: 0,
    draws: 0,
    totalExpGained: 0,
    sessionFights: 0,

    // Fight log (persisted separately)
    fightLog: [],

    // Current live auto fight (for spectating)
    liveFight: null, // { id, opponent, status, startedAt, hp1, hp2, round, roundLog }

    // AI Analysis
    aiAnalysis: null,
    aiAnalysisLoading: false,
    aiAnalysisError: false,
    aiAnalysisPeriod: 'all',
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

    getAiAnalysis: (s) => s.aiAnalysis,
    getAiAnalysisLoading: (s) => s.aiAnalysisLoading,
    getAiAnalysisError: (s) => s.aiAnalysisError,
    getAiAnalysisPeriod: (s) => s.aiAnalysisPeriod,

    fightsForPeriod: (s) => {
        const log = s.fightLog;
        switch (s.aiAnalysisPeriod) {
            case 'last_5': return log.slice(0, 5);
            case 'last_10': return log.slice(0, 10);
            default: return log;
        }
    },

    canAnalyze: (s) => s.fightLog.length > 0,

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
    setLastFightDate(s, v) { s.lastFightDate = v; },
    setWins(s, v) { s.wins = v; },
    setLosses(s, v) { s.losses = v; },
    setDraws(s, v) { s.draws = v; },
    setTotalExpGained(s, v) { s.totalExpGained = v; },
    setSessionFights(s, v) { s.sessionFights = v; },
    setFightLog(s, v) { s.fightLog = v; },
    setLiveFight(s, v) { s.liveFight = v; },
    setAiAnalysis(s, v) { s.aiAnalysis = v; },
    setAiAnalysisLoading(s, v) { s.aiAnalysisLoading = v; },
    setAiAnalysisError(s, v) { s.aiAnalysisError = v; },
    setAiAnalysisPeriod(s, v) { s.aiAnalysisPeriod = v; },

    addFightToLog(s, entry) {
        s.fightLog.unshift(entry);
        if (s.fightLog.length > 100) s.fightLog.pop();
    },

    incrementStats(s, result) {
        s.fightsToday++;
        s.sessionFights++;
        s.lastFightDate = getTodayDate();
        if (result === 'win') s.wins++;
        else if (result === 'lose') s.losses++;
        else s.draws++;
    },

    addExp(s, amount) {
        s.totalExpGained += amount;
    },

    resetState(s) {
        s.enabled = false;
        s.enabledAt = null;
        s.nextFightAt = null;
        s.stoppingAfterCurrent = false;
        s.fightsToday = 0;
        s.lastFightDate = null;
        s.wins = 0;
        s.losses = 0;
        s.draws = 0;
        s.totalExpGained = 0;
        s.sessionFights = 0;
        s.liveFight = null;
    },
};

// ─── Actions ────────────────────────────────────────────────────────────────
const actions = {

    /** Initialize auto fight state from localStorage. */
    init({ commit, state }) {
        const saved = loadState();
        if (saved) {
            commit('setEnabled', saved.enabled);
            commit('setEnabledAt', saved.enabledAt);
            commit('setNextFightAt', saved.nextFightAt);
            // BUG FIX: if stoppingAfterCurrent was persisted but liveFight is lost
            // on reload (liveFight is not persisted), clear the stuck flag
            const stopping = saved.stoppingAfterCurrent || false;
            if (stopping && !state.liveFight) {
                commit('setStoppingAfterCurrent', false);
            } else {
                commit('setStoppingAfterCurrent', stopping);
            }
            commit('setDifficulty', saved.difficulty || 'medium');
            commit('setFightsToday', saved.fightsToday || 0);
            commit('setLastFightDate', saved.lastFightDate || null);
            commit('setWins', saved.wins || 0);
            commit('setLosses', saved.losses || 0);
            commit('setDraws', saved.draws || 0);
            commit('setTotalExpGained', typeof saved.totalExpGained === 'number' ? saved.totalExpGained : 0);
            commit('setSessionFights', saved.sessionFights || 0);

            // Daily reset: if lastFightDate is not today, reset daily stats and clear log
            const today = getTodayDate();
            if (state.lastFightDate !== today) {
                commit('setFightsToday', 0);
                commit('setWins', 0);
                commit('setLosses', 0);
                commit('setDraws', 0);
                commit('setTotalExpGained', 0);
                commit('setSessionFights', 0);
                commit('setLastFightDate', today);
                commit('setFightLog', []);
                saveState(state);
                saveHistory([]);
            } else {
                commit('setFightLog', loadHistory());
            }
        } else {
            commit('setFightLog', loadHistory());
        }
    },

    /** Enable auto fight mode. */
    enable({ commit, state, rootGetters }) {
        const modules = rootGetters['fight/getPlayerModules'];
        if (!modules || !modules.every(m => m !== null)) {
            console.warn('[AutoFight] Enable failed — playerModules invalid:', JSON.stringify(modules));
            return false;
        }

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
            commit('setSessionFights', 0);
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

        try {
            // Daily reset check — clear stats and fight log on new day
            const today = getTodayDate();
            if (state.lastFightDate !== today) {
                commit('setFightsToday', 0);
                commit('setWins', 0);
                commit('setLosses', 0);
                commit('setDraws', 0);
                commit('setTotalExpGained', 0);
                commit('setSessionFights', 0);
                commit('setLastFightDate', today);
                commit('setFightLog', []);
                saveHistory([]);
            }

            const now = Date.now();
            const modules = rootGetters['fight/getPlayerModules'];
            if (!modules || !modules.every(m => m !== null)) {
                console.warn('[AutoFight] Skipped — playerModules invalid:', JSON.stringify(modules));
                // Reschedule so timer doesn't freeze at 0:00
                if (state.nextFightAt && now >= state.nextFightAt) {
                    commit('setNextFightAt', now + getRandomInterval());
                    saveState(state);
                }
                return;
            }

            // Check if there's an active manual fight
            const fightPhase = rootGetters['fight/getFightPhase'];
            if (fightPhase === 'fighting' || fightPhase === 'coach') {
                // Reschedule so timer doesn't freeze at 0:00
                if (state.nextFightAt && now >= state.nextFightAt) {
                    commit('setNextFightAt', now + getRandomInterval());
                    saveState(state);
                }
                return;
            }

            // Calculate player power for matchmaking
            const progressionState = rootState.progression;
            const playerFighter = buildPlayerFighter(progressionState, modules);
            const playerPower = calculatePowerRating(playerFighter);

            // Build player deck data for move-based combat
            const playerDeck = progressionState.deck || [];
            const playerCardLevels = {};
            playerDeck.forEach(moveId => {
                playerCardLevels[moveId] = progressionState.moves[moveId]?.level || 1;
            });

            // Simulate missed fights
            let nextAt = state.nextFightAt;
            while (nextAt && now >= nextAt && state.fightsToday < AUTO_FIGHT_MAX_PER_DAY && state.sessionFights < AUTO_FIGHT_MAX_PER_SESSION) {
                const fightData = simulateFullFight(modules, state.difficulty, playerPower, playerDeck, playerCardLevels);
                const expGain = fightData.result === 'win' ? 10 : 5;

                const logEntry = {
                    id: 'autofight_' + nextAt,
                    timestamp: nextAt,
                    opponent: fightData.opponent.name,
                    opponentSkin: fightData.opponent.skin,
                    result: fightData.result,
                    rounds: fightData.rounds,
                    hp1Final: fightData.hp1Final,
                    hp2Final: fightData.hp2Final,
                    expGained: expGain,
                    playerModules: fightData.playerModules.map(m => m?.id || m),
                    opponentModules: (fightData.opponent.modules || []).map(m => m?.id || m),
                    diceUsed: fightData.diceUsed,
                    diceEffect: fightData.diceEffect,
                    coachUsed: fightData.coachUsed,
                    coachChoice: fightData.coachChoice,
                    emergencyUsed: fightData.emergencyUsed,
                };

                commit('addFightToLog', logEntry);
                commit('incrementStats', fightData.result);
                commit('addExp', expGain);

                // Award XP to progression (freeXP)
                dispatch('progression/onFightEnd', {
                    result: fightData.result === 'win' ? 'win' : 'lose',
                }, { root: true });

                // Save to server (PvE stats)
                apiClient.post('/fight/save', {
                    isWin: fightData.result === 'win',
                    isDraw: fightData.result === 'draw',
                    roundsPlayed: fightData.rounds,
                    totalDamageDealt: 0,
                }, { authRequired: true }).catch(() => {});

                // Send notification
                dispatch('sendNotification', { fight: logEntry });

                nextAt = nextAt + getRandomInterval();
            }

            // Ensure nextFightAt is always in the future (prevents 0:00 freeze)
            if (!nextAt || now >= nextAt) {
                nextAt = now + getRandomInterval();
            }

            commit('setNextFightAt', nextAt);
            saveState(state);
            saveHistory(state.fightLog);
        } catch (e) {
            console.error('[AutoFight] checkAndRunPending error:', e);
            // Reschedule to prevent permanent freeze
            const now = Date.now();
            if (!state.nextFightAt || now >= state.nextFightAt) {
                commit('setNextFightAt', now + getRandomInterval());
                saveState(state);
            }
        }
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

        // Collect combat details from cardFightState for AI analysis
        const playerModules = rootGetters['fight/getPlayerModules'] || [];
        const diceState = rootGetters['fight/getDiceState'];
        const coachAdvice = rootGetters['fight/getCoachAdvice'];
        const emergencyProtocol = rootGetters['fight/getEmergencyProtocol'];

        const logEntry = {
            id: 'autofight_' + Date.now(),
            timestamp: Date.now(),
            opponent: opponent?.name || 'Unknown',
            opponentSkin: opponent?.skin || 'skin_m_1.png',
            result,
            rounds,
            hp1Final: hp1,
            hp2Final: hp2,
            expGained: expGain,
            playerModules: playerModules.map(m => m?.id || m),
            opponentModules: (opponent?.modules || []).map(m => m?.id || m),
            diceUsed: !!(diceState && diceState.activeItem),
            diceEffect: diceState?.activeItem?.effect || null,
            coachUsed: !!(coachAdvice && coachAdvice.used),
            coachChoice: coachAdvice?.action || null,
            emergencyUsed: !!(emergencyProtocol && emergencyProtocol.used),
        };

        commit('addFightToLog', logEntry);
        commit('incrementStats', result);
        commit('addExp', expGain);

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
            const xp = typeof fight.expGained === 'number' ? fight.expGained : 0;
            const body = fight.result === 'win'
                ? `Victory vs ${fight.opponent}! +${xp} XP`
                : fight.result === 'lose'
                    ? `Defeat vs ${fight.opponent}. +${xp} XP`
                    : `Draw vs ${fight.opponent}. +${xp} XP`;

            new Notification('Hexlash Auto Fight', {
                body,
                icon: '/favicon.ico',
                tag: 'autofight-' + fight.id,
            });
        } catch (e) { /* ignore */ }
    },


    /** Request AI analysis for selected period. */
    async requestAnalysis({ commit, getters, state, rootGetters }) {
        if (!getters.canAnalyze) return;

        commit('setAiAnalysisLoading', true);
        commit('setAiAnalysisError', false);
        commit('setAiAnalysis', null);

        try {
            const fights = getters.fightsForPeriod.map(f => ({
                result: f.result === 'lose' ? 'loss' : f.result,
                playerHP: f.hp1Final,
                opponentHP: f.hp2Final,
                rounds: f.rounds,
                totalRounds: 10,
                playerModules: f.playerModules || [],
                opponentModules: f.opponentModules || [],
                diceUsed: f.diceUsed || false,
                diceEffect: f.diceEffect || null,
                coachUsed: f.coachUsed || false,
                coachChoice: f.coachChoice || null,
                emergencyUsed: f.emergencyUsed || false,
                xpEarned: f.expGained || 0,
            }));

            const locale = rootGetters['master/getLanguage'] || 'en';
            const response = await apiClient.analyzeAutoFights(
                fights,
                state.fightLog.length,
                state.aiAnalysisPeriod,
                locale,
            );

            commit('setAiAnalysis', response.analysis);
        } catch (e) {
            console.error('[AutoFight] AI analysis error:', e);
            commit('setAiAnalysisError', true);
        } finally {
            commit('setAiAnalysisLoading', false);
        }
    },

    /** Clear AI analysis state. */
    clearAnalysis({ commit }) {
        commit('setAiAnalysis', null);
        commit('setAiAnalysisError', false);
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
