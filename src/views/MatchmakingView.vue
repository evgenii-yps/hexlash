<template>
  <div class="background background-matchmaking">
    <div class="matchmaking-container">

      <!-- Searching State -->
      <div v-if="status === 'searching'" class="searching-container">

        <!-- Animated Icon -->
        <div class="search-icon-container">
          <div class="search-icon">&#x2694;&#xFE0F;</div>
          <div class="pulse-ring"></div>
          <div class="pulse-ring delay"></div>
        </div>

        <!-- Title -->
        <h1 class="search-title">{{ t.pvp.searchingForOpponent }}</h1>

        <!-- Timer -->
        <div class="search-timer">{{ formattedTime }}</div>

        <!-- Progress Bar -->
        <div class="search-progress">
          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>
        </div>

        <!-- Stats -->
        <div class="search-stats">
          <div class="stat-item">
            <span class="stat-dot online"></span>
            {{ t.pvp.playersOnline }}: {{ onlineCount }}
          </div>
          <div class="stat-item">
            <span class="stat-icon">&#x1F3C6;</span>
            {{ t.pvp.yourRating }}: {{ playerRating }}
          </div>
          <div class="stat-item">
            <span class="stat-icon">&#x1F4CA;</span>
            {{ t.pvp.searchRange }}: &plusmn;{{ searchRange }}
          </div>
        </div>

        <!-- Cancel Button -->
        <button class="cancel-btn" @click="cancelSearch">
          {{ t.pvp.cancel }}
        </button>

      </div>

      <!-- Found State -->
      <div v-else-if="status === 'found'" class="found-container">

        <h1 class="found-title">{{ t.pvp.opponentFound }}</h1>

        <!-- VS Display -->
        <div class="vs-display">
          <div class="player-card me">
            <div class="player-avatar">&#x1F464;</div>
            <div class="player-name">{{ playerName }}</div>
            <div class="player-rating">{{ playerRating }}</div>
          </div>

          <div class="vs-icon">VS</div>

          <div class="player-card opponent">
            <div class="player-avatar">&#x1F464;</div>
            <div class="player-name">{{ foundOpponent.username }}</div>
            <div class="player-rating">{{ foundOpponent.rating }}</div>
          </div>
        </div>

        <!-- Countdown -->
        <div class="fight-countdown">
          {{ t.pvp.fightStartsIn }}: {{ countdown }}
        </div>

      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import store from '@/core/state/store.js';
import router from '@/router/index.js';
import { t } from '@/locales/index.js';

// State
const status = ref('searching'); // 'searching', 'found'
const searchTime = ref(0);
const searchRange = ref(100);
const countdown = ref(5);
const foundOpponent = ref({ username: '', rating: 0 });

// Intervals
let searchInterval = null;
let countdownInterval = null;

// Find time — pick once on mount
let findTime = 3 + Math.floor(Math.random() * 5);

// Computed
const playerName = computed(() => {
  const master = store.getters['master/getMaster'];
  return master?.userData?.name || 'Player';
});
const playerRating = computed(() => store.getters['pvp/getPvpStats'].rating);
const onlineCount = computed(() => Math.floor(Math.random() * 30) + 30);

const formattedTime = computed(() => {
  const minutes = Math.floor(searchTime.value / 60);
  const seconds = searchTime.value % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
});

// Mock opponents
const mockOpponents = [
  { id: 'opp1', username: 'Shadow_X', rating: 1180 },
  { id: 'opp2', username: 'NightFury', rating: 1320 },
  { id: 'opp3', username: 'IronFist', rating: 1250 },
  { id: 'opp4', username: 'BlazeFist', rating: 1100 },
  { id: 'opp5', username: 'StormRider', rating: 1400 },
  { id: 'opp6', username: 'ThunderBolt', rating: 980 },
  { id: 'opp7', username: 'DarkPhoenix', rating: 1550 },
  { id: 'opp8', username: 'CyberWolf', rating: 1200 },
];

// Lifecycle
onMounted(() => {
  startSearch();
});

onUnmounted(() => {
  cleanup();
});

function startSearch() {
  status.value = 'searching';
  searchTime.value = 0;
  searchRange.value = 100;

  searchInterval = setInterval(() => {
    searchTime.value++;

    // Expand search range every 5 seconds
    if (searchTime.value % 5 === 0) {
      searchRange.value = Math.min(searchRange.value + 50, 500);
    }

    // Simulate finding opponent after findTime seconds
    if (searchTime.value >= findTime) {
      onOpponentFound();
    }
  }, 1000);
}

