<template>
  <div class="background background-spectate">
    <div class="spectate-container">
      <div class="spectate-content-wrapper">

        <!-- Header -->
        <div class="spectate-header">
          <div class="spectate-icon">&#x1F441;&#xFE0F;</div>
          <h1 class="spectate-title">{{ t.spectate.title }}</h1>
          <div class="spectator-count">
            <span class="spectator-dot"></span>
            {{ spectatorCount }} {{ t.spectate.spectators }}
          </div>
        </div>

        <!-- Round -->
        <div class="round-badge">
          {{ t.spectate.round }} {{ currentRound }} / {{ maxRounds }}
        </div>

        <!-- Fighters -->
        <div class="fighters-row">
          <!-- Friend (left) -->
          <div class="fighter-card fighter-friend">
            <div class="fighter-name">{{ friendName }}</div>
            <div class="fighter-hp-bar">
              <div class="hp-fill hp-fill-friend" :style="{ width: friendHpPct + '%' }"></div>
            </div>
            <div class="hp-text">{{ friendHp }} / {{ maxHp }}</div>
          </div>

          <div class="vs-divider">VS</div>

          <!-- Opponent (right) -->
          <div class="fighter-card fighter-opponent">
            <div class="fighter-name">{{ opponentName }}</div>
            <div class="fighter-hp-bar">
              <div class="hp-fill hp-fill-opponent" :style="{ width: opponentHpPct + '%' }"></div>
            </div>
            <div class="hp-text">{{ opponentHp }} / {{ maxHp }}</div>
          </div>
        </div>

        <!-- Fight Log -->
        <div class="log-section">
          <div class="log-header">{{ t.spectate.fightLog }}</div>
          <div class="log-list" ref="logListRef">
            <div
              v-for="(entry, i) in fightLog"
              :key="i"
              class="log-entry"
              :class="{ 'log-crit': entry.critical }"
            >
              <span class="log-round">R{{ entry.round }}</span>
              <span class="log-actor" :class="entry.side === 'friend' ? 'actor-friend' : 'actor-opponent'">
                {{ entry.actor }}
              </span>
              <span class="log-action">{{ t.spectate.uses }} {{ entry.move }}</span>
              <span class="log-damage">-{{ entry.damage }}</span>
              <span v-if="entry.critical" class="log-crit-badge">{{ t.spectate.critical }}</span>
            </div>
            <div v-if="fightLog.length === 0" class="log-empty">...</div>
          </div>
        </div>

        <!-- Result -->
        <div v-if="fightOver" class="result-banner" :class="resultClass">
          <div class="result-text">{{ resultText }}</div>
        </div>

        <!-- Leave button -->
        <button class="leave-btn" @click="goBack">
          &larr; {{ t.spectate.leave }}
        </button>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import router from '@/router/index.js';
import store from '@/core/state/store.js';
import { t } from '@/locales/index.js';

const route = useRoute();

const maxHp = 100;
const maxRounds = 10;

// Fighter names
const friendId = route.params.odId;
const opponentName = ref(route.query.odName || 'Opponent');

const friendData = computed(() => store.getters['friends/getFriends'].find(f => f.id === friendId));
const friendName = computed(() => friendData.value?.username || 'Fighter');

// Fight state
const friendHp = ref(maxHp);
const opponentHp = ref(maxHp);
const currentRound = ref(0);
const fightLog = ref([]);
const fightOver = ref(false);
const winner = ref(null);

const friendHpPct = computed(() => Math.max(0, (friendHp.value / maxHp) * 100));
const opponentHpPct = computed(() => Math.max(0, (opponentHp.value / maxHp) * 100));

// Spectator count (mock)
const spectatorCount = ref(Math.floor(Math.random() * 8) + 2);

const logListRef = ref(null);

// Move names for log
const moveNames = [
  'Jab', 'Hook', 'Uppercut', 'Cross', 'Straight',
  'Combo', 'Counter', 'Block Strike', 'Feint', 'Rapid Fire'
];

const resultClass = computed(() => {
  if (!winner.value) return '';
  return winner.value === 'friend' ? 'result-win' : 'result-loss';
});

