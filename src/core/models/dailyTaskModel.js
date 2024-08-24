export class DailyTaskModel {
    constructor({
                    id = null,
                    description = '',
                    tokens = 0,
                    isCompleted = false,
                    link = '',
                    category = '',
                    value = null
                } = {}) {
        this.id = id;
        this.description = description;
        this.tokens = tokens;
        this.isCompleted = isCompleted;
        this.link = link;
        this.category = category;
        this.value = value;
    }

    // Статический метод для создания модели из JSON строки
    static fromJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            const { id, description, tokens, isCompleted, link, category, value } = data;

            return new DailyTaskModel({
                id,
                description,
                tokens,
                isCompleted,
                link,
                category,
                value
            });

        } catch (error) {
            console.error('Error parsing JSON string:', error);
            return null;
        }
    }
}
