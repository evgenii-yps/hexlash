<template>
  <div class="app-container">
    <header class="header">
      <div class="header-content">
        <Logo/>
        <div v-if="balance !== null" class="balance">
          {{ balance }}$
        </div>
      </div>
    </header>

    <main class="content">
      <RouterView/>
    </main>

    <footer>
      <transition name="slide-up-down">
        <BottomMenu v-if="showBottomMenu"/>
      </transition>
    </footer>
  </div>
</template>

<script setup>
import {RouterView, useRoute} from 'vue-router'
import {computed, onMounted, ref, watch} from "vue";
import BottomMenu from "@/components/menu/BottomMenu.vue";
import Logo from "@/components/Logo.vue";
import store from "@/core/state/store.js";

const balance = ref(null);

// Получаем текущий маршрут
const route = useRoute()

// Определяем, нужно ли показывать BottomMenu
const showBottomMenu = computed(() => {
  // Список маршрутов, на которых BottomMenu должен отображаться
  const includedRoutes = ['/arena', '/training', '/ratings/clubs', '/ratings/fighters',
    '/profile', '/profile/wallet', '/profile/balance', '/profile/account', '/404']
  // Проверка, если маршрут совпадает с включенными маршрутами или начинается с /user/
  return includedRoutes.includes(route.path) || route.path.startsWith('/user/') || route.path.startsWith('/club/');
})


watch(store.getters['master/getMaster'], (newMaster) => {
  if (newMaster && newMaster.userData) {
    balance.value = newMaster.userData.balance;
  }
}, { immediate: true });

</script>

<style scoped>

@font-face {
  font-family: 'AnonymousBalance';
  src: url('@/assets/fonts/AnonymousBalance.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

.content {
  position: relative;
  overflow-y: auto;
  height: 100vh;
}

.header {
  width: 100vw;
  position: relative;
  z-index: 2;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.balance {
  font-size: 2.5em;
  color: white;
  font-family: 'AnonymousBalance', sans-serif;
  position: absolute;
  top: 0;
  right: 20px;
  margin-top: 20px;
}

/* Анимация выезжания вверх и вниз */
.slide-up-down-enter-active, .slide-up-down-leave-active {
  transition: transform 0.5s ease;
}

.slide-up-down-enter-from {
  transform: translateY(100%);
}

.slide-up-down-enter-to {
  transform: translateY(0);
}

.slide-up-down-leave-from {
  transform: translateY(0);
}

.slide-up-down-leave-to {
  transform: translateY(100%);
}


</style>
