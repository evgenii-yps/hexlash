<!-- Sub-Epic 5L Phase 3 — HudClan split child #1.
     Header section: crest + clan name/tag/founded date + level XP bar +
     stats grid. Pure presentational — all data via props from HudClan
     parent. No Vuex reads, no emits. CSS lives in src/styles/v24/clan.css
     (.app-v2 namespace, prototype lines 4900-4920). -->
<template>
  <div class="ic-header">
    <div class="ic-crest" :style="{ background: crestBgColor, color: crestColor }">{{ crestInitials }}</div>
    <div class="ic-title-block">
      <div class="ic-clan-name">{{ clanName || '—' }}</div>
      <div class="ic-clan-tag">[{{ clanTag || '—' }}] · Founded {{ foundedStr }} · {{ memberCount }} / {{ memberCap }} members</div>
      <div class="ic-level-wrap">
        <div class="ic-level-label">Clan Level <strong>{{ clanLevel }}</strong></div>
        <div class="ic-xp-bar"><div class="ic-xp-fill" :style="{ width: xpPct + '%' }"></div></div>
        <div class="ic-level-label">{{ clanXp.toLocaleString() }} / {{ nextLevelXp.toLocaleString() }} XP</div>
      </div>
    </div>
    <div class="ic-header-stats">
      <div class="ic-hstat"><div class="ic-hstat-val">{{ memberCount }}</div><div class="ic-hstat-label">Members</div></div>
      <div class="ic-hstat"><div class="ic-hstat-val">{{ totalWins }}</div><div class="ic-hstat-label">Total Wins</div></div>
      <div class="ic-hstat"><div class="ic-hstat-val gold">#{{ clanRank }}</div><div class="ic-hstat-label">Clan Rank</div></div>
      <div class="ic-hstat"><div class="ic-hstat-val pink">+{{ weeklyXp }}</div><div class="ic-hstat-label">Weekly XP</div></div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  crestInitials: { type: String, default: '?' },
  crestColor: { type: String, default: '#FF066F' },
  crestBgColor: { type: String, default: 'rgba(255,6,111,0.1)' },
  clanName: { type: String, default: '' },
  clanTag: { type: String, default: '' },
  foundedStr: { type: String, default: '—' },
  memberCount: { type: Number, default: 0 },
  memberCap: { type: Number, default: 20 },
  clanLevel: { type: Number, default: 1 },
  clanXp: { type: Number, default: 0 },
  nextLevelXp: { type: Number, default: 10000 },
  xpPct: { type: Number, default: 0 },
  totalWins: { type: Number, default: 0 },
  clanRank: { type: [Number, String], default: '—' },
  weeklyXp: { type: Number, default: 0 },
});
</script>
