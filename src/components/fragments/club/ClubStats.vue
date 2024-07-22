<template>
  <div class="club-stats" v-if="club">
    <div class="stat-item">
      <span class="stat-label">Сумма дохода FC:</span>
      <span class="stat-value">{{ club.income }}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">Количество боев:</span>
      <span class="stat-value">{{ club.battles }}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">Количество выигранных боев:</span>
      <span class="stat-value">{{ club.wins }}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">Процент удачи клуба:</span>
      <span class="stat-value">{{ club.successRate }}%</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">Количество участников:</span>
      <span class="stat-value">{{ club.members }}</span>
    </div>
  </div>
  <div v-else>
    Загрузка данных клуба...
  </div>
</template>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  club: {
    type: Object,
    required: true,
  }
});
</script>

<style scoped>
.club-stats {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  color: white;
}

.stat-label {
  font-weight: bold;
}

.stat-value {
  font-size: 1.2em;
}
</style>