function onOpponentFound() {
  clearInterval(searchInterval);
  searchInterval = null;

  // Pick random opponent within rating range
  const myRating = playerRating.value;
  const validOpponents = mockOpponents.filter(opp =>
    Math.abs(opp.rating - myRating) <= searchRange.value
  );

  foundOpponent.value = validOpponents.length > 0
    ? validOpponents[Math.floor(Math.random() * validOpponents.length)]
    : mockOpponents[Math.floor(Math.random() * mockOpponents.length)];

  status.value = 'found';
  countdown.value = 5;

  countdownInterval = setInterval(() => {
    countdown.value--;

    if (countdown.value <= 0) {
      startFight();
    }
  }, 1000);
}

function startFight() {
  cleanup();

  // Create ranked PvP fight
  store.dispatch('pvp/createPvPFight', { opponent: foundOpponent.value, isRanked: true });

  // Navigate to fight
  router.push({ path: '/fight', query: { mode: 'pvp' } });
}

function cancelSearch() {
  cleanup();
  router.push('/arena');
}

function cleanup() {
  if (searchInterval) {
    clearInterval(searchInterval);
    searchInterval = null;
  }
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
}
</script>

<style scoped>
.background-matchmaking {
  min-height: 100vh;
  background: #090909;
}

.matchmaking-container {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  color: white;
  padding: 20px;
}

/* ── Searching State ─────────────────────────────────────────── */
.searching-container {
  text-align: center;
  max-width: 400px;
  width: 100%;
}

.search-icon-container {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-icon {
  font-size: 60px;
  z-index: 2;
  animation: iconPulse 1.5s ease-in-out infinite;
}

@keyframes iconPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.pulse-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 3px solid #FF066F;
  border-radius: 50%;
  animation: pulseRing 2s ease-out infinite;
}

.pulse-ring.delay {
  animation-delay: 1s;
}

@keyframes pulseRing {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

.search-title {
  font-family: Anonymous, sans-serif;
  font-size: 20px;
  color: #FF066F;
  text-transform: uppercase;
  letter-spacing: 3px;
  margin-bottom: 16px;
  text-shadow: 0 0 20px rgba(255, 6, 111, 0.5);
}

.search-timer {
  font-family: AnonymousBalance, sans-serif;
  font-size: 48px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 24px;
}

.search-progress {
  margin-bottom: 32px;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  width: 30%;
  background: linear-gradient(90deg, #FF066F, #FF3D8E);
  animation: progressMove 1.5s ease-in-out infinite;
}

@keyframes progressMove {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(400%); }
}

.search-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 40px;
}

.stat-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  color: var(--gray2);
}

.stat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.stat-dot.online {
  background: #00FF88;
  box-shadow: 0 0 8px rgba(0, 255, 136, 0.6);
}

.stat-icon {
  font-size: 16px;
}

.cancel-btn {
  padding: 16px 48px;
  background: transparent;
  border: 2px solid var(--gray2);
  border-radius: 12px;
  color: var(--gray2);
  font-family: Anonymous, sans-serif;
  font-size: 16px;
  text-transform: uppercase;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn:active {
  border-color: #FF3333;
  color: #FF3333;
}

/* ── Found State ─────────────────────────────────────────────── */
.found-container {
  text-align: center;
  animation: scaleIn 0.5s ease;
}

@keyframes scaleIn {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.found-title {
  font-family: Anonymous, sans-serif;
  font-size: 28px;
  color: #00FF88;
  text-transform: uppercase;
  letter-spacing: 3px;
  margin-bottom: 40px;
  text-shadow: 0 0 30px rgba(0, 255, 136, 0.5);
}

.vs-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  margin-bottom: 40px;
}

.player-card {
  padding: 20px 24px;
  background: rgba(20, 20, 30, 0.8);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  min-width: 120px;
}

.player-card.me {
  border-color: #FF066F;
  box-shadow: 0 0 20px rgba(255, 6, 111, 0.3);
}

.player-card.opponent {
  border-color: #00BFFF;
  box-shadow: 0 0 20px rgba(0, 191, 255, 0.3);
}

.player-avatar {
  font-size: 40px;
  margin-bottom: 8px;
}

.player-name {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 4px;
  font-family: Anonymous, sans-serif;
}

.player-rating {
  font-size: 13px;
  color: var(--gray2);
  font-family: AnonymousBalance, sans-serif;
}

.vs-icon {
  font-family: Anonymous, sans-serif;
  font-size: 28px;
  font-weight: bold;
  color: #FF066F;
  text-shadow: 0 0 15px rgba(255, 6, 111, 0.6);
}

.fight-countdown {
  font-family: Anonymous, sans-serif;
  font-size: 20px;
  color: #FFB800;
  text-transform: uppercase;
  letter-spacing: 2px;
  animation: countdownPulse 1s ease-in-out infinite;
}

@keyframes countdownPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
</style>
