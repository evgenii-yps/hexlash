<template>
  <div class="fighter-container">

    <div class="fighter-info">
      <div class="fighter-avatar">
        <UserAvatar :avatarUrl="props.userData.avatarUrl" width="50px" height="50px"/>
      </div>
      <p>
        <UserName style="width: auto !important;" :userName="props.userData.name"/>
        <span class="you"> {{ strYou }}</span></p>
    </div>

    <div class="skin">

      <div v-if="statusFighter !== ''" class="status-fighter">{{ statusFighter }}</div>

      <v-img :src="`/images/skins/${fighterImage}`" aspect-ratio="1" :class="{'flipped': props.flipped}"
             class="skin-img"/>

      <div class="circle-container">
        <div class="movement-container" ref="headCircleRef">
          <!-- Кружок для головы -->
          <div class="pulsing-circle" @click="handleHeadClick" v-if="isVisibleCircles">
            <div class="wave-circle"></div>
          </div>
        </div>
      </div>

      <div class="circle-container-body">
        <div class="movement-container" ref="bodyCircleRef">
          <!-- Кружок для тела -->
          <div class="pulsing-circle" @click="handleBodyClick" v-if="isVisibleCircles">
            <div class="wave-circle"></div>
          </div>
        </div>
      </div>

    </div>

  </div>
</template>

<script setup>
import UserAvatar from "@/components/fragments/profile/UserAvatar.vue";
import UserName from "@/components/fragments/profile/UserName.vue";
import {computed, onMounted, ref, watch} from "vue";
import {VImg} from "vuetify/components";
import {useI18n} from "vue-i18n";

const {t} = useI18n({useScope: 'global'})

const props = defineProps({
  flipped: {
    type: Boolean,
    required: true,
  },
  userData: {
    type: Object,
    required: true,
    default: () => ({})
  },
  action: {
    type: Function,
    required: true
  },
  isMaster: {
    type: Boolean,
    default: false
  },
  isMoveCircles: {
    type: Boolean,
    default: false
  },
  isVisibleCircles: {
    type: Boolean,
    required: true,
    default: false
  },
  statusFighter: {
    type: String,
    required: true,
    default: ''
  }
});

const fighterImage = computed(() => props.userData.skin);
const strYou = computed(() => props.isMaster ? ` ${t('you')}` : "");
const isMoveCircles = computed(() => props.isMoveCircles);
const isVisibleCircles = computed(() => props.isVisibleCircles);
const statusFighter = computed(() => props.statusFighter);


const headCircleRef = ref(null);
const bodyCircleRef = ref(null);


const handleCircleClick = (circle, actionType) => {
  props.action(actionType);
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
};

const handleHeadClick = () => {
  const headCircle = headCircleRef.value;
  handleCircleClick(headCircle, "head");
};

const handleBodyClick = () => {
  const bodyCircle = bodyCircleRef.value;
  handleCircleClick(bodyCircle, "body");
};


/*const moveCircle = (circle) => {
  const container = circle.parentElement;
  const maxX = container.clientWidth - circle.clientWidth - 40;
  const maxY = container.clientHeight - circle.clientHeight;


  const randomX = Math.floor(Math.random() * maxX);
  const randomY = Math.floor(Math.random() * maxY);

  circle.style.transform = `translate(${randomX}px, ${randomY}px)`;
};*/


const moveCircleSmoothly = (circle) => {
  const container = circle.parentElement;
  const maxX = container.clientWidth - circle.clientWidth - 40;
  const maxY = container.clientHeight - circle.clientHeight;

  const randomX = Math.floor(Math.random() * maxX) - (maxX / 2);
  const randomY = Math.floor(Math.random() * maxY) - (maxY / 2);

  circle.style.transition = "transform 300ms linear"; // Плавное движение
  circle.style.transform = `translate(${randomX}px, ${randomY}px)`;

  setTimeout(() => moveCircleSmoothly(circle), 300); // Постоянное движение
};


watch(isMoveCircles, (newVal) => {
  if (newVal) {
    const circles = [headCircleRef.value, bodyCircleRef.value];
    circles.forEach((circle) => {
      moveCircleSmoothly(circle);
    });
  }
});


</script>

<style scoped>
.fighter-container {
  position: relative;
  display: inline-block;
}

.fighter-info {
  width: 100px;
  margin: 0 auto;
}

.fighter-info p {
  display: flex;
  flex-direction: row;
  text-align: center;
  align-items: center;
  margin-top: 3px;
  margin-bottom: 10px;
  font-size: 0.4em;
  justify-content: center;
}

.fighter-info p span {
  display: flex;
  font-size: 1.4em;
  color: var(--gray3);
  vertical-align: center;
  margin-left: 2px;
}


.fighter-avatar {
  display: flex;
  justify-content: center;
}

.skin {
  position: relative;
  width: 160px;
  height: 280px;
}

.skin-img {
  padding: 5px;
  position: absolute;
  height: 100%;
  width: 100%;
}

.skin-item :deep(.v-img__img) {
  position: relative;
  z-index: 1;

}

.flipped {
  transform: scaleX(-1); /* Горизонтальный флип */
}


.circle-container {
  position: relative;
  display: flex;
  height: 100px;
  width: 80%;
  margin: 0 auto;
  justify-content: center;
  align-items: center;
}

.circle-container-body {
  position: relative;
  display: flex;
  height: 120px;
  width: 80%;
  margin: 0 auto;
  justify-content: center;
  align-items: center;
}

.movement-container {
  position: relative;
  width: 30px;
  height: 30px;
}

.pulsing-circle {
  position: absolute;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: var(--black-opacity-80);
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
  width: 30px;
  height: 30px;
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

.status-fighter {
  position: absolute;
  bottom: 50%;
  left: 50%;
  z-index: 1;
  font-family: Anonymous, sans-serif;
  font-size: 3em;
  opacity: 0;
  background-color: var(--black-opacity-80);
  padding: 0 20px;
  animation: winAnimation 0.5s ease-in-out forwards;
  border-radius: 4px;
}

/* Определение анимации */
@keyframes winAnimation {
  0% {
    opacity: 0;
    transform: translateX(-50%) translateY(-50%) scale(3);
  }
  100% {
    opacity: 1;
    transform: translateX(-50%) translateY(-50%) scale(1);
  }
}

</style>
