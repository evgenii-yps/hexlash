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
// Epic 3Bc Step 1: 'create' now routes to /v2/create.
// Epic 4 Step 2: slot 1 (captain) carries a real agent UUID. Click flow:
//   - Fixed interactables → PhModal (clan/shop) or sub-scene route.
//   - Legacy 'warden'/'predator' (no captain → mock) → /v2/fd/:legacyKey.
//   - Anything else (real agent UUID) → /v2/fd/:agentId.
// Epic 5 Sub-Epic 5B Step 1: 'avatar' now routes to /v2/profile instead of
// opening a PhModal.
// Epic 5 Sub-Epic 5C Step 1: 'ratings' now routes to /v2/ratings instead of
// opening a PhModal. Remaining 2 PhModal ids: clan/shop.
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import HudPit from '@/components/hud/HudPit.vue';
import { useClickState } from '@/scene/interaction/useClickState.js';

const PH_MODAL_IDS = ['clan', 'shop'];

const hudRef = ref(null);
const click = useClickState();
const router = useRouter();

watch(() => click.seq, () => {
  if (!click.id) return;
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
  if (click.id === 'avatar') {
    router.push('/v2/profile');
    return;
  }
  if (click.id === 'ratings') {
    router.push('/v2/ratings');
    return;
  }
  if (PH_MODAL_IDS.includes(click.id)) {
    if (hudRef.value) hudRef.value.openPhModal(click.id);
    return;
  }
  // Anything else — legacy mock keys ('warden'/'predator') or real agent
  // UUIDs — both go to FD with the id as :key.
  router.push('/v2/fd/' + click.id);
});
</script>
