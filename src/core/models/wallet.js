export default class WalletModel {
    constructor({ id, createdAt, platform, walletName, walletAddress, user }) {
        this.id = id;
        this.createdAt = createdAt ? new Date(createdAt) : null;
        this.platform = platform;
        this.walletName = walletName;
        this.walletAddress = walletAddress;
        //this.user = user; TODO user ID link
    }
}