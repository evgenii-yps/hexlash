<template>
  <div class="change-password-container">
    <VBtnDark
        class="change-password-btn"
        @click="dialog = true"
    >
      <template #append>
        <img src="@/assets/images/icon_pencil.svg" alt="" class="custom-icon"/>
      </template>
      {{ t.profile.account.lblChangePassword }}
    </VBtnDark>

    <VModal v-model="dialog" max-width="500">
      <VCard>
        <v-card-title class="headline">{{ t.profile.account.lblChangePassword }}</v-card-title>
        <v-card-text style="margin-bottom: 0">
          <form @submit.prevent="handleSubmit">
            <InputField
                :label="t.profile.account.lblCurrentPassword"
                type="password"
                v-model="currentPassword"
                labelColor="var(--white)"
                inputBgColor="var(--black-opacity)"
                inputBorderColor="var(--gray1)"
                inputTextColor="var(--white)"
                height="40px"
                marginBottom="1rem"
            />
            <InputField
                :label="t.profile.account.lblNewPassword"
                type="password"
                v-model="newPassword"
                labelColor="var(--white)"
                inputBgColor="var(--black-opacity)"
                inputBorderColor="var(--gray1)"
                inputTextColor="var(--white)"
                height="40px"
                marginBottom="1rem"
            />
            <InputField
                :label="t.profile.account.lblConfirmNewPassword"
                type="password"
                v-model="confirmNewPassword"
                labelColor="var(--white)"
                inputBgColor="var(--black-opacity)"
                inputBorderColor="var(--gray1)"
                inputTextColor="var(--white)"
                height="40px"
                marginBottom="1rem"
            />

            <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

            <v-progress-circular
                v-if="loading"
                class="loader"
                size="40"
                indeterminate
            />

          </form>
        </v-card-text>
        <v-card-actions style="padding-top: 0">
          <VBtnDark class="cancel-btn" @click="cancel">{{ t.modal.btnCancel }}</VBtnDark>
          <VBtn class="confirm-btn" @click="handleSubmit">{{ t.modal.btnConfirm }}</VBtn>
        </v-card-actions>
      </VCard>
    </VModal>
  </div>
</template>

<script setup>
import {computed, ref} from 'vue';
import InputField from '@/components/ui/InputField.vue';
import store from "@/core/state/store.js";
import {t} from "@/locales/index.js";
import {InfoMessageModel} from "@/core/models/internal/infoMessageModel.js";

const currentPassword = ref('');
const newPassword = ref('');
const confirmNewPassword = ref('');
const loading = ref(false);
const errorMessage = ref('');
const dialog = ref(false);

const cancel = () => {
  dialog.value = false;
  errorMessage.value = '';
}

const handleSubmit = async () => {
  errorMessage.value = '';

  if (!currentPassword.value || !newPassword.value || !confirmNewPassword.value) {
    errorMessage.value = t.value.profile.account.lblAllFieldsRequired;
    return;
  }

  if (newPassword.value !== confirmNewPassword.value) {
    errorMessage.value = t.value.profile.account.lblPasswordsDoNotMatch;
    return;
  }

  if (newPassword.value.length < 8 || !/\d/.test(newPassword.value) || !/[A-Z]/.test(newPassword.value)) {
    errorMessage.value = t.value.profile.account.lblPasswordRequirements;
    return;
  }

  loading.value = true;

  if (await store.dispatch('master/updateMaster', {
    newPassword: newPassword.value,
    oldPassword: currentPassword.value,
  })) {
    cancel();
    store.commit('master/setInfoMessage', InfoMessageModel.withText(t.value.profile.account.lblPasswordsChangeSuccessful));
  }

  loading.value = false;

};
</script>

<style scoped>
.change-password-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 20px;
}

form {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.error-message {
  color: var(--pinkDark);
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
}

.change-password-btn {
  width: 100%;
  height: 40px !important;
  max-width: 500px;
  text-align: center;
  color: white;
  cursor: pointer;
  font-size: 0.7rem !important;
}

.custom-icon {
  width: 15px;
  height: 15px;
  margin-left: 10px;
}


</style>
