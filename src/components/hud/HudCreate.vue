<!-- Epic 3Bc Step 1 — Create HUD stub.
     Back button + stepper placeholder. Real stepper + archetype cards +
     name panel + confirm panel land in Steps 7-10. -->
<template>
  <div class="create-hud">
    <button class="create-back" @click="$emit('back')">&larr; Back</button>
    <div class="create-stepper">
      <div class="step active">
        <span class="step-num">1</span>Archetype
      </div>
      <div class="step-sep"></div>
      <div class="step">
        <span class="step-num">2</span>Name
      </div>
      <div class="step-sep"></div>
      <div class="step">
        <span class="step-num">3</span>Confirm
      </div>
    </div>
    <div class="create-panel">
      <!-- Step-specific content lands in Steps 8/9/10. -->
    </div>
  </div>
</template>

<script setup>
defineEmits(['back']);
</script>
