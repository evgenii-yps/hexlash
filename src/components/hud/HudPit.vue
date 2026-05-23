<!-- Epic 2 — pit-view hub. Step 17 origin.
     Composes the pit HUD: TopBar + WorldHint (tracks hoverState).
     5F Step 1: PhModal + MODAL_CONTENT removed entirely — last entries
     (warden / predator) were dead code never reached. PitViewV2 fighter
     clicks short-circuit to /v2/fd/:key in the catch-all fallback before
     the MODAL branch was ever evaluated. Carry-over from 5C/5D §14 + 5E §9
     deferred lists, closed in 5F. -->
<template>
  <div class="hud-pit">
    <TopBar @avatar-click="onAvatarClick" @help-click="helpOpen = true" />
    <WorldHint
      :text="hover.text"
      :x="hover.x"
      :y="hover.y"
      :visible="hover.visible"
    />
    <!-- Guest PvE entry. Guests can't use the matchmaking terminal (PvP),
         so the client-side PvE sim is surfaced as a HUD CTA. -->
    <button v-if="isGuest" class="pit-pve-btn" @click="onPveFight">
      ⚔ Fight a Bot
    </button>

    <HelpModal v-if="helpOpen" @close="helpOpen = false" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import store from '@/core/state/store.js';
import TopBar from './common/TopBar.vue';
import WorldHint from './common/WorldHint.vue';
import HelpModal from './HelpModal.vue';
import { useHoverState } from '@/scene/interaction/useHoverState.js';
import { setFightSetup } from '@/scene/interaction/useFightSetup.js';
import { ARCHETYPES } from '@/scene/interaction/useCreateState.js';

const hover = useHoverState();
const helpOpen = ref(false);

const isGuest = computed(() => store.getters['master/getIsGuest']);

// Avatar-btn is a DOM HUD element (not a 3D-raycastable target), so its click
// never reaches PitViewV2's useClickState watcher. TopBar emits @avatar-click
// → route to /v2/profile directly. (Sub-Epic 5B hot-fix 10.1.)
const router = useRouter();
function onAvatarClick() {
  router.push('/play/profile');
}

// Guest PvE — seed the fight with the guest's archetype vs a random bot, then
// open the client-side mock fight (FightView with no pvp match → simulation).
function onPveFight() {
  const session = store.getters['master/getGuestSession'];
  const myArch = ARCHETYPES.find((a) => a.id === session?.archetypeId);
  const botArch = ARCHETYPES[Math.floor(Math.random() * ARCHETYPES.length)];
  setFightSetup({
    leftName: 'You',
    leftArch: myArch?.name || '',
    rightName: 'Bot',
    rightArch: botArch?.name || 'Predator',
  });
  router.push('/play/fight');
}
</script>

<style scoped>
.hud-pit {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* Guest PvE CTA — bottom-center. Single pink accent (the guest's primary
   action in the hub). pointer-events:auto to be clickable through the
   pointer-events:none HUD root. */
.pit-pve-btn {
  position: fixed;
  left: 50%;
  bottom: 28px;
  transform: translateX(-50%);
  padding: 14px 28px;
  background: var(--hex-primary);
  border: none;
  border-radius: 6px;
  color: var(--hex-bg-dark, #090909);
  font-family: var(--font-mono, monospace);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  cursor: pointer;
  pointer-events: auto;
  z-index: 60;
  transition: filter 0.15s, transform 0.1s;
}
.pit-pve-btn:hover {
  filter: brightness(1.08);
}
.pit-pve-btn:active {
  transform: translateX(-50%) scale(0.97);
}
</style>
