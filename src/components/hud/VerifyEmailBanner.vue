<!-- Sub-Epic 5F Step 2 — VerifyEmailBanner.
     Top-fixed banner shown when user.userData.emailVerified is falsy.
     Mounted globally in AppV2.vue so it persists across all /v2/* routes.
     CSS body added in Step 3 (src/styles/v24/verify.css or co-located).

     Vuex field name: `emailVerified` (NOT `verified`). Set by
     master/sendVerifyEmail action via commit('updateMaster',
     { emailVerified: true }) on successful code submission.

     Verify Now button → router.push('/verify-email') (legacy view that
     accepts the verification code from the email link). 5F decision Q3:
     no separate "resend" backend endpoint exists; sending user to the
     existing verify flow is the minimal additive functional change. -->
<template>
  <Transition name="verify-slide">
    <div v-if="visible" class="verify-banner show">
      <div class="vb-text">
        <strong>Verify your email</strong> to unlock Clans, Ratings, and on-chain features.
      </div>
      <button class="vb-btn" :disabled="resending" @click="onVerifyNow">
        {{ resending ? 'Sending...' : 'Resend verification' }}
      </button>
      <button class="vb-dismiss" title="Dismiss" @click="onDismiss">×</button>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { InfoMessageModel } from '@/core/models/internal/infoMessageModel.js';

const store = useStore();
const router = useRouter();
const dismissed = ref(false);

// Email Auth Phase 5 — banner condition now requires email !== null.
// Wallet-only users (email=null) won't see this banner — they have no
// email to verify in the first place.
const userEmail = computed(() => store.state.master?.userData?.email || null);
const emailVerified = computed(() => !!store.state.master?.userData?.emailVerified);
const userLogin = computed(() => store.state.master?.userData?.login || 'guest');
const visible = computed(() =>
  userEmail.value !== null && !emailVerified.value && !dismissed.value
);
const resending = ref(false);

// Sub-Epic 5L Phase 1 — per-user dismiss persistence via localStorage.
// Key scoped to login so different accounts on same device don't leak state.
function storageKey(login) {
  return `hexlash_verify_banner_dismissed_${login}`;
}

function loadDismissedState(login) {
  try {
    return localStorage.getItem(storageKey(login)) === 'true';
  } catch (e) {
    return false;
  }
}

// Email Auth Phase 5 — rewire from router.push('/verify-email') (which
// expected user to have already clicked verify link from email) к direct
// dispatch resendVerification action. Triggers backend POST к
// /v1/user/resend-verification — sends fresh verify email.
async function onVerifyNow() {
  if (resending.value) return;
  resending.value = true;
  try {
    const result = await store.dispatch('master/resendVerification');
    if (result.ok) {
      store.commit('master/setInfoMessage', InfoMessageModel.withoutButton(
        'Verification email sent — check your inbox',
        4000
      ));
    }
    // Failure case: action sets ErrorMessageModel internally (visible via
    // global Error.vue toast on /play/*) — no further handling needed here
  } finally {
    resending.value = false;
  }
}

function onDismiss() {
  dismissed.value = true;
  try {
    localStorage.setItem(storageKey(userLogin.value), 'true');
  } catch (e) {
    // localStorage unavailable (private mode etc) — degrade to session-scoped
  }
}

// Push HUD top-bar down via body class (per prototype 3444 push-down rule —
// CSS port lands in Step 3). Sync on mount + reactive on visibility flip.
function syncBodyClass() {
  if (visible.value) document.body.classList.add('verify-shown');
  else document.body.classList.remove('verify-shown');
}

onMounted(() => {
  dismissed.value = loadDismissedState(userLogin.value);
  syncBodyClass();
});
onBeforeUnmount(() => {
  document.body.classList.remove('verify-shown');
});
watch(visible, syncBodyClass);

// Re-init dismissed state when login changes (logout/login flow).
watch(userLogin, (login) => {
  dismissed.value = loadDismissedState(login);
});
</script>

<style scoped>
/* Visual styles in shop sub-epic style: ported in Step 3 (verify.css).
   Vue Transition keeps slide animation local to component lifecycle. */
.verify-slide-enter-active,
.verify-slide-leave-active {
  transition: transform 0.4s ease;
}
.verify-slide-enter-from,
.verify-slide-leave-to {
  transform: translateY(-100%);
}
</style>
