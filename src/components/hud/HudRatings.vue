<!-- Epic 5 — Sub-Epic 5C Step 6.
     HUD skeleton for /v2/ratings — markup only, no handlers yet.
     Step 7 wires scope tabs + search + mock leaderboard rows.
     Step 8 binds sticky your-row to master.userData.captain.
     Step 9 polishes season toggle. Step 10 mobile responsive.
     Source: prototype hexlash_v24.html lines 4767-4819 (HUD markup). -->
<script setup>
// Step 7: scope/season/search reactive state + v-for rendering + handlers.
// Step 8 (upcoming) adds sticky your-row binding to master.userData.captain.
import { ref, computed } from 'vue';
import { RATINGS_DATA } from '@/data/ratingsMock.js';

defineEmits(['back']);

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
    <!-- Step 8 replaces static placeholder with reactive `yourRow` computed
         from master.userData.captain + login + stats. Null-safe: whole
         block hidden if captain missing. -->
    <div class="rt-your-row">
      <div class="rt-your-label">You</div>
      <div class="rt-row">
        <div class="rt-rank"><span class="rnk-num">#—</span></div>
        <div class="rt-handle">—</div>
        <div class="rt-arch col-arch">—</div>
        <div class="rt-belt col-belt">—</div>
        <div class="num rt-elo">—</div>
        <div class="num rt-wl col-wl">—</div>
        <div class="num rt-wr">—</div>
        <div class="num rt-streak col-streak">—</div>
      </div>
      <div class="rt-next-rank">
        Next rank: <strong>+— ELO</strong>
      </div>
    </div>
  </div>
</template>
