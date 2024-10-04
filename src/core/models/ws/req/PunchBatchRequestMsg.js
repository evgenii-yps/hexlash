import {WsBase} from "@/core/models/ws/WsBase.js";

export class PunchBatchRequestMsg extends WsBase {
    static TYPE_NAME = "PunchBatchRequestMsg";

    constructor(amount) {
        super();
        this.type = PunchBatchRequestMsg.TYPE_NAME;
        this.punchBatchRequest = {count: amount};
    }
}