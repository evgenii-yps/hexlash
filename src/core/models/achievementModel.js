
import achievementSocialIcon from '@/assets/images/achievement_social.png';
import achievementNewbieIcon from '@/assets/images/achievement_newbie.png';
import achievement100DaysIcon from '@/assets/images/achievement_100days.png';
import achievementWinIcon from '@/assets/images/achievement_win.png';
import achievementSocialLeaderIcon from '@/assets/images/achievement_social_leader.png';
import achievement100WinsIcon from '@/assets/images/achievement_bob.png';
import achievementLuckIcon from '@/assets/images/achievement_luck.png';
import achievementDailyLoginIcon from '@/assets/images/achievement_daily_login.png';
import achievement30DaysIcon from '@/assets/images/achievement_30days.png';
import achievementCoachIcon from '@/assets/images/achievement_coach.png';
import achievementInviteIcon from '@/assets/images/achievement_invite.png';
import achievementInvestIcon from '@/assets/images/achievement_invest.png';
import achievementPromoIcon from '@/assets/images/achievement_promo.png';
import achievementExpertIcon from '@/assets/images/achievement_expert.png';
import achievementWalletIcon from '@/assets/images/achievement_wallet.png';
import achievement1000FightsIcon from '@/assets/images/achievement_hero.png';

export function initAllAchievements(t) {
    return [
        new AchievementModel({
            type: 'CONNECTED_FIGHTER',
            title: t('profile.achievements.titleConnectedFighter'),
            icon: achievementSocialIcon,
            completed: false,
            description: t('profile.achievements.descConnectedFighter'),
            show: false
        }),
        new AchievementModel({
            type: 'NEWBIE',
            title: t('profile.achievements.titleNewbie'),
            icon: achievementNewbieIcon,
            completed: false,
            description: t('profile.achievements.descNewbie'),
            show: false
        }),
        new AchievementModel({
            type: 'MEETING_PARTICIPANT',
            title: t('profile.achievements.titleMeetingParticipant'),
            icon: achievementDailyLoginIcon,
            completed: false,
            description: t('profile.achievements.descMeetingParticipant'),
            show: false
        }),
        new AchievementModel({
            type: 'GOLDEN_RULE',
            title: t('profile.achievements.titleGoldenRule'),
            icon: achievement30DaysIcon,
            completed: false,
            description: t('profile.achievements.descGoldenRule'),
            show: false
        }),
        new AchievementModel({
            type: 'BATTLE_VETERAN',
            title: t('profile.achievements.titleBattleVeteran'),
            icon: achievementWinIcon,
            completed: false,
            description: t('profile.achievements.descBattleVeteran'),
            show: false
        }),
        new AchievementModel({
            type: 'COACH',
            title: t('profile.achievements.titleCoach'),
            icon: achievementCoachIcon,
            completed: false,
            description: t('profile.achievements.descCoach'),
            show: false
        }),
        new AchievementModel({
            type: 'RECRUITER',
            title: t('profile.achievements.titleRecruiter'),
            icon: achievementInviteIcon,
            completed: false,
            description: t('profile.achievements.descRecruiter'),
            show: false
        }),
        new AchievementModel({
            type: 'PROJECT_MAYHEM',
            title: t('profile.achievements.titleProjectMayhem'),
            icon: achievementSocialLeaderIcon,
            completed: false,
            description: t('profile.achievements.descProjectMayhem'),
            show: false
        }),
        new AchievementModel({
            type: 'MEATLOAF',
            title: t('profile.achievements.titleMeatloaf'),
            icon: achievementInvestIcon,
            completed: false,
            description: t('profile.achievements.descMeatloaf'),
            show: false
        }),
        new AchievementModel({
            type: 'TYLER',
            title: t('profile.achievements.titleTyler'),
            icon: achievementPromoIcon,
            completed: false,
            description: t('profile.achievements.descTyler'),
            show: false
        }),
        new AchievementModel({
            type: 'EXPERT',
            title: t('profile.achievements.titleExpert'),
            icon: achievementExpertIcon,
            completed: false,
            description: t('profile.achievements.descExpert'),
            show: false
        }),
        new AchievementModel({
            type: 'REGULAR_FIGHTER',
            title: t('profile.achievements.titleRegularFighter'),
            icon: achievement100DaysIcon,
            completed: false,
            description: t('profile.achievements.descRegularFighter'),
            show: false
        }),
        new AchievementModel({
            type: 'LUCKY_ONE',
            title: t('profile.achievements.titleLuckyOne'),
            icon: achievementLuckIcon,
            completed: false,
            description: t('profile.achievements.descLuckyOne'),
            show: false
        }),
        new AchievementModel({
            type: 'BOB',
            title: t('profile.achievements.titleBob'),
            icon: achievement100WinsIcon,
            completed: false,
            description: t('profile.achievements.descBob'),
            show: false
        }),
        new AchievementModel({
            type: 'PAPER_STREET',
            title: t('profile.achievements.titlePaperStreet'),
            icon: achievementWalletIcon,
            completed: false,
            description: t('profile.achievements.descPaperStreet'),
            show: false
        }),
        new AchievementModel({
            type: 'FIGHT_MASTER',
            title: t('profile.achievements.titleFightMaster'),
            icon: achievement1000FightsIcon,
            completed: false,
            description: t('profile.achievements.descFightMaster'),
            show: false
        })
    ];
}

export class AchievementModel {

    static TYPE_NAME = "AchievementInfo";

    constructor({
                    id = null,
                    type = null,
                    title = null,
                    icon = null,
                    completed = false,
                    description = null,
                    show = false,
                    obtainedAt = null,
                } = {}) {
        this.id = id;
        this.type = type;
        this.title = title;
        this.icon = icon;
        this.isCompleted = completed;
        this.description = description;
        this.show = show;
        this.obtainedAt = obtainedAt;
    }


    static fromJSON(achievementInfo) {
        try {
            const {
                type,
                isCompleted,
                obtainedAt
            } = achievementInfo;

            return new AchievementModel({
                type,
                isCompleted,
                obtainedAt,
            });

        } catch (error) {
            console.error('Error parsing JSON response:', error);
            return null;
        }
    }


}