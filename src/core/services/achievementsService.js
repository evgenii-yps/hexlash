import {CurrentUserModel, AchievementModel} from "@/core/models/currentUserModel.js";

export function initializeAchievements() {
    return [
        {
            id: 1,
            title: 'Первая кровь',
            icon: '@/assets/images/achievement_email.png',
            completed: false,
            description: 'Подтвердите вашу электронную почту, чтобы разблокировать эту ачивку.',
            show: false
        },
        {
            id: 2,
            title: 'Связанный боец',
            icon: '@/assets/images/achievement_social.png',
            completed: false,
            description: 'Привяжите не менее чем 3 социальных сетей.',
            show: false
        },
        {
            id: 3,
            title: 'Призывник',
            icon: '@/assets/images/achievement_invite.png',
            completed: false,
            description: 'Пригласите не менее 10 человек, которые вступят и зарегистрируются.',
            show: false
        },
        {
            id: 4,
            title: 'Ветеран боя',
            icon: '@/assets/images/achievement_win.png',
            completed: true,
            description: 'Выиграйте 10 боев, чтобы получить эту ачивку.',
            show: false
        },
        {
            id: 5,
            title: 'Постоянный участник',
            icon: '@/assets/images/achievement_100days.png',
            completed: false,
            description: 'Будьте в клубе 100 дней.',
            show: false
        },
        {
            id: 6,
            title: 'Надежда клуба',
            icon: '@/assets/images/achievement_30days.png',
            completed: false,
            description: 'Заходите каждый день в течение 30 дней без пропусков.',
            show: false
        }
    ].map(achievement => new AchievementModel(achievement));
}
