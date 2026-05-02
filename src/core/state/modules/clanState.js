import {
    fetchClanData,
    getClanByIdFromLocalAndAPI,
    updateClanDataOnAPI,
} from '@/core/services/clanService';

import store from "@/core/state/store.js";
import {updateClanToLocalDB} from "@/core/database/clanRepository.js";
import * as clanService from "@/core/services/clanService.js";

const state = {
    clans: [],
    clanRatings: {
        items: [],
        limitReached: false,
        pageSize: 20,
    },
    clanEvents: [],
    clanEventsLoading: false,
    clanEventsHasMore: true,
    // Guest clan state — used by /v2/clan/:id (Sub-epic 1).
    // Tracks loading/error around getGuestClanById action; the fetched
    // clan itself is stored in `clans` cache via setClan (existing path).
    loadingGuest: false,
    errorGuest: null,
};

const getters = {
    getClanById: (state) => (clanId) => {
        return state.clans.find(clan => clan.id === clanId);
    },
    getClanRatingsList: (state) => {
        return state.clanRatings.items;
    },
    isLimitReached: (state) => {
        return state.clanRatings.limitReached;
    },
};

const mutations = {
    setClan(state, clan) {
        const index = state.clans.findIndex(c => c.id === clan.id);
        if (index !== -1) {
            state.clans.splice(index, 1, clan);
        } else {
            state.clans.push(clan);
        }
    },
    updateClan(state, updatedClanData) {
        const clan = state.clans.find(c => c.id === updatedClanData.id);
        if (clan) {
            Object.assign(clan, updatedClanData);
        }
    },
    removeClan(state, clanId) {
        state.clans = state.clans.filter(c => c.id !== clanId);
        state.clanRatings.items = state.clanRatings.items.filter(c => c.id !== clanId);
    },
    setClanRatings(state, clans) {
        state.clanRatings.items.push(...clans);
    },
    resetClanRatings(state) {
        state.clanRatings.items = [];
        state.clanRatings.limitReached = false;
    },
    updateClanRatingsState(state, { field, value }) {
        if (state.clanRatings.hasOwnProperty(field)) {
            state.clanRatings[field] = value;
        }
    },
    setClanEvents(state, events) {
        state.clanEvents = events;
    },
    appendClanEvents(state, events) {
        state.clanEvents.push(...events);
    },
    setClanEventsLoading(state, val) {
        state.clanEventsLoading = val;
    },
    setClanEventsHasMore(state, val) {
        state.clanEventsHasMore = val;
    },
    resetClanEvents(state) {
        state.clanEvents = [];
        state.clanEventsHasMore = true;
    },
    setLoadingGuest(state, loading) {
        state.loadingGuest = loading;
    },
    setErrorGuest(state, error) {
        state.errorGuest = error;
    },
};


