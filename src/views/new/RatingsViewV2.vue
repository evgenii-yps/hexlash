<template>
  <div class="ratings-v2">
    <div class="ratings-scroll">
      <h1 class="ratings-title">RATINGS</h1>

      <!-- Tabs -->
      <div class="ratings-tabs">
        <button v-for="tab in tabs" :key="tab.id" :class="['rt-tab', { active: activeTab === tab.id }]" @click="activeTab = tab.id">
          {{ tab.label }}
        </button>
      </div>

      <!-- Search (Global tab only) -->
      <div v-if="activeTab === 'global'" class="ratings-search">
        <input v-model="searchQuery" :placeholder="rv2.lblSearch || 'Search players...'" class="search-input" />
      </div>

      <!-- Global Tab -->
      <div v-if="activeTab === 'global'" class="tab-content">
        <AgentLeaderboard />
      </div>

      <!-- Friends Tab -->
      <div v-if="activeTab === 'friends'" class="tab-content">
        <div v-if="friends.length === 0" class="tab-placeholder">{{ rv2.lblNoFriendsRank || 'Add friends to see their rankings' }}</div>
        <div v-else class="rt-list">
          <div v-for="(f, i) in friends" :key="f.id" class="rt-row">
            <span class="rt-rank">{{ i + 1 }}</span>
            <span class="rt-dot" :class="f.status === 'online' ? 'online' : ''"></span>
            <span class="rt-name">{{ f.username }}</span>
          </div>
        </div>
      </div>

      <!-- Clan Tab -->
      <div v-if="activeTab === 'clan'" class="tab-content">
        <div v-if="!myClanId" class="tab-placeholder">{{ rv2.lblNoClan || 'Join a clan to see rankings' }}</div>
        <div v-else-if="!clanData" class="tab-placeholder">...</div>
        <div v-else class="rt-list">
          <div v-for="(m, i) in clanMembers" :key="m.id" class="rt-row">
            <span class="rt-rank" :class="{ 'rank-1': i === 0, 'rank-2': i === 1, 'rank-3': i === 2 }">{{ i + 1 }}</span>
            <img :src="`/images/skins/${m.skin || 'skin_m_1.png'}`" class="rt-avatar" alt="" />
            <span class="rt-name">{{ m.login || m.name }}</span>
            <span class="rt-wins">{{ m.wins || 0 }}W</span>
          </div>
        </div>
      </div>

      <!-- Country Tab -->
      <div v-if="activeTab === 'country'" class="tab-content">
        <div v-if="!userCountry" class="tab-placeholder tab-placeholder--cta">
          <p>{{ rv2.lblNoCountrySet || 'Select your country in Profile to see country rankings' }}</p>
          <button class="cta-btn" @click="$router.push('/profile-v2')">
            {{ rv2.lblGoToProfile || 'Go to Profile' }}
          </button>
        </div>
        <div v-else-if="countryLoading" class="tab-placeholder">
          {{ rv2.lblLoading || 'Loading…' }}
        </div>
        <div v-else-if="countryLeaderboard.length === 0" class="tab-placeholder">
          {{ rv2.lblNoCountryRanks || 'No ranked players in your country yet' }}
        </div>
        <div v-else class="rt-list">
          <div v-for="(entry, i) in countryLeaderboard" :key="entry.userId" class="rt-row">
            <span class="rt-rank" :class="{ 'rank-1': i === 0, 'rank-2': i === 1, 'rank-3': i === 2 }">{{ i + 1 }}</span>
            <span class="rt-flag">{{ codeToFlag(entry.country) }}</span>
            <img :src="`/images/skins/${entry.agent.skin || 'skin_m_1.png'}`" class="rt-avatar" alt="" />
            <span class="rt-name">{{ entry.agent.name || entry.login }}</span>
            <span class="rt-elo">{{ entry.agent.elo }}</span>
          </div>
        </div>
      </div>

      <!-- Live Tab -->
      <div v-if="activeTab === 'live'" class="tab-content">
        <div v-if="liveLoading && liveMatches.length === 0" class="tab-placeholder">
          {{ rv2.lblLoading || 'Loading…' }}
        </div>
        <div v-else-if="liveMatches.length === 0" class="tab-placeholder">
          {{ rv2.lblNoLiveMatches || 'No recent matches' }}
        </div>
        <div v-else class="rt-list">
          <div v-for="m in liveMatches" :key="m.id" class="live-row">
            <div class="live-side" :class="{ '--winner': m.winnerId === m.player1?.id }">
              <span v-if="m.player1?.country" class="live-flag">{{ codeToFlag(m.player1.country) }}</span>
              <span class="live-name">{{ m.player1?.login || '???' }}</span>
              <span class="live-hp">{{ m.player1Hp }}</span>
            </div>
            <span class="live-vs">vs</span>
            <div class="live-side" :class="{ '--winner': m.winnerId === m.player2?.id }">
              <span class="live-hp">{{ m.player2Hp }}</span>
              <span class="live-name">{{ m.player2?.login || '???' }}</span>
              <span v-if="m.player2?.country" class="live-flag">{{ codeToFlag(m.player2.country) }}</span>
            </div>
            <span class="live-time">{{ formatTimeAgo(m.createdAt) }}</span>
          </div>
        </div>
      </div>

      <!-- YOUR row (sticky bottom) -->
      <div v-if="activeAgent && activeTab === 'global'" class="rt-your-row">
        <div class="rt-your-label">{{ rv2.lblYourRank || 'YOUR RANK' }}</div>
        <div class="rt-your-content">
          <img :src="`/images/skins/${activeAgent.skin}`" class="rt-your-avatar" alt="" />
          <span class="rt-your-name">{{ activeAgent.name }}</span>
          <BeltBadge :grade="activeAgent.belt || 0" :is-hexmaster="activeAgent.isHexmaster || false" size="sm" />
          <span class="rt-your-wins">{{ activeAgent.qualifiedWins || 0 }} wins</span>
          <span v-if="nextRankInfo" class="rt-next-rank">{{ interpolate(rv2.lblToNextRank || '+{n} to next rank', { n: nextRankInfo }) }}</span>
        </div>
      </div>

      <div class="scroll-gap"></div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import store from '@/core/state/store.js';
