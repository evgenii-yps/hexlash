<template>
  <div class="reset-container">
    <div class="form-wrapper">
      <InputField
          :label="t.auth.reset.lblEmail"
          v-model="email"
          labelColor="var(--hex-text-primary)"
          labelSize="0.65rem"
          inputBgColor="var(--hex-bg-card)"
          inputBorderColor="var(--hex-border-default)"
          inputTextColor="var(--hex-text-primary)"
          padding="14px"
          marginBottom="1rem"
      />

      <div v-if="resetState.errorMessage" class="error-message">{{ resetState.errorMessage }}</div>
      <div v-if="resetState.successMessage" class="success-message">{{ resetState.successMessage }}</div>

      <!-- B-AW1 (#4): v-progress-circular → canonical .hex-spinner; VBtn → HexButton.
           v-if pattern preserved (button hides during loading or after success). -->
      <div v-if="resetState.loading" class="hex-spinner auth-loader" aria-label="Loading"></div>

      <HexButton
          v-if="!resetState.loading && !resetState.successMessage"
          variant="primary"
          size="lg"
          block
          class="auth-btn"
          @click="handleResetSubmit"
      >
        {{ t.auth.reset.btnReset }}
      </HexButton>
    </div>

    <div class="login" v-if="!resetState.loading">
      {{ t.auth.signup.question }}
      <ButtonText @click="handleLogin"
                  text-size="1.5em">
        {{ t.auth.signup.btnLogin }}
      </ButtonText>
    </div>
  </div>
</template>

<script setup>
import {ref, computed, onMounted} from 'vue';
import InputField from "@/components/ui/InputField.vue";
import ButtonText from "@/components/ui/ButtonText.vue";
import HexButton from "@/components/ui/HexButton.vue";
import {useRouter} from 'vue-router';
import {t} from "@/locales/index.js";
import store from "@/core/state/store.js";

const email = ref('');
const router = useRouter();

const resetState = computed(() => store.getters['master/getResetState']);

const handleResetSubmit = () => {
  store.dispatch('master/resetPassword', email.value);
};

const handleLogin = () => {
  router.push('/auth/login');
};

onMounted(() => {
  email.value = '';
  store.commit('master/clearResetState');
});
</script>

<style scoped>
.reset-container {
  position: absolute;
  bottom: 10vh;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.form-wrapper {
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
}

.success-message {
  color: var(--hex-text-primary);
  font-size: 0.8rem;
  text-align: center;
  margin-bottom: 0.5rem;
}

/* B-AW1 (#4): HexButton variant=primary size=lg block provides bg/color/sizing/font.
   Auth-specific glow shadow preserved (canonical --hex-primary-glow token). */
.auth-btn {
  box-shadow: 0 0 8px var(--hex-primary-glow);
}

/* B-AW1 (#4): center .hex-spinner during reset submit (canonical post-C9). */
.auth-loader {
  margin: 12px auto;
  width: 32px;
  height: 32px;
  border-width: 3px;
}
</style>
