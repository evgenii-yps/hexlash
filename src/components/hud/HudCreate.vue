<!-- Epic 3Bc — Create HUD.
     Steps 1/7: stepper + panel shell.
     Step 8: Step 1 Archetype cards (6 × ARCHETYPES, click-select,
     glow colour wiring through setArchetypeColor prop).
     Steps 9/10: Name + Confirm panels.

     NOT scoped — all rules live in v24/create.css (pattern 3Ba
     HudTraining / 3Bb HudMatchmaking). -->
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
      <!-- ===== Step 1 — Archetype (prototype 9098-9129) ===== -->
      <div v-if="createState.step === 1">
        <div class="cp-step-title">Choose Archetype</div>
        <div class="cp-step-sub">Defines your fighter&#8217;s personality</div>
        <div class="arch-list">
          <div
            v-for="a in ARCHETYPES"
            :key="a.id"
            class="arch-item"
            :class="{ selected: createState.archetypeId === a.id }"
            :style="createState.archetypeId === a.id
              ? { borderLeftColor: colorHex(a.color) }
              : {}"
            @click="selectArchetype(a.id)"
          >
            <div class="arch-icon" :style="iconStyle(a.color)">
              {{ a.short }}
            </div>
            <div class="arch-info">
              <div class="arch-name">{{ a.name }}</div>
              <div class="arch-tagline">{{ a.tagline }}</div>
              <div class="arch-stats">
                <div
                  v-for="k in STAT_KEYS"
                  :key="k"
                  class="arch-stat"
                >
                  <div class="arch-stat-label">{{ k.slice(0, 3) }}</div>
                  <div class="arch-stat-bar">
                    <div
                      class="arch-stat-fill"
                      :style="{
                        width: Math.round(a.stats[k] * 100) + '%',
                        background: colorHex(a.color),
                      }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="create-nav">
          <button class="cn-btn" disabled>Back</button>
          <button
            class="cn-btn primary"
            :disabled="!createState.archetypeId"
            @click="goToStep(2)"
          >Next</button>
        </div>
      </div>

      <!-- Step 9 — Name input + roll + chips. -->
      <!-- Step 10 — Confirm summary + Create Fighter. -->
    </div>
  </div>
</template>

<script setup>
import {
  createState,
  ARCHETYPES,
  onArchetypeChange,
} from '@/scene/interaction/useCreateState.js';

const props = defineProps({
  // Callback into CreateView that proxies to sceneApi.setArchetypeColor.
  // Non-reactive let sceneApi on the parent is hidden behind a closure
  // here, so by the time user clicks a card CreateView.onMounted has
  // already assigned the real scene and the callback fires with the
  // concrete glow.setColor under it. onArchetypeChange itself guards on
  // truthy setGlow, so a stray click before mount is a no-op.
  onArchetypeColor: { type: Function, default: null },
});

defineEmits(['back']);

const STAT_KEYS = ['aggression', 'patience', 'risk'];

// Format a 0xRRGGBB integer as '#rrggbb' (prototype 9104).
function colorHex(hex) {
  return '#' + hex.toString(16).padStart(6, '0');
}

// Icon bg/colour/border derived from archetype colour (prototype 9109).
// background: color + '22' = 13% alpha, border: color + '55' = 33% alpha.
function iconStyle(hex) {
  const c = colorHex(hex);
  return {
    background: c + '22',
    color: c,
    border: '1px solid ' + c + '55',
  };
}

function selectArchetype(id) {
  onArchetypeChange(id, { setGlow: props.onArchetypeColor });
}

function goToStep(n) {
  createState.step = n;
}
</script>
