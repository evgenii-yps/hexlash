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
        <!-- Sub-epic 5 C9 — search timer (mm:ss) + queue size display.
             Holistic rework: dropped static ELO range line (mmState.eloDelta
             never changes — filter hidden via v-if=false in C3, BE actually
             auto-expands range from 300→1000 separately per Phase 0 Q2.3). -->
        <div class="mms-status">{{ formattedSearchTime }}</div>
        <div class="mms-progress-text">{{ mmState.queueSize }} in queue</div>
        <button class="mms-cancel" @click="onCancel">Cancel Search</button>
      </div>

      <!-- Phase: found — VS display + 3-second countdown (carry-over #17 closure) -->
      <div v-if="mmState.phase === 'found'" class="mm-found">
        <div class="mm-found-kicker">Opponent matched</div>
        <div class="mm-found-vs">
          <div class="mm-found-fighter">
            <div class="mm-found-avatar">
              <img :src="captainSkinUrl" :alt="captainName"/>
            </div>
            <div class="mm-found-name">{{ captainName }}</div>
            <div class="mm-found-elo">{{ formatElo(captainElo) }}</div>
          </div>
          <div class="mm-found-divider">VS</div>
          <div class="mm-found-fighter">
            <div class="mm-found-avatar">
              <img :src="opponentSkinUrl" :alt="opponentName"/>
            </div>
            <div class="mm-found-name">{{ opponentName }}</div>
            <div class="mm-found-elo">{{ formatElo(opponentElo) }}</div>
          </div>
        </div>
        <div class="mm-found-countdown">
          <span class="mm-found-countdown-label">Fight starts in</span>
          <span class="mm-found-countdown-value">{{ mmState.countdown }}</span>
        </div>
      </div>

      <!-- Phase: timeout — "No players found" + retry/back actions -->
      <div v-if="mmState.phase === 'timeout'" class="mm-timeout">
        <div class="mm-timeout-kicker">Search timeout</div>
        <div class="mm-timeout-title">NO PLAYERS FOUND</div>
        <div class="mm-timeout-status">
          No opponents matched within the search window. Retry to expand search OR
          return to the hub.
        </div>
        <div class="mm-timeout-actions">
          <button class="mm-timeout-btn" @click="onBack">Back to Hub</button>
          <button class="mm-timeout-btn primary" @click="onRetry">Retry Search</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
// Sub-epic 5 C9 — myElo import dropped (orphan after ELO range display
// removal в .mm-search rework). Re-import on filter sidebar revival per
// carry-over #29 (BE doesn't accept eloDelta queue param yet).
import { mmState } from '@/scene/interaction/useMatchmakingState.js';

const store = useStore();

const emit = defineEmits(['back', 'cancel', 'retry']);

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

function formatElo(n) { return Number(n || 0).toLocaleString(); }

// Sub-epic 5 C9 — search time mm:ss display. Mirror v1 formattedTime
// pattern (MatchmakingView.vue:149-153) — padStart(2, '0') zero-padded
// minutes + seconds. Reads mmState.searchTime (incremented 1Hz by C4
// searchTimer, stopped on match-found/timeout/cancel/unmount).
const formattedSearchTime = computed(() => {
  const total = mmState.searchTime || 0;
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
});

// Sub-epic 5 C8 — VS display computed bindings. master.userData.captain is
// a sub-object {id, name, skin, belt, qualifiedWins, isHexmaster, elo} per
// CLAUDE.md "Captain in Public UI" + CAPTAIN_PUBLIC_SELECT.
// MatchFoundMsg.opponent shape: {odId, username, rating, skin, avatarUrl}.
// Field name asymmetry (captain.name vs opponent.username, captain.elo vs
// opponent.rating) — normalised here for template simplicity.
const userData = computed(() => store.getters['master/getMaster']?.userData);
const captainName = computed(() => userData.value?.captain?.name || userData.value?.name || 'You');
const captainElo  = computed(() => userData.value?.captain?.elo || 1000);
const captainSkinUrl = computed(() => {
  const skin = userData.value?.captain?.skin || userData.value?.skin || 'skin_m_1.png';
  return `/images/skins/${skin}`;
});
const opponentName = computed(() => mmState.matchData?.opponent?.username || 'Opponent');
const opponentElo  = computed(() => mmState.matchData?.opponent?.rating || 1000);
const opponentSkinUrl = computed(() => {
  const skin = mmState.matchData?.opponent?.skin || 'skin_m_1.png';
  return `/images/skins/${skin}`;
});

function onBack()   { emit('back'); }
function onCancel() { emit('cancel'); }
function onRetry()  { emit('retry'); }
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
