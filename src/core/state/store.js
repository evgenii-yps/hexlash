import { createStore } from 'vuex';
import user from '@/core/state/modules/userState.js';
import auth from "@/core/state/modules/authState.js";

export default createStore({
    modules: {
        auth,
        user,
    },
});