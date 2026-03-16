const STORAGE_KEY = 'hexlash_friends';

// ─── Persistence ────────────────────────────────────────────────────────────
function saveToStorage(state) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            friends: state.friends,
            friendRequests: state.friendRequests,
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

// ─── Mock data ──────────────────────────────────────────────────────────────
const mockPlayers = [
    { id: 'p1', username: 'Shadow_X', rating: 1280, status: 'online' },
    { id: 'p2', username: 'ShadowKnight', rating: 980, status: 'offline' },
    { id: 'p3', username: 'NightFury', rating: 1150, status: 'online' },
    { id: 'p4', username: 'IronFist', rating: 1420, status: 'in_fight' },
    { id: 'p5', username: 'DarkPhoenix', rating: 1650, status: 'offline' },
    { id: 'p6', username: 'BlazeFist', rating: 1100, status: 'online' },
    { id: 'p7', username: 'StormRider', rating: 1320, status: 'offline' },
    { id: 'p8', username: 'ThunderBolt', rating: 890, status: 'online' },
];

// ─── State ──────────────────────────────────────────────────────────────────
const state = () => ({
    friends: [],
    friendRequests: {
        incoming: [],
        outgoing: [],
    },
});

// ─── Getters ────────────────────────────────────────────────────────────────
const getters = {
    getFriends: (s) => s.friends,
    getIncomingRequests: (s) => s.friendRequests.incoming,
    getOutgoingRequests: (s) => s.friendRequests.outgoing,
    onlineFriendsCount: (s) => s.friends.filter(f => f.status === 'online').length,
    incomingRequestsCount: (s) => s.friendRequests.incoming.length,
    isFriend: (s) => (playerId) => s.friends.some(f => f.id === playerId),
    isRequestPending: (s) => (playerId) => s.friendRequests.outgoing.some(r => r.id === playerId),
};

// ─── Mutations ──────────────────────────────────────────────────────────────
const mutations = {
    setFriends(s, friends) { s.friends = friends; },
    setFriendRequests(s, requests) { s.friendRequests = requests; },
    addOutgoingRequest(s, player) {
        s.friendRequests.outgoing.push({ ...player, sentAt: Date.now() });
    },
    removeOutgoingRequest(s, playerId) {
        s.friendRequests.outgoing = s.friendRequests.outgoing.filter(r => r.id !== playerId);
    },
    removeIncomingRequest(s, playerId) {
        s.friendRequests.incoming = s.friendRequests.incoming.filter(r => r.id !== playerId);
    },
    addFriend(s, player) {
        s.friends.push({ ...player, addedAt: Date.now() });
    },
    removeFriend(s, playerId) {
        s.friends = s.friends.filter(f => f.id !== playerId);
    },
};

// ─── Actions ────────────────────────────────────────────────────────────────
const actions = {
    init({ commit }) {
        const saved = loadFromStorage();
        if (saved) {
            commit('setFriends', saved.friends || []);
            commit('setFriendRequests', saved.friendRequests || { incoming: [], outgoing: [] });
        }

        // Add test incoming requests if none exist (temporary for UI testing)
        if (saved?.friendRequests?.incoming?.length > 0) return;
        commit('setFriendRequests', {
            incoming: [
                { id: 'test1', username: 'NewPlayer99', rating: 950, sentAt: Date.now() },
                { id: 'test2', username: 'ProGamer2024', rating: 1180, sentAt: Date.now() },
            ],
            outgoing: saved?.friendRequests?.outgoing || [],
        });
    },

    searchPlayers({ state: s }, query) {
        if (query.length < 3) return [];
        const lowerQuery = query.toLowerCase();
        return mockPlayers.filter(player => {
            const isFriend = s.friends.some(f => f.id === player.id);
            const isPending = s.friendRequests.outgoing.some(r => r.id === player.id);
            return !isFriend && !isPending &&
                player.username.toLowerCase().includes(lowerQuery);
        });
    },

    sendFriendRequest({ commit, state: s }, player) {
        const alreadySent = s.friendRequests.outgoing.some(r => r.id === player.id);
        if (alreadySent) return false;

        commit('addOutgoingRequest', player);
        saveToStorage(s);

        // Simulate: auto-accept after 3 seconds (mock)
        setTimeout(() => {
            const stillPending = s.friendRequests.outgoing.some(r => r.id === player.id);
            if (stillPending) {
                commit('removeOutgoingRequest', player.id);
                commit('addFriend', player);
                saveToStorage(s);
            }
        }, 3000);

        return true;
    },

    acceptFriendRequest({ commit, state: s }, playerId) {
        const request = s.friendRequests.incoming.find(r => r.id === playerId);
        if (!request) return false;

        commit('removeIncomingRequest', playerId);
        commit('addFriend', request);
        saveToStorage(s);
        return true;
    },

    declineFriendRequest({ commit, state: s }, playerId) {
        commit('removeIncomingRequest', playerId);
        saveToStorage(s);
        return true;
    },

    removeFriend({ commit, state: s }, playerId) {
        commit('removeFriend', playerId);
        saveToStorage(s);
        return true;
    },
};

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};
