<!-- Epic 5 — Sub-Epic 5D Step 1.
     Clan view stub — Step 1 ships a minimal orchestrator so the route + HUD
     mount are wired and the Esc/Back escape hatch works. Later steps wire the
     ClanScene (Step 2-4), lazy scene lifecycle (Step 5), 2-state HUD + CSS
     port (Step 6), no-clan browse + CreateClan lazy (Step 7), in-clan roster
     + ClanEdit lazy + Leave confirm (Step 8).
     Source: prototype hexlash_v24.html lines 10860-10998 (openClan + HUD). -->
<template>
  <div class="clan-view">
    <HudClan />
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import HudClan from '@/components/hud/HudClan.vue';

const router = useRouter();

function onKeydown(e) {
  if (e.key === 'Escape') router.push('/v2');
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
});
</script>

<style scoped>
.clan-view {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 50;
}
</style>