import { t, interpolate } from '@/locales/index.js';
import { getNextThreshold } from '@/utils/beltDisplay.js';
import { codeToFlag } from '@/data/countries.js';
import apiClient from '@/core/api/apiClient.js';
import AgentLeaderboard from '@/components/ratings/AgentLeaderboard.vue';
import BeltBadge from '@/components/ui/BeltBadge.vue';

export default {
  name: 'RatingsViewV2',
  components: { AgentLeaderboard, BeltBadge },
  setup() {
    const rv2 = computed(() => t.value.rating?.v2 || {});
    const activeTab = ref('global');
    const searchQuery = ref('');

    const tabs = computed(() => [
      { id: 'global', label: rv2.value.tabGlobal || 'GLOBAL' },
      { id: 'friends', label: rv2.value.tabFriends || 'FRIENDS' },
      { id: 'clan', label: rv2.value.tabClan || 'CLAN' },
      { id: 'country', label: rv2.value.tabCountry || 'COUNTRY' },
      { id: 'live', label: rv2.value.tabLive || 'LIVE' },
    ]);

    const master = computed(() => store.getters['master/getMaster']);
    const myClanId = computed(() => master.value?.userData?.clanId || null);
    const activeAgent = computed(() => store.getters['agent/activeAgent']);
    const friends = computed(() => store.getters['friends/getFriends'] || []);

    const clanData = computed(() => {
      if (!myClanId.value) return null;
      return store.getters['clan/getClanById'](myClanId.value);
    });
    const clanMembers = computed(() => {
      if (!clanData.value?.members) return [];
      return [...clanData.value.members].sort((a, b) => (b.wins || 0) - (a.wins || 0));
    });

    const nextRankInfo = computed(() => {
      const agent = activeAgent.value;
      if (!agent) return null;
      const info = getNextThreshold(agent.qualifiedWins || 0, agent.belt || 0);
      return info.remaining;
    });

    // Phase 4.6 — Country tab + Live tab data
    const userCountry = computed(() => master.value?.userData?.country || null);
    const countryLeaderboard = ref([]);
    const countryLoading = ref(false);
    const liveMatches = ref([]);
    const liveLoading = ref(false);
    let livePollInterval = null;

    async function fetchCountryLeaderboard() {
      if (!userCountry.value) return;
      countryLoading.value = true;
      try {
        const res = await apiClient.get(
          `/stats/leaderboard/country?country=${userCountry.value}&limit=50`,
          { authRequired: true },
        );
        countryLeaderboard.value = res?.data?.leaderboard || [];
      } catch (err) {
        console.error('Country leaderboard fetch error:', err);
      } finally {
        countryLoading.value = false;
      }
    }

    async function fetchLiveMatches() {
      try {
        const res = await apiClient.get('/stats/live-matches?limit=20', { authRequired: true });
        liveMatches.value = res?.data?.matches || [];
      } catch (err) {
        console.error('Live matches fetch error:', err);
      } finally {
        liveLoading.value = false;
      }
    }

    function formatTimeAgo(iso) {
      const sec = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
      if (sec < 60) return `${sec}s ago`;
      if (sec < 3600) return `${Math.round(sec / 60)}m ago`;
      if (sec < 86400) return `${Math.round(sec / 3600)}h ago`;
      return `${Math.round(sec / 86400)}d ago`;
    }

    // Lazy fetch on tab switch; polling only while Live tab is active.
    watch(activeTab, (tab) => {
      if (tab === 'country' && userCountry.value && countryLeaderboard.value.length === 0) {
        fetchCountryLeaderboard();
      }
      if (tab === 'live') {
        liveLoading.value = true;
        fetchLiveMatches();
        if (!livePollInterval) {
          livePollInterval = setInterval(fetchLiveMatches, 30000);
        }
      } else if (livePollInterval) {
        clearInterval(livePollInterval);
        livePollInterval = null;
      }
    });

    // Refetch country leaderboard when user picks a new country.
    watch(userCountry, (newCountry) => {
      if (activeTab.value === 'country') {
        countryLeaderboard.value = [];
        if (newCountry) fetchCountryLeaderboard();
      }
    });

    onMounted(() => {
      if (!friends.value.length) store.dispatch('friends/loadFriends').catch(() => {});
      if (!store.state.agent?.agents?.length) store.dispatch('agent/fetchAgents').catch(() => {});
      if (myClanId.value) store.dispatch('clan/loadClanById', myClanId.value).catch(() => {});
    });

    onBeforeUnmount(() => {
      if (livePollInterval) {
        clearInterval(livePollInterval);
        livePollInterval = null;
      }
    });

    return {
      t, interpolate, rv2, activeTab, searchQuery, tabs,
      myClanId, activeAgent, friends, clanData, clanMembers, nextRankInfo,
      userCountry, countryLeaderboard, countryLoading,
      liveMatches, liveLoading,
      codeToFlag, formatTimeAgo,
    };
  },
};
</script>

