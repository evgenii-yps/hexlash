import { createStore } from 'vuex';
import user from '@/core/state/modules/user.js';
import auth from "@/core/state/modules/auth.js";

export default createStore({
    modules: {
        auth,
        user,
    },
});