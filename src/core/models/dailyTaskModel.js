import iFights from "@/assets/images/icon_fights.svg"
import iTrainings from "@/assets/images/icon_trainings.svg"
import iComment from "@/assets/images/icon_invites.svg"
import iArrow from "@/assets/images/icon_arrow.svg"
import iWin from "@/assets/images/icon_wins.svg"
import iInvite from "@/assets/images/icon_members.svg"
import iEarn from "@/assets/images/icon_token_less.svg"
import iCalendar from "@/assets/images/icon_calendar.svg"

// Внешний массив с категориями и иконками для дневных задач
const categoryIcons = [
    {category: 'FIGHT_X_BATTLES', icon: iFights},        // Проведение боев
    {category: 'HIT_BAG_X_TIMES', icon: iTrainings},     // Бить по груше X минут
    {category: 'SOCIAL_MEDIA', icon: iComment},          // Оставить комментарий (поделиться в соц.сетях)
    {category: 'WATCH_VIDEO', icon: iArrow},             // Просмотр видео
    {category: 'WIN_X_BATTLES', icon: iWin},             // Выиграть X матчей
    {category: 'INVITE_FRIEND', icon: iInvite},          // Пригласить друзей
    {category: 'ADD_X_TOKENS_TO_BALANCE', icon: iEarn},  // Пополнить баланс токенами
];


export class DailyTaskModel {
    constructor({
                    id = null,
                    title = '',
                    description = '',
                    tokens = 0,
                    isCompleted = false,
                    link = '',
                    category = '',
                    value = null
                } = {}) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.tokens = tokens;
        this.isCompleted = isCompleted;
        this.link = link;
        this.category = category;
        this.value = value;
    }

    getIcon() {
        const categoryIcon = categoryIcons.find(item => item.category === this.category);
        return categoryIcon ? categoryIcon.icon : null; // Возвращаем null, если иконка не найдена
    }

    // Статический метод для создания модели из JSON строки
    static fromJSON(data) {
        try {
            const {id, title, description, tokens, isCompleted, link, category, value} = data;

            return new DailyTaskModel({
                id,
                title,
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
