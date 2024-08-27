<template>
  <div class="background background-arena">
    <div class="arena-container">
      <div class="arena-content-wrapper">

        <div class="sliders-wrapper">
          <VCard class="slider-container">
            <div class="selected-value">{{ selectedBet }}<span>$</span></div>
            <div class="slider-label">{{ t('arena.lblYourBet') }}</div>
            <BetSlider v-model="selectedBet"/>
          </VCard>

          <VCard class="slider-container">
            <div class="selected-value">{{ selectedActions }}</div>
            <div class="slider-label">{{ t('arena.lblNumberOfHits') }}</div>
            <ActionSlider v-model="selectedActions"/>
          </VCard>

          <VCard class="slider-container">
            <div class="selected-value">{{ selectedTime }}<span>{{ t('arena.lblSeconds') }}</span></div>
            <div class="slider-label">{{ t('arena.lblFightTime') }}</div>
            <TimeSlider v-model="selectedTime" :isBlocked="true"/>

            <div class="blocked"><img src="@/assets/images/icon_lock.png" alt=""></div>

          </VCard>
        </div>

        <div class="fight-button-wrapper">
          <!--          <div class="btn-help-container">
                      <VBtnDark
                          size="small"
                          class="btn-help"
                          @click="dialogHelp = true">
                        ?
                      </VBtnDark>
                    </div>-->
          <div class="text">{{ txtStatus }}</div>
          <VBtn v-if="!isLoading" width="200" @click="startFight" size="x-large" class="fight-btn">
            {{ t('arena.lblStartFight') }}
          </VBtn>
          <v-progress-circular
              v-if="isLoading"
              class="loader"
              size="40"
              indeterminate
          />
        </div>

        <div class="scroll-gap"/>

      </div>
    </div>
  </div>
</template>

<script setup>
import {ref} from 'vue';
import {useI18n} from "vue-i18n";

const {t} = useI18n({useScope: 'global'})

import BetSlider from "@/components/fragments/arena/BetSlider.vue";
import ActionSlider from "@/components/fragments/arena/ActionSlider.vue";
import TimeSlider from "@/components/fragments/arena/TimeSlider.vue";
import router from "@/router/index.js";

const selectedBet = ref(10);
const selectedActions = ref(3);
const selectedTime = ref(10);
const isLoading = ref(false);
const txtStatus = ref(t('arena.lblTestResolve'));

const startFight = () => {
  isLoading.value = true;
  txtStatus.value = t('arena.lblSearchOpponent');

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
  overflow-y: auto;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;

}

.arena-content-wrapper {
  width: 100%;
  padding: 10vh 0;
  box-sizing: border-box;
  max-width: 1024px;
  margin: 0 auto;
}


.sliders-wrapper {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  margin-top: calc((100vh - 100%) / 10);
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
  position: relative;
  margin-top: 30px;
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
}

.btn-help-container {
  position: absolute;
  top: 71%;
  right: 20px;
  transform: translateY(-69%);
}

.fight-button-wrapper .text {
  text-align: center;
}

.loader {
  margin: 10px auto;
  display: block;
}

.fight-btn {
  cursor: pointer;
  background-color: var(--primary-color);
  color: white !important;
  margin: 10px;
}

.btn-help {
  display: flex;
  font-family: Anonymous, sans-serif;
  color: white;
  font-size: 2.5em;
  border-radius: 4px;
  width: 50px;
  height: 50px;
  cursor: pointer;
  border: 1px solid var(--gray2);
}

.scroll-gap {
  display: block;
  position: relative;
  height: 50px;
}

</style>
