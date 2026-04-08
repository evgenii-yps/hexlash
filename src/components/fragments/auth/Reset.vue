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

      <v-progress-circular
          v-if="resetState.loading"
          class="loader"
          size="40"
          indeterminate
      />

      <VBtn v-if="!resetState.loading && !resetState.successMessage" class="auth-btn" @click="handleResetSubmit">
        {{ t.auth.reset.btnReset }}
      </VBtn>
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

.auth-btn {
  background-color: var(--hex-primary) !important;
  color: var(--hex-text-primary) !important;
  width: 100%;
  height: 50px !important;
  min-height: 48px;
  cursor: pointer;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 0 8px rgba(255, 6, 111, 0.5) /* glow from --hex-primary */;
}
</style>
