<template>
  <div class="background background-fight">
    <div class="fight-container">
      <div class="fight-content-wrapper">

        <div class="fighter fighter-left">
          <Fighter :actions="fighterActions" @actionSelected="onActionSelected('left', $event)"/>
        </div>

        <div class="fighter fighter-right">
          <Fighter :actions="fighterActions" @actionSelected="onActionSelected('right', $event)"/>
        </div>

        <div class="timer">
          <Timer :time="10" @timeout="submitActions"/>
        </div>


        <div class="round-button-wrapper">
          <button @click="submitActions" class="round-button">Раунд</button>
        </div>

        <Loader v-if="isLoading" :time="5" message="Матчинг..." @timeout="showResult"/>

      </div>
    </div>
  </div>
</template>

<script setup>
import {ref} from 'vue';
import Fighter from "@/components/fragments/fight/Fighter.vue";

const fighterActions = ["Атака головы", "Атака тела", "Защита головы", "Защита тела"];
const actionOptions = [3, 5, 10];
const selectedActions = ref(actionOptions[0]);
const isLoading = ref(false);

const onActionSelected = (side, action) => {
  // обработка выбора действия
};

const submitActions = () => {
  isLoading.value = true;
  // отправка выбранных действий
};

const showResult = () => {
  // показ результата боя
};
</script>

<style scoped>

.background-fight {
  background: url('@/assets/images/background_profile.webp') no-repeat center center;
}

.background-fight::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(to right bottom, black 35%, transparent 75%);
  z-index: 1;
}

.background-fight::after {
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

.fight-container {
  position: relative;
  z-index: 10;
  overflow-y: auto;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.fight-content-wrapper {
  width: 100%;
  padding: 10vh 0; /* Отступы для верхней, нижней и боковых сторон */
  box-sizing: border-box;
}

.fighter {
  display: inline-block;
  margin: 20px;
}

.timer {
  margin-top: 20px;
  margin-bottom: 20px;
}

.action-selection {
  margin-bottom: 20px;
}

.round-button-wrapper {
  margin-top: 20px;
}

.round-button {
  background-color: #ff4d4d;
  color: white;
  border: none;
  padding: 15px 30px;
  font-size: 1.2em;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.round-button:hover {
  background-color: #ff1a1a;
}
</style>
