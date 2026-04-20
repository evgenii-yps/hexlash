<!-- Epic 3A Step 16 — fight result overlay (victory / defeat + rematch / exit).
     Styles in src/styles/v24/fight-overlays.css. -->
<template>
  <div class="phase-overlay result-overlay" :class="{ show: open }">
    <div class="phase-card" :class="won ? 'victory' : 'defeat'">
      <div class="pc-kicker">{{ won ? 'Result \u00b7 Win' : 'Result \u00b7 Loss' }}</div>
      <div class="pc-title">{{ won ? 'VICTORY' : 'DEFEAT' }}</div>
      <div class="pc-sub">{{ summary }}</div>
      <div class="result-actions">
        <button class="pc-btn" @click="$emit('rematch')">Rematch</button>
        <button class="pc-btn pc-btn-secondary" @click="$emit('exit')">Exit to Pit</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  open:    { type: Boolean, default: false },
  won:     { type: Boolean, default: false },
  summary: { type: String,  default: '' },
});
defineEmits(['rematch', 'exit']);
</script>

<style scoped>
.result-actions { margin-top: 18px; }
</style>
