export default class ParamsModel {
    constructor({ id, level, scores, balance, user }) {
        this.id = id;
        this.level = level;
        this.scores = scores;
        this.balance = balance;
        //this.user = user; TODO user ID link
    }
}