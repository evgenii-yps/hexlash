<template>
  <div class="stats-container">
    <div class="stat-item" v-for="(stat, index) in stats" :key="stat.id" :class="{ 'stat-header': index < 2, 'stat-grid-item': index >= 2 }">
      <v-tooltip
          v-model="stat.show"
          location="top"
      >
        <template #activator="{ props }">
          <div :id="stat.id" v-bind="props" @click="stat.show = !stat.show" class="stat-content">
            <img :src="stat.icon" :alt="stat.title" class="stat-icon"/>
            <span class="stat-value">{{ stat.value }}</span>
          </div>
        </template>
        <span>{{ stat.title }}</span>
      </v-tooltip>
    </div>
  </div>

</template>

<script setup>
import {computed, onMounted, ref} from 'vue';

import iconArena from '@/assets/images/icon_arena.svg';
import iconWins from '@/assets/images/icon_arena.svg';
import iconLosses from '@/assets/images/icon_arena.svg';
import iconDraws from '@/assets/images/icon_arena.svg';
import iconLuck from '@/assets/images/icon_arena.svg';
import iconWonTokens from '@/assets/images/icon_arena.svg';
import iconFreeTokens from '@/assets/images/icon_arena.svg';
import iconLostTokens from '@/assets/images/icon_arena.svg';
import iconInvites from '@/assets/images/icon_arena.svg';
import iconDaysInClub from '@/assets/images/icon_arena.svg';

import store from "@/core/state/store.js";

const currentUser = computed(() => store.getters['user/getCurrentUser']);

const stats = ref([
  { id: 'stats-totalFights', title: 'Общее количество боев', value: currentUser.value.stats.totalFights, icon: iconArena, show: false },
  { id: 'stats-wins', title: 'Победы', value: currentUser.value.stats.wins, icon: iconWins, show: false },
  { id: 'stats-losses', title: 'Поражения', value: currentUser.value.stats.losses, icon: iconLosses, show: false },
  { id: 'stats-draws', title: 'Ничьи', value: currentUser.value.stats.draws, icon: iconDraws, show: false },
  { id: 'stats-luckPercentage', title: 'Общий процент удачи', value: currentUser.value.stats.luckPercentage + '%', icon: iconLuck, show: false },
  { id: 'stats-wonTokens', title: 'Токены, выигранные в боях', value: currentUser.value.stats.wonTokens, icon: iconWonTokens, show: false },
  { id: 'stats-freeTokens', title: 'Токены, полученные бесплатно', value: currentUser.value.stats.freeTokens, icon: iconFreeTokens, show: false },
  { id: 'stats-lostTokens', title: 'Токены, проигранные в боях', value: currentUser.value.stats.lostTokens, icon: iconLostTokens, show: false },
  { id: 'stats-invitedUsers', title: 'Приглашенные пользователи', value: currentUser.value.stats.invitedUsers, icon: iconInvites, show: false },
  { id: 'stats-daysInClubAndNoSkipDays', title: 'Дней в клубе', value: currentUser.value.stats.daysInClub + "(" + currentUser.value.stats.noSkipDays + ")", icon: iconDaysInClub, show: false },
]);



</script>

<style scoped>
.stats-container {
  margin-top: 20px;
  color: white;
  position: relative;
  z-index: 3;
  display: grid;
  grid-template-columns: repeat(4, 1fr); /* Две колонки для первых двух элементов */
  gap: 10px;
  justify-items: center; /* Центрируем элементы по горизонтали */
  justify-content: center; /* Центрируем контейнер по горизонтали */
  max-width: 500px;
}

.stat-header {
  grid-column: span 2; /* Первые два элемента занимают две колонки */
  display: flex;
  justify-content: center; /* Центрируем содержимое по горизонтали */
}

.stat-grid-item {
  grid-column: span 1; /* Остальные элементы занимают одну колонку */
}

.stat-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.stat-icon {
  width: 24px;
  height: 24px;
  margin-right: 10px;
  cursor: pointer;
  fill: white;
}

.stat-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-value {
  font-size: 1em;
  display: flex;
  align-items: center;
  margin-left: auto;
}
</style>
