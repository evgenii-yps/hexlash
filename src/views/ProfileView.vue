<template>
  <div class="background background-profile">
    <div class="profile-container">
      <div class="profile-header">
        <div class="user-info">
          <h2 class="user-name" v-if="!isEditingName" @click="editName">
            {{ userName }}
            <img src="@/assets/images/icon_pencil.svg" alt="Change Name" class="change-name-icon" />
          </h2>
          <input v-else
                 type="text"
                 v-model="userName"
                 @blur="saveName"
                 ref="nameInput"
                 class="edit-name-input"
          />
        </div>
        <div class="avatar-container" @click="changeAvatar">
          <img :src="avatarUrl" alt="User Avatar" class="avatar"
               :class="{ 'loading-avatar': isUploading, 'non-default-avatar': avatarUrl !== defaultAvatarImg && !isLoading }"  />
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
          <input type="file" ref="fileInput" @change="uploadAvatar" class="file-input" accept="image/*" />
          <div class="camera-icon-container">
            <img src="@/assets/images/icon_camera.svg" alt="Change Avatar" class="camera-icon"/>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import defaultAvatarImg from '@/assets/images/default_avatar.svg';

const route = useRoute();
const router = useRouter();

const userName = ref('Anonymous');
const avatarUrl = ref(defaultAvatarImg);
const isEditingName = ref(false);
const isLoading = ref(false);
const isUploading = ref(false);
const progress = ref(0);

const nameInput = ref(null);
const fileInput = ref(null);

const editName = () => {
  isEditingName.value = true;
  nextTick(() => {
    nameInput.value.focus();
  });
};

const changeAvatar = () => {
  fileInput.value.click();
};

const uploadAvatar = async (event) => {
  progress.value = 0;
  isLoading.value = true;

  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onloadstart = () => {

      isUploading.value = true;
    };

    reader.onloadend = () => {
      avatarUrl.value = reader.result;
    };
    reader.readAsDataURL(file);

    // Симуляция загрузки на сервер
    for (let i = 0; i <= 100; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      progress.value = i;
    }

    // Сброс загрузки
    isLoading.value = false;
    isUploading.value = false;
  }
};


const saveName = () => {
  isEditingName.value = false;
};
</script>

<style scoped>
.background {
  position: fixed;
  width: 100%;
  height: 100%;
  background-size: cover !important;
  overflow: hidden;
}

.background-profile {
  background: url('@/assets/images/background_profile.webp') no-repeat center center;
}

.background-profile::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to right bottom, black 35%, transparent 75%);
  z-index: 1;
}

.background-profile::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: black;
  z-index: 2;
  opacity: 1;
  animation: fadeOut 1s forwards;
}

@keyframes fadeOut {
  to {
    opacity: 0;
  }
}

.profile-container {
  position: relative;
  z-index: 3;
  padding: 20px;
  margin-top: 10vh;
}

.user-name {
  display: flex;
  align-items: center;
  font-weight: normal;
  font-size: 2.5em;
  max-width: 70vw;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.profile-header {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  color: white;
  max-width: 500px;
  width: 100%;
}

.user-info {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.avatar-container {
  position: relative;
  cursor: pointer;
  margin-left: auto;
  width: 100px;
  height: 100px;
  flex-shrink: 0;
}

.avatar, .loader-container {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  position: absolute;
  top: 0; /* Совмещаем их */
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  object-fit: cover;
}

.non-default-avatar{
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
  bottom: 5px;
  right: 5px;
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



.change-name-icon {
  width: 24px;
  height: 24px;
  margin-left: 10px;
  cursor: pointer;
}

.edit-name-input {
  font-size: 2.5em;
  background: transparent;
  border: none;
  border-bottom: 1px solid white;
  color: white;
  max-width: 70vw;
  outline: none;
}

.file-input {
  display: none;
}
</style>
