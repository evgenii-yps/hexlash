export default class ClubModel {
    /**
     * Конструктор для модели клуба.
     * @param {Object} param0 - Объект с параметрами.
     * @param {string} param0.id - Идентификатор клуба.
     * @param {string} param0.name - Название клуба.
     * @param {string} param0.description - Описание клуба.
     * @param {string} param0.avatarUrl - URL аватара клуба.
     * @param {string} param0.owner - Идентификатор владельца клуба.
     * @param {number} [param0.income=0] - Сумма дохода клуба.
     * @param {number} [param0.battles=0] - Количество боев клуба.
     * @param {number} [param0.wins=0] - Количество выигранных боев клуба.
     * @param {number} [param0.successRate=0] - Процент удачи клуба.
     * @param {number} [param0.members=0] - Количество участников клуба.
     */
    constructor({ id, name, description, avatarUrl, owner, income = 0, battles = 0, wins = 0, successRate = 0, members = 0 }) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.avatarUrl = avatarUrl;
        this.owner = owner;
        this.income = income;
        this.battles = battles;
        this.wins = wins;
        this.successRate = successRate;
        this.members = members;
    }

    /**
     * Проверяет, является ли пользователь владельцем клуба.
     * @param {string} userId - Идентификатор пользователя.
     * @returns {boolean} - Возвращает true, если пользователь является владельцем клуба, иначе false.
     */
    isOwner(userId) {
        return this.owner === userId;
    }
}
