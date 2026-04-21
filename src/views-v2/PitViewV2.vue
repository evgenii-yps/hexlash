<template>
  <HudPit ref="hudRef" />
</template>

<script setup>
// Step 17: full pit HUD. Watches useClickState().seq → calls
// hud.openPhModal(id). CanvasLayer (sibling in AppV2) writes click/hover via
// shared reactive stores, avoiding a cross-sibling emit chain.
// Epic 3A Step 1: warden/predator clicks now route to /v2/fd/:key instead of
// opening a PhModal. Other ids (6 interactables + avatar) stay on PhModal.
// Epic 3Ba Step 1: 'training' now routes to /v2/training.
// Epic 3Bb Step 1: 'matchmaking' now routes to /v2/matchmaking.
// Epic 3Bc Step 1: 'create' now routes to /v2/create. Remaining 3
// interactables (ratings/clan/shop) keep PhModal until Epic 4+.
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import HudPit from '@/components/hud/HudPit.vue';
import { useClickState } from '@/scene/interaction/useClickState.js';

const FD_IDS = ['warden', 'predator'];

const hudRef = ref(null);
const click = useClickState();
const router = useRouter();

watch(() => click.seq, () => {
  if (!click.id) return;
  if (FD_IDS.includes(click.id)) {
    router.push('/v2/fd/' + click.id);
    return;
  }
  if (click.id === 'training') {
    router.push('/v2/training');
    return;
  }
  if (click.id === 'matchmaking') {
    router.push('/v2/matchmaking');
    return;
  }
  if (click.id === 'create') {
    router.push('/v2/create');
    return;
  }
  if (hudRef.value) hudRef.value.openPhModal(click.id);
});
</script>
