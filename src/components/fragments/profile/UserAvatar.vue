<template>
  <div class="avatar-container" :style="{ width: props.width, height: props.height }">
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
  width:{
    type: String,
    default: '100px'
  },
  height:{
    type: String,
    default: '100px'
  }
});

// Создаем вычисляемое свойство для аватара
const computedAvatarUrl = computed(() => props.avatarUrl || defaultAvatarImg);

</script>

<style scoped>
.avatar-container {
  position: relative;
  flex-shrink: 0;
  padding: 6px;
  border-radius: 50%;
  background-color: var(--black-opacity-80);

}

.default-avatar {
  padding: 5px;
  object-fit: fill;
  width: 100%;
  height: 100%;
}

.non-default-avatar {
  object-fit: cover;
  border: 2px solid white;
  border-radius: 50%;
}
</style>
