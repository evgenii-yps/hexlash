<!-- Epic 5 — Sub-Epic 5C Step 6.
     HUD skeleton for /v2/ratings — markup only, no handlers yet.
     Step 7 wires scope tabs + search + mock leaderboard rows.
     Step 8 binds sticky your-row to master.userData.captain.
     Step 9 polishes season toggle. Step 10 mobile responsive.
     Source: prototype hexlash_v24.html lines 4767-4819 (HUD markup). -->
<script setup>
// Step 6 ships only markup. Step 7 adds:
//   - scope/season/search reactive refs
//   - RATINGS_DATA import from @/data/ratingsMock.js
//   - computed filtered rows + v-for rendering
//   - rowRankClass / wrClass / streakClass / streakStr helpers
//   - setScope / setSeason / onSearchInput handlers
// Step 8 adds:
//   - useStore + yourRow computed from master.userData.captain
//   - archetypeIdShort (full-name → short-id) + archetypeName helpers
//   - myRank + nextRankHint computed
defineEmits(['back']);
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
    <!-- Step 7 binds :class="{ active: season === 's1' }" + @click. -->
    <div class="ratings-season">
      <button class="active" data-season="s1">Season 1</button>
      <button data-season="all">All Time</button>
    </div>

    <!-- ===== Main panel: toolbar + thead + tbody ===== -->
    <!-- Step 7 wires: reactive `scope` ref + click handlers + active bind.
         Step 7 replaces static tabs with v-for over ['global','friends',
         'clan','country','live'] + debounced search via @input. -->
    <div class="ratings-panel">
      <div class="ratings-toolbar">
        <div class="ratings-tabs">
          <button class="rt-tab active" data-filter="global">Global</button>
          <button class="rt-tab" data-filter="friends">Friends</button>
          <button class="rt-tab" data-filter="clan">Clan</button>
          <button class="rt-tab" data-filter="country">Country</button>
          <button class="rt-tab" data-filter="live">
            Live <span style="color: var(--hex-primary); margin-left: 3px">●</span>
          </button>
        </div>
        <input class="ratings-search" placeholder="Search by handle..." />
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
        <!-- Step 7: v-for mock rows. Step 7 also handles empty state. -->
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
