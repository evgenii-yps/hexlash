
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
    const a = t.value.profile.achievements;
    return [
        new AchievementModel({
            type: 'CONNECTED_FIGHTER',
            title: a.titleConnectedFighter,
            icon: achievementSocialIcon,
            isCompleted: false,
            description: a.descConnectedFighter,
            show: false,
            obtainedAt: 0
        }),
        new AchievementModel({
            type: 'NEWBIE',
            title: a.titleNewbie,
            icon: achievementNewbieIcon,
            isCompleted: false,
            description: a.descNewbie,
            show: false,
            obtainedAt: 0
        }),
        new AchievementModel({
            type: 'MEETING_PARTICIPANT',
            title: a.titleMeetingParticipant,
            icon: achievementDailyLoginIcon,
            isCompleted: false,
            description: a.descMeetingParticipant,
            show: false,
            obtainedAt: 0
        }),
        new AchievementModel({
            type: 'GOLDEN_RULE',
            title: a.titleGoldenRule,
            icon: achievement30DaysIcon,
            isCompleted: false,
            description: a.descGoldenRule,
            show: false,
            obtainedAt: 0
        }),
        new AchievementModel({
            type: 'BATTLE_VETERAN',
            title: a.titleBattleVeteran,
            icon: achievementWinIcon,
            isCompleted: false,
            description: a.descBattleVeteran,
            show: false,
            obtainedAt: 0
        }),
        new AchievementModel({
            type: 'COACH',
            title: a.titleCoach,
            icon: achievementCoachIcon,
            isCompleted: false,
            description: a.descCoach,
            show: false,
            obtainedAt: 0
        }),
        new AchievementModel({
            type: 'RECRUITER',
            title: a.titleRecruiter,
            icon: achievementInviteIcon,
            isCompleted: false,
            description: a.descRecruiter,
            show: false,
            obtainedAt: 0
        }),
        new AchievementModel({
            type: 'PROJECT_MAYHEM',
            title: a.titleProjectMayhem,
            icon: achievementSocialLeaderIcon,
            isCompleted: false,
            description: a.descProjectMayhem,
            show: false,
            obtainedAt: 0
        }),
        new AchievementModel({
            type: 'MEATLOAF',
            title: a.titleMeatloaf,
            icon: achievementInvestIcon,
            isCompleted: false,
            description: a.descMeatloaf,
            show: false,
            obtainedAt: 0
        }),
        new AchievementModel({
            type: 'TYLER',
            title: a.titleTyler,
            icon: achievementPromoIcon,
            isCompleted: false,
            description: a.descTyler,
            show: false,
            obtainedAt: 0
        }),
        new AchievementModel({
            type: 'EXPERT',
            title: a.titleExpert,
            icon: achievementExpertIcon,
            isCompleted: false,
            description: a.descExpert,
            show: false,
            obtainedAt: 0
        }),
        new AchievementModel({
            type: 'REGULAR_FIGHTER',
            title: a.titleRegularFighter,
            icon: achievement100DaysIcon,
            isCompleted: false,
            description: a.descRegularFighter,
            show: false,
            obtainedAt: 0
        }),
        new AchievementModel({
            type: 'LUCKY_ONE',
            title: a.titleLuckyOne,
            icon: achievementLuckIcon,
            isCompleted: false,
            description: a.descLuckyOne,
            show: false,
            obtainedAt: 0
        }),
        new AchievementModel({
            type: 'BOB',
            title: a.titleBob,
            icon: achievement100WinsIcon,
            isCompleted: false,
            description: a.descBob,
            show: false,
            obtainedAt: 0
        }),
        new AchievementModel({
            type: 'PAPER_STREET',
            title: a.titlePaperStreet,
            icon: achievementWalletIcon,
            isCompleted: false,
            description: a.descPaperStreet,
            show: false,
            obtainedAt: 0
        }),
        new AchievementModel({
            type: 'FIGHT_MASTER',
            title: a.titleFightMaster,
            icon: achievement1000FightsIcon,
            isCompleted: false,
            description: a.descFightMaster,
            show: false,
            obtainedAt: 0
        })
    ];
}

export class AchievementModel {

    static TYPE_NAME = "AchievementResponseMsg";

    constructor({
                    id = null,
                    type = null,
                    title = null,
                    icon = null,
                    isCompleted = false,
                    description = null,
                    show = false,
                    obtainedAt = 0,
                } = {}) {
        this.id = id;
        this.type = type;
        this.title = title;
        this.icon = icon;
        this.isCompleted = isCompleted;
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