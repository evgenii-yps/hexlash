<!-- Epic 3Bb Step 6 — Matchmaking HUD.
     1-to-1 port of prototype HTML 4822-4884. Reactive bindings against
     mmState; styles in src/styles/v24/matchmaking.css (shared, no scoped
     CSS). Phase wiring, filter watchers and candidate rendering arrive in
     Steps 7-9. -->
<template>
  <div class="matchmaking-hud">
    <button class="mm-back" @click="onBack">&larr; Back</button>

    <div class="mm-title">
      <div class="mmt-kicker">Matchmaking</div>
      <div class="mmt-name">FIND OPPONENT</div>
    </div>

    <div class="mm-filters">
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
          @input="onEloChange"
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
      <div v-if="mmState.phase === 'search'" class="mm-search">
        <div class="mms-kicker">Scanning the grid</div>
        <div class="mms-title">SEARCHING</div>
        <div class="mm-spinner"></div>
        <div class="mms-status">
          Scanning opponents in ELO
          <strong>{{ formatElo(myElo - mmState.eloDelta) }} &mdash; {{ formatElo(myElo + mmState.eloDelta) }}</strong>
        </div>
        <div class="mms-progress-text">{{ mmState.searchProgress }} candidates found</div>
        <button class="mms-cancel" @click="onCancel">Cancel Search</button>
      </div>

      <!-- Phase: results -->
      <template v-if="mmState.phase === 'results'">
        <div class="mm-candidates-header">
          <strong>{{ mmState.candidates.length }}</strong> opponents matched &middot; click a card to challenge
        </div>
        <div class="mm-candidates">
          <div
            v-for="(c, idx) in mmState.candidates"
            :key="idx"
            class="mm-card"
            :class="{ selected: mmState.selected === idx }"
            @click="mmState.selected = idx"
          >
            <div class="mmc-head">
              <div
                class="mmc-avatar"
                :style="{ borderColor: c.arch.colorHex + '55', color: c.arch.colorHex }"
              >{{ c.initials }}</div>
              <div class="mmc-info">
                <div class="mmc-name">{{ c.name }}</div>
                <div class="mmc-arch" :style="{ color: c.arch.colorHex }">{{ c.arch.name }}</div>
              </div>
              <div class="mmc-diff" :class="c.diffClass">{{ c.diffLabel }}</div>
            </div>
            <div class="mmc-stats">
              <div class="mmc-stat">
                <div class="mmc-stat-val gold">{{ c.elo.toLocaleString() }}</div>
                <div class="mmc-stat-label">ELO</div>
              </div>
              <div class="mmc-stat">
                <div class="mmc-stat-val">{{ c.wins }}/{{ c.losses }}</div>
                <div class="mmc-stat-label">W/L</div>
              </div>
              <div class="mmc-stat">
                <div class="mmc-stat-val">{{ c.wr }}%</div>
                <div class="mmc-stat-label">WR</div>
              </div>
              <div class="mmc-stat">
                <div class="mmc-stat-val">{{ c.streak.n }}{{ c.streak.kind }}</div>
                <div class="mmc-stat-label">Strk</div>
              </div>
            </div>
          </div>
        </div>
        <div class="mm-actions">
          <button class="mma-btn" @click="onRescan">Rescan</button>
          <button
            class="mma-btn primary"
            :disabled="mmState.selected === null"
            @click="onFight"
          >Start Fight</button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { mmState, myElo } from '@/scene/interaction/useMatchmakingState.js';

const emit = defineEmits(['back', 'cancel', 'rescan', 'fight', 'elo-change']);

// Filter options — static. Ids match mmState.archFilter/beltFilter values
// the search screen expects; 'any' is the default wildcard.
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
function onRescan() { emit('rescan'); }
function onFight()  { emit('fight'); }
function onEloChange(e) { emit('elo-change', parseInt(e.target.value, 10)); }
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
