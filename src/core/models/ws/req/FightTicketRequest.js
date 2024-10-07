import {WsBase} from "@/core/models/ws/WsBase.js";

export class FightTicketMsg extends WsBase {
    static TYPE_NAME = "FightTicketMsg";

    constructor(bet, actionsNum, durationSec) {
        super();
        this.type = FightTicketMsg.TYPE_NAME;
        this.fightTicketRequest = {bet: bet, actionsNum: actionsNum, durationSec: durationSec};
    }
}

export class FightActionMsg extends WsBase {
    static TYPE_NAME = "FightActionMsg";

    constructor(fightId, fightAction) {
        super();
        this.type = FightActionMsg.TYPE_NAME;
        this.fightActionRequest = {fightAction: fightAction, fightId: fightId};
    }
}