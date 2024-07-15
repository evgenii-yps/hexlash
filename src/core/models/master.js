import WalletModel from './wallet.js';
import ParamsModel from './params.js';
import ClubModel from './club.js';

export default class MasterModel {
    constructor({
                    id,
                    inviteId,
                    login,
                    name,
                    imageUrl,
                    email,
                    emailVerified,
                    initialVerified,
                    isBlocked,
                    createdAt,
                    updatedAt,
                    wallet,
                    params,
                    club,
                    jwtToken
                }) {
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
    }

    // Method to get the display name of the user
    getDisplayName() {
        return `${this.name} (${this.login})`;
    }

    // Additional methods to handle user data can be added here
}
