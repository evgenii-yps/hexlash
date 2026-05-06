<!-- Epic 3Bc — Create view orchestrator.
     Step 1: manual empty scene stub + route wiring.
     Step 2: replaced by buildCreateScene (fog/camera/floor/walls).
     Steps 3-10 populate lighting, podium, holo fighter, archetype glow,
     HUD wiring, name panel, confirm, materialize. -->
<template>
  <div class="create-view">
    <HudCreate
      :on-archetype-color="handleArchetypeColor"
      @back="onBack"
      @create-persist="onCreatePersist"
    />
    <div ref="flashRef" class="materialize-flash"></div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { useRouter } from 'vue-router';
import * as THREE from 'three';
import store from '@/core/state/store.js';
import {
  registerScene,
  unregisterScene,
  activateScene,
} from '@/scene/sceneRegistry.js';
import { buildCreateScene } from '@/scene/scenes/CreateScene.js';
import {
  createState,
  resetCreateState,
} from '@/scene/interaction/useCreateState.js';
import { setCreatedFighter } from '@/scene/interaction/useCreatedFighter.js';
import {
  startMaterializeAnimation,
  MATERIALIZE_FROM,
  MATERIALIZE_TO,
  MATERIALIZE_DURATION_MS,
} from '@/scene/objects/createHologram.js';
import HudCreate from '@/components/hud/HudCreate.vue';

const router = useRouter();
const flashRef = ref(null);

let sceneApi = null;
let onResize = null;
// Materialize animation handle owned here (CreateView). Set inside
// onCreatePersist after the backend resolves, cancelled on unmount so
// Esc/Back mid-lerp can't trigger onDone's router.push after the view is
// gone. Pattern 3Bb animHandle — handle lives with the orchestrator that
// owns the lifecycle, not the HUD that fires it.
let matHandle = null;

function handleResize() {
  if (!sceneApi) return;
  sceneApi.camera.aspect = window.innerWidth / window.innerHeight;
  sceneApi.camera.updateProjectionMatrix();
}

function onBack() {
  router.push('/play');
}

// Callback handed to HudCreate (Step 8). Closure captures the `sceneApi`
// let-binding, so by the time user clicks an archetype card the real
// scene API is already assigned. No reactivity needed — HudCreate's
// onArchetypeChange guard handles the null-window between mount phases.
function handleArchetypeColor(hex) {
  if (sceneApi && sceneApi.setArchetypeColor) {
    sceneApi.setArchetypeColor(hex);
  }
}

// Epic 4 Step 5 — Create persistence happy + sad paths.
// Sequential phases (per ТЗ — backend FIRST, then animate):
//   1. createState.creating = true → button disabled + 'Creating…' label.
//   2. await dispatch('agent/createAgent', payload). 401 self-handles
//      via apiClient interceptor (master/logout); we only catch business
//      errors (400 validation, 403 NFT, 500, etc).
//   3. setCreatedFighter caches { id, name, archetype } so FighterDetailView
//      (Step 6) can hydrate without an extra fetchAgent round-trip.
//   4. creating → false, materializing → true. Run DOM flash + opacity lerp.
//   5. onDone → router.push('/play/fd/' + agent.id). matHandle.cancel() is
//      idempotent if unmount races the animation.
// Sad path: catch → createState.error = {message}, creating = false. Form
// state intact (name + archetype preserved) — user can edit and retry.
async function onCreatePersist(payload) {
  if (createState.creating || createState.materializing) return;

  createState.creating = true;
  createState.error = null;

  let agent;
  try {
    agent = await store.dispatch('agent/createAgent', payload);
  } catch (e) {
    const msg =
      (e && e.response && e.response.data && e.response.data.error) ||
      (e && e.message) ||
      'Failed to create fighter';
    createState.error = msg;
    createState.creating = false;
    return;
  }

  // setCreatedFighter is one-shot — FighterDetailView consumes + clears
  // on mount (Step 6). Refresh on /v2/fd/:id falls back to fetchAgent.
  setCreatedFighter({
    id: agent.id,
    name: agent.name,
    archetype: agent.primaryModule,
  });

  // Phase swap — backend done, animation begins. materializing stays true
  // until unmount so any stray render between onDone and teardown can't
  // re-enable the Create button. resetCreateState (called on next mount)
  // zeroes both flags.
  createState.creating = false;
  createState.materializing = true;

  // DOM flash — prototype 9233-9236. Remove + forced reflow + add so the
  // CSS animation restarts cleanly even if user clicks Create multiple
  // times across sessions (cached frame could otherwise skip the 0→20% ramp).
  const flash = flashRef.value;
  if (flash) {
    flash.classList.remove('flash');
    /* eslint-disable-next-line no-unused-expressions */
    flash.offsetWidth; // force reflow
    flash.classList.add('flash');
  }

  const fighter = sceneApi ? sceneApi._holoFighter : null;
  if (!fighter) {
    // Defensive — shouldn't happen after onMounted. If we somehow have no
    // scene, skip the animation and navigate directly.
    router.push('/play/fd/' + agent.id);
    return;
  }

  matHandle = startMaterializeAnimation(
    fighter,
    MATERIALIZE_FROM,
    MATERIALIZE_TO,
    MATERIALIZE_DURATION_MS,
    {
      onDone: () => {
        router.push('/play/fd/' + agent.id);
      },
    },
  );
}

function onKeydown(e) {
  if (e.key === 'Escape') onBack();
}

onMounted(() => {
  // Step 9 hot-fix — createState is a module-scoped reactive singleton
  // (useCreateState.js Step 1). It survives CreateView mount/unmount,
  // so a previous session's archetypeId/name/step would persist into
  // the next /v2/create entry — user lands on whatever step they left
  // on, with old data filled in. Prototype 9266-9269 (`openCreate`)
  // resets the state on each open; this is the v2 equivalent.
  // Order: reset BEFORE buildCreateScene so the scene's initial
  // glow.setColor(grey) lines up with archetypeId=null in state.
  resetCreateState();

  const aspect = window.innerWidth / window.innerHeight;
  sceneApi = buildCreateScene(THREE, aspect);
  // Step 1 registered a plain empty scene under 'create'. Step 2
  // registerScene(Map.set) overwrites that entry with the real scaffold —
  // no collision, no transition wiring needed.
  registerScene('create', {
    scene: sceneApi.scene,
    camera: sceneApi.camera,
    tick: sceneApi.tick,
  });
  activateScene('create');
  onResize = handleResize;
  window.addEventListener('resize', onResize);
  window.addEventListener('keydown', onKeydown);
});

onBeforeUnmount(() => {
  // Cancel materialize FIRST — a late rAF tick or the 700ms pause
  // setTimeout could otherwise call onDone → emit('back') → router.push
  // after the view is already unmounting. Pattern 3Bb (animHandle cancel
  // before scene dispose).
  if (matHandle) {
    matHandle.cancel();
    matHandle = null;
  }
  window.removeEventListener('keydown', onKeydown);
  if (onResize) {
    window.removeEventListener('resize', onResize);
    onResize = null;
  }
  // Teardown ordering mirrors 3Ba/3Bb: switch back to pit BEFORE
  // unregistering so renderLoop never ticks a disposed scene.
  activateScene('pit');
  unregisterScene('create');
  if (sceneApi) {
    sceneApi.dispose();
    sceneApi = null;
  }
});
</script>

<style scoped>
.create-view {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 50;
}
</style>
