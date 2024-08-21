<template>
  <div class="avatar-container"
       :style="{ backgroundColor: computedAvatarUrl !== defaultAvatarImg ? 'transparent' : 'var(--black-opacity-80)' }">

    <img :src="computedAvatarUrl" alt="Club Avatar"
         :class="{
           'non-default-avatar': computedAvatarUrl !== defaultAvatarImg,
           'default-avatar': computedAvatarUrl === defaultAvatarImg
         }"/>
  </div>
</template>

<script setup>
import {computed} from 'vue';
import defaultAvatarImg from '@/assets/images/default_club_avatar.svg';

// Определяем проп avatarUrl
const props = defineProps({
  avatarUrl: {
    type: String,
    default: ''
  },
});

// Создаем вычисляемое свойство для аватара
const computedAvatarUrl = computed(() => props.avatarUrl || defaultAvatarImg);
</script>

<style scoped>
.avatar-container {
  position: relative;
  padding: 6px;
  border-radius: 50%;
  align-items: center;
  display: flex;
  justify-content: center;
  width: 175px;
  height: 175px;
  margin: 0 auto;
  cursor: pointer;
}

.default-avatar {
  padding: 5px;
  object-fit: fill;
  width: 80%;
}

.non-default-avatar {
  object-fit: cover;
  border: 2px solid white;
  border-radius: 50%;
  width: 100%;
  height: 100%;
}
</style>
