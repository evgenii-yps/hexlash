<template>
  <div class="achievements-container" v-if="achievements.length > 0">
    <h2>Achievements</h2>
    <div class="achievements-list">
      <v-carousel hide-delimiters height="auto" :continuous="false">

        <!-- Слот для кастомизации кнопки "prev" -->
        <template v-slot:prev="{ props }">
          <button class="carousel-control prev" @click="props.onClick">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
          </button>
        </template>
        <!-- Слот для кастомизации кнопки "next" -->
        <template v-slot:next="{ props }">
          <button class="carousel-control next" @click="props.onClick">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
            </svg>
          </button>
        </template>

        <template v-for="(item, index) in carouselItems" :key="index">
          <v-carousel-item>
            <v-row class="flex-nowrap">
              <template v-for="(achievement, i) in item" :key="achievement.id">
                <v-col>
                  <div
                      :class="{ 'achievement-item': true, 'locked': achievement.locked, 'transparent': achievement.transparent }">
                    <v-tooltip
                        v-if="!achievement.locked"
                        v-model="achievement.show"
                        location="bottom"
                        contentClass="v-tooltip__content"
                        max-width="200px"
                    >
                      <template #activator="{ props }">
                        <div v-bind="props" @click="achievement.show = !achievement.show" class="achievement-content">
                          <img v-if="achievement.completed" :src="achievement.icon" :alt="achievement.title"
                               class="achievement-icon"/>
                          <img v-else-if="achievement.transparent" :src="achievement.icon" :alt="achievement.title"
                               class="achievement-icon"/>
                          <img v-else src="@/assets/images/icon_lock.png" alt="Locked" class="achievement-icon"/>
                          <span class="achievement-title">{{
                              achievement.completed || achievement.transparent ? achievement.title : t('profile.achievements.lblHidden')
                            }}</span>
                          <img v-if="!achievement.completed && achievement.transparent"
                               src="@/assets/images/icon_lock.svg" alt="Locked Overlay"
                               class="achievement-icon lock-overlay"/>
                        </div>
                      </template>
                      <span>{{ achievement.description }}</span>
                    </v-tooltip>
                    <div v-else>
                      <v-tooltip
                          location="center"
                          max-width="200px"
                          v-model="achievement.show"
                          contentClass="v-tooltip__content"
                      >
                        <template #activator="{ props }">
                          <div v-bind="props" @click="achievement.show = !achievement.show" class="achievement-content">
                            <img src="@/assets/images/icon_lock.png" alt="Locked" class="achievement-icon"/>
                            <span class="achievement-title">{{ t('profile.achievements.lblHidden') }}</span>
                          </div>
                        </template>
                        <span>{{ t('profile.achievements.lblCompleteToUnlock') }}</span>
                      </v-tooltip>
                    </div>
                  </div>
                </v-col>
              </template>
            </v-row>
          </v-carousel-item>
        </template>
      </v-carousel>
    </div>
  </div>
  <div v-else>
    {{ t('loading') }}
  </div>
</template>

<script setup>
import {computed, getCurrentInstance, ref, watch} from 'vue';

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
import {useI18n} from "vue-i18n";

const {t} = useI18n({useScope: 'global'})


const allAchievements = [
  {
    id: 2,
    title: t('profile.achievements.titleConnectedFighter'),
    icon: achievementSocialIcon,
    completed: false,
    description: t('profile.achievements.descConnectedFighter'),
    show: false
  },
  {
    id: 3,
    title: t('profile.achievements.titleNewbie'),
    icon: achievementNewbieIcon,
    completed: false,
    description: t('profile.achievements.descNewbie'),
    show: false
  },
  {
    id: 4,
    title: t('profile.achievements.titleMeetingParticipant'),
    icon: achievementDailyLoginIcon,
    completed: false,
    description: t('profile.achievements.descMeetingParticipant'),
    show: false
  },
  {
    id: 5,
    title: t('profile.achievements.titleGoldenRule'),
    icon: achievement30DaysIcon,
    completed: false,
    description: t('profile.achievements.descGoldenRule'),
    show: false
  },
  {
    id: 6,
    title: t('profile.achievements.titleBattleVeteran'),
    icon: achievementWinIcon,
    completed: false,
    description: t('profile.achievements.descBattleVeteran'),
    show: false
  },
  {
    id: 7,
    title: t('profile.achievements.titleCoach'),
    icon: achievementCoachIcon,
    completed: false,
    description: t('profile.achievements.descCoach'),
    show: false
  },
  {
    id: 8,
    title: t('profile.achievements.titleRecruiter'),
    icon: achievementInviteIcon,
    completed: false,
    description: t('profile.achievements.descRecruiter'),
    show: false
  },
  {
    id: 9,
    title: t('profile.achievements.titleProjectMayhem'),
    icon: achievementSocialLeaderIcon,
    completed: false,
    description: t('profile.achievements.descProjectMayhem'),
    show: false
  },
  {
    id: 10,
    title: t('profile.achievements.titleMeatloaf'),
    icon: achievementInvestIcon,
    completed: false,
    description: t('profile.achievements.descMeatloaf'),
    show: false
  },
  {
    id: 11,
    title: t('profile.achievements.titleTyler'),
    icon: achievementPromoIcon,
    completed: false,
    description: t('profile.achievements.descTyler'),
    show: false
  },
  {
    id: 12,
    title: t('profile.achievements.titleExpert'),
    icon: achievementExpertIcon,
    completed: false,
    description: t('profile.achievements.descExpert'),
    show: false
  },
  {
    id: 13,
    title: t('profile.achievements.titleRegularFighter'),
    icon: achievement100DaysIcon,
    completed: false,
    description: t('profile.achievements.descRegularFighter'),
    show: false
  },
  {
    id: 14,
    title: t('profile.achievements.titleLuckyOne'),
    icon: achievementLuckIcon,
    completed: false,
    description: t('profile.achievements.descLuckyOne'),
    show: false
  },
  {
    id: 15,
    title: t('profile.achievements.titleBob'),
    icon: achievement100WinsIcon,
    completed: false,
    description: t('profile.achievements.descBob'),
    show: false
  },
  {
    id: 16,
    title: t('profile.achievements.titlePaperStreet'),
    icon: achievementWalletIcon,
    completed: false,
    description: t('profile.achievements.descPaperStreet'),
    show: false
  },
  {
    id: 17,
    title: t('profile.achievements.titleFightMaster'),
    icon: achievement1000FightsIcon,
    completed: false,
    description: t('profile.achievements.descFightMaster'),
    show: false
  }
];


