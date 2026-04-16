<template>
  <div class="mm-v2">
    <div class="scanlines" aria-hidden="true"></div>

    <div class="mm-container">
      <!-- Header -->
      <div class="mm-header">
        <button class="mm-back" @click="goBack">← {{ t.pvp?.backToArena || 'BACK' }}</button>
        <div class="mm-title">MATCHMAKING</div>
      </div>

      <!-- IDLE state: filters + search -->
      <div v-if="status === 'idle'" class="mm-idle">
        <!-- Player info -->
        <div v-if="activeAgent" class="mm-player">
          <img :src="`/images/skins/${activeAgent.skin}`" class="mm-player-skin" alt="" />
          <div class="mm-player-info">
            <div class="mm-player-name">{{ activeAgent.name }}</div>
            <BeltBadge :grade="activeAgent.belt || 0" :is-hexmaster="activeAgent.isHexmaster || false" size="sm" />
          </div>
        </div>
        <div v-else class="mm-no-agent">{{ t.fight?.errNoActiveAgent || 'Create an agent first' }}</div>

        <!-- Decorative filters -->
        <div class="mm-filters">
          <div class="mm-filter-label">{{ t.pvp?.v2?.lblFilters || 'FILTERS' }}</div>
          <div class="mm-filter-group">
            <span class="mm-filter-name">ELO Range</span>
            <input type="range" min="25" max="400" step="25" v-model.number="eloRange" class="mm-slider" />
            <span class="mm-filter-val">±{{ eloRange }}</span>
          </div>
          <div class="mm-filter-group">
            <span class="mm-filter-name">Archetype</span>
            <div class="mm-chips">
              <button v-for="a in archetypes" :key="a" :class="['mm-chip', { active: archFilter === a }]" @click="archFilter = a">{{ a }}</button>
            </div>
          </div>
        </div>

        <HexButton variant="primary" size="lg" block :disabled="!activeAgent" @click="startSearch" class="mm-search-btn">
          {{ t.pvp?.v2?.lblSearch || 'SEARCH' }}
        </HexButton>
      </div>

      <!-- SEARCHING state: CRT log -->
      <div v-if="status === 'searching'" class="mm-searching">
        <div class="mm-terminal">
          <div class="mm-term-header">
            <span class="mm-term-dot green"></span>
            <span class="mm-term-title">HEXLASH MATCHMAKER v2.1</span>
          </div>
          <div ref="logContainer" class="mm-log">
            <div v-for="(line, i) in logLines" :key="i" class="mm-log-line" :class="line.type">
              <span class="mm-log-time">{{ line.time }}</span>
              <span class="mm-log-text">{{ line.text }}</span>
            </div>
          </div>
          <div class="mm-term-footer">
            <span>Queue: {{ queueSize }} · Online: {{ onlineCount }}</span>
            <span>{{ formattedTime }}</span>
          </div>
        </div>

        <HexButton variant="danger" size="sm" @click="cancelSearch" class="mm-cancel-btn">
          {{ t.pvp?.cancel || 'CANCEL' }}
        </HexButton>
      </div>

      <!-- FOUND state -->
      <div v-if="status === 'found'" class="mm-found">
        <div class="mm-found-title">{{ t.pvp?.opponentFound || 'OPPONENT FOUND!' }}</div>
        <div class="mm-vs">
          <div class="mm-vs-player">
            <img :src="`/images/skins/${playerSkin}`" class="mm-vs-skin" alt="" />
            <div class="mm-vs-name">{{ playerName }}</div>
          </div>
          <div class="mm-vs-icon">VS</div>
          <div class="mm-vs-player">
            <img :src="`/images/skins/${foundOpponent.skin || 'skin_m_1.png'}`" class="mm-vs-skin" alt="" />
            <div class="mm-vs-name">{{ foundOpponent.username }}</div>
            <div class="mm-vs-rating">{{ foundOpponent.rating }}</div>
          </div>
        </div>
        <div class="mm-countdown">{{ t.pvp?.fightStartsIn || 'Fight starts in' }}: {{ countdown }}</div>
      </div>

      <!-- TIMEOUT state -->
      <div v-if="status === 'timeout'" class="mm-timeout">
        <div class="mm-timeout-title">{{ t.pvp?.noPlayersFound || 'No players found' }}</div>
        <div class="mm-timeout-hint">{{ t.pvp?.tryAgainLater || 'Try again later' }}</div>
        <HexButton variant="primary" size="sm" @click="retrySearch">{{ t.pvp?.tryAgain || 'TRY AGAIN' }}</HexButton>
        <HexButton variant="ghost" size="sm" @click="goBack" class="mm-back-btn">{{ t.pvp?.backToArena || 'BACK' }}</HexButton>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import store from '@/core/state/store.js';
