<template>
  <div class="background background-arena">
    <div class="arena-container" @scroll="handleScroll">
      <div class="arena-content-wrapper">

        <div class="sliders-wrapper">
          <VCard class="slider-container">
            <div class="selected-value">{{ selectedBet }}<span>$</span></div>
            <div class="slider-label">{{ t('arena.lblYourBet') }}</div>
            <BetSlider v-model="selectedBet" balance=""/>
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
          <div class="text">{{ txtStatus }}</div>
          <div v-if="!isWaitingFight && isDisableFight" class="goto-training">{{ t('arena.lblGoToTraining') }} <span @click="btnTraining">{{ t('arena.btnGoToTraining') }}</span></div>

          <VBtn v-if="!isWaitingFight && !isDisableFight" width="180" @click="startFight" size="large"
                class="fight-btn">
            {{ t('arena.lblStartFight') }}
          </VBtn>


          <v-progress-circular
              v-if="isWaitingFight"
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
import {computed, onMounted} from 'vue';
import {useI18n} from "vue-i18n";

const {t} = useI18n({useScope: 'global'})

import BetSlider from "@/components/fragments/arena/BetSlider.vue";
import ActionSlider from "@/components/fragments/arena/ActionSlider.vue";
import TimeSlider from "@/components/fragments/arena/TimeSlider.vue";
import {showFightRulesReminder} from "@/core/services/masterService.js";
import store from "@/core/state/store.js";
import router from "@/router/index.js";

const params = computed(() => {
  return store.getters['fight/getArenaSettings']();
});

// Тут отправляем в экшен, потому что нужно еще проверять баланс через рутовый геттер
const selectedBet = computed({
  get: () => params.value.bet,
  set: (value) => store.dispatch('fight/setArenaSettings', {...params.value, bet: value})
});

const selectedActions = computed({
  get: () => params.value.actions,
  set: (value) => store.commit('fight/setArenaSettings', {...params.value, actions: value})
});

const selectedTime = computed({
  get: () => params.value.time,
  set: (value) => store.commit('fight/setArenaSettings', {...params.value, time: value})
});

const isDisableFight = computed(() =>
    params.value.isDisableFight
);
const isWaitingFight = computed(store.getters['fight/isWaitingFight']);
const txtStatus = computed(store.getters['fight/getMsgStatus']);

const startFight = async () => {
  await store.dispatch("fight/startFight")
};

// Показать напоминание если это первый бой
showFightRulesReminder(t("info.firstFight"));

const emit = defineEmits(['scroll']);

const handleScroll = (event) => {
  emit('scroll', event.target.scrollTop);
};

const btnTraining = () => {
    router.push("/training" )
}

onMounted(() => {
  store.dispatch("fight/setArenaSettings", params.value) // Запускаем со стартовыми параметрами

  // Amplitude
  ampli.logEvent('OpenArenaView');
})

</script>

<style scoped>
.background-arena {
  background: url('@/assets/images/background_arena.webp') no-repeat center center;
}

.background-arena::before {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(to right bottom, black 25%, transparent 75%);
  z-index: 1;
}

.background-arena::after {
  content: "";
  position: fixed;
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
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  -webkit-overflow-scrolling: auto; /* Отключить резиновый скролл*/
  overscroll-behavior-y: none;
}

@supports (height: 100dvh) {
  .arena-container {
    height: 100dvh;
  }
}


.arena-content-wrapper {
  width: 100%;
  box-sizing: border-box;
  max-width: 1024px;
  margin: 0 auto;
}


.sliders-wrapper {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding-top: calc((100vh - 100%) / 3)

}

.slider-container {
  border: none !important;
  width: 75px;
  text-align: center;
  padding: 0;
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
  padding: 10px 0 5px 0;
  font-size: 1.1em;
}

.slider-label {
  font-size: 0.6em;
  color: var(--gray2);
  overflow: hidden;
}

.selected-value span {
  font-size: 0.7em;
  padding-left: 1px;
  color: var(--gray2);

}

.fight-button-wrapper {
  position: relative;
  margin-top: 15px;
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
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
  font-size: 1rem;
}

/*.btn-help-container {
  position: absolute;
  top: 71%;
  right: 20px;
  transform: translateY(-69%);
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
}*/

.scroll-gap {
  display: block;
  position: relative;
  height: 150px;

}

.goto-training{
  color: white;
  max-width: 220px;
  text-align: center;
  font-size: 0.8rem;
  padding: 10px;
  background-color: var(--black-opacity-80);
  border-radius: 4px;
  line-height: 1.2;
}

.goto-training span{
  font-size: 1.5em;
  color: var(--primary-color);
}

</style>
