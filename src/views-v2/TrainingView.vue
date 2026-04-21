<!-- Epic 3Ba Step 1 — stub. Filled out in Steps 2-9.
     Route /v2/training (added in Step 1 router change) mounts this view. -->
<template>
  <div class="training-view">
    <div class="training-stub">Training (stub &mdash; Epic 3Ba Step 1)</div>
  </div>
</template>

<script setup>
// Stub — scene registration and HUD arrive in Steps 2 / 6.
</script>

<style scoped>
.training-view {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 50;
}
.training-stub {
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
