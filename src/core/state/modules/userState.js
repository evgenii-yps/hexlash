
import UserModel from '@/core/models/userModel.js';
import {MasterModel} from "@/core/models/masterModel.js";

const state = {
    selectedUser: null,
};

const getters = {
    getSelectedUser: (state) => state.selectedUser,
};

const mutations = {
    setUser: (state, userModel) => {
        state.selectedUser = userModel;
    },
};

const actions = {


};

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};
