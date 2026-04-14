<template>
  <div class="daily-tasks-section">
    <div class="dt-header">
      <span class="dt-header-label">{{ t.training.lblDailyTasks }}</span>
      <span class="dt-header-count">{{ notCompletedTasksCount }}</span>
      <VBtnDark
          v-if="completedTasksCount > 0"
          size="x-small"
          class="dt-toggle"
          @click="toggleCompletedTasks">
        <img :src="showCompletedTasks ? IconHide : IconShow" alt="Show/Hide" class="dt-toggle-icon"/>
      </VBtnDark>
    </div>

    <div v-if="props.loadingDailyTasks" class="dt-loader">
      <v-progress-circular size="40" indeterminate />
    </div>

    <div v-else-if="!props.hasIncompleteDailyTasks && !showCompletedTasks" class="dt-empty">
      {{ t.training.noTasksAvailable }}
    </div>

    <div v-else class="dt-list">
      <div
          v-for="task in sortedTasks"
          :key="task.id"
          class="dt-card"
          :class="{ 'dt-card--done': task.isCompleted }"
          @click="openTaskDialog(task)"
      >
        <div class="dt-card-icon">
          <img :src="task.getIcon()" alt="" />
        </div>
        <span class="dt-card-text">{{ task.title }}</span>
        <span class="dt-card-reward">0 <span class="dt-card-currency">$</span></span>
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
  let updatedTask = props.dailyTasks.findLast(task => task.id === id);
  updatedTask.isCompleted = true;
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
  width: 100%;
  box-sizing: border-box;
}

/* Header */
.dt-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 14px;
}
.dt-header-label {
  font-size: 13px;
  color: var(--hex-text-secondary);
  letter-spacing: 2.5px;
  text-transform: uppercase;
}
.dt-header-count {
  font-size: 11px;
  color: var(--hex-text-muted);
  letter-spacing: 1.5px;
}
.dt-toggle {
  margin-left: auto;
  height: 24px;
  width: 24px;
  min-width: 24px;
  cursor: pointer;
}
.dt-toggle-icon {
  height: 14px;
  width: 14px;
}

/* List */
.dt-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Card */
.dt-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--hex-bg-light);
  border: 1px solid var(--hex-border-default);
  border-radius: 8px;
  padding: 14px 18px;
  cursor: pointer;
  transition: border-color 0.15s;
}
.dt-card:hover {
  border-color: var(--hex-border-active);
}
.dt-card--done {
  opacity: 0.5;
  cursor: default;
}
.dt-card--done .dt-card-text {
  text-decoration: line-through;
}

/* Icon */
.dt-card-icon {
  width: 24px;
  height: 24px;
  background: var(--hex-bg-medium);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.dt-card-icon img {
  width: 14px;
  height: 14px;
}

/* Text */
.dt-card-text {
  flex: 1;
  font-size: 14px;
  color: var(--hex-text-primary);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Reward */
.dt-card-reward {
  font-size: 13px;
  color: var(--hex-text-muted);
  font-weight: 500;
  flex-shrink: 0;
}
.dt-card-currency {
  color: var(--hex-text-secondary);
}

/* States */
.dt-loader {
  display: flex;
  justify-content: center;
  padding: 24px 0;
}
.dt-empty {
  text-align: center;
  color: var(--hex-text-muted);
  font-size: 13px;
  padding: 24px 0;
}

/* Desktop */
@media (min-width: 1024px) {
  .dt-header-label { font-size: 14px; }
  .dt-header-count { font-size: 12px; }
  .dt-card { padding: 16px 22px; }
  .dt-card-text { font-size: 16px; }
  .dt-card-reward { font-size: 14px; }
}
</style>