<style scoped>
.ratings-v2 {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: var(--hex-bg-deep);
}
@supports (height: 100dvh) { .ratings-v2 { height: 100dvh; } }

.ratings-scroll {
  position: relative;
  z-index: 10;
  overflow-y: auto;
  height: 100%;
  padding: 80px 16px 120px;
  max-width: 700px;
  margin: 0 auto;
  -webkit-overflow-scrolling: auto;
  overscroll-behavior-y: none;
}

.ratings-title {
  font-family: var(--hex-font-display);
  font-size: 28px;
  color: var(--hex-text-primary);
  letter-spacing: 3px;
  text-align: center;
  margin-bottom: 16px;
}

/* Tabs */
.ratings-tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--hex-border-default);
  margin-bottom: 16px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.rt-tab {
  flex: 1;
  min-width: 0;
  padding: 10px 8px;
  font-family: var(--hex-font-display);
  font-size: 11px;
  letter-spacing: 1.5px;
  color: var(--hex-text-muted);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  text-align: center;
  white-space: nowrap;
  transition: all 0.2s;
}
.rt-tab.active {
  color: var(--hex-primary);
  border-bottom-color: var(--hex-primary);
}

/* Search */
.ratings-search { margin-bottom: 12px; }
.search-input {
  width: 100%;
  padding: 10px 14px;
  background: var(--hex-bg-card);
  border: 1px solid var(--hex-border-default);
  border-radius: var(--hex-radius-md);
  color: var(--hex-text-primary);
  font-family: var(--hex-font-body);
  font-size: 13px;
  outline: none;
}
.search-input:focus { border-color: var(--hex-border-active); }
.search-input::placeholder { color: var(--hex-text-muted); }

