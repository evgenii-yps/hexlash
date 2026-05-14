<template>
  <Teleport to="body">
    <div class="referral-overlay" @click.self="$emit('close')">
      <div class="referral-modal" role="dialog" aria-modal="true" aria-labelledby="referral-modal-title">
        <button class="referral-close" aria-label="Close" @click="$emit('close')">&times;</button>

        <h2 id="referral-modal-title" class="referral-title">{{ t.referral.lblTitle }}</h2>

        <!-- Count badge — single pink accent on the modal, "ударный момент" per Neon Discipline -->
        <div class="referral-count">
          <span class="referral-count__value">{{ referralData?.referralCount ?? 0 }}</span>
          <span class="referral-count__label">{{ t.referral.lblFriendsInvited }}</span>
        </div>

        <!-- QR Code in a subtle hex-framed panel -->
        <div class="referral-qr">
          <img v-if="qrDataUrl" :src="qrDataUrl" alt="QR code for referral link" class="referral-qr__img"/>
          <div v-else class="hex-spinner referral-qr__spinner" aria-label="Loading QR"></div>
        </div>

        <!-- Referral link display + actions -->
        <div class="referral-link">
          <div class="referral-link__text" :title="referralLink">{{ referralLink }}</div>
          <div class="referral-link__actions">
            <HexButton variant="secondary" size="sm" @click="copyLink">
              {{ copyLabel }}
            </HexButton>
            <HexButton variant="ghost" size="sm" @click="shareLink">
              {{ t.referral.lblShare }}
            </HexButton>
          </div>
        </div>

        <!-- Reward hint -->
        <p class="referral-reward">{{ t.referral.lblRewardPerInvite }}</p>

        <!-- Recent referrals list -->
        <div v-if="referralData?.referrals?.length" class="referral-list">
          <div class="referral-list__title">{{ t.referral.lblRecentReferrals }}</div>
          <div class="referral-list__item" v-for="r in referralData.referrals" :key="r.login">
            <span class="referral-list__login">{{ r.login }}</span>
            <span class="referral-list__date">{{ formatDate(r.joinedAt) }}</span>
          </div>
        </div>
        <div v-else-if="!loading" class="referral-empty">
          {{ t.referral.lblNoReferrals }}
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import {ref, computed, onMounted} from 'vue';
import QRCode from 'qrcode';
import {t, interpolate} from '@/locales/index.js';
import store from '@/core/state/store.js';
import apiClient from '@/core/api/apiClient.js';
import HexButton from '@/components/ui/HexButton.vue';

const emit = defineEmits(['close']);

const qrDataUrl = ref('');
const referralData = ref(null);
const loading = ref(true);
const copied = ref(false);

const userLogin = computed(() => store.getters['master/getMaster']?.userData?.login || '');
// C3: env-portable origin (dev/test/prod/preview deployments) instead of
// hardcoded https://hexlash.com. /r/:username redirect lives at app root.
const referralLink = computed(() => `${window.location.origin}/r/${userLogin.value}`);
const copyLabel = computed(() => copied.value ? t.value.referral.lblCopied : t.value.referral.lblCopyLink);

onMounted(async () => {
  // Generate QR code
  try {
    qrDataUrl.value = await QRCode.toDataURL(referralLink.value, {
      width: 200,
      margin: 1,
      color: {dark: '#FFFFFF', light: '#00000000'},
    });
  } catch (e) {
    console.error('QR generation error:', e);
  }

  // Fetch referral data
  try {
    const response = await apiClient.getReferrals();
    referralData.value = response.data;
  } catch (e) {
    console.error('Failed to load referrals:', e);
  } finally {
    loading.value = false;
  }
});

async function copyLink() {
  try {
    await navigator.clipboard.writeText(referralLink.value);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  } catch (e) {
    console.error('Copy failed:', e);
  }
}

async function shareLink() {
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Hexlash',
        text: 'Join me in Hexlash!',
        url: referralLink.value,
      });
    } catch (e) {
      if (e.name !== 'AbortError') copyLink();
    }
  } else {
    copyLink();
  }
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return t.value.referral.lblToday;
  return interpolate(t.value.referral.lblDaysAgo, {days: diffDays});
}
</script>

