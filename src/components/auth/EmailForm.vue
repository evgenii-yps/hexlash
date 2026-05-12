<template>
  <div class="email-form">
    <button type="button" class="email-form__back" aria-label="Back to providers" @click="$emit('back')">
      ‹ Back
    </button>

    <h2 class="email-form__welcome">WELCOME</h2>

    <form class="email-form__form" novalidate @submit.prevent="onSubmit">
      <!-- Handle (always) -->
      <div class="email-form__field">
        <label class="email-form__label" for="auth-handle">Handle{{ mode === 'login' ? ' or email' : '' }}</label>
        <input
          id="auth-handle"
          v-model.trim="form.handle"
          type="text"
          class="email-form__input"
          :class="{ 'email-form__input--error': errors.handle }"
          autocomplete="username"
          autocapitalize="none"
          :disabled="loading"
          required
        />
        <span v-if="errors.handle" class="email-form__error-msg">{{ errors.handle }}</span>
      </div>

      <!-- Email (signup only) -->
      <div v-if="mode === 'signup'" class="email-form__field">
        <label class="email-form__label" for="auth-email">Email</label>
        <input
          id="auth-email"
          v-model.trim="form.email"
          type="email"
          class="email-form__input"
          :class="{ 'email-form__input--error': errors.email }"
          autocomplete="email"
          autocapitalize="none"
          :disabled="loading"
          required
        />
        <span v-if="errors.email" class="email-form__error-msg">{{ errors.email }}</span>
      </div>

      <!-- Password (always) -->
      <div class="email-form__field">
        <label class="email-form__label" for="auth-password">Password</label>
        <input
          id="auth-password"
          v-model="form.password"
          type="password"
          class="email-form__input"
          :class="{ 'email-form__input--error': errors.password }"
          :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
          :disabled="loading"
          required
        />
        <span v-if="errors.password" class="email-form__error-msg">{{ errors.password }}</span>
      </div>

      <!-- Server error alert -->
      <div v-if="serverError" class="email-form__alert" role="alert">
        <svg class="email-form__alert-icon" viewBox="0 0 18 18" aria-hidden="true">
          <circle cx="9" cy="9" r="7.5" fill="none" stroke="currentColor" stroke-width="1.5"/>
          <path d="M9 5 v4.5 M9 12.5 v0.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <span>{{ serverError }}</span>
      </div>

      <!-- Forgot password? — login mode only (Email Auth Phase 5) -->
      <button
        v-if="mode === 'login'"
        type="button"
        class="email-form__forgot-link"
        :disabled="loading"
        @click="$emit('forgot')"
      >
        Forgot password?
      </button>

      <button
        type="submit"
        class="email-form__submit"
        :class="{ 'email-form__submit--loading': loading }"
        :disabled="loading || !canSubmit"
      >
        <span v-if="!loading" class="email-form__submit-label">
          {{ mode === 'login' ? 'Sign in' : 'Sign up' }}
        </span>
        <span v-else class="email-form__submit-spinner" aria-label="Loading"></span>
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';

const props = defineProps({
  mode: {
    type: String,
    required: true,
    validator: (v) => ['login', 'signup'].includes(v),
  },
  loading: { type: Boolean, default: false },
  serverError: { type: String, default: '' },
});

// Email Auth Phase 5 — 'forgot' emit added for login mode "Forgot password?" link
const emit = defineEmits(['submit', 'back', 'forgot']);

const form = reactive({
  handle: '',
  email: '',
  password: '',
});

const errors = reactive({
  handle: '',
  email: '',
  password: '',
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const canSubmit = computed(() => {
  if (!form.handle || !form.password) return false;
  if (props.mode === 'signup' && !form.email) return false;
  return true;
});

function validate() {
  errors.handle = '';
  errors.email = '';
  errors.password = '';
  let valid = true;

  if (!form.handle) {
    errors.handle = 'required';
    valid = false;
  }

  if (props.mode === 'signup') {
    if (!form.email) {
      errors.email = 'required';
      valid = false;
    } else if (!EMAIL_RE.test(form.email)) {
      errors.email = 'invalid email';
      valid = false;
    }
  }

  if (!form.password) {
    errors.password = 'required';
    valid = false;
  } else if (props.mode === 'signup' && form.password.length < 8) {
    errors.password = 'min 8 chars';
    valid = false;
  }

  return valid;
}

function onSubmit() {
  if (!validate()) return;
  // Email Auth Phase 5 — email IS sent in signup payload (Phase 1-4 backend
  // chain now accepts {login, password, email?} on /v1/auth/register).
  emit('submit', {
    mode: props.mode,
    login: form.handle,
    password: form.password,
    ...(props.mode === 'signup' && form.email ? { email: form.email } : {}),
  });
}
</script>

<style scoped>
.email-form {
  position: relative;
  display: flex;
  flex-direction: column;
}

.email-form__back {
  position: absolute;
  top: -14px;
  left: -10px;
  min-height: 44px;
  min-width: 44px;
  padding: 12px 14px;
  background: transparent;
  border: none;
  color: var(--hex-text-muted);
  font-family: 'Anonymous', monospace;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  cursor: pointer;
  transition: color 0.15s ease;
  outline: none;
}

.email-form__back:hover {
  color: var(--hex-text-primary);
}

.email-form__back:focus-visible {
  color: var(--hex-primary);
  box-shadow: 0 0 0 2px var(--hex-primary-glow);
  border-radius: 2px;
}

.email-form__welcome {
  margin: 0 0 24px;
  text-align: center;
  font-family: inherit;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--hex-text-primary);
}

.email-form__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.email-form__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.email-form__label {
  font-family: 'Anonymous', monospace;
  font-size: 10px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--hex-text-muted);
}

.email-form__input {
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

.email-form__input::placeholder {
  color: var(--hex-text-muted);
}

.email-form__input:hover {
  border-color: var(--hex-border-strong);
}

.email-form__input:focus {
  border-color: var(--hex-primary);
  box-shadow: 0 0 0 3px var(--hex-primary-glow);
}

.email-form__input--error {
  border-color: var(--hex-danger);
  box-shadow: 0 0 0 3px rgba(255, 51, 51, 0.20);
}

.email-form__input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.email-form__error-msg {
  font-family: 'Anonymous', monospace;
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--hex-danger);
}

.email-form__alert {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(255, 51, 51, 0.10);
  border: 1px solid rgba(255, 51, 51, 0.35);
  border-radius: 4px;
  color: var(--hex-danger);
  font-size: 12px;
}

.email-form__alert-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.email-form__submit {
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

.email-form__submit:hover:not(:disabled) {
  filter: brightness(1.08);
}

.email-form__submit:active:not(:disabled) {
  transform: translateY(1px);
}

.email-form__submit:focus-visible {
  box-shadow: 0 0 0 5px var(--hex-primary-glow);
}

.email-form__submit:disabled {
  background: var(--hex-bg-light);
  color: var(--hex-text-muted);
  box-shadow: none;
  cursor: not-allowed;
}

.email-form__submit--loading {
  cursor: progress;
}

.email-form__submit-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: email-form-spin 0.6s linear infinite;
}

@keyframes email-form-spin {
  to { transform: rotate(360deg); }
}

/* Email Auth Phase 5 — Forgot password? link (login mode only) */
.email-form__forgot-link {
  align-self: flex-start;
  margin-top: 4px;
  padding: 8px 0;
  min-height: 44px;
  background: transparent;
  border: none;
  color: var(--hex-text-muted);
  font-family: 'Anonymous', monospace;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
  transition: color 0.15s ease;
  outline: none;
}

.email-form__forgot-link:hover:not(:disabled) {
  color: var(--hex-primary);
}

.email-form__forgot-link:focus-visible {
  color: var(--hex-primary);
  box-shadow: 0 0 0 2px var(--hex-primary-glow);
  border-radius: 2px;
}

.email-form__forgot-link:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