/* Tab content */
.tab-content { min-height: 200px; }
.tab-placeholder {
  text-align: center;
  padding: 60px 20px;
  font-size: 14px;
  color: var(--hex-text-muted);
}

/* Row list (friends, clan) */
.rt-list { display: flex; flex-direction: column; gap: 4px; }
.rt-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--hex-bg-card);
  border: 1px solid var(--hex-border-default);
  border-radius: var(--hex-radius-md);
  transition: border-color 0.15s;
}
.rt-row:hover { border-color: var(--hex-border-active); }
.rt-rank {
  width: 24px;
  text-align: center;
  font-family: var(--hex-font-mono);
  font-size: 14px;
  color: var(--hex-text-muted);
  flex-shrink: 0;
}
.rt-rank.rank-1 { color: #FFD700; }
.rt-rank.rank-2 { color: #C0C0C0; }
.rt-rank.rank-3 { color: #CD7F32; }
.rt-avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--hex-radius-sm);
  object-fit: cover;
  object-position: top;
  flex-shrink: 0;
}
.rt-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--hex-text-muted); flex-shrink: 0;
}
.rt-dot.online { background: var(--hex-victory); box-shadow: 0 0 6px var(--hex-victory); }
.rt-name { flex: 1; color: var(--hex-text-primary); font-size: 14px; }
.rt-wins { font-family: var(--hex-font-mono); font-size: 12px; color: var(--hex-victory); }
.rt-flag { font-size: 18px; flex-shrink: 0; }
.rt-elo { font-family: var(--hex-font-mono); font-size: 12px; color: var(--hex-text-primary); }

/* Country CTA */
.tab-placeholder--cta {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
}
.cta-btn {
  font-family: var(--hex-font-mono);
  font-size: 11px;
  padding: 8px 16px;
  background: var(--hex-bg-deep);
  color: var(--hex-text-primary);
  border: 1px solid var(--hex-primary);
  border-radius: var(--hex-radius-sm);
  cursor: pointer;
  letter-spacing: 1px;
  text-transform: uppercase;
}
.cta-btn:hover { background: var(--hex-primary); color: var(--hex-bg-deep); }

/* Live feed row */
.live-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  background: var(--hex-bg-card);
  border: 1px solid var(--hex-border-default);
  border-radius: var(--hex-radius-md);
  font-family: var(--hex-font-mono);
  font-size: 12px;
}
.live-side { display: flex; align-items: center; gap: 6px; flex: 1; }
.live-side.--winner .live-name { color: var(--hex-primary); font-weight: 500; }
.live-flag { font-size: 14px; }
.live-name { color: var(--hex-text-primary); }
.live-hp { color: var(--hex-text-primary); min-width: 24px; text-align: center; font-weight: 500; }
.live-vs { color: var(--hex-text-muted); font-size: 10px; padding: 0 4px; }
.live-time { color: var(--hex-text-muted); font-size: 10px; min-width: 54px; text-align: right; }

/* YOUR row */
.rt-your-row {
  position: sticky;
  bottom: 0;
  background: var(--hex-bg-card);
  border: 1px solid var(--hex-border-default);
  border-left: 3px solid var(--hex-primary);
  border-radius: var(--hex-radius-md);
  padding: 12px;
  margin-top: 16px;
  backdrop-filter: blur(8px);
}
.rt-your-label {
  font-family: var(--hex-font-display);
  font-size: 9px;
  color: var(--hex-text-muted);
  letter-spacing: 2px;
  margin-bottom: 6px;
}
.rt-your-content {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.rt-your-avatar {
  width: 36px; height: 36px;
  border-radius: var(--hex-radius-sm);
  object-fit: cover; object-position: top;
}
.rt-your-name { font-size: 15px; color: var(--hex-text-primary); font-weight: 500; }
.rt-your-wins { font-family: var(--hex-font-mono); font-size: 12px; color: var(--hex-text-secondary); }
.rt-next-rank { font-size: 11px; color: var(--hex-primary); }

.scroll-gap { height: 80px; }

@media (max-width: 480px) {
  .rt-tab { font-size: 10px; letter-spacing: 1px; padding: 8px 4px; }
}
</style>
