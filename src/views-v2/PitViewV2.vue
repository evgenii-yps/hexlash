<template>
  <HudPit ref="hudRef" />
</template>

<script setup>
// Step 17: full pit HUD. Watches useClickState().seq → calls
// hud.openPhModal(id). CanvasLayer (sibling in AppV2) writes click/hover via
// shared reactive stores, avoiding a cross-sibling emit chain.
import { ref, watch } from 'vue';
import HudPit from '@/components/hud/HudPit.vue';
import { useClickState } from '@/scene/interaction/useClickState.js';

const hudRef = ref(null);
const click = useClickState();

watch(() => click.seq, () => {
  if (hudRef.value && click.id) hudRef.value.openPhModal(click.id);
});
</script>
