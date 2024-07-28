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
                  <!-- the content -->
                  <div :class="{ 'achievement-item': true, 'locked': !achievement.completed }">
                    <v-tooltip
                        v-model="achievement.show"
                        location="bottom"
                        style="text-align: center"
                        max-width="200px"
                    >
                      <template #activator="{ props }">
                        <div v-bind="props" @click="achievement.show = !achievement.show" class="achievement-content">
                          <img :src="achievement.icon" :alt="achievement.title" class="achievement-icon"/>
                          <span class="achievement-title">{{ achievement.title }}</span>
                        </div>
                      </template>
                      <span>{{ achievement.description }}</span>
                    </v-tooltip>
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
    Loading...
  </div>
</template>

<script setup>
import {computed, ref, watch} from 'vue';
import store from "@/core/state/store.js";

const allAchievements = [
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
];

const achievements = ref([]);

const master = computed(() => store.getters['master/getMaster']);

watch(() => master.value, (newMaster) => {
  if (newMaster && newMaster.userData) {
    const completedAchievements = newMaster.userData.achievements;
    achievements.value = allAchievements.map(achievement => {
      const completed = completedAchievements.includes(achievement.id);
      return {
        ...achievement,
        completed,
      };
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
  margin-top: 2em;
}

.achievements-container h2 {
  font-size: 2.3rem;
  text-align: center;
  font-family: 'Anonymous', 'Roboto', sans-serif;
  color: white;
}

.achievements-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

.achievement-item {
  position: relative;
  margin: 10px 0;
  padding: 5px;
  border: 1px solid white;
  border-radius: 5px;
  text-align: center;
  cursor: pointer;
}

.achievement-item.locked {
  opacity: 0.5;
}

.achievement-icon {
  width: 50px;
  height: 50px;
}

.achievement-content {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.achievement-title {
  margin-top: 10px;
  font-size: 0.7em;
  color: white;
}

.carousel-control {
  background: grey;
  border: none;
  cursor: pointer;
  padding: 10px;
  opacity: 0.5; /* Прозрачность кнопок */
  transition: opacity 0.3s;
}

.carousel-control:hover {
  opacity: 1;
}

.carousel-control svg {
  width: 24px;
  height: 24px;
  fill: white;
}

:deep .v-window__controls {
  padding: 0 !important;
}

.flex-nowrap{
  margin: 0;
  flex-wrap: nowrap;
}
</style>
