import { createStore } from 'vuex';
import user from '@/core/state/modules/userState.js';
import master from "@/core/state/modules/masterState.js";
import club from "@/core/state/modules/clubState.js";
import task from "@/core/state/modules/taskState.js";
import punch from "@/core/state/modules/punchState.js";

export default createStore({
    modules: {
        master,
        user,
        club,
        task,
        punch
    },
});