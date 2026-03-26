<template>
  <transition name="fade">
    <div v-if="showNoConnection" class="no-connection">
      {{ t.connection }}
      <v-progress-circular
          class="loader color-pink"
          size="20"
          indeterminate
      />
    </div>
  </transition>
</template>

<script setup>
import {computed, ref, watch, onUnmounted} from 'vue';
import store from "@/core/state/store.js";
import {t} from "@/locales/index.js";
const isConnected = computed(() => store.getters['webSocket/isConnected']);

// Показывать "Нет соединения" через 5 секунд, если соединение не восстановилось
const showNoConnection = ref(false);

let showTimer = null;

watch(isConnected, (newValue) => {
  if (!newValue) {
    // Если соединение потеряно, запускаем таймер на 5 секунд перед показом
    showTimer = setTimeout(() => {
      showNoConnection.value = true;
    }, 5000);
  } else {
    // Если соединение восстановилось, отменяем таймер и скрываем компонент
    if (showTimer) {
      clearTimeout(showTimer);
      showTimer = null;
    }

    showNoConnection.value = false;
  }
}, {immediate: true});

onUnmounted(() => {
  if (showTimer) {
    clearTimeout(showTimer);
  }
});
</script>

<style scoped>
.no-connection {
  position: fixed;
  bottom: 12vh;
  left: 50%;
  width: 100%;
  transform: translateX(-50%);
  background-color: color-mix(in srgb, var(--hex-danger) 62%, transparent);
  color: white;
  padding: 10px 20px;
  text-align: center;
  font-family: Arial, sans-serif;
  font-size: 0.7rem;
  max-width: 500px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
}

.color-pink {
  color: var(--hex-text-primary) !important;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
