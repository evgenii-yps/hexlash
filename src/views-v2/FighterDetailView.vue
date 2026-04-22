<template>
  <HudFighterDetail
    ref="hudRef"
    :key-prop="hudKeyProp"
    :agent="agentData"
  />
</template>

<script setup>
// Epic 3A — FighterDetailView.
// Epic 4 Step 6 — dynamic FD: route param :key may be a legacy mock string
// ('warden' | 'predator') OR a real backend agent UUID.
//
// Resolution order on mount + on route.params.key change:
//   1. Legacy keys → preserve the original mock path (no fetch, HUD uses
//      KICKER/NAME/META mocks).
//   2. useCreatedFighter cache → if its current.id matches the URL key,
//      consume + clearCreatedFighter (one-shot — second visit re-fetches).
//      Skips the fetchAgent round-trip immediately after Create persistence.
//   3. agent/fetchAgent action → on success, currentAgent.id matches key.
//      The action SWALLOWS errors (only console.error), so we treat
//      "currentAgent.id != key" after await as failure → router.push('/v2').

import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import * as THREE from 'three';
import store from '@/core/state/store.js';
import HudFighterDetail from '@/components/hud/HudFighterDetail.vue';
import { buildFighterDetailScene } from '@/scene/scenes/FighterDetailScene.js';
import { registerScene, activateScene } from '@/scene/sceneRegistry.js';
import { attachFdOrbit } from '@/scene/interaction/fdCameraController.js';
import { getCanvasRef } from '@/scene/interaction/useCanvasRef.js';
import { useClickState } from '@/scene/interaction/useClickState.js';
import {
  getCreatedFighter,
  clearCreatedFighter,
} from '@/scene/interaction/useCreatedFighter.js';

const LEGACY_KEYS = ['warden', 'predator'];
const BRANCH_IDS = ['speed', 'power', 'technique'];

const hudRef = ref(null);
const click = useClickState();

const route = useRoute();
const router = useRouter();

// agentData — null for legacy keys (HUD uses keyProp mocks), otherwise the
// resolved Agent (from createdFighter cache OR fetchAgent). Reactive so
// HudFighterDetail re-renders when route.params.key changes mid-mount.
const agentData = ref(null);

// hudKeyProp — passed to HudFighterDetail as `:key-prop`. For legacy keys
// it's the URL key; for dynamic keys we still hand 'warden' (HUD only uses
// keyProp when agent prop is null, which won't happen for dynamic).
const hudKeyProp = computed(() => {
  const k = route.params.key;
  return LEGACY_KEYS.includes(k) ? k : 'warden';
});

let fd = null;
let fdOrbit = null;
let onResize = null;

function handleResize() {
  if (!fd) return;
  fd.camera.aspect = window.innerWidth / window.innerHeight;
  fd.camera.updateProjectionMatrix();
}

// Resolve the fighter for a given URL key + drive both the HUD agent prop
// and the 3D scene's setFighter. Awaits backend on the dynamic path.
// Returns true on success, false on failure (caller redirects to /v2).
async function resolveFighter(key) {
  // Legacy path — null out agent so HUD uses its KICKER/NAME/META mocks,
  // hand the literal key down to the scene as both mesh variant + glow id.
  if (LEGACY_KEYS.includes(key)) {
    agentData.value = null;
    if (fd) fd.setFighter({ key, archetype: key });
    return true;
  }

  // Dynamic path — try the just-created cache first (one-shot consume).
  const cached = getCreatedFighter();
  if (cached && cached.id === key) {
    clearCreatedFighter();
    agentData.value = {
      id: cached.id,
      name: cached.name,
      primaryModule: cached.archetype,
      // Fresh agents land at zero — Belt 0 / ELO 1000 (matches backend
      // Prisma defaults). Fight-derived fields stay null until the user
      // returns to the agent later (next visit triggers fetchAgent).
      belt: 0,
      elo: 1000,
      wins: 0,
      losses: 0,
      draws: 0,
      totalFights: 0,
    };
    if (fd) {
      fd.setFighter({
        key: cached.archetype === 'predator' ? 'predator' : 'warden',
        archetype: cached.archetype,
      });
    }
    return true;
  }

  // Cache miss → backend fetch. fetchAgent swallows errors; check state
  // after the await for a definitive result.
  await store.dispatch('agent/fetchAgent', key);
  const ca = store.state.agent && store.state.agent.currentAgent;
  if (!ca || ca.id !== key) {
    console.warn('[FD] fetchAgent failed for', key);
    return false;
  }
  agentData.value = ca;
  if (fd) {
    fd.setFighter({
      key: ca.primaryModule === 'predator' ? 'predator' : 'warden',
      archetype: ca.primaryModule,
    });
  }
  return true;
}

onMounted(async () => {
  const aspect = window.innerWidth / window.innerHeight;
  fd = buildFighterDetailScene(THREE, aspect);

  // Step 6 — drag-to-rotate orbit owned by the View (canvas is published by
  // CanvasLayer via useCanvasRef). Attached before registerScene so tick is
  // composed as orbit.tick → scene.tick (orbit must write camera BEFORE any
  // downstream camera consumers).
  const canvas = getCanvasRef();
  if (canvas) fdOrbit = attachFdOrbit(fd.camera, canvas);

  // Step 7 — scene entry advertises picker + drag predicate + hover scale to
  // CanvasLayer's generic pointer handlers. FD has no label hints, so the
  // `labels` field is intentionally omitted.
  registerScene('fd', {
    scene: fd.scene,
    camera: fd.camera,
    tick: (t) => {
      if (fdOrbit) fdOrbit.tick(t);
      fd.tick(t);
    },
    picker: fd.picker,
    getIsDragging: () => (fdOrbit ? fdOrbit.getIsDragging() : false),
    hoverScale: 1.06,
  });
  activateScene('fd');

  onResize = handleResize;
  window.addEventListener('resize', onResize);

  // Resolve fighter (legacy mock OR createdFighter cache OR fetchAgent).
  // Failure → redirect to /v2 instead of leaving a half-empty FD.
  const ok = await resolveFighter(route.params.key);
  if (!ok) router.push('/v2');
});

onBeforeUnmount(() => {
  if (onResize) {
    window.removeEventListener('resize', onResize);
    onResize = null;
  }
  // Switch back to pit BEFORE disposing, so renderLoop doesn't touch a
  // freed scene on its next tick.
  activateScene('pit');
  if (fdOrbit) {
    fdOrbit.detach();
    fdOrbit = null;
  }
  if (fd) {
    fd.dispose();
    fd = null;
  }
});

// Route-key swap without full unmount. Same resolver — works for legacy
// (warden ↔ predator) and dynamic (UUID ↔ UUID) and any cross-mix.
watch(() => route.params.key, async (k) => {
  const ok = await resolveFighter(k);
  if (!ok) router.push('/v2');
});

// Step 7 — column clicks arrive through the global useClickState composable.
// Pit ids (warden/predator/training/...) can't be produced while FD is active
// (pit's picker is inactive) so a simple branch-id filter is enough.
watch(() => click.seq, () => {
  if (!click.id) return;
  if (!BRANCH_IDS.includes(click.id)) return;
  if (hudRef.value) hudRef.value.openBranchPanel(click.id);
});
</script>
