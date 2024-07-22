import { createStore } from 'vuex';
import user from '@/core/state/modules/userState.js';
import auth from "@/core/state/modules/authState.js";
import club from "@/core/state/modules/clubState.js";

export default createStore({
    modules: {
        auth,
        user,
        club
    },
});