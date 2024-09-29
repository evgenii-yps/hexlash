export class LoginStateModel {
    constructor({
                    authError = null,
                    isAuthenticated = false
                } = {}) {
        this.authError = authError;
        this.isAuthenticated = isAuthenticated;
    }
}