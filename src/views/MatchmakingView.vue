<template>
  <div class="background background-matchmaking">
    <div class="matchmaking-container">

      <!-- Searching State -->
      <div v-if="status === 'searching'" class="searching-container">

        <!-- Animated Icon -->
        <div class="search-icon-container">
          <div class="search-icon"><svg viewBox="0 0 64 64" width="60" height="60" fill="none" stroke="#FF066F" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="52" x2="42" y2="12"/><line x1="38" y1="12" x2="46" y2="12"/><line x1="42" y1="8" x2="42" y2="16"/><line x1="22" y1="38" x2="30" y2="42"/><line x1="52" y1="52" x2="22" y2="12"/><line x1="18" y1="12" x2="26" y2="12"/><line x1="22" y1="8" x2="22" y2="16"/><line x1="42" y1="38" x2="34" y2="42"/></svg></div>
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
            {{ t.pvp.playersSearching }}: {{ queueSize }}
          </div>
          <div class="stat-item">
            <span class="stat-dot online-blue"></span>
            {{ t.pvp.playersOnline }}: {{ onlineCount }}
          </div>
          <div class="stat-item">
            <span class="stat-icon"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#FFD700" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h12v6a6 6 0 0 1-12 0V2z"/><path d="M6 4H2v2a4 4 0 0 0 4 4"/><path d="M18 4h4v2a4 4 0 0 1-4 4"/><line x1="12" y1="14" x2="12" y2="18"/><rect x="7" y="18" width="10" height="2" rx="1"/></svg></span>
            {{ t.pvp.yourRating }}: {{ playerRating }}
          </div>
          <div class="stat-item">
            <span class="stat-icon"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#FF066F" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/></svg></span>
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
            <div class="player-avatar"><svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#FF066F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M3 21c0-5 4-9 9-9s9 4 9 9"/></svg></div>
            <div class="player-name">{{ playerName }}</div>
            <div class="player-rating">{{ playerRating }}</div>
          </div>

          <div class="vs-icon">VS</div>

          <div class="player-card opponent">
            <div class="player-avatar"><svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#00BFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M3 21c0-5 4-9 9-9s9 4 9 9"/></svg></div>
            <div class="player-name">{{ foundOpponent.username }}</div>
            <div class="player-rating">{{ foundOpponent.rating }}</div>
          </div>
        </div>

        <!-- Countdown -->
        <div class="fight-countdown">
          {{ t.pvp.fightStartsIn }}: {{ countdown }}
        </div>

      </div>

      <!-- Timeout / No Players State -->
      <div v-else-if="status === 'timeout'" class="timeout-container">
        <div class="timeout-icon"><svg viewBox="0 0 24 24" width="60" height="60" fill="none" stroke="#FFB800" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="9"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="13" x2="15" y2="15"/><line x1="8" y1="2" x2="16" y2="2"/><line x1="12" y1="2" x2="12" y2="4"/></svg></div>
        <h2 class="timeout-title">{{ t.pvp.noPlayersFound }}</h2>
        <p class="timeout-hint">{{ t.pvp.tryAgainLater }}</p>
        <div class="timeout-buttons">
          <button class="retry-btn" @click="retrySearch">
            {{ t.pvp.tryAgain }}
          </button>
          <button class="back-btn" @click="goBack">
            {{ t.pvp.backToArena }}
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import store from '@/core/state/store.js';
import router from '@/router/index.js';
import { t } from '@/locales/index.js';
import { getOnlinePlayersCount } from '@/core/services/statsService.js';

// State
const status = ref('searching'); // 'searching', 'found', 'timeout'
const searchTime = ref(0);
const searchRange = ref(100);
const countdown = ref(5);
const foundOpponent = ref({ username: '', rating: 0 });
const queueSize = ref(0);
const onlineCount = ref(0);

// Intervals
let searchInterval = null;
let countdownInterval = null;
let onlineRefreshInterval = null;

// Computed
const playerName = computed(() => {
  const master = store.getters['master/getMaster'];
  return master?.userData?.name || 'Player';
});
const playerRating = computed(() => store.getters['pvp/getPvpStats'].rating);

const formattedTime = computed(() => {
  const minutes = Math.floor(searchTime.value / 60);
  const seconds = searchTime.value % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
});

