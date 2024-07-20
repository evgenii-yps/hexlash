<template>
  <div class="background background-profile">

    <div class="profile-container">
      <div class="profile-content-wrapper">

        <div v-if="route.path.includes('/profile/wallet')">
          <ProfileWallet/>
        </div>
        <div v-else-if="route.path.includes('/profile/account')">
          <ProfileSettings/>
        </div>
        <div v-else-if="route.path.includes('/profile/balance')">
          <ProfileBalance/>
        </div>
        <div v-else class=" padding20">
          <div class="profile-header">

            <div class="user-info">
              <h2 class="user-name" v-if="!isEditingName" @click="editName">
                {{ userName }}
                <img src="@/assets/images/icon_pencil.svg" alt="Change Name" class="change-name-icon"/>
              </h2>
              <input v-else
                     type="text"
                     v-model="userName"
                     @blur="saveName"
                     ref="nameInput"
                     class="edit-name-input"
              />
            </div>
            <AvatarComponent/>
          </div>

          <ProfileStats/>

          <ProfileAchievements/>

          <ProfileButtons/>

        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import {ref, nextTick, computed, onMounted} from 'vue';
import {useRoute} from 'vue-router';
import store from "@/core/state/store.js";

import AvatarComponent from "@/components/fragments/profile/AvatarComponent.vue";
import ProfileStats from "@/components/fragments/profile/ProfileStats.vue";
import ProfileAchievements from "@/components/fragments/profile/ProfileAchievements.vue";
import ProfileButtons from "@/components/fragments/profile/ProfileButtons.vue";
import ClubView from "@/views/ClubView.vue";
import ProfileWallet from "@/components/fragments/profile/ProfileWallet.vue";
import ProfileSettings from "@/components/fragments/profile/account/ProfileAccount.vue";
import ProfileBalance from "@/components/fragments/profile/ProfileBalance.vue";


const route = useRoute();
const currentUser = computed(() => store.getters['user/getCurrentUser']);

const userName = ref(currentUser.value.name);
const isEditingName = ref(false);

const nameInput = ref(null);


const editName = () => {
  isEditingName.value = true;
  nextTick(() => {
    nameInput.value.focus();
  });
};

const saveName = () => {
  isEditingName.value = false;
  store.dispatch('user/updateCurrentUser', {name: userName.value});
};

</script>

<style scoped>
.background {
  position: fixed;
  width: 100vw;
  height: 100vh;
  background-size: cover;
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
  width: 100vw;
  height: 100vh;
  background: linear-gradient(to right bottom, black 35%, transparent 75%);
  z-index: 1;
}

.background-profile::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
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
  z-index: 10;
  overflow-y: auto;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.profile-content-wrapper {
  width: 100%;
  padding: 10vh 0; /* Отступы для верхней, нижней и боковых сторон */
  box-sizing: border-box;
}

.padding20 {
  padding: 20px;
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



</style>
