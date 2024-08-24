export class SocialTaskModel {
    constructor({
                    id = null,
                    title = '',
                    description = '',
                    link = '',
                    tokens = 0,
                    isCompleted = false,
                    category = ''
                } = {}) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.link = link;
        this.tokens = tokens;
        this.isCompleted = isCompleted;
        this.category = category;
    }

    // Статический метод для создания модели из JSON строки
    static fromJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            const { id, title, description, link, tokens, isCompleted, category } = data;

            return new SocialTaskModel({
                id,
                title,
                description,
                link,
                tokens,
                isCompleted,
                category
            });

        } catch (error) {
            console.error('Error parsing JSON string:', error);
            return null;
        }
    }
}
