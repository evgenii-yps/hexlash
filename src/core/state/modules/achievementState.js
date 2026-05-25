

const state = {
    allAchievements: [],
    newAchievement: null,
};

const getters = {
    getNewAchievement: (state) => state.newAchievement,
};

const mutations = {
    setNewAchievement(state, achievement) {
        state.newAchievement = achievement;
    },
    setAllAchievements(state, achievements) {
        state.allAchievements = achievements;
    },
    clearNewAchievement(state) {
        state.newAchievement = null;
    },
};

const actions = {
    receivedAchievement({commit}, achievement) {

        const existingAchievement = state.allAchievements.find(a => a.type === achievement.type);

        if (existingAchievement) {
            const updatedAchievement = {
                ...existingAchievement,
                completed: achievement.isCompleted,
                obtainedAt: achievement.obtainedAt ? new Date(achievement.obtainedAt) : null
            };

            const updatedAchievements = state.allAchievements.map(a =>
                a.type === updatedAchievement.type ? updatedAchievement : a
            );

            commit('setAllAchievements', updatedAchievements);
            commit('setNewAchievement', updatedAchievement);
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
