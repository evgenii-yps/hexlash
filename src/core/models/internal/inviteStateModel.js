export class InviteStateModel {
    constructor({
                    loading = false,
                    errorMessage = null,
                    generatedLogin = '',
                    generatedPassword = ''
                } = {}) {
        this.loading = loading;
        this.errorMessage = errorMessage;
        this.generatedLogin = generatedLogin;
        this.generatedPassword = generatedPassword;
    }

}