const resultText = computed(() => {
  if (!winner.value) return '';
  if (winner.value === 'friend') return `${friendName.value} ${t.value.spectate.wins}!`;
  return `${opponentName.value} ${t.value.spectate.wins}!`;
});

// Simulation
let simInterval = null;

function simulateRound() {
  if (fightOver.value || currentRound.value >= maxRounds) {
    endFight();
    return;
  }

  currentRound.value++;

  // Friend attacks
  const friendMove = moveNames[Math.floor(Math.random() * moveNames.length)];
  const friendDmg = 8 + Math.floor(Math.random() * 15);
  const friendCrit = Math.random() < 0.15;
  const actualFriendDmg = friendCrit ? Math.round(friendDmg * 1.5) : friendDmg;

  opponentHp.value = Math.max(0, opponentHp.value - actualFriendDmg);
  fightLog.value.push({
    round: currentRound.value,
    side: 'friend',
    actor: friendName.value,
    move: friendMove,
    damage: actualFriendDmg,
    critical: friendCrit,
  });

  // Check KO
  if (opponentHp.value <= 0) {
    endFight();
    return;
  }

  // Opponent attacks
  const oppMove = moveNames[Math.floor(Math.random() * moveNames.length)];
  const oppDmg = 8 + Math.floor(Math.random() * 15);
  const oppCrit = Math.random() < 0.15;
  const actualOppDmg = oppCrit ? Math.round(oppDmg * 1.5) : oppDmg;

  friendHp.value = Math.max(0, friendHp.value - actualOppDmg);
  fightLog.value.push({
    round: currentRound.value,
    side: 'opponent',
    actor: opponentName.value,
    move: oppMove,
    damage: actualOppDmg,
    critical: oppCrit,
  });

  // Check KO
  if (friendHp.value <= 0) {
    endFight();
    return;
  }

  // If last round, end fight
  if (currentRound.value >= maxRounds) {
    endFight();
    return;
  }

  // Auto-scroll log
  nextTick(() => {
    if (logListRef.value) {
      logListRef.value.scrollTop = logListRef.value.scrollHeight;
    }
  });

  // Random spectator count change
  if (Math.random() < 0.3) {
    spectatorCount.value = Math.max(1, spectatorCount.value + (Math.random() > 0.5 ? 1 : -1));
  }
}

function endFight() {
  fightOver.value = true;
  if (simInterval) { clearInterval(simInterval); simInterval = null; }

  if (friendHp.value <= 0 && opponentHp.value <= 0) {
    winner.value = 'friend'; // tie goes to friend
  } else if (opponentHp.value <= 0) {
    winner.value = 'friend';
  } else if (friendHp.value <= 0) {
    winner.value = 'opponent';
  } else {
    // End of rounds - higher HP wins
    winner.value = friendHp.value >= opponentHp.value ? 'friend' : 'opponent';
  }

  nextTick(() => {
    if (logListRef.value) {
      logListRef.value.scrollTop = logListRef.value.scrollHeight;
    }
  });
}

const goBack = () => {
  router.push('/friends');
};

onMounted(() => {
  // Start simulation after 1 second delay
  setTimeout(() => {
    simInterval = setInterval(simulateRound, 2000);
  }, 1000);
});

onBeforeUnmount(() => {
  if (simInterval) { clearInterval(simInterval); simInterval = null; }
});
</script>

<style scoped>
.background-spectate {
  min-height: 100vh;
  background: #090909;
}

.spectate-container {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  color: white;
  padding: 20px;
}

@supports (min-height: 100dvh) {
  .spectate-container { min-height: 100dvh; }
}

.spectate-content-wrapper {
  width: 100%;
  max-width: 700px;
  margin: 0 auto;
  padding-top: 60px;
}

/* Header */
.spectate-header {
  text-align: center;
  margin-bottom: 20px;
}

