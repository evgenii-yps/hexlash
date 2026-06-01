<!-- Game-cleanup reset: /play placeholder.
     The previous game (Pit hub + 3D scene + HUD) was removed for a rebuild
     from scratch. This stub keeps /play routable while the new game is built. -->
<template>
  <div class="play-stub">
    <div class="play-stub__inner">
      <div class="play-stub__title">HEXLASH</div>
      <div class="play-stub__subtitle">The game is being rebuilt.</div>
      <div class="play-stub__note">Coming soon.</div>
    </div>
  </div>
</template>

<script setup>
// Intentionally empty — pure placeholder.
</script>

<style scoped>
.play-stub {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-deep, #070811);
  text-align: center;
  padding: 24px;
}
.play-stub__title {
  font-family: var(--font-display, 'Anonymous'), monospace;
  font-size: 2.5rem;
  letter-spacing: 0.3em;
  color: var(--hex-primary, #ff066f);
  text-shadow: 0 0 24px rgba(255, 6, 111, 0.4);
}
.play-stub__subtitle {
  margin-top: 16px;
  font-family: var(--font-mono, monospace);
  font-size: 1rem;
  color: var(--text-mid, #cfcfd6);
}
.play-stub__note {
  margin-top: 6px;
  font-family: var(--font-mono, monospace);
  font-size: 0.8rem;
  letter-spacing: 0.1em;
  color: var(--text-dim, #888);
  text-transform: uppercase;
}
</style>
