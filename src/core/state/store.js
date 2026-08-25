import { createStore } from 'vuex';
import master from "@/core/state/modules/masterState.js";
import contract from "@/core/state/modules/contractState.js";
import webSocket from "@/core/state/modules/webSocketState.js";
import prefight from "@/core/state/modules/prefightState.js";
import roster from "@/core/state/modules/rosterState.js";

export default createStore({
    modules: {
        master,
        contract,
        webSocket,
        prefight,
        roster,
    },
});
