<template>
  <HudPit />
</template>

<script setup>
// Epic 2 Step 17 origin — pit hub click watcher.
// Watches useClickState().seq → routes to sub-scene or /v2/fd/:id.
// CanvasLayer (sibling in AppV2) writes click via shared reactive store,
// avoiding a cross-sibling emit chain.
//
// Click branches (current state):
//   - 'training' → /v2/training (Epic 3Ba)
//   - 'matchmaking' → /v2/matchmaking (Epic 3Bb)
//   - 'create' → /v2/create (Epic 3Bc)
//   - 'avatar' → /v2/profile (5B Step 1)
//   - 'ratings' → /v2/ratings (5C Step 1)
//   - 'clan' → /v2/clan (5D Step 1)
//   - 'shop' → /v2/shop (5E Step 1)
//   - anything else (legacy 'warden'/'predator' mocks OR real agent UUID)
//     → /v2/fd/:id (Epic 4 Step 6 dynamic FD)
//
// 5F Step 1: PH_MODAL_IDS + hudRef + MODAL fallback branch removed —
// MODAL system fully retired (HudPit no longer exposes openPhModal).
import { watch } from 'vue';
import { useRouter } from 'vue-router';
import store from '@/core/state/store.js';
import HudPit from '@/components/hud/HudPit.vue';
import { useClickState } from '@/scene/interaction/useClickState.js';
import { InfoMessageModel } from '@/core/models/internal/infoMessageModel.js';

const click = useClickState();
const router = useRouter();

watch(() => click.seq, () => {
  if (!click.id) return;
  if (click.id === 'training') {
    router.push('/play/training');
    return;
  }
  if (click.id === 'matchmaking') {
    // PvP is account-only. Guests get a clear message + Sign Up (not silent).
    if (store.getters['master/getIsGuest']) {
      store.commit('master/setInfoMessage',
        InfoMessageModel.withTimeout('PvP requires an account. Sign Up to unlock PvP.', 3000));
      router.push('/auth/signup');
      return;
    }
    router.push('/play/matchmaking');
    return;
  }
  if (click.id === 'create') {
    router.push('/play/create');
    return;
  }
  if (click.id === 'avatar') {
    router.push('/play/profile');
    return;
  }
  if (click.id === 'ratings') {
    router.push('/play/ratings');
    return;
  }
  if (click.id === 'clan') {
    router.push('/play/clan');
    return;
  }
  if (click.id === 'shop') {
    router.push('/play/shop');
    return;
  }
  // Anything else — legacy mock keys ('warden'/'predator') or real agent
  // UUIDs — both go to FD with the id as :key.
  router.push('/play/fd/' + click.id);
});
</script>
