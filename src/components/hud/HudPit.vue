<!-- Epic 2 — pit-view hub. Step 17.
     Composes the pit HUD: TopBar, WorldHint (tracks hoverState), PhModal.
     Exposes openPhModal(id) so PitViewV2 can trigger it from a click watch.
     Source: prototype 6946-6998 (openModal dispatch). -->
<template>
  <div class="hud-pit">
    <TopBar @avatar-click="openPhModal('avatar')" />
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
import TopBar from './common/TopBar.vue';
import WorldHint from './common/WorldHint.vue';
import PhModal from './common/PhModal.vue';
import { useHoverState } from '@/scene/interaction/useHoverState.js';

// Per-target placeholder copy. In the prototype each clickable has its own
// real scene (Training / Matchmaking / ...); we surface a "coming soon" card
// with a short description until Epic 3 wires real flows.
const MODAL_CONTENT = {
  training: {
    kicker: 'Training Room',
    title: 'HEAVY BAG',
    desc: "Spend taps and free XP to upgrade your fighter's branches. Tap repeatedly to gain currency between matches.",
  },
  matchmaking: {
    kicker: 'PvP Matchmaking',
    title: 'TERMINAL',
    desc: 'Search for a real opponent in your ELO range. Real-time WebSocket combat. ±100 by default, expands over time.',
  },
  create: {
    kicker: 'Create Fighter',
    title: 'NEW FIGHTER',
    desc: 'Design a new fighter archetype. Spin up stats and colours.',
  },
  ratings: {
    kicker: 'Leaderboard',
    title: 'RATINGS',
    desc: 'Top clubs and fighters of the season.',
  },
  clan: {
    kicker: 'Your Clan',
    title: 'CLAN',
    desc: 'Manage your clan, agents, and shared resources.',
  },
  shop: {
    kicker: 'Cosmetics',
    title: 'LOCKER',
    desc: 'Buy skins, gloves, banners. Coming soon.',
  },
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
  avatar: {
    kicker: 'Profile',
    title: 'YOUR PROFILE',
    desc: 'Account, wallet, skins, progression. Coming soon.',
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

defineExpose({ openPhModal });
</script>

<style scoped>
.hud-pit {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
</style>
