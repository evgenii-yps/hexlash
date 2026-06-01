<!-- /play — bare dark screen. The game is being rebuilt from scratch; this is
     an intentionally empty full-screen dark surface (no content). -->
<template>
  <div class="play-blank"></div>
</template>

<script setup>
// Intentionally empty.
</script>

<style scoped>
.play-blank {
  position: fixed;
  inset: 0;
  background: var(--bg-deep, #070811);
}
</style>
