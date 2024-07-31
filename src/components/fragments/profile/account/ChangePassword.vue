<template>
  <div class="change-password-container">
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
          marginBottom="0.5rem"
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
          marginBottom="0.5rem"
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
          marginBottom="1.3rem"
      />

      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

      <CircularLoader style="scale: 0.3"
                      v-if="loading"
                      :size="5"
                      :speed="2"
                      :opacity="80"
      />

      <ButtonRect
          v-if="!loading"
          type="submit"
          bgColor="--pink"
          textColor="--white"
          borderColor="--pink"
          hoverBgColor="--pinkDark"
          customClass=""
          borderRadius="0px"
          padding="0.8rem"
          marginBottom="0.5rem"
      >
        Change Password
      </ButtonRect>
    </form>
  </div>
</template>

<script setup>
import {computed, ref} from 'vue';
import InputField from '@/components/ui/InputField.vue';
import CircularLoader from '@/components/ui/CircularLoader.vue';
import ButtonRect from '@/components/ui/ButtonRect.vue';
import store from "@/core/state/store.js";

const currentUser = computed(() => store.getters['user/getCurrentUser']);

const currentPassword = ref('');
const newPassword = ref('');
const confirmNewPassword = ref('');
const loading = ref(false);
const errorMessage = ref('');

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
};
</script>

<style scoped>
.change-password-container {
  display: flex;
  flex-direction: column;
  align-items: start;
}

form {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 300px;
}

.error-message {
  color: var(--pinkDark);
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
}
</style>
