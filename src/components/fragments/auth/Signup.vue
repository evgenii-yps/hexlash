<template>
  <div class="signup-container">
    <form @submit.prevent="handleSubmit">
      <InputField
          :label="t.auth.signup.lblLogin"
          v-model="login"
          labelColor="var(--hex-text-primary)"
          labelSize="0.65rem"
          inputBgColor="var(--hex-bg-card)"
          inputBorderColor="var(--hex-border-default)"
          inputTextColor="var(--hex-text-primary)"
          padding="14px"
          marginBottom="0.8rem"
      />
      <InputField
          :label="t.auth.signup.lblPassword"
          :type="showPassword ? 'text' : 'password'"
          v-model="password"
          labelColor="var(--hex-text-primary)"
          labelSize="0.65rem"
          inputBgColor="var(--hex-bg-card)"
          inputBorderColor="var(--hex-border-default)"
          inputTextColor="var(--hex-text-primary)"
          padding="14px"
          marginBottom="0.8rem"
          :showButton="true"
      >
        <button type="button" class="eye-btn" @click="showPassword = !showPassword">
          <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
               viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16"
               viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
            <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
        </button>
      </InputField>
      <InputField
          :label="t.auth.signup.lblConfirmPassword"
          :type="showConfirmPassword ? 'text' : 'password'"
          v-model="confirmPassword"
          labelColor="var(--hex-text-primary)"
          labelSize="0.65rem"
          inputBgColor="var(--hex-bg-card)"
          inputBorderColor="var(--hex-border-default)"
          inputTextColor="var(--hex-text-primary)"
          padding="14px"
          marginBottom="1rem"
          :showButton="true"
      >
        <button type="button" class="eye-btn" @click="showConfirmPassword = !showConfirmPassword">
          <svg v-if="!showConfirmPassword" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
               viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16"
               viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
            <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
        </button>
      </InputField>

      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

      <!-- B-AW1 (#4): v-progress-circular → canonical .hex-spinner; VBtn → HexButton.
           v-if pattern preserved (button hides during loading, spinner replaces). -->
      <div v-if="loading" class="hex-spinner auth-loader" aria-label="Loading"></div>

      <HexButton
          v-if="!loading"
          variant="primary"
          size="lg"
          block
          class="auth-btn"
          @click="handleSubmit"
      >
        {{ t.auth.signup.btnSignup }}
      </HexButton>
    </form>

    <div class="login" v-if="!loading">
      {{ t.auth.signup.question }}
      <ButtonText @click="handleLogin"
                  text-size="1.5em">
        {{ t.auth.signup.btnLogin }}
      </ButtonText>
    </div>
  </div>
</template>

<script setup>
import {ref} from 'vue';
import InputField from "@/components/ui/InputField.vue";
import ButtonText from "@/components/ui/ButtonText.vue";
import HexButton from "@/components/ui/HexButton.vue";
import {useRouter} from 'vue-router';
import {t} from "@/locales/index.js";
import store from "@/core/state/store.js";

const router = useRouter();

const login = ref('');
const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const errorMessage = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);

const handleSubmit = async () => {
  errorMessage.value = '';

  if (!login.value || !password.value || !confirmPassword.value) {
    errorMessage.value = t.value.auth.signup.errorAllFields;
    return;
  }

  if (password.value.length < 8) {
    errorMessage.value = t.value.auth.signup.errorMinPassword;
    return;
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = t.value.auth.signup.errorPasswordsMismatch;
    return;
  }

  loading.value = true;

  try {
    await store.dispatch('master/register', {
      login: login.value.trim(),
      password: password.value
    });
  } catch (error) {
    errorMessage.value = error.message || t.value.auth.signup.errorGeneral;
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
  width: 240px;
}

.login {
  margin-top: 0.6rem;
  font-size: 0.75rem;
  color: var(--hex-text-secondary);
  text-align: center;
  align-self: center;
}

.error-message {
  color: var(--hex-danger);
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
  text-align: center;
}

/* B-AW1 (#4): HexButton variant=primary size=lg block provides bg/color/sizing/font.
   Auth-specific glow shadow preserved (canonical --hex-primary-glow token). */
.auth-btn {
  box-shadow: 0 0 8px var(--hex-primary-glow);
}

/* B-AW1 (#4): center .hex-spinner during signup submit (canonical post-C9). */
.auth-loader {
  margin: 12px auto;
  width: 32px;
  height: 32px;
  border-width: 3px;
}

.eye-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--hex-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  height: 100%;
  transition: color 0.2s;
}

.eye-btn:hover {
  color: var(--hex-text-primary);
}
</style>
