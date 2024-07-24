import {MASTER_TAG} from "@/core/services/masterService.js";
import UserModel from "@/core/models/userModel.js";

export class MasterModel {
    constructor({
                    id = MASTER_TAG,
                    inviteId = null,
                    email = '',
                    emailVerified = false,
                    jwtToken = '',
                    userData = {}
                } = {}) {
        this.id = id;
        this.inviteId = inviteId;
        this.email = email;
        this.emailVerified = emailVerified;
        this.jwtToken = jwtToken;
        this.userData = userData;

    }

    getUuid() {
        return this.userData.id;
    }

    getName() {
        return this.userData.name;
    }

    getLogin() {
        return this.userData.login;
    }

    static fromJSON(jsonString) {
        try {
            const userData = JSON.parse(jsonString);
            const { inviteId, email, emailVerified } = userData;
            return new MasterModel({ userData: userData, inviteId, email, emailVerified });
        } catch (error) {
            console.error('Error parsing JSON string:', error);
            return null;
        }
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
