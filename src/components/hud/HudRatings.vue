<!-- Epic 5 — Sub-Epic 5C Step 6.
     HUD skeleton for /v2/ratings — markup only, no handlers yet.
     Step 7 wires scope tabs + search + mock leaderboard rows.
     Step 8 binds sticky your-row to master.userData.captain.
     Step 9 polishes season toggle. Step 10 mobile responsive.
     Source: prototype hexlash_v24.html lines 4767-4819 (HUD markup). -->
<script setup>
// Step 7: scope/season/search reactive state + v-for rendering + handlers.
// Step 8: sticky your-row bound to master.userData.captain (+ login + flat
// wins/losses). Null-safe — entire row hidden if captain missing.
import { ref, computed, watch, onMounted } from 'vue';
import { useStore } from 'vuex';
import { t } from '@/locales/index.js';
import { getBeltDisplay } from '@/utils/beltDisplay.js';

defineEmits(['back']);

const store = useStore();

// ===== Archetype helpers (Correction 4 from Step 0 pre-flight) =====
// Backend master.userData.captain.primaryModule is a full name ('predator')
// but CSS classes in create.css are short-IDs (arch-tag-pre). Map both
// directions here — mock data uses short-IDs directly, real captain data
// needs this translation.
const ARCHETYPE_SHORT = {
  predator: 'pre', analyst: 'ana', ghost: 'gho',
  sentinel: 'sen', maverick: 'mav', juggernaut: 'jug',
};
const ARCHETYPE_NAMES = {
  predator: 'Predator', analyst: 'Analyst', ghost: 'Ghost',
  sentinel: 'Sentinel', maverick: 'Maverick', juggernaut: 'Juggernaut',
};
function archetypeIdShort(fullName) {
  return ARCHETYPE_SHORT[String(fullName || '').toLowerCase()] || 'jug';
}
function archetypeName(fullName) {
  return ARCHETYPE_NAMES[String(fullName || '').toLowerCase()] || '—';
}

// ===== Reactive state =====
// Sub-epic 2 Commit 3: 5-scope×2-season replaced with 4-tab navigation.
// Per-tab data + search wiring lands in Commits 4-7
// (FIGHTERS / CLANS / AGENTS / MY_CLAN).
const activeTab = ref('myclan'); // myclan | clans | fighters | agents
function setActiveTab(next) {
  activeTab.value = next;
}

// ===== FIGHTERS tab state (Commit 4) =====
// Backend response shape per /v1/user/search (post-6B-3a-backend):
//   data: [{ ...UserModel public fields, captain: {belt, isHexmaster, elo, primaryModule, ...} | null }]
// UserModel.fromJSON now extracts captain (Commit 4 extension).
// Vuex append semantics handled via reset-before-load (F3 mitigation).
const fightersRows = computed(() => store.getters['user/getParticipantRatingsList'] || []);
const fightersSearch = ref('');
const fightersLoading = ref(false);
const fightersError = ref(null);
let fightersTimeout = null;

async function loadFighters() {
  fightersLoading.value = true;
  fightersError.value = null;
  try {
    store.commit('user/resetParticipantRatings');
    await store.dispatch('user/loadParticipantRatings', {
      search: fightersSearch.value,
      sortBy: 'battles',
      page: 0,
      clanId: null,
    });
  } catch (err) {
    fightersError.value = err?.message || 'Failed to load fighters';
  } finally {
    fightersLoading.value = false;
  }
}

function onFightersSearch(e) {
  fightersSearch.value = e.target.value;
  clearTimeout(fightersTimeout);
  fightersTimeout = setTimeout(() => loadFighters(), 200);
}

// Initial load on first activation per tab.
// Each tab triggers its own loader when first activated AND its rows empty.
watch(activeTab, (next) => {
  if (next === 'fighters' && fightersRows.value.length === 0) {
    loadFighters();
  } else if (next === 'clans' && clansRows.value.length === 0) {
    loadClans();
  } else if (next === 'agents' && agentsRows.value.length === 0) {
    loadAgents();
  } else if (next === 'myclan' && hasOwnClan.value && !myClanData.value) {
    loadMyClan();
  }
});

// ===== Row class / formatter helpers =====
function rowRankClass(row) {
  return row.rank <= 3 ? `rank-${row.rank}` : '';
}
function wrClass(wr) {
  if (wr >= 60) return 'good';
  if (wr < 45) return 'bad';
  return '';
}
// WR computed inline — flat user.wins / user.losses (CLAUDE.md 5C §5.4).
function rowWr(u) {
  const total = (u.wins ?? 0) + (u.losses ?? 0);
  return total > 0 ? Math.round(((u.wins ?? 0) / total) * 100) : 0;
}

// ===== CLANS tab state (Commit 5) =====
// Backend response /v1/clan/search → ClanModel[] with .id/.name/.members
// (number, not array)/.wins/.battles/.level/.xp. NO `losses` field —
// computed as `battles - wins`. F3 mitigation: reset BEFORE load.
const clansRows = computed(() => store.getters['clan/getClanRatingsList'] || []);
const clansSearch = ref('');
const clansLoading = ref(false);
const clansError = ref(null);
let clansTimeout = null;

async function loadClans() {
  clansLoading.value = true;
  clansError.value = null;
  try {
    store.commit('clan/resetClanRatings');
    await store.dispatch('clan/loadClanRatings', {
      search: clansSearch.value,
      sortBy: 'battles',
      page: 0,
    });
  } catch (err) {
    clansError.value = err?.message || 'Failed to load clans';
  } finally {
    clansLoading.value = false;
  }
}

function onClansSearch(e) {
  clansSearch.value = e.target.value;
  clearTimeout(clansTimeout);
  clansTimeout = setTimeout(() => loadClans(), 200);
}

// Clan row helpers — battles/wins flat, losses derived.
function clanLosses(c) {
  return Math.max(0, (c.battles ?? 0) - (c.wins ?? 0));
}
function clanWr(c) {
  const b = c.battles ?? 0;
  return b > 0 ? Math.round(((c.wins ?? 0) / b) * 100) : 0;
}

// ===== AGENTS tab state (Commit 6) =====
// Backend response /v1/agent/rankings → { rankings: [{rank, agent, owner}], total }.
// agentState REPLACE semantics (Commit 1) → NO F3 reset needed.
// Filter: totalFights >= 5 enforced backend (RANKED_MIN_FIGHTS_FOR_RANKING).
// NO search input — endpoint doesn't support search param.
const agentsRows = computed(() => store.getters['agent/getAgentRankings'] || []);
const agentsLoading = ref(false);
const agentsError = ref(null);

async function loadAgents() {
  agentsLoading.value = true;
  agentsError.value = null;
  try {
    await store.dispatch('agent/loadAgentRankings', { offset: 0, limit: 20 });
  } catch (err) {
    agentsError.value = err?.message || 'Failed to load agents';
  } finally {
    agentsLoading.value = false;
  }
}

// ===== MY_CLAN tab state (Commit 7) — default tab =====
// Two branches:
//   - no-clan (clanId null) → CTA → /v2/clan
//   - has-clan → compact summary card → click → /v2/clan
// Pattern mirrors HudClan.vue:125+242 (clanId computed + onMounted dispatch
// when clanId && !cached). Uses sync getter `clan/getClanById(id)` after
// async dispatch fills cache.
const myClanId = computed(() => userData.value?.clanId ?? null);
const hasOwnClan = computed(() => !!myClanId.value);
const myClanData = computed(() =>
  myClanId.value ? store.getters['clan/getClanById'](myClanId.value) : null
);
const myClanLoading = ref(false);
const myClanError = ref(null);

async function loadMyClan() {
  if (!myClanId.value || myClanData.value) return;  // no-op if no clan or cache hit
  myClanLoading.value = true;
  myClanError.value = null;
  try {
    await store.dispatch('clan/getClanById', myClanId.value);
  } catch (err) {
    myClanError.value = err?.message || 'Failed to load clan';
  } finally {
    myClanLoading.value = false;
  }
}

// Initial fetch on mount — myclan is default tab, watch won't trigger.
onMounted(() => {
  loadMyClan();
});

// ===== Sticky your-row — bound to master.userData (Step 8) =====
// Source:
//   - login: userData.login
//   - captain: userData.captain (belt, isHexmaster, elo, primaryModule)
//   - wins / losses: userData.wins / userData.losses (flat, not .stats —
//     prototype TZ §11 was wrong; 5B HudProfile uses same flat pattern)
//   - streak: NOT tracked in UserModel → null fallback, displays '—'
const userData = computed(() => store.getters['master/getMaster']?.userData || null);
const hasCaptain = computed(() => !!userData.value?.captain);

function beltLabelShort(grade) {
  const { color } = getBeltDisplay(grade ?? 0);
  return color ? color.charAt(0).toUpperCase() + color.slice(1) : '—';
}

const yourRow = computed(() => {
  const u = userData.value;
  if (!u?.captain) return null;

  const captain = u.captain;
  const wins = u.wins ?? 0;
  const losses = u.losses ?? 0;
  const total = wins + losses;
  const wr = total > 0 ? Math.round((wins / total) * 100) : 0;

  return {
    handle: u.login || '—',
    arch: {
      id: archetypeIdShort(captain.primaryModule),
      name: archetypeName(captain.primaryModule),
    },
    belt: captain.isHexmaster ? 'Hexmaster' : beltLabelShort(captain.belt),
    elo: captain.elo ?? 0,
    wins,
    losses,
    wr,
    // No streak field in UserModel — null signals '—' in template.
    streak: null,
  };
});

// ===== myRank / nextRankHint (position within FIGHTERS view) =====
// Sub-epic 2 Commit 4: fightersRows = UserModel[] from /v1/user/search.
// ELO comparison via row.captain?.elo (sub-object access — UserModel does
// not store rating/elo top-level on user; captain holds elo for fighter).
// Sticky shows only on activeTab === 'fighters' so this scope is safe.
const myRank = computed(() => {
  if (!yourRow.value) return null;
  const myElo = yourRow.value.elo;
  const rowsArr = fightersRows.value;
  if (rowsArr.length === 0) return null;
  let rank = 1;
  for (const r of rowsArr) {
    if (myElo >= (r.captain?.elo ?? 0)) break;
    rank++;
  }
  return rank;
});

const nextRankHint = computed(() => {
  if (!yourRow.value || !fightersRows.value.length) return null;
  const mr = myRank.value;
  if (!mr) return null;
  if (mr <= 10) return { kind: 'top10' };
  const targetRank = Math.max(1, Math.floor((mr - 1) / 10) * 10);
  const targetRow = fightersRows.value[targetRank - 1];
  if (!targetRow) return null;
  const diff = (targetRow.captain?.elo ?? 0) - yourRow.value.elo + 1;
  return { kind: 'climb', eloDiff: diff, targetRank };
});
</script>

<template>
  <div class="hud ratings-hud">
    <!-- ===== Back button (top-left) ===== -->
    <button class="ratings-back" @click="$emit('back')">← Back</button>

    <!-- ===== Title (top-centre) ===== -->
    <div class="ratings-title">
      <div class="rt-kicker">Hexlash</div>
      <div class="rt-name">LEADERBOARD</div>
    </div>

    <!-- ===== Main panel: 4-tab toolbar + per-tab content ===== -->
    <!-- Sub-epic 2 Commit 3: 5-scope/2-season → 4-tab structure.
         Per-tab content panels are placeholders until Commits 4-7 wire data
         (FIGHTERS / CLANS / AGENTS / MY_CLAN). Search input moved per-tab. -->
    <div class="ratings-panel">
      <div class="ratings-toolbar">
        <div class="ratings-tabs">
          <button
            class="rt-tab"
            :class="{ active: activeTab === 'myclan' }"
            @click="setActiveTab('myclan')"
          >{{ t.rating.lblMyClan }}</button>
          <button
            class="rt-tab"
            :class="{ active: activeTab === 'clans' }"
            @click="setActiveTab('clans')"
          >{{ t.rating.lblClans }}</button>
          <button
            class="rt-tab"
            :class="{ active: activeTab === 'fighters' }"
            @click="setActiveTab('fighters')"
          >{{ t.rating.lblFighters }}</button>
          <button
            class="rt-tab"
            :class="{ active: activeTab === 'agents' }"
            @click="setActiveTab('agents')"
          >{{ t.rating.lblAgents }}</button>
        </div>
      </div>

      <!-- ===== MY_CLAN tab — default tab (Commit 7) ===== -->
      <!-- Dual-branch: no-clan CTA OR has-clan compact summary card.
           Both branches navigate to /v2/clan on action.
           Inline EN per Q-tactical-3. -->
      <template v-if="activeTab === 'myclan'">
        <div v-if="myClanLoading" class="rt-empty">{{ 'Loading…' }}</div>
        <div v-else-if="myClanError" class="rt-empty">{{ t.rating.error }}</div>
        <div v-else-if="!hasOwnClan" class="myclan-empty">
          <div class="myclan-empty-msg">You're not in a clan</div>
          <button class="myclan-cta" @click="$router.push('/v2/clan')">
            Create or browse clans
          </button>
        </div>
        <div
          v-else
          class="myclan-summary clickable"
          @click="$router.push('/v2/clan')"
        >
          <div class="myclan-row">
            <img
              v-if="myClanData?.avatarUrl"
              :src="myClanData.avatarUrl"
              class="myclan-avatar"
              alt=""
            />
            <div class="myclan-info">
              <div class="myclan-name">{{ myClanData?.name ?? '—' }}</div>
              <div class="myclan-meta">
                Lv {{ myClanData?.level ?? 1 }} · {{ myClanData?.members ?? 0 }} members
              </div>
            </div>
          </div>
          <div class="myclan-stats">
            <div>Wins: {{ myClanData?.wins ?? 0 }}</div>
            <div>Battles: {{ myClanData?.battles ?? 0 }}</div>
          </div>
        </div>
      </template>

      <!-- ===== CLANS tab — wired to clan/loadClanRatings (Commit 5) ===== -->
      <template v-else-if="activeTab === 'clans'">
        <div class="ratings-search-row">
          <input
            class="ratings-search"
            :placeholder="t.rating.clanPlaceholder"
            :value="clansSearch"
            @input="onClansSearch"
          />
        </div>

        <div class="ratings-thead">
          <div>#</div>
          <div>Clan</div>
          <div class="num">Members</div>
          <div class="num">Wins</div>
          <div class="num">Losses</div>
          <div class="num">WR</div>
        </div>

        <div class="ratings-tbody">
          <div v-if="clansLoading" class="rt-empty">{{ 'Loading…' }}</div>
          <div v-else-if="clansError" class="rt-empty">{{ t.rating.error }}</div>
          <div v-else-if="clansRows.length === 0" class="rt-empty">{{ t.rating.noResults }}</div>
          <div
            v-else
            v-for="(row, idx) in clansRows"
            :key="`clans|${row.id}`"
            class="rt-row clickable"
            :class="rowRankClass({ rank: idx + 1 })"
            @click="$router.push('/v2/clan/' + row.id)"
          >
            <div class="rt-rank"><span class="rnk-num">#{{ idx + 1 }}</span></div>
            <div class="rt-handle">{{ row.name }}</div>
            <div class="num">{{ row.members ?? 0 }}</div>
            <div class="num">{{ row.wins ?? 0 }}</div>
            <div class="num">{{ clanLosses(row) }}</div>
            <div class="num rt-wr" :class="wrClass(clanWr(row))">{{ clanWr(row) }}%</div>
          </div>
        </div>
      </template>

      <!-- ===== AGENTS tab — wired to agent/loadAgentRankings (Commit 6) ===== -->
      <template v-else-if="activeTab === 'agents'">
        <div class="ratings-thead">
          <div>#</div>
          <div>Agent</div>
          <div>Owner</div>
          <div>Belt</div>
          <div class="num">Q. Wins</div>
          <div class="num">ELO</div>
        </div>

        <div class="ratings-tbody">
          <div v-if="agentsLoading" class="rt-empty">{{ 'Loading…' }}</div>
          <div v-else-if="agentsError" class="rt-empty">{{ t.rating.error }}</div>
          <div v-else-if="agentsRows.length === 0" class="rt-empty">{{ t.rating.lblNoRankedAgents }}</div>
          <div
            v-else
            v-for="row in agentsRows"
            :key="`agents|${row.agent.id}`"
            class="rt-row clickable"
            :class="rowRankClass({ rank: row.rank })"
            @click="$router.push('/v2/fd/' + row.agent.id)"
          >
            <div class="rt-rank"><span class="rnk-num">#{{ row.rank }}</span></div>
            <div class="rt-handle">
              {{ row.agent.name }}<span v-if="row.agent.isHexmaster" class="hexmaster-badge" title="Hexmaster"> 👑</span>
            </div>
            <div class="rt-handle">{{ row.owner?.login || '—' }}</div>
            <div class="rt-belt">{{ row.agent.isHexmaster ? 'Hexmaster' : beltLabelShort(row.agent.belt) }}</div>
            <div class="num">{{ row.agent.qualifiedWins ?? 0 }}</div>
            <div class="num rt-elo">{{ row.agent.elo != null ? row.agent.elo.toLocaleString() : '—' }}</div>
          </div>
        </div>
      </template>

      <!-- ===== FIGHTERS tab — wired to user/loadParticipantRatings (Commit 4) ===== -->
      <template v-else-if="activeTab === 'fighters'">
        <div class="ratings-search-row">
          <input
            class="ratings-search"
            :placeholder="t.rating.participantPlaceholder"
            :value="fightersSearch"
            @input="onFightersSearch"
          />
        </div>

        <div class="ratings-thead">
          <div>#</div>
          <div>Handle</div>
          <div class="col-arch">Archetype</div>
          <div class="col-belt">Belt</div>
          <div class="num">ELO</div>
          <div class="num col-wl">W/L</div>
          <div class="num">WR</div>
        </div>

        <div class="ratings-tbody">
          <div v-if="fightersLoading" class="rt-empty">{{ 'Loading…' }}</div>
          <div v-else-if="fightersError" class="rt-empty">{{ t.rating.error }}</div>
          <div v-else-if="fightersRows.length === 0" class="rt-empty">{{ t.rating.noResults }}</div>
          <div
            v-else
            v-for="(row, idx) in fightersRows"
            :key="`fighters|${row.id || row.login}`"
            class="rt-row clickable"
            :class="rowRankClass({ rank: idx + 1 })"
            @click="$router.push('/v2/user/' + row.login)"
          >
            <div class="rt-rank"><span class="rnk-num">#{{ idx + 1 }}</span></div>
            <div class="rt-handle">{{ row.login }}</div>
            <div
              class="rt-arch col-arch"
              :class="row.captain ? `arch-tag-${archetypeIdShort(row.captain.primaryModule)}` : ''"
            >{{ row.captain ? archetypeName(row.captain.primaryModule) : '—' }}</div>
            <div class="rt-belt col-belt">{{ row.captain?.isHexmaster ? 'Hexmaster' : (row.captain ? beltLabelShort(row.captain.belt) : '—') }}</div>
            <div class="num rt-elo">{{ row.captain?.elo != null ? row.captain.elo.toLocaleString() : '—' }}</div>
            <div class="num rt-wl col-wl">{{ row.wins ?? 0 }} / {{ row.losses ?? 0 }}</div>
            <div class="num rt-wr" :class="wrClass(rowWr(row))">{{ rowWr(row) }}%</div>
          </div>
        </div>
      </template>
    </div>

    <!-- ===== Sticky your-row (bottom footer) ===== -->
    <!-- Sub-epic 2 Commit 3: visible only on FIGHTERS tab (captain is a
         fighter-level entity). Other 3 tabs hide sticky row.
         Null-safe: hidden entirely when captain is missing. -->
    <div v-if="yourRow && activeTab === 'fighters'" class="rt-your-row">
      <div class="rt-your-label">You</div>
      <div class="rt-row">
        <div class="rt-rank">
          <span class="rnk-num">{{ myRank ? `#${myRank}` : '#—' }}</span>
        </div>
        <div class="rt-handle">{{ yourRow.handle }}</div>
        <div class="rt-arch col-arch" :class="`arch-tag-${yourRow.arch.id}`">
          {{ yourRow.arch.name }}
        </div>
        <div class="rt-belt col-belt">{{ yourRow.belt }}</div>
        <div class="num rt-elo">{{ yourRow.elo.toLocaleString() }}</div>
        <div class="num rt-wl col-wl">{{ yourRow.wins }} / {{ yourRow.losses }}</div>
        <div class="num rt-wr" :class="wrClass(yourRow.wr)">{{ yourRow.wr }}%</div>
      </div>
      <div v-if="nextRankHint" class="rt-next-rank">
        <template v-if="nextRankHint.kind === 'top10'">Top 10 reached</template>
        <template v-else>
          Next rank: <strong>+{{ nextRankHint.eloDiff }} ELO</strong>
          to reach top {{ nextRankHint.targetRank }}
        </template>
      </div>
    </div>
  </div>
</template>

<!-- Hot-fix 10.1: Step 6 markup was ported without a `<style scoped>` block.
     Parent RatingsView.vue sets `.ratings-view { pointer-events: none }` to
     let CanvasLayer receive 3D drag events — every v2 HUD component is
     expected to re-enable pointer-events on its own root (5B HudProfile.vue
     line 618 establishes this pattern). Without the reset, scope tabs /
     season chips / search input inherited `none` → nothing was clickable.
     `position: absolute; inset: 0` also anchors positioned descendants
     (back / title / season / panel / sticky your-row) to the HUD box
     rather than the parent `.ratings-view`, matching 5B layout. -->
<style scoped>
.ratings-hud {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.ratings-hud > * {
  pointer-events: auto;
}

/* Sub-epic 2 Commit 7 — MY_CLAN tab minimal styling.
   Compact summary card (NOT full v1 MyClubTab port per default 1). */
.myclan-empty {
  text-align: center;
  padding: 24px 16px;
}
.myclan-empty-msg {
  color: var(--text-mid);
  font-size: 14px;
  margin-bottom: 12px;
}
.myclan-cta {
  background: var(--hex-primary);
  color: #fff;
  border: 0;
  padding: 8px 18px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}
.myclan-cta:hover {
  filter: brightness(1.1);
}
.myclan-summary {
  padding: 12px 14px;
  border: 1px solid var(--bg-panel-border, #2a2a3a);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.02);
}
.myclan-summary.clickable {
  cursor: pointer;
}
.myclan-summary.clickable:hover {
  background: rgba(255, 255, 255, 0.04);
}
.myclan-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}
.myclan-avatar {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
}
.myclan-info {
  flex: 1;
  min-width: 0;
}
.myclan-name {
  font-size: 14px;
  color: var(--text-strong, #fff);
  font-weight: 600;
}
.myclan-meta {
  font-size: 11px;
  color: var(--text-mid);
}
.myclan-stats {
  display: flex;
  gap: 18px;
  font-size: 12px;
  color: var(--text-mid);
  font-family: 'AnonymousBalance', monospace;
}
</style>
