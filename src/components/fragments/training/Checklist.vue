<template>

  <div class="checklist-section">
    <h3>CheckList ({{ notCompletedCheckListCount }})</h3>

    <div class="checklist-scroll-container">

      <div class="horizontal-scroll">
        <div
            v-ripple
            v-for="task in sortedTasks"
            :key="task.id"
            class="task-item" @click="openSubscribeDialog(task)">

          <div class="cost">{{ task.tokens }}$</div>
          <v-img :src="getIconByCategory(task.category)" aspect-ratio="1" class="task-img"/>
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
import iEmail from "@/assets/images/icon_invites.svg";
import iTelegram from "@/assets/images/icon_telega.svg";
import iX from "@/assets/images/icon_x.svg";
import iYoutube from "@/assets/images/icon_yout.svg";
import iDiscord from "@/assets/images/icon_disc.svg";
import iInsta from "@/assets/images/icon_insta.svg";
import SubscribeModal from "@/components/fragments/training/SubscribeModal.vue";
import store from "@/core/state/store.js";


const isSubscribeModalOpen = ref(false);
const selectedTask = ref(null);

const props = defineProps({
  socialTasks: {
    type: Array,
    required: true
  },
});

const categoryIcons = [
  {category: 'email', icon: iEmail},
  {category: 'telegram', icon: iTelegram},
  {category: 'x', icon: iX},
  {category: 'youtube', icon: iYoutube},
  {category: 'discord', icon: iDiscord},
  {category: 'instagram', icon: iInsta},
];

function getIconByCategory(category) {
  const categoryIcon = categoryIcons.find(item => item.category === category);
  return categoryIcon.icon;
}

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
  const updatedTasks = props.socialTasks.map(task => {
    if (task.id === id) {
      return {
        ...task,
        isCompleted: true
      };
    }
    return task;
  });

  // Обновляем состояние в store
  store.dispatch("master/updateMaster", {socialTasks: updatedTasks.value});

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
  display: none; /* Скрывает ползунок в WebKit-браузерах, таких как Chrome и Safari */
}

.horizontal-scroll {
  -ms-overflow-style: none; /* Скрывает ползунок в Internet Explorer и Edge */
  scrollbar-width: none; /* Скрывает ползунок в Firefox */
  padding-left: 10px;
  display: flex;
  flex-direction: row;
}


.task-item {
  box-sizing: border-box;
  border: 1px solid var(--gray1);
  cursor: pointer;
  width: 75px;
  height: 90px;
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
  margin: 0 5px;
  padding-top: 5px;
  padding-bottom: 5px;
}

.cost {
  text-align: center;
}

.task-img {
  width: 30px;
  height: 30px;
  margin: 0;
}

.desc{
  color:white;
  font-size: 0.7rem;
}

.checklist-section h3 {
  font-family: Anonymous, sans-serif;
  font-size: 2rem;
  margin-left: 20px;
}
</style>
