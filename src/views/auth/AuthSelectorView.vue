<template>
  <!-- Hexlash auth screen — single screen, login + signup together (no tabs).
       Ported from hexlash_auth_handoff/auth_screen.jsx. One pink accent
       (#FF0069, prod canon) reserved for field focus + the ready Submit.
       Provider buttons stay neutral. Email keeps the working password login
       (magic-link / Privy = Этап 2 — see report). -->
  <div class="hx-stage">
    <!-- Same background as the landing (pattern + mouse-reaction + ambient glow).
         Accent = #FF0069 (255,0,105) to keep the auth screen internally consistent. -->
    <LandingBackground :accent="[255, 0, 105]" />

    <!-- Global exit → landing. Always present, independent of the in-card
         step "‹ Back" (.hx-back) which only navigates stages within the card. -->
    <router-link to="/" class="hx-exit" aria-label="Back to home">
      <IconChevron :s="13" dir="left" /> Back
    </router-link>

    <div class="hx-wrap">
      <div class="hx-col">
        <!-- Brand mark above the card — the arrangement AuthLayoutView's header
             comment already reserves ("logo-above-card"). Слова здесь нет
             сознательно: на этом экране бренд несёт один знак. Доступное имя
             ссылки держит aria-label — знак декоративный (alt="", aria-hidden). -->
        <router-link to="/" class="hx-lock" aria-label="Hexlash home">
          <HexlashMark :size="88" class="hx-mark" />
        </router-link>

        <div class="hx-card" :class="{ 'has-back': showBack }">
          <button v-if="showBack" type="button" class="hx-back" @click="onBack">
            <IconChevron :s="13" dir="left" /> Back
          </button>

          <!-- Generic header for the handoff stages (provider / more / email) -->
          <div v-if="isPrimaryStage" class="hx-head">
            <div class="hx-title">WELCOME</div>
            <div class="hx-sub">{{ subtitle }}</div>
          </div>

          <!-- Stage: provider selector (default) -->
          <div v-if="screen === 'provider'" class="hx-list">
            <button type="button" class="hx-btn" @click="onProviderSelect('google')">
              <span class="hx-ic"><IconGoogle :s="18" /></span><span class="hx-lbl">Google</span>
            </button>
            <button type="button" class="hx-btn" @click="onProviderSelect('x')">
              <span class="hx-ic"><IconX :s="16" /></span><span class="hx-lbl">X</span>
            </button>
            <button type="button" class="hx-btn" @click="onProviderSelect('web3')">
              <span class="hx-ic"><IconWallet :s="19" /></span><span class="hx-lbl">Web3 Wallet</span>
            </button>
            <button type="button" class="hx-btn" @click="onProviderSelect('more')">
              <span class="hx-ic"><IconUser :s="18" /></span>
              <span class="hx-lbl">More Options</span>
              <span class="hx-chev"><IconChevron :s="15" /></span>
            </button>
          </div>

          <!-- Stage: more options -->
          <div v-else-if="screen === 'more'" class="hx-list">
            <button type="button" class="hx-btn" @click="onMoreSelect('email')">
              <span class="hx-ic"><IconMail :s="19" /></span><span class="hx-lbl">Email</span>
            </button>
            <button type="button" class="hx-btn" @click="onMoreSelect('farcaster')">
              <span class="hx-ic"><IconFarcaster :s="18" /></span><span class="hx-lbl">Farcaster</span>
            </button>
            <button type="button" class="hx-btn" @click="onMoreSelect('discord')">
              <span class="hx-ic"><IconDiscord :s="19" /></span><span class="hx-lbl">Discord</span>
            </button>
          </div>

          <!-- Stage: email — retains the working handle/password login, restyled. -->
          <form v-else-if="screen === 'email'" class="hx-form" novalidate @submit.prevent="onFormSubmit">
            <div class="hx-fieldrow" :class="{ 'is-error': errors.handle }">
              <span class="hx-mic"><IconMail :s="18" /></span>
              <input
                ref="handleRef"
                v-model.trim="form.handle"
                class="hx-input"
                type="text"
                :placeholder="mode === 'login' ? 'Email or username' : 'Username'"
                autocomplete="username"
                autocapitalize="none"
                spellcheck="false"
                :disabled="loading"
              />
            </div>

            <div v-if="mode === 'signup'" class="hx-fieldrow" :class="{ 'is-error': errors.email }">
              <span class="hx-mic"><IconMail :s="18" /></span>
              <input
                v-model.trim="form.email"
                class="hx-input"
                type="email"
                placeholder="your@email.com"
                autocomplete="email"
                autocapitalize="none"
                spellcheck="false"
                :disabled="loading"
              />
            </div>

            <div class="hx-fieldrow" :class="{ 'is-error': errors.password }">
              <span class="hx-mic"><IconLock :s="18" /></span>
              <input
                v-model="form.password"
                class="hx-input"
                type="password"
                placeholder="Password"
                :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
                :disabled="loading"
              />
            </div>

            <div v-if="firstError" class="hx-errline">
              <IconAlert :s="13" /> {{ firstError }}
            </div>
            <div v-else-if="serverError" class="hx-errline">
              <IconAlert :s="13" /> {{ serverError }}
            </div>

            <button
              v-if="mode === 'login'"
              type="button"
              class="hx-forgot"
              :disabled="loading"
              @click="onForgotClick"
            >
              Forgot password?
            </button>

            <button
              type="submit"
              class="hx-submit-full"
              :class="{ 'is-ready': canSubmit }"
              :disabled="loading"
            >
              <span v-if="!loading">{{ mode === 'login' ? 'Sign In' : 'Sign Up' }}</span>
              <span v-else class="hx-spinner" aria-label="Loading"></span>
            </button>

            <div class="hx-fine">
              By continuing you agree to our
              <router-link to="/rules">Terms</router-link> &amp;
              <router-link to="/privacy">Privacy Policy</router-link>.
            </div>
          </form>

          <!-- Prod-only sub-flows (beyond the handoff states) keep their existing
               components + behaviour. Этап 1 boundary — see report. -->
          <ForgotPasswordScreen
            v-else-if="screen === 'forgot'"
            ref="forgotScreenRef"
            :loading="loading"
            @submit="onForgotSubmit"
            @back="onBackFromForgot"
          />

          <SignupSuccessScreen
            v-else-if="screen === 'signup-success'"
            :email="signupSuccessEmail"
            @continue="onSignupSuccessContinue"
          />
        </div>

        <template v-if="isPrimaryStage">
          <button type="button" class="hx-referral" @click="onReferralOpen">
            <span class="hx-ic"><IconTicket :s="15" /></span> I have a referral code
          </button>

          <div class="hx-guest">
            <button type="button" @click="onGuestStart">Play as Guest</button>
          </div>
        </template>
      </div>
    </div>

    <footer class="hx-foot">
      <div class="hx-foot-l">
        <router-link to="/privacy">Privacy Policy</router-link>
        <router-link to="/rules">Terms of Use</router-link>
      </div>
      <div class="hx-foot-r">
        <button type="button" class="hx-soc" aria-label="X" @click="showComingSoon('x')"><IconX :s="14" /></button>
        <button type="button" class="hx-soc" aria-label="Discord" @click="showComingSoon('discord')"><IconDiscord :s="16" /></button>
      </div>
    </footer>

    <!-- Referral overlay (Teleport-to-body) — unchanged functional flow. -->
    <ReferralOverlay
      v-if="referralOpen"
      @apply="onReferralApply"
      @close="onReferralClose"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { InfoMessageModel } from '@/core/models/internal/infoMessageModel.js';
import LandingBackground from '@/components/landing/LandingBackground.vue';
import ReferralOverlay from '@/components/auth/ReferralOverlay.vue';
import ForgotPasswordScreen from '@/components/auth/ForgotPasswordScreen.vue';
import SignupSuccessScreen from '@/components/auth/SignupSuccessScreen.vue';
import {
  IconGoogle, IconX, IconWallet, IconFarcaster, IconDiscord,
  IconMail, IconChevron, IconTicket, IconUser, IconLock, IconAlert,
} from '@/components/auth/authIcons.js';
import { t } from '@/locales/index.js';
import { HexlashMark } from '@/components/brand/hexlashMark.js';

const route = useRoute();
const router = useRouter();
const store = useStore();

const PROVIDER_LABELS = {
  google: 'Google', x: 'X', web3: 'Web3 wallet', farcaster: 'Farcaster', discord: 'Discord',
};
function showComingSoon(provider) {
  const label = PROVIDER_LABELS[provider] || provider;
  store.commit('master/setInfoMessage', InfoMessageModel.withoutButton(`${label} login is coming soon.`, 4000));
}

// 'provider' | 'more' | 'email' | 'forgot' | 'signup-success'
const screen = ref('provider');
const forgotScreenRef = ref(null);
const signupSuccessEmail = ref('');
const mode = ref(route.path === '/auth/signup' ? 'signup' : 'login');
const referralOpen = ref(false);
const loading = ref(false);
const serverError = ref('');

const isPrimaryStage = computed(() => ['provider', 'more', 'email'].includes(screen.value));
const showBack = computed(() => screen.value === 'more' || screen.value === 'email');
const subtitle = computed(() => {
  if (screen.value !== 'email') return 'SELECT YOUR PREFERRED LOGIN OPTION';
  return mode.value === 'login' ? 'SIGN IN TO CONTINUE' : 'CREATE YOUR ACCOUNT';
});

// keep mode synced to route (browser back/forward, manual paste, /auth redirect)
watch(() => route.path, (newPath) => {
  const targetMode = newPath === '/auth/signup' ? 'signup' : 'login';
  if (targetMode !== mode.value) mode.value = targetMode;
});

// ── Email form (retains the working username/password login) ────────────────
const handleRef = ref(null);
const form = reactive({ handle: '', email: '', password: '' });
const errors = reactive({ handle: '', email: '', password: '' });
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const canSubmit = computed(() => {
  if (!form.handle || !form.password) return false;
  if (mode.value === 'signup' && !form.email) return false;
  return true;
});
const firstError = computed(() => errors.handle || errors.email || errors.password || '');

function clearErrors() { errors.handle = ''; errors.email = ''; errors.password = ''; }

function validate() {
  clearErrors();
  let valid = true;
  if (!form.handle) { errors.handle = 'Enter your username'; valid = false; }
  if (mode.value === 'signup') {
    if (!form.email) { errors.email = 'Enter your email'; valid = false; }
    else if (!EMAIL_RE.test(form.email)) { errors.email = 'Enter a valid email address'; valid = false; }
  }
  if (!form.password) { errors.password = 'Enter your password'; valid = false; }
  else if (mode.value === 'signup' && form.password.length < 8) { errors.password = 'Password must be at least 8 characters'; valid = false; }
  return valid;
}

// --- stage navigation ---
function onProviderSelect(provider) {
  if (provider === 'more') { screen.value = 'more'; return; }
  showComingSoon(provider); // google | x | web3 — backend pending
}
function onMoreSelect(provider) {
  if (provider === 'email') {
    screen.value = 'email';
    serverError.value = '';
    clearErrors();
    nextTick(() => handleRef.value && handleRef.value.focus());
    return;
  }
  showComingSoon(provider); // farcaster | discord — backend pending
}
function onBack() {
  if (screen.value === 'email') { screen.value = 'more'; serverError.value = ''; clearErrors(); }
  else { screen.value = 'provider'; }
}
function onBackToProviders() { screen.value = 'provider'; }

// ── Guest mode ──────────────────────────────────────────────────────────────
// Guest archetype/PvE machinery removed in the game-cleanup reset. The
// "Play as Guest" button enters the player home (no session created).
function onGuestStart() { router.push('/play/home'); }

// ── Referral ─────────────────────────────────────────────────────────────────
function onReferralOpen() { referralOpen.value = true; }
function onReferralClose() { referralOpen.value = false; }
function onReferralApply(code) {
  if (code) {
    localStorage.setItem('hexlash_referral_code', code);
    store.commit('master/setInfoMessage', InfoMessageModel.withoutButton(t.value.referral.lblCodeApplied, 4000));
  }
  referralOpen.value = false;
}

// ── Email submit (unchanged auth logic — login / register) ───────────────────
function onFormSubmit() {
  if (!validate()) return;
  onEmailSubmit({
    mode: mode.value,
    login: form.handle,
    password: form.password,
    ...(mode.value === 'signup' && form.email ? { email: form.email } : {}),
  });
}

async function onEmailSubmit(payload) {
  loading.value = true;
  serverError.value = '';
  try {
    if (payload.mode === 'login') {
      await store.dispatch('master/login', { login: payload.login, password: payload.password });
      const authError = store.getters['master/getLoginState']?.authError;
      if (authError) serverError.value = authError;
    } else {
      const hasEmail = !!payload.email;
      await store.dispatch('master/register', {
        login: payload.login,
        password: payload.password,
        ...(hasEmail ? { email: payload.email, skipRedirect: true } : {}),
      });
      if (hasEmail) { signupSuccessEmail.value = payload.email; screen.value = 'signup-success'; }
    }
  } catch (e) {
    serverError.value = e?.message || 'Something went wrong. Please try again.';
  } finally {
    loading.value = false;
  }
}

// ── Forgot password (Email Auth Phase 5 flow — unchanged) ────────────────────
function onForgotClick() { screen.value = 'forgot'; serverError.value = ''; }
function onBackFromForgot() { screen.value = 'email'; serverError.value = ''; }
function onSignupSuccessContinue() { router.push('/play/home'); }

async function onForgotSubmit(payload) {
  loading.value = true;
  try {
    const result = await store.dispatch('master/requestPasswordReset', payload.email);
    if (result.ok) {
      forgotScreenRef.value?.showSuccess();
    } else {
      store.commit('master/setInfoMessage', InfoMessageModel.withoutButton(result.error || 'Invalid email format', 4000));
    }
  } catch (e) {
    console.error('Forgot password unexpected error:', e);
    store.commit('master/setInfoMessage', InfoMessageModel.withoutButton('Something went wrong. Please try again.', 4000));
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
/* Tokens from the design handoff (auth_screen.jsx). Accent recoloured to the
   prod canon var(--pink) (rgb 255,0,105). Scoped to this component — no --hex-*. */
.hx-stage {
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  overflow: hidden;
  font-family: var(--font-mono);
  color: var(--ink);
  /* Локальная копия палитры убрана — значения приходят из tokens.css.
     Здесь были: своя пара шрифтов с другими запасными, свой --pink-rgb и
     алиас --bg, а карточка и поле ввода имели два почти одинаковых фона
     (.022 и .030), которые после сведения к --fill-1 продублировали
     объявление. Разница в две единицы яркости на почти чёрном не читалась. */
  /* Plain base; LandingBackground (fixed, z-index 0) paints the real backdrop. */
  background: var(--void);
}

/* Global exit → landing (top-left, calm/monochrome, never pink). */
.hx-exit {
  position: absolute;
  top: 18px;
  left: 24px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--ink-dim);
  text-decoration: none;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: .18em;
  text-transform: uppercase;
  padding: 6px 8px;
  border-radius: 6px;
  transition: color .18s;
}
.hx-exit:hover { color: var(--ink); }

.hx-wrap {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px 110px;
}

.hx-col { display: flex; flex-direction: column; align-items: stretch; width: 372px; max-width: 100%; }

/* Знак над карточкой — без слова. Бокс 88px: выше порога 48, значит ПОЛНАЯ
   отрисовка. 88 вместо прежних 64 — решение владельца по снимкам: без слова
   блок терял вес. Отступ до карточки держит сам .hx-lock (26px); собственного
   нижнего отступа у знака нет — прежние 33px были зазором до слова. */
.hx-lock { --mark: 88px;
  display: flex; flex-direction: column; align-items: center;
  margin-bottom: 26px; text-decoration: none; }
.hx-mark { width: var(--mark); height: var(--mark); display: block; }

.hx-card {
  background: var(--fill-1);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 34px 30px 30px;
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  position: relative;
}
.hx-card.has-back { padding-top: 50px; }

.hx-back {
  position: absolute; top: 18px; left: 16px;
  display: inline-flex; align-items: center; gap: 5px;
  background: none; border: 0; cursor: pointer; color: var(--ink-dim);
  font-family: var(--font-mono); font-size: 11px; letter-spacing: .18em; text-transform: uppercase;
  padding: 6px 8px; border-radius: 6px; transition: color .18s;
}
.hx-back:hover { color: var(--ink); }

.hx-head { text-align: center; margin-bottom: 24px; }
.hx-title { font-family: var(--font-display); font-weight: 800; text-transform: uppercase; font-size: 34px; line-height: .92; letter-spacing: .02em; }
.hx-sub { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .24em; text-transform: uppercase; color: var(--ink-dim); margin-top: 9px; }

.hx-list { display: flex; flex-direction: column; gap: 11px; }
.hx-btn {
  display: flex; align-items: center; gap: 13px; width: 100%; height: 52px; padding: 0 16px;
  background: var(--fill-1); border: 1px solid var(--line); border-radius: 10px; color: var(--ink); cursor: pointer;
  font-family: var(--font-mono); font-size: 12.5px; font-weight: 500; letter-spacing: .16em; text-transform: uppercase;
  transition: border-color .18s, background .18s, transform .12s;
}
.hx-btn .hx-ic { display: flex; color: var(--ink-soft); flex: 0 0 auto; }
.hx-btn .hx-lbl { flex: 1 1 auto; text-align: left; }
.hx-btn .hx-chev { color: var(--ink-dim); display: flex; }
.hx-btn:hover { border-color: var(--line-strong); background: var(--fill-2); }
.hx-btn:active { transform: translateY(1px); }

/* email form — stacked field rows + full-width submit */
.hx-form { display: flex; flex-direction: column; gap: 11px; }
.hx-fieldrow {
  display: flex; align-items: center; gap: 11px; height: 52px; padding: 0 15px;
  background: var(--fill-1); border: 1px solid var(--line); border-radius: 11px;
  transition: border-color .2s, box-shadow .25s, background .2s;
}
.hx-fieldrow .hx-mic { color: var(--ink-dim); display: flex; flex: 0 0 auto; }
.hx-input {
  flex: 1 1 auto; min-width: 0; background: none; border: 0; outline: 0; color: var(--ink);
  font-family: var(--font-mono); font-size: 13.5px; letter-spacing: .02em; caret-color: var(--pink);
}
.hx-input::placeholder { color: var(--ink-off); letter-spacing: .02em; }
.hx-fieldrow:focus-within {
  border-color: var(--pink);
  box-shadow: 0 0 0 1px rgba(var(--pink-rgb), .55), 0 0 26px -2px rgba(var(--pink-rgb), .5);
  background: var(--fill-2);
}
.hx-fieldrow.is-error { border-color: var(--danger); box-shadow: none; }

.hx-errline {
  display: flex; align-items: center; gap: 7px; margin-top: 3px;
  font-family: var(--font-mono); font-size: 11px; letter-spacing: .04em; color: var(--danger);
}

.hx-forgot {
  align-self: center; margin-top: 2px; background: none; border: 0; cursor: pointer; color: var(--pink);
  font-family: var(--font-mono); font-size: 11px; letter-spacing: .04em;
  text-decoration: underline; text-underline-offset: 3px; padding: 4px 6px; transition: filter .18s;
}
.hx-forgot:hover:not(:disabled) { filter: brightness(1.15); }
.hx-forgot:disabled { opacity: .5; cursor: not-allowed; }

.hx-submit-full {
  margin-top: 3px; height: var(--h-btn-md); border: 0; border-radius: 9px; cursor: pointer;
  font-family: var(--font-mono); font-weight: 700; font-size: 12px; letter-spacing: .16em; text-transform: uppercase;
  background: var(--fill-2); color: var(--ink-dim);
  display: inline-flex; align-items: center; justify-content: center;
  transition: background .2s, color .2s, box-shadow .2s, filter .15s;
}
.hx-submit-full.is-ready { background: var(--pink); color: var(--ink); box-shadow: 0 0 22px -3px rgba(var(--pink-rgb), .6); }
.hx-submit-full.is-ready:hover:not(:disabled) { filter: brightness(1.08); }
.hx-submit-full:disabled { cursor: not-allowed; opacity: .75; }
/* Индикатор ожидания — общий .hx-spinner из tokens.css (Правка 1.2 §2). */

.hx-fine {
  margin-top: 14px; font-family: var(--font-mono); font-size: 10.5px; line-height: 1.7;
  letter-spacing: .02em; color: var(--ink-dim); text-align: center;
}
.hx-fine a { color: var(--ink-dim); text-decoration: none; border-bottom: 1px solid var(--line-strong); }

/* below-card */
.hx-referral {
  margin-top: 14px; display: flex; align-items: center; justify-content: center; gap: 9px;
  height: 46px; width: 100%; background: var(--fill-1); border: 1px dashed var(--line-strong);
  border-radius: 10px; color: var(--ink-soft); cursor: pointer; font-family: var(--font-mono); font-weight: 500;
  font-size: 11px; letter-spacing: .2em; text-transform: uppercase; transition: border-color .18s, color .18s;
}
.hx-referral:hover { border-color: rgba(var(--pink-rgb), .4); color: var(--ink); }
.hx-referral .hx-ic { color: var(--ink-dim); display: flex; }

.hx-guest { margin-top: 18px; text-align: center; }
.hx-guest button {
  background: none; border: 0; cursor: pointer; color: var(--ink-dim); font-family: var(--font-mono);
  font-size: 11px; letter-spacing: .12em; border-bottom: 1px solid transparent; padding-bottom: 2px;
  transition: color .18s, border-color .18s;
}
.hx-guest button:hover { color: var(--ink-soft); border-color: var(--line-strong); }

/* footer */
.hx-foot {
  position: absolute; left: 0; right: 0; bottom: 0; height: 54px;
  display: flex; align-items: center; justify-content: space-between; padding: 0 30px;
  border-top: 1px solid var(--line); background: color-mix(in srgb, var(--void) 40%, transparent); z-index: var(--z-ui);
}
.hx-foot-l { display: flex; gap: 22px; font-family: var(--font-mono); font-size: 10px; letter-spacing: .18em; text-transform: uppercase; }
.hx-foot-l a { color: var(--ink-dim); text-decoration: none; transition: color .18s; }
.hx-foot-l a:hover { color: var(--ink); }
.hx-foot-r { display: flex; gap: 8px; }
.hx-soc {
  width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;
  border: 1px solid var(--line); border-radius: 7px; color: var(--ink-dim); cursor: pointer;
  transition: color .18s, border-color .18s; background: none;
}
.hx-soc:hover { color: var(--pink); border-color: rgba(var(--pink-rgb), .4); }

/* mobile */
@media (max-width: 560px) {
  .hx-exit { top: 14px; left: 16px; }
  .hx-wrap { padding: 60px 18px 104px; }
  .hx-card { padding: 28px 22px 24px; }
  .hx-card.has-back { padding-top: 46px; }
  .hx-title { font-size: 30px; }
  .hx-foot { padding: 0 18px; }
  .hx-foot-l { gap: 16px; font-size: 9px; }
}
</style>
