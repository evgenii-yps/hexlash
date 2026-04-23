<!-- Epic 5 — Sub-Epic 5B Step 1.
     Profile HUD stub — back button + placeholder title only. Step 5 adds the
     .profile-grid with 4 card placeholders; Steps 6-10 fill in Identity /
     Performance / Friends / Settings + wallet modal wiring.
     Source: prototype hexlash_v24.html lines 4595-4715. -->
<template>
  <div class="hud-profile">
    <button class="profile-back" @click="$emit('back')">&larr; Back</button>
    <div class="profile-title">
      <div class="pt-kicker">Player</div>
      <div class="pt-name">PROFILE</div>
    </div>
  </div>
</template>

<script setup>
defineEmits(['back']);
</script>

<style scoped>
.hud-profile {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.hud-profile > * {
  pointer-events: auto;
}

/* Temporary scaffold styling — Step 5 moves these into
   src/styles/v24/profile.css as scoped .app-v2 rules per the prototype. */
.profile-back {
  position: absolute;
  top: 14px;
  left: 14px;
  background: rgba(14, 16, 28, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  padding: 8px 14px 8px 10px;
  color: var(--text-mid, #a8a8b3);
  cursor: pointer;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  letter-spacing: 2px;
  text-transform: uppercase;
  transition: all 0.15s ease;
}
.profile-back:hover {
  color: #fff;
  border-color: rgba(255, 6, 111, 0.4);
  background: rgba(255, 6, 111, 0.08);
}
.profile-title {
  position: absolute;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
}
.pt-kicker {
  font-family: var(--font-mono, monospace);
  font-size: 9px;
  letter-spacing: 4px;
  color: var(--text-dim, #6e6e7a);
  text-transform: uppercase;
  margin-bottom: 3px;
}
.pt-name {
  font-family: var(--font-display, 'Archivo Black', sans-serif);
  font-size: 22px;
  letter-spacing: 4px;
  color: #fff;
}
</style>
