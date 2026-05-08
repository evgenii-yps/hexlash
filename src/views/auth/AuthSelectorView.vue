<template>
  <div class="auth-selector-wrap">
    <div class="auth-selector-card">
      <!-- Decorative corner-marks (desktop only) -->
      <span class="auth-corner auth-corner--tl" aria-hidden="true"></span>
      <span class="auth-corner auth-corner--tr" aria-hidden="true"></span>
      <span class="auth-corner auth-corner--bl" aria-hidden="true"></span>
      <span class="auth-corner auth-corner--br" aria-hidden="true"></span>

      <AuthTabs :mode="mode" @change="onTabChange" />

      <!-- Screen A: Provider selector -->
      <ProviderSelector
        v-if="screen === 'provider'"
        @select="onProviderSelect"
        @referral="onReferralOpen"
      />

      <!-- Screen B: More options -->
      <MoreOptions
        v-else-if="screen === 'more'"
        @select="onMoreSelect"
        @back="onBackToProviders"
      />

      <!-- Screen D: Email form -->
      <EmailForm
        v-else-if="screen === 'email'"
        :mode="mode"
        :loading="loading"
        :server-error="serverError"
        @submit="onEmailSubmit"
        @back="onBackToMore"
      />
    </div>

    <!-- Screen C: Referral overlay (Teleport-to-body) -->
    <ReferralOverlay
      v-if="referralOpen"
      @apply="onReferralApply"
      @close="onReferralClose"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AuthTabs from '@/components/auth/AuthTabs.vue';
import ProviderSelector from '@/components/auth/ProviderSelector.vue';
import MoreOptions from '@/components/auth/MoreOptions.vue';
import EmailForm from '@/components/auth/EmailForm.vue';
import ReferralOverlay from '@/components/auth/ReferralOverlay.vue';

// Phase 2: state machine wired (screen transitions + mode-from-route + router.replace).
// Phase 3 will wire Vuex submits, toasts, localStorage referral.

const route = useRoute();
const router = useRouter();

// Initial mode derived from current path. /auth/login → 'login', /auth/signup → 'signup'.
const screen = ref('provider'); // 'provider' | 'more' | 'email'
const mode = ref(route.path === '/auth/signup' ? 'signup' : 'login');
const referralOpen = ref(false);
const loading = ref(false);
const serverError = ref('');

// Watch route → keep mode in sync. Handles browser back/forward + manual URL paste
// + redirect from /auth (bare) → /auth/login. Guard prevents infinite loop with onTabChange.
watch(() => route.path, (newPath) => {
  const targetMode = newPath === '/auth/signup' ? 'signup' : 'login';
  if (targetMode !== mode.value) {
    mode.value = targetMode;
  }
  // Note: screen state preserved across mode change (per TZ §3).
});

// --- handlers ---

function onTabChange(newMode) {
  if (newMode === mode.value) return; // no-op guard
  mode.value = newMode;
  router.replace(newMode === 'login' ? '/auth/login' : '/auth/signup');
  // serverError clears when switching modes — stale errors from old mode shouldn't bleed.
  serverError.value = '';
}

function onProviderSelect(provider) {
  if (provider === 'more') {
    screen.value = 'more';
    return;
  }
  // 'google' | 'x' | 'web3' — Phase 3 will emit "coming soon" toast.
}

function onMoreSelect(provider) {
  if (provider === 'email') {
    screen.value = 'email';
    serverError.value = ''; // fresh form
    return;
  }
  // 'farcaster' | 'discord' — Phase 3 will emit "coming soon" toast.
}

function onBackToProviders() {
  screen.value = 'provider';
}

function onBackToMore() {
  screen.value = 'more';
  serverError.value = ''; // clear form-level error on back
}

function onReferralOpen() {
  referralOpen.value = true;
}

function onReferralClose() {
  referralOpen.value = false;
}

function onReferralApply(_code) {
  // Phase 3: localStorage.setItem('hexlash_referral_code', _code) + close.
  // Phase 2 stub: just close so UX flows.
  referralOpen.value = false;
}

function onEmailSubmit(_payload) {
  // Phase 3: dispatch master/login or master/register.
}
</script>

<style scoped>
.auth-selector-wrap {
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 16px 0;
}

.auth-selector-card {
  position: relative;
  width: 100%;
  max-width: 420px;
  padding: 32px 28px 28px;
  background: var(--hex-bg-card);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid var(--hex-border-default);
  border-radius: 8px;
}

/* Corner-marks: 4 line "brackets" 14×14, 1px stroke, opacity 0.7, desktop only */
.auth-corner {
  position: absolute;
  width: 14px;
  height: 14px;
  border-color: var(--hex-border-strong);
  opacity: 0.7;
  pointer-events: none;
}

.auth-corner--tl {
  top: -1px;
  left: -1px;
  border-top: 1px solid;
  border-left: 1px solid;
}

.auth-corner--tr {
  top: -1px;
  right: -1px;
  border-top: 1px solid;
  border-right: 1px solid;
}

.auth-corner--bl {
  bottom: -1px;
  left: -1px;
  border-bottom: 1px solid;
  border-left: 1px solid;
}

.auth-corner--br {
  bottom: -1px;
  right: -1px;
  border-bottom: 1px solid;
  border-right: 1px solid;
}

@media (max-width: 480px) {
  .auth-selector-card {
    padding: 22px 18px 18px;
    border-radius: 6px;
  }
  .auth-corner {
    display: none;
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .auth-selector-wrap {
    padding: 16px;
  }
}
</style>
