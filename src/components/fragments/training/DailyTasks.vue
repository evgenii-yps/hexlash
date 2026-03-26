<template>
  <div class="daily-tasks-section">
    <div class="header">
      <h3>{{ t.training.lblDailyTasks }} ({{ notCompletedTasksCount }})</h3>

      <VBtnDark
          v-if="completedTasksCount > 0"
          size="x-small"
          class="btn-show-hide"
          @click="toggleCompletedTasks">
        <img :src="showCompletedTasks ? IconHide : IconShow" alt="Show/Hide" class="custom-icon"/>
      </VBtnDark>
    </div>

    <div v-if="props.loadingDailyTasks" class="loader-container">
      <v-progress-circular
          class="loader"
          size="40"
          indeterminate
      />
    </div>

    <div v-else-if="!props.hasIncompleteDailyTasks && !showCompletedTasks" class="no-tasks-container">
      {{ t.training.noTasksAvailable }}
    </div>

    <div v-else class="daily-tasks">
      <div
          v-for="task in sortedTasks"
          :key="task.id"
          class="task-item"
          :class="{ completed: task.isCompleted }"
          @click="openTaskDialog(task)"
          v-ripple
      >
        <img :src="task.getIcon()" alt="Task Icon" class="task-icon"/>
        <span class="task-description">{{ task.title }}</span>
        <span class="task-tokens">0 <span style="color:var(--hex-text-secondary)">$</span> </span>

      </div>
    </div>
  </div>

  <TaskModal v-model="isTaskModalOpen"
             :task="selectedTask"
             @close="isTaskModalOpen = false"
             @complete="completeTask"/>

</template>

<script setup>
import {computed, ref} from "vue";
import IconShow from "@/assets/images/icon_show.svg";
import IconHide from "@/assets/images/icon_hide.svg";
import TaskModal from "@/components/fragments/training/TaskModal.vue";
import store from "@/core/state/store.js";
import {t} from '@/locales/index.js';


const showCompletedTasks = ref(false);
const isTaskModalOpen = ref(false);
const selectedTask = ref(null);

const props = defineProps({
  dailyTasks: {
    type: Array,
    required: true,
  },
  loadingDailyTasks: {
    type: Boolean,
    required: true,
    default: false
  },
  hasIncompleteDailyTasks: {
    type: Boolean,
    required: true,
    default: false
  }
});


// Вычисляемое свойство для подсчета количества выполненных заданий
const notCompletedTasksCount = computed(() => {
  return props.dailyTasks.filter(task => !task.isCompleted).length;
});

const completedTasksCount = computed(() => {
  return props.dailyTasks.filter(task => task.isCompleted).length;
});

// Функция для переключения видимости выполненных заданий
const toggleCompletedTasks = () => {
  showCompletedTasks.value = !showCompletedTasks.value;
};

// Сортируем задания: сначала невыполненные, затем выполненные
const sortedTasks = computed(() => {
  return props.dailyTasks
      .filter(task => !task.isCompleted || showCompletedTasks.value)
      .sort((a, b) => a.isCompleted - b.isCompleted);
});

const completeTask = (id) => {
  // Находим задачу по ID и отмечаем её как завершённую
  let updatedTask = props.dailyTasks.findLast(task => task.id === id);
  updatedTask.isCompleted = true;

  // Обновляем состояние в store
  store.dispatch("task/updateDailyTask", updatedTask);

  selectedTask.value = null;
};

const openTaskDialog = (task) => {
  if (!task.isCompleted) {
    isTaskModalOpen.value = true;
    selectedTask.value = task;
  }
};
</script>

<style scoped>

.daily-tasks-section {
  width: 100%; /* Растягиваем контейнер на всю доступную ширину */
  box-sizing: border-box;
  max-width: 500px;
  padding: 0 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.daily-tasks-section h3 {
  font-family: 'Anonymous', 'Courier New', Consolas, monospace;
  font-size: 1.5rem;
}

.btn-show-hide {
  height: 30px;
  width: 30px;
  cursor: pointer;
}

.btn-show-hide img{
  height: 15px;
  width: 15px;
}

.daily-tasks {
  list-style-type: none;
  padding: 0;
  color: var(--hex-text-primary);
  background-color: var(--hex-bg-card);
  display: flex;
  flex-direction: column;
  border-radius: 4px;
}

.task-item {
  cursor: pointer;
  padding: 10px 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  position: relative;
}

.task-icon {
  width: 15px;
  height: 15px;
  margin-right: 10px;
}

.task-description {
  flex-grow: 1;
  white-space: wrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.8rem;
}

.task-tokens {
  flex-shrink: 0; /* Не сжиматься */
  padding-left: 10px;
  font-size: 0.8rem;
}

.task-item.completed {
  position: relative;
  color: var(--hex-text-secondary);
  opacity: 0.8;
}

.task-item.completed {
  cursor: default;
  text-decoration: line-through; /* Зачёркивание текста */
  text-decoration-thickness: 1.5px; /* Толщина линии зачёркивания */
  text-decoration-color: currentColor; /* Цвет линии совпадает с цветом текста */
}


.task-item.completed .task-icon {
  opacity: 0.5;
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
  color: var(--hex-text-primary);
}

</style>
