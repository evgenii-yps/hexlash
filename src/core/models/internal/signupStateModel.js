export class SignupStateModel {
    constructor({
                    errorMessage = null,
                    generatedLogin = '',
                    generatedPassword = ''
                } = {}) {
        this.errorMessage = errorMessage;
        this.generatedLogin = generatedLogin;
        this.generatedPassword = generatedPassword;
    }

}
