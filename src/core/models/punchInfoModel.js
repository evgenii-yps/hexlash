
export class PunchInfoModel {
    static TYPE_NAME = "PunchInfoResponseMsg";

    constructor({
                    intervalStartMs = null,
                    intervalWaitTimeMs = null,
                    punchCounter = 1000,
                    punchCounterMaxPerInterval = 10000
                } = {}) {
        this.intervalStartMs = intervalStartMs;
        this.intervalWaitTimeMs = intervalWaitTimeMs;
        this.punchCounter = punchCounter;
        this.punchCounterMaxPerInterval = punchCounterMaxPerInterval;
    }


    // Геттер для вычисления достижения лимита ударов
    get isLimitReach() {
        return this.punchCounter >= this.punchCounterMaxPerInterval;
    }

    // Статический метод для создания модели из JSON строки
    static fromJSON(json) {
        const { intervalStartMs, intervalWaitTimeMs, punchCounter, punchCounterMaxPerInterval } = json;
        return new PunchInfoModel({
            intervalStartMs,
            intervalWaitTimeMs,
            punchCounter,
            punchCounterMaxPerInterval,
        });
    }
}
