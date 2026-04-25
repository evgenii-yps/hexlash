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

      <!-- Lazy CreateClan host. Modal teleports to body via Vuetify VModal;
           host element itself is empty in DOM (the VModal renders nothing
           inline — only the teleported overlay + form). No display:none
           here: Vuetify VModal teleport activation is short-circuited when
           any ancestor has display:none, so the overlay would render
           offscreen / invisible despite v-overlay__content existing in the
           DOM tree (Step 7 hot-fix recovery — see FINAL §5.x). -->
      <component
        v-if="createClanMounted && CreateClanComp"
        :is="CreateClanComp"
        ref="createClanRef"
      />
    </div>

    <div v-else class="clan-ingrid">
      <!-- ===== Header (full width) ===== -->
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

      <!-- ===== Left side: About + Info + Actions ===== -->
      <div class="ic-side">
        <div class="ic-side-title">About</div>
        <div class="ic-desc">{{ clanDescription || '—' }}</div>

        <div class="ic-side-title">Info</div>
        <div class="ic-meta-list">
          <div class="ic-meta-row"><span class="imk">Leader</span><span class="imv">{{ leaderHandle || '—' }}</span></div>
          <div class="ic-meta-row"><span class="imk">Region</span><span class="imv">{{ region || '—' }}</span></div>
          <div class="ic-meta-row"><span class="imk">Privacy</span><span class="imv">{{ privacy || '—' }}</span></div>
          <div class="ic-meta-row"><span class="imk">Your Role</span><span class="imv">{{ clanRoleLabel }}</span></div>
        </div>

        <div class="ic-action-btns">
          <button class="ic-abtn primary" @click="onInvite">+ Invite Member</button>
          <button class="ic-abtn" @click="openClanEdit">Clan Settings</button>
          <button class="ic-abtn danger" @click="openLeaveConfirm">Leave Clan</button>
        </div>
      </div>

      <!-- ===== Right side: Roster ===== -->
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

      <!-- Lazy ClanEdit host. Modal teleports to body via Vuetify VModal;
           NO display:none — ancestor display:none breaks teleport visibility
           cascade despite teleport (Step 7 hot-fix 702b341, lesson #23). -->
      <component
        v-if="clanEditMounted && ClanEditComp"
        :is="ClanEditComp"
        ref="clanEditRef"
      />

      <!-- Leave-clan confirm. ClanConfirmModal is controlled-props (Step 0 S4
           verify) — no defineExpose augmentation needed; show flips via
           reactive ref bound to :show. -->
      <ClanConfirmModal
        :show="leaveConfirmOpen"
        :title="t.clan?.lblLeaveTitle || 'Leave Clan?'"
        :description="t.clan?.lblLeaveDesc || 'You will lose access to clan XP pool and shared achievements.'"
        :confirm-text="t.modal?.btnConfirm || 'Leave'"
        :cancel-text="t.modal?.btnCancel || 'Cancel'"
        :confirm-danger="true"
        @confirm="onLeaveConfirmed"
        @cancel="leaveConfirmOpen = false"
      />
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
// Step 8 wires the in-clan branch: header / side / roster bindings (null-safe
// per урок #11) + foundedStr Date coercion (урок #3) + lazy ClanEdit modal
// (Step 8.0 prep 21949f8) + Leave confirm via controlled ClanConfirmModal.
import { computed, ref, shallowRef, markRaw, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { BROWSABLE_CLANS, MY_CLAN_MEMBERS } from '@/data/clanMock.js';
import ClanConfirmModal from '@/components/fragments/clan/ClanConfirmModal.vue';
import { t } from '@/locales/index.js';

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

// --- Step 8: in-clan bindings ---
// All computed null-safe per урок #11 (clan object may be null mid-fetch).
const clanDescription = computed(() => clan.value?.description || '');
const clanLevel = computed(() => clan.value?.level ?? 1);
const clanXp = computed(() => clan.value?.xp ?? 0);
const nextLevelXp = computed(() => clan.value?.nextLevelXp ?? 10000);
const xpPct = computed(() => {
  const total = nextLevelXp.value || 1;
  return Math.min(100, Math.round((clanXp.value / total) * 100));
});
const memberCount = computed(() => clan.value?.members?.length ?? MY_CLAN_MEMBERS.length);
const memberCap = computed(() => clan.value?.memberCap ?? 20);
const totalWins = computed(() => clan.value?.totalWins ?? 0);
const clanRank = computed(() => clan.value?.rank ?? '—');
const weeklyXp = computed(() => clan.value?.weeklyXp ?? 0);
const leaderHandle = computed(() => clan.value?.leader?.handle || '');
const region = computed(() => clan.value?.region || '');
const privacy = computed(() => clan.value?.privacy || '');
const clanRoleLabel = computed(() => {
  const r = clanRole.value;
  if (!r) return '—';
  return r.charAt(0).toUpperCase() + r.slice(1);
});

// Date coercion per урок #3 — clan.createdAt may be raw ISO string
// (clanModel does not always wrap with new Date). Guard against Invalid Date.
const foundedStr = computed(() => {
  const raw = clan.value?.createdAt;
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
});

// Crest derived from tag (or name fallback) — first 2 chars uppercase.
const crestInitials = computed(() => {
  const t = clanTag.value || clanName.value || '?';
  return t.slice(0, 2).toUpperCase();
});
const crestColor = computed(() => clan.value?.crestColor || '#FF066F');
const crestBgColor = computed(() => {
  const c = clan.value?.crestColor;
  return c ? c + '1a' : 'rgba(255,6,111,0.1)';
});

// Roster — clan.value?.members backend shape unknown for v2-clan flow yet;
// fallback to MY_CLAN_MEMBERS prototype mock (carry-over to PvP-integration
// sub-epic alongside BROWSABLE_CLANS).
const roster = computed(() => {
  const m = clan.value?.members;
  return Array.isArray(m) && m.length ? m : MY_CLAN_MEMBERS;
});

const sortField = ref('elo');
const SORT_LABELS = { elo: 'ELO', wins: 'Wins', wr: 'WR' };
const SORT_ORDER = ['elo', 'wins', 'wr'];
const sortLabel = computed(() => SORT_LABELS[sortField.value] || 'ELO');
function toggleSort() {
  const i = SORT_ORDER.indexOf(sortField.value);
  sortField.value = SORT_ORDER[(i + 1) % SORT_ORDER.length];
}

// Sort: rank order (Leader / Officer / Member) first, then by sortKey desc
// — matches prototype 11086-11090.
const ROLE_RANK = { Leader: 0, Officer: 1, Member: 2 };
const sortedRoster = computed(() => {
  const list = [...roster.value];
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

// --- Lazy ClanEdit modal (Step 8.0 prep 21949f8 + lesson #23 no display:none) ---
const ClanEditComp = shallowRef(null);
const clanEditMounted = ref(false);
const clanEditRef = ref(null);

async function loadClanEdit() {
  if (ClanEditComp.value) return;
  const mod = await import('@/components/fragments/clan/ClanEdit.vue');
  ClanEditComp.value = markRaw(mod.default);
}

async function openClanEdit() {
  await loadClanEdit();
  clanEditMounted.value = true;
  await nextTick();
  await nextTick();
  clanEditRef.value?.openModal?.();
}

// --- Leave confirm via ClanConfirmModal (controlled-props, no augmentation) ---
const leaveConfirmOpen = ref(false);
function openLeaveConfirm() { leaveConfirmOpen.value = true; }
async function onLeaveConfirmed() {
  leaveConfirmOpen.value = false;
  try {
    // clan/leaveClan signature: ({commit}) — no clanId arg. Backend uses
    // current user's clan from session. Verified line 127 of clanState.js.
    await store.dispatch('clan/leaveClan');
    // No router.push — userData.clanId mutates null in store side-effect,
    // HudClan reactively flips to no-clan branch. Same v2-aware pattern as
    // Step 7 augmentation 1255898 (CreateClan) + Step 8.0 21949f8 (dissolve).
  } catch (err) {
    console.error('[HudClan] leave clan failed:', err);
  }
}

// --- Invite stub — full flow deferred to 5G (no legacy invite modal ready). ---
function onInvite() {
  console.info('[HudClan] Invite flow deferred to Sub-Epic 5G');
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
