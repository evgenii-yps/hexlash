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
                          <img v-if="achievement.isCompleted" :src="achievement.icon" :alt="achievement.title"
                               class="achievement-icon"/>
                          <img v-else-if="achievement.transparent" :src="achievement.icon" :alt="achievement.title"
                               class="achievement-icon"/>
                          <img v-else src="@/assets/images/icon_lock.png" alt="Locked" class="achievement-icon"/>
                          <span class="achievement-title">{{
                              achievement.isCompleted || achievement.transparent ? achievement.title : t.profile.achievements.lblHidden
                            }}</span>
                          <img v-if="!achievement.isCompleted && achievement.transparent"
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
                            <span class="achievement-title">{{ t.profile.achievements.lblHidden }}</span>
                          </div>
                        </template>
                        <span>{{ t.profile.achievements.lblCompleteToUnlock }}</span>
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
    {{ t.loading }}
  </div>
</template>

<script setup>
import {computed, ref, watch} from 'vue';


import {t} from "@/locales/index.js";
import store from "@/core/state/store.js";

const allAchievements = computed(() => store.getters['achievement/getAllAchievements']);
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
    achievements.value = allAchievements.value.map(achievement => {
      const completedAchievement = completedAchievements.find(a => a.type === achievement.type);

      return {
        ...achievement,
        isCompleted: !!completedAchievement && completedAchievement.isCompleted,
        obtainedAt: completedAchievement ? completedAchievement.obtainedAt : achievement.obtainedAt,
      };
    }).sort((a, b) => {
      // Сначала сортируем по флагу completed, затем по времени получения
      if (b.isCompleted !== a.isCompleted) {
        return b.isCompleted - a.isCompleted;
      }
      return b.obtainedAt - a.obtainedAt;


    });

    const firstUncompletedIndex = achievements.value.findIndex(a => !a.isCompleted);
    if (firstUncompletedIndex !== -1) {
      for (let i = firstUncompletedIndex; i < firstUncompletedIndex + 5; i++) {
        if (achievements.value[i]) {
          achievements.value[i].transparent = true;
        }
      }
    }
    achievements.value.forEach((achievement, index) => {
      if (!achievement.isCompleted && !achievement.transparent) {
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
  margin: 0;
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