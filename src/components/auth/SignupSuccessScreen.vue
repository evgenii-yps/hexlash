<template>
  <div class="signup-success">
    <h2 class="signup-success__welcome">CHECK YOUR INBOX</h2>

    <p class="signup-success__hint">
      We've sent a verification link to
      <strong class="signup-success__email">{{ email }}</strong>
    </p>

    <p class="signup-success__sub">
      Click the link in the email к verify your account. You can also explore Hexlash now —
      verifying enables password recovery and notifications.
    </p>

    <button
      type="button"
      class="signup-success__submit"
      @click="$emit('continue')"
    >
      Continue к Hexlash
    </button>

    <button
      type="button"
      class="signup-success__resend"
      :disabled="resending"
      @click="onResend"
    >
      {{ resending ? 'Sending...' : 'Resend email' }}
    </button>

    <p v-if="resendStatus" class="signup-success__status" role="status">
      {{ resendStatus }}
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useStore } from 'vuex';

const props = defineProps({
  email: { type: String, required: true },
});

defineEmits(['continue']);

const store = useStore();
const resending = ref(false);
const resendStatus = ref('');

async function onResend() {
  if (resending.value) return;
  resending.value = true;
  resendStatus.value = '';
  try {
    const result = await store.dispatch('master/resendVerification');
    if (result.ok) {
      resendStatus.value = 'Verification email sent — check your inbox.';
    } else {
      resendStatus.value = result.error || 'Could not resend. Please try again later.';
    }
  } catch (e) {
    resendStatus.value = 'Could not resend. Please try again later.';
  } finally {
    resending.value = false;
  }
}
</script>

<style scoped>
.signup-success {
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.signup-success__welcome {
  margin: 0 0 20px;
  text-align: center;
  font-family: inherit;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--ink);
}

.signup-success__hint {
  margin: 0 0 16px;
  text-align: center;
  font-size: 14px;
  line-height: 1.5;
  color: var(--ink-dim);
}

.signup-success__email {
  display: inline-block;
  margin-top: 4px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
  letter-spacing: 0.04em;
  color: var(--pink);
  word-break: break-all;
}

.signup-success__sub {
  margin: 0 0 24px;
  text-align: center;
  font-size: 13px;
  line-height: 1.5;
  color: var(--ink-off);
}

.signup-success__submit {
  margin: 0 0 12px;
  padding: 14px;
  min-height: 48px;
  background: var(--pink);
  color: #fff;
  border: none;
  border-radius: 4px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: filter 0.15s ease, transform 0.08s ease, box-shadow 0.15s ease;
  box-shadow: 0 4px 12px rgba(255, 0, 105, 0.25);
  outline: none;
}

.signup-success__submit:hover { filter: brightness(1.08); }
.signup-success__submit:active { transform: translateY(1px); }
.signup-success__submit:focus-visible { box-shadow: 0 0 0 5px color-mix(in srgb, var(--pink) 50%, transparent); }

.signup-success__resend {
  padding: 10px 14px;
  min-height: 44px;
  background: transparent;
  color: var(--ink-dim);
  border: 1px solid var(--line);
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

.signup-success__resend:hover:not(:disabled) {
  border-color: var(--pink);
  color: var(--pink);
}

.signup-success__resend:focus-visible {
  border-color: var(--pink);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--pink) 50%, transparent);
}

.signup-success__resend:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.signup-success__status {
  margin: 12px 0 0;
  padding: 8px 12px;
  text-align: center;
  font-size: 12px;
  color: var(--ink-dim);
  background: rgba(255, 255, 255, 0.04);
  border-radius: 4px;
}
</style>
