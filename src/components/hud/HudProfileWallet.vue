<!-- Wallet HUD — Connect Wallet (web3) only.
     Game-cleanup reset: GameBalanceCard + in-game balance/withdraw removed
     (balance was an off-chain game counter, dropped with the game). On-chain
     wallet connection (ConnectWallet) is preserved. -->
<template>
  <div class="hud hud-profile-wallet">
    <button class="profile-wallet-back" @click="$emit('back')">← Back</button>

    <div class="profile-wallet-title">
      <div class="pw-kicker">Hexlash</div>
      <div class="pw-name">WALLET</div>
    </div>

    <div class="profile-wallet-content">
      <button class="connect-wallet-cta" @click="openConnectWallet">
        {{ t.profile.wallet.lblConnectWallet }}
      </button>
    </div>

    <!-- ConnectWallet host (lazy-mount). Modal teleports to body —
         display:none source layout is intentional. -->
    <component
      v-if="cwMounted && CWComp"
      :is="CWComp"
      ref="cwRef"
      style="display: none;"
    />
  </div>
</template>

<script setup>
import { ref, shallowRef, markRaw, nextTick } from 'vue';
import { t } from '@/locales/index.js';

defineEmits(['back']);

// ConnectWallet lazy-load (shallowRef + markRaw — component objects shouldn't
// be deeply reactive). cwMounted gates v-if host so the chunk loads only on
// first open.
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
