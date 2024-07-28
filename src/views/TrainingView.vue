<template>
  <div class="background background-training">
    <div class="training-container">
      <div class="training-content-wrapper">

        <div class="training-options">
          <button class="big-button" @click="startTrainingFight">Тренировочные бои</button>
          <button class="big-button" @click="startPunchingBag">Груша</button>
        </div>

        <div class="daily-tasks-section">
          <h3>Ежедневные задания</h3>
          <ul class="daily-tasks">
            <li v-for="task in dailyTasks" :key="task.id" class="task-item" @click="openTaskDialog(task)">
              {{ task.description }} - {{ task.tokens }} токенов
            </li>
          </ul>
        </div>

        <div class="checklist-section">
          <h3 style="color: white;">Чек лист</h3>
          <ul class="unfinished-tasks">
            <li v-for="task in unfinishedTasks" :key="task.id" class="task-item" @click="openSubscribeDialog(task)">
              {{ task.description }} - {{ task.tokens }} токенов
            </li>
            <li class="task-item" @click="goToProfileSettings">Подтвердить email - {{ emailTokens }} токенов</li>
          </ul>

        </div>

      </div>
    </div>
  </div>

  <TaskModal v-model="isTaskModalOpen" :task="selectedTask" @close="isTaskModalOpen = false" @complete="completeTask"/>
  <SubscribeModal v-model="isSubscribeModalOpen" :task="selectedTask" @close="isSubscribeModalOpen = false" @complete="completeTask"/>
</template>

<script setup>
import { ref } from 'vue';
import TaskModal from "@/components/fragments/training/TaskModal.vue";
import SubscribeModal from "@/components/fragments/training/SubscribeModal.vue";

const dailyTasks = ref([
  { id: 1, description: 'Репост сообщения', tokens: 5 },
  { id: 2, description: 'Комментарий в социальной сети', tokens: 3 },
  { id: 3, description: 'Побить грушу 10 минут', tokens: 7 },
  { id: 4, description: 'Провести 5 боев', tokens: 10 },
]);

const unfinishedTasks = ref([
  { id: 5, description: 'Подписка на Telegram', tokens: 4 },
  { id: 6, description: 'Подписка на Twitter', tokens: 4 },
  { id: 7, description: 'Подписка на YouTube', tokens: 4 },
  { id: 8, description: 'Подписка на Discord', tokens: 4 },
  { id: 9, description: 'Подписка на Instagram', tokens: 4 },
]);

const socialTasks = ref([
  { id: 1, name: 'Telegram', tokens: 4 },
  { id: 2, name: 'Twitter', tokens: 4 },
  { id: 3, name: 'YouTube', tokens: 4 },
  { id: 4, name: 'Discord', tokens: 4 },
  { id: 5, name: 'Instagram', tokens: 4 },
]);

const emailTokens = ref(5);

const startTrainingFight = () => {
  // Логика запуска тренировочного боя
};

const startPunchingBag = () => {
  // Логика запуска грушу
};

const completeTask = (id) => {
  // Логика завершения задания
  console.log(id)
};

const goToProfileSettings = () => {
  // Логика перехода в настройки профиля
};

const isTaskModalOpen = ref(false);
const isSubscribeModalOpen = ref(false);
const selectedTask = ref(null);

const openTaskDialog = (task) => {
  selectedTask.value = task;
  isTaskModalOpen.value = true;
};

const openSubscribeDialog = (task) => {
  selectedTask.value = task;
  isSubscribeModalOpen.value = true;
};
</script>

<style scoped>
.background-training {
  background: url('@/assets/images/background_trainings.webp') no-repeat center center;
}

.background-training::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to right top, black 40%, transparent 75%);
  z-index: 1;
}

.background-training::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: black;
  z-index: 2;
  opacity: 1;
  animation: fadeOut 1s forwards; /* Анимация */
}

@keyframes fadeOut {
  to {
    opacity: 0;
  }
}

.training-container {
  position: relative;
  z-index: 10;
  overflow-y: auto;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.training-content-wrapper {
  width: 100%;
  padding: 10vh 0;
  box-sizing: border-box;
}

.training-options {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
  color: white;
}

.big-button {
  padding: 20px;
  font-size: 1.5em;
  cursor: pointer;
  color: white;
}

.daily-tasks-section,
.checklist-section {
  margin-bottom: 20px;
  color: white;
}

.daily-tasks,
.unfinished-tasks {
  list-style-type: none;
  padding: 0;
  color: white;
}

.task-item {
  border: 1px solid white;
  padding: 10px;
  margin: 5px 0;
  cursor: pointer;
}

.social-tasks {
  display: flex;
  flex-direction: column;
  color: white;
}

button {
  margin: 5px 0;
  padding: 10px;
  cursor: pointer;
}
</style>
