<template>
  <div class="reset-layout">
    <!-- Background glow mirror AuthLayoutView (1b precedent) -->
    <div class="reset-layout__glow" aria-hidden="true"></div>

    <header class="reset-layout__header">
      <router-link to="/" class="reset-layout__logo-link" aria-label="Hexlash home">
        <HexlashMark :size="180" class="reset-layout__logo" />
      </router-link>
    </header>

    <main class="reset-layout__main">
      <div class="reset-card">
        <span class="reset-corner reset-corner--tl" aria-hidden="true"></span>
        <span class="reset-corner reset-corner--tr" aria-hidden="true"></span>
        <span class="reset-corner reset-corner--bl" aria-hidden="true"></span>
        <span class="reset-corner reset-corner--br" aria-hidden="true"></span>

        <h2 class="reset-card__title">RESET PASSWORD</h2>

        <!-- Failure state (expired/invalid token) -->
        <div v-if="failed" class="reset-card__failure">
          <p class="reset-card__hint">
            This reset link is invalid or has expired.
          </p>
          <p class="reset-card__sub">
            Reset links expire 1 hour after they are sent.
          </p>
          <button
            type="button"
            class="reset-card__btn-secondary"
            @click="onRequestNew"
          >
            Request new link
          </button>
        </div>

        <!-- Success state (rare — usually auto-redirects, but fallback if redirect blocked) -->
        <div v-else-if="succeeded" class="reset-card__success">
          <p class="reset-card__hint">
            Password reset successful. Logging you in...
          </p>
        </div>

        <!-- Form (default) -->
        <form v-else class="reset-card__form" novalidate @submit.prevent="onSubmit">
          <p class="reset-card__hint">
            Choose a new password for your account.
          </p>

          <div class="reset-card__field">
            <label class="reset-card__label" for="reset-new-password">New password</label>
            <input
              id="reset-new-password"
              v-model="form.newPassword"
              type="password"
              class="reset-card__input"
              :class="{ 'reset-card__input--error': errors.newPassword }"
              autocomplete="new-password"
              :disabled="loading"
              required
            />
            <span v-if="errors.newPassword" class="reset-card__error-msg">{{ errors.newPassword }}</span>
          </div>

          <div class="reset-card__field">
            <label class="reset-card__label" for="reset-confirm-password">Confirm password</label>
            <input
              id="reset-confirm-password"
              v-model="form.confirmPassword"
              type="password"
              class="reset-card__input"
              :class="{ 'reset-card__input--error': errors.confirmPassword }"
              autocomplete="new-password"
              :disabled="loading"
              required
            />
            <span v-if="errors.confirmPassword" class="reset-card__error-msg">{{ errors.confirmPassword }}</span>
          </div>

          <div v-if="serverError" class="reset-card__alert" role="alert">
            {{ serverError }}
          </div>

          <button
            type="submit"
            class="reset-card__submit"
            :class="{ 'reset-card__submit--loading': loading }"
            :disabled="loading || !canSubmit"
          >
            <span v-if="!loading">Reset password</span>
            <span v-else class="hx-spinner" aria-label="Loading"></span>
          </button>
        </form>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { InfoMessageModel } from '@/core/models/internal/infoMessageModel.js';
import { HexlashMark } from '@/components/brand/hexlashMark.js';

const route = useRoute();
const router = useRouter();
const store = useStore();

const token = ref('');
const loading = ref(false);
const serverError = ref('');
const failed = ref(false);
const succeeded = ref(false);

const form = reactive({
  newPassword: '',
  confirmPassword: '',
});

const errors = reactive({
  newPassword: '',
  confirmPassword: '',
});

const canSubmit = computed(() => {
  return form.newPassword.length > 0 && form.confirmPassword.length > 0;
});

onMounted(() => {
  const queryToken = route.query.token;
  if (!queryToken || typeof queryToken !== 'string') {
    // No token — redirect к login + show toast
    store.commit('master/setInfoMessage', InfoMessageModel.withoutButton(
      'Invalid reset link',
      4000
    ));
    router.replace('/auth/login');
    return;
  }
  token.value = queryToken;
});

function validate() {
  errors.newPassword = '';
  errors.confirmPassword = '';
  serverError.value = '';
  let valid = true;

  if (!form.newPassword) {
    errors.newPassword = 'required';
    valid = false;
  } else if (form.newPassword.length < 6) {
    errors.newPassword = 'min 6 characters';
    valid = false;
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = 'required';
    valid = false;
  } else if (form.newPassword !== form.confirmPassword) {
    errors.confirmPassword = 'passwords do not match';
    valid = false;
  }

  return valid;
}

async function onSubmit() {
  if (!validate()) return;
  loading.value = true;
  serverError.value = '';
  try {
    await store.dispatch('master/confirmPasswordReset', {
      token: token.value,
      newPassword: form.newPassword,
    });
    succeeded.value = true;
    // Auto-login complete — redirect к home
    store.commit('master/setInfoMessage', InfoMessageModel.withoutButton(
      'Password reset successful',
      3000
    ));
    setTimeout(() => router.push('/'), 600);
  } catch (e) {
    // 400 expired/invalid → flip к failure state (offer "request new link")
    const msg = e?.message || 'Failed to reset password';
    if (/expired|invalid token/i.test(msg)) {
      failed.value = true;
    } else {
      serverError.value = msg;
    }
  } finally {
    loading.value = false;
  }
}

