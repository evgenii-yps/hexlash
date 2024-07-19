<template>
  <div class="achievements-container">
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

</template>


<script setup>
import {computed, onMounted, ref} from 'vue';

import store from "@/core/state/store.js";

const currentUser = computed(() => store.getters['user/getCurrentUser']);


const achievements = computed(() => currentUser.value.achievements.map(achievement => ({
  id: achievement.id,
  title: achievement.title,
  icon: achievement.icon,
  completed: achievement.completed,
  description: achievement.description,
  show: achievement.show
})));


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

