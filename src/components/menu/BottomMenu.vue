<template>
  <div class="bottom-menu">
    <router-link
        v-for="(item, index) in menuItems"
        :key="index"
        :to="item.route"
        class="menu-item"
        :class="{ active: isActive(item) }"
        @click="playSound"
    >
      <div :class="['menu-icon', item.icon]"></div>
      <div class="menu-text">{{ item.text }}</div>
    </router-link>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Howl } from 'howler'

import clickSound from '@/assets/sound/punch_air.mp3'

const sound = new Howl({
  src: [clickSound]
})

const playSound = () => {
  sound.play();
}

const menuItems = ref([
  {icon: 'icon-arena', text: 'Arena', route: '/arena'},
  {icon: 'icon-trainings', text: 'Training', route: '/training'},
  {icon: 'icon-ratings', text: 'Ratings', route: '/ratings/clubs'},
  {icon: 'icon-profile', text: 'Profile', route: '/profile'},
])

const route = useRoute()

const isActive = (item) => {
  if (item.icon === 'icon-ratings') {
    return route.path.includes('ratings');
  }
  return route.path === item.route;
}
</script>

<style scoped>
.bottom-menu {
  display: flex;
  justify-content: space-between;
  padding: 1rem;
  position: fixed;
  bottom: 0;
  width: 100%;
}

.menu-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: var(--black-opacity-80);
  text-decoration: none;
  transition: color 0.3s ease;
  min-width: 10vw;
  min-height: 5vh;
  border-radius: 0.2rem;
  padding: 0.9rem 1rem;
  flex: 1;
  margin: 0 0.5rem;
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
</style>
