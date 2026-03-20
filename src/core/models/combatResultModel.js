export class RoundResult {
    constructor({
        roundNum,
        action1,
        action2,
        damage1 = 0,
        damage2 = 0,
        hp1After,
        hp2After,
        events = [],
        move1 = null,
        move2 = null,
        isOverdrive = false,
    } = {}) {
        this.roundNum = roundNum;
        this.action1 = action1;   // 'attack' | 'defense' | 'position'
        this.action2 = action2;
        this.damage1 = damage1;   // damage dealt TO fighter 1
        this.damage2 = damage2;   // damage dealt TO fighter 2
        this.hp1After = hp1After;
        this.hp2After = hp2After;
        this.events = events;
        this.move1 = move1;       // { id, damage, speed, branch, level } or null
        this.move2 = move2;
        this.isOverdrive = isOverdrive;
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
        let actionsUsed = { attack: 0, defense: 0, position: 0 };

        for (const round of this.rounds) {
            const action = isF1 ? round.action1 : round.action2;
            const damageDealt = isF1 ? round.damage2 : round.damage1;
            totalDamageDealt += damageDealt;

            if (action) actionsUsed[action] = (actionsUsed[action] || 0) + 1;

            if (action === 'defense') {
                const blockedEvents = round.events.filter(
                    e => e.fighter === (isF1 ? 2 : 1) && e.type === 'block'
                );
                for (const evt of blockedEvents) {
                    totalDamageBlocked += evt.value;
                }
            }
        }

        return {
            totalDamageDealt,
            totalDamageBlocked,
            actionsUsed,
            roundsPlayed: this.totalRounds,
        };
    }
}