// WS event handlers
function onMatchFound(e) {
  const data = e.detail;
  clearInterval(searchInterval);
  searchInterval = null;

  foundOpponent.value = data.opponent;
  status.value = 'found';
  countdown.value = 5;

  countdownInterval = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      startFight(data.matchId);
    }
  }, 1000);
}

function onQueueUpdate(e) {
  const data = e.detail;
  queueSize.value = data.queueSize || 0;
}

// Lifecycle
onMounted(async () => {
  // Fetch online count
  onlineCount.value = await getOnlinePlayersCount();
  onlineRefreshInterval = setInterval(async () => {
    onlineCount.value = await getOnlinePlayersCount();
  }, 10000);

  // Listen for WS matchmaking events
  window.addEventListener('matchmaking-match-found', onMatchFound);
  window.addEventListener('matchmaking-queue-update', onQueueUpdate);

  startSearch();
});

onBeforeUnmount(() => {
  cleanup();
  window.removeEventListener('matchmaking-match-found', onMatchFound);
  window.removeEventListener('matchmaking-queue-update', onQueueUpdate);
  if (onlineRefreshInterval) {
    clearInterval(onlineRefreshInterval);
  }
});

function startSearch() {
  status.value = 'searching';
  searchTime.value = 0;
  searchRange.value = 100;

  // Send matchmaking start via WS
  store.dispatch('webSocket/sendMessage', {
    type: 'MatchmakingStartMsg',
    matchmakingRequest: {
      username: playerName.value,
      rating: playerRating.value,
    },
  });

  searchInterval = setInterval(() => {
    searchTime.value++;

    // Expand search range every 5 seconds (visual only — backend manages real range)
    if (searchTime.value % 5 === 0) {
      searchRange.value = Math.min(searchRange.value + 50, 500);
    }

    // Timeout after 2 minutes
    if (searchTime.value >= 120) {
      status.value = 'timeout';
      cancelMatchmakingOnServer();
      clearInterval(searchInterval);
      searchInterval = null;
    }
  }, 1000);
}

function startFight(matchId) {
  cleanup();

  // Create ranked PvP fight
  store.dispatch('pvp/createPvPFight', { opponent: foundOpponent.value, isRanked: true });

  // Pre-set PvP match data in store
  store.commit('pvp/SET_PVP_MATCH', {
    matchId,
    opponent: foundOpponent.value,
    isPlayer1: false, // server will confirm in fight_start
  });

  // Navigate to fight
  router.push({ path: '/fight', query: { mode: 'pvp', matchId } });
}

function cancelSearch() {
  cancelMatchmakingOnServer();
  cleanup();
  router.push('/arena');
}

function cancelMatchmakingOnServer() {
  store.dispatch('webSocket/sendMessage', {
    type: 'MatchmakingCancelMsg',
  });
}

function retrySearch() {
  startSearch();
}

function goBack() {
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
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
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

.stat-dot.online-blue {
  background: #00BFFF;
  box-shadow: 0 0 8px rgba(0, 191, 255, 0.6);
}

.stat-icon {
  display: flex;
  align-items: center;
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
  display: flex;
  align-items: center;
  justify-content: center;
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

/* ── Timeout State ───────────────────────────────────────────── */
.timeout-container {
  text-align: center;
  max-width: 400px;
  animation: scaleIn 0.5s ease;
}

.timeout-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.timeout-title {
  font-family: Anonymous, sans-serif;
  font-size: 22px;
  color: #FFB800;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 8px;
}

.timeout-hint {
  font-size: 14px;
  color: var(--gray2);
  margin-bottom: 32px;
}

.timeout-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.retry-btn {
  padding: 16px 48px;
  background: rgba(255, 6, 111, 0.15);
  border: 2px solid #FF066F;
  border-radius: 12px;
  color: #FF066F;
  font-family: Anonymous, sans-serif;
  font-size: 16px;
  text-transform: uppercase;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-btn:active {
  background: rgba(255, 6, 111, 0.3);
  box-shadow: 0 0 20px rgba(255, 6, 111, 0.4);
}

.back-btn {
  padding: 12px 32px;
  background: transparent;
  border: 1px solid var(--gray2);
  border-radius: 12px;
  color: var(--gray2);
  font-family: Anonymous, sans-serif;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-btn:active {
  border-color: #fff;
  color: #fff;
}
</style>
