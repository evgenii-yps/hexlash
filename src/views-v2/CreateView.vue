<!-- Epic 3Bc — Create view orchestrator.
     Step 1: manual empty scene stub + route wiring.
     Step 2: replaced by buildCreateScene (fog/camera/floor/walls).
     Steps 3-10 populate lighting, podium, holo fighter, archetype glow,
     HUD wiring, name panel, confirm, materialize. -->
<template>
  <div class="create-view">
    <HudCreate
      :on-archetype-color="handleArchetypeColor"
      :get-holo-fighter="getHoloFighter"
      :get-flash-el="getFlashEl"
      @back="onBack"
      @materialize-start="onMaterializeStart"
    />
    <div ref="flashRef" class="materialize-flash"></div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { useRouter } from 'vue-router';
import * as THREE from 'three';
import {
  registerScene,
  unregisterScene,
  activateScene,
} from '@/scene/sceneRegistry.js';
import { buildCreateScene } from '@/scene/scenes/CreateScene.js';
import { resetCreateState } from '@/scene/interaction/useCreateState.js';
import HudCreate from '@/components/hud/HudCreate.vue';

const router = useRouter();
const flashRef = ref(null);

let sceneApi = null;
let onResize = null;
// Materialize animation handle owned here (CreateView), reported up from
// HudCreate via @materialize-start. Cancelled on unmount so Esc/Back
// mid-lerp can't trigger onDone's router.push after the view is gone.
// Pattern 3Bb animHandle — handle lives with the orchestrator that owns
// the lifecycle, not the HUD that fires it.
let matHandle = null;

function handleResize() {
  if (!sceneApi) return;
  sceneApi.camera.aspect = window.innerWidth / window.innerHeight;
  sceneApi.camera.updateProjectionMatrix();
}

function onBack() {
  router.push('/v2');
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

// Getters passed as props — invoked at click time (not mount time), so
// null-at-mount is fine. `sceneApi._holoFighter` is the warden Group
// mutated via setHologram during materialize. `flashRef.value` is the
// .materialize-flash DOM node that drives the pink pulse via CSS class.
function getHoloFighter() {
  return sceneApi ? sceneApi._holoFighter : null;
}

function getFlashEl() {
  return flashRef.value;
}

function onMaterializeStart(handle) {
  matHandle = handle;
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