import { t } from '@/locales/index.js';
import { getOnlinePlayersCount } from '@/core/services/statsService.js';
import HexButton from '@/components/ui/HexButton.vue';
import BeltBadge from '@/components/ui/BeltBadge.vue';

export default {
  name: 'MatchmakingViewV2',
  components: { HexButton, BeltBadge },
  setup() {
    const router = useRouter();

    const status = ref('idle');
    const searchTime = ref(0);
    const countdown = ref(5);
    const foundOpponent = ref({ username: '', rating: 0 });
    const queueSize = ref(0);
    const onlineCount = ref(0);
    const logLines = ref([]);
    const logContainer = ref(null);

    // Decorative filters
    const eloRange = ref(100);
    const archFilter = ref('Any');
    const archetypes = ['Any', 'PRE', 'SEN', 'GHO', 'ANA', 'MAV', 'JUG'];

    let searchInterval = null;
    let countdownInterval = null;
    let onlineRefreshInterval = null;
    let logInterval = null;

    const activeAgent = computed(() => store.getters['agent/activeAgent']);
    const playerName = computed(() => activeAgent.value?.name || store.getters['master/getMaster']?.userData?.name || 'Player');
    const playerSkin = computed(() => activeAgent.value?.skin || store.getters['master/getMaster']?.userData?.skin || 'skin_m_1.png');

    const formattedTime = computed(() => {
      const m = Math.floor(searchTime.value / 60);
      const s = searchTime.value % 60;
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    });

    // CRT log entries
    const LOG_ENTRIES = [
      'init matchmaker...',
      'pinging arena nodes [...]',
      'querying eligibility...',
      'filtering by elo_range ±{elo}',
      'collecting candidates...',
      'broadcasting search beacon...',
      'scanning active fighters...',
      'evaluating matchups...',
      'awaiting server response...',
    ];
    let logIdx = 0;

    function addLogLine(text) {
      const now = new Date();
      const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      logLines.value.push({ time, text, type: text.includes('error') ? 'error' : 'info' });
      if (logLines.value.length > 20) logLines.value.shift();
      nextTick(() => {
        if (logContainer.value) logContainer.value.scrollTop = logContainer.value.scrollHeight;
      });
    }

    function startLogAnimation() {
      logIdx = 0;
      logLines.value = [];
      addLogLine('> hexlash matchmaker v2.1');
      logInterval = setInterval(() => {
        if (logIdx < LOG_ENTRIES.length) {
          let text = LOG_ENTRIES[logIdx].replace('{elo}', eloRange.value);
          addLogLine(text);
          logIdx++;
        } else {
          addLogLine(`scanning... (${Math.floor(Math.random() * 50) + 10} nodes)`);
        }
      }, 350);
    }

    // WS event handlers (copied from existing MatchmakingView)
    function onMatchFound(e) {
      const data = e.detail;
      cleanup();
      foundOpponent.value = data.opponent;
      status.value = 'found';
      countdown.value = 5;
      countdownInterval = setInterval(() => {
        countdown.value--;
        if (countdown.value <= 0) startFight(data.matchId);
      }, 1000);
    }

    function onQueueUpdate(e) {
      queueSize.value = e.detail.queueSize || 0;
    }

    function onMatchmakingTimeout() {
      cleanup();
      status.value = 'timeout';
    }

    function onMatchCancelled() {
      cleanup();
      store.commit('master/setInfoMessage', { text: t.value.pvp?.matchCancelled || 'Match cancelled', timeout: 3000 });
      router.push('/arena/pit');
    }

    function startFight(matchId) {
      cleanup();
      store.commit('pvp/SET_PVP_MATCH', {
        matchId,
        opponent: foundOpponent.value,
        isPlayer1: true,
      });
      router.push({ path: '/fight', query: { mode: 'pvp', matchId } });
    }

    function startSearch() {
      status.value = 'searching';
      searchTime.value = 0;

      const agent = store.getters['agent/activeAgent'];
      const masterData = store.getters['master/getMaster'];
      store.dispatch('webSocket/sendMessage', {
        type: 'MatchmakingStartMsg',
        matchmakingRequest: {
          username: agent?.name || playerName.value,
          rating: agent?.elo || 1000,
          skin: agent?.skin || masterData?.userData?.skin || null,
          avatarUrl: masterData?.userData?.avatarUrl || null,
        },
      });

      searchInterval = setInterval(() => { searchTime.value++; }, 1000);
      startLogAnimation();
    }

    function cancelSearch() {
      store.dispatch('webSocket/sendMessage', { type: 'MatchmakingCancelMsg' });
      cleanup();
      status.value = 'idle';
    }

    function retrySearch() {
      status.value = 'idle';
    }

    function goBack() {
      if (status.value === 'searching') cancelSearch();
      router.push('/arena/pit');
    }

    function cleanup() {
      if (searchInterval) { clearInterval(searchInterval); searchInterval = null; }
      if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
      if (logInterval) { clearInterval(logInterval); logInterval = null; }
    }

    onMounted(async () => {
      onlineCount.value = await getOnlinePlayersCount();
      onlineRefreshInterval = setInterval(async () => { onlineCount.value = await getOnlinePlayersCount(); }, 10000);
      window.addEventListener('matchmaking-match-found', onMatchFound);
      window.addEventListener('matchmaking-queue-update', onQueueUpdate);
      window.addEventListener('matchmaking-timeout', onMatchmakingTimeout);
      window.addEventListener('match-cancelled', onMatchCancelled);
    });

    onBeforeUnmount(() => {
      cleanup();
      if (onlineRefreshInterval) clearInterval(onlineRefreshInterval);
      window.removeEventListener('matchmaking-match-found', onMatchFound);
      window.removeEventListener('matchmaking-queue-update', onQueueUpdate);
      window.removeEventListener('matchmaking-timeout', onMatchmakingTimeout);
      window.removeEventListener('match-cancelled', onMatchCancelled);
    });

    return {
      t, status, searchTime, countdown, foundOpponent, queueSize, onlineCount,
      logLines, logContainer, eloRange, archFilter, archetypes, activeAgent,
      playerName, playerSkin, formattedTime,
      startSearch, cancelSearch, retrySearch, goBack,
    };
  },
};
</script>

