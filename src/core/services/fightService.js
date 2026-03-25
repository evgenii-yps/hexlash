import {FightModel} from "@/core/models/fightModel.js";
import store from "@/core/state/store.js";
import {updateFightToLocalDB} from "@/core/database/fightRepository.js";

/**
 * Fight service - kept for WebSocket message handling.
 * Old PvP fight functions removed (card-based combat uses client-side simulation).
 */

export const receiveFightInfo = async (fightInfo) => {
    try {
        const master = store.getters['master/getMaster'];
        if (![fightInfo.fighterOne, fightInfo.fighterTwo].includes(master.userData.id)) {
            throw new Error('You are not a participant in this fight');
        }

        await updateFightToLocalDB(fightInfo);

    } catch (error) {
        console.error('Failed to process fight info:', error);
    }
};
