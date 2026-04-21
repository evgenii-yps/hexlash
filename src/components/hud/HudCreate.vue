<!-- Epic 3Bc Step 7 — Create HUD.
     Back button + 3-step stepper + empty panel (Steps 8/9/10 populate
     per-step content). Reactive bindings against createState from
     useCreateState (seeded in Step 1, ARCHETYPES + step/archetypeId/
     name/materializing). NOT scoped — all rules live in
     v24/create.css (pattern 3Ba HudTraining / 3Bb HudMatchmaking). -->
<template>
  <div class="create-hud">
    <button class="create-back" @click="$emit('back')">&larr; Back</button>

    <div class="create-stepper">
      <div
        class="step"
        :class="{
          active: createState.step === 1,
          done:   createState.step > 1,
        }"
      >
        <span class="step-num">1</span>Archetype
      </div>
      <div class="step-sep"></div>
      <div
        class="step"
        :class="{
          active: createState.step === 2,
          done:   createState.step > 2,
        }"
      >
        <span class="step-num">2</span>Name
      </div>
      <div class="step-sep"></div>
      <div class="step" :class="{ active: createState.step === 3 }">
        <span class="step-num">3</span>Confirm
      </div>
    </div>

    <div class="create-panel">
      <!-- Step 8 — Archetype cards.
           Step 9 — Name input + roll + chips.
           Step 10 — Confirm summary + Create Fighter. -->
    </div>
  </div>
</template>

<script setup>
import { createState } from '@/scene/interaction/useCreateState.js';

defineEmits(['back']);
</script>
