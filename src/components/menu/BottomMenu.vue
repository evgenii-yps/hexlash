<template>
  <div :class="['bottom-menu', { 'ios-adjust': isIOS }]">
    <div
        v-for="(item, index) in menuItems"
        :key="index"
        class="menu-item"
        :class="{ active: isActive(item) }"
        @click="handleMenuClick(index, item)"
        v-ripple
    >
      <div v-if="loadingStates[index]" class="loader-container">
        <v-progress-circular
            class="loader"
            size="30"
            indeterminate
        />
      </div>
      <div v-else :class="['menu-icon', item.icon]"></div>
      <div class="menu-text">{{ item.text }}</div>
    </div>
  </div>
</template>

<script setup>
import {computed, ref, watch} from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Howl } from 'howler'
import {useI18n} from "vue-i18n";

// Определяем, является ли устройство iOS
const isIOS = ref(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);



const {t, locale} = useI18n({useScope: 'global'})

import clickSound from '@/assets/sound/punch_air.mp3'
import router from "@/router/index.js";

const playSound = () => {
  const sound = new Howl({
    src: [clickSound]
  });
  sound.play();
}

const menuItems = computed(() => [
  {icon: 'icon-arena', text: t('menu.arena'), route: '/arena'},
  {icon: 'icon-trainings', text: t('menu.trainings'), route: '/training'},
  {icon: 'icon-ratings', text: t('menu.ratings'), route: '/ratings/clubs'},
  {icon: 'icon-profile', text: t('menu.profile'), route: '/profile'},
])

const route = useRoute()

const isActive = (item) => {
  if (item.icon === 'icon-ratings') {
    return route.path.includes('ratings');
  }
  return route.path === item.route;
}

const loadingStates = ref(Array(menuItems.value.length).fill(false)); // Создаем массив для состояния загрузки каждого элемента меню

const handleMenuClick = (index, item) => {
  playSound(); // Воспроизведение звука
  loadingStates.value[index] = true; // Включаем лоадер для конкретного пункта меню

  // Переход по маршруту
  router.push(item.route).finally(() => {
    loadingStates.value[index] = false; // Выключаем лоадер после завершения перехода
  });
}

</script>

<style scoped>
.bottom-menu {
  display: flex;
  justify-content: space-between;
  padding: 0 0.5rem 0.4rem;
  position: fixed;
  bottom: 0;
  width: 100%;
  max-width: 1024px;
  z-index: 100; /* Устанавливаем z-index, чтобы контент был поверх градиента */
}

.bottom-menu::before {
  content: '';
  position: absolute;
  top: -15px;
  left: -50px;
  right: -50px;
  bottom: 0;
  background: linear-gradient(to top, black 40%, transparent 100%);
  z-index: -1;

}

.bottom-menu.ios-adjust {
  padding-bottom: 2rem; /* Дополнительный отступ для iOS */
}

@media (min-width: 1024px) {
  .bottom-menu::before {
    background: none;
  }
}

.menu-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: var(--black-opacity-80);
  text-decoration: none;
  transition: color 0.3s ease;
  border-radius: 0.2rem;
  padding: 0.4rem 0.5rem;
  flex-grow: 1; /* Позволяет элементу растягиваться */
  flex-basis: 0;
  margin: 0 0.3rem;
  box-sizing: border-box;
  width: 80px;
}

.menu-item:hover, .menu-item.active {
  background-color: var(--primary-color);
  opacity: 1;
}

.menu-item .menu-text {
  margin-top: 0.5rem;
  color: var(--gray3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: clamp(0.8rem, 2vw, 1rem);
}

.menu-item:hover .menu-text, .menu-item.active .menu-text {
  color: var(--white);
}

.menu-icon {
  width: 2rem;
  height: 2rem;
  background-size: cover;
  filter: brightness(0) invert(1);
  transition: filter 0.3s ease;
}

.icon-arena {
  background: url('@/assets/images/icon_arena.svg') no-repeat center;
}

.icon-trainings {
  background: url('@/assets/images/icon_trainings.svg') no-repeat center;
}

.icon-ratings {
  background: url('@/assets/images/icon_ratings.svg') no-repeat center;
}

.icon-profile {
  background: url('@/assets/images/icon_profile.svg') no-repeat center;
}

:deep(.v-ripple__container) {
  color: grey !important;
}

.loader{
  color: white;
}
</style>
