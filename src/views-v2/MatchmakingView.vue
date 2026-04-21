<!-- Epic 3Bb Step 1 — stub. Filled out in Steps 2-9.
     Route /v2/matchmaking mounts this view. -->
<template>
  <div class="matchmaking-view">
    <div class="matchmaking-stub">Matchmaking (stub &mdash; Epic 3Bb Step 1)</div>
  </div>
</template>

<script setup>
// Stub — scene registration + HUD arrive in Steps 2 / 6.
</script>

<style scoped>
.matchmaking-view {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 50;
}
.matchmaking-stub {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--text-mid);
  font-family: var(--font-body);
  font-size: 14px;
  letter-spacing: 1px;
}
</style>
