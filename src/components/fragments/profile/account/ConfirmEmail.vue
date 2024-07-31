<template>
  <div class="email-confirmation-container">
    <form @submit.prevent="handleEmailSubmit" novalidate>
      <InputField
          label="EMAIL"
          type="text"
          v-model="email"
          labelColor="var(--white)"
          labelSize="10px"
          inputBgColor="var(--black-opacity)"
          inputBorderColor="var(--gray1)"
          inputTextColor="var(--white)"
          padding="0.8rem"
          marginBottom="0.5rem"
          @input="checkEmailChange"
      />
      <ButtonRect
          v-if="emailChanged"
          type="submit"
          bgColor="--pink"
          textColor="--white"
          borderColor="--pink"
          hoverBgColor="--pinkDark"
          customClass="confirm-button"
          borderRadius="0px"
          padding="0.4rem"
          marginBottom="0"
      >
        Confirm Email
      </ButtonRect>
    </form>
    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import InputField from '@/components/ui/InputField.vue';
import ButtonRect from '@/components/ui/ButtonRect.vue';
import store from "@/core/state/store.js";

const master = computed(() => store.getters['master/getMaster']);
const originalEmail = ref(master.value.email);

const email = ref(originalEmail.value);
const emailChanged = ref(false);
const errorMessage = ref('');

const validateEmail = (email) => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
};

const handleEmailSubmit = () => {
  errorMessage.value = '';

  if (!email.value) {
    errorMessage.value = 'Email is required';
    return;
  }

  if (!validateEmail(email.value)) {
    errorMessage.value = 'Invalid email format';
    return;
  }

  // Обновляем email через мутацию
  store.dispatch("master/updateMaster", { email: email.value });

  // TODO Send
};

const checkEmailChange = () => {
  emailChanged.value = email.value !== originalEmail.value;
};

watch(() => master.value.email, (newEmail) => {
  originalEmail.value = newEmail;
  email.value = newEmail;
  emailChanged.value = false;
});
</script>

<style scoped>
.email-confirmation-container {
  display: flex;
  align-items: center;
}

form {
  display: flex;
  align-items: center;
}


.error-message {
  color: var(--pinkDark);
  font-size: 0.8rem;
  margin-top: 0.5rem;
}
</style>
