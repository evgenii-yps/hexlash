<template>
  <div class="avatar-container" @click="changeAvatar"
       :style="{ backgroundColor: avatarUrl !== defaultAvatarImg ? 'transparent' : 'var(--hex-bg-card)' }">

    <img :src="avatarUrl" alt="Club Avatar" class="avatar"
         :class="{
       'loading-avatar': isUploading,
       'non-default-avatar ': avatarUrl !== defaultAvatarImg && !isLoading,
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

import defaultAvatarImg from '@/assets/images/default_club_avatar.svg';
import apiClient from "@/core/api/apiClient.js";

const isLoading = ref(false);
const isUploading = ref(false);
const progress = ref(0);
const fileInput = ref(null);
const avatarUrl = ref(null);

const props = defineProps({
  clubData: {
    type: Object,
    required: true
  }
});

// Создаем локальную копию clubData для редактирования
const localClubData = ref({...props.clubData});

const changeAvatar = () => {
  fileInput.value.click();
};

const uploadAvatar = (event) => {
  progress.value = 0;
  isLoading.value = true;

  const file = event.target.files[0];
  if (file) {
    const formData = new FormData();
    formData.append('avatar', file);

    const onUploadProgress = (event) => {
      progress.value = Math.round((event.loaded * 100) / event.total);
    };

    store.dispatch('club/uploadClubAvatar', { formData, onUploadProgress })
        .then((avatarFile) => {
          isLoading.value = false;
          setAvatarUrl(avatarFile); // Обновляем URL аватара
        })
        .catch((error) => {
          console.error('Ошибка при загрузке аватара', error);
          isLoading.value = false;
        });
  }
};


const setAvatarUrl = (avatarFileName) => {
  if (avatarFileName) {
    avatarUrl.value = apiClient.defaults.baseURL + "/file/get/" + avatarFileName;
  } else {
    avatarUrl.value = defaultAvatarImg;
  }
};

watch(localClubData, (localClubData) => {
  if (localClubData) {
    setAvatarUrl(localClubData.avatarUrl || null)
  }
}, {immediate: true});

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
  object-fit: fill !important;
  width: 80% !important;
  border-radius: 0 !important;
}

.non-default-avatar {
  object-fit: cover;
  border: 2px solid white;
  border-radius: 50%;
  width: 100%;
  height: 100%;
}

.avatar{
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.loader-container {
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

.loader-circle {
  width: 100%;
  height: 100%;
}

.loading-avatar {
  filter: grayscale(100%);
  object-fit: cover;
  border-radius: 50%;
  width: 100%;
  height: 100%;

}

.camera-icon-container {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 40px;
  height: 40px;
  background-color: var(--hex-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.camera-icon {
  width: 25px;
  height: 25px;
}

.circle-bg {
  fill: none;
  stroke: var(--hex-border-strong);
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
