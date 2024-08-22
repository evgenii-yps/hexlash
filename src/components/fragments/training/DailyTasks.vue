<template>
  <div class="daily-tasks-section">
    <div class="header">
      <h3>Daily tasks ({{ notCompletedTasksCount }})</h3>

      <VBtnDark
          size="x-small"
          class="btn-show-hide"
          @click="toggleCompletedTasks">
        <img :src="showCompletedTasks ? IconHide : IconShow" alt="Show/Hide" class="custom-icon"/>
      </VBtnDark>

    </div>

    <div class="daily-tasks">
      <div
          v-for="task in sortedTasks"
          :key="task.id"
          class="task-item"
          :class="{ completed: task.isCompleted }"
          @click="openTaskDialog(task)"
          v-ripple
      >
        <img :src="getIconByCategory(task.category)" alt="Task Icon" class="task-icon"/>
        <span class="task-description">{{ task.description }}</span>
        <span class="task-tokens">{{ task.tokens }} <span style="color:gray">$</span> </span>

      </div>
    </div>
  </div>

  <TaskModal v-model="isTaskModalOpen" :task="selectedTask" @close="isTaskModalOpen = false" @complete="completeTask"/>

</template>

<script setup>
import {computed, ref} from "vue";
import IconShow from "@/assets/images/icon_show.svg";
import IconHide from "@/assets/images/icon_hide.svg";
import iFights from "@/assets/images/icon_fights.svg"
import iTrainings from "@/assets/images/icon_trainings.svg"
import iComment from "@/assets/images/icon_invites.svg"
import iArrow from "@/assets/images/icon_arrow.svg"
import iWin from "@/assets/images/icon_wins.svg"
import iInvite from "@/assets/images/icon_members.svg"
import iEarn from "@/assets/images/icon_token_less.svg"
import iCalendar from "@/assets/images/icon_calendar.svg"
import TaskModal from "@/components/fragments/training/TaskModal.vue";


const showCompletedTasks = ref(false);
const isTaskModalOpen = ref(false);
const selectedTask = ref(null);

const props = defineProps({
  dailyTasks: {
    type: Array,
    required: true,
  },
});

const categoryIcons = [
  {category: 'fight_x_battles', icon: iFights},
  {category: 'punch_bag_x_minutes', icon: iTrainings},
  {category: 'social_media_comment', icon: iComment},
  {category: 'watch_video', icon: iArrow},
  {category: 'win_x_matches', icon: iWin},
  {category: 'invite_x_friends', icon: iInvite},
  {category: 'earn_x_tokens', icon: iEarn},
  {category: 'complete_daily_tasks', icon: iCalendar}
];

function getIconByCategory(category) {
  const categoryIcon = categoryIcons.find(item => item.category === category);
  return categoryIcon.icon;
}


// Вычисляемое свойство для подсчета количества выполненных заданий
const notCompletedTasksCount = computed(() => {
  return props.dailyTasks.filter(task => !task.isCompleted).length;
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
  // Логика завершения задания
  console.log(id)
};

const openTaskDialog = (task) => {
  if (!task.isCompleted) {
    isTaskModalOpen.value = true;
  }
};
</script>

<style scoped>

.daily-tasks-section {
  margin-top: 280px;
  width: 100%; /* Растягиваем контейнер на всю доступную ширину */
  box-sizing: border-box; /* Учитываем padding и border в ширине */
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
  font-family: Anonymous, sans-serif;
  font-size: 2rem;
}

.btn-show-hide {
  height: 40px;
  width: 40px;
  cursor: pointer;
}

.daily-tasks {
  list-style-type: none;
  padding: 0;
  color: white;
  background-color: var(--black-opacity-80);
  display: flex;
  flex-direction: column;
  border-radius: 4px;
}

.task-item {
  cursor: pointer;
  padding: 15px 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  position: relative;
}

.task-icon {
  width: 20px;
  height: 20px;
  margin-right: 15px;
}

.task-description {
  flex-grow: 1;
  white-space: wrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-tokens {
  flex-shrink: 0; /* Не сжиматься */
  padding-left: 10px;
}

.task-item.completed {
  position: relative;
  color: var(--gray2);
  opacity: 0.8;
}

.task-item.completed {
  cursor: default;
  text-decoration: line-through; /* Зачёркивание текста */
  text-decoration-thickness: 2px; /* Толщина линии зачёркивания */
  text-decoration-color: currentColor; /* Цвет линии совпадает с цветом текста */
}


.task-item.completed .task-icon {
  opacity: 0.5;
}


</style>
