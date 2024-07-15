import WalletModel from './wallet.js';
import ParamsModel from './params.js';
import ClubModel from './club.js';

export default class UserModel {
    constructor({
                    id,
                    login,
                    name,
                    imageUrl,
                    isBlocked,
                    createdAt,
                    updatedAt,
                    wallet,
                    params,
                    club
                }) {
        this.id = id;
        this.login = login;
        this.name = name;
        this.imageUrl = imageUrl;
        this.isBlocked = isBlocked;
        this.createdAt = createdAt ? new Date(createdAt) : null;
        this.updatedAt = updatedAt ? new Date(updatedAt) : null;
        this.wallet = wallet ? new WalletModel(wallet) : null;
        this.params = params ? new ParamsModel(params) : null;
        this.club = club ? new ClubModel(club) : null;
    }
}