export class FightModel {

    static TYPE_NAME = "FightInfoMsg";

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
    static fromJSON(fightInfo) {
        try {
            const {
                fightId,
                fighterOneId: fighterOne,
                fighterTwoId: fighterTwo,
                fighterOneActions,
                fighterTwoActions,
                winnerId,
                bet,
                actionsNum: actions,
                durationSec: duration,
                finished: isCompleted,
                createdAt: fightDate
            } = fightInfo;

            return new FightModel({
                id:fightId,
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
            console.error('Error parsing JSON response:', error);
            return null;
        }
    }
}
