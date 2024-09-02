export class PasswordResetStateModel {
    constructor({
                    loading = false,
                    successMessage = '',
                    errorMessage = null
                } = {}) {
        this.loading = loading;
        this.successMessage = successMessage;
        this.errorMessage = errorMessage;
    }

    // Метод для создания объекта в состоянии загрузки
    static Loading(loading = true) {
        return new PasswordResetStateModel({ loading });
    }

    // Метод для создания объекта с успешным сообщением
    static Success(successMessage) {
        return new PasswordResetStateModel({ successMessage });
    }

    // Метод для создания объекта с сообщением об ошибке
    static Error(errorMessage) {
        return new PasswordResetStateModel({ errorMessage });
    }

    // Метод для сброса состояния
    static Reset() {
        return new PasswordResetStateModel();
    }
}
