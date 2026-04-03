import { createStore } from 'vuex';
import user from '@/core/state/modules/userState.js';
import master from "@/core/state/modules/masterState.js";
import club from "@/core/state/modules/clubState.js";
import task from "@/core/state/modules/taskState.js";
import punch from "@/core/state/modules/punchState.js";
import cardFight from "@/core/state/modules/cardFightState.js";
import contract from "@/core/state/modules/contractState.js";
import webSocket from "@/core/state/modules/webSocketState.js";
import achievement from "@/core/state/modules/achievementState.js";
import progression from "@/core/state/modules/progressionState.js";
import clubMode from "@/core/state/modules/clubModeState.js";
import friends from "@/core/state/modules/friendsState.js";
import pvp from "@/core/state/modules/pvpState.js";
import agent from "@/core/state/modules/agentState.js";

export default createStore({
    modules: {
        master,
        user,
        club,
        task,
        punch,
        fight: cardFight,
        contract,
        webSocket,
        achievement,
        progression,
        clubMode,
        friends,
        pvp,
        agent,
    },
});