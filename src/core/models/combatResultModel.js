export class RoundResult {
    constructor({
        roundNum,
        card1,
        card2,
        damage1 = 0,
        damage2 = 0,
        hp1After,
        hp2After,
        events = [],
    } = {}) {
        this.roundNum = roundNum;
        this.card1 = card1;   // CardModel used by fighter 1
        this.card2 = card2;   // CardModel used by fighter 2
        this.damage1 = damage1; // damage dealt TO fighter 1
        this.damage2 = damage2; // damage dealt TO fighter 2
        this.hp1After = hp1After;
        this.hp2After = hp2After;
        this.events = events;   // ['blocked', 'counter', 'healed', 'buffed', etc.]
    }
}

export class CombatResultModel {
    constructor({
        rounds = [],
        winnerId = null,
        isDraw = false,
        fighter1FinalHP = 0,
        fighter2FinalHP = 0,
        totalRounds = 0,
    } = {}) {
        this.rounds = rounds;
        this.winnerId = winnerId;
        this.isDraw = isDraw;
        this.fighter1FinalHP = fighter1FinalHP;
        this.fighter2FinalHP = fighter2FinalHP;
        this.totalRounds = totalRounds;
    }

    getStats(fighterIndex) {
        const isF1 = fighterIndex === 0;
        let totalDamageDealt = 0;
        let totalDamageBlocked = 0;
        let cardsUsed = new Set();

        for (const round of this.rounds) {
            const card = isF1 ? round.card1 : round.card2;
            const damageDealt = isF1 ? round.damage2 : round.damage1;
            cardsUsed.add(card.id);
            totalDamageDealt += damageDealt;

            if (card.isDefense && card.isDefense()) {
                const damageTaken = isF1 ? round.damage1 : round.damage2;
                const opponentCard = isF1 ? round.card2 : round.card1;
                if (opponentCard.isAttack && opponentCard.isAttack()) {
                    totalDamageBlocked += Math.max(0, opponentCard.power - damageTaken);
                }
            }
        }

        return {
            totalDamageDealt,
            totalDamageBlocked,
            cardsUsed: cardsUsed.size,
            roundsPlayed: this.totalRounds,
        };
    }
}
