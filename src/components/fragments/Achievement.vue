<template>
  <div class="achievement" :class="{ locked: !achievement.unlocked }" @click="showAchievementDetails">
    <p>{{ achievement.name }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  achievement: Object
});

const showAchievementDetails = () => {
  // Логика отображения деталей ачивки
};
</script>

<style scoped>
.achievement {
  padding: 10px;
  border: 1px solid #fff;
  border-radius: 5px;
  margin-bottom: 10px;
  cursor: pointer;
}

.locked {
  opacity: 0.5;
}
</style>
