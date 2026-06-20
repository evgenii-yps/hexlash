<!-- DevFighterLabView — thin host for the dev fighter laboratory (/dev/lab).
     Reachable by direct URL only; not linked from any in-app menu. The lab itself
     (FighterLabScene) is self-contained (own renderer / camera / podium). -->
<template>
  <FighterLabScene />
</template>

<script setup>
import FighterLabScene from '@/scene/FighterLabScene.vue';
</script>
