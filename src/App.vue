<template>
  <div class="wrapper">
    <header>
      <Logo/>
    </header>

    <RouterView/>

    <footer>
      <transition name="slide-up-down">
        <BottomMenu v-if="showBottomMenu"/>
      </transition>
    </footer>

  </div>

</template>

<script setup>
import {RouterLink, RouterView, useRoute} from 'vue-router'
import {computed} from "vue";
import BottomMenu from "@/components/menu/BottomMenu.vue";
import Logo from "@/components/Logo.vue";

// Получаем текущий маршрут
const route = useRoute()

// Определяем, нужно ли показывать BottomMenu
const showBottomMenu = computed(() => {
  // Список маршрутов, на которых BottomMenu должен отображаться
  const includedRoutes = ['/arena', '/trainings', '/ratings', '/profile']
  return includedRoutes.includes(route.path)
})

</script>

<style scoped>

.wrapper {
  position: relative;
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
