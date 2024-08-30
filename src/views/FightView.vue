<template>
  <div class="background background-fight">
    <div class="fight-container">
      <div class="fight-content-wrapper" v-if="fight">

        <div class="progress-container">
          <p>{{ txtProgress }}</p>
          <div class="progress">
            <v-progress-linear
                class="progress-linear"
                :model-value="progressInPercent"
            ></v-progress-linear>
          </div>
        </div>

        <div class="fight-again" v-if="fight.isCompleted">
          <VBtn
              size="small"
              class="btn-again"
              @click="btnAgain">
            <img src="@/assets/images/icon_arrow.svg" alt="" class="custom-icon"/>
          </VBtn>
          {{ t('fight.btnNextFight') }}
        </div>

        <!-- Обратный отсчет -->
        <transition-group name="fade-scale" tag="div" class="countdown" v-if="!fight.isCompleted">
          <div v-if="countdown !== 0" :key="countdown" class="countdown-item">
            <p>{{ countdown }}</p>
          </div>
        </transition-group>


        <div class="fighters-container">
          <div class="fighter fighter-left">
            <Fighter
                :flipped="false"
                :action="master.userData.id === fighterOne.id ? meAction : rivalAction"
                :userData="fighterOne"
                :isMaster="master.userData.id === fighterOne.id"
                :isMoveCircles="isMoveCircles && master.userData.id !== fighterOne.id"
                :isVisibleCircles="isVisibleCircles"
                :statusFighter="leftFighterStatus"/>
          </div>

          <div class="fighter fighter-right">
            <Fighter
                :flipped="true"
                :action="master.userData.id === fighterTwo.id ? meAction : rivalAction"
                :userData="fighterTwo"
                :isMaster="master.userData.id === fighterTwo.id"
                :isMoveCircles="isMoveCircles && master.userData.id !== fighterTwo.id"
                :isVisibleCircles="isVisibleCircles"
                :statusFighter="rightFighterStatus"/>
          </div>
        </div>

        <div class="fighters-result">
          <div class="result-left">
            <div v-for="(square, index) in countActionArray" :key="index" class="result-square">
              {{ leftResults[index] || '' }}
            </div>
          </div>

          <VBtnDark
              size="small"
              class="btn-help"
              @click="dialogHelp = true">
            ?
          </VBtnDark>

          <!-- Модальное окно помощи -->
          <VModal v-model="dialogHelp" max-width="500" @click:outside="hideHelp">
            <VCard>
              <v-card-title class="headline">{{ t('fight.modalHelpTitle') }}</v-card-title>
              <v-card-text v-html="t('fight.modalHelpTextHtml')" class="text-center"/>
              <v-card-actions>
                <v-spacer></v-spacer>
                <VBtn @click="hideHelp" class="confirm-btn">{{ t('modal.btnOk') }}</VBtn>
              </v-card-actions>
            </VCard>
          </VModal>

          <div class="result-right">
            <div v-for="(square, index) in countActionArray" :key="index" class="result-square">
              {{ rightResults[index] || '' }}
            </div>
          </div>
        </div>


        <!--<div class="fight-id">Fight id: {{ fightId }}</div>-->

      </div>

      <div v-else>
        <div class="loader-container">
          <v-progress-circular
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
import {computed, onMounted, ref} from 'vue';
import {COUNTDOWN} from "@/core/constants.js";
import Fighter from "@/components/fragments/fight/Fighter.vue";
import store from "@/core/state/store.js";
import {useRoute} from "vue-router";
import {useI18n} from "vue-i18n";

const {t} = useI18n({useScope: 'global'})

const countdown = ref(COUNTDOWN); // Обратный отсчет перед началом боя

// Массив для отображения countAction квадратиков
const countActionArray = ref(null);

const txtProgress = ref(`${t('fight.progress')}`);

// Создаем ref для хранения текущего боя
const fight = ref(null);
const progressTime = ref(null);  // Время, за которое прогресс должен завершиться

const isMoveCircles = ref(false);
const isVisibleCircles = ref(false);
const dialogHelp = ref(false);

// Результаты боя в виде массивов
const leftResults = ref([]);
const rightResults = ref([]);

const leftFighterStatus = ref('');
const rightFighterStatus = ref('');

const route = useRoute();

const progressValue = ref(1000);  // Начальное значение прогресса 100%
const progressInPercent = computed(() => progressValue.value / 10);

