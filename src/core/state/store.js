import { createStore } from 'vuex';
import master from "@/core/state/modules/masterState.js";
import contract from "@/core/state/modules/contractState.js";
import webSocket from "@/core/state/modules/webSocketState.js";

export default createStore({
    modules: {
        master,
        contract,
        webSocket,
    },
});
