<template>
  <div class="hud-pit-v2">
    <h1 class="hud-marker">/v2 works</h1>
  </div>
</template>

<script setup>
// Тестовый HUD-заглушка для /v2 в Эпике 1. В Эпике 2 заменится реальным HUD Pit.
</script>

<style scoped>
.hud-pit-v2 {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.hud-marker {
  position: absolute;
  top: 2rem;
  left: 2rem;
  z-index: 10;
  color: #fff;
  font-family: var(--font-display);
  font-weight: 400;
  font-size: 1.75rem;
  letter-spacing: 0.05em;
  pointer-events: auto;
}
</style>
