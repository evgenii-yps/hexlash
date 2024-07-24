import { createStore } from 'vuex';
import user from '@/core/state/modules/userState.js';
import master from "@/core/state/modules/masterState.js";
import club from "@/core/state/modules/clubState.js";

export default createStore({
    modules: {
        master,
        user,
        club
    },
});