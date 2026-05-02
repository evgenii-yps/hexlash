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
import { ref, computed, watch } from 'vue';
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

// Initial load on first activation. Other tabs add their own watchers in 5-7.
watch(activeTab, (next) => {
  if (next === 'fighters' && fightersRows.value.length === 0) {
    loadFighters();
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

      <!-- ===== MY_CLAN tab placeholder (Commit 7) ===== -->
      <div v-if="activeTab === 'myclan'" data-tab="myclan"></div>

      <!-- ===== CLANS tab placeholder (Commit 5) ===== -->
      <div v-else-if="activeTab === 'clans'" data-tab="clans"></div>

      <!-- ===== AGENTS tab placeholder (Commit 6) ===== -->
      <div v-else-if="activeTab === 'agents'" data-tab="agents"></div>

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
          <div v-if="fightersLoading" class="rt-empty">{{ t.rating.lblLoading || 'Loading…' }}</div>
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
</style>
