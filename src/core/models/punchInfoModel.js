export class PunchInfoModel {
    static TYPE_NAME = "PunchInfoResponseMsg";

    constructor({
                    intervalStartMs = null,
                    intervalWaitTimeMs = null,
                    punchAmount = 1000,
                    punchCounterMaxPerInterval = 10000,
                    punchCounterMaxPerBatch = 10000,
                    punchCount
                } = {}) {
        this.intervalStartMs = intervalStartMs;
        this.intervalWaitTimeMs = intervalWaitTimeMs;
        this.punchAmount = punchAmount;
        this.punchAmountMaxPerInterval = punchCounterMaxPerInterval;
        this.punchCounterMaxPerBatch = punchCounterMaxPerBatch;
        this.punchCount = punchCount;
    }


    // Геттер для вычисления достижения лимита ударов
    get isLimitReach() {
        return this.punchAmount >= this.punchAmountMaxPerInterval;
    }

    // Статический метод для создания модели из JSON строки
    static fromJSON(json) {
        const {
            intervalStartMs,
            intervalWaitTimeMs,
            punchAmount,
            punchCounterMaxPerInterval,
            punchCounterMaxPerBatch,
            punchCount
        } = json;

        return new PunchInfoModel({
            intervalStartMs,
            intervalWaitTimeMs,
            punchAmount,
            punchCounterMaxPerInterval,
            punchCounterMaxPerBatch,
            punchCount
        });
    }
}
