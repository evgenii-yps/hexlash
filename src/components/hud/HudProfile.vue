<!-- Epic 5 — Sub-Epic 5B Step 5.
     Profile HUD skeleton — back + title + 4 .profile-card stubs (Identity /
     Performance / Friends / Settings) with titles only. Step 1 inline styles
     have moved to src/styles/v24/profile.css (scoped .app-v2), parity with
     training.css / matchmaking.css / create.css.
     Card content fills in Steps 6-9.
     Source: prototype hexlash_v24.html lines 4595-4715. -->
<template>
  <div class="hud-profile">
    <button class="profile-back" @click="$emit('back')">&larr; Back</button>

    <div class="profile-title">
      <div class="pt-kicker">Player</div>
      <div class="pt-name">PROFILE</div>
    </div>

    <div class="profile-grid">
      <!-- IDENTITY — Step 6 -->
      <div class="profile-card">
        <div class="profile-card-title">Identity</div>
      </div>

      <!-- PERFORMANCE — Step 7 -->
      <div class="profile-card">
        <div class="profile-card-title">Performance</div>
      </div>

      <!-- FRIENDS — Step 8 -->
      <div class="profile-card friends-card">
        <div class="profile-card-title">Friends</div>
      </div>

      <!-- SETTINGS — Step 9 -->
      <div class="profile-card settings-card">
        <div class="profile-card-title">Settings</div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineEmits(['back']);
</script>

<style scoped>
/* Wrapper-only positioning. All .profile-* / .id-* / .stat-* / .ach-* /
   .fc-* / .settings-* / .lang-* / .toggle-* / .logout-* styles live in
   src/styles/v24/profile.css (scoped to .app-v2). */
.hud-profile {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.hud-profile > * {
  pointer-events: auto;
}
</style>
