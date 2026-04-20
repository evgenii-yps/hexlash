<!-- Epic 3A Step 16 — simplified prep overlay (VS + strategy + Start).
     No deck builder / stakes (those live in Epic 4). Styles in
     src/styles/v24/fight-overlays.css. -->
<template>
  <div class="phase-overlay prep-overlay" :class="{ show: open }">
    <div class="phase-card prep-card">
      <div class="pc-kicker">Card Fight &middot; Preparation</div>
      <div class="pc-title">PREPARATION</div>
      <div class="pc-vs">
        <div class="pc-side left">
          <div class="pcs-name">{{ leftName }}</div>
          <div class="pcs-arch">{{ leftArch }}</div>
        </div>
        <div class="pc-vs-sep">VS</div>
        <div class="pc-side right">
          <div class="pcs-name">{{ rightName }}</div>
          <div class="pcs-arch">{{ rightArch }}</div>
        </div>
      </div>

      <div class="prep-section">
        <div class="prep-section-title"><span>Strategy</span></div>
        <div class="prep-strategies">
          <div
            v-for="s in STRATS"
            :key="s.id"
            class="strat-card"
            :class="{ selected: strat === s.id }"
            @click="strat = s.id"
          >
            <div class="sc-name">{{ s.name }}</div>
            <div class="sc-eff" v-html="s.eff"></div>
          </div>
        </div>
      </div>

      <div class="pc-footer">
        <div class="pc-footer-actions">
          <button class="pc-btn pc-btn-secondary" @click="$emit('cancel')">Cancel</button>
          <button class="pc-btn" @click="$emit('start', strat)">Start Fight</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
  open:       { type: Boolean, default: false },
  leftName:   { type: String,  default: 'FIGHTER #1' },
  leftArch:   { type: String,  default: '' },
  rightName:  { type: String,  default: 'FIGHTER #2' },
  rightArch:  { type: String,  default: '' },
});
defineEmits(['cancel', 'start']);

const STRATS = [
  {
    id: 'aggressive',
    name: 'Aggressive',
    eff: '<span class="ef-plus">+10% hit chance</span> / <span class="ef-minus">\u221215% stamina</span>',
  },
  {
    id: 'balanced',
    name: 'Balanced',
    eff: 'Default rates. No modifiers.',
  },
  {
    id: 'defensive',
    name: 'Defensive',
    eff: '<span class="ef-plus">+15% evasion</span> / <span class="ef-minus">\u22128% damage</span>',
  },
];

const strat = ref('balanced');
</script>
