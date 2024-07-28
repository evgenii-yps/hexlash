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
        <div v-else >

          <div class="profile-header">
            <AvatarComponent/>
            <ProfileName/>
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
import { useRoute } from 'vue-router';
import AvatarComponent from "@/components/fragments/profile/AvatarComponent.vue";
import ProfileStats from "@/components/fragments/profile/ProfileStats.vue";
import ProfileAchievements from "@/components/fragments/profile/ProfileAchievements.vue";
import ProfileButtons from "@/components/fragments/profile/ProfileButtons.vue";
import ProfileWallet from "@/components/fragments/profile/wallet/ProfileWallet.vue";
import ProfileSettings from "@/components/fragments/profile/account/ProfileAccount.vue";
import ProfileBalance from "@/components/fragments/profile/ProfileBalance.vue";
import ProfileName from "@/components/fragments/profile/ProfileMasterName.vue";

const route = useRoute();
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
  max-height: 100vh;
  display: flex;
  flex-direction: column;
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
</style>
