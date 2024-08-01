<template>
  <div class="change-password-container">
    <VBtnDark
        class="change-password-btn"
        @click="dialog = true"
    >
      <template #append>
        <img src="@/assets/images/icon_pencil.svg" alt="" class="custom-icon"/>
      </template>
      Change Password
    </VBtnDark>

    <VModal v-model="dialog" max-width="500">
      <VCard>
        <v-card-title class="headline">Change Password</v-card-title>
        <v-card-text style="margin-bottom: 0">
          <form @submit.prevent="handleSubmit">
            <InputField
                label="CURRENT PASSWORD"
                type="password"
                v-model="currentPassword"
                labelColor="var(--white)"
                labelSize="10px"
                inputBgColor="var(--black-opacity)"
                inputBorderColor="var(--gray1)"
                inputTextColor="var(--white)"
                padding="0.8rem"
                marginBottom="1rem"
            />
            <InputField
                label="NEW PASSWORD"
                type="password"
                v-model="newPassword"
                labelColor="var(--white)"
                labelSize="10px"
                inputBgColor="var(--black-opacity)"
                inputBorderColor="var(--gray1)"
                inputTextColor="var(--white)"
                padding="0.8rem"
                marginBottom="1rem"
            />
            <InputField
                label="CONFIRM NEW PASSWORD"
                type="password"
                v-model="confirmNewPassword"
                labelColor="var(--white)"
                labelSize="10px"
                inputBgColor="var(--black-opacity)"
                inputBorderColor="var(--gray1)"
                inputTextColor="var(--white)"
                padding="0.8rem"
                marginBottom="1rem"
            />

            <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

            <CircularLoader style="scale: 0.3"
                            v-if="loading"
                            :size="5"
                            :speed="2"
                            :opacity="80"
            />
          </form>
        </v-card-text>
        <v-card-actions style="padding-top: 0">
          <VBtnDark class="cancel-btn" @click="cancel">Cancel</VBtnDark>
          <VBtn color="white" @click="handleSubmit" class="confirm-btn">Confirm</VBtn>
        </v-card-actions>
      </VCard>
    </VModal>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import InputField from '@/components/ui/InputField.vue';
import CircularLoader from '@/components/ui/CircularLoader.vue';
import store from "@/core/state/store.js";

const currentUser = computed(() => store.getters['user/getCurrentUser']);

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

const handleSubmit = () => {
  errorMessage.value = '';

  if (!currentPassword.value || !newPassword.value || !confirmNewPassword.value) {
    errorMessage.value = 'All fields are required';
    return;
  }

  if (newPassword.value !== confirmNewPassword.value) {
    errorMessage.value = 'Passwords do not match';
    return;
  }

  if (newPassword.value.length < 8 || !/\d/.test(newPassword.value) || !/[A-Z]/.test(newPassword.value)) {
    errorMessage.value = 'Password must be at least 8 characters long and include numbers and uppercase letters';
    return;
  }

  loading.value = true;
  // Дополнительная логика обработки смены пароля
  // Например, вызов API для смены пароля и обработка результата
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
  height: 50px;
  max-width: 500px;
  text-align: center;
  color: white;
  cursor: pointer;
}

.custom-icon {
  width: 15px;
  height: 15px;
  margin-left: 10px;
}

.confirm-btn{
  cursor: pointer;
  text-transform: none;
  background-color: var(--pink);
  color: white;
  margin: 10px;
}

.cancel-btn {
  text-align: center;
  color: var(--gray2);
  cursor: pointer;
  text-transform: none;
}
</style>
