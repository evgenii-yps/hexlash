<template>

    <RouterView/>

    <header class="header">
      <div class="header-content">
        <Logo/>
        <div class="balance">
          99.550$
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

.wrapper {
}

.header {
  width: 100%;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px; /* Отступы для внутреннего выравнивания */
}

.balance {
  margin-left: auto; /* Отодвигаем блок с балансом вправо */
  margin-top: 1vh;
  font-size: 3em;
color: white;
  position: relative;
  font-family: 'AnonymousBalance', sans-serif;

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