<style scoped>
.mm-v2 {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: var(--hex-bg-deep);
}
@supports (height: 100dvh) { .mm-v2 { height: 100dvh; } }

.mm-container {
  position: relative;
  z-index: 10;
  overflow-y: auto;
  height: 100%;
  padding: 80px 16px 40px;
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
}

/* Header */
.mm-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.mm-back {
  background: none; border: none; color: var(--hex-text-secondary);
  font-family: var(--hex-font-body); font-size: 14px; cursor: pointer; min-height: 44px;
}
.mm-title {
  font-family: var(--hex-font-display); font-size: 20px;
  color: var(--hex-text-primary); letter-spacing: 3px;
}

/* Player info */
.mm-player { display: flex; gap: 12px; align-items: center; margin-bottom: 20px; }
.mm-player-skin { width: 56px; height: 56px; border-radius: var(--hex-radius-md); object-fit: cover; object-position: top; border: 1px solid var(--hex-border-default); }
.mm-player-info { display: flex; flex-direction: column; gap: 4px; }
.mm-player-name { font-size: 16px; color: var(--hex-text-primary); font-weight: 500; }
.mm-no-agent { color: var(--hex-text-muted); font-size: 14px; padding: 20px 0; }

/* Filters */
.mm-filters { margin-bottom: 20px; }
.mm-filter-label {
  font-family: var(--hex-font-display); font-size: 10px;
  color: var(--hex-text-muted); letter-spacing: 2px; margin-bottom: 10px;
}
.mm-filter-group { margin-bottom: 12px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.mm-filter-name { font-size: 11px; color: var(--hex-text-muted); width: 70px; flex-shrink: 0; }
.mm-slider { flex: 1; accent-color: var(--hex-primary); max-width: 200px; }
.mm-filter-val { font-family: var(--hex-font-mono); font-size: 12px; color: var(--hex-warning); }
.mm-chips { display: flex; gap: 4px; flex-wrap: wrap; }
.mm-chip {
  padding: 4px 8px; font-size: 10px; font-family: var(--hex-font-mono);
  background: var(--hex-bg-medium); border: 1px solid var(--hex-border-default);
  color: var(--hex-text-muted); border-radius: var(--hex-radius-sm); cursor: pointer;
}
.mm-chip.active { background: var(--hex-primary); color: #fff; border-color: var(--hex-primary); }
.mm-search-btn { margin-top: 8px; }

/* Terminal (CRT log) */
.mm-terminal {
  background: #0a0a14; border: 1px solid var(--hex-border-default);
  border-radius: var(--hex-radius-md); overflow: hidden; flex: 1; min-height: 300px;
  display: flex; flex-direction: column;
}
.mm-term-header {
  display: flex; align-items: center; gap: 8px; padding: 8px 12px;
  border-bottom: 1px solid var(--hex-border-default);
}
.mm-term-dot { width: 8px; height: 8px; border-radius: 50%; }
.mm-term-dot.green { background: #00e5c8; box-shadow: 0 0 6px #00e5c8; }
.mm-term-title { font-family: var(--hex-font-mono); font-size: 11px; color: #00e5c8; }
.mm-log {
  flex: 1; overflow-y: auto; padding: 8px 12px;
  font-family: var(--hex-font-mono); font-size: 12px;
}
.mm-log-line { padding: 2px 0; display: flex; gap: 8px; }
.mm-log-time { color: var(--hex-text-muted); flex-shrink: 0; }
.mm-log-text { color: #00e5c8; }
.mm-log-line.error .mm-log-text { color: var(--hex-danger); }
.mm-term-footer {
  display: flex; justify-content: space-between; padding: 6px 12px;
  border-top: 1px solid var(--hex-border-default);
  font-family: var(--hex-font-mono); font-size: 10px; color: var(--hex-text-muted);
}
.mm-cancel-btn { margin-top: 12px; align-self: center; }

/* Found */
.mm-found { text-align: center; flex: 1; display: flex; flex-direction: column; justify-content: center; }
.mm-found-title {
  font-family: var(--hex-font-display); font-size: 28px;
  color: var(--hex-primary); letter-spacing: 3px; margin-bottom: 24px;
  text-shadow: 0 0 20px var(--hex-primary-glow);
}
.mm-vs { display: flex; justify-content: center; align-items: center; gap: 24px; margin-bottom: 24px; }
.mm-vs-player { text-align: center; }
.mm-vs-skin { width: 80px; height: 80px; border-radius: var(--hex-radius-md); object-fit: cover; object-position: top; border: 1px solid var(--hex-border-default); }
.mm-vs-name { font-size: 14px; color: var(--hex-text-primary); margin-top: 6px; }
.mm-vs-rating { font-family: var(--hex-font-mono); font-size: 12px; color: var(--hex-warning); }
.mm-vs-icon {
  font-family: var(--hex-font-display); font-size: 32px;
  color: var(--hex-text-muted); letter-spacing: 4px;
}
.mm-countdown { font-family: var(--hex-font-mono); font-size: 20px; color: var(--hex-primary); }

/* Timeout */
.mm-timeout { text-align: center; padding: 60px 0; }
.mm-timeout-title { font-size: 18px; color: var(--hex-text-primary); margin-bottom: 8px; }
.mm-timeout-hint { font-size: 13px; color: var(--hex-text-muted); margin-bottom: 20px; }
.mm-back-btn { margin-top: 8px; }

/* Searching layout */
.mm-searching { flex: 1; display: flex; flex-direction: column; }
</style>
