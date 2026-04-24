<!-- Epic 5 — Sub-Epic 5D Step 1.
     HUD skeleton for /v2/clan — stub populated in Step 6 (markup + CSS port
     prototype 2899-3392 + 4887-4981), Step 7 (no-clan state + CreateClan
     lazy), Step 8 (in-clan roster + ClanEdit lazy + Leave confirm).
     Scoped pointer-events block ships Step 1 (lesson #12 mandatory — parent
     .clan-view sets pointer-events: none so CanvasLayer gets 3D drag events;
     each HUD re-enables on its own root). -->
<template>
  <div class="hud clan-hud">
    <!-- populated Steps 6-8 -->
  </div>
</template>

<script setup>
// populated Steps 6-8
</script>

<style scoped>
/* Wrapper-only positioning. All .clan-* / .nc-* / .ic-* styles live in
   src/styles/v24/clan.css (scoped to .app-v2). */
.hud-clan {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.hud-clan > * {
  pointer-events: auto;
}
</style>
