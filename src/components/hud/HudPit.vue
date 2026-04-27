<!-- Epic 2 — pit-view hub. Step 17.
     Composes the pit HUD: TopBar, WorldHint (tracks hoverState), PhModal.
     Exposes openPhModal(id) so PitViewV2 can trigger it from a click watch.
     Source: prototype 6946-6998 (openModal dispatch). -->
<template>
  <div class="hud-pit">
    <TopBar @avatar-click="onAvatarClick" />
    <WorldHint
      :text="hover.text"
      :x="hover.x"
      :y="hover.y"
      :visible="hover.visible"
    />
    <PhModal
      :open="modalOpen"
      :kicker="modalKicker"
      :title="modalTitle"
      :desc="modalDesc"
      @close="closeModal"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import TopBar from './common/TopBar.vue';
import WorldHint from './common/WorldHint.vue';
import PhModal from './common/PhModal.vue';
import { useHoverState } from '@/scene/interaction/useHoverState.js';

// Per-target placeholder copy. In the prototype each clickable has its own
// real scene (Training / Matchmaking / ...); we surface a "coming soon" card
// with a short description until Epic 3 wires real flows.
const MODAL_CONTENT = {
  // 'training' removed in Epic 3Ba Step 1 — heavy bag clicks now route to
  // /v2/training instead of opening a PhModal.
  // 'matchmaking' removed in Epic 3Bb Step 1 — terminal clicks now route
  // to /v2/matchmaking instead of opening a PhModal.
  // 'create' removed in Epic 3Bc Step 1 — plus-plinth clicks now route to
  // /v2/create instead of opening a PhModal.
  // 'avatar' removed in Epic 5 Sub-Epic 5B Step 1 — avatar btn clicks now
  // route to /v2/profile instead of opening a PhModal.
  // 'ratings' removed in Epic 5 Sub-Epic 5C Step 1 — ratings plinth clicks now
  // route to /v2/ratings instead of opening a PhModal.
  // 'clan' removed in Epic 5 Sub-Epic 5D Step 1 — clan plinth clicks now route
  // to /v2/clan instead of opening a PhModal.
  // 'shop' removed in Epic 5 Sub-Epic 5E Step 1 — shop locker plinth clicks
  // now route to /v2/shop instead of opening a PhModal.
  warden: {
    kicker: 'Captain · Warden',
    title: 'FIGHTER #1',
    desc: 'White Belt · 3W-1L-0D · ELO 1247. Your captain.',
  },
  predator: {
    kicker: 'Predator',
    title: 'FIGHTER #2',
    desc: 'White Belt · 1W-0L-0D · ELO 1043. Aggressive archetype.',
  },
};

const hover = useHoverState();
const modalOpen = ref(false);
const modalKicker = ref('');
const modalTitle = ref('');
const modalDesc = ref('');

function openPhModal(id) {
  const c = MODAL_CONTENT[id];
  if (!c) return;
  modalKicker.value = c.kicker;
  modalTitle.value = c.title;
  modalDesc.value = c.desc;
  modalOpen.value = true;
}

function closeModal() {
  modalOpen.value = false;
}

// Avatar-btn is a DOM HUD element (not a 3D-raycastable target), so its click
// never reaches PitViewV2's useClickState watcher. Step 1 removed
// MODAL_CONTENT.avatar but the TopBar binding still pointed at openPhModal,
// which no-op'd on the missing entry — click was silently swallowed. Route
// directly from here instead. (Sub-Epic 5B hot-fix 10.1.)
const router = useRouter();
function onAvatarClick() {
  router.push('/v2/profile');
}

defineExpose({ openPhModal });
</script>

<style scoped>
.hud-pit {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
</style>
