<template>
  <div class="change-password-container">
    <HexButton
        variant="secondary"
        size="md"
        block
        class="change-password-btn"
        @click="dialog = true"
    >
      {{ t.profile.account.lblChangePassword }}
      <img src="@/assets/images/icon_pencil.svg" alt="" class="custom-icon"/>
    </HexButton>

    <!-- C9: VModal/VCard/v-card-* → inline Teleport + canonical .hex-modal-* taxonomy
         (body/actions/close added в hexlash-ui.css C9 Edit 1, replacing C8 .cl-* classes). -->
    <Teleport to="body">
      <div
          v-if="dialog"
          class="hex-modal-overlay"
          @click.self="cancel"
      >
        <div class="hex-modal" @click.stop>
          <h2 class="hex-modal-title">{{ t.profile.account.lblChangePassword }}</h2>
          <button class="hex-modal-close" @click="cancel" aria-label="Close">×</button>
          <div class="hex-modal-body">
            <form @submit.prevent="handleSubmit">
              <InputField
                  :label="t.profile.account.lblCurrentPassword"
                  type="password"
                  v-model="currentPassword"
                  labelColor="var(--hex-text-primary)"
                  inputBgColor="var(--hex-bg-card)"
                  inputBorderColor="var(--hex-border-default)"
                  inputTextColor="var(--hex-text-primary)"
                  height="40px"
                  marginBottom="1rem"
              />
              <InputField
                  :label="t.profile.account.lblNewPassword"
                  type="password"
                  v-model="newPassword"
                  labelColor="var(--hex-text-primary)"
                  inputBgColor="var(--hex-bg-card)"
                  inputBorderColor="var(--hex-border-default)"
                  inputTextColor="var(--hex-text-primary)"
                  height="40px"
                  marginBottom="1rem"
              />
              <InputField
                  :label="t.profile.account.lblConfirmNewPassword"
                  type="password"
                  v-model="confirmNewPassword"
                  labelColor="var(--hex-text-primary)"
                  inputBgColor="var(--hex-bg-card)"
                  inputBorderColor="var(--hex-border-default)"
                  inputTextColor="var(--hex-text-primary)"
                  height="40px"
                  marginBottom="1rem"
              />

              <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

              <div v-if="loading" class="hex-spinner cp-loader" aria-label="Loading"></div>
            </form>
          </div>
          <div class="hex-modal-actions">
            <HexButton variant="secondary" size="md" @click="cancel" :disabled="loading">
              {{ t.modal.btnCancel }}
            </HexButton>
            <HexButton variant="primary" size="md" @click="handleSubmit" :disabled="loading">
              {{ t.modal.btnConfirm }}
            </HexButton>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import {computed, ref} from 'vue';
import InputField from '@/components/ui/InputField.vue';
import HexButton from '@/components/ui/HexButton.vue';
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
  color: var(--hex-danger);
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
}

.change-password-btn {
  width: 100%;
  height: 40px !important;
  max-width: 500px;
  text-align: center;
  color: var(--hex-text-primary);
  cursor: pointer;
  font-size: 0.7rem !important;
}

.custom-icon {
  width: 15px;
  height: 15px;
  margin-left: 10px;
}

/* C9: spinner positioning inside form (margin-only — base .hex-spinner global) */
.cp-loader {
  margin: 12px auto 0;
}
</style>
