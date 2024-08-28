export class AuthStateModel {
    constructor({
                    authError = null,
                    isAuthenticated = false
                } = {}) {
        this.authError = authError;
        this.isAuthenticated = isAuthenticated;
    }

    // Метод для удобного создания объекта с указанным значением isAuthenticated
    static Authenticated(isAuthenticated = false) {
        return new AuthStateModel({ isAuthenticated });
    }

    static Error(authError) {
        return new AuthStateModel({ authError });
    }
}