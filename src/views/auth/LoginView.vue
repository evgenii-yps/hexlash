<template>
  <div class="auth-form-wrap">
    <div class="auth-form">
      <p class="auth-form__subhead">ENTER THE PIT</p>
      <h1 class="auth-form__title">Sign in</h1>

      <form class="auth-form__form" @submit.prevent="onSubmit" novalidate>
        <!-- Login (handle) field -->
        <div class="auth-form__field">
          <label class="auth-form__label" for="login-handle">
            Handle
            <span class="auth-form__required" v-if="errors.login">{{ errors.login }}</span>
          </label>
          <input
            id="login-handle"
            v-model="form.login"
            type="text"
            class="auth-form__input"
            :class="{ 'auth-form__input--error': errors.login }"
            placeholder="enter your handle"
            autocomplete="username"
            autocapitalize="none"
            :disabled="loading"
            required
          />
        </div>

        <!-- Password field -->
        <div class="auth-form__field">
          <label class="auth-form__label" for="login-password">
            Password
            <span class="auth-form__required" v-if="errors.password">{{ errors.password }}</span>
          </label>
          <input
            id="login-password"
            v-model="form.password"
            type="password"
            class="auth-form__input"
            :class="{ 'auth-form__input--error': errors.password }"
            placeholder="••••••••"
            autocomplete="current-password"
            :disabled="loading"
            required
          />
        </div>

        <!-- Server error (from Vuex master/login action — sets authError on failure) -->
        <p v-if="authError" class="auth-form__server-error" role="alert">
          {{ authError }}
        </p>

        <!-- Sign in button -->
        <button
          type="submit"
          class="auth-form__cta"
          :disabled="loading || !canSubmit"
        >
          <span v-if="!loading">Sign in</span>
          <span v-else class="auth-form__spinner" aria-label="Loading"></span>
        </button>

        <!-- OR divider -->
        <div class="auth-form__divider">
          <span>OR</span>
        </div>

        <!-- Connect Wallet button (decision #5: UI present, BE deferred to Stream 6) -->
        <button
          type="button"
          class="auth-form__wallet"
          :disabled="loading"
          @click="onConnectWallet"
        >
          Connect Wallet
        </button>

        <!-- Switch to signup -->
        <p class="auth-form__switch">
          Don't have an account?
          <router-link to="/auth/signup" class="auth-form__switch-link">Sign up</router-link>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { InfoMessageModel } from '@/core/models/internal/infoMessageModel.js';

const store = useStore();

const form = ref({
  login: '',
  password: '',
});

const errors = ref({
  login: '',
  password: '',
});

const loading = ref(false);

// master/login action sets loginState.authError on failure (no throw).
// On success, action calls router.push('/') internally — beforeEnter on '/'
// cascades to /v2 if authenticated (Sub-epic 1a).
const authError = computed(() => store.getters['master/getLoginState'].authError);

const canSubmit = computed(() => {
  return form.value.login.trim().length > 0 && form.value.password.length > 0;
});

function validate() {
  errors.value = { login: '', password: '' };
  let valid = true;
  if (!form.value.login.trim()) {
    errors.value.login = 'required';
    valid = false;
  }
  if (!form.value.password) {
    errors.value.password = 'required';
    valid = false;
  }
  return valid;
}

async function onSubmit() {
  if (!validate()) return;
  loading.value = true;
  try {
    await store.dispatch('master/login', {
      login: form.value.login.trim(),
      password: form.value.password,
    });
    // Action handles router.push('/') internally on success.
    // On failure, authError is set in store via setLoginState mutation.
  } finally {
    loading.value = false;
  }
}

function onConnectWallet() {
  // Decision #5: BE SIWE deferred to Stream 6. Show "Coming soon" toast.
  const msg = InfoMessageModel.withTimeout('Wallet sign-in coming soon', 3000);
  store.commit('master/setInfoMessage', msg);
}
</script>

<style scoped>
.auth-form-wrap {
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 16px 0;
}

.auth-form {
  width: 100%;
  max-width: 420px;
  background: var(--hex-bg-card);
  backdrop-filter: blur(8px);
  border: 1px solid var(--hex-border-default);
  border-radius: 8px;
  padding: 32px 28px;
}

.auth-form__subhead {
  margin: 0 0 4px;
  text-align: center;
  font-size: 12px;
  letter-spacing: 0.18em;
  color: var(--hex-primary);
  text-transform: uppercase;
}

.auth-form__title {
  margin: 0 0 24px;
  text-align: center;
  font-size: 22px;
  font-weight: 600;
  color: var(--hex-text-primary);
  letter-spacing: 0.02em;
}

.auth-form__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.auth-form__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.auth-form__label {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--hex-text-muted);
}

.auth-form__required {
  font-size: 10px;
  color: var(--hex-primary);
  text-transform: uppercase;
}

.auth-form__input {
  width: 100%;
  padding: 12px 14px;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--hex-border-active);
  color: var(--hex-text-primary);
  font-size: 15px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s ease;
}

.auth-form__input::placeholder {
  color: var(--hex-text-muted);
  opacity: 0.6;
}

.auth-form__input:focus {
  border-color: var(--hex-primary);
}

.auth-form__input--error {
  border-color: var(--hex-primary);
}

.auth-form__input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.auth-form__server-error {
  margin: 4px 0 0;
  padding: 8px 12px;
  background: rgba(255, 6, 111, 0.08);
  border-left: 2px solid var(--hex-primary);
  color: var(--hex-text-primary);
  font-size: 13px;
}

.auth-form__cta {
  margin-top: 8px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 14px;
  background: var(--hex-primary);
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
  box-shadow: 0 0 24px rgba(255, 6, 111, 0.4);
  display: inline-flex;
  justify-content: center;
  align-items: center;
  min-height: 48px;
}

.auth-form__cta:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 0 32px rgba(255, 6, 111, 0.6);
}

.auth-form__cta:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

.auth-form__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: auth-spin 0.6s linear infinite;
}

@keyframes auth-spin {
  to { transform: rotate(360deg); }
}

.auth-form__divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 8px 0;
  color: var(--hex-text-muted);
  font-size: 11px;
  letter-spacing: 0.15em;
}

.auth-form__divider::before,
.auth-form__divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--hex-border-default);
}

.auth-form__wallet {
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 12px 14px;
  background: transparent;
  color: var(--hex-text-primary);
  border: 1px solid var(--hex-border-active);
  border-radius: 4px;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.auth-form__wallet:hover:not(:disabled) {
  border-color: var(--hex-primary);
  background: rgba(255, 6, 111, 0.05);
}

.auth-form__wallet:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.auth-form__switch {
  margin: 16px 0 0;
  text-align: center;
  font-size: 13px;
  color: var(--hex-text-muted);
}

.auth-form__switch-link {
  color: var(--hex-primary);
  text-decoration: none;
  font-weight: 600;
  margin-left: 4px;
}

.auth-form__switch-link:hover {
  text-decoration: underline;
}

@media (max-width: 480px) {
  .auth-form {
    padding: 24px 20px;
    border-radius: 4px;
  }
}
</style>
