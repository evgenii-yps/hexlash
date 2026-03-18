<template>

  <div class="checklist-section">
    <h3>CheckList ({{ notCompletedCheckListCount }})</h3>

    <div v-if="props.loadingSocialTasks" class="loader-container">
      <v-progress-circular
          class="loader"
          size="40"
          indeterminate
      />
    </div>

    <div v-else-if="!props.hasIncompleteSocialTasks" class="no-tasks-container">
      Great work, checklist completed!
    </div>

    <div v-else class="checklist-scroll-container">

      <div class="horizontal-scroll">
        <div
            v-ripple
            v-for="task in sortedTasks"
            :key="task.id"
            class="task-item" @click="openSubscribeDialog(task)">

          <div class="cost">0$</div>
          <v-img :src="task.getIcon()" aspect-ratio="1" class="task-img"/>
          <div class="desc">{{ task.title }}</div>

        </div>

      </div>
    </div>

  </div>

  <SubscribeModal v-model="isSubscribeModalOpen" :task="selectedTask" @close="isSubscribeModalOpen = false"
                  @complete="completeTask"/>

</template>

<script setup>

import {computed, ref} from "vue";

import SubscribeModal from "@/components/fragments/training/SubscribeModal.vue";
import store from "@/core/state/store.js";


const isSubscribeModalOpen = ref(false);
const selectedTask = ref(null);

const props = defineProps({
  socialTasks: {
    type: Array,
    required: true
  },
  loadingSocialTasks: {
    type: Boolean,
    required: true,
    default: false
  },
  hasIncompleteSocialTasks: {
    type: Boolean,
    required: true,
    default: false
  }
});


const notCompletedCheckListCount = computed(() => {
  return props.socialTasks.filter(task => !task.isCompleted).length;
});


// Сортируем задания: сначала невыполненные, затем выполненные
const sortedTasks = computed(() => {
  return props.socialTasks
      .filter(task => !task.isCompleted)
      .sort((a, b) => a.isCompleted - b.isCompleted);
});

const completeTask = (id) => {
  // Находим задачу по ID и отмечаем её как завершённую
  let updatedTask = props.socialTasks.findLast(task => task.id === id);

  updatedTask.isCompleted = true;

  store.dispatch("task/updateSocialTask", updatedTask);

  selectedTask.value = null;

};

const openSubscribeDialog = (task) => {
  if (!task.isCompleted) {
    isSubscribeModalOpen.value = true;
    selectedTask.value = task;
  }
};

</script>

<style scoped>

.checklist-section {
  margin-top: 20px;
  max-width: 500px;
  width: 100%;
}

.horizontal-scroll {
  margin-top: 5px;
  display: flex;
  white-space: nowrap;
  scroll-behavior: smooth;
  overflow-x: auto;
  width: 100%;
}

.horizontal-scroll::-webkit-scrollbar {
  display: none;
}

.horizontal-scroll {
  -ms-overflow-style: none;
  scrollbar-width: none;
  padding-left: 10px;
  display: flex;
  flex-direction: row;
}


.task-item {
  box-sizing: border-box;
  border: 1px solid var(--gray1);
  cursor: pointer;
  width: 70px;
  height: 80px;
  border-radius: 4px;
  background-color: var(--black-opacity-80);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  flex-shrink: 0;
}

.task-item {
  margin: 0 4px;
  padding-top: 5px;
  padding-bottom: 5px;
}

.cost {
  text-align: center;
  font-size: 0.8rem;
}

.task-img {
  width: 20px;
  height: 20px;
  margin: 0;
}

.desc {
  color: white;
  font-size: 0.6rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.checklist-section h3 {
  font-family: 'Anonymous', 'Courier New', Consolas, monospace;
  font-size: 1.5rem;
  margin-left: 25px;
}

.loader-container {
  display: flex;
  justify-content: center; /* Центрирование по горизонтали */
  align-items: center; /* Центрирование по вертикали */
  margin-top: 20px;
}

.no-tasks-container{
  display: flex;
  justify-content: center; /* Центрирование по горизонтали */
  align-items: center; /* Центрирование по вертикали */
  margin-top: 20px;
  color: white;
}
</style>
