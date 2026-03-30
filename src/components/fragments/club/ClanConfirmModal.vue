<template>
  <Teleport to="body">
    <div v-if="show" class="confirm-overlay" @click.self="onCancel">
      <div class="confirm-box">
        <h3 :class="['confirm-title', { 'title-danger': confirmDanger }]">{{ title }}</h3>
        <p class="confirm-desc" v-html="description"></p>
        <div class="confirm-actions">
          <button class="confirm-btn-ghost" @click="onCancel">
            {{ cancelText || t.modal?.btnCancel || 'Cancel' }}
          </button>
          <button
              :class="['confirm-btn-action', { 'btn-danger': confirmDanger, 'btn-primary': !confirmDanger }]"
              @click="onConfirm"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { t } from "@/locales/index.js";

defineProps({
  show: { type: Boolean, default: false },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  confirmText: { type: String, default: 'Confirm' },
  cancelText: { type: String, default: '' },
  confirmDanger: { type: Boolean, default: false },
});

const emit = defineEmits(['confirm', 'cancel']);

const onConfirm = () => emit('confirm');
const onCancel = () => emit('cancel');
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.confirm-box {
  background: var(--hex-bg-card);
  border: 1px solid var(--hex-border-active);
  border-radius: var(--hex-radius-lg);
  padding: 24px;
  max-width: 320px;
  width: 100%;
  backdrop-filter: blur(10px);
}

.confirm-title {
  font-family: 'Anonymous', 'Courier New', Consolas, monospace;
  font-size: 14px;
  color: var(--hex-text-primary);
  margin: 0 0 12px;
}

.title-danger {
  color: var(--hex-defeat);
}

.confirm-desc {
  font-size: 13px;
  color: var(--hex-text-secondary);
  line-height: 1.5;
  margin: 0 0 20px;
}

.confirm-desc :deep(strong) {
  color: var(--hex-text-primary);
}

.confirm-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.confirm-btn-ghost {
  padding: 8px 16px;
  background: none;
  border: 1px solid var(--hex-border-default);
  border-radius: var(--hex-radius-sm);
  color: var(--hex-text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.confirm-btn-ghost:hover {
  background: var(--hex-bg-light);
  border-color: var(--hex-border-active);
}

.confirm-btn-action {
  padding: 8px 16px;
  border: none;
  border-radius: var(--hex-radius-sm);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}

.confirm-btn-action:hover {
  opacity: 0.85;
}

.btn-danger {
  background: var(--hex-defeat);
  color: var(--hex-text-primary);
}

.btn-primary {
  background: var(--hex-primary);
  color: var(--hex-text-primary);
}
</style>
