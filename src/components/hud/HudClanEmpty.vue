<!-- Sub-Epic 5P Phase 3 — extract from HudClan.vue no-clan branch.
     Self-contained: owns search query, filtered list, join-request state,
     and lazy CreateClan modal. No Vuex reads/dispatches — pure local UI
     state with BROWSABLE_CLANS data import.

     Mirrors 5L Phase 3 precedent (HudClanHeader/Info/Roster) for component
     decomposition discipline; differs from siblings in that no-clan branch
     has no upstream Vuex to lift from — Lesson #30 toolkit growth path D
     invert default (child shape derives from natural use, not forced
     parallel symmetry).

     CSS lives in src/styles/v24/clan.css (.app-v2 namespace) per 5L
     precedent — children don't carry own scoped CSS. -->
<template>
  <div class="clan-noclan">
    <div class="nc-hero">
      <div class="nc-hero-info">
        <div class="nc-eyebrow">You are not in a clan</div>
        <div class="nc-title">FIND YOUR SQUAD</div>
        <div class="nc-subtitle">Clans give you a weekly XP pool, shared achievements, and friendly rivalry. Browse open clans below or start your own.</div>
      </div>
      <div class="nc-hero-cta">
        <button class="nc-create-btn" @click="openCreateClan">+ Create Clan</button>
      </div>
    </div>

    <div class="nc-browse">
      <div class="nc-browse-head">
        <div class="nc-browse-title">Recruiting · {{ filteredClans.length }} clans</div>
        <input v-model="searchQuery" class="nc-search" placeholder="Search clans..." />
      </div>
      <div
        v-if="filteredClans.length === 0"
        style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:12px;letter-spacing:2px;text-transform:uppercase"
      >No clans found</div>
      <div v-else class="nc-grid">
        <div v-for="c in filteredClans" :key="c.tag" class="clan-card">
          <div class="cc-head">
            <div
              class="cc-crest"
              :style="{
                background: c.crestColor + '22',
                color: c.crestColor,
                borderColor: c.crestColor + '55',
              }"
            >{{ c.tag }}</div>
            <div class="cc-info">
              <div class="cc-name">{{ c.name }}</div>
              <div class="cc-tagline">{{ c.tagline }}</div>
            </div>
          </div>
          <div class="cc-stats">
            <div class="cc-stat">
              <div class="cc-stat-val">{{ c.members }}/{{ c.cap }}</div>
              <div class="cc-stat-label">Members</div>
            </div>
            <div class="cc-stat">
              <div class="cc-stat-val gold">{{ c.xp.toLocaleString() }}</div>
              <div class="cc-stat-label">XP</div>
            </div>
            <div class="cc-stat">
              <div class="cc-stat-val">#{{ c.rank }}</div>
              <div class="cc-stat-label">Rank</div>
            </div>
          </div>
          <button
            class="cc-join-btn"
            :class="{ requested: joinRequested.has(c.tag) }"
            :disabled="joinRequested.has(c.tag)"
            @click="onRequestJoin(c.tag)"
          >{{ joinLabel(c) }}</button>
        </div>
      </div>
    </div>

    <!-- Lazy CreateClan host. Modal teleports to body via Vuetify VModal;
         host element itself is empty in DOM (no display:none — Vuetify
         VModal teleport activation breaks under ancestor display:none,
         per 5D Step 7 hot-fix lesson #23). -->
    <component
      v-if="createClanMounted && CreateClanComp"
      :is="CreateClanComp"
      ref="createClanRef"
    />
  </div>
</template>

<script setup>
import { ref, shallowRef, markRaw, nextTick, computed } from 'vue';
import { BROWSABLE_CLANS } from '@/data/clanMock.js';

// --- Search + filter (case-insensitive over name OR tag — prototype 11038) ---
const searchQuery = ref('');
const filteredClans = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return BROWSABLE_CLANS;
  return BROWSABLE_CLANS.filter(
    (c) => c.name.toLowerCase().includes(q) || c.tag.toLowerCase().includes(q),
  );
});

// --- Per-card join-request state — prototype 11031 / 11046-11048.
// Vue 3 Set isn't deep-reactive on .add/.delete, so reassign ref to a new
// Set to trigger reactivity. ---
const joinRequested = ref(new Set());
function onRequestJoin(tag) {
  if (joinRequested.value.has(tag)) return;
  const next = new Set(joinRequested.value);
  next.add(tag);
  joinRequested.value = next;
}
function joinLabel(c) {
  if (joinRequested.value.has(c.tag)) return 'Requested';
  return c.privacy === 'Open' ? 'Join' : 'Request';
}

// --- Lazy CreateClan modal (5B ConnectWallet precedent) ---
// CreateClan ships with defineExpose({ openModal }) augmentation (5D Step 7
// prep commit 6060c00). Source layout rendered without display:none — the
// modal itself teleports to body and is unaffected by host element style.
const CreateClanComp = shallowRef(null);
const createClanMounted = ref(false);
const createClanRef = ref(null);

async function loadCreateClan() {
  if (CreateClanComp.value) return;
  const mod = await import('@/components/fragments/clan/CreateClan.vue');
  CreateClanComp.value = markRaw(mod.default);
}

async function openCreateClan() {
  await loadCreateClan();
  createClanMounted.value = true;
  // Two ticks: (1) v-if mount of <component :is>, (2) child setup completion
  // in CreateClan. defineExpose populated by end of setup.
  await nextTick();
  await nextTick();
  createClanRef.value?.openModal?.();
}
</script>
