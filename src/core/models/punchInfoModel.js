export class PunchInfoModel {
    constructor({
                    unixTimeStart = null,
                    waitRateIntervalTime = null,
                    punchCounter = 1000,
                    punchCounterMaxPerRate = 10000
                } = {}) {
        this.unixTimeStart = unixTimeStart;
        this.waitRateIntervalTime = waitRateIntervalTime;
        this.punchCounter = punchCounter;
        this.punchCounterMaxPerRate = punchCounterMaxPerRate;
    }

    // Геттер для вычисления достижения лимита ударов
    get isLimitReach() {
        return this.punchCounter >= this.punchCounterMaxPerRate;
    }

    // Статический метод для создания модели из JSON строки
    static fromJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            const { unixTimeStart, waitRateIntervalTime, punchCounter, punchCounterMaxPerRate } = data;

            return new PunchInfoModel({
                unixTimeStart,
                waitRateIntervalTime,
                punchCounter,
                punchCounterMaxPerRate,
            });

        } catch (error) {
            console.error('Error parsing JSON string:', error);
            return null;
        }
    }
}
