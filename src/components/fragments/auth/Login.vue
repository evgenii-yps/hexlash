<template>
  <div class="login-container">
    <form @submit.prevent="handleSubmit">
      <InputField
          :label="t.auth.login.lblLogin"
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
          :label="t.auth.login.lblPassword"
          :type="showPassword ? 'text' : 'password'"
          v-model="password"
          labelColor="var(--hex-text-primary)"
          labelSize="0.65rem"
          inputBgColor="var(--hex-bg-card)"
          inputBorderColor="var(--hex-border-default)"
          inputTextColor="var(--hex-text-primary)"
          padding="14px"
          marginBottom="1rem"
          :showButton="true"
      >
        <button type="button" class="eye-btn" @click="showPassword = !showPassword">
          <!-- eye open -->
          <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
               viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          <!-- eye off -->
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

      <div v-if="authState.authError" class="error-message">{{ t.auth.login.authError }}</div>

      <!-- B-AW1 (#4): v-progress-circular → canonical .hex-spinner (post-C9 taxonomy);
           VBtn → HexButton variant=primary size=lg block. v-if pattern preserved
           (button hides during loading, spinner replaces). -->
      <div v-if="loading" class="hex-spinner auth-loader" aria-label="Loading"></div>

      <HexButton
          v-if="!loading"
          variant="primary"
          size="lg"
          block
          class="auth-btn"
          @click="handleSubmit"
      >
        {{ t.auth.login.btnLogin }}
      </HexButton>
    </form>

    <div class="signup" v-if="!loading">
      {{ t.auth.login.questionSignup }}
      <ButtonText @click="handleSignup"
                  text-size="1.5em">
        {{ t.auth.login.btnSignup }}
      </ButtonText>
    </div>
    <div class="reset-password" v-if="authState.authError">
      {{ t.auth.login.lblOrPass }}
      <ButtonText @click="handleReset"
                  text-size="1.5em">
        {{ t.auth.login.btnReset }}
      </ButtonText>
    </div>
  </div>
</template>

<script setup>
import {computed, ref} from 'vue';
import InputField from "@/components/ui/InputField.vue";
import ButtonText from "@/components/ui/ButtonText.vue";
import HexButton from "@/components/ui/HexButton.vue";
import {useRouter} from 'vue-router';

import store from "@/core/state/store.js";
import {t} from "@/locales/index.js";

const router = useRouter();

const login = ref('');
const password = ref('');
const loading = ref(false);
const showPassword = ref(false);

const authState = computed(() => store.getters['master/getLoginState']);

const handleSubmit = async () => {
  loading.value = true;
  try {
    const credentials = {login: login.value.trim(), password: password.value};
    await store.dispatch('master/login', credentials);
  } finally {
    loading.value = false;
  }
};

const handleSignup = () => {
  router.push('/auth/signup');
};

const handleReset = () => {
  router.push('/auth/reset');
};
</script>

<style scoped>
.login-container {
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

.signup {
  margin-top: 0.6rem;
  font-size: 0.75rem;
  color: var(--hex-text-secondary);
  text-align: center;
  align-self: center;
}

.reset-password {
  color: gray;
  margin-top: 0.4rem;
  font-size: 0.75rem;
  text-align: center;
}

.error-message {
  color: var(--hex-danger);
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
}

/* B-AW1 (#4): HexButton variant=primary size=lg block provides bg/color/sizing/font.
   Auth-specific glow shadow preserved (uses canonical --hex-primary-glow token). */
.auth-btn {
  box-shadow: 0 0 8px var(--hex-primary-glow);
}

/* B-AW1 (#4): center .hex-spinner during login submit (canonical post-C9). */
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
