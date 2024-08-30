<template>
  <div class="background background-training">
    <div class="training-container">
      <div class="training-content-wrapper">

        <div v-if="!loadingPunchInfo && !isTrainingBlocked" class="training-punch-container">


<!--          <v-img :src="PunchImage" aspect-ratio="1"
                 class="punch-img"/>-->
          <Punch3D class="punch-img"/>

          <div class="circle-container" @click="handleClickPunch($event, false, COST_PER_CLICK)">

            <!-- Кружок -->
            <div class="movement-container" ref="hitCircleRef">
              <div class="pulsing-circle" @click.stop="handleCircleClick($event, hitCircleRef)">
                <div class="wave-circle"></div>
              </div>
            </div>

            <!-- Элементы для отображения чисел -->
            <div v-for="(num, index) in numbersAnimations" :key="index" class="number-animation" :style="num.style">+{{
                num.value
              }} &cent;
            </div>

          </div>

        </div>

        <div class="training-title">Training room</div>

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
          <div class="timer-text">{{t('training.timerText')}}</div>
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

import {useI18n} from "vue-i18n";
import Punch3D from "@/components/fragments/training/Punch3D.vue";
import {Howl} from "howler";

const {t} = useI18n({useScope: 'global'})

const numbersAnimations = ref([]);
const hitCircleRef = ref(null);

const intervalId = ref(null);  // Для сохранения идентификатора интервала
const countdownText = ref('');

const socialTasks = computed(() => store.getters['task/getAllSocialTasks']);
const dailyTasks = computed(() => store.getters['task/getAllDailyTasks']);
const punchInfo = computed(() => store.getters['punch/getPunchInfo']);

const loadingSocialTasks = computed(() => store.state.task.isLoadingSocialTasks);
const loadingDailyTasks = computed(() => store.state.task.isLoadingDailyTasks);
const loadingPunchInfo = computed(() => store.state.punch.isLoadingPunchInfo);
const isTrainingBlocked = computed(() => store.state.punch.isTrainingBlocked);

const hasIncompleteSocialTasks = computed(() => store.getters['task/hasIncompleteSocialTasks']);
const hasIncompleteDailyTasks = computed(() => store.getters['task/hasIncompleteDailyTasks']);


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

  numbersAnimations.value.push(newNumber);

  store.dispatch('punch/handlePunch', value);

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
    const remainingTime = punchInfo.value.unixTimeStart - currentTime;

    if (remainingTime <= 0) {
      stopCountdown();
      countdownText.value = ''; // Время прошло, можем тренироваться
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

onBeforeMount( () => {
  store.dispatch('punch/synchronizePunchResetTime');
  store.dispatch('task/fetchAllSocialTasks');
  store.dispatch('task/fetchAllDailyTasks');

})

onUnmounted(() => {
  stopPunch();
  stopCountdown();
});

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
  background: linear-gradient(to top, black 0%, transparent 100%);
  z-index: 1;
  width: 100vw;
  height: 100vh;
}


.background-training::after {
  content: "";
  position: absolute;
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
  max-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  color: white;
}

.training-content-wrapper {
  width: 100%;
  padding: 10vh 0;
  box-sizing: border-box;
  max-width: 1024px;
  margin: 0 auto;
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
  height: 400px;
  width: 300px;
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);

}

.training-title {
  font-family: Anonymous, sans-serif;
  font-size: 2.5rem;
  z-index: 100;
  margin-bottom: 260px;
}

.scroll-gap {
  display: block;
  position: relative;
  height: 50px;
}

.circle-container {
  height: 240px;
  width: 215px;
  position: absolute;
  top: 120px;
  left: 50%;
  transform: translateX(-50%);
}


.movement-container {
  position: relative;
  width: 50px;
  height: 50px;
}

.pulsing-circle {
  position: absolute;
  width: 50px;
  height: 50px;
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
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  justify-content: center;
  flex-direction: column;
}

.timer-overlay {
  font-size: 4rem;
  background-color: var(--black-opacity-80);
  padding: 10px;
  border-radius: 10px;
  display: flex;
}

.timer-text {
  margin-top: 20px;
  display: flex;
  font-size: 1.1em;
  color: var(--dark);
  text-align: center;
}

</style>
