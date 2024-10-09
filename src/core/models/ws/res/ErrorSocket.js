export class ErrorSocketResponse {
    static TYPE_NAME = "ErrorMsg";

    constructor({
                    code = 0,
                    message = ""
                } = {}) {
        this.code = code;
        this.message = message;
    }

    // Статический метод для создания модели из JSON строки
    static fromJSON(json) {
        const { code, message } = json;
        return new ErrorSocketResponse({
            code,
            message
        });
    }
}