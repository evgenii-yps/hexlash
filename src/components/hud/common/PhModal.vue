<!-- Epic 2 — pit-view hub. Step 17.
     Placeholder "coming soon" modal. Opens when a clickable 3D object is
     clicked (click-detection in CanvasLayer). Teleported to body so
     z-index doesn't fight the HUD container.
     Source: prototype 5025-5033 + 6990-6999 (close handlers). -->
<template>
  <Teleport to="body">
    <div
      v-show="open"
      class="v2-ph-backdrop"
      @click="$emit('close')"
    />
    <div v-show="open" class="v2-ph-modal" role="dialog" aria-modal="true">
      <button class="v2-ph-close" @click="$emit('close')">×</button>
      <div class="v2-ph-kicker">{{ kicker }}</div>
      <div class="v2-ph-title">{{ title }}</div>
      <div class="v2-ph-desc">{{ desc }}</div>
      <div class="v2-ph-soon">Coming soon</div>
    </div>
  </Teleport>
</template>

<script setup>
import { watch, onBeforeUnmount } from 'vue';

const props = defineProps({
  open: { type: Boolean, default: false },
  kicker: { type: String, default: '' },
  title: { type: String, default: '' },
  desc: { type: String, default: '' },
});
const emit = defineEmits(['close']);

// Esc to close — only when open. Listener is added/removed with open state.
function onKey(e) {
  if (e.key === 'Escape') emit('close');
}

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    window.addEventListener('keydown', onKey);
  } else {
    window.removeEventListener('keydown', onKey);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey);
});
</script>

<style>
/* Not scoped — Teleport moves nodes to <body>, scoped styles wouldn't apply.
   Classes are already namespaced with the .v2- prefix. */
.v2-ph-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  z-index: 300;
}

.v2-ph-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(440px, calc(100vw - 48px));
  padding: 28px 32px 32px;
  background: rgba(14, 16, 28, 0.96);
  border: 1px solid rgba(212, 168, 67, 0.45);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.7),
              0 0 0 1px rgba(255, 255, 255, 0.04) inset;
  z-index: 301;
  font-family: var(--font-body);
  color: var(--text-mid);
}

.v2-ph-close {
  position: absolute;
  top: 10px;
  right: 14px;
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  font-size: 22px;
  line-height: 1;
  color: var(--text-dim);
  cursor: pointer;
  transition: color 0.15s;
}

.v2-ph-close:hover {
  color: var(--hex-primary);
}

.v2-ph-kicker {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: var(--text-dim);
}

.v2-ph-title {
  font-family: var(--font-display);
  font-size: 28px;
  letter-spacing: 3px;
  color: #fff;
  margin-top: 6px;
}

.v2-ph-desc {
  margin-top: 14px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-mid);
}

.v2-ph-soon {
  margin-top: 22px;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: var(--hex-primary);
}
</style>
