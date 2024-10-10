export class SignupStateModel {
    constructor({
                    errorMessage = null,
                    generatedLogin = '',
                    generatedPassword = '',
                    name = ''
                } = {}) {
        this.errorMessage = errorMessage;
        this.generatedLogin = generatedLogin;
        this.generatedPassword = generatedPassword;
        this.name = name
    }

}
