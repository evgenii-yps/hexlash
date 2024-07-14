<template>

  <RouterView/>

  <header class="header">
    <div class="header-content">
      <Logo/>
      <div class="balance">
        113$
      </div>
    </div>
  </header>

  <footer>
    <transition name="slide-up-down">
      <BottomMenu v-if="showBottomMenu"/>
    </transition>
  </footer>

</template>

<script setup>
import {RouterView, useRoute} from 'vue-router'
import {computed} from "vue";
import BottomMenu from "@/components/menu/BottomMenu.vue";
import Logo from "@/components/Logo.vue";

// Получаем текущий маршрут
const route = useRoute()

// Определяем, нужно ли показывать BottomMenu
const showBottomMenu = computed(() => {
  // Список маршрутов, на которых BottomMenu должен отображаться
  const includedRoutes = ['/arena', '/training', '/ratings', '/profile']
  return includedRoutes.includes(route.path)
})

</script>

<style scoped>

@font-face {
  font-family: 'AnonymousBalance';
  src: url('@/assets/fonts/AnonymousBalance.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}


.header {
  width: 100%;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.balance {
  display: flex;
  justify-content: space-between;

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
