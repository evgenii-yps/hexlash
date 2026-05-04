<!-- Sub-Epic 5N — Spectate Flag (Path α Mock Port).
     HUD overlay for /v2/spectate/:fightId. Port от legacy SpectateView.vue
     (572 lines client-side mock). NO backend wiring — pure mock simulation
     via setInterval + Math.random per Path α discipline.

     Conventions (lesson #22 + #34):
     - Template root class .spectate-hud — scoped style match per #22.
     - Container = position: absolute; inset: 0; pointer-events: none
       (mirror .shop-hud / .detail-hud convention).
     - Interactive children = position: fixed + pointer-events: auto.
     - Backend integration deferred к dedicated PvP-integration sub-epic
       (3rd time mentioned в CLAUDE.md — 5C item #1, 5C item #11, 5J/5K). -->
<template>
  <div class="hud spectate-hud">
    <button class="sp-back" @click="onLeave">&larr; {{ t.spectate.leave }}</button>

    <div class="sp-header">
      <div class="sp-kicker">{{ t.spectate.title }}</div>
      <div class="sp-spec-count">
        <span class="sp-spec-dot"></span>
        {{ spectatorCount }} {{ t.spectate.spectators }}
      </div>
    </div>

    <div class="sp-round-badge">
      {{ t.spectate.round }} {{ currentRound }} / {{ MAX_ROUNDS }}
    </div>

    <div class="sp-fighters">
      <div class="sp-fighter sp-fighter--friend">
        <div class="sp-fname">{{ friendName }}</div>
        <div class="sp-hp-bar">
          <div class="sp-hp-fill sp-hp-fill--friend" :style="{ width: friendHpPct + '%' }"></div>
        </div>
        <div class="sp-hp-num">{{ friendHp }} / {{ MAX_HP }}</div>
      </div>

      <div class="sp-vs">VS</div>

      <div class="sp-fighter sp-fighter--opponent">
        <div class="sp-fname">{{ opponentName }}</div>
        <div class="sp-hp-bar">
          <div class="sp-hp-fill sp-hp-fill--opponent" :style="{ width: opponentHpPct + '%' }"></div>
        </div>
        <div class="sp-hp-num">{{ opponentHp }} / {{ MAX_HP }}</div>
      </div>
    </div>

    <div class="sp-log">
      <div class="sp-log-header">{{ t.spectate.fightLog }}</div>
      <div class="sp-log-list" ref="logListRef">
        <div
          v-for="(entry, i) in fightLog"
          :key="i"
          class="sp-log-entry"
          :class="{ 'sp-log-crit': entry.critical }"
        >
          <span class="sp-log-round">R{{ entry.round }}</span>
          <span
            class="sp-log-actor"
            :class="entry.side === 'friend' ? 'sp-actor--friend' : 'sp-actor--opp'"
          >{{ entry.actor }}</span>
          <span class="sp-log-action">{{ t.spectate.uses }} {{ entry.move }}</span>
          <span class="sp-log-damage">-{{ entry.damage }}</span>
          <span v-if="entry.critical" class="sp-log-crit-badge">{{ t.spectate.critical }}</span>
        </div>
        <div v-if="fightLog.length === 0" class="sp-log-empty">...</div>
      </div>
    </div>

    <div v-if="fightOver" class="sp-result" :class="resultClass">
      <div class="sp-result-text">{{ resultText }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { t } from '@/locales/index.js';

// Sub-epic 6 C8 — mock simulation gut. Real BE state binding wired в C9.
// Imports nextTick / onMounted / onBeforeUnmount removed (only used by deleted
// mock simulation code). C9 will re-add lifecycle hooks для state binding init.
const MAX_HP = 100;
const MAX_ROUNDS = 10;

const route = useRoute();
const router = useRouter();
const store = useStore();

// Mock fighter identity — friend lookup if route.params.fightId matches a friend id.
// Falls back to generic name otherwise (direct URL access).
const fightId = computed(() => route.params.fightId);
const friend = computed(() => {
  const friends = store.getters['friends/getFriends'] || [];
  return friends.find((f) => f.id === fightId.value);
});
const friendName = computed(() => friend.value?.username || 'Fighter');
const opponentName = ref(route.query.odName || 'Opponent');

// Fight state.
const friendHp = ref(MAX_HP);
const opponentHp = ref(MAX_HP);
const currentRound = ref(0);
const fightLog = ref([]);
const fightOver = ref(false);
const winner = ref(null);
const spectatorCount = ref(0); // Sub-epic 6 C8 — reset from mock random; C9 wires SpectatorListMsg binding

const friendHpPct = computed(() => Math.max(0, (friendHp.value / MAX_HP) * 100));
const opponentHpPct = computed(() => Math.max(0, (opponentHp.value / MAX_HP) * 100));

const logListRef = ref(null);

const resultClass = computed(() => {
  if (!winner.value) return '';
  return winner.value === 'friend' ? 'sp-result--win' : 'sp-result--loss';
});

const resultText = computed(() => {
  if (!winner.value) return '';
  const winnerName = winner.value === 'friend' ? friendName.value : opponentName.value;
  return `${winnerName} ${t.value.spectate.wins}!`;
});

// Sub-epic 6 C8 — mock simulation logic gutted. Removed:
// - pickMove / rollDamage / rollCrit (mock helpers)
// - applyExchange (mock damage calc)
// - simulateRound (mock setInterval round loop)
// - endFight (mock fight termination — distinct from BE fight_end event handler
//   which will be wired в C9 onSpectateFightEnd from SpectateView listener chain)
// - simInterval variable + setInterval/clearInterval lifecycle
// - MOVE_NAMES constant + TICK_MS constant
// - onMounted / onBeforeUnmount hooks (mock-only — C9 re-adds for state binding init)
//
// KEPT: template structure, all reactive state refs (HP/rounds/log/result/spectatorCount),
// computed values (friendName/opponentName/friendHpPct/opponentHpPct/resultClass/resultText),
// logListRef, onLeave (used by .sp-back template binding), all .sp-* CSS classes.
//
// C9 will wire real BE state binding via shared composable (likely useSpectateState)
// mirror Sub-epic 5 MatchmakingView/mmState pattern. SpectateView listener stubs
// (per C7) will be replaced с composable mutations.

function onLeave() {
  router.push('/v2');
}
</script>

<style scoped>
/* Container — Lesson #22 + #34 convention.
   pointer-events: none lets 3D under stay clickable, children opt-in. */
.spectate-hud {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 60;
  color: #fff;
  font-family: var(--font-mono, 'JetBrains Mono', monospace);
}

.sp-back {
  position: fixed;
  top: 14px; left: 14px;
  pointer-events: auto;
  background: var(--bg-panel, rgba(20, 20, 28, 0.85));
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  padding: 8px 14px;
  color: var(--text-mid, #d8d8e0);
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.sp-back:hover {
  background: rgba(40, 40, 50, 0.95);
  border-color: var(--hex-primary, #ff066f);
  color: var(--hex-primary, #ff066f);
}

.sp-back:active { transform: scale(0.97); }

.sp-header {
  position: fixed;
  top: 18px; left: 50%;
  transform: translateX(-50%);
  pointer-events: auto;
  text-align: center;
}

.sp-kicker {
  font-family: var(--font-display, 'Archivo Black', sans-serif);
  font-size: 16px;
  letter-spacing: 2px;
  color: var(--hex-primary, #ff066f);
  text-shadow: 0 0 8px rgba(255, 6, 111, 0.6);
}

.sp-spec-count {
  margin-top: 4px;
  font-size: 10px;
  color: var(--text-dim, #9999a3);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.sp-spec-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #4ade80;
  box-shadow: 0 0 6px #4ade80;
  animation: spDotPulse 1.5s infinite;
}

@keyframes spDotPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.sp-round-badge {
  position: fixed;
  top: 70px; left: 50%;
  transform: translateX(-50%);
  pointer-events: auto;
  background: var(--bg-panel, rgba(20, 20, 28, 0.85));
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 11px;
  letter-spacing: 1px;
  color: var(--text-mid, #d8d8e0);
}

.sp-fighters {
  position: fixed;
  top: 120px; left: 50%;
  transform: translateX(-50%);
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 18px;
  width: min(560px, calc(100vw - 32px));
}

.sp-fighter {
  flex: 1;
  background: var(--bg-panel, rgba(20, 20, 28, 0.85));
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 10px 12px;
}

.sp-fighter--friend { border-left: 3px solid #4ade80; }
.sp-fighter--opponent { border-right: 3px solid #ef4444; }

.sp-fname {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 6px;
  color: var(--text-mid, #fff);
}

.sp-hp-bar {
  height: 8px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 4px;
  overflow: hidden;
}

.sp-hp-fill {
  height: 100%;
  transition: width 0.4s ease-out;
}

.sp-hp-fill--friend {
  background: linear-gradient(90deg, #4ade80, #22c55e);
}

.sp-hp-fill--opponent {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

.sp-hp-num {
  margin-top: 4px;
  font-size: 10px;
  color: var(--text-dim, #9999a3);
  text-align: right;
  font-family: var(--font-mono, monospace);
}

.sp-vs {
  font-family: var(--font-display, 'Archivo Black', sans-serif);
  font-size: 14px;
  color: var(--text-dim, #9999a3);
  letter-spacing: 1px;
}

.sp-log {
  position: fixed;
  bottom: 16px; left: 50%;
  transform: translateX(-50%);
  pointer-events: auto;
  width: min(560px, calc(100vw - 32px));
  max-height: 220px;
  background: var(--bg-panel, rgba(20, 20, 28, 0.9));
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}

.sp-log-header {
  padding: 8px 12px;
  font-size: 9px;
  letter-spacing: 1px;
  color: var(--text-dim, #9999a3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.sp-log-list {
  flex: 1;
  overflow-y: auto;
  padding: 6px 12px;
  font-size: 11px;
}

.sp-log-empty {
  text-align: center;
  color: var(--text-dim, #555);
  padding: 12px 0;
}

.sp-log-entry {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.sp-log-entry:last-child { border-bottom: none; }

.sp-log-round {
  color: var(--text-dim, #9999a3);
  min-width: 28px;
}

.sp-log-actor { font-weight: 600; }
.sp-actor--friend { color: #4ade80; }
.sp-actor--opp { color: #ef4444; }

.sp-log-action { color: var(--text-mid, #d8d8e0); flex: 1; }

.sp-log-damage {
  color: var(--hex-primary, #ff066f);
  font-weight: 600;
}

.sp-log-crit-badge {
  background: var(--hex-primary, #ff066f);
  color: #000;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.sp-log-crit { background: rgba(255, 6, 111, 0.06); }

.sp-result {
  position: fixed;
  inset: 0;
  pointer-events: auto;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 70;
  animation: spResultFade 0.3s ease-out;
}

@keyframes spResultFade {
  from { opacity: 0; }
  to { opacity: 1; }
}

.sp-result-text {
  font-family: var(--font-display, 'Archivo Black', sans-serif);
  font-size: 22px;
  letter-spacing: 1.5px;
  padding: 18px 32px;
  border-radius: 10px;
  text-align: center;
}

.sp-result--win .sp-result-text {
  background: rgba(74, 222, 128, 0.15);
  border: 2px solid #4ade80;
  color: #4ade80;
}

.sp-result--loss .sp-result-text {
  background: rgba(239, 68, 68, 0.15);
  border: 2px solid #ef4444;
  color: #ef4444;
}

@media (max-width: 720px) {
  .sp-fighters { flex-direction: column; gap: 10px; top: 110px; }
  .sp-vs { font-size: 11px; }
  .sp-fighter--friend { border-left: none; border-top: 3px solid #4ade80; }
  .sp-fighter--opponent { border-right: none; border-top: 3px solid #ef4444; }
  .sp-log { max-height: 30vh; }
}
</style>
