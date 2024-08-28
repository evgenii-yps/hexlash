import {MASTER_TAG} from "@/core/database/masterRepository.js";


export class MasterModel {
    constructor({
                    id = MASTER_TAG,
                    inviteId = null,
                    email = '',
                    language = 'en',
                    jwtToken = '',
                    userData = {}
                } = {}) {
        this.id = id;
        this.inviteId = inviteId;
        this.email = email;
        this.language = language;
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

    getBalance(){
        return (this.userData.balance / 100).toFixed(2);
    }

    static fromJSON(jsonString) {
        try {
            const userData = JSON.parse(jsonString);
            const { inviteId, email } = userData;

            // Удаляем поля из userData, чтобы не передавать их в MasterModel
            delete userData.inviteId;
            delete userData.email;

            // Возвращаем объект MasterModel и массив socialTasks
            return new MasterModel({
                userData: userData,
                inviteId,
                email,
            });

        } catch (error) {
            console.error('Error parsing JSON string:', error);
            return null;
        }
    }

}

