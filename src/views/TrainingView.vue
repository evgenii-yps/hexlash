<template>
  <div class="background background-training">
    <div class="training-container" @scroll="handleScroll">
      <div class="training-content-wrapper">

        <div v-if="!loadingPunchInfo && !isTrainingBlocked" class="training-punch-container">

          <div v-if="is2DPunch">
            <v-img :src="PunchImage" aspect-ratio="1" class="punch-img"/>
          </div>
          <div v-else>
            <div v-if="delayLoader3dModel" class="loader-container">
              <v-progress-circular
                  class="loader"
                  size="50"
                  indeterminate
              />
            </div>
            <Punch3D class="punch-img"/>
          </div>

          <div class="circle-container" @click="handleClickPunch($event, false, COST_PER_CLICK)">

            <!-- Кружок -->
            <div class="movement-container" ref="hitCircleRef">
              <div class="pulsing-circle" @click.stop="handleCircleClick($event, hitCircleRef)">
                <div class="wave-circle"></div>
              </div>
            </div>

            <!-- Элементы для отображения чисел -->
            <div v-for="(num, index) in numbersAnimations" :key="num.id" class="number-animation" :style="num.style">
              +{{ num.value }} &cent;
            </div>

          </div>

        </div>

        <div class="training-title">{{ t.training.lblTitle }}</div>

        <!-- Прогрессия: тапы и опыт -->
        <div class="progression-bar">
          <div class="prog-resource">
            <span class="prog-label">{{ t.training.lblTaps }}</span>
            <span class="prog-value">{{ progressionTaps }}</span>
          </div>
          <div class="prog-divider"/>
          <div class="prog-resource">
            <span class="prog-label">{{ t.training.lblAvailableXP }}</span>
            <span class="prog-value prog-value-xp">{{ freeXP }} XP</span>
          </div>
        </div>

        <!-- Кнопки навигации к приёмам и колоде -->
        <div class="progression-actions">
          <button class="btn-prog" @click="goToMoves">{{ t.training.lblMoves }}</button>
          <button class="btn-prog btn-prog-deck" @click="goToDeck">{{ interpolate(t.training.lblDeck, { n: deckSize }) }}</button>
        </div>

        <div v-if="loadingPunchInfo" class="loader-container">
          <v-progress-circular
              class="loader"
              size="50"
              indeterminate
          />
        </div>

        <div v-if="isTrainingBlocked && countdownText.length > 0" class="timer-punch-container">
          <div class="timer-overlay">
            {{ countdownText }}
          </div>
          <div class="timer-text">{{t.training.timerText}}</div>
        </div>

        <!-- Компонент DailyTasks -->
        <DailyTasks
            :loadingDailyTasks="loadingDailyTasks"
            :hasIncompleteDailyTasks="hasIncompleteDailyTasks"
            :dailyTasks="dailyTasks"/>

        <!-- Компонент SocialTasks -->
        <SocialTasks
            :loadingSocialTasks="loadingSocialTasks"
            :hasIncompleteSocialTasks="hasIncompleteSocialTasks"
            :socialTasks="socialTasks"/>

        <div class="scroll-gap"/>
      </div>
    </div>
  </div>

</template>

<script setup>
import {computed, nextTick, onBeforeMount, onMounted, onUnmounted, ref, watch, watchEffect} from 'vue';
import clickSound from '@/assets/sound/punch_hit.mp3'
import PunchImage from "@/assets/images/punch.png"
import DailyTasks from "@/components/fragments/training/DailyTasks.vue"
import SocialTasks from "@/components/fragments/training/SocialTasks.vue";
import store from "@/core/state/store.js";
import {COST_PER_CLICK, MULTIPLAYER_EXACT_CLICK, SPEED_MOVE_PUNCH_MS} from "@/core/constants.js";

import {t, interpolate} from "@/locales/index.js";
import Punch3D from "@/components/fragments/training/Punch3D.vue";
import {Howl} from "howler";
import {showTrainingRulesReminder} from "@/core/services/masterService.js";
import * as amplitude from "@amplitude/analytics-browser";
import router from "@/router/index.js";



const numbersAnimations = ref([]);
const hitCircleRef = ref(null);

const intervalId = ref(null);  // Для сохранения идентификатора интервала
const countdownText = ref('');

const progressionTaps = computed(() => store.getters['progression/getTaps']);
const freeXP = computed(() => store.getters['progression/getFreeXP']);
const deckSize = computed(() => store.getters['progression/getDeck'].length);

const goToMoves = () => router.push('/training/moves');
const goToDeck = () => router.push('/training/deck');

const socialTasks = computed(() => store.getters['task/getAllSocialTasks']);
const dailyTasks = computed(() => store.getters['task/getAllDailyTasks']);
const punchInfo = computed(() => store.getters['punch/getPunchInfo']);

