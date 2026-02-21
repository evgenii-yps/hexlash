export class CardModel {
    constructor({
        id,
        name,
        type,
        target,
        power = 0,
        priority = 5,
        cooldown = 0,
        rarity = 'common',
        conditions = [],
        description = '',
        effect = null,
    } = {}) {
        this.id = id;
        this.name = name;
        this.type = type;       // attack | defense | special
        this.target = target;   // head | body | both | self
        this.power = power;
        this.priority = priority;
        this.cooldown = cooldown;
        this.rarity = rarity;
        this.conditions = conditions;
        this.description = description;
        this.effect = effect;   // counter | heal | buff_attack | buff_defense | null
    }

    static fromJSON(json) {
        try {
            return new CardModel(json);
        } catch (error) {
            console.error('Error parsing card JSON:', error);
            return null;
        }
    }

    isAttack() {
        return this.type === 'attack';
    }

    isDefense() {
        return this.type === 'defense';
    }

    isSpecial() {
        return this.type === 'special';
    }
}