const master = computed(() => store.getters['master/getMaster']);
const fighterOne = computed(() => store.getters['fight/getFighterOne']);
const fighterTwo = computed(() => store.getters['fight/getFighterTwo']);

const hideHelp = () => {
  dialogHelp.value = false;
}

const btnAgain = () => {
  console.log("new fight");
}

const meAction = (action) => {
  if (!isVisibleCircles.value) return;

  let targetResults = master.value.userData.id === fighterOne.value.id ? leftResults : rightResults;

  if (targetResults.value.length >= countActionArray.value.length) return;

  let val = '';
  if (action === 'head') {
    val = 'HD';
  } else if (action === 'body') {
    val = 'BD';
  }

  // Проверка на допустимость действия
  if (!isValidAction(val)) {
    return;
  }

  targetResults.value.push(val);

  // TODO отправить в сокет

  if (targetResults.value.length >= countActionArray.value.length) {
    isVisibleCircles.value = false;
    txtProgress.value = t('fight.waitingForOpponent');
  }
}

const rivalAction = (action) => {
  if (!isVisibleCircles.value) return;

  let targetResults = master.value.userData.id === fighterOne.value.id ? leftResults : rightResults;

  if (targetResults.value.length >= countActionArray.value.length) return;

  let val = '';
  if (action === 'head') {
    val = 'HH';
  } else if (action === 'body') {
    val = 'BH';
  }

  // Проверка на допустимость действия
  if (!isValidAction(val)) {
    return;
  }

  targetResults.value.push(val);

  // TODO отправить в сокет

  if (targetResults.value.length >= countActionArray.value.length) {
    isVisibleCircles.value = false;
    txtProgress.value = t('fight.waitingForOpponent');
  }
}

const isValidAction = (newAction) => {
  const attackActions = ['HH', 'BH']; // Список всех атакующих действий
  const defenseActions = ['HD', 'BD']; // Список всех защитных действий

  // Определяем, какой массив нужно проверять в зависимости от позиции мастера
  const targetResults = master.value.userData.id === fighterOne.value.id ? leftResults : rightResults;

  // Подсчитываем количество атак и защит в текущем массиве
  const attackCount = targetResults.value.filter(action => attackActions.includes(action)).length;
  const defenseCount = targetResults.value.filter(action => defenseActions.includes(action)).length;

  const maxActions = countActionArray.value.length;

  // Правило: если в массиве уже maxActions - 1 атаки и новая тоже атака - запрещаем её
  if (attackActions.includes(newAction) && attackCount >= maxActions - 1 && defenseCount === 0) {
    return false;
  }

  // Правило: если в массиве уже maxActions - 1 защиты и новая тоже защита - запрещаем её
  if (defenseActions.includes(newAction) && defenseCount >= maxActions - 1 && attackCount === 0) {
    return false;
  }

  return true;
};

// Функция для управления обратным отсчетом
const startCountdown = () => {
  // Время начала боя на сервере (с учетом добавленных X секунд)
  const serverStartTime = fight.value.fightDate.getTime();

  // Время на клиенте
  const clientStartTime = Date.now();

  // Разница между серверным и клиентским временем
  const timeForStart = serverStartTime - clientStartTime;
  if (timeForStart <= 0) {
    // Если бой уже должен был начаться, сразу запускаем бой
    countdown.value = 0;
    isMoveCircles.value = true;
    isVisibleCircles.value = true;
    startProgressLinear();
    return;
  }

  // Расчет интервала для отсчета
  const adjustedInterval = timeForStart / COUNTDOWN;

  const interval = setInterval(() => {
    if (countdown.value > 1) {
      countdown.value -= 1;
    } else {
      countdown.value = 'Fight!';
      clearInterval(interval);

      // Запуск движений кружков после отсчета
      setTimeout(() => {
        countdown.value = 0;
        isMoveCircles.value = true;
        isVisibleCircles.value = true;
        startProgressLinear();
      }, 100);
    }
  }, adjustedInterval);
};

// Функция для управления обратным отсчетом прогресса
const startProgressLinear = () => {

  const intervalTime = 10; // Интервал обновления в миллисекундах
  const step = progressValue.value / (progressTime.value * 100); // Один шаг каждые 10ms

  const interval = setInterval(() => {
    if (progressValue.value > 0) {
      progressValue.value -= step;
    } else {
      progressValue.value = 0;
      clearInterval(interval);
      onFightEnd();  // Вызываем функцию, когда бой завершен
    }
  }, intervalTime);
};

