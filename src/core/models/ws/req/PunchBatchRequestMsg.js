import {WsBase} from "@/core/models/ws/WsBase.js";

export class PunchBatchRequestMsg extends WsBase {
    static TYPE_NAME = "PunchBatchRequestMsg";

    constructor(amount, count) {
        super();
        this.type = PunchBatchRequestMsg.TYPE_NAME;
        this.punchBatchRequest = {amount: amount, count: count};
    }
}


export class PunchInfoRequestMsg extends WsBase {
    static TYPE_NAME = "PunchInfoRequestMsg";

    constructor() {
        super();
        this.type = PunchInfoRequestMsg.TYPE_NAME;
    }
}