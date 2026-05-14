import {MASTER_TAG} from "@/core/database/masterRepository.js";
import {DECIMALS} from "@/core/constants.js";


export class MasterModel {
    static TYPE_NAME = "UserResponseMsg";

    constructor({
                    id = MASTER_TAG,
                    inviteId = null,
                    email = '',
                    emailVerified = false,
                    // Phase 1.5c — English-only. Default preserved для backward
                    // compatibility of any persisted MasterModel records; BE
                    // User.language field stays но FE no longer reads/writes it.
                    language = 'en',
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
        return (this.userData.balance / (10 ** DECIMALS)).toFixed(2);
    }

    static fromJSON(json) {
        try {
            const userData = json;
            const {inviteId, email, emailVerified, initialVerified, language} = userData;

            // Удаляем поля из userData, чтобы не передавать их в MasterModel
            delete userData.inviteId;
            delete userData.email;
            delete userData.emailVerified;
            delete userData.initialVerified;
            delete userData.language;

            return new MasterModel({
                userData: userData,
                inviteId,
                email,
                emailVerified,
                initialVerified,
                language
            });


        } catch (error) {
            console.error('Error parsing JSON string:', error);
            return null;
        }
    }



}

