<!-- Sub-epic 5 — Matchmaking HUD.
     Phase enum: 'searching' | 'found' | 'timeout' (C1 migration).
     Filter sidebar (.mm-filters) v-if="false" — preserved markup + CSS для
     future BE work (carry-over #29 — BE doesn't accept archetype/belt/eloDelta
     queue params; revival = remove v-if="false").
     `.mm-found` placeholder C8 (countdown UI lands там).
     `.mm-timeout` placeholder C7 (retry/back UI lands там).
     Real timer / queue size / online count displays land в C9/C10.
     Styles в src/styles/v24/matchmaking.css (shared, not scoped). -->
<template>
  <div class="matchmaking-hud">
    <button class="mm-back" @click="onBack">&larr; Back</button>

    <div class="mm-title">
      <div class="mmt-kicker">Matchmaking</div>
      <div class="mmt-name">FIND OPPONENT</div>
    </div>

    <!-- Filter sidebar hidden in Sub-epic 5 — BE doesn't accept these as queue
         params (carry-over #29). Markup + CSS preserved для future revival. -->
    <div class="mm-filters" v-if="false">
      <div class="mmf-title">Filters</div>

      <div class="mmf-block">
        <div class="mmf-label">ELO Range (&plusmn; from yours)</div>
        <div class="mmf-range-values">
          <span>&plusmn;{{ mmState.eloDelta }}</span>
          <span>&plusmn;{{ mmState.eloDelta }}</span>
        </div>
        <input
          type="range"
          class="mmf-slider"
          min="25" max="400" step="25"
          :value="mmState.eloDelta"
        />
      </div>

      <div class="mmf-block">
        <div class="mmf-label">Archetype</div>
        <div class="mmf-chips">
          <button
            v-for="arch in archOptions"
            :key="arch.id"
            class="mmf-chip"
            :class="{ active: mmState.archFilter === arch.id }"
            @click="mmState.archFilter = arch.id"
          >{{ arch.label }}</button>
        </div>
      </div>

      <div class="mmf-block">
        <div class="mmf-label">Belt</div>
        <div class="mmf-chips">
          <button
            v-for="belt in beltOptions"
            :key="belt.id"
            class="mmf-chip"
            :class="{ active: mmState.beltFilter === belt.id }"
            @click="mmState.beltFilter = belt.id"
          >{{ belt.label }}</button>
        </div>
      </div>
    </div>

    <div class="mm-main">
      <!-- Phase: searching -->
      <div v-if="mmState.phase === 'searching'" class="mm-search">
        <div class="mms-kicker">Scanning the grid</div>
        <div class="mms-title">SEARCHING</div>
        <div class="mm-spinner"></div>
        <div class="mms-status">
          Scanning opponents in ELO
          <strong>{{ formatElo(myElo - mmState.eloDelta) }} &mdash; {{ formatElo(myElo + mmState.eloDelta) }}</strong>
        </div>
        <!-- Sub-epic 5 C9 will add: search timer (mm:ss) + queue size display -->
        <button class="mms-cancel" @click="onCancel">Cancel Search</button>
      </div>

      <!-- Phase: found — Sub-epic 5 C8 fills VS display + countdown -->
      <div v-if="mmState.phase === 'found'" class="mm-found">
        <!-- C8 — VS block (own captain + opponent + countdown) -->
      </div>

      <!-- Phase: timeout — Sub-epic 5 C7 fills "No players found" + retry/back -->
      <div v-if="mmState.phase === 'timeout'" class="mm-timeout">
        <!-- C7 — timeout UI + retry/back buttons -->
      </div>
    </div>
  </div>
</template>

<script setup>
import { mmState, myElo } from '@/scene/interaction/useMatchmakingState.js';

const emit = defineEmits(['back', 'cancel']);

// Filter options preserved для future BE work (carry-over #29) — markup
// hidden via v-if="false" until BE supports archetype/belt/eloDelta queue params.
const archOptions = [
  { id: 'any', label: 'Any' },
  { id: 'pre', label: 'Predator' },
  { id: 'ana', label: 'Analyst' },
  { id: 'gho', label: 'Ghost' },
  { id: 'sen', label: 'Sentinel' },
  { id: 'mav', label: 'Maverick' },
  { id: 'jug', label: 'Juggernaut' },
];

const beltOptions = [
  { id: 'any',    label: 'Any' },
  { id: 'White',  label: 'White' },
  { id: 'Yellow', label: 'Yellow' },
  { id: 'Orange', label: 'Orange' },
  { id: 'Green',  label: 'Green' },
];

function formatElo(n) { return n.toLocaleString(); }

function onBack()   { emit('back'); }
function onCancel() { emit('cancel'); }
</script>

<style scoped>
.matchmaking-hud {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 50;
  color: #fff;
}
</style>
