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
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { RATINGS_DATA } from '@/data/ratingsMock.js';
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
const scope = ref('global');  // global | friends | clan | country | live
const season = ref('s1');     // s1 | all
const search = ref('');       // debounced (200ms) from searchInput

// Debounce search — input drives searchInput immediately for visual feedback,
// search commits after 200ms so v-for re-render doesn't fire per keystroke.
const searchInput = ref('');
let searchTimeout = null;
function onSearchInput(e) {
  searchInput.value = e.target.value;
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    search.value = searchInput.value;
  }, 200);
}

// ===== Computed filtered rows =====
const rows = computed(() => {
  const key = `${scope.value}|${season.value}`;
  const all = RATINGS_DATA[key] || [];
  const q = search.value.trim().toLowerCase();
  if (!q) return all;
  return all.filter((r) => r.handle.toLowerCase().includes(q));
});

// ===== Row class helpers =====
function rowRankClass(row) {
  return row.rank <= 3 ? `rank-${row.rank}` : '';
}
function wrClass(wr) {
  if (wr >= 60) return 'good';
  if (wr < 45) return 'bad';
  return '';
}
function streakStr(streak) {
  return streak.n > 0 ? `${streak.n}${streak.kind}` : '—';
}
function streakClass(streak) {
  return streak.n >= 5 && streak.kind === 'W' ? 'hot' : '';
}

// ===== Tab / season handlers =====
function setScope(next) {
  scope.value = next;
}
function setSeason(next) {
  season.value = next;
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

// ===== myRank / nextRankHint (position within current view) =====
// myRank: insert my ELO into current sorted view — first row where
// myElo >= r.elo wins me that rank. If no row fits, I'm at rows.length + 1.
const myRank = computed(() => {
  if (!yourRow.value) return null;
  const myElo = yourRow.value.elo;
  const rowsArr = rows.value;
  if (rowsArr.length === 0) return null;
  let rank = 1;
  for (const r of rowsArr) {
    if (myElo >= r.elo) break;
    rank++;
  }
  return rank;
});

// nextRankHint: if top-10 → 'Top 10 reached'. Otherwise compute ELO needed
// to reach previous decile (rank 42 → target rank 40, diff = rows[39].elo -
// myElo + 1). Structured return lets template split cleanly on .kind.
const nextRankHint = computed(() => {
  if (!yourRow.value || !rows.value.length) return null;
  const mr = myRank.value;
  if (!mr) return null;
  if (mr <= 10) return { kind: 'top10' };
  const targetRank = Math.max(1, Math.floor((mr - 1) / 10) * 10);
  const targetRow = rows.value[targetRank - 1];
  if (!targetRow) return null;
  const diff = targetRow.elo - yourRow.value.elo + 1;
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

    <!-- ===== Season chips (top-right) ===== -->
    <div class="ratings-season">
      <button
        :class="{ active: season === 's1' }"
        @click="setSeason('s1')"
      >Season 1</button>
      <button
        :class="{ active: season === 'all' }"
        @click="setSeason('all')"
      >All Time</button>
    </div>

    <!-- ===== Main panel: toolbar + thead + tbody ===== -->
    <!-- Step 7 wires: reactive `scope` ref + click handlers + active bind.
         Step 7 replaces static tabs with v-for over ['global','friends',
         'clan','country','live'] + debounced search via @input. -->
    <div class="ratings-panel">
      <div class="ratings-toolbar">
        <div class="ratings-tabs">
          <button
            v-for="s in ['global', 'friends', 'clan', 'country']"
            :key="s"
            class="rt-tab"
            :class="{ active: scope === s }"
            @click="setScope(s)"
          >{{ s[0].toUpperCase() + s.slice(1) }}</button>
          <button
            class="rt-tab"
            :class="{ active: scope === 'live' }"
            @click="setScope('live')"
          >
            Live <span style="color: var(--hex-primary); margin-left: 3px">●</span>
          </button>
        </div>
        <input
          class="ratings-search"
          placeholder="Search by handle..."
          :value="searchInput"
          @input="onSearchInput"
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
        <div class="num col-streak">Streak</div>
      </div>

      <div class="ratings-tbody">
        <div v-if="rows.length === 0" class="rt-empty">No results</div>
        <div
          v-for="row in rows"
          :key="`${scope}|${season}|${row.rank}|${row.handle}`"
          class="rt-row"
          :class="rowRankClass(row)"
        >
          <div class="rt-rank"><span class="rnk-num">#{{ row.rank }}</span></div>
          <div class="rt-handle">{{ row.handle }}</div>
          <div class="rt-arch col-arch" :class="`arch-tag-${row.arch.id}`">{{ row.arch.name }}</div>
          <div class="rt-belt col-belt">{{ row.belt }}</div>
          <div class="num rt-elo">{{ row.elo.toLocaleString() }}</div>
          <div class="num rt-wl col-wl">{{ row.wins }} / {{ row.losses }}</div>
          <div class="num rt-wr" :class="wrClass(row.wr)">{{ row.wr }}%</div>
          <div class="num rt-streak col-streak" :class="streakClass(row.streak)">
            {{ streakStr(row.streak) }}
          </div>
        </div>
      </div>
    </div>

    <!-- ===== Sticky your-row (bottom footer) ===== -->
    <!-- Null-safe: hidden entirely when captain is missing (0-agent accounts
         or lazy User→Fighter migration hasn't run yet). -->
    <div v-if="yourRow" class="rt-your-row">
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
        <div class="num rt-streak col-streak" :class="yourRow.streak ? streakClass(yourRow.streak) : ''">
          {{ yourRow.streak ? streakStr(yourRow.streak) : '—' }}
        </div>
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
