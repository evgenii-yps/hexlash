import WalletModel from './wallet.js';
import ParamsModel from './params.js';
import ClubModel from './club.js';
import {initializeAchievements} from "@/core/services/achievementsService.js";

export class CurrentUserModel {
    constructor({
                    id = null,
                    inviteId = null,
                    login = '',
                    name = 'Anonymous',
                    imageUrl = '',
                    email = '',
                    emailVerified = false,
                    initialVerified = false,
                    isBlocked = false,
                    createdAt = null,
                    updatedAt = null,
                    wallet = {},
                    params = {},
                    club = {},
                    jwtToken = '',
                    stats = {},
                    achievements = []
                } = {}) {
        this.id = id;
        this.inviteId = inviteId;
        this.login = login;
        this.name = name;
        this.imageUrl = imageUrl;
        this.email = email;
        this.emailVerified = emailVerified;
        this.initialVerified = initialVerified;
        this.isBlocked = isBlocked;
        this.createdAt = createdAt ? new Date(createdAt) : null;
        this.updatedAt = updatedAt ? new Date(updatedAt) : null;

        this.jwtToken = jwtToken;
        this.wallet = wallet ? new WalletModel(wallet) : null;
        this.params = params ? new ParamsModel(params) : null;
        this.club = club ? new ClubModel(club) : null;

        this.stats = stats ? new StatsModel(stats) : null;
        this.achievements = achievements.map(achievement => new AchievementModel(achievement));

    }

    // Method to get the display name of the user
    getDisplayName() {
        return `${this.name} (${this.login})`;
    }

}


class StatsModel {
    constructor({
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
                    noSkipDays = 0
                } = {}) {
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
    }
}

export class AchievementModel {
    constructor({
                    id = 0,
                    title = '',
                    icon = '',
                    completed = false,
                    description = '',
                    show = false
                } = {}) {
        this.id = id;
        this.title = title;
        this.icon = icon;
        this.completed = completed;
        this.description = description;
        this.show = show;
    }
}