<style scoped>
/* C5 Neon Discipline redesign — single pink accent (count badge), Anonymous
   pixel-font for title + count "ударный момент"; everything else neutral. URL
   text uses system mono (NOT AnonymousBalance) — AnonymousBalance is a
   number-only display font and rendered URLs with glitched overlapping
   glyphs (root cause of pre-redesign visual bug). */

.referral-overlay {
  position: fixed;
  inset: 0;
  z-index: 9000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  animation: referral-fade-in 0.18s ease;
}

@keyframes referral-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.referral-modal {
  position: relative;
  width: 100%;
  max-width: 360px;
  max-height: 85vh;
  overflow-y: auto;
  padding: 28px 22px 22px;
  background: var(--hex-bg-medium);
  border: 1px solid var(--hex-border-default);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  animation: referral-pop 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes referral-pop {
  from { opacity: 0; transform: translateY(8px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.referral-close {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--hex-text-secondary);
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  border-radius: 4px;
  transition: color 0.15s ease, background-color 0.15s ease;
}

.referral-close:hover {
  color: var(--hex-text-primary);
  background: rgba(255, 255, 255, 0.05);
}

.referral-title {
  margin: 0 0 18px;
  text-align: center;
  font-family: 'Anonymous', 'Courier New', monospace;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--hex-text-primary);
}

/* Count badge — single pink accent on the modal. Big "ударная цифра" in
   Anonymous pixel-font, glow shadow under it. */
.referral-count {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-bottom: 20px;
}

.referral-count__value {
  font-family: 'Anonymous', 'Courier New', monospace;
  font-size: 40px;
  font-weight: 600;
  line-height: 1;
  color: var(--hex-primary);
  text-shadow: 0 0 14px var(--hex-primary-glow);
  letter-spacing: 0.02em;
}

.referral-count__label {
  font-family: 'Anonymous', 'Courier New', monospace;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--hex-text-secondary);
}

/* QR — wrapped in a subtle panel so it reads as intentional, not loose img */
.referral-qr {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 216px;
  height: 216px;
  margin: 0 auto 18px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--hex-border-default);
  border-radius: 6px;
}

.referral-qr__img {
  display: block;
  width: 200px;
  height: 200px;
}

.referral-qr__spinner {
  /* Override .hex-spinner 20px default — bigger for QR placeholder context. */
  width: 36px;
  height: 36px;
}

/* Link display — system mono (NOT AnonymousBalance) prevents glyph overlap */
.referral-link {
  margin-bottom: 14px;
  text-align: center;
}

.referral-link__text {
  display: block;
  margin: 0 auto 12px;
  padding: 8px 12px;
  max-width: 100%;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--hex-border-default);
  border-radius: 4px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, 'Courier New', monospace;
  font-size: 12px;
  color: var(--hex-text-primary);
  word-break: break-all;
  line-height: 1.4;
}

.referral-link__actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.referral-reward {
  margin: 0 0 18px;
  text-align: center;
  font-family: 'Anonymous', 'Courier New', monospace;
  font-size: 10px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--hex-text-muted);
}

/* List */
.referral-list {
  padding-top: 14px;
  border-top: 1px solid var(--hex-border-default);
}

.referral-list__title {
  margin-bottom: 8px;
  font-family: 'Anonymous', 'Courier New', monospace;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--hex-text-secondary);
}

.referral-list__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.referral-list__item:last-child {
  border-bottom: none;
}

.referral-list__login {
  font-size: 13px;
  color: var(--hex-text-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.referral-list__date {
  font-size: 11px;
  color: var(--hex-text-muted);
  font-family: 'Anonymous', 'Courier New', monospace;
  letter-spacing: 0.05em;
}

.referral-empty {
  padding: 16px 0 4px;
  text-align: center;
  font-size: 12px;
  color: var(--hex-text-muted);
  border-top: 1px solid var(--hex-border-default);
}

/* Mobile — modal already constrained at max-width 360px; ensure padding
   tightens on narrow screens. */
@media (max-width: 420px) {
  .referral-overlay { padding: 12px; }
  .referral-modal { padding: 24px 16px 18px; }
  .referral-count__value { font-size: 36px; }
  .referral-qr { width: 200px; height: 200px; }
  .referral-qr__img { width: 184px; height: 184px; }
}
</style>