.spectate-icon {
  font-size: 36px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

.spectate-title {
  font-family: Anonymous, sans-serif;
  font-size: 22px;
  color: #FFB800;
  text-transform: uppercase;
  letter-spacing: 3px;
  margin: 8px 0 4px;
  text-shadow: 0 0 20px rgba(255, 184, 0, 0.4);
}

.spectator-count {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  color: var(--gray2);
}

.spectator-dot {
  width: 8px;
  height: 8px;
  background: #ff4444;
  border-radius: 50%;
  animation: blink 1.5s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* Round badge */
.round-badge {
  text-align: center;
  font-family: Anonymous, sans-serif;
  font-size: 14px;
  color: var(--gray3);
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 16px;
}

/* Fighters row */
.fighters-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.fighter-card {
  flex: 1;
  background: rgba(20, 20, 30, 0.85);
  border-radius: 12px;
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.fighter-friend {
  border-color: rgba(255, 6, 111, 0.4);
}

.fighter-opponent {
  border-color: rgba(0, 150, 255, 0.4);
}

.fighter-name {
  font-family: Anonymous, sans-serif;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fighter-friend .fighter-name { color: #FF066F; }
.fighter-opponent .fighter-name { color: #0096FF; }

.fighter-hp-bar {
  width: 100%;
  height: 10px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 6px;
}

.hp-fill {
  height: 100%;
  border-radius: 5px;
  transition: width 0.5s ease;
}

.hp-fill-friend {
  background: linear-gradient(90deg, #FF066F, #ff4d94);
}

.hp-fill-opponent {
  background: linear-gradient(90deg, #0066cc, #0096FF);
}

.hp-text {
  font-family: AnonymousBalance, monospace;
  font-size: 12px;
  color: var(--gray2);
  text-align: right;
}

.vs-divider {
  font-family: Anonymous, sans-serif;
  font-size: 16px;
  color: #FFB800;
  font-weight: bold;
  flex-shrink: 0;
  text-shadow: 0 0 10px rgba(255, 184, 0, 0.4);
}

/* Fight log */
.log-section {
  margin-bottom: 20px;
}

.log-header {
  font-family: Anonymous, sans-serif;
  font-size: 13px;
  color: var(--gray2);
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.log-list {
  max-height: 240px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-right: 4px;
}

.log-list::-webkit-scrollbar {
  width: 4px;
}

.log-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
}

.log-entry {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  padding: 6px 10px;
  background: rgba(20, 20, 30, 0.6);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.04);
}

.log-crit {
  border-color: rgba(255, 184, 0, 0.3);
  background: rgba(255, 184, 0, 0.06);
}

.log-round {
  font-family: AnonymousBalance, monospace;
  font-size: 11px;
  color: var(--gray2);
  min-width: 22px;
}

.log-actor {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
}

.actor-friend { color: #FF066F; }
.actor-opponent { color: #0096FF; }

.log-action {
  color: var(--gray3);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.log-damage {
  font-family: AnonymousBalance, monospace;
  color: #ff4444;
  font-weight: 600;
  min-width: 28px;
  text-align: right;
}

.log-crit-badge {
  font-size: 10px;
  color: #FFB800;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 1px;
}

.log-empty {
  text-align: center;
  color: var(--gray2);
  padding: 20px;
  font-size: 14px;
}

/* Result */
.result-banner {
  text-align: center;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 16px;
  animation: fadeInResult 0.5s ease;
}

@keyframes fadeInResult {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

.result-win {
  background: rgba(255, 6, 111, 0.15);
  border: 1px solid rgba(255, 6, 111, 0.4);
}

.result-loss {
  background: rgba(0, 150, 255, 0.15);
  border: 1px solid rgba(0, 150, 255, 0.4);
}

.result-text {
  font-family: Anonymous, sans-serif;
  font-size: 20px;
  text-transform: uppercase;
  letter-spacing: 3px;
  color: #FFB800;
  text-shadow: 0 0 15px rgba(255, 184, 0, 0.4);
}

/* Leave button */
.leave-btn {
  width: 100%;
  padding: 14px;
  background: rgba(20, 20, 30, 0.85);
  border: 1px solid rgba(255, 184, 0, 0.4);
  border-radius: 12px;
  color: #FFB800;
  font-family: Anonymous, sans-serif;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.leave-btn:active {
  border-color: #FFB800;
  box-shadow: 0 0 20px rgba(255, 184, 0, 0.3);
}
</style>
