<template>
  <div class="avatar-container">
    <img :src="avatarUrl" alt="User Avatar" class="avatar"
         :class="{
           'non-default-avatar': avatarUrl !== defaultAvatarImg,
           'default-avatar': avatarUrl === defaultAvatarImg
         }"/>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';
import defaultAvatarImg from '@/assets/images/default_avatar.svg';

// Определяем проп avatarUrl
const props = defineProps({
  avatarUrl: {
    type: String,
    default: defaultAvatarImg,
  },
});
</script>

<style scoped>
.avatar-container {
  position: relative;
  cursor: pointer;
  width: 100px;
  height: 100px;
  flex-shrink: 0;
  padding: 6px;
  border-radius: 50%;
}

.default-avatar {
  padding: 5px;
  object-fit: fill;
}

.non-default-avatar {
  object-fit: cover;
  border: 2px solid white;
}
</style>
