const STORAGE_KEY = 'hexlash_pvp';

// ─── Persistence ────────────────────────────────────────────────────────────
function saveToStorage(state) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            pvpStats: state.pvpStats,
            currentPvPFight: state.currentPvPFight,
        }));
    } catch (e) { /* ignore */ }
}

function loadFromStorage() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
    } catch (e) { /* ignore */ }
    return null;
}

// ─── Rating calculation ─────────────────────────────────────────────────────
function calculateRatingChange(myRating, opponentRating, result) {
    const diff = opponentRating - myRating;
    const base = 25;

    if (result === 'win') {
        const bonus = Math.round(diff / 20);
        return Math.max(10, base + bonus);
    } else if (result === 'lose') {
        const penalty = Math.round(diff / 20);
        return Math.min(-10, -base + penalty);
    }

    return 0; // draw
}

// ─── State ──────────────────────────────────────────────────────────────────
const state = () => ({
    currentPvPFight: null,
    pvpStats: {
        rating: 1000,
        wins: 0,
        losses: 0,
        draws: 0,
    },
    status: 'idle', // 'idle', 'searching', 'in_fight', 'finished'
    currentMatchId: null,
    pvpFightStatus: 'idle', // idle, ready, fighting, paused, finished
    opponentInfo: null,
    isPlayer1: false,
});

// ─── Getters ────────────────────────────────────────────────────────────────
const getters = {
    getCurrentPvPFight: (s) => s.currentPvPFight,
    getPvpStats: (s) => s.pvpStats,
    getStatus: (s) => s.status,

    winRate: (s) => {
        const total = s.pvpStats.wins + s.pvpStats.losses;
        if (total === 0) return 0;
        return Math.round((s.pvpStats.wins / total) * 100);
    },

    league: (s) => {
        const rating = s.pvpStats.rating;
        if (rating >= 3000) return { name: 'Champion', icon: '👑', color: '#FFD700' };
        if (rating >= 2500) return { name: 'Diamond', icon: '💠', color: '#00BFFF' };
        if (rating >= 2000) return { name: 'Platinum', icon: '💎', color: '#00CED1' };
        if (rating >= 1500) return { name: 'Gold', icon: '🥇', color: '#FFD700' };
        if (rating >= 1000) return { name: 'Silver', icon: '🥈', color: '#C0C0C0' };
        return { name: 'Bronze', icon: '🥉', color: '#CD7F32' };
    },

    isPvPFight: (s) => s.status === 'in_fight',
    getCurrentMatchId: (s) => s.currentMatchId,
    getPvpFightStatus: (s) => s.pvpFightStatus,
    getOpponentInfo: (s) => s.opponentInfo,
    getIsPlayer1: (s) => s.isPlayer1,
};

// ─── Mutations ──────────────────────────────────────────────────────────────
const mutations = {
    setCurrentPvPFight(s, fight) {
        s.currentPvPFight = fight;
    },
    setStatus(s, status) {
        s.status = status;
    },
    setPvpStats(s, stats) {
        s.pvpStats = stats;
    },
    updateStatsWin(s) {
        s.pvpStats.wins++;
    },
    updateStatsLoss(s) {
        s.pvpStats.losses++;
    },
    updateStatsDraw(s) {
        s.pvpStats.draws++;
    },
    setRating(s, rating) {
        s.pvpStats.rating = Math.max(0, rating);
    },
    setRatingChange(s, change) {
        if (s.currentPvPFight) {
            s.currentPvPFight.ratingChange = change;
        }
    },
    SET_PVP_MATCH(s, { matchId, opponent, isPlayer1 }) {
        s.currentMatchId = matchId;
        s.opponentInfo = opponent;
        s.isPlayer1 = isPlayer1;
        s.pvpFightStatus = 'ready';
    },
    RESET_PVP_FIGHT(s) {
        s.currentMatchId = null;
        s.pvpFightStatus = 'idle';
        s.opponentInfo = null;
        s.isPlayer1 = false;
    },
};

// ─── Actions ────────────────────────────────────────────────────────────────
const actions = {
    init({ commit }) {
        const saved = loadFromStorage();
        if (saved) {
            commit('setPvpStats', saved.pvpStats || { rating: 1000, wins: 0, losses: 0, draws: 0 });
            if (saved.currentPvPFight) {
                commit('setCurrentPvPFight', saved.currentPvPFight);
                if (saved.currentPvPFight.status === 'in_fight') {
                    commit('setStatus', 'in_fight');
                }
            }
        }
    },

    restoreFromServer({ commit, state: s }, userData) {
        if (!userData) return;
        const stats = { ...s.pvpStats };
        if (userData.rating !== undefined) stats.rating = userData.rating;
        if (userData.pvpWins !== undefined) stats.wins = userData.pvpWins;
        if (userData.pvpLosses !== undefined) stats.losses = userData.pvpLosses;
        if (userData.pvpDraws !== undefined) stats.draws = userData.pvpDraws;
        commit('setPvpStats', stats);
        saveToStorage(s);
    },

    finishPvPFight({ commit, state: s }, result) {
        if (!s.currentPvPFight) return;

        const isRanked = s.currentPvPFight.type === 'pvp_ranked';

        s.currentPvPFight.status = 'finished';
        s.currentPvPFight.result = result;
        s.currentPvPFight.finishedAt = Date.now();

        if (result === 'win') {
            commit('updateStatsWin');
        } else if (result === 'lose') {
            commit('updateStatsLoss');
        } else {
            commit('updateStatsDraw');
        }

        if (isRanked) {
            const ratingChange = calculateRatingChange(
                s.pvpStats.rating,
                s.currentPvPFight.opponent.rating,
                result,
            );

            commit('setRatingChange', ratingChange);
            commit('setRating', s.pvpStats.rating + ratingChange);
        }

        commit('setStatus', 'finished');
        saveToStorage(s);
    },
};

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};
