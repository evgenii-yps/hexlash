<template>
  <div class="signup-container">
    <form @submit.prevent="handleSubmit">
      <InputField
          :label="t('auth.signup.lblLogin')"
          v-model="login"
          labelColor="var(--white)"
          labelSize="0.5rem"
          inputBgColor="var(--black-opacity)"
          inputBorderColor="var(--gray1)"
          inputTextColor="var(--white)"
          height="40px"
          marginBottom="0.6rem"
      />
      <InputField
          :label="t('auth.signup.lblPassword')"
          type="password"
          v-model="password"
          labelColor="var(--white)"
          labelSize="0.5rem"
          inputBgColor="var(--black-opacity)"
          inputBorderColor="var(--gray1)"
          inputTextColor="var(--white)"
          height="40px"
          marginBottom="0.6rem"
      />
      <InputField
          :label="t('auth.signup.lblConfirmPassword')"
          type="password"
          v-model="confirmPassword"
          labelColor="var(--white)"
          labelSize="0.5rem"
          inputBgColor="var(--black-opacity)"
          inputBorderColor="var(--gray1)"
          inputTextColor="var(--white)"
          height="40px"
          marginBottom="0.8rem"
      />

      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

      <v-progress-circular
          v-if="loading"
          class="loader"
          size="40"
          indeterminate
      />

      <VBtn v-if="!loading" class="auth-btn" @click="handleSubmit">
        {{ t('auth.signup.btnSignup') }}
      </VBtn>

      <div class="login" v-if="!loading">
        {{ t('auth.signup.question') }}
        <ButtonText @click="handleLogin"
                    textColor="var(--pink)"
                    text-size="1.5em">
          {{ t('auth.signup.btnLogin') }}
        </ButtonText>
      </div>
    </form>
  </div>
</template>

<script setup>
import {ref} from 'vue';
import InputField from "@/components/ui/InputField.vue";
import ButtonText from "@/components/ui/ButtonText.vue";
import {useRouter} from 'vue-router';
import {useI18n} from "vue-i18n";
import store from "@/core/state/store.js";

const {t} = useI18n({useScope: 'global'});

const router = useRouter();

const login = ref('');
const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const errorMessage = ref('');

const handleSubmit = async () => {
  errorMessage.value = '';

  if (!login.value || !password.value || !confirmPassword.value) {
    errorMessage.value = t('auth.signup.errorAllFields');
    return;
  }

  if (password.value.length < 8) {
    errorMessage.value = t('auth.signup.errorMinPassword');
    return;
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = t('auth.signup.errorPasswordsMismatch');
    return;
  }

  loading.value = true;

  try {
    await store.dispatch('master/register', {
      login: login.value,
      password: password.value
    });
  } catch (error) {
    errorMessage.value = error.message || t('auth.signup.errorGeneral');
  } finally {
    loading.value = false;
  }
};

const handleLogin = () => {
  router.push('/auth/login');
};
</script>

<style scoped>
.signup-container {
  position: absolute;
  bottom: 10vh;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
}

form {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 180px;
}

.login {
  margin-top: 0.5rem;
  font-size: 0.7rem;
  color: var(--gray2);
  align-self: flex-end;
  display: block;
}

.error-message {
  color: var(--pinkDark);
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
  text-align: center;
}

.auth-btn {
  color: white;
  width: 100%;
  height: 40px !important;
  cursor: pointer;
}
</style>
