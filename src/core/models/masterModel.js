import {MASTER_TAG} from "@/core/database/masterRepository.js";


export class MasterModel {
    constructor({
                    id = MASTER_TAG,
                    inviteId = null,
                    email = '',
                    jwtToken = '',
                    userData = {}
                } = {}) {
        this.id = id;
        this.inviteId = inviteId;
        this.email = email;

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

