<template>
  <button
    type="button"
    class="provider-btn"
    :class="{ 'provider-btn--loading': loading }"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span class="provider-btn__icon" aria-hidden="true">
      <span v-if="loading" class="provider-btn__spinner"></span>
      <slot v-else name="icon"></slot>
    </span>

    <span class="provider-btn__label">
      <slot></slot>
    </span>

    <span v-if="chevron" class="provider-btn__chevron" aria-hidden="true">›</span>
  </button>
</template>

<script setup>
defineProps({
  chevron: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
});

defineEmits(['click']);
</script>

<style scoped>
.provider-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 48px;
  padding: 12px 16px;
  background: var(--hex-bg-light);
  border: 1px solid var(--hex-border-default);
  border-radius: 6px;
  color: var(--hex-text-primary);
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, transform 0.08s ease;
  outline: none;
}

.provider-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.06);
  border-color: var(--hex-border-strong);
}

.provider-btn:focus-visible {
  border-color: var(--hex-primary);
  box-shadow: 0 0 0 3px var(--hex-primary-glow);
}

.provider-btn:active:not(:disabled) {
  transform: translateY(1px);
}

.provider-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.provider-btn--loading {
  cursor: progress;
}

.provider-btn__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  color: var(--hex-text-secondary);
}

.provider-btn__icon :deep(svg) {
  width: 18px;
  height: 18px;
  stroke: currentColor;
  fill: none;
}

.provider-btn__label {
  flex: 1;
  text-align: left;
}

.provider-btn__chevron {
  flex-shrink: 0;
  font-size: 18px;
  color: var(--hex-text-muted);
  line-height: 1;
}

.provider-btn__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top-color: var(--hex-text-primary);
  border-radius: 50%;
  animation: provider-btn-spin 0.6s linear infinite;
}

@keyframes provider-btn-spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 480px) {
  .provider-btn {
    min-height: 44px;
  }
}
</style>
