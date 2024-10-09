export class ErrorMessageModel {
    constructor({
                    text = '',
                    timeout = 2000,
                    showButton = false
                } = {}) {
        this.text = text;
        this.timeout = timeout;
        this.showButton = showButton;
    }

    static withText(text) {
        return new ErrorMessageModel({ text, showButton: true });
    }

    static withTimeout(text, timeout) {
        return new ErrorMessageModel({ text, timeout, showButton: true });
    }

    static withoutButton(text, timeout) {
        return new ErrorMessageModel({ text, timeout, showButton: false });
    }
}
