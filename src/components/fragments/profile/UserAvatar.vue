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
import {computed} from 'vue';
import defaultAvatarImg from '@/assets/images/default_avatar.svg';
import apiClient from "@/core/api/apiClient.js";

// Определяем проп avatarUrl
const props = defineProps({
  avatarUrl: {
    type: String,
    default: ''
  },
  width: {
    type: String,
    default: '80px'
  },
  height: {
    type: String,
    default: '80px'
  }
});


const computedAvatarUrl = computed(() =>
    props.avatarUrl && props.avatarUrl !== ""
        ? apiClient.defaults.baseURL + "/file/get/" + props.avatarUrl
        : defaultAvatarImg
);

</script>

<style scoped>
.avatar-container {
  position: relative;
  flex-shrink: 0;
  padding: 6px;
  border-radius: 50%;
  background-color: var(--black-opacity-80);

}

.avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.default-avatar {
  padding-top: 7px;
  object-fit: fill;
  width: 100%;
  height: 100%;
  border: 2px solid white;
}

.non-default-avatar {
  object-fit: cover;
  border: 2px solid white;
  border-radius: 50%;
  width: 80px;
  height: 80px;
}
</style>
