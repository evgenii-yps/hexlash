<template>
  <div class="agent-leaderboard">

    <!-- Onboarding: no agents yet -->
    <div v-if="!loading && !hasOwnAgents" class="onboarding-block">
      <div class="onboarding-icon">🥊</div>
      <div class="onboarding-title">{{ t.club.lblClubMode || 'CLUB MODE' }}</div>
      <div class="onboarding-desc">{{ t.club.lblPromoDesc || 'Train AI fighters. Send them to battle 24/7. Rise through leagues.' }}</div>
      <HexButton variant="primary" block @click="router.push('/arena/club')">
        {{ t.club.lblEnterFightClub || 'Enter Fight Club' }}
      </HexButton>
    </div>

    <!-- Has agents: manage button -->
    <div v-if="!loading && hasOwnAgents" class="manage-row">
      <HexButton variant="secondary" size="sm" @click="router.push('/arena/club')">
        {{ t.club.lblManageFightClub || 'Manage Fight Club' }}
      </HexButton>
    </div>

    <!-- League filter -->
    <div class="league-filter">
      <button v-for="f in filters" :key="f.id" :class="['filter-btn', { active: leagueFilter === f.id }]" @click="setFilter(f.id)">
        {{ f.label }}
      </button>
    </div>

    <!-- My Agents (from rankings) -->
    <div v-if="myRankedAgents.length > 0" class="my-agents-section">
      <div class="section-label">{{ t.rating.lblYourAgents || 'YOUR AGENTS' }}</div>
      <div v-for="entry in myRankedAgents" :key="'my-' + entry.agent.id" class="rank-row rank-row--mine" @click="viewAgent(entry.agent.id)">
        <span class="rank-num">{{ entry.rank }}</span>
        <img class="rank-skin" :src="`/images/skins/${entry.agent.skin}`" :alt="entry.agent.name" />
        <div class="rank-info">
          <div class="rank-name">{{ entry.agent.name }}</div>
          <div class="rank-owner">@{{ entry.owner?.login }}</div>
        </div>
        <div class="rank-elo" :style="{ color: getLeagueColor(entry.agent.elo) }">{{ entry.agent.elo }}</div>
        <LeagueBadge :elo="entry.agent.elo" />
        <div class="rank-wl">
          <span class="wl-win">{{ entry.agent.wins }}</span>/<span class="wl-lose">{{ entry.agent.losses }}</span>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="leaderboard-loading">
      <v-progress-circular size="28" indeterminate />
    </div>

    <!-- Rankings list -->
    <div v-else>
      <div class="section-label">{{ t.rating.lblAgentRankings || 'AGENT RANKINGS' }}</div>

      <div v-if="filteredRankings.length === 0" class="empty-text">
        {{ t.rating.lblNoRankedAgents || 'No ranked agents yet' }}
      </div>

      <div v-for="entry in filteredRankings" :key="entry.agent.id" :class="['rank-row', { 'rank-row--top': entry.rank <= 3 }]" @click="viewAgent(entry.agent.id)">
        <span :class="['rank-num', { 'rank-gold': entry.rank === 1, 'rank-silver': entry.rank === 2, 'rank-bronze': entry.rank === 3 }]">{{ entry.rank }}</span>
        <img class="rank-skin" :src="`/images/skins/${entry.agent.skin}`" :alt="entry.agent.name" />
        <div class="rank-info">
          <div class="rank-name">{{ entry.agent.name }}</div>
          <div class="rank-meta">
            <span class="rank-owner">@{{ entry.owner?.login }}</span>
            <span class="rank-build">{{ shortBuild(entry.agent) }}</span>
          </div>
        </div>
        <div class="rank-elo" :style="{ color: getLeagueColor(entry.agent.elo) }">{{ entry.agent.elo }}</div>
        <LeagueBadge :elo="entry.agent.elo" />
        <div class="rank-wl">
          <span class="wl-win">{{ entry.agent.wins }}</span>/<span class="wl-lose">{{ entry.agent.losses }}</span>
        </div>
      </div>

      <div v-if="hasMore" class="load-more">
        <HexButton variant="ghost" size="sm" :loading="loadingMore" @click="loadMore">
          {{ t.rating.loadMore || 'Load More' }}
        </HexButton>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { t } from '@/locales/index.js'
import store from '@/core/state/store.js'
import apiClient from '@/core/api/apiClient.js'
import { LEAGUES, getLeagueColor } from '@/utils/leagues.js'
import HexButton from '@/components/ui/HexButton.vue'
import LeagueBadge from '@/components/ratings/LeagueBadge.vue'