const actions = {
    async getClanById({commit, getters}, clanId) {
        let clan = getters.getClanById(clanId);

        if (clan) {
            return clan;
        }
        try {
            clan = await fetchClanData(clanId);
            if (clan) {
                commit('setClan', clan);
            }
            return clan;
        } catch (error) {
            console.error('Error fetching clan:', error);
            throw error;
        }
    },
    /**
     * Fetch clan by id for guest clan view (Sub-epic 1).
     * Wraps existing service path with explicit loading/error state tracking.
     * Result cached via setClan (existing `clans` array); read in component
     * via getters.getClanById(clanId).
     *
     * Existing getClanById + loadClanById actions remain untouched for legacy
     * v1 callsites (CreateClan after creation, MyClanTab suggested clans,
     * v1 ClanView, HudClan own-clan flow).
     */
    async getGuestClanById({commit}, clanId) {
        commit('setLoadingGuest', true);
        commit('setErrorGuest', null);
        try {
            // Try local-first then network refresh (returns cached if present);
            // fall back to direct fetch if cache miss.
            let clan = await getClanByIdFromLocalAndAPI(clanId);
            if (!clan) {
                clan = await fetchClanData(clanId);
            }
            if (clan) {
                commit('setClan', clan);
            }
            commit('setLoadingGuest', false);
            return clan;
        } catch (error) {
            const status = error?.response?.status || error?.status || 0;
            const message = error?.response?.data?.error || error?.message || 'Failed to fetch clan';
            commit('setErrorGuest', { status, message });
            commit('setLoadingGuest', false);
            console.error('[clan/getGuestClanById]', clanId, status, message);
            return null;
        }
    },
    async loadClanById({commit, getters}, clanId) {
        try {
            const clan = await getClanByIdFromLocalAndAPI(clanId);
            if (clan) {
                commit('setClan', clan);
            }
            return clan;
        } catch (error) {
            console.error('Error fetching clan:', error);
            throw error;
        }
    },
    async updateClanData({commit}, updatedClanData) {
        try {
            await updateClanDataOnAPI(updatedClanData);

            await updateClanToLocalDB(updatedClanData);

            commit('updateClan', updatedClanData);
        } catch (error) {
            console.error('Failed to update clan data:', error);
            throw error;
        }
    },
    async leaveClan({commit}) {
        try {
            await clanService.leaveClan();
            store.commit('master/updateMaster', {clanId: null, clanRole: null});
        } catch (error) {
            console.error('Failed to leave clan:', error);
            throw error;
        }
    },
    async changeClan({commit}, clanId) {
        try {
            const newClanModel = await clanService.changeClan(clanId);
            store.commit('master/updateMaster', {clanId: newClanModel.id, clanRole: 'member'});

            await store.dispatch('clan/loadClanById', newClanModel.id);

        } catch (error) {
            console.error('Failed to change clan data:', error);
            throw error;
        }
    },
    async deleteClan({commit}) {
        try {
            const clanId = store.getters['master/getMaster']?.userData?.clanId;
            await clanService.deleteClan();
            if (clanId) {
                commit('removeClan', clanId);
            }
            store.commit('master/updateMaster', {clanId: null, clanRole: null});
        } catch (error) {
            console.error('Failed to delete clan:', error);
            throw error;
        }
    },
    async createClan({commit}, newClanData) {
        try {
            const newClanModel = await clanService.createClan(newClanData);
            store.commit('master/updateMaster', {clanId: newClanModel.id, clanRole: 'owner'});

            return newClanModel;

        } catch (error) {
            console.error('Failed to create clan:', error);
            throw error;
        }
    },
    async uploadClanAvatar({ commit }, { formData, onUploadProgress }) {
        try {
            const avatarUrl = await clanService.uploadClanAvatar(formData, onUploadProgress);

            const clanId = store.getters['master/getMaster']?.userData?.clanId;
            if (clanId) {
                commit('updateClan', { id: clanId, avatarUrl });
            }

            return avatarUrl;
        } catch (error) {
            console.error('Failed to upload avatar:', error);
        }
    },
    async setMemberRole({commit}, {userId, role}) {
        try {
            await clanService.setMemberRole(userId, role);
        } catch (error) {
            console.error('Failed to set member role:', error);
            throw error;
        }
    },
    async transferOwnership({commit}, {newOwnerId}) {
        try {
            await clanService.transferOwnership(newOwnerId);
            store.commit('master/updateMaster', {clanRole: 'deputy'});
        } catch (error) {
            console.error('Failed to transfer ownership:', error);
            throw error;
        }
    },
    async kickMember({commit}, {userId}) {
        try {
            await clanService.kickMember(userId);
        } catch (error) {
            console.error('Failed to kick member:', error);
            throw error;
        }
    },
    async fetchClanEvents({ commit, state }, { clanId, limit = 30, before = null }) {
        commit('setClanEventsLoading', true);
        try {
            const events = await clanService.getClanEvents(clanId, limit, before);
            if (before) {
                commit('appendClanEvents', events);
            } else {
                commit('setClanEvents', events);
            }
            if (events.length < limit) {
                commit('setClanEventsHasMore', false);
            }
        } catch (error) {
            console.error('Failed to fetch clan events:', error);
        } finally {
            commit('setClanEventsLoading', false);
        }
    },
    async loadClanRatings({ commit, state }, { search, sortBy, page }) {

        const newClans = await clanService.searchClans({
            name: search,
            sortBy: sortBy,
            page: page,
            size: state.clanRatings.pageSize,
        });

        if (newClans.length < state.clanRatings.pageSize) {
            commit('updateClanRatingsState', { field: 'limitReached', value: true });
        }

        commit('setClanRatings', newClans);

    },
};

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};
