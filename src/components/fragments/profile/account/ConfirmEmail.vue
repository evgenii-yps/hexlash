<template>
  <div class="email-confirmation-container">
    <form @submit.prevent="handleEmailSubmit" novalidate>
      <InputField
          :label="t('profile.account.lblChangeEmail')"
          type="text"
          v-model="email"
          labelColor="var(--white)"
          labelSize="10px"
          inputBgColor="var(--black-opacity-80)"
          inputBorderColor="var(--gray1)"
          inputTextColor="var(--white)"
          padding="0.8rem"
          marginBottom="0.5rem"
          @input="checkEmailChange"
          :showButton="emailChanged"
      >
        <!-- Можно вставить любую кнопку, лоадер или любой другой элемент -->
        <template v-slot>
          <VBtnDark size="small" @click="handleEmailSubmit" class="input-button">
            {{ t('profile.account.btnSendConfirm') }}
          </VBtnDark>
        </template>

      </InputField>
    </form>
    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import InputField from '@/components/ui/InputField.vue';
import store from "@/core/state/store.js";
import {useI18n} from "vue-i18n";

const { t } = useI18n({ useScope: 'global' })

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
    errorMessage.value = t('profile.account.lblEmailRequired');
    return;
  }

  if (!validateEmail(email.value)) {
    errorMessage.value = t('profile.account.lblInvalidEmailFormat');
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
}, {immediate: true});
</script>

<style scoped>
.email-confirmation-container {
  align-items: center;
  margin: 20px 20px 10px 20px;
}

form {
  display: flex;
  align-items: center;
  max-width: 500px;
  margin: 0 auto;
}


.error-message {
  color: var(--pinkDark);
  font-size: 0.8rem;
  margin-top: 0.5rem;
}

.input-button {
  background-color: var(--black-opacity-80);
  color: var(--white);
  border: 0.5px solid var(--gray2);
  cursor: pointer;
  outline: none;
  padding: 0.5em 1em;
  border-radius: 4px;
  margin: 0 0.5rem;
}

.input-button:hover {
  background-color: var(--gray2);
}
</style>
