<!-- Epic 3A Step 16/17 — coach pause (3 strategy buttons mid-fight).
     Styles in src/styles/v24/fight-overlays.css. -->
<template>
  <div class="coach-pause" :class="{ show: open }">
    <div class="cp-kicker">Coach &middot; Pause</div>
    <div class="cp-text">{{ text }}</div>
    <div class="cp-actions">
      <button class="cp-action" @click="$emit('select', 'aggressive')">Push Pace</button>
      <button class="cp-action" @click="$emit('select', 'defensive')">Defend</button>
      <button class="cp-action" @click="$emit('select', 'counter')">Counter</button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  open: { type: Boolean, default: false },
  text: { type: String,  default: '' },
});
defineEmits(['select']);
</script>
