<!-- Sub-Epic 3 Commit 1 — HudProfileWallet skeleton.
     Pattern B HUD overlay (mirror HudUserProfile / HudGuestClan style).
     Title + back button only. GameBalanceCard wires в Commit 2.
     Withdraw + ConnectWallet wires в Commit 3. -->
<template>
  <div class="hud hud-profile-wallet">
    <button class="profile-wallet-back" @click="$emit('back')">← Back</button>

    <div class="profile-wallet-title">
      <div class="pw-kicker">Hexlash</div>
      <div class="pw-name">WALLET</div>
    </div>

    <div class="profile-wallet-content">
      <div class="balance-card-wrapper" @click="withdraw">
        <GameBalanceCard :balance="balanceDisplay" />
      </div>

      <button class="connect-wallet-cta" @click="openConnectWallet">
        {{ t.profile.wallet.lblConnectWallet }}
      </button>
    </div>

    <!-- ConnectWallet host (mirror HudProfile lazy-mount pattern). Modal
         teleports to body — display:none source layout is intentional. -->
    <component
      v-if="cwMounted && CWComp"
      :is="CWComp"
      ref="cwRef"
      style="display: none;"
    />
  </div>
</template>

<script setup>
import { ref, computed, shallowRef, markRaw, nextTick } from 'vue';
import { useStore } from 'vuex';
import { t } from '@/locales/index.js';
import { InfoMessageModel } from '@/core/models/internal/infoMessageModel.js';
import GameBalanceCard from '@/components/fragments/profile/wallet/GameBalanceCard.vue';

defineEmits(['back']);

const store = useStore();
const master = computed(() => store.getters['master/getMaster']);
// master.getBalance() formats userData.balance / 10^DECIMALS toFixed(2).
// Null-safe optional chaining — view может рендериться briefly до master loaded.
const balanceDisplay = computed(() => master.value?.getBalance?.() ?? '0');

// Withdraw — toast as-is per ТЗ A4 (Sub-epic 7 Auth+Wallet redesign territory
// для real x402 logic). Mirror v1 ProfileWallet:55-58 verbatim.
const withdraw = () => {
  const msg = InfoMessageModel.withTimeout(t.value.info.withdrawAfterListing, 3000);
  store.commit('master/setInfoMessage', msg);
};

// ConnectWallet lazy-load mirror (HudProfile precedent — Step 10 / 5B).
// shallowRef + markRaw — component objects shouldn't be deeply reactive.
// cwMounted gates v-if host so chunk загружается только on first open.
const CWComp = shallowRef(null);
const cwMounted = ref(false);
const cwRef = ref(null);

async function loadCW() {
  if (CWComp.value) return;
  const mod = await import('@/components/fragments/profile/wallet/ConnectWallet.vue');
  CWComp.value = markRaw(mod.default);
}

async function openConnectWallet() {
  await loadCW();
  cwMounted.value = true;
  // Two ticks cover: (1) v-if mount of <component :is>, (2) child setup
  // completion in ConnectWallet. defineExpose populated by end of setup.
  await nextTick();
  await nextTick();
  cwRef.value?.openModal?.();
}
</script>

<style scoped>
.hud-profile-wallet {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.hud-profile-wallet > * {
  pointer-events: auto;
}

.profile-wallet-back {
  position: fixed;
  top: 14px;
  left: 14px;
  z-index: 60;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: var(--text-mid, #cfcfd6);
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
.profile-wallet-back:hover {
  border-color: var(--hex-primary, #ff066f);
  color: #fff;
}

.profile-wallet-title {
  position: absolute;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
}
.pw-kicker {
  font-family: var(--font-mono, monospace);
  font-size: 9px;
  letter-spacing: 2px;
  color: var(--text-dim, #888);
  text-transform: uppercase;
}
.pw-name {
  font-family: var(--font-display, 'Anonymous'), monospace;
  font-size: 18px;
  letter-spacing: 4px;
  color: var(--text-strong, #fff);
  margin-top: 2px;
}

.profile-wallet-content {
  position: absolute;
  top: 70px;
  left: 14px;
  right: 14px;
  bottom: 14px;
  overflow-y: auto;
  padding: 16px;
}

/* Balance card centered horizontally — GameBalanceCard has fixed 180px width
   and own centering для contents. Wrapper provides flex centering +
   cursor pointer (withdraw click target — bubbles через VCard root). */
.balance-card-wrapper {
  display: flex;
  justify-content: center;
  margin: 12px 0;
  cursor: pointer;
}

.connect-wallet-cta {
  display: block;
  margin: 16px auto 0;
  padding: 8px 20px;
  background: var(--bg-panel, rgba(0, 0, 0, 0.4));
  color: var(--text-strong, #fff);
  border: 1px solid var(--hex-primary, #ff066f);
  border-radius: 6px;
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  letter-spacing: 1px;
  text-transform: uppercase;
  cursor: pointer;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
.connect-wallet-cta:hover {
  background: rgba(255, 6, 111, 0.12);
}
</style>
