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
     * @param {String} [param0.skin=""] - Выбранный скин пользователя

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
                    clubRole,

                    // Кошелек
                    walletAddress,

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
                    skin = "skin_m_1.png",

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
        this.clubRole = clubRole;

        // Кошелек
        this.walletAddress = walletAddress;

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

    }


    static fromJSON(json) {
        try {
            // Извлекаем данные из JSON
            const {
                id,
                login,
                name = 'Anonymous',
                avatarUrl = "",
                isBlocked,
                createdAt,
                updatedAt,
                balance = 0,
                clubId,
                clubRole,
                walletAddress,
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
                achievements = [],
                skin = "skin_m_1.png",
            } = json;

            // Возвращаем новый экземпляр UserModel
            return new UserModel({
                id,
                login,
                name,
                avatarUrl,
                isBlocked,
                createdAt,
                updatedAt,
                balance,
                clubId,
                clubRole,
                walletAddress,
                totalFights,
                wins,
                losses,
                draws,
                luckPercentage,
                wonTokens,
                freeTokens,
                lostTokens,
                invitedUsers,
                daysInClub,
                noSkipDays,
                achievements,
                skin,
            });
        } catch (error) {
            console.error('Error parsing JSON to UserModel:', error);
            return null;
        }
    }
}


