<template>
  <div class="avatar-container">
    <img :src="computedAvatarUrl" alt="User Avatar" class="avatar"
         :class="{
           'non-default-avatar': computedAvatarUrl !== defaultAvatarImg,
           'default-avatar': computedAvatarUrl === defaultAvatarImg
         }"/>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import defaultAvatarImg from '@/assets/images/default_avatar.svg';

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
  width: 100px;
  height: 100px;
  flex-shrink: 0;
  padding: 6px;
  border-radius: 50%;
  margin-right: 10px;
}

.default-avatar {
  padding: 5px;
  object-fit: fill;
  width: 100%;
}

.non-default-avatar {
  object-fit: cover;
  border: 2px solid white;
  width: 100px;
  height: 100px;
  border-radius: 50%;
}
</style>
