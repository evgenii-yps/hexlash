<template>
  <div class="achievements-container" v-if="achievements.length > 0">
    <div class="achievements-list">
      <div
          v-for="achievement in achievements"
          :key="achievement.id"
          :class="{ 'achievement-item': true, 'locked': !achievement.completed }"
      >
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
}, { immediate: true });

</script>

<style scoped>
.achievements-container {
  padding: 20px;
  color: white;
}

.achievements-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

.achievement-item {
  position: relative;
  margin: 10px;
  padding: 5px;
  border: 1px solid white;
  border-radius: 5px;
  width: 100px;
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
</style>
