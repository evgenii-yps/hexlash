<template>
  <div class="background background_training">
  </div>
</template>

<script setup>
import {ref} from "vue";
import {useRoute} from "vue-router";

const route = useRoute();
</script>

<style scoped>
.background {
  position: fixed;
  width: 100%;
  height: 100%;
  background-size: cover !important;
  overflow: hidden;

}

.background_training {
  background: url('@/assets/images/background_trainings.webp') no-repeat center center;
}

.background_training::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to right top, black 40%, transparent 75%);
  z-index: 1;
}

.background_training::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: black;
  z-index: 2;
  opacity: 1; /* Начальное значение */
  animation: fadeOut 1s forwards; /* Анимация */
}

@keyframes fadeOut {
  to {
    opacity: 0;
  }
}
</style>
