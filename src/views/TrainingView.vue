<template>
  <div class="background background-training">
    <div class="training-container">
      <div class="training-content-wrapper">

        <div class="training-punch-container">
          <v-img :src="PunchImage" aspect-ratio="1"
                 class="punch-img"/>

          <div class="circle-container" @click="handleClickPunch($event, false, incomeForHit)">

            <div class="movement-container" ref="hitCircleRef">
              <!-- Кружок -->
              <div class="pulsing-circle" @click.stop="handleCircleClick($event, hitCircleRef)">
                <div class="wave-circle"></div>
              </div>
            </div>

            <!-- Элементы для отображения чисел -->
            <div v-for="(num, index) in numbers" :key="index" class="number-animation" :style="num.style">+{{
                num.value
              }} &cent;
            </div>

          </div>

        </div>

        <div class="training-title">Training room</div>

        <!-- Компонент DailyTasks -->
        <DailyTasks
            :dailyTasks="dailyTasks"
        />

        <!-- Компонент Checklist -->
        <Checklist
            v-if="isCompleteChecklist"
            :socialTasks="master?.socialTasks"
        />

        <div class="scroll-gap"/>
      </div>
    </div>
  </div>

</template>

<script setup>

import {computed, onMounted, ref} from 'vue';
import clickSound from '@/assets/sound/punch_hit.mp3'
import PunchImage from "@/assets/images/punch.png"
import DailyTasks from "@/components/fragments/training/DailyTasks.vue"
import Checklist from "@/components/fragments/training/Checklist.vue";
import store from "@/core/state/store.js";

const master = computed(() => store.getters['master/getMaster']);

const numbers = ref([]);
const incomeForHit = ref(2);
const hitCircleRef = ref(null);
const isCompleteChecklist = computed(() => {
      return master?.value.socialTasks?.some(task => !task.isCompleted)
    }
);

const dailyTasks = ref([
  {id: 1, description: 'Репост сообщения', tokens: 5, isCompleted: false, category: 'social_media_comment'},
  {id: 2, description: 'Комментарий в социальной сети', tokens: 3, isCompleted: true, category: 'social_media_comment'},
  {id: 3, description: 'Побить грушу 10 минут', tokens: 7, isCompleted: false, category: 'punch_bag_x_minutes'},
  {id: 4, description: 'Провести 5 боев', tokens: 10, isCompleted: false, category: 'fight_x_battles'},
]);


const soundHit1 = new Howl({
  src: [clickSound]
})

const playSound1 = () => {
  soundHit1.play();
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
  setTimeout(() => moveCircle(circle), 3000);
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

  numbers.value.push(newNumber);

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

  // Убираем анимацию волны через 500ms
  setTimeout(() => {
    waveCircle.style.opacity = "0";
    waveCircle.style.transform = "scale(0)";
  }, 300);

  // Добавление нового числа в массив
  handleClickPunch(event, true, incomeForHit.value * 3);
};


onMounted(() => {

  console.log(master.value)

  moveCircle(hitCircleRef.value);

  // TODO отправка с сокет
  //  удаление промежуточного буфера
  setInterval(() => {
    // Считаем общее число
    const totalValue = numbers.value.reduce((sum, num) => sum + num.value, 0);

    // Выводим общее число в консоль
    console.log('Total value:', totalValue);

    // Очищаем массив
    numbers.value = [];

  }, 10000);
})
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


</style>
