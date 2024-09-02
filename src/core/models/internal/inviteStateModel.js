export class InviteStateModel {
    constructor({
                    loading = false,
                    errorMessage = null,
                    jwtToken = '',
                    generatedLogin = '',
                    generatedPassword = ''
                } = {}) {
        this.loading = loading;
        this.errorMessage = errorMessage;
        this.jwtToken = jwtToken;
        this.generatedLogin = generatedLogin;
        this.generatedPassword = generatedPassword;
    }

    // Метод для создания объекта в состоянии загрузки
    static Loading(loading = true) {
        return new InviteStateModel({ loading });
    }

    // Метод для создания объекта с успешным сообщением
    static Success(jwtToken, generatedLogin, generatedPassword) {
        return new InviteStateModel({
            jwtToken,
            generatedLogin,
            generatedPassword
        });
    }

    // Метод для создания объекта с сообщением об ошибке
    static Error(errorMessage) {
        return new InviteStateModel({ errorMessage });
    }

    // Метод для сброса состояния
    static Reset() {
        return new InviteStateModel();
    }
}
