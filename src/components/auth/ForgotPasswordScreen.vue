<template>
  <div class="forgot-screen">
    <button
      type="button"
      class="forgot-screen__back"
      aria-label="Back to login"
      :disabled="loading"
      @click="$emit('back')"
    >
      ‹ Back
    </button>

    <h2 class="forgot-screen__welcome">RESET PASSWORD</h2>

    <!-- Success state (after submit) -->
    <div v-if="submitted" class="forgot-screen__success">
      <p class="forgot-screen__hint">
        If your email is registered and verified, you'll receive a reset link.
      </p>
      <p class="forgot-screen__sub">
        Check your inbox (and spam folder) within a few minutes.
      </p>
      <button
        type="button"
        class="forgot-screen__back-btn"
        @click="$emit('back')"
      >
        Return to sign in
      </button>
    </div>

    <!-- Input form -->
    <form v-else class="forgot-screen__form" novalidate @submit.prevent="onSubmit">
      <p class="forgot-screen__hint">
        Enter your email — we'll send you a reset link.
      </p>

      <div class="forgot-screen__field">
        <label class="forgot-screen__label" for="forgot-email">Email</label>
        <input
          id="forgot-email"
          v-model.trim="form.email"
          type="email"
          class="forgot-screen__input"
          :class="{ 'forgot-screen__input--error': error }"
          autocomplete="email"
          autocapitalize="none"
          :disabled="loading"
          required
        />
        <span v-if="error" class="forgot-screen__error-msg">{{ error }}</span>
      </div>

      <button
        type="submit"
        class="forgot-screen__submit"
        :class="{ 'forgot-screen__submit--loading': loading }"
        :disabled="loading || !canSubmit"
      >
        <span v-if="!loading">Send reset link</span>
        <span v-else class="forgot-screen__submit-spinner" aria-label="Loading"></span>
      </button>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue';

const props = defineProps({
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(['submit', 'back']);

const form = reactive({ email: '' });
const error = ref('');
const submitted = ref(false);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const canSubmit = computed(() => form.email.length > 0);

function onSubmit() {
  error.value = '';
  if (!form.email) {
    error.value = 'required';
    return;
  }
  if (!EMAIL_RE.test(form.email)) {
    error.value = 'invalid email';
    return;
  }
  // Parent (AuthSelectorView) dispatches Vuex action + flips submitted=true
  // via response (we mirror submitted=true here optimistically since BE
  // returns generic 200 in all cases — never an "error" path from forgot
  // perspective). Parent can call emit('back') manually if it wants to
  // bail before success state.
  emit('submit', { email: form.email });
}

// Expose method for parent to flip к success state after Vuex dispatch resolves.
// AuthSelectorView calls this via ref after dispatch resolves.
defineExpose({
  showSuccess() {
    submitted.value = true;
  },
});
</script>

<style scoped>
.forgot-screen {
  position: relative;
  display: flex;
  flex-direction: column;
}

.forgot-screen__back {
  position: absolute;
  top: -14px;
  left: -10px;
  min-height: 44px;
  min-width: 44px;
  padding: 12px 14px;
  background: transparent;
  border: none;
  color: var(--hex-text-muted);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  cursor: pointer;
  transition: color 0.15s ease;
  outline: none;
}

.forgot-screen__back:hover:not(:disabled) {
  color: var(--hex-text-primary);
}

.forgot-screen__back:focus-visible {
  color: var(--hex-primary);
  box-shadow: 0 0 0 2px var(--hex-primary-glow);
  border-radius: 2px;
}

.forgot-screen__back:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.forgot-screen__welcome {
  margin: 0 0 16px;
  text-align: center;
  font-family: inherit;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--hex-text-primary);
}

.forgot-screen__hint {
  margin: 0 0 20px;
  text-align: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--hex-text-secondary);
  line-height: 1.5;
}

.forgot-screen__sub {
  margin: 0 0 24px;
  text-align: center;
  font-size: 13px;
  color: var(--hex-text-muted);
  line-height: 1.5;
}

.forgot-screen__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.forgot-screen__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.forgot-screen__label {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 10px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--hex-text-muted);
}

.forgot-screen__input {
  width: 100%;
  padding: 12px 14px;
  background: var(--hex-bg-light);
  border: 1px solid var(--hex-border-default);
  border-radius: 4px;
  color: var(--hex-text-primary);
  font-family: inherit;
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.forgot-screen__input:focus {
  border-color: var(--hex-primary);
  box-shadow: 0 0 0 3px var(--hex-primary-glow);
}

.forgot-screen__input--error {
  border-color: var(--hex-danger);
  box-shadow: 0 0 0 3px rgba(255, 51, 51, 0.20);
}

.forgot-screen__input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.forgot-screen__error-msg {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--hex-danger);
}

.forgot-screen__submit {
  margin-top: 8px;
  padding: 14px;
  min-height: 48px;
  background: var(--hex-primary);
  color: #fff;
  border: none;
  border-radius: 4px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: filter 0.15s ease, transform 0.08s ease, opacity 0.15s ease, box-shadow 0.15s ease;
  box-shadow: 0 4px 12px rgba(255, 6, 111, 0.25);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  outline: none;
}

.forgot-screen__submit:hover:not(:disabled) {
  filter: brightness(1.08);
}

.forgot-screen__submit:active:not(:disabled) {
  transform: translateY(1px);
}

.forgot-screen__submit:focus-visible {
  box-shadow: 0 0 0 5px var(--hex-primary-glow);
}

.forgot-screen__submit:disabled {
  background: var(--hex-bg-light);
  color: var(--hex-text-muted);
  box-shadow: none;
  cursor: not-allowed;
}

.forgot-screen__submit--loading {
  cursor: progress;
}

.forgot-screen__submit-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: forgot-spin 0.6s linear infinite;
}

@keyframes forgot-spin {
  to { transform: rotate(360deg); }
}

.forgot-screen__success {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.forgot-screen__back-btn {
  margin-top: 8px;
  padding: 12px 24px;
  min-height: 44px;
  background: transparent;
  color: var(--hex-text-primary);
  border: 1px solid var(--hex-border-strong);
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

.forgot-screen__back-btn:hover {
  border-color: var(--hex-primary);
  color: var(--hex-primary);
}

.forgot-screen__back-btn:focus-visible {
  border-color: var(--hex-primary);
  box-shadow: 0 0 0 3px var(--hex-primary-glow);
}
</style>
