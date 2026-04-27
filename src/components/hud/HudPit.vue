<!-- Epic 2 — pit-view hub. Step 17 origin.
     Composes the pit HUD: TopBar + WorldHint (tracks hoverState).
     5F Step 1: PhModal + MODAL_CONTENT removed entirely — last entries
     (warden / predator) were dead code never reached. PitViewV2 fighter
     clicks short-circuit to /v2/fd/:key in the catch-all fallback before
     the MODAL branch was ever evaluated. Carry-over from 5C/5D §14 + 5E §9
     deferred lists, closed in 5F. -->
<template>
  <div class="hud-pit">
    <TopBar @avatar-click="onAvatarClick" />
    <WorldHint
      :text="hover.text"
      :x="hover.x"
      :y="hover.y"
      :visible="hover.visible"
    />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import TopBar from './common/TopBar.vue';
import WorldHint from './common/WorldHint.vue';
import { useHoverState } from '@/scene/interaction/useHoverState.js';

const hover = useHoverState();

// Avatar-btn is a DOM HUD element (not a 3D-raycastable target), so its click
// never reaches PitViewV2's useClickState watcher. TopBar emits @avatar-click
// → route to /v2/profile directly. (Sub-Epic 5B hot-fix 10.1.)
const router = useRouter();
function onAvatarClick() {
  router.push('/v2/profile');
}
</script>

<style scoped>
.hud-pit {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
</style>
