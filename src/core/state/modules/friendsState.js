import apiClient from '@/core/api/apiClient.js';

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
    loading: false,
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
    isLoading: (s) => s.loading,
    getFriendFight: (s) => (friendId) => {
        const friend = s.friends.find(f => f.id === friendId);
        return (friend && friend.status === 'in_fight') ? friend.currentFight : null;
    },
};

// ─── Mutations ──────────────────────────────────────────────────────────────
const mutations = {
    setFriends(s, friends) { s.friends = friends; },
    setFriendRequests(s, requests) { s.friendRequests = requests; },
    setLoading(s, val) { s.loading = val; },
    addFriend(s, player) {
        s.friends.push(player);
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
    async init({ dispatch }) {
        await dispatch('fetchFriends');
        await dispatch('fetchRequests');
    },

    async fetchFriends({ commit }) {
        try {
            commit('setLoading', true);
            const { data } = await apiClient.get('/friends');
            commit('setFriends', data);
        } catch (e) {
            console.error('Failed to fetch friends:', e);
        } finally {
            commit('setLoading', false);
        }
    },

    async fetchRequests({ commit }) {
        try {
            const { data } = await apiClient.get('/friends/requests');
            commit('setFriendRequests', {
                incoming: data.incoming || [],
                outgoing: data.outgoing || [],
            });
        } catch (e) {
            console.error('Failed to fetch friend requests:', e);
        }
    },

    async searchPlayers(_, query) {
        if (query.length < 2) return [];
        try {
            const { data } = await apiClient.get('/friends/search', { params: { q: query } });
            return data;
        } catch (e) {
            console.error('Search failed:', e);
            return [];
        }
    },

    async sendFriendRequest({ dispatch }, player) {
        try {
            await apiClient.post('/friends/request', { targetId: player.id });
            await dispatch('fetchRequests');
            return true;
        } catch (e) {
            console.error('Failed to send friend request:', e);
            return false;
        }
    },

    async acceptFriendRequest({ dispatch }, request) {
        try {
            await apiClient.post('/friends/accept', { requestId: request.requestId });
            await dispatch('fetchFriends');
            await dispatch('fetchRequests');
            return true;
        } catch (e) {
            console.error('Failed to accept friend request:', e);
            return false;
        }
    },

    async declineFriendRequest({ dispatch }, request) {
        try {
            await apiClient.post('/friends/decline', { requestId: request.requestId });
            await dispatch('fetchRequests');
            return true;
        } catch (e) {
            console.error('Failed to decline friend request:', e);
            return false;
        }
    },

    async removeFriend({ commit }, playerId) {
        try {
            await apiClient.delete(`/friends/${playerId}`);
            commit('removeFriend', playerId);
            return true;
        } catch (e) {
            console.error('Failed to remove friend:', e);
            return false;
        }
    },

    // ─── Challenges (via WebSocket — kept for future real-time integration) ──

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

        return true;
    },

    cancelChallenge({ commit }) {
        commit('clearOutgoingChallenge');
        if (challengeTimeout) { clearTimeout(challengeTimeout); challengeTimeout = null; }
    },

    // ─── Incoming Challenges ────────────────────────────────────────────────

    acceptIncomingChallenge({ commit, state: s }) {
        const challenger = s.challenge.incoming;
        if (!challenger) return null;

        commit('clearIncomingChallenge');
        return challenger;
    },

    declineIncomingChallenge({ commit }) {
        commit('clearIncomingChallenge');
    },
};

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};
