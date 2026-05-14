<template>
  <Teleport to="body">
    <div class="referral-overlay" @click.self="$emit('close')">
      <div class="referral-modal">
        <div class="referral-header">
          <h2 class="referral-title">{{ t.referral.lblTitle }}</h2>
          <button class="close-btn" @click="$emit('close')">&times;</button>
        </div>

        <div class="referral-body">
          <!-- QR Code -->
          <div class="qr-section">
            <img v-if="qrDataUrl" :src="qrDataUrl" alt="QR Code" class="qr-image"/>
            <div v-else class="hex-spinner" aria-label="Loading QR"></div>
          </div>

          <!-- Referral Link -->
          <div class="link-section">
            <div class="link-text">{{ referralLink }}</div>
            <div class="link-buttons">
              <HexButton variant="secondary" size="sm" @click="copyLink">
                {{ copyLabel }}
              </HexButton>
              <HexButton variant="ghost" size="sm" @click="shareLink">
                {{ t.referral.lblShare }}
              </HexButton>
            </div>
          </div>

          <div class="divider"/>

          <!-- Stats -->
          <div class="stats-section">
            <div class="stat-row">
              <span class="stat-label">{{ t.referral.lblFriendsInvited }}</span>
              <span class="stat-value">{{ referralData?.referralCount ?? 0 }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">{{ t.referral.lblRewardPerInvite }}</span>
            </div>
          </div>

          <!-- Referral list -->
          <div v-if="referralData?.referrals?.length" class="referrals-section">
            <div class="referrals-title">{{ t.referral.lblRecentReferrals }}</div>
            <div class="referral-item" v-for="r in referralData.referrals" :key="r.login">
              <span class="referral-login">{{ r.login }}</span>
              <span class="referral-date">{{ formatDate(r.joinedAt) }}</span>
            </div>
          </div>
          <div v-else-if="!loading" class="no-referrals">
            {{ t.referral.lblNoReferrals }}
          </div>
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
.referral-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 9000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.referral-modal {
  background: var(--hex-bg-medium);
  border: 1px solid var(--hex-border-default);
  border-radius: 8px;
  width: 100%;
  max-width: 360px;
  max-height: 80vh;
  overflow-y: auto;
}

.referral-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--hex-border-default);
}

.referral-title {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-weight: bold;
  font-size: 1rem;
  color: var(--hex-text-primary);
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: var(--hex-text-muted);
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
}

.referral-body {
  padding: 20px;
}

.qr-section {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.qr-image {
  width: 200px;
  height: 200px;
  border-radius: 4px;
}

.link-section {
  text-align: center;
  margin-bottom: 16px;
}

.link-text {
  font-family: 'AnonymousBalance', monospace;
  color: var(--hex-text-primary);
  font-size: 0.85rem;
  margin-bottom: 12px;
  word-break: break-all;
}

.link-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.divider {
  height: 1px;
  background: var(--hex-border-default);
  margin: 16px 0;
}

.stats-section {
  margin-bottom: 16px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.stat-label {
  color: var(--hex-text-secondary);
  font-size: 0.85rem;
}

.stat-value {
  color: var(--hex-text-primary);
  font-family: 'AnonymousBalance', monospace;
  font-size: 1rem;
}

.referrals-section {
  margin-top: 8px;
}

.referrals-title {
  color: var(--hex-text-secondary);
  font-size: 0.8rem;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.referral-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid var(--hex-border-default);
}

.referral-item:last-child {
  border-bottom: none;
}

.referral-login {
  color: var(--hex-text-primary);
  font-size: 0.85rem;
}

.referral-date {
  color: var(--hex-text-muted);
  font-size: 0.75rem;
}

.no-referrals {
  color: var(--hex-text-muted);
  text-align: center;
  font-size: 0.85rem;
  padding: 12px 0;
}
</style>
