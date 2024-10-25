<template>
  <div class="background background-profile">
    <div class="profile-container" @scroll="handleScroll">
      <div class="profile-content-wrapper">

        <div v-if="loading" class="loader-container">
          <v-progress-circular
              class="loader"
              size="40"
              indeterminate
          />
        </div>

        <div v-else>

          <div v-if="route.path.includes('/profile/wallet')">
            <ProfileWallet/>
          </div>
          <div v-else-if="route.path.includes('/profile/account')">
            <ProfileSettings :userData="userData"/>
          </div>
          <div v-else>

            <div v-if="isOwner" class="profile-header">
              <ProfileAvatar/>
              <ProfileName/>
            </div>

            <div v-else class="profile-header">
              <UserAvatar :avatarUrl="userData?.avatarUrl" width="80px" height="80px"/>
              <UserName :userName="userData?.name" style="margin: 10px 0 0 10px"/>
            </div>

            <ProfileStats :userData="userData"/>
            <ProfileAchievements :userData="userData"/>

            <div v-if="isOwner">
              <ProfileInvite/>
              <ProfileButtons/>
              <div class="beta-text">{{ isprod ? 'Prod' : 'Test' }} beta - {{version}} </div>
              <div class="scroll-gap"/>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {useRoute} from 'vue-router';
import {computed, onBeforeMount, onMounted, ref, watch} from "vue";
import store from "@/core/state/store.js";

import ProfileStats from "@/components/fragments/profile/ProfileStats.vue";
import ProfileAchievements from "@/components/fragments/profile/ProfileAchievements.vue";
import ProfileButtons from "@/components/fragments/profile/ProfileButtons.vue";
import ProfileWallet from "@/components/fragments/profile/wallet/ProfileWallet.vue";
import ProfileSettings from "@/components/fragments/profile/account/ProfileAccount.vue";
import ProfileName from "@/components/fragments/profile/ProfileName.vue";
import ProfileInvite from "@/components/fragments/profile/ProfileInvite.vue";
import ProfileAvatar from "@/components/fragments/profile/ProfileAvatar.vue";
import UserName from "@/components/fragments/profile/UserName.vue";
import UserAvatar from "@/components/fragments/profile/UserAvatar.vue";

const version = __APP_VERSION__;
const isprod = __IS_PROD__;


const route = useRoute();

const master = computed(() => store.getters['master/getMaster']);
const userData = ref(null);
const isOwner = ref(false);
const loading = ref(true);  // Флаг загрузки

const loadUser = async () => {

  loading.value = true;  // Устанавливаем флаг загрузки
  const params = route.params;

  if (route.name === 'UserProfile') {
    isOwner.value = master.value && master.value.userData.login === params.userLogin;

    if (isOwner.value) {
      userData.value = master.value.userData;
    } else {
      userData.value = await store.dispatch('user/getUserByLogin', params.userLogin);
    }
  } else if (route.name === 'Profile') {
    userData.value = master.value.userData;
    isOwner.value = true;
  }

  loading.value = false;  // Сбрасываем флаг загрузки после загрузки данных
};

onBeforeMount(loadUser);

watch(route, loadUser);

// Следим за изменением данных пользователя в хранилище и обновляем userData
watch(
    () => store.getters['user/getUserByLogin'](route.params.userLogin),
    (newValue) => {
      if (!isOwner.value) {
        userData.value = newValue;
      }
    }
);

watch(master, (newMaster) => {
  userData.value = newMaster.userData;
});


const emit = defineEmits(['scroll']);

const handleScroll = (event) => {
  emit('scroll', event.target.scrollTop);
};

</script>


<style scoped>
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
  height: 100vh;
  display: flex;
  flex-direction: column;
  -webkit-overflow-scrolling: auto; /* Отключить резиновый скролл*/
  overscroll-behavior-y: none;
}

@supports (height: 100dvh) {
  .profile-container {
    height: 100dvh;
  }
}

.profile-content-wrapper {
  width: 100%;
  padding: 10vh 0;
  box-sizing: border-box;
  max-width: 1024px;
  margin: 0 auto;
}

.profile-header {
  display: flex;
  color: white;
  width: 100%;
  padding: 0 15px;
  align-items: flex-start;
}

.scroll-gap {
  display: block;
  position: relative;
  height: 40px;
}

.loader-container {
  height: 75vh;
  align-items: center;
  display: flex;
  justify-content: center;
}

.beta-text {
  position: relative;
  left: 20px;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  margin-top: 20px;
}
</style>
