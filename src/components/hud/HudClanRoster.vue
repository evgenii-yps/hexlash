<!-- Sub-Epic 5L Phase 3 — HudClan split child #3.
     Roster table: head with member count + sort toggle, table header,
     member rows with role / handle / ELO / W-L / WR / last-seen.
     Sort state is internal (UI-only, not Vuex) — keeps "purely
     presentational" principle: no global state crosses prop boundary,
     parent passes raw `members` array. CSS lives in src/styles/v24/clan.css
     (.app-v2 namespace, prototype lines 4940-4980). -->
<template>
  <div class="ic-roster">
    <div class="ic-roster-head">
      <div class="ic-roster-title">Roster · {{ memberCount }} / {{ memberCap }}</div>
      <button class="ic-roster-sort" @click="toggleSort">Sort: {{ sortLabel }}</button>
    </div>
    <div class="ic-roster-thead">
      <div>Role</div>
      <div>Handle</div>
      <div class="num">ELO</div>
      <div class="num col-wl">W/L</div>
      <div class="num">WR</div>
      <div class="col-last">Last Seen</div>
    </div>
    <div class="ic-roster-body">
      <div
        v-for="m in sortedRoster"
        :key="m.handle"
        class="member-row"
      >
        <div class="mr-role" :class="(m.role || '').toLowerCase()">{{ m.role }}</div>
        <div class="mr-handle" :class="{ self: m.self }">{{ m.handle }}{{ m.self ? ' (you)' : '' }}</div>
        <div class="num mr-elo">{{ m.elo.toLocaleString() }}</div>
        <div class="num col-wl">{{ m.wins }}/{{ m.losses }}</div>
        <div class="num" :style="wrStyle(m.wr)">{{ m.wr }}%</div>
        <div class="mr-lastseen col-last" :class="{ online: m.lastSeen === 'online' }">{{ m.lastSeen }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  members: { type: Array, default: () => [] },
  memberCount: { type: Number, default: 0 },
  memberCap: { type: Number, default: 20 },
});

// UI-only sort state (not Vuex). Keeps child purely presentational w.r.t.
// global state — no events bubble for sort toggle.
const SORT_LABELS = { elo: 'ELO', wins: 'Wins', wr: 'WR' };
const SORT_ORDER = ['elo', 'wins', 'wr'];
const ROLE_RANK = { Leader: 0, Officer: 1, Member: 2 };

const sortField = ref('elo');
const sortLabel = computed(() => SORT_LABELS[sortField.value] || 'ELO');

function toggleSort() {
  const i = SORT_ORDER.indexOf(sortField.value);
  sortField.value = SORT_ORDER[(i + 1) % SORT_ORDER.length];
}

// Sort: rank order (Leader/Officer/Member) first, then by sortKey desc
// — matches prototype 11086-11090.
const sortedRoster = computed(() => {
  const list = [...props.members];
  list.sort((a, b) => (b[sortField.value] ?? 0) - (a[sortField.value] ?? 0));
  list.sort((a, b) => (ROLE_RANK[a.role] ?? 99) - (ROLE_RANK[b.role] ?? 99));
  return list;
});

// Inline WR colour — prototype 11095 (>=60% green / <50% red / else default).
function wrStyle(wr) {
  if (wr >= 60) return { color: '#2ee07f' };
  if (wr < 50) return { color: '#ff8888' };
  return {};
}
</script>