function onRequestNew() {
  router.push('/auth/login');
  // User will click "Forgot password?" link от login screen
  // (could direct-link к forgot screen, но AuthSelectorView state machine
  // doesn't expose URL-based screen routing; login → click forgot link
  // is one extra step but mental model clean)
}
</script>

<style scoped>
.reset-layout {
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--void);
  color: var(--ink);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.reset-layout__glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: clamp(400px, 60vw, 900px);
  height: clamp(400px, 60vw, 900px);
  background: radial-gradient(
    circle at center,
    color-mix(in srgb, var(--pink) 12%, transparent) 0%,
    color-mix(in srgb, var(--pink) 4%, transparent) 35%,
    transparent 70%
  );
  pointer-events: none;
  z-index: 0;
}

.reset-layout__header {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
  padding: 32px 16px 16px;
}

.reset-layout__logo-link {
  display: inline-block;
  text-decoration: none;
  transition: opacity 0.15s ease;
}

.reset-layout__logo-link:hover { opacity: 0.85; }

.reset-layout__logo {
  /* 120–180px → FULL drawing (see components/brand/hexlashMark.js). */
  width: clamp(120px, 18vw, 180px);
  height: auto;
  color: var(--ink);
  user-select: none;
}

.reset-layout__main {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 16px 16px 32px;
}

.reset-card {
  position: relative;
  width: 100%;
  max-width: 420px;
  padding: 32px 28px 28px;
  background: var(--panel);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid var(--line);
  border-radius: 8px;
}

.reset-corner {
  position: absolute;
  width: 14px;
  height: 14px;
  border-color: var(--line-strong);
  opacity: 0.7;
  pointer-events: none;
}

.reset-corner--tl { top: -1px; left: -1px; border-top: 1px solid; border-left: 1px solid; }
.reset-corner--tr { top: -1px; right: -1px; border-top: 1px solid; border-right: 1px solid; }
.reset-corner--bl { bottom: -1px; left: -1px; border-bottom: 1px solid; border-left: 1px solid; }
.reset-corner--br { bottom: -1px; right: -1px; border-bottom: 1px solid; border-right: 1px solid; }

@media (max-width: 560px) {
  .reset-card { padding: 22px 18px 18px; border-radius: 6px; }
  .reset-corner { display: none; }
}

.reset-card__title {
  margin: 0 0 20px;
  text-align: center;
  font-family: 'Saira Condensed', -apple-system, sans-serif;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--ink);
}

.reset-card__hint {
  margin: 0 0 16px;
  text-align: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-dim);
  line-height: 1.5;
}

.reset-card__sub {
  margin: 0 0 24px;
  text-align: center;
  font-size: 13px;
  color: var(--ink-off);
  line-height: 1.5;
}

.reset-card__form { display: flex; flex-direction: column; gap: 16px; }
.reset-card__field { display: flex; flex-direction: column; gap: 6px; }

.reset-card__label {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 10px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--ink-off);
}

.reset-card__input {
  width: 100%;
  padding: 12px 14px;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 4px;
  color: var(--ink);
  font-family: inherit;
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.reset-card__input:focus {
  border-color: var(--pink);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--pink) 50%, transparent);
}

.reset-card__input--error {
  border-color: var(--danger);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--danger) 20%, transparent);
}

.reset-card__input:disabled { opacity: 0.5; cursor: not-allowed; }

.reset-card__error-msg {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--danger);
}

.reset-card__alert {
  padding: 10px 12px;
  background: color-mix(in srgb, var(--danger) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--danger) 35%, transparent);
  border-radius: 4px;
  color: var(--danger);
  font-size: 12px;
}

.reset-card__submit {
  margin-top: 8px;
  padding: 14px;
  min-height: 48px;
  background: var(--pink);
  color: var(--ink);
  border: none;
  border-radius: 4px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: filter 0.15s ease, transform 0.08s ease, opacity 0.15s ease, box-shadow 0.15s ease;
  box-shadow: 0 4px 12px color-mix(in srgb, var(--pink) 25%, transparent);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  outline: none;
}

.reset-card__submit:hover:not(:disabled) { filter: brightness(1.08); }
.reset-card__submit:active:not(:disabled) { transform: translateY(1px); }
.reset-card__submit:focus-visible { box-shadow: 0 0 0 5px color-mix(in srgb, var(--pink) 50%, transparent); }
.reset-card__submit:disabled { background: var(--panel); color: var(--ink-off); box-shadow: none; cursor: not-allowed; }
.reset-card__submit--loading { cursor: progress; }

/* Индикатор ожидания — общий .hx-spinner из tokens.css (Правка 1.2 §2). */

.reset-card__btn-secondary {
  padding: 12px 24px;
  min-height: 44px;
  background: transparent;
  color: var(--ink);
  border: 1px solid var(--line-strong);
  border-radius: 4px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease;
  outline: none;
}

.reset-card__btn-secondary:hover { border-color: var(--pink); color: var(--pink); }
.reset-card__btn-secondary:focus-visible {
  border-color: var(--pink);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--pink) 50%, transparent);
}

.reset-card__failure, .reset-card__success {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
