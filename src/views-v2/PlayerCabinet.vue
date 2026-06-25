<!-- PlayerCabinet — the player's "Кабинет": one sliding panel over the home for
     everything non-combat. Mobile = a left drawer (opened by the chip in
     HomeView, dimmed scrim behind, ✕ / scrim-tap to close); desktop = a
     right-pinned 440px panel that stays open (CSS, see cabinet.css).

     Single-level nav: it opens on Profile (section = null), which lists the five
     sections as big rows; tapping a row swaps the body and shows a "‹ Cabinet"
     back. No nested menus.

     Everything is a local-state facade — bind / balance / referrals / quests /
     leaderboard are stubs; the live wallet & account arrive at Этап 2 behind the
     same surface. Strings come through the custom en-only i18n (t.cabinet.*).

     Glow discipline: the ONE glow here is the fighter-core halo on Profile; the
     single accent is #FF0069. Styles live in the separate cabinet.css so the
     shared home chrome (HomeShop) is never touched. -->
<template>
  <!-- scrim — mobile only (CSS hides it on desktop); tap closes -->
  <div v-if="open" class="cab-scrim" @click="onClose" />

  <aside class="cab-root" :class="{ open }" aria-label="Player cabinet">
    <!-- header: title (Profile) or back (a section) + close -->
    <header class="cab-head">
      <button v-if="section" type="button" class="cab-back" @click="back">
        <span class="ch">‹</span>{{ t.cabinet.back }}
      </button>
      <div v-else class="cab-htitle">{{ t.cabinet.title }}</div>
      <button type="button" class="cab-x" :aria-label="t.cabinet.close" @click="onClose">✕</button>
    </header>

    <div class="cab-body">
      <!-- ─────────────── PROFILE (landing) ─────────────── -->
      <template v-if="!section">
        <div class="cab-id">
          <span class="ci-av"><span /></span>
          <div>
            <div class="ci-hand">{{ t.cabinet.chipHandle }}</div>
            <div class="ci-sub">{{ t.cabinet.fighterName }} · {{ coreName }}</div>
          </div>
        </div>

        <!-- YOUR FIGHTER — core with the halo (the cabinet's dominant glow) -->
        <div class="cab-fighter">
          <div class="cf-k">{{ t.cabinet.fighterLabel }}</div>
          <div class="cab-core">
            <svg viewBox="0 0 64 64" fill="none">
              <path d="M32 4 L56 18 V46 L32 60 L8 46 V18 Z" stroke="var(--cab-acc)" stroke-width="2" fill="rgba(255,0,105,0.08)" />
              <path d="M32 20 L44 32 L32 44 L20 32 Z" fill="var(--cab-acc)" />
            </svg>
          </div>
          <div class="cf-name">{{ t.cabinet.fighterName }}</div>
          <div class="cf-type"><span>{{ coreName }} {{ t.cabinet.coreSuffix }}</span><span class="dia" /><span>{{ coreSig }}</span></div>
        </div>

        <!-- rank / season -->
        <div class="cab-rank">
          <div class="cr-top"><span class="cr-season">{{ t.cabinet.seasonLabel }}</span><span class="cr-val">{{ t.cabinet.rankValue }}</span></div>
          <div class="cr-bar"><i /></div>
        </div>

        <!-- account bind ribbon — two states -->
        <div v-if="!linked" class="cab-bind unlinked">
          <div class="cb-h"><span class="dot" /><b>{{ t.cabinet.bindTitle }}</b></div>
          <div class="cb-d">{{ t.cabinet.bindDesc }}</div>
          <button type="button" class="cb-cta" @click="onBind">{{ t.cabinet.bindCta }}</button>
        </div>
        <div v-else class="cab-bind linked">
          <div class="cb-h"><b><span class="cb-check">✓</span>{{ t.cabinet.bindLinkedTitle }}</b></div>
          <div class="cb-d">{{ t.cabinet.bindLinkedDesc }}</div>
        </div>

        <!-- five sections -->
        <div class="cab-rows">
          <button type="button" class="cab-row" @click="openSection('balance')">
            <span class="rw-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="13" rx="1" /><path d="M3 10h18" /></svg></span>
            <span class="rw-t"><span class="rw-n">{{ t.cabinet.rowBalance }}</span><span class="rw-s">{{ t.cabinet.rowBalanceSub }}</span></span>
            <span class="rw-a">›</span>
          </button>
          <button type="button" class="cab-row" @click="openSection('referrals')">
            <span class="rw-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 4a3 3 0 0 1 0 6M18 14a6 6 0 0 1 3 5" /></svg></span>
            <span class="rw-t"><span class="rw-n">{{ t.cabinet.rowReferrals }}</span><span class="rw-s">{{ t.cabinet.rowReferralsSub }}</span></span>
            <span class="rw-a">›</span>
          </button>
          <button type="button" class="cab-row" @click="openSection('quests')">
            <span class="rw-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg></span>
            <span class="rw-t"><span class="rw-n">{{ t.cabinet.rowQuests }}</span><span class="rw-s">{{ t.cabinet.rowQuestsSub }}</span></span>
            <span class="rw-soon">{{ t.cabinet.soon }}</span>
          </button>
          <button type="button" class="cab-row" @click="openSection('leaderboard')">
            <span class="rw-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4V10H4zM10 20h4V4h-4zM16 20h4v-7h-4z" /></svg></span>
            <span class="rw-t"><span class="rw-n">{{ t.cabinet.rowLeaderboard }}</span><span class="rw-s">{{ t.cabinet.rowLeaderboardSub }}</span></span>
            <span class="rw-soon">{{ t.cabinet.soon }}</span>
          </button>
          <button type="button" class="cab-row" @click="openSection('settings')">
            <span class="rw-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a7 7 0 0 0-1.7-1l-.3-2.5h-4l-.3 2.5a7 7 0 0 0-1.7 1l-2.4-1-2 3.5 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.5 2.4-1a7 7 0 0 0 1.7 1l.3 2.5h4l.3-2.5a7 7 0 0 0 1.7-1l2.4 1 2-3.5-2-1.5a7 7 0 0 0 .1-1z" /></svg></span>
            <span class="rw-t"><span class="rw-n">{{ t.cabinet.rowSettings }}</span><span class="rw-s">{{ t.cabinet.rowSettingsSub }}</span></span>
            <span class="rw-a">›</span>
          </button>
        </div>
      </template>

      <!-- ─────────────── BALANCE (live shell, stub content) ─────────────── -->
      <template v-else-if="section === 'balance'">
        <div class="cab-sec-h">{{ t.cabinet.balanceTitle }}</div>
        <div class="cab-balnum"><b>{{ balance }}</b><i>{{ t.cabinet.balanceUnit }}</i></div>
        <div class="cab-stub">
          <div class="cs-h"><b>{{ t.cabinet.txHistory }}</b><span class="cs-soon">{{ t.cabinet.soon }}</span></div>
          <div class="cs-d">{{ t.cabinet.txHistoryDesc }}</div>
        </div>
        <div class="cab-stub">
          <div class="cs-h"><b>{{ t.cabinet.depositWithdraw }}</b><span class="cs-soon">{{ t.cabinet.soon }}</span></div>
          <div class="cs-d">{{ t.cabinet.depositWithdrawDesc }}</div>
        </div>
      </template>

      <!-- ─────────────── REFERRALS (live) ─────────────── -->
      <template v-else-if="section === 'referrals'">
        <div class="cab-sec-h">{{ t.cabinet.referralsTitle }}</div>
        <div class="cab-field">
          <span class="cf-lab">{{ t.cabinet.refLinkLabel }}</span>
          <div class="cf-row">
            <input class="cf-in" type="text" :value="refLink" readonly @focus="$event.target.select()" />
            <button type="button" class="cab-btn" :class="{ 'is-on': copied }" @click="copyLink">{{ copied ? t.cabinet.copied : t.cabinet.copy }}</button>
          </div>
        </div>
        <div class="cab-field">
          <span class="cf-lab">{{ t.cabinet.promoLabel }}</span>
          <div class="cf-row">
            <input class="cf-in" type="text" v-model="code" :placeholder="t.cabinet.promoPlaceholder" />
            <button type="button" class="cab-btn" :disabled="!canApply" @click="applyCode">{{ t.cabinet.apply }}</button>
          </div>
        </div>
        <div class="cab-stub">
          <div class="cs-h"><b>{{ t.cabinet.invitesRewards }}</b><span class="cs-soon">{{ t.cabinet.soon }}</span></div>
          <div class="cs-d">{{ t.cabinet.invitesRewardsDesc }}</div>
        </div>
      </template>

      <!-- ─────────────── QUESTS (honest empty) ─────────────── -->
      <template v-else-if="section === 'quests'">
        <div class="cab-sec-h">{{ t.cabinet.questsTitle }}</div>
        <div class="cab-empty">
          <span class="ce-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg></span>
          <div class="ce-t">{{ t.cabinet.questsEmptyTitle }}</div>
          <div class="ce-s">{{ t.cabinet.questsEmptySub }}</div>
        </div>
      </template>

      <!-- ─────────────── LEADERBOARD (honest empty) ─────────────── -->
      <template v-else-if="section === 'leaderboard'">
        <div class="cab-sec-h">{{ t.cabinet.leaderboardTitle }}</div>
        <div class="cab-empty">
          <span class="ce-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4V10H4zM10 20h4V4h-4zM16 20h4v-7h-4z" /></svg></span>
          <div class="ce-t">{{ t.cabinet.leaderboardEmptyTitle }}</div>
          <div class="ce-s">{{ t.cabinet.leaderboardEmptySub }}</div>
        </div>
      </template>

      <!-- ─────────────── SETTINGS (live) ─────────────── -->
      <template v-else-if="section === 'settings'">
        <div class="cab-sec-h">{{ t.cabinet.settingsTitle }}</div>
        <div class="cab-set">
          <div class="cab-set-row">
            <span class="sr-n">{{ t.cabinet.settingLanguage }}</span>
            <span class="sr-v">{{ t.cabinet.settingLanguageValue }}</span>
          </div>
          <div class="cab-set-row">
            <span class="sr-n">{{ t.cabinet.settingSound }}</span>
            <button type="button" class="cab-tg" :class="{ on: sound }" role="switch" :aria-checked="String(sound)" @click="sound = !sound"><i /></button>
          </div>
          <div v-if="sound" class="cab-vol">
            <span class="cv-lab">{{ t.cabinet.settingVolume }}</span>
            <input type="range" min="0" max="100" step="1" v-model.number="vol" />
            <span class="cv-num">{{ vol }}</span>
          </div>
          <div class="cab-set-row">
            <span class="sr-n">{{ t.cabinet.settingReducedMotion }}</span>
            <button type="button" class="cab-tg" :class="{ on: reducedMotion }" role="switch" :aria-checked="String(reducedMotion)" @click="reducedMotion = !reducedMotion"><i /></button>
          </div>
        </div>
      </template>
    </div>

    <!-- footer (every section) -->
    <footer class="cab-foot">
      <div class="cf-legal">
        <a @click="goPrivacy">{{ t.cabinet.footPrivacy }}</a>
        <a>{{ t.cabinet.footTerms }}</a>
      </div>
      <div class="cf-soc">
        <a :aria-label="t.cabinet.socialX"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.2 2H21l-6.5 7.4L22 22h-6l-4.7-6.1L5.8 22H3l7-8L2 2h6.2l4.2 5.6zM16 20h1.6L8.1 4H6.4z" /></svg></a>
        <a :aria-label="t.cabinet.socialDiscord"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.3 5.3A16 16 0 0 0 15.3 4l-.3.5a12 12 0 0 1 3.4 1.7 11 11 0 0 0-9-0A12 12 0 0 1 13 4.5L12.7 4a16 16 0 0 0-4 1.3C5.2 9 4.5 12.6 4.8 16.1A16 16 0 0 0 9.6 18l.8-1.2a9 9 0 0 1-1.6-.8l.4-.3a9 9 0 0 0 8.4 0l.4.3a9 9 0 0 1-1.6.8l.8 1.2a16 16 0 0 0 4.8-2c.5-4.3-.7-7.9-3.7-10.7zM9.7 14c-.7 0-1.3-.7-1.3-1.5S9 11 9.7 11s1.3.7 1.3 1.5S10.4 14 9.7 14zm4.6 0c-.7 0-1.3-.7-1.3-1.5S13.6 11 14.3 11s1.3.7 1.3 1.5-.6 1.5-1.3 1.5z" /></svg></a>
      </div>
    </footer>

    <!-- local toast -->
    <div v-if="toast" class="cab-toast">{{ toast }}</div>
  </aside>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { t } from '@/locales/index.js';
import '@/styles/cabinet.css';

const props = defineProps({
  open: { type: Boolean, default: false },
  balance: { type: String, default: '0' },
  coreName: { type: String, default: 'ONSLAUGHT' },
  coreSig: { type: String, default: 'PRESSURE' },
});
const emit = defineEmits(['close']);
const router = useRouter();

// Local-state facade (Этап 2 swaps the stubs for live wallet/account behind it).
const section = ref(null); // null = Profile; 'balance' | 'referrals' | 'quests' | 'leaderboard' | 'settings'
const linked = ref(false);
const toast = ref('');
const copied = ref(false);
const code = ref('');
const sound = ref(true);
const vol = ref(70);
const reducedMotion = ref(false);

const refLink = computed(() => `https://hexlash.com/r/${t.value.cabinet.chipHandle}`);
const canApply = computed(() => code.value.trim().length > 0);

let toastTimer = null;
function showToast(msg) {
  toast.value = msg;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.value = ''; }, 1800);
}

