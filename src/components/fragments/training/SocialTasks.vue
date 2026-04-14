<template>

  <div class="checklist-section">
    <div class="cl-header">
      <span class="cl-header-label">{{ t.training.lblChecklist }}</span>
      <span class="cl-header-count">{{ notCompletedCheckListCount }}</span>
    </div>

    <div v-if="props.loadingSocialTasks" class="cl-loader">
      <v-progress-circular size="40" indeterminate />
    </div>

    <div v-else-if="!props.hasIncompleteSocialTasks" class="cl-empty">
      {{ t.training.checklistCompleted }}
    </div>

    <div v-else class="cl-grid">
      <div
          v-for="task in sortedTasks"
          :key="task.id"
          class="cl-card"
          @click="openSubscribeDialog(task)">
        <div class="cl-card-icon">
          <v-img :src="task.getIcon()" aspect-ratio="1" class="cl-card-img"/>
        </div>
        <div class="cl-card-reward">0$</div>
        <div class="cl-card-name">{{ task.title }}</div>
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
import {t} from '@/locales/index.js';


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
  margin-top: 28px;
  width: 100%;
}

/* Header */
.cl-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 14px;
}
.cl-header-label {
  font-size: 13px;
  color: var(--hex-text-secondary);
  letter-spacing: 2.5px;
  text-transform: uppercase;
}
.cl-header-count {
  font-size: 11px;
  color: var(--hex-text-muted);
  letter-spacing: 1.5px;
}

/* Grid */
.cl-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

/* Card */
.cl-card {
  background: var(--hex-bg-light);
  border: 1px solid var(--hex-border-default);
  border-radius: 8px;
  padding: 14px 8px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.15s;
}
.cl-card:hover {
  border-color: var(--hex-border-active);
}

/* Icon */
.cl-card-icon {
  width: 32px;
  height: 32px;
  background: var(--hex-bg-medium);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 8px;
}
.cl-card-img {
  width: 14px;
  height: 14px;
}

/* Reward */
.cl-card-reward {
  font-size: 11px;
  color: var(--hex-text-muted);
  font-weight: 500;
  margin-bottom: 4px;
}

/* Name */
.cl-card-name {
  font-size: 9px;
  color: var(--hex-text-muted);
  letter-spacing: 1px;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* States */
.cl-loader {
  display: flex;
  justify-content: center;
  padding: 24px 0;
}
.cl-empty {
  text-align: center;
  color: var(--hex-text-muted);
  font-size: 13px;
  padding: 24px 0;
}

/* Desktop: 6 columns */
@media (min-width: 600px) {
  .cl-grid {
    grid-template-columns: repeat(6, 1fr);
    gap: 14px;
  }
  .cl-card {
    padding: 18px 10px;
  }
  .cl-card-reward { font-size: 12px; }
  .cl-card-name { font-size: 10px; }
}

@media (min-width: 1024px) {
  .checklist-section { margin-top: 36px; }
  .cl-header-label { font-size: 14px; }
  .cl-header-count { font-size: 12px; }
}
</style>
