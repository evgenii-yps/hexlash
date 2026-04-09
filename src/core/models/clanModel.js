import {DECIMALS} from "@/core/constants.js";

export default class ClanModel {
    /**
     * Конструктор для модели клана.
     * @param {Object} param0 - Объект с параметрами.
     * @param {string} param0.id - Идентификатор клана.
     * @param {string} param0.name - Название клана.
     * @param {string} param0.description - Описание клана.
     * @param {string} param0.avatarUrl - URL аватара клана.
     * @param {string} param0.owner - Идентификатор владельца клана.
     * @param {number} [param0.balance=0] - Сумма на балансе клана.
     * @param {number} [param0.battles=0] - Количество боев клана.
     * @param {number} [param0.wins=0] - Количество выигранных боев клана.
     * @param {number} [param0.isPublic=true] - .
     * @param {number} [param0.members=0] - Количество участников клана.
     */
    constructor({ id, name, description, avatarUrl, owner, balance = 0, battles = 0, wins = 0, isPublic = true, members = 0, maxMembers = 20, level = 1, xp = 0 }) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.avatarUrl = avatarUrl;
        this.owner = owner;
        this.balance = balance;
        this.battles = battles;
        this.wins = wins;
        this.isPublic = isPublic;
        this.members = members;
        this.maxMembers = maxMembers;
        this.level = level;
        this.xp = xp;
    }

    isOwner(userId) {
        return this.owner === userId;
    }

    getBalance() {
        return (this.balance / (10 ** DECIMALS)).toFixed(2);
    }

    /**
     * Создает экземпляр ClanModel из JSON-объекта.
     * @param {Object} json - JSON-объект с данными клана.
     * @returns {ClanModel|null} - Возвращает объект ClanModel или null в случае ошибки.
     */
    static fromJSON(json) {
        try {
            const { id, name, description, avatarUrl, owner, balance = 0, battles = 0, wins = 0, isPublic = true, members = 0, maxMembers = 20, level = 1, xp = 0 } = json;

            return new ClanModel({
                id,
                name,
                description,
                avatarUrl,
                owner,
                balance,
                battles,
                wins,
                isPublic,
                members,
                maxMembers,
                level,
                xp
            });
        } catch (error) {
            console.error('Error parsing JSON to ClanModel:', error);
            return null;
        }
    }
}
