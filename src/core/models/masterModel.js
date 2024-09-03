import {MASTER_TAG} from "@/core/database/masterRepository.js";
import {DECIMALS} from "@/core/constants.js";
import {locale} from "@/main.js";


export class MasterModel {
    constructor({
                    id = MASTER_TAG,
                    inviteId = null,
                    email = '',
                    language = locale,
                    jwtToken = '',
                    isInitialize = false,
                    userData = {}
                } = {}) {
        this.id = id;
        this.inviteId = inviteId;
        this.email = email;
        this.language = language;
        this.jwtToken = jwtToken;
        this.isInitialize = isInitialize;
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

    getBalance() {
        return (this.userData.balance / (10 ** DECIMALS)).toFixed(DECIMALS);
    }

    static fromJSON(jsonString) {
        try {
            const userData = JSON.parse(jsonString);
            const {inviteId, email, isInitialize} = userData;

            // Удаляем поля из userData, чтобы не передавать их в MasterModel
            delete userData.inviteId;
            delete userData.email;

            // Возвращаем объект MasterModel и массив socialTasks
            return new MasterModel({
                userData: userData,
                inviteId,
                email,
                isInitialize,
            });

        } catch (error) {
            console.error('Error parsing JSON string:', error);
            return null;
        }
    }

}

