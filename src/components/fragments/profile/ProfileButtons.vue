<template>
  <div class="buttons-container">
    <VBtnDark v-if="!isTelegram"
        class="profile-btn"
        @click="navigateTo('Wallet')">
      <template #prepend>
        <img src="@/assets/images/icon_arrow.svg" alt="Arrow Icon" class="custom-icon"/>
      </template>
      {{ t.profile.buttons.lblWalletManagement }}
    </VBtnDark>

    <VBtnDark
        class="profile-btn"
        @click="navigateTo('Skins')"
    >
      <template #prepend>
        <img src="@/assets/images/icon_arrow.svg" alt="Arrow Icon" class="custom-icon"/>
      </template>
      {{ t.profile.buttons.lblFightSkins }}
    </VBtnDark>

    <VBtnDark
        class="profile-btn"
        @click="emit('open-referral')"
    >
      <template #prepend>
        <img src="@/assets/images/icon_arrow.svg" alt="Arrow Icon" class="custom-icon"/>
      </template>
      {{ t.profile.lblReferralProgram }}
    </VBtnDark>

    <VBtnDark
        class="profile-btn"
        @click="navigateTo('Account')"
    >
      <template #prepend>
        <img src="@/assets/images/icon_arrow.svg" alt="Arrow Icon" class="custom-icon"/>
      </template>
      {{ t.profile.buttons.lblSettings }}
    </VBtnDark>

    <VBtnDark
        class="profile-btn"
        @click="navigateTo('Help')">
      <template #prepend>
        <img src="@/assets/images/icon_arrow.svg" alt="Arrow Icon" class="custom-icon"/>
      </template>
      {{ t.profile.buttons.lblHelp }}
    </VBtnDark>

    <VBtnDark
        class="profile-btn"
        @click="dialogExit = true">
      <template #prepend>
        <img src="@/assets/images/icon_arrow.svg" alt="Arrow Icon" class="custom-icon"/>
      </template>
      {{ t.profile.buttons.lblLogout }}
    </VBtnDark>

    <VModal v-model="dialogExit" max-width="500">
      <VCard>
        <v-card-title class="headline">{{ t.profile.buttons.lblConfirmLogout }}</v-card-title>
        <v-card-text>{{ t.profile.buttons.msgConfirmLogout }}</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="dialogExit = false" class="cancel-btn">{{ t.modal.btnCancel }}</v-btn>
          <v-btn @click="logout" class="confirm-btn">{{ t.profile.buttons.lblLogout }}</v-btn>
        </v-card-actions>
      </VCard>
    </VModal>

  </div>
</template>

<script setup>
import {onMounted, ref} from 'vue';
import router from "@/router/index.js";
import store from "@/core/state/store.js";
import {t} from "@/locales/index.js";
import * as masterService from "@/core/services/masterService.js";

const emit = defineEmits(['open-referral']);
const dialogExit = ref(false);
const isTelegram = ref(false);

const navigateTo = (route) => {
  router.push({name: route});
};

const logout = () => {
  store.dispatch('master/logout');
}

onMounted(() => {
  isTelegram.value = masterService.getTelegram();
});

</script>

<style scoped>
.buttons-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 20px 0 20px;
}

.profile-btn {
  width: 100%;
  height: 40px !important;
  margin: 5px 0;
  max-width: 500px;
  justify-content: flex-start;
  text-align: left;
  color: white;
  cursor: pointer;

}

.profile-btn :deep(.v-btn__content) {
  justify-content: flex-start !important;
  font-size: 0.8em;
}

.custom-icon {
  width: 10px;
  height: 10px;
  margin-right: 10px;
}

</style>
