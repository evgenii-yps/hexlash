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

// ─── Opponent fighter generation (mock) ─────────────────────────────────────
function generateOpponentFighter(opponent) {
    const modules = ['Predator', 'Guardian', 'Ghost', 'Analyst', 'Chaos', 'Tank'];
    const shuffled = [...modules].sort(() => Math.random() - 0.5);

    return {
        name: opponent.username,
        hp: 100,
        maxHp: 100,
        modules: [shuffled[0], shuffled[1], shuffled[2]],
        deck: [
            { id: 'jab', name: 'Jab', damage: 8, speed: 9 },
            { id: 'cross', name: 'Cross', damage: 12, speed: 6 },
            { id: 'hook', name: 'Hook', damage: 15, speed: 5 },
        ],
    };
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
};

// ─── Mutations ──────────────────────────────────────────────────────────────
const mutations = {
    setCurrentPvPFight(s, fight) {
        s.currentPvPFight = fight;
    },
    clearCurrentPvPFight(s) {
        s.currentPvPFight = null;
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

    createPvPFight({ commit, state: s }, { opponent, isRanked = false }) {
        const fight = {
            id: 'pvp_' + Date.now(),
            type: isRanked ? 'pvp_ranked' : 'pvp_friendly',
            status: 'ready',

            opponent: {
                id: opponent.odId || opponent.id,
                username: opponent.username,
                rating: opponent.rating,
                fighter: generateOpponentFighter(opponent),
            },

            result: null,
            ratingChange: null,

            createdAt: Date.now(),
            startedAt: null,
            finishedAt: null,
        };

        commit('setCurrentPvPFight', fight);
        commit('setStatus', 'in_fight');
        saveToStorage(s);

        return fight;
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

    clearCurrentFight({ commit, state: s }) {
        commit('clearCurrentPvPFight');
        commit('setStatus', 'idle');
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
