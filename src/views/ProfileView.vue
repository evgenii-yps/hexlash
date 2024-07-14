<template>
  <div class="background background-profile">
    <div class="profile-container">
      <div class="profile-header">
        <div class="user-info">
          <h2 class="user-name">
            {{ userName }}
            <img src="@/assets/images/icon_pencil.svg" alt="Change Name" class="change-name-icon" @click="changeName"/>
          </h2>
        </div>
        <div class="avatar-container"  @click="changeAvatar">
          <img :src="avatarUrl" alt="User Avatar" class="avatar"/>
          <div class="camera-icon-container">
            <img src="@/assets/images/icon_camera.svg" alt="Change Avatar" class="camera-icon"/>
          </div>
        </div>
      </div>

    </div>


  </div>
</template>

<script setup>
import {ref} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import Achievement from '@/components//fragments/Achievement.vue';
import defaultAvatarImg from '@/assets/images/default_avatar.svg';
import Card from "@/components/ui/Card.vue";

const route = useRoute();
const router = useRouter();

const userName = ref('Anonymous');
const avatarUrl = ref(defaultAvatarImg);
const totalFights = ref(100);
const wins = ref(70);
const losses = ref(20);
const draws = ref(10);
const luckPercentage = ref(70);
const tokensWon = ref(500);
const tokensReceived = ref(200);
const tokensLost = ref(100);
const invitesUsed = ref(50);
const daysInClub = ref(150);
const streakDays = ref(30);
const achievements = ref([
  {id: 1, name: 'Подтверждение почты', unlocked: false},
  {id: 2, name: 'Постинг в 3 соцсети', unlocked: true},
  // другие ачивки
]);

const changeAvatar = () => {
  // Логика изменения аватара
};

const changeName = () => {
  // Логика изменения имени
};


const manageWallet = () => {
  // Логика управления кошельком
};

const manageAccount = () => {
  // Логика управления аккаунтом
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
  max-width:70vw;
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
}


.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
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
}

.camera-icon {
  width: 16px;
  height: 16px;
}


.change-name-icon {
  width: 24px;
  height: 24px;
  margin-left: 10px;
  cursor: pointer;
}

.profile-statistics,
.profile-achievements,
.profile-actions {
  margin-top: 20px;
}
</style>
