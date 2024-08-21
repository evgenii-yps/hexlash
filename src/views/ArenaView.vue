<template>
  <div class="background background-arena">
    <div class="arena-container">
      <div class="arena-content-wrapper">

        <div class="sliders-wrapper">
          <VCard class="slider-container">
            <div class="selected-value">{{ selectedBet }}<span>$</span></div>
            <div class="slider-label">Ваша ставка</div>
            <BetSlider v-model="selectedBet"/>
          </VCard>

          <VCard class="slider-container">
            <div class="selected-value">{{ selectedActions }}</div>
            <div class="slider-label">Кол-во ударов</div>
            <ActionSlider v-model="selectedActions"/>
          </VCard>

          <VCard class="slider-container">
            <div class="selected-value">{{ selectedTime }}<span>сек</span></div>
            <div class="slider-label">Время боя</div>
            <TimeSlider v-model="selectedTime" :isBlocked="true"/>

            <div class="blocked"><img src="@/assets/images/icon_lock.png" alt=""></div>

          </VCard>
        </div>

        <div class="fight-button-wrapper">
          <div class="text">{{ txtStatus }}</div>
          <VBtn v-if="!isLoading" @click="startFight" size="x-large" class="fight-btn">Start fight</VBtn>
          <v-progress-circular
              v-if="isLoading"
              class="loader"
              size="40"
              indeterminate
          />
        </div>


      </div>
    </div>
  </div>
</template>

<script setup>
import {ref} from 'vue';
import BetSlider from "@/components/fragments/arena/BetSlider.vue";
import ActionSlider from "@/components/fragments/arena/ActionSlider.vue";
import TimeSlider from "@/components/fragments/arena/TimeSlider.vue";
import router from "@/router/index.js";

const selectedBet = ref(10);
const selectedActions = ref(3);
const selectedTime = ref(10);
const isLoading = ref(false);
const txtStatus = ref("It's time to test your resolve");

const startFight = () => {
  isLoading.value = true;
  txtStatus.value = "The search for a worthy opponent...";

  setTimeout(() => {
    //TODO id боя получить
    //router.push({path: `/fight/${club.id}`});
    router.push({path: `/fight/1`});
  }, 1000);
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
   background: linear-gradient(to right bottom, black 25%, transparent 75%);
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
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  height: 100vh;

}

.arena-content-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.sliders-wrapper {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
}

.slider-container {
  border: none !important;
  width: auto;
  min-width: 80px;
  text-align: center;
  margin: 0 10px;
}

.blocked {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.blocked img {
  max-width: 75%;
  object-fit: contain;
}

.selected-value {
  padding: 10px 10px 5px 10px;
  font-size: 1.3em;
}

.slider-label {
  font-size: 0.7em;
  color: var(--gray2);
}

.selected-value span {
  font-size: 0.8em;
  padding-left: 1px;
  color: var(--gray2);
}

.fight-button-wrapper {
  margin-top: 30px;
}

.fight-button-wrapper .text{
  text-align: center;
}

.loader{
  margin: 10px auto;
  display: block;
}

.fight-btn {
  cursor: pointer;
  background-color: var(--primary-color);
  color: white !important;
  margin: 10px;
}
</style>
