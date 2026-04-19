<template>
  <div class="hud-pit-v2">
    <h1 class="hud-marker">/v2 works</h1>
    <WorldHint
      :text="hover.text"
      :x="hover.x"
      :y="hover.y"
      :visible="hover.visible"
    />
  </div>
</template>

<script setup>
// Step 16: reads shared hover state written by CanvasLayer and renders the
// WorldHint. CanvasLayer and this view are siblings in AppV2, so we use a
// module-scoped reactive store (useHoverState) instead of emit/props.
import WorldHint from '@/components/hud/common/WorldHint.vue';
import { useHoverState } from '@/scene/interaction/useHoverState.js';

const hover = useHoverState();
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
