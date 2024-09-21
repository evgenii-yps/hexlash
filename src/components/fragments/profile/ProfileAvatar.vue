<template>
  <div class="avatar-container" @click="changeAvatar">
    <img :src="avatarUrl" alt="User Avatar" class="avatar"
         :class="{
       'loading-avatar': isUploading,
       'non-default-avatar': avatarUrl !== defaultAvatarImg && !isLoading,
       'default-avatar': avatarUrl === defaultAvatarImg
     }"/>
    <div v-if="isLoading" class="loader-container">
      <svg class="loader-circle" viewBox="0 0 36 36">
        <path class="circle-bg"
              d="M18 2.0845
                 a 15.9155 15.9155 0 0 1 0 31.831
                 a 15.9155 15.9155 0 0 1 0 -31.831"/>
        <path class="circle"
              :stroke-dasharray="progress + ', 100'"
              d="M18 2.0845
                 a 15.9155 15.9155 0 0 1 0 31.831
                 a 15.9155 15.9155 0 0 1 0 -31.831"/>
        <text x="18" y="20.35" class="progress-text">{{ Math.round(progress) }}%</text>
      </svg>
    </div>
    <input type="file" ref="fileInput" @change="uploadAvatar" class="file-input" accept="image/*"/>
    <div class="camera-icon-container">
      <img src="@/assets/images/icon_camera.svg" alt="Change Avatar" class="camera-icon"/>
    </div>
  </div>
</template>

<script setup>
import {computed, onMounted, ref, watch} from 'vue';
import store from "@/core/state/store.js";

import defaultAvatarImg from '@/assets/images/default_avatar.svg';

const avatarUrl = ref(defaultAvatarImg);
const isLoading = ref(false);
const isUploading = ref(false);
const progress = ref(0);
const fileInput = ref(null);

const changeAvatar = () => {
  fileInput.value.click();
};

// TODO Вынести в стейт процесс загрузки, чтобы после переключения вью можно было вернутся и увидеть прогресс
const uploadAvatar = (event) => {
  progress.value = 0;
  isLoading.value = true;

  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onloadstart = () => {
      isUploading.value = true;
    };
    reader.onloadend = () => {
      const avatarDataUrl = reader.result;
      avatarUrl.value = avatarDataUrl; // Вставляем черно белую

      const onUploadProgress = (event) => {
        progress.value = Math.round((event.loaded * 100) / event.total);
      };

      store.dispatch('master/uploadMasterAvatar', { avatarDataUrl, onUploadProgress })
          .then(() => {
            isLoading.value = false;
            isUploading.value = false;
            avatarUrl.value = avatarDataUrl;
          })
          .catch((error) => {
            console.error("Ошибка при загрузке аватара", error);
            isLoading.value = false;
            isUploading.value = false;
          });
    };
    reader.readAsDataURL(file);
  }
};

watch(store.getters['master/getMaster'], (newMaster) => {
  if (newMaster && newMaster.userData) {
    avatarUrl.value = newMaster.userData.avatarUrl || defaultAvatarImg;
  }
}, { immediate: true });

</script>

<style scoped>

.avatar-container {
  position: relative;
  cursor: pointer;
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  padding: 6px;
  border-radius: 50%;
}

.avatar, .loader-container {
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
  padding: 6px;
  object-fit: fill;
}

.non-default-avatar{
  object-fit: cover;
  border: 2px solid white;
}

.loader-circle {
  width: 100%;
  height: 100%;
}

.loading-avatar {
  filter: grayscale(100%);
}

.camera-icon-container {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 30px;
  height: 30px;
  background-color: var(--pink);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.camera-icon {
  width: 20px;
  height: 20px;
}

.circle-bg {
  fill: none;
  stroke: rgba(255, 255, 255, 0.3);
  stroke-width: 3.8;
}

.circle {
  fill: transparent;
  stroke: white;
  stroke-width: 3.8;
  stroke-linecap: round;
  transition: stroke-dasharray 0.3s;
}

.progress-text {
  fill: white;
  font-size: 0.4em;
  text-anchor: middle;
}

.file-input {
  display: none;
}


</style>
