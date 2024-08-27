<template>
  <div class="app-container">
    <header class="header">
      <div class="header-content">
        <Logo @click="goToHome"/>
        <div v-if="balance !== null" class="balance">
          {{ balance }}$
        </div>
      </div>
    </header>

    <main class="content">
      <RouterView/>
    </main>

    <footer class="footer">
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
import router from "@/router/index.js";

const balance = computed(() => {
  const master = store.getters['master/getMaster'];
  if (master && master.userData) {
    const rawBalance = master.userData.balance;
    return (rawBalance / 100).toFixed(2);
  }
  return null;
});

const goToHome = () => {
  router.push('/');
};

// Определяем, нужно ли показывать BottomMenu
const showBottomMenu = ref(false);

const authState = computed(() => store.getters['master/getAuthState']);

watch(authState, (newAuthState) => {
  showBottomMenu.value = newAuthState.isAuthenticated;
}, {immediate: true});

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

.footer {
  display: flex;
  justify-content: center;
  align-items: center;
}


</style>
