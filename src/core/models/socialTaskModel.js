
import iEmail from "@/assets/images/icon_invites.svg";
import iTelegram from "@/assets/images/icon_telega.svg";
import iX from "@/assets/images/icon_x.svg";
import iYoutube from "@/assets/images/icon_yout.svg";
import iDiscord from "@/assets/images/icon_disc.svg";
import iInsta from "@/assets/images/icon_insta.svg";

const categoryIcons = [
    {category: 'TASK_CONFIRM_EMAIL', icon: iEmail},
    {category: 'SUBSCRIBE_TELEGRAM', icon: iTelegram},
    {category: 'SUBSCRIBE_X', icon: iX},
    {category: 'SUBSCRIBE_YOUTUBE', icon: iYoutube},
    {category: 'SUBSCRIBE_DISCORD', icon: iDiscord},
    {category: 'SUBSCRIBE_INSTAGRAM', icon: iInsta},
];



export class SocialTaskModel {
    static TYPE_NAME = "TaskResponseMsg";


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

    getIcon() {
        const categoryIcon = categoryIcons.find(item => item.category === this.category);
        return categoryIcon ? categoryIcon.icon : null; // Возвращаем null, если иконка не найдена
    }

    // Статический метод для создания модели из JSON строки
    static fromJSON(data) {
        try {
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
