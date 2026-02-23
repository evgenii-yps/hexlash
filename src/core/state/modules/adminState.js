const ADMIN_SESSION_KEY = 'hexlash_admin_session';

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

function generateKey() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let key = '';
    for (let i = 0; i < 16; i++) {
        if (i > 0 && i % 4 === 0) key += '-';
        key += chars[Math.floor(Math.random() * chars.length)];
    }
    return key;
}

// Загружаем данные из localStorage
function loadData(key, defaultValue) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch {
        return defaultValue;
    }
}

function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

const KEYS = {
    PLAYERS: 'hexlash_admin_players',
    GAME_KEYS: 'hexlash_admin_game_keys',
    TRANSACTIONS: 'hexlash_admin_transactions',
    CARDS: 'hexlash_admin_cards',
};

// Демо-данные игроков
const defaultPlayers = [
    {id: '1', login: 'fighter_pro', name: 'Pro Fighter', balance: 50000000, wins: 120, losses: 30, totalFights: 150, isBlocked: false, createdAt: '2025-06-15T10:00:00Z'},
    {id: '2', login: 'newbie_01', name: 'Newbie', balance: 1000000, wins: 5, losses: 20, totalFights: 25, isBlocked: false, createdAt: '2025-11-01T08:00:00Z'},
    {id: '3', login: 'cheater_x', name: 'Cheater X', balance: 999999999, wins: 500, losses: 0, totalFights: 500, isBlocked: true, createdAt: '2025-09-10T12:00:00Z'},
    {id: '4', login: 'legend_42', name: 'The Legend', balance: 25000000, wins: 300, losses: 100, totalFights: 400, isBlocked: false, createdAt: '2025-03-20T15:00:00Z'},
    {id: '5', login: 'casual_player', name: 'Casual Joe', balance: 8000000, wins: 45, losses: 55, totalFights: 100, isBlocked: false, createdAt: '2025-08-05T09:30:00Z'},
];

const state = {
    isAuthenticated: !!sessionStorage.getItem(ADMIN_SESSION_KEY),
    players: loadData(KEYS.PLAYERS, defaultPlayers),
    gameKeys: loadData(KEYS.GAME_KEYS, []),
    transactions: loadData(KEYS.TRANSACTIONS, []),
    searchQuery: '',
    selectedPlayer: null,
};

const getters = {
    isAdminAuth: (state) => state.isAuthenticated,
    getPlayers: (state) => {
        if (!state.searchQuery) return state.players;
        const q = state.searchQuery.toLowerCase();
        return state.players.filter(p =>
            p.login.toLowerCase().includes(q) ||
            p.name.toLowerCase().includes(q) ||
            p.id.includes(q)
        );
    },
    getAllPlayers: (state) => state.players,
    getGameKeys: (state) => state.gameKeys,
    getTransactions: (state) => state.transactions,
    getSelectedPlayer: (state) => state.selectedPlayer,
    getSearchQuery: (state) => state.searchQuery,
    getStats: (state) => {
        const players = state.players;
        const totalPlayers = players.length;
        const activePlayers = players.filter(p => !p.isBlocked).length;
        const blockedPlayers = players.filter(p => p.isBlocked).length;
        const totalFights = players.reduce((sum, p) => sum + (p.totalFights || 0), 0);
        const totalBalance = players.reduce((sum, p) => sum + (p.balance || 0), 0);
        const activeKeys = state.gameKeys.filter(k => !k.usedBy).length;
        const usedKeys = state.gameKeys.filter(k => k.usedBy).length;
        const totalTransactions = state.transactions.length;
        const totalDeposited = state.transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0);
        return {totalPlayers, activePlayers, blockedPlayers, totalFights, totalBalance, activeKeys, usedKeys, totalTransactions, totalDeposited};
    },
};

const mutations = {
    setAdminAuth(state, value) {
        state.isAuthenticated = value;
        if (value) {
            sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
        } else {
            sessionStorage.removeItem(ADMIN_SESSION_KEY);
        }
    },
    setSearchQuery(state, query) {
        state.searchQuery = query;
    },
    setSelectedPlayer(state, player) {
        state.selectedPlayer = player;
    },
    updatePlayerBalance(state, {playerId, amount}) {
        const player = state.players.find(p => p.id === playerId);
        if (player) {
            player.balance += amount;
            saveData(KEYS.PLAYERS, state.players);
        }
    },
    togglePlayerBlock(state, playerId) {
        const player = state.players.find(p => p.id === playerId);
        if (player) {
            player.isBlocked = !player.isBlocked;
            saveData(KEYS.PLAYERS, state.players);
        }
    },
    addGameKeys(state, keys) {
        state.gameKeys.push(...keys);
        saveData(KEYS.GAME_KEYS, state.gameKeys);
    },
    deleteGameKey(state, keyId) {
        state.gameKeys = state.gameKeys.filter(k => k.id !== keyId);
        saveData(KEYS.GAME_KEYS, state.gameKeys);
    },
    addTransaction(state, transaction) {
        state.transactions.unshift(transaction);
        saveData(KEYS.TRANSACTIONS, state.transactions);
    },
    addPlayer(state, player) {
        state.players.push(player);
        saveData(KEYS.PLAYERS, state.players);
    },
    deletePlayer(state, playerId) {
        state.players = state.players.filter(p => p.id !== playerId);
        saveData(KEYS.PLAYERS, state.players);
    },
};

const actions = {
    adminLogin({commit}, {login, password}) {
        const envLogin = import.meta.env.VITE_ADMIN_LOGIN;
        const envPassword = import.meta.env.VITE_ADMIN_PASSWORD;
        if (login === envLogin && password === envPassword) {
            commit('setAdminAuth', true);
            return true;
        }
        return false;
    },
    adminLogout({commit}) {
        commit('setAdminAuth', false);
    },
    depositToPlayer({commit}, {playerId, amount, note}) {
        const numAmount = Math.round(Number(amount) * 1e6); // convert to internal format (DECIMALS=6)
        commit('updatePlayerBalance', {playerId, amount: numAmount});
        commit('addTransaction', {
            id: generateId(),
            playerId,
            type: 'deposit',
            amount: numAmount,
            note: note || '',
            createdAt: new Date().toISOString(),
        });
    },
    withdrawFromPlayer({commit}, {playerId, amount, note}) {
        const numAmount = Math.round(Number(amount) * 1e6);
        commit('updatePlayerBalance', {playerId, amount: -numAmount});
        commit('addTransaction', {
            id: generateId(),
            playerId,
            type: 'withdraw',
            amount: numAmount,
            note: note || '',
            createdAt: new Date().toISOString(),
        });
    },
    generateGameKeys({commit}, {count, prefix}) {
        const keys = [];
        for (let i = 0; i < count; i++) {
            keys.push({
                id: generateId(),
                key: (prefix || '') + generateKey(),
                createdAt: new Date().toISOString(),
                usedBy: null,
                usedAt: null,
            });
        }
        commit('addGameKeys', keys);
        return keys;
    },
};

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};
