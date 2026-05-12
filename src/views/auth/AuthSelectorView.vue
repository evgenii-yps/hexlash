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
        @forgot="onForgotClick"
      />

      <!-- Screen E: Forgot password (Email Auth Phase 5) -->
      <ForgotPasswordScreen
        v-else-if="screen === 'forgot'"
        ref="forgotScreenRef"
        :loading="loading"
        @submit="onForgotSubmit"
        @back="onBackFromForgot"
      />

      <!-- Screen F: Signup success ("Check your inbox") (Email Auth Phase 5.5) -->
      <SignupSuccessScreen
        v-else-if="screen === 'signup-success'"
        :email="signupSuccessEmail"
        @continue="onSignupSuccessContinue"
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
import { useStore } from 'vuex';
import { InfoMessageModel } from '@/core/models/internal/infoMessageModel.js';
import AuthTabs from '@/components/auth/AuthTabs.vue';
import ProviderSelector from '@/components/auth/ProviderSelector.vue';
import MoreOptions from '@/components/auth/MoreOptions.vue';
import EmailForm from '@/components/auth/EmailForm.vue';
import ReferralOverlay from '@/components/auth/ReferralOverlay.vue';
import ForgotPasswordScreen from '@/components/auth/ForgotPasswordScreen.vue';
import SignupSuccessScreen from '@/components/auth/SignupSuccessScreen.vue';

// Phase 3: Vuex integration — provider toasts, email submit (login/register),
// referral localStorage write. Email field still UI-only (BE doesn't accept yet —
// see TODO in EmailForm.vue). Referral overwrite is intentional per TZ.

const route = useRoute();
const router = useRouter();
const store = useStore();

const PROVIDER_LABELS = {
  google: 'Google',
  x: 'X',
  web3: 'Web3 wallet',
  farcaster: 'Farcaster',
  discord: 'Discord',
};

function showComingSoon(provider) {
  const label = PROVIDER_LABELS[provider] || provider;
  const msg = InfoMessageModel.withoutButton(`${label} login is coming soon.`, 4000);
  store.commit('master/setInfoMessage', msg);
}

// Initial mode derived from current path. /auth/login → 'login', /auth/signup → 'signup'.
const screen = ref('provider'); // 'provider' | 'more' | 'email' | 'forgot' | 'signup-success'
// Email Auth Phase 5 — ref to ForgotPasswordScreen для calling showSuccess() post-dispatch
const forgotScreenRef = ref(null);
// Email Auth Phase 5.5 — captured email для display on signup-success screen
const signupSuccessEmail = ref('');
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
  // 'google' | 'x' | 'web3' — backend pending, show "coming soon" toast.
  showComingSoon(provider);
}

function onMoreSelect(provider) {
  if (provider === 'email') {
    screen.value = 'email';
    serverError.value = ''; // fresh form
    return;
  }
  // 'farcaster' | 'discord' — backend pending, show "coming soon" toast.
  showComingSoon(provider);
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

function onReferralApply(code) {
  // Overwrite intentional — manual entry in overlay supersedes any pre-existing
  // value from /r/:username redirect (router.js:64). masterService.register
  // (line 146) reads this key automatically and clears it after successful register.
  if (code) {
    localStorage.setItem('hexlash_referral_code', code);
  }
  referralOpen.value = false;
}

async function onEmailSubmit(payload) {
  loading.value = true;
  serverError.value = '';
  try {
    if (payload.mode === 'login') {
      // master/login does NOT throw on failure — sets state.loginState.authError
      // via setLoginState mutation (masterState.js:124). Read after await.
      // On success, action calls router.push('/') itself.
      await store.dispatch('master/login', {
        login: payload.login,
        password: payload.password,
      });
      const authError = store.getters['master/getLoginState']?.authError;
      if (authError) {
        serverError.value = authError;
      }
    } else {
      // master/register THROWS on failure (masterState.js:152). Catch below.
      // Email Auth Phase 5.5 — when email provided, suppress auto-redirect
      // via skipRedirect flag и show "Check your inbox" success screen instead.
      // When NO email, default flow (register → router.push('/') в action).
      const hasEmail = !!payload.email;
      await store.dispatch('master/register', {
        login: payload.login,
        password: payload.password,
        ...(hasEmail ? { email: payload.email, skipRedirect: true } : {}),
      });
      if (hasEmail) {
        signupSuccessEmail.value = payload.email;
        screen.value = 'signup-success';
      }
      // else: action already pushed к '/'
    }
  } catch (e) {
    serverError.value = e?.message || 'Something went wrong. Please try again.';
  } finally {
    loading.value = false;
  }
}

// ── Email Auth Phase 5 — Forgot password flow ─────────────────────────────

function onForgotClick() {
  // Click "Forgot password?" link in EmailForm (login mode) → switch screen
  screen.value = 'forgot';
  serverError.value = '';
}

function onBackFromForgot() {
  // Back from forgot screen → return к email screen (login form)
  screen.value = 'email';
  serverError.value = '';
}

// Email Auth Phase 5.5 — Continue button on signup-success screen
function onSignupSuccessContinue() {
  // User is already authenticated (register completed with skipRedirect=true).
  // Route к /play (hub). beforeEnter on '/' would cascade authed users к /play
  // anyway, but direct push avoids redundant hop.
  router.push('/play');
}

async function onForgotSubmit(payload) {
  loading.value = true;
  try {
    // master/requestPasswordReset always resolves к { ok: boolean } —
    // backend returns 200 generic regardless of email existence/verified
    // state. forgotScreenRef.value.showSuccess() flips screen к "Check
    // your inbox" message либо on ok=true либо on ok=false (both display
    // same generic message to caller — only 400 format error is distinct,
    // surfaced via masterService.forgotPassword returning {ok:false}).
    const result = await store.dispatch('master/requestPasswordReset', payload.email);
    if (result.ok) {
      // Flip к success state in child component
      forgotScreenRef.value?.showSuccess();
    } else {
      // Format error — surface to user via toast
      store.commit('master/setInfoMessage', InfoMessageModel.withoutButton(
        result.error || 'Invalid email format',
        4000
      ));
    }
  } catch (e) {
    // Should not happen — action handles errors internally, but defensive
    console.error('Forgot password unexpected error:', e);
    store.commit('master/setInfoMessage', InfoMessageModel.withoutButton(
      'Something went wrong. Please try again.',
      4000
    ));
  } finally {
    loading.value = false;
  }
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
