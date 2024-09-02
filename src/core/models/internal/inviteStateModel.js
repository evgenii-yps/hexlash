export class InviteStateModel {
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
        return new InviteStateModel({ loading });
    }

    // Метод для создания объекта с успешным сообщением
    static Success(successMessage) {
        return new InviteStateModel({ successMessage });
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
