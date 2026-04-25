<!-- Epic 5 — Sub-Epic 5D Step 6 Part 4.
     HUD shell for /v2/clan — wrapper + state-branched markup. Template port
     of prototype hexlash_v24.html lines 4887-4981 minus dev-only demo-toggle.
     State derived from userData.clanId — no-clan branch (Step 7) shows
     browse + Create CTA, in-clan branch (Step 8) shows roster + stats.
     Scoped CSS selector aligned to template root class (.clan-hud) per
     5C HudRatings convention + lesson #22 pre-commit grep. -->
<template>
  <div class="hud clan-hud">
    <button class="clan-back" @click="onBack">← Back</button>
    <div class="clan-title">
      <div class="ct-kicker">Hexlash</div>
      <div class="ct-name">{{ inClan ? (clanName || 'CLAN') : 'CLANS' }}</div>
    </div>

    <div v-if="clanLoading" class="clan-loading">Loading clan…</div>

    <div v-else-if="!inClan" class="clan-noclan">
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

      <!-- Lazy CreateClan host — modal Teleports to body, source layout
           hidden so the inline VBtnDark trigger doesn't render in HUD. -->
      <component
        v-if="createClanMounted && CreateClanComp"
        :is="CreateClanComp"
        ref="createClanRef"
        style="display: none;"
      />
    </div>

    <div v-else class="clan-ingrid">
      <!-- populated Step 8 -->
    </div>
  </div>
</template>

<script setup>
// State derives from master.userData (clanId / clanRole) — single source of
// truth for "am I in a clan, and which role?". The actual Clan object (name,
// tag, members, level, …) lives in the namespaced `clan/` Vuex module and is
// fetched lazily on mount when clanId is present but the cache is empty.
//
// Step 7 wires the no-clan branch: BROWSABLE_CLANS mock + reactive search +
// per-card join-request state + lazy CreateClan modal (5B ConnectWallet
// pattern via the Step 7 prep defineExpose augmentation in CreateClan.vue).
// onBeforeUnmount + ClanEdit lazy reserved for Step 8.
import { computed, ref, shallowRef, markRaw, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { BROWSABLE_CLANS } from '@/data/clanMock.js';

const store = useStore();
const router = useRouter();

const master = computed(() => store.getters['master/getMaster']);
const clanId = computed(() => master.value?.userData?.clanId ?? null);
const clanRole = computed(() => master.value?.userData?.clanRole ?? null);
const inClan = computed(() => !!clanId.value);

const clanLoading = ref(false);

const clan = computed(() =>
  clanId.value ? store.getters['clan/getClanById'](clanId.value) : null,
);

const clanName = computed(() => clan.value?.name || '');
const clanTag = computed(() => clan.value?.tag || '');

// --- Step 7: no-clan browse + search ---
// Prototype 11038 filters case-insensitively over name OR tag. We mirror it.
const searchQuery = ref('');
const filteredClans = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return BROWSABLE_CLANS;
  return BROWSABLE_CLANS.filter(
    (c) => c.name.toLowerCase().includes(q) || c.tag.toLowerCase().includes(q),
  );
});

// Per-card join-request demo state — prototype 11031 / 11046-11048.
// Set tracks tags the user has clicked Join/Request for; button label switches
// to "Requested" + disabled. Vue 3 Set isn't deep-reactive on .add/.delete, so
// we reassign the ref to a new Set to trigger reactivity.
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
// CreateClan ships with defineExpose({ openModal }) augmentation (Step 7 prep
// commit 6060c00). Source layout rendered with display:none — the modal
// itself teleports to body and is unaffected.
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

function onBack() {
  router.push('/v2');
}

onMounted(async () => {
  // Async clan fetch only fires when user is in a clan AND cache is empty.
  // 99% of accounts will be `clanId === null` — short-circuit no-op.
  if (clanId.value && !clan.value) {
    clanLoading.value = true;
    try {
      await store.dispatch('clan/getClanById', clanId.value);
    } finally {
      clanLoading.value = false;
    }
  }
});
</script>

<style scoped>
/* Wrapper-only positioning. All .clan-* / .nc-* / .ic-* styles live in
   src/styles/v24/clan.css (scoped to .app-v2).
   Selector matches template root class (`<div class="hud clan-hud">`,
   prototype line 4887) per 5C HudRatings convention (`{name}-hud`).
   Pre-commit grep per lesson #22: literal selector ↔ template root class
   match check. */
.clan-hud {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.clan-hud > * {
  pointer-events: auto;
}
</style>
