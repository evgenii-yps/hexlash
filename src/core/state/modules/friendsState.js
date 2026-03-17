import apiClient from '@/core/api/apiClient.js';
import store from '@/core/state/store.js';

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
    setIncomingRequests(s, requests) { s.friendRequests.incoming = requests; },
    setOutgoingRequests(s, requests) { s.friendRequests.outgoing = requests; },
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
        if (!s.friends.some(f => f.id === player.id)) {
            s.friends.push({ ...player, addedAt: Date.now() });
        }
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
        await Promise.all([
            dispatch('loadFriends'),
            dispatch('loadIncomingRequests'),
            dispatch('loadOutgoingRequests'),
        ]);
    },

    async loadFriends({ commit }) {
        try {
            const response = await apiClient.get('/friends/list', { authRequired: true });
            commit('setFriends', response.friends || []);
        } catch (err) {
            console.error('[FRIENDS] Failed to load friends:', err);
        }
    },

    async loadIncomingRequests({ commit }) {
        try {
            const response = await apiClient.get('/friends/requests', { authRequired: true });
            commit('setIncomingRequests', response.requests || []);
        } catch (err) {
            console.error('[FRIENDS] Failed to load incoming requests:', err);
        }
    },

    async loadOutgoingRequests({ commit }) {
        try {
            const response = await apiClient.get('/friends/requests/outgoing', { authRequired: true });
            commit('setOutgoingRequests', response.requests || []);
        } catch (err) {
            console.error('[FRIENDS] Failed to load outgoing requests:', err);
        }
    },

    async searchPlayers({ state: s }, query) {
        if (query.length < 3) return [];
        try {
            const response = await apiClient.get('/user/search', {
                params: { name: query, size: 10 },
                authRequired: true,
            });
            // apiClient interceptor unwraps response.data, then server returns { data: [...] }
            const users = response?.data || [];
            return users
                .filter(u => {
                    const isFriend = s.friends.some(f => f.id === u.id);
                    return !isFriend;
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

    async sendFriendRequest({ commit, dispatch, state: s }, player) {
        const alreadySent = s.friendRequests.outgoing.some(r => r.id === player.id);
        if (alreadySent) return false;

        // Optimistically add to outgoing
        commit('addOutgoingRequest', player);

        try {
            const response = await apiClient.post('/friends/request',
                { targetId: player.id },
                { authRequired: true },
            );

            if (response.status === 'accepted') {
                // Mutual request — auto-accepted
                commit('removeOutgoingRequest', player.id);
                commit('addFriend', player);
                commit('removeIncomingRequest', player.id);
            }
            return true;
        } catch (error) {
            console.error('[FRIENDS] Failed to send request:', error);
            // Revert optimistic update
            commit('removeOutgoingRequest', player.id);
            return false;
        }
    },

    async acceptFriendRequest({ commit }, request) {
        const requestId = request.requestId || request.id;
        try {
            await apiClient.post('/friends/accept',
                { requestId },
                { authRequired: true },
            );
            commit('removeIncomingRequest', request.id);
            commit('addFriend', request);
            return true;
        } catch (error) {
            console.error('[FRIENDS] Failed to accept request:', error);
            return false;
        }
    },

    async declineFriendRequest({ commit, state: s }, playerId) {
        const request = s.friendRequests.incoming.find(r => r.id === playerId);
        const requestId = request?.requestId || playerId;
        try {
            await apiClient.post('/friends/decline',
                { requestId },
                { authRequired: true },
            );
            commit('removeIncomingRequest', playerId);
            return true;
        } catch (error) {
            console.error('[FRIENDS] Failed to decline request:', error);
            return false;
        }
    },

    async removeFriend({ commit }, playerId) {
        try {
            await apiClient.post('/friends/remove',
                { friendId: playerId },
                { authRequired: true },
            );
            commit('removeFriend', playerId);
            return true;
        } catch (error) {
            console.error('[FRIENDS] Failed to remove friend:', error);
            return false;
        }
    },

    // ─── Challenges (via WebSocket) ────────────────────────────────────────

    sendChallenge({ commit, state: s, rootGetters }, friend) {
        if (friend.status === 'offline') return false;
        if (s.challenge.outgoing) return false;

        const master = rootGetters['master/getMaster'];
        const username = master?.userData?.name || master?.userData?.login || 'Player';
        const rating = master?.userData?.rating || 1000;

        // Send via WebSocket
        store.dispatch('webSocket/sendMessage', {
            type: 'challenge_send',
            targetUserId: friend.id,
            username,
            rating,
        });

        const challenge = {
            odId: friend.id,
            odUser: friend.username,
            odRating: friend.rating,
            sentAt: Date.now(),
            expiresAt: Date.now() + 10000,
        };

        commit('setOutgoingChallenge', challenge);

        if (challengeTimeout) clearTimeout(challengeTimeout);
        challengeTimeout = setTimeout(() => {
            if (s.challenge.outgoing?.odId === friend.id) {
                commit('clearOutgoingChallenge');
            }
            challengeTimeout = null;
        }, 10000);

        return true;
    },

    cancelChallenge({ commit }) {
        commit('clearOutgoingChallenge');
        if (challengeTimeout) { clearTimeout(challengeTimeout); challengeTimeout = null; }
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
};

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};
