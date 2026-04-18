<template>
  <div class="hud-placeholder">
    <button class="hud-back" @click="$emit('back')">← Back</button>
    <div class="hud-placeholder-title">{{ title }}</div>
    <div class="hud-placeholder-text">Placeholder — HUD will be ported in a later phase.</div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
});
defineEmits(['back']);
</script>

<style scoped>
.hud-placeholder {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: var(--hex-bg-deep);
  color: var(--hex-text-primary);
  font-family: var(--hex-font-mono);
  z-index: 20;
}

.hud-back {
  position: absolute;
  top: 16px;
  left: 16px;
  background: var(--hex-bg-card);
  border: 1px solid var(--hex-border-default);
  color: var(--hex-text-primary);
  font-family: var(--hex-font-mono);
  font-size: 12px;
  padding: 8px 14px;
  border-radius: var(--hex-radius-sm);
  cursor: pointer;
  letter-spacing: 1px;
}

.hud-back:hover {
  border-color: var(--hex-border-active);
}

.hud-placeholder-title {
  font-family: var(--hex-font-display);
  font-size: 32px;
  letter-spacing: 6px;
  color: var(--hex-text-primary);
}

.hud-placeholder-text {
  font-size: 11px;
  color: var(--hex-text-muted);
  letter-spacing: 1px;
}
</style>
