<!-- Epic 5 — Sub-Epic 5E Step 1 — stub.
     Step 4 will fill: title / balance chips / 6 tabs / item grid / detail panel
     / purchase flow. Root class .shop-hud is mandatory match per lesson #22 —
     scoped style block below targets the same selector. -->
<template>
  <div class="hud shop-hud">
    <button class="shop-back" @click="$emit('back')">← Back</button>
  </div>
</template>

<script setup>
defineEmits(['back']);
</script>

<style scoped>
.shop-hud {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.shop-hud > * {
  pointer-events: auto;
}
</style>
