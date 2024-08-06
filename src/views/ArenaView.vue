<template>
  <div class="background background-arena">
    <div class="arena-container">
      <div class="arena-content-wrapper">

        <div class="bet-slider">
          <BetSlider :options="betOptions" v-model="selectedBet"/>
        </div>

        <div class="action-slider">
          <ActionSlider :options="actionOptions" v-model="selectedActions"/>
        </div>

        <div class="fight-button-wrapper">
          <button @click="startFight" class="fight-button">Бой</button>
        </div>

        <v-progress-circular
            v-if="isLoading"
            class="loader"
            size="40"
            indeterminate
        />

      </div>
    </div>
  </div>
</template>

<script setup>
import {ref} from 'vue';
import BetSlider from "@/components/fragments/arena/BetSlider.vue";
import ActionSlider from "@/components/fragments/arena/ActionSlider.vue";

const betOptions = [10, 100, 1000, 10000, 50000, 100000];
const actionOptions = [3, 5, 10];
const selectedBet = ref(betOptions[0]);
const selectedActions = ref(actionOptions[0]);
const isLoading = ref(false);

const startFight = () => {
  isLoading.value = true;
  // запуск поиска противника
};

const startBotFight = () => {
  // запуск боя с ботом
};
</script>

<style scoped>
.background-arena {
  background: url('@/assets/images/background_arena.webp') no-repeat center center;
}

.background-arena::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(to right bottom, black 35%, transparent 75%);
  z-index: 1;
}

.background-arena::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: black;
  z-index: 2;
  opacity: 1;
  animation: fadeOut 1s forwards;
}

@keyframes fadeOut {
  to {
    opacity: 0;
  }
}

.arena-container {
  position: relative;
  z-index: 10;
  overflow-y: auto;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
  color: white;
}

.arena-content-wrapper {
  width: 100%;
  padding: 10vh 0; /* Отступы для верхней, нижней и боковых сторон */
  box-sizing: border-box;
}

.bet-slider {
  margin-bottom: 20px;
}

.action-slider {
  margin-bottom: 20px;
}

.fight-button-wrapper {
  margin-top: 20px;
}

.fight-button {
  background-color: #ff4d4d;
  color: white;
  border: none;
  padding: 15px 30px;
  font-size: 1.2em;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.fight-button:hover {
  background-color: #ff1a1a;
}
</style>
