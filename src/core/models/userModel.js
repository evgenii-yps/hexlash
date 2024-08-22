/**
 * Модель пользователя.
 */
export default class UserModel {
    /**
     * Конструктор для модели пользователя.
     * @param {Object} param0 - Объект с параметрами.
     * @param {string} param0.id - Идентификатор пользователя.
     * @param {string} param0.login - Логин пользователя.
     * @param {string} [param0.name='Anonymous'] - Имя пользователя.
     * @param {string} param0.avatarUrl - URL аватара пользователя.
     * @param {boolean} param0.isBlocked - Статус блокировки пользователя.
     * @param {string} param0.createdAt - Дата создания пользователя.
     * @param {string} param0.updatedAt - Дата последнего обновления пользователя.
     * @param {number} param0.balance - Игровой баланс.
     * @param {string} param0.clubId - Идентификатор клуба пользователя.
     * @param {string} param0.walletAddress - Адрес кошелька пользователя.
     * @param {string} param0.walletType - Тип кошелька пользователя.
     * @param {string} param0.walletBalance - Баланс на крипто кошельке.
     * @param {number} [param0.totalFights=0] - Общее количество боев пользователя.
     * @param {number} [param0.wins=0] - Количество побед пользователя.
     * @param {number} [param0.losses=0] - Количество поражений пользователя.
     * @param {number} [param0.draws=0] - Количество ничьих пользователя.
     * @param {number} [param0.luckPercentage=0] - Процент удачи пользователя.
     * @param {number} [param0.wonTokens=0] - Количество выигранных токенов пользователя.
     * @param {number} [param0.freeTokens=0] - Количество бесплатных токенов пользователя.
     * @param {number} [param0.lostTokens=0] - Количество потерянных токенов пользователя.
     * @param {number} [param0.invitedUsers=0] - Количество приглашённых пользователей.
     * @param {number} [param0.daysInClub=0] - Количество дней в клубе.
     * @param {number} [param0.noSkipDays=0] - Количество дней без пропусков.
     * @param {Array<number>} [param0.achievements=[]] - Список ID достижений пользователя.
     * @param {number} [param0.skin=1] - Выбранный скин пользователя

     * @param {string} [param0.inviteId] - Идентификатор приглашения. Только для текущего пользователя.
     * @param {string} [param0.email] - Электронная почта пользователя. Только для текущего пользователя.
     * @param {Array<object>} [param0.socialTasks = []] - Задачи для привязки соц сетей

     */
    constructor({
                    // Базовые
                    id,
                    login,
                    name = 'Anonymous',
                    avatarUrl,
                    isBlocked,
                    createdAt,
                    updatedAt,
                    balance, // игровой баланс

                    // Клуб
                    clubId,

                    // Кошелек
                    walletAddress,
                    walletType,
                    walletBalance,

                    // Статистика
                    totalFights = 0,
                    wins = 0,
                    losses = 0,
                    draws = 0,
                    luckPercentage = 0,
                    wonTokens = 0,
                    freeTokens = 0,
                    lostTokens = 0,
                    invitedUsers = 0,
                    daysInClub = 0,
                    noSkipDays = 0,

                    // Достижения
                    achievements = [],

                    // Выбранный скин
                    skin = 1,

                    // Только для текущего пользователя
                    inviteId,
                    email,
                    socialTasks
                }) {
        // Базовые
        this.id = id;
        this.login = login;
        this.name = name;
        this.avatarUrl = avatarUrl;
        this.isBlocked = isBlocked;
        this.createdAt = createdAt ? new Date(createdAt) : null;
        this.updatedAt = updatedAt ? new Date(updatedAt) : null;

        // Игровой баланс
        this.balance = balance;

        // Клуб
        this.clubId = clubId;

        // Кошелек
        this.walletAddress = walletAddress;
        this.walletType = walletType;
        this.walletBalance = walletBalance;

        // Статистика
        this.totalFights = totalFights;
        this.wins = wins;
        this.losses = losses;
        this.draws = draws;
        this.luckPercentage = luckPercentage;
        this.wonTokens = wonTokens;
        this.freeTokens = freeTokens;
        this.lostTokens = lostTokens;
        this.invitedUsers = invitedUsers;
        this.daysInClub = daysInClub;
        this.noSkipDays = noSkipDays;

        this.achievements = achievements;

        this.skin = skin;

        // Только для текущего пользователя
        // this.inviteId = inviteId;
        // this.email = email;
        // this.socialTasks = socialTasks;
    }
}

// Определяем enum для типа кошелька
const WalletTypes = Object.freeze({
    IMPORTED: 'IMPORTED',
    GENERATED: 'GENERATED',
});

export { UserModel, WalletTypes };
