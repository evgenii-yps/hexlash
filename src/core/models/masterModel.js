import {MASTER_TAG} from "@/core/database/masterRepository.js";
import {DECIMALS} from "@/core/constants.js";
import {locale} from "@/main.js";


export class MasterModel {
    constructor({
                    id = MASTER_TAG,
                    inviteId = null,
                    email = '',
                    emailVerified = false,
                    language = locale,
                    initialVerified = false,
                    userData = {}
                } = {}) {
        this.id = id;
        this.inviteId = inviteId;
        this.email = email;
        this.emailVerified = emailVerified;
        this.userData = userData;
        this.language = language;

        this.initialVerified = initialVerified;
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

    getBalance() {
        return (this.userData.balance / (10 ** DECIMALS)).toFixed(DECIMALS);
    }

    static fromJSON(json) {
        try {
            const userData = json;
            const {inviteId, email, emailVerified, initialVerified} = userData;

            // Удаляем поля из userData, чтобы не передавать их в MasterModel
            delete userData.inviteId;
            delete userData.email;
            delete userData.emailVerified;
            delete userData.initialVerified;

            return new MasterModel({
                userData: userData,
                inviteId,
                email,
                emailVerified,
                initialVerified,
            });


        } catch (error) {
            console.error('Error parsing JSON string:', error);
            return null;
        }
    }



}