const onFightEnd = () => {
  isVisibleCircles.value = false;
  progressValue.value = 0;
  countdown.value = 0;
  txtProgress.value = t('fight.fightFinished');


  store.dispatch('fight/endFight');

  // TEMP
  leftFighterStatus.value = 'WIN';
  rightFighterStatus.value = 'LOSE';
  //TODO

};

onMounted(async () => {
  // TODO загрузить бой по id из базы данных и с апи сервера, если не новый бой

  fight.value = await store.dispatch('fight/getFightById', route.params.id);

  countActionArray.value = Array.from({length: fight.value.actions});


  if (!fight.value.isCompleted) {
    // Инициируем текущий бой
    progressTime.value = fight.value.duration;

    // Инициировать состояние, на котором был прерван процесс
    // TODO

    startCountdown();

  } else {
    // Бой уже завершен давно, заходим посмотреть результаты
    //TODO это кстати может быть даже не мой бой, я просто захожу по ссылки
  }
});


</script>

<style scoped>
.background-fight {
  background: url('@/assets/images/background_page.webp') no-repeat center center;
  background-size: cover;
  animation: moveBackground 2s ease-in-out forwards;
}

.background-fight::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(to right top, black 25%, transparent 125%);
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

@keyframes moveBackground {
  0% {
    background-position: right center;
  }
  100% {
    background-position: center center;
  }
}

.fight-container {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  color: white;
  height: 100vh;
  overflow-y: auto;
  max-height: 100vh;
}

.fight-content-wrapper {
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

.fight-again {
  position: absolute;
  left: 50%;
  bottom: 30%;
  width: 100px;
  transform: translate(-50%, -50%);
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
  color: var(--gray2);
  animation: againAnimation 0.5s ease-in-out forwards;
}

.btn-again img {
  width: 30px;
  height: 30px;
  text-align: center;
}

.btn-again {
  position: relative;
  width: 60px;
  height: 60px;
  cursor: pointer;
  border-radius: 50%;
  margin-bottom: 5px;
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


.progress-container {
  width: 100%;
  max-width: 500px;
  padding: 0 20px;
  margin-bottom: 5px;
}

.progress-container p {
  text-align: center;
  margin-bottom: 5px;
}

.progress {
  border-radius: 10px;
  padding: 15px;
  background-color: var(--black-opacity-80);
}

.progress-linear {
  height: 6px !important;
  transition: width 0.1s linear;
}


.fighters-container {
  flex-direction: row;
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 500px;
}

.countdown {
  position: absolute;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 4em;
  color: white;
  z-index: 100;
  /*background-color: var(--black-opacity);*/
  padding: 10px 20px 10px 20px;
  border-radius: 4px;
}

/* Анимация появления и масштабирования */
.fade-scale-enter-active, .fade-scale-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.fade-scale-leave-to {
  opacity: 0;
  transform: scale(3.5);
}

.fade-scale-enter-to {
  opacity: 1;
  transform: scale(1);
}

.countdown-item {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.fighters-result {
  flex-direction: row;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 500px;
  margin-top: 10px;
}

.result-left, .result-right {
  display: flex;
  width: 200px;
  text-align: center;
  justify-content: center;
  flex-wrap: wrap;
  row-gap: 10px; /* Отступ между строками */
  column-gap: 5px;
}

.result-square {
  background-color: var(--black-opacity-80);
  border-radius: 4px;
  border: 1px solid var(--gray2);
  width: 30px;
  height: 30px;
  align-items: center;
  display: flex;
  justify-content: center;
  color: var(--gray2);
}

.text-center {
  color: var(--gray2);
}

.fight-id {
  display: flex;
  justify-content: center;
  flex-grow: 1;
  align-items: center;
  font-size: .8em;
  text-transform: uppercase;
  color: var(--gray2);
  margin-top: 20px;
  margin-bottom: 5vh;
  width: 100%;
  text-align: center;
  max-width: 500px;
}


/* Определение анимации */
@keyframes againAnimation {
  0% {
    opacity: 0;
    transform: translateX(-50%) translateY(-50%) scale(3);
  }
  100% {
    opacity: 1;
    transform: translateX(-50%) translateY(-50%) scale(1);
  }
}

.loader-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, 50%);
  display: flex;
  flex-direction: column;
  align-items: center;
}


</style>
