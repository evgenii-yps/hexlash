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
      <!-- TODO Commit 2: GameBalanceCard -->
      <!-- TODO Commit 3: withdraw button + ConnectWallet entry -->
    </div>
  </div>
</template>

<script setup>
import { useStore } from 'vuex';

defineEmits(['back']);

const store = useStore();
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
</style>
