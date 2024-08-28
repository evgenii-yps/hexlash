export class InfoMessageModel {
    constructor({
                    text = '',
                    timeout = 2000,
                    showButton = true
                } = {}) {
        this.text = text;
        this.timeout = timeout;
        this.showButton = showButton;
    }

    // Статический метод для создания сообщения с текстом
    static withText(text) {
        return new InfoMessageModel({ text });
    }

    // Статический метод для создания сообщения с кастомным таймаутом
    static withTimeout(text, timeout) {
        return new InfoMessageModel({ text, timeout });
    }

    // Статический метод для создания сообщения без кнопки
    static withoutButton(text, timeout) {
        return new InfoMessageModel({ text, timeout, showButton: false });
    }
}
