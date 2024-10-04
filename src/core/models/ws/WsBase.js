export class WsBase {
    constructor(id = crypto.randomUUID(), timestamp = Date.now()) {
        this.id = id;
        this.timestamp = timestamp;
    }
}