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
    onlineFriendsCount: (s) => s.friends.filter(f => f.status === 'online').length,
    isRequestPending: (s) => (playerId) => s.friendRequests.outgoing.some(r => r.id === playerId),
    hasPendingChallenge: (s) => (playerId) => s.challenge.outgoing?.odId === playerId,
};

// ─── Mutations ──────────────────────────────────────────────────────────────
const mutations = {
    setFriends(s, friends) { s.friends = friends; },
    setFriendRequests(s, requests) { s.friendRequests = requests; },
    setIncomingRequests(s, requests) { s.friendRequests.incoming = requests; },
    setOutgoingRequests(s, requests) { s.friendRequests.outgoing = requests; },
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
        const skin = master?.userData?.skin || null;
        const avatarUrl = master?.userData?.avatarUrl || null;

        // Send via WebSocket
        store.dispatch('webSocket/sendMessage', {
            type: 'challenge_send',
            targetUserId: friend.id,
            username,
            rating,
            challengerSkin: skin,
            challengerAvatarUrl: avatarUrl,
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

};

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};