function openSection(s) { section.value = s; }
function back() { section.value = null; }
function onClose() { emit('close'); }

// Account bind — stub: flip to linked + toast (live linking comes at Этап 2).
function onBind() { linked.value = true; showToast(t.value.cabinet.toastLinked); }

let copiedTimer = null;
async function copyLink() {
  try { await navigator.clipboard?.writeText(refLink.value); } catch (_) { /* clipboard blocked — toast still confirms intent */ }
  copied.value = true;
  showToast(t.value.cabinet.toastCopied);
  if (copiedTimer) clearTimeout(copiedTimer);
  copiedTimer = setTimeout(() => { copied.value = false; }, 1800);
}

function applyCode() {
  if (!canApply.value) return;
  showToast(t.value.cabinet.toastApplied);
  code.value = '';
}

function goPrivacy() { router.push('/privacy'); }

// Re-open always lands on Profile (single-level nav). Reset the section only
// AFTER the panel has slid out (~320ms, matching the .cab-root transform
// transition) so the section→Profile swap isn't visible during the close; cancel
// the pending reset if the cabinet is re-opened before it fires.
let closeResetTimer = null;
watch(() => props.open, (o) => {
  if (closeResetTimer) { clearTimeout(closeResetTimer); closeResetTimer = null; }
  if (o) return;
  closeResetTimer = setTimeout(() => { section.value = null; closeResetTimer = null; }, 420);
});

// Esc closes the cabinet (✕ / scrim-tap are the other two ways out).
function onKeydown(e) { if (e.key === 'Escape' && props.open) onClose(); }
onMounted(() => window.addEventListener('keydown', onKeydown));
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown);
  if (closeResetTimer) clearTimeout(closeResetTimer);
});
</script>
