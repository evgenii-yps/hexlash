import apiClient from '@/core/api/apiClient.js';

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

// ─── Challenge timer ────────────────────────────────────────────────────────
let challengeTimeout = null;

// ─── State ──────────────────────────────────────────────────────────────────
const state = () => ({
    friends: [],
    friendRequests: {
        incoming: [],
        outgoing: [],
    },
    challenge: {
        outgoing: null, // { odId, odUser, odRating, sentAt, expiresAt }
        incoming: null,
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
    getOutgoingChallenge: (s) => s.challenge.outgoing,
    getIncomingChallenge: (s) => s.challenge.incoming,
    hasPendingChallenge: (s) => (playerId) => s.challenge.outgoing?.odId === playerId,
    getFriendFight: (s) => (friendId) => {
        const friend = s.friends.find(f => f.id === friendId);
        return (friend && friend.status === 'in_fight') ? friend.currentFight : null;
    },
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
    setOutgoingChallenge(s, challenge) {
        s.challenge.outgoing = challenge;
    },
    clearOutgoingChallenge(s) {
        s.challenge.outgoing = null;
    },
    setIncomingChallenge(s, challenge) {
        s.challenge.incoming = challenge;
    },
    clearIncomingChallenge(s) {
        s.challenge.incoming = null;
    },
    setFriendStatus(s, { friendId, status, currentFight }) {
        const friend = s.friends.find(f => f.id === friendId);
        if (friend) {
            friend.status = status;
            friend.currentFight = currentFight || null;
        }
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
    },

    async searchPlayers({ state: s }, query) {
        if (query.length < 3) return [];
        try {
            const response = await apiClient.get('/user/search', {
                params: { name: query, size: 10 },
                authRequired: true,
            });
            const users = response.data || [];
            return users
                .filter(u => {
                    const isFriend = s.friends.some(f => f.id === u.id);
                    const isPending = s.friendRequests.outgoing.some(r => r.id === u.id);
                    return !isFriend && !isPending;
                })
                .map(u => ({
                    id: u.id,
                    username: u.name || u.login,
                    login: u.login,
                    rating: u.rating || 1000,
                    status: 'offline',
                    skin: u.skin,
                    avatarUrl: u.avatarUrl,
                }));
        } catch (err) {
            console.error('Search players error:', err);
            return [];
        }
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

    // ─── Challenges ─────────────────────────────────────────────────────────

    sendChallenge({ commit, state: s }, friend) {
        if (friend.status === 'offline') return false;
        if (s.challenge.outgoing) return false;

        const challenge = {
            odId: friend.id,
            odUser: friend.username,
            odRating: friend.rating,
            sentAt: Date.now(),
            expiresAt: Date.now() + 30000,
        };

        commit('setOutgoingChallenge', challenge);

        // Auto-cancel after 30 seconds
        if (challengeTimeout) clearTimeout(challengeTimeout);
        challengeTimeout = setTimeout(() => {
            if (s.challenge.outgoing?.odId === friend.id) {
                commit('clearOutgoingChallenge');
            }
            challengeTimeout = null;
        }, 30000);

        // Simulate: random response in 2-5 seconds (mock)
        const responseTime = 2000 + Math.random() * 3000;
        setTimeout(() => {
            if (!s.challenge.outgoing || s.challenge.outgoing.odId !== friend.id) return;

            // 70% chance to accept
            if (Math.random() > 0.3) {
                commit('clearOutgoingChallenge');
                if (challengeTimeout) { clearTimeout(challengeTimeout); challengeTimeout = null; }
                // Notify App.vue to start PvP fight
                window.dispatchEvent(new CustomEvent('pvp-challenge-accepted', {
                    detail: friend,
                }));
            } else {
                commit('clearOutgoingChallenge');
                if (challengeTimeout) { clearTimeout(challengeTimeout); challengeTimeout = null; }
                console.log('Challenge declined by', friend.username);
            }
        }, responseTime);

        return true;
    },

    cancelChallenge({ commit }) {
        commit('clearOutgoingChallenge');
        if (challengeTimeout) { clearTimeout(challengeTimeout); challengeTimeout = null; }
    },

    // ─── Incoming Challenges ────────────────────────────────────────────────

    simulateIncomingChallenge({ commit, state: s }) {
        const onlineFriends = s.friends.filter(f => f.status === 'online');
        if (onlineFriends.length === 0) return;

        const randomFriend = onlineFriends[Math.floor(Math.random() * onlineFriends.length)];
        commit('setIncomingChallenge', {
            odId: randomFriend.id,
            username: randomFriend.username,
            rating: randomFriend.rating,
            sentAt: Date.now(),
            expiresAt: Date.now() + 30000,
        });
    },

    acceptIncomingChallenge({ commit, state: s }) {
        const challenger = s.challenge.incoming;
        if (!challenger) return null;

        commit('clearIncomingChallenge');
        return challenger;
    },

    declineIncomingChallenge({ commit }) {
        commit('clearIncomingChallenge');
    },

    // ─── Fight simulation (test) ────────────────────────────────────────────
    simulateFriendsFighting({ commit, state: s }) {
        // End fights for some currently fighting friends (30% chance each)
        s.friends.filter(f => f.status === 'in_fight').forEach(friend => {
            if (Math.random() < 0.3) {
                commit('setFriendStatus', { friendId: friend.id, status: 'online', currentFight: null });
            }
        });

        // Start a fight for a random online friend (20% chance)
        const onlineFriends = s.friends.filter(f => f.status === 'online');
        if (onlineFriends.length > 0 && Math.random() < 0.2) {
            const randomFriend = onlineFriends[Math.floor(Math.random() * onlineFriends.length)];
            commit('setFriendStatus', {
                friendId: randomFriend.id,
                status: 'in_fight',
                currentFight: {
                    odId: 'opp_' + Date.now(),
                    opponent: 'RandomOpp_' + Math.floor(Math.random() * 100),
                    startedAt: Date.now(),
                },
            });
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
