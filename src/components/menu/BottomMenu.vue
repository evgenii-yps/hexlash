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
      <div v-else class="menu-icon" :class="item.icon"></div>
      <div class="menu-text">{{ item.text }}</div>
    </div>
  </div>
</template>

<script setup>
import {computed, ref} from 'vue'
import { useRoute } from 'vue-router'
import { Howl } from 'howler'
import {t} from "@/locales/index.js";
import store from "@/core/state/store.js";

// Определяем, является ли устройство iOS
const isIOS = ref(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);

import clickSound from '@/assets/sound/punch_air.mp3'
import router from "@/router/index.js";

const playSound = () => {
  if (store.getters['punch/isMuted']) return;
  const sound = new Howl({
    src: [clickSound]
  });
  sound.play();
}

const menuItems = computed(() => [
  {icon: 'icon-arena', text: t.value.menu.arena, route: '/arena'},
  {icon: 'icon-trainings', text: t.value.menu.trainings, route: '/training'},
  {icon: 'icon-ratings', text: t.value.menu.ratings, route: '/ratings/clubs'},
  {icon: 'icon-profile', text: t.value.menu.profile, route: '/profile'},
])

const route = useRoute()

const isActive = (item) => {
  if (item.icon === 'icon-ratings') {
    return route.path.includes('ratings');
  }
  if (item.route === '/arena') {
    return route.path === '/arena' || route.path === '/';
  }
  return route.path === item.route || route.path.startsWith(item.route + '/');
}

const loadingStates = ref(Array(menuItems.value.length).fill(false));

const handleMenuClick = (index, item) => {
  playSound();
  loadingStates.value[index] = true;

  router.push(item.route).finally(() => {
    loadingStates.value[index] = false;
  });
}

</script>

<style scoped>
.bottom-menu {
  display: flex;
  justify-content: space-between;
  padding: 0 8px 6px;
  padding-bottom: max(6px, env(safe-area-inset-bottom));
  position: fixed;
  bottom: 0;
  width: 100%;
  max-width: 1024px;
  z-index: 100;
  background: var(--hex-bg-medium);
  border-top: 0.5px solid var(--hex-border-default);
}

.bottom-menu.ios-adjust {
  padding-bottom: max(2rem, env(safe-area-inset-bottom));
}

.menu-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  transition: background-color 0.2s ease;
  border-radius: 8px;
  padding: 8px 4px 4px;
  flex-grow: 1;
  flex-basis: 0;
  margin: 0 4px;
  box-sizing: border-box;
  min-height: 56px;
  cursor: pointer;
  background: transparent;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.03);
}

.menu-item.active {
  background: rgba(255, 6, 111, 0.08);
}

.menu-item .menu-text {
  margin-top: 4px;
  color: var(--hex-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 10px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  transition: color 0.3s ease;
}

.menu-item.active .menu-text {
  color: var(--hex-primary);
}

@media (min-width: 1024px) {
  .bottom-menu {
    border-top: 0.5px solid var(--hex-border-active);
  }
}

:deep(.v-ripple__container) {
  color: rgba(255, 6, 111, 0.3) !important;
}

.loader {
  color: var(--hex-text-muted);
}

.menu-icon {
  width: 32px;
  height: 32px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  filter: brightness(0) invert(0.6);
  transition: filter 0.3s ease;
}

.menu-item.active .menu-icon {
  filter: brightness(0) invert(1);
}

.icon-arena { background-image: url('@/assets/images/icon_arena.svg'); }
.icon-trainings { background-image: url('@/assets/images/icon_trainings.svg'); }
.icon-ratings { background-image: url('@/assets/images/icon_ratings.svg'); }
.icon-profile { background-image: url('@/assets/images/icon_profile.svg'); }
</style>
