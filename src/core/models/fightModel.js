export class FightModel {
    constructor({
                    id = null,
                    fighterOne = null,
                    fighterTwo = null,
                    fighterOneActions = [],
                    fighterTwoActions = [],
                    winnerId = null,
                    fightDate = new Date(),
                    bet = 0,
                    duration = 0,
                    actions = 0,
                    isCompleted = false,
                } = {}) {
        this.id = id;
        this.fighterOne = fighterOne;
        this.fighterTwo = fighterTwo;
        this.fighterOneActions = fighterOneActions;
        this.fighterTwoActions = fighterTwoActions;
        this.winnerId = winnerId;
        this.fightDate = fightDate;
        this.bet = bet;
        this.duration = duration;
        this.actions = actions;
        this.isCompleted = isCompleted;
    }

    // Статический метод для создания модели из JSON строки
    static FromJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            const {
                id,
                fighterOne,
                fighterTwo,
                fighterOneActions,
                fighterTwoActions,
                winnerId,
                fightDate,
                bet,
                duration,
                actions,
                isCompleted,
            } = data;

            return new FightModel({
                id,
                fighterOne,
                fighterTwo,
                fighterOneActions,
                fighterTwoActions,
                winnerId,
                fightDate: new Date(fightDate),
                bet,
                duration,
                actions,
                isCompleted
            });

        } catch (error) {
            console.error('Error parsing JSON string:', error);
            return null;
        }
    }
}