const loadingSocialTasks = computed(() => store.state.task.isLoadingSocialTasks);
const loadingDailyTasks = computed(() => store.state.task.isLoadingDailyTasks);
const loadingPunchInfo = computed(() => store.state.punch.isLoadingPunchInfo);
const isTrainingBlocked = computed(() => store.state.punch.isTrainingBlocked);

const hasIncompleteSocialTasks = computed(() => store.getters['task/hasIncompleteSocialTasks']);
const hasIncompleteDailyTasks = computed(() => store.getters['task/hasIncompleteDailyTasks']);

// Подключаем флаг 2D/3D
const is2DPunch = computed(() => store.getters['punch/is2DPunchEnabled']);

const delayLoader3dModel = ref(true);

const playSound1 = () => {
  const sound = new Howl({
    src: [clickSound]
  });
  sound.play();
}

const moveCircle = (circle) => {
  const container = circle.parentElement;
  const maxX = container.clientWidth - circle.clientWidth - 40;
  const maxY = container.clientHeight - circle.clientHeight;

  const randomX = Math.floor(Math.random() * maxX);
  const randomY = Math.floor(Math.random() * maxY);

  circle.style.transform = `translate(${randomX}px, ${randomY}px) scale(0.1)`;
  circle.style.transition = 'transform 0s'; // Без анимации для движения

  setTimeout(() => {
    // Анимация только для масштабирования
    circle.style.transform = `translate(${randomX}px, ${randomY}px) scale(1)`;
    circle.style.transition = 'transform 0.2s ease-in-out';
  }, 100);

  // Постоянное движение с сохранением масштаба
  setTimeout(() => moveCircle(circle), SPEED_MOVE_PUNCH_MS);
};
const handleClickPunch = (event, isFromCircleClick = false, value) => {

  const target = event.target;
  let left, top;

  if (isFromCircleClick) {

    playSound1();

    const circle = hitCircleRef.value;
    const container = circle.parentElement.getBoundingClientRect();

    left = event.clientX - container.left - 15;
    top = event.clientY - container.top - 60;

  } else {

    const rect = target.getBoundingClientRect();
    left = event.clientX - rect.left - 15;
    top = event.clientY - rect.top - 40;
  }

  const newNumber = {
    id: Date.now(), // уникальный ID для каждого числа
    value: value, // значение
    style: {
      left: `${left}px`,
      top: `${top}px`,
      color: isFromCircleClick ? 'var(--pink)' : 'white',
    },
  };

  if (numbersAnimations.value.length >= 20) {
    numbersAnimations.value.shift();
  }

  // Добавляем новое число в массив
  numbersAnimations.value.push(newNumber);

  store.dispatch('punch/handlePunch', value);
  store.dispatch('progression/addTap');

  // Вибрация при клике
  if (navigator.vibrate) {
    navigator.vibrate(50);
  }

};
const handleCircleClick = (event, circle) => {
  const pulsingCircle = circle.querySelector('.pulsing-circle');
  const waveCircle = pulsingCircle.querySelector('.wave-circle');

  pulsingCircle.classList.add("clicked");

  setTimeout(() => {
    pulsingCircle.classList.remove("clicked");
  }, 100);

  // Добавляем класс для волны
  waveCircle.style.transform = "scale(2.5)";
  waveCircle.style.opacity = "0.3";

  // Убираем анимацию волны через 300ms
  setTimeout(() => {
    waveCircle.style.opacity = "0";
    waveCircle.style.transform = "scale(0)";
  }, 300);

  // Добавление нового числа в массив
  handleClickPunch(event, true, COST_PER_CLICK * MULTIPLAYER_EXACT_CLICK);
};