export default {
  name: 'AgentLeaderboard',
  components: { HexButton, LeagueBadge },
  setup() {
    const router = useRouter();
    const rankings = ref([]);
    const total = ref(0);
    const loading = ref(true);
    const loadingMore = ref(false);
    const leagueFilter = ref('all');
    const offset = ref(0);
    const limit = 20;

    const currentUserId = computed(() => store.getters['master/getMaster']?.userData?.odId);
    const hasOwnAgents = computed(() => (store.state.agent.agents || []).length > 0);

    const filters = computed(() => [
      { id: 'all', label: t.value.rating?.lblAll || 'All' },
      ...LEAGUES.map(l => ({ id: l.id, label: l.name })),
    ]);

    const filteredRankings = computed(() => {
      if (leagueFilter.value === 'all') return rankings.value;
      const league = LEAGUES.find(l => l.id === leagueFilter.value);
      if (!league) return rankings.value;
      return rankings.value.filter(e => e.agent.elo >= league.min && e.agent.elo <= league.max);
    });

    const myRankedAgents = computed(() => {
      if (!currentUserId.value) return [];
      return rankings.value.filter(e => e.owner?.id === currentUserId.value);
    });

    const hasMore = computed(() => rankings.value.length < total.value);

    const fetchRankings = async (append = false) => {
      if (append) loadingMore.value = true;
      else loading.value = true;
      try {
        const { data } = await apiClient.get('/agent/rankings', { params: { limit, offset: offset.value }, authRequired: true });
        if (append) rankings.value.push(...(data.rankings || []));
        else rankings.value = data.rankings || [];
        total.value = data.total || 0;
      } catch { /* ignore */ }
      finally { loading.value = false; loadingMore.value = false; }
    };

    const loadMore = () => { offset.value += limit; fetchRankings(true); };
    const setFilter = (id) => { leagueFilter.value = id; };
    const viewAgent = (id) => router.push(`/arena/club/${id}`);
    const shortBuild = (a) => [a.primaryModule, a.secondaryModule, a.tertiaryModule].map(m => m?.slice(0, 3).toUpperCase()).join('/');

    onMounted(() => {
      fetchRankings();
      store.dispatch('agent/fetchAgents');
    });

    return { t, router, rankings, filteredRankings, myRankedAgents, hasOwnAgents, loading, loadingMore, hasMore, leagueFilter, filters, setFilter, loadMore, viewAgent, shortBuild, getLeagueColor };
  },
};
</script>

<style scoped>
/* Onboarding */
.onboarding-block {
  text-align: center;
  padding: 24px 16px;
  margin-bottom: 16px;
  background: var(--hex-bg-medium);
  border: 1px solid var(--hex-border-default);
  border-radius: 10px;
}
.onboarding-icon { font-size: 36px; margin-bottom: 8px; }
.onboarding-title {
  font-family: 'Anonymous', monospace;
  font-size: 16px;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--hex-primary);
  margin-bottom: 8px;
}
.onboarding-desc {
  font-size: 13px;
  color: var(--hex-text-muted);
  line-height: 1.5;
  margin-bottom: 16px;
}

.manage-row {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.league-filter {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.filter-btn {
  padding: 4px 8px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: 1px solid var(--hex-border-default);
  border-radius: 6px;
  background: var(--hex-bg-dark);
  color: var(--hex-text-muted);
  cursor: pointer;
  transition: all 0.15s;
}
.filter-btn.active {
  border-color: var(--hex-primary);
  color: var(--hex-primary);
  background: rgba(255, 6, 111, 0.08);
}

.section-label {
  font-family: 'Anonymous', monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--hex-text-muted);
  margin-bottom: 8px;
}

.my-agents-section {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--hex-border-default);
}

.rank-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  margin-bottom: 4px;
  background: var(--hex-bg-dark);
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}
.rank-row:hover { background: var(--hex-bg-light); }
.rank-row--mine {
  border: 1px solid var(--hex-primary);
  background: rgba(255, 6, 111, 0.05);
}
.rank-row--top { border-left: 2px solid var(--hex-draw); }

.rank-num {
  font-family: 'AnonymousBalance', monospace;
  font-size: 14px;
  color: var(--hex-text-muted);
  width: 28px;
  text-align: center;
  flex-shrink: 0;
}
.rank-gold { color: #FFD700; }
.rank-silver { color: #C0C0C0; }
.rank-bronze { color: #CD7F32; }

.rank-skin {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
}

.rank-info { flex: 1; min-width: 0; }
.rank-name {
  font-family: 'Anonymous', monospace;
  font-size: 12px;
  color: var(--hex-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rank-meta { display: flex; gap: 6px; }
.rank-owner { font-size: 10px; color: var(--hex-text-muted); }
.rank-build { font-size: 9px; color: var(--hex-text-muted); }

.rank-elo {
  font-family: 'AnonymousBalance', monospace;
  font-size: 14px;
  font-weight: bold;
  flex-shrink: 0;
}

.rank-wl {
  font-family: 'AnonymousBalance', monospace;
  font-size: 11px;
  flex-shrink: 0;
  min-width: 36px;
  text-align: right;
}
.wl-win { color: var(--hex-victory); }
.wl-lose { color: var(--hex-defeat); }

.leaderboard-loading { text-align: center; padding: 32px; }
.empty-text { text-align: center; font-size: 12px; color: var(--hex-text-muted); padding: 24px 0; }
.load-more { text-align: center; margin-top: 12px; }
</style>
