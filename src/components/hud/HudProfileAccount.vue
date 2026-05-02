<!-- Sub-Epic 3 Commit 4 — HudProfileAccount skeleton.
     Pattern B HUD overlay (mirror HudProfileWallet style).
     Title + back button only. Account components wire в Commits 5-7:
       — Commit 5: ConfirmEmail
       — Commit 6: ChangeLogin + ChangePassword
       — Commit 7: DeleteAccount
     Switcher3DPunch SKIPPED per Q-tactical-1 (carry-over #14 polish). -->
<template>
  <div class="hud hud-profile-account">
    <button class="profile-account-back" @click="$emit('back')">← Back</button>

    <div class="profile-account-title">
      <div class="pa-kicker">Hexlash</div>
      <div class="pa-name">ACCOUNT SETTINGS</div>
    </div>

    <div class="profile-account-content">
      <!-- TODO Commit 5: ConfirmEmail -->
      <!-- TODO Commit 6: ChangeLogin + ChangePassword -->
      <!-- TODO Commit 7: DeleteAccount -->
    </div>
  </div>
</template>

<script setup>
import { useStore } from 'vuex';

defineEmits(['back']);

const store = useStore();
</script>

<style scoped>
.hud-profile-account {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.hud-profile-account > * {
  pointer-events: auto;
}

.profile-account-back {
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
.profile-account-back:hover {
  border-color: var(--hex-primary, #ff066f);
  color: #fff;
}

.profile-account-title {
  position: absolute;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
}
.pa-kicker {
  font-family: var(--font-mono, monospace);
  font-size: 9px;
  letter-spacing: 2px;
  color: var(--text-dim, #888);
  text-transform: uppercase;
}
.pa-name {
  font-family: var(--font-display, 'Anonymous'), monospace;
  font-size: 18px;
  letter-spacing: 4px;
  color: var(--text-strong, #fff);
  margin-top: 2px;
}

.profile-account-content {
  position: absolute;
  top: 70px;
  left: 14px;
  right: 14px;
  bottom: 14px;
  overflow-y: auto;
  padding: 16px;
}
</style>