// Функция запуска обратного отсчета
const startCountdown = () => {
  intervalId.value = setInterval(() => {
    const currentTime = Math.floor(Date.now() / 1000);
    const intervalStartTime = Math.floor(punchInfo.value.intervalStartMs / 1000);
    const remainingTime = intervalStartTime - currentTime;

    if (remainingTime <= 0) {
      stopCountdown();
      countdownText.value = ''; // Время прошло, можем тренироваться
      store.dispatch('punch/synchronizePunchInfo');
    } else {
      // Обновляем текст обратного отсчета
      const hours = Math.floor(remainingTime / 3600);
      const minutes = Math.floor((remainingTime % 3600) / 60);
      const seconds = remainingTime % 60;
      countdownText.value = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }, 1000);
};


const stopCountdown = () => {
  if (intervalId.value) {
    clearInterval(intervalId.value);
    intervalId.value = null;
  }
}

const startPunch = () => {
  // Запускаем таймер
  store.dispatch('punch/startPunchTimer');
}

const stopPunch = () => {
  store.dispatch('punch/stopPunchTimer');
}

watch(isTrainingBlocked, (newValue) => {
  if (newValue) {
    startCountdown();
    stopPunch();
  } else {
    startPunch();
    stopCountdown();
  }
}, {immediate: true});

watchEffect(() => {
  if (hitCircleRef.value) {
    moveCircle(hitCircleRef.value);
  }
});


const emit = defineEmits(['scroll']);

const handleScroll = (event) => {
  emit('scroll', event.target.scrollTop);
};


onBeforeMount( () => {
  store.dispatch('punch/synchronizePunchInfo');
  store.dispatch('task/fetchAllSocialTasks');
  store.dispatch('task/fetchAllDailyTasks');

})

onMounted(() => {
  setTimeout(() => {
    delayLoader3dModel.value = false
  }, 10000);
  // Показать пояснение что это за раздел
  showTrainingRulesReminder(t.value.info.firstTraining);

  // Amplitude
  amplitude.track('OpenTrainingView');
})


onUnmounted(() => {
  //stopPunch();
  stopCountdown();
});


</script>

<style scoped>
.background-training {
  background: url('@/assets/images/background_trainings.webp') no-repeat center center;
}

.background-training::before {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  background: linear-gradient(to top, black 0%, transparent 100%);
  z-index: 1;
  width: 100vw;
  height: 100vh;
}


.background-training::after {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  background: black;
  z-index: 2;
  opacity: 1;
  animation: fadeOut 1s forwards; /* Анимация */
  width: 100vw;
  height: 100vh;
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
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  color: white;
  -webkit-overflow-scrolling: auto; /* Отключить резиновый скролл*/
  overscroll-behavior-y: none;
}

@supports (height: 100dvh) {
  .training-container {
    height: 100dvh;
  }
}

.training-content-wrapper {
  width: 100%;
  box-sizing: border-box;
  max-width: 1024px;
  margin-top: 70px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.training-punch-container {
  width: 100%;
  height: 100%;

}

.punch-img {
  height: 350px;
  width: 225px;
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);

}

.training-title {
  font-family: Anonymous, sans-serif;
  font-size: 2rem;
  z-index: 100;
  margin-bottom: 210px;
}

.scroll-gap {
  display: block;
  position: relative;
  height: 50px;
  padding-bottom: 150px;
}

.circle-container {
  height: 200px;
  width: 200px;
  position: absolute;
  top: 90px;
  left: 50%;
  transform: translateX(-50%);
  border-radius: 20%;
  outline: none;
  -webkit-tap-highlight-color: transparent;
}


.movement-container {
  position: relative;
  width: 40px;
  height: 40px;
}

.pulsing-circle {
  position: absolute;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--black-opacity);
  animation: pulse 2s infinite;
  border: 2px solid gray;
  transition: transform 0.5s ease;
  cursor: pointer;
}

.pulsing-circle.clicked {
  transform: scale(1.5) !important;
  border-color: var(--primary-color);
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

.wave-circle {
  position: absolute;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--primary-color);
  opacity: 0;
  transform: scale(0);
  transition: transform 0.3s ease;
}

.pulsing-circle.clicked .wave-circle {
  transform: scale(3); /* Максимальный размер волны */
  opacity: 0.3;
}

.number-animation {
  position: absolute;
  font-size: 1.5em;
  color: var(--white);
  display: flex;
  flex-wrap: nowrap;
  width: 50px;
  animation: moveUp 1s ease forwards, fadeOut 1s ease forwards;
  pointer-events: none;

}

@keyframes moveUp {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-150px);
  }
}

@keyframes fadeOut {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

.loader-container {
  position: absolute;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
}

.timer-punch-container {
  position: absolute;
  top: 15%;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  justify-content: center;
  flex-direction: column;
}

.timer-overlay {
  font-size: 3rem;
  background-color: var(--black-opacity-80);
  padding: 10px;
  border-radius: 10px;
  display: flex;
  justify-content: center;
}

.timer-text {
  margin-top: 20px;
  display: flex;
  font-size: 1.1em;
  color: var(--dark);
  text-align: center;
}

.progression-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--black-opacity-80);
  border: 1px solid var(--gray1);
  border-radius: 4px;
  padding: 8px 12px;
  margin-bottom: 10px;
  flex-wrap: wrap;
  justify-content: center;
  width: 90%;
  max-width: 400px;
  box-sizing: border-box;
}

.prog-resource {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.prog-label {
  font-size: 0.65rem;
  color: var(--gray2);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.prog-value {
  font-family: AnonymousBalance, sans-serif;
  font-size: 0.9rem;
  color: var(--pink);
}

.prog-value-xp {
  text-shadow: 0 0 8px rgba(255, 6, 111, 0.4);
}

.prog-divider {
  width: 1px;
  height: 28px;
  background: var(--gray1);
}

.progression-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.btn-prog {
  padding: 8px 20px;
  background: var(--black-opacity-80);
  border: 1px solid var(--gray1);
  border-radius: 4px;
  color: var(--gray3);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-prog:hover {
  border-color: var(--pink);
  color: var(--pink);
}

.btn-prog-deck {
  border-color: rgba(255, 6, 111, 0.4);
  color: var(--gray3);
}

</style>
