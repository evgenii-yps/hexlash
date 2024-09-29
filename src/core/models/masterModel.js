import {MASTER_TAG} from "@/core/database/masterRepository.js";
import {DECIMALS} from "@/core/constants.js";
import {locale} from "@/main.js";


export class MasterModel {
    constructor({
                    id = MASTER_TAG,
                    inviteId = null,
                    email = '',
                    language = locale,
                    initialVerified = false,
                    userData = {}
                } = {}) {
        this.id = id;
        this.inviteId = inviteId;
        this.email = email;
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

   /* static fromJSONString(jsonString) {
        try {
            const userData = JSON.parse(jsonString);
            const {inviteId, email, initialVerified} = userData;

            // Удаляем поля из userData, чтобы не передавать их в MasterModel
            delete userData.inviteId;
            delete userData.email;
            delete userData.initialVerified;

            // Возвращаем объект MasterModel и массив socialTasks
            return new MasterModel({
                userData: userData,
                inviteId,
                email,
                initialVerified,
            });

        } catch (error) {
            console.error('Error parsing JSON string:', error);
            return null;
        }
    }*/

    static fromJSON(json) {
        try {
            const userData = json;
            const {inviteId, email, initialVerified} = userData;

            // Удаляем поля из userData, чтобы не передавать их в MasterModel
            delete userData.inviteId;
            delete userData.email;
            delete userData.initialVerified;

            return new MasterModel({
                userData: userData,
                inviteId,
                email,
                initialVerified
            });


        } catch (error) {
            console.error('Error parsing JSON string:', error);
            return null;
        }
    }



}

