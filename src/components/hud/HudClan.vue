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

    <!-- 5P Phase 3 — no-clan branch extracted to HudClanEmpty.vue.
         Self-contained child (search/filter/join/lazy CreateClan modal)
         per Lesson #30 toolkit growth path D invert default. -->
    <HudClanEmpty v-else-if="!inClan" />

    <div v-else class="clan-ingrid">
      <!-- Sub-Epic 5L Phase 3 — split into 3 presentational children.
           Parent retains lift Vuex + lazy modal hosts + 2-state branch logic. -->
      <HudClanHeader
        :crest-initials="crestInitials"
        :crest-color="crestColor"
        :crest-bg-color="crestBgColor"
        :clan-name="clanName"
        :clan-tag="clanTag"
        :founded-str="foundedStr"
        :member-count="memberCount"
        :member-cap="memberCap"
        :clan-level="clanLevel"
        :clan-xp="clanXp"
        :next-level-xp="nextLevelXp"
        :xp-pct="xpPct"
        :total-wins="totalWins"
        :clan-rank="clanRank"
        :weekly-xp="weeklyXp"
      />

      <HudClanInfo
        :description="clanDescription"
        :leader-handle="leaderHandle"
        :region="region"
        :privacy="privacy"
        :clan-role-label="clanRoleLabel"
        @invite="onInvite"
        @edit="openClanEdit"
        @leave="openLeaveConfirm"
      />

      <HudClanRoster
        :members="roster"
        :member-count="memberCount"
        :member-cap="memberCap"
      />

      <!-- Sub-Epic 5L Phase 4 — ClanActivityFeed integration.
           Self-fetches via onMounted (commit resetClanEvents + dispatch
           fetchClanEvents). Wrapper grants grid placement (full-width row 3).
           Component is conditionally rendered: needs valid clan.id, otherwise
           the prop validator (required: true) throws on null. -->
      <div v-if="clan?.id" class="ic-activity">
        <div class="ic-side-title">Recent Activity</div>
        <ClanActivityFeed :clanId="clan.id" />
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
import { MY_CLAN_MEMBERS } from '@/data/clanMock.js';
import ClanConfirmModal from '@/components/fragments/clan/ClanConfirmModal.vue';
import HudClanHeader from '@/components/hud/HudClanHeader.vue';
import HudClanInfo from '@/components/hud/HudClanInfo.vue';
import HudClanRoster from '@/components/hud/HudClanRoster.vue';
import HudClanEmpty from '@/components/hud/HudClanEmpty.vue';
import ClanActivityFeed from '@/components/fragments/clan/ClanActivityFeed.vue';
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

// --- Step 7 (5D) no-clan browse + search + lazy CreateClan modal extracted
//     to HudClanEmpty.vue в 5P Phase 3 — self-contained child. ---

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

// Sort state moved to HudClanRoster.vue (5L Phase 3 — UI-only state stays
// in presentational child; not lifted to parent because no Vuex coupling).

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