const achievements = ref([]);

const props = defineProps({
  userData: {
    type: Object,
    required: true,
    default: () => ({})
  },
});


watch(() => props.userData, (userData) => {
  if (userData) {
    const completedAchievements = userData.achievements;
    achievements.value = allAchievements.map(achievement => {
      const completed = completedAchievements.includes(achievement.id);
      return {
        ...achievement,
        completed,
      };
    }).sort((a, b) => b.completed - a.completed);

    const firstUncompletedIndex = achievements.value.findIndex(a => !a.completed);
    if (firstUncompletedIndex !== -1) {
      for (let i = firstUncompletedIndex; i < firstUncompletedIndex + 5; i++) {
        if (achievements.value[i]) {
          achievements.value[i].transparent = true;
        }
      }
    }
    achievements.value.forEach((achievement, index) => {
      if (!achievement.completed && !achievement.transparent) {
        achievement.locked = true;
      }
    });
  }
}, {immediate: true});

const carouselItems = computed(() => {
  const items = [];
  for (let i = 0; i < achievements.value.length; i += 3) {
    items.push(achievements.value.slice(i, i + 3));
  }
  return items;
});

</script>


<style scoped>
.achievements-container {
  color: white;
  margin-top: 1em;
}

.achievements-container h2 {
  font-size: 2rem;
  text-align: center;
  font-family: 'Anonymous', 'Arial', sans-serif;
  color: white;
}

.achievements-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

.achievement-item {
  position: relative;
  margin:  0;
  padding: 5px;
  border-radius: 5px;
  text-align: center;
  cursor: pointer;
  background-color: var(--black-opacity-80);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 120px; /* фиксированная высота для всех карточек */
  box-shadow: 0 3px 1px -2px var(--v-shadow-key-umbra-opacity, rgba(0, 0, 0, 0.2)), 0 2px 2px 0 var(--v-shadow-key-penumbra-opacity, rgba(0, 0, 0, 0.14)), 0 1px 5px 0 var(--v-shadow-key-ambient-opacity, rgba(0, 0, 0, 0.12))
}

.achievement-item.locked {
  opacity: 1;
}

.achievement-item.transparent {
  opacity: 0.5;
}

.achievement-icon {
  width: auto;
  height: 60px;
}

.achievement-content {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  width: 100%; /* чтобы текст занимал всю ширину */
}

.achievement-title {
  font-size: 0.8em;
  color: white;
  overflow: hidden; /* скрыть текст, если он выходит за пределы контейнера */
  text-overflow: ellipsis; /* добавить троеточие, если текст слишком длинный */
  margin-top: 10px;
  text-align: center;
}

.carousel-control {
  background: var(--black-opacity-80);
  border: 1px solid grey;
  border-radius: 50%; /* Круглая форма */
  cursor: pointer;
  padding: 6px;
  opacity: 0.5; /* Прозрачность кнопок */
  transition: opacity 0.3s;
  width: 40px; /* Ширина для круговой формы */
  height: 40px; /* Высота для круговой формы */
  display: flex;
  align-items: center;
  justify-content: center;
}

.carousel-control:hover {
  opacity: 1;
}

.carousel-control svg {
  width: 100%;
  height: 100%;
  fill: white;
}

:deep(.v-window__controls) {
  padding: 0 !important;
}

.flex-nowrap {
  margin: 0;
  flex-wrap: nowrap;
}

.achievement-icon.lock-overlay {
  position: absolute;
  width: 45px; /* меньший размер замка */
  height: 45px;
  margin-top: -20px
}
</style>