<!-- Epic 2 — pit-view hub. Step 16.
     Floating pointer-anchored label for whatever clickable 3D object is
     currently under the cursor. Source: prototype 4376 (DOM world-hint).
     Fades in/out via .show class; position driven by mouse coords. -->
<template>
  <div
    class="world-hint"
    :class="{ show: visible }"
    :style="positionStyle"
  >{{ text }}</div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  text: { type: String, default: '' },
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  visible: { type: Boolean, default: false },
});

const positionStyle = computed(() => ({
  left: `${props.x}px`,
  top: `${props.y - 12}px`,
}));
</script>

<style scoped>
.world-hint {
  position: fixed;
  pointer-events: none;
  transform: translate(-50%, -100%);
  padding: 6px 10px;
  background: rgba(14, 16, 28, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.15);
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-mid);
  text-transform: uppercase;
  letter-spacing: 2px;
  transition: opacity 0.15s;
  opacity: 0;
  z-index: 100;
}

.world-hint.show {
  opacity: 1;
}
</style>
