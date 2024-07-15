<template>
  <div class="bottom-menu">
    <router-link
        v-for="(item, index) in menuItems"
        :key="index"
        :to="item.route"
        class="menu-item"
        active-class="active"
        @click="playSound"
    >
      <div :class="['menu-icon', item.icon]"></div>
      <div class="menu-text">{{ item.text }}</div>
    </router-link>
  </div>
</template>

<script setup>

import { ref } from 'vue'
import { Howl } from 'howler'

import clickSound from '@/assets/sound/punch_air.mp3'

const sound = new Howl({
  src: [clickSound]
})

const playSound = () => {
  sound.play();
}

const menuItems = ref([
  { icon: 'icon-arena', text: 'Арена', route: '/arena' },
  { icon: 'icon-trainings', text: 'Тренировки', route: '/training' },
  { icon: 'icon-ratings', text: 'Рейтинги', route: '/ratings' },
  { icon: 'icon-profile', text: 'Профиль', route: '/profile' },
])
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
  background-color: var(--blackOpacity80);
  text-decoration: none;
  transition: color 0.3s ease;
  min-width: 10vw; /* Минимальная ширина карточки */
  min-height: 5vh; /* Минимальная высота карточки */
  border-radius: 0.2rem; /* Скругление краев */
  padding: 0.9rem 1rem; /* Добавляем отступ внутри карточки */
  flex: 1; /* Равномерное растягивание карточек */
  margin: 0 0.5rem; /* Отступы между карточками */
}

.menu-item:hover, .menu-item.active {
  background-color: var(--pink); /* Розовый цвет при наведении и активном элементе */
  opacity: 1;
}

.menu-item .menu-text {
  margin-top: 0.5rem;
  color: var(--gray3); /* Цвет текста для неактивных карточек */
  white-space: nowrap; /* Запрещаем перенос текста */
  overflow: hidden; /* Обрезаем текст, который не помещается */
  text-overflow: ellipsis; /* Добавляем многоточие для обрезанного текста */
}

.menu-item:hover .menu-text, .menu-item.active .menu-text {
  color: var(--white); /* Белый цвет текста для активных карточек */
}

.menu-icon {
  width: 2rem;
  height: 2rem;
  background-size: cover;
  filter: brightness(0) invert(1); /* Белый цвет */
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