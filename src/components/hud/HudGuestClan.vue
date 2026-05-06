<!-- Sub-Epic 1 — Guest Clan HUD.
     Renders 5 read-only sections (Header / About / Stats / Members / Action)
     + 5 UI states (loading / found / 404 / network error + retry / private-action).
     Path C state reads:
       — clan    : getters['clan/getClanById'](route.params.id)
                   (cache populated by getGuestClanById → setClan)
       — loading : state.clan.loadingGuest
       — error   : state.clan.errorGuest ({ status, message })
     i18n: custom reactive `t` ref (NOT $t / vue-i18n). Reuse existing
     t.clan.* keys (lblClanNotFound / lblClanFull / lblClanPrivate /
     lblJoinClan / lblWins / lblMembersCount) + 7 new t.guestClan.* keys
     added in Commit 5.
     Mirror HudUserProfile (6B-3) UI-state pattern + HudClan (5D) section
     structure (Header / About / Stats / Members) minus admin actions.
     Frontend filter: Option 2 — `balance` field NEVER rendered in guest
     view even if backend leaks it. -->
<template>
  <div class="guest-clan-hud">
    <!-- Header: back + title -->
    <div class="gc-header">
      <button class="gc-back-btn" @click="back" type="button">
        ← {{ t.common?.back || 'Back' }}
      </button>
      <h1 class="gc-title" v-if="clan">{{ clan.name || 'CLAN' }}</h1>
    </div>

    <!-- Loading state — first fetch in flight, no cached data yet -->
    <div v-if="loading && !clan" class="gc-status-panel">
      <div class="gc-spinner"></div>
      <p>{{ t.loading || 'Loading...' }}</p>
    </div>

    <!-- 404 — clan not found -->
    <div v-else-if="error && error.status === 404" class="gc-status-panel">
      <p class="gc-error-msg">{{ t.clan?.lblClanNotFound || 'Clan not found' }}</p>
      <button class="gc-action-btn" @click="back" type="button">
        ← {{ t.common?.back || 'Back' }}
      </button>
    </div>

    <!-- Network / 5xx error — retry available -->
    <div v-else-if="error" class="gc-status-panel">
      <p class="gc-error-msg">{{ t.guestClan?.error || 'Failed to load clan' }}</p>
      <div class="gc-action-row">
        <button class="gc-action-btn primary" @click="retry" type="button">
          {{ t.tryAgain || 'Retry' }}
        </button>
        <button class="gc-action-btn" @click="back" type="button">
          ← {{ t.common?.back || 'Back' }}
        </button>
      </div>
    </div>

    <!-- Found — render read-only sections -->
    <div v-else-if="clan" class="gc-grid">

      <!-- Header card -->
      <div class="gc-card gc-header-card">
        <div class="gc-crest">{{ crestInitials }}</div>
        <div class="gc-name">{{ clan.name }}</div>
        <div class="gc-tag" v-if="clan.tag">[{{ clan.tag }}]</div>
        <div class="gc-meta">
          <div class="gc-meta-row">
            <span class="gc-meta-label">{{ t.guestClan?.level || 'Level' }}</span>
            <span class="gc-meta-value">{{ clan.level ?? 1 }}</span>
          </div>
          <div class="gc-meta-row">
            <span class="gc-meta-label">{{ t.clan?.lblMembersCount || 'Members' }}</span>
            <span class="gc-meta-value">{{ memberCount }} / {{ memberCap }}</span>
          </div>
          <div class="gc-meta-row" v-if="foundedStr">
            <span class="gc-meta-label">{{ t.guestClan?.founded || 'Founded' }}</span>
            <span class="gc-meta-value">{{ foundedStr }}</span>
          </div>
        </div>
      </div>

      <!-- About card (description) -->
      <div class="gc-card gc-about" v-if="clan.description">
        <div class="gc-card-title">{{ t.guestClan?.description || 'About' }}</div>
        <p class="gc-description">{{ clan.description }}</p>
      </div>

      <!-- Stats card -->
      <div class="gc-card gc-stats">
        <div class="gc-card-title">{{ t.guestClan?.stats || 'Stats' }}</div>
        <div class="gc-stat-grid">
          <div class="gc-stat">
            <div class="gc-stat-value">{{ clan.level ?? 1 }}</div>
            <div class="gc-stat-label">{{ t.guestClan?.level || 'Level' }}</div>
          </div>
          <div class="gc-stat">
            <div class="gc-stat-value good">{{ clan.totalWins ?? 0 }}</div>
            <div class="gc-stat-label">{{ t.clan?.lblWins || 'Wins' }}</div>
          </div>
          <div class="gc-stat">
            <div class="gc-stat-value">{{ totalBattles }}</div>
            <div class="gc-stat-label">{{ t.guestClan?.battles || 'Battles' }}</div>
          </div>
          <div class="gc-stat">
            <div class="gc-stat-value">{{ memberCount }}</div>
            <div class="gc-stat-label">{{ t.clan?.lblMembersCount || 'Members' }}</div>
          </div>
        </div>
      </div>

      <!-- Members roster (read-only, no admin actions) -->
      <div class="gc-card gc-members" v-if="members.length">
        <div class="gc-card-title">{{ t.clan?.lblMembersCount || 'Members' }}</div>
        <ul class="gc-member-list">
          <li
            v-for="m in members"
            :key="m.id || m.login"
            class="gc-member-row"
          >
            <span class="gc-member-handle">{{ m.name || m.login || '—' }}</span>
            <span class="gc-member-role" v-if="m.clanRole">{{ m.clanRole }}</span>
          </li>
        </ul>
      </div>

      <!-- Action card -->
      <div class="gc-card gc-action">
        <button
          v-if="canJoin"
          class="gc-action-btn primary block"
          @click="onJoin"
          type="button"
        >
          {{ t.clan?.lblJoinClan || 'Join Clan' }}
        </button>
        <p v-else-if="isPrivate" class="gc-private-notice">
          {{ t.clan?.lblClanPrivate || 'This clan is private' }}
        </p>
        <p v-else-if="isFull" class="gc-private-notice">
          {{ t.clan?.lblClanFull || 'Clan is full' }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import { t } from '@/locales/index.js';

const emit = defineEmits(['back']);
const route = useRoute();
const store = useStore();

// Path C state reads — `clans` array cache populated by getGuestClanById action
// via setClan mutation. Loading/error tracked via dedicated state.
const clan = computed(() =>
  store.getters['clan/getClanById'](route.params.id) || null,
);
const loading = computed(() => store.state.clan?.loadingGuest || false);
const error = computed(() => store.state.clan?.errorGuest || null);

// Crest derived from tag (or name fallback) — first 2 chars uppercase.
const crestInitials = computed(() => {
  const src = clan.value?.tag || clan.value?.name || '?';
  return src.slice(0, 2).toUpperCase();
});

// Member count — clan.value.members may not exist (backend shape varies).
// Fallback to clan.value.memberCount or 0.
const memberCount = computed(() => {
  if (Array.isArray(clan.value?.members)) return clan.value.members.length;
  return clan.value?.memberCount ?? 0;
});
const memberCap = computed(() => clan.value?.maxMembers ?? 20);

// Members roster — read-only render. Empty array if backend didn't populate.
const members = computed(() =>
  Array.isArray(clan.value?.members) ? clan.value.members : [],
);

// Battles = wins + losses + draws if all populated, else fallback to 0.
const totalBattles = computed(() => {
  const c = clan.value;
  if (!c) return 0;
  if (typeof c.totalBattles === 'number') return c.totalBattles;
  return (c.totalWins ?? 0) + (c.totalLosses ?? 0) + (c.totalDraws ?? 0);
});

// Founded date — coerce ISO string to Date with NaN guard.
const foundedStr = computed(() => {
  const raw = clan.value?.createdAt;
  if (!raw) return '';
  const d = raw instanceof Date ? raw : new Date(raw);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
});

// Privacy / fullness gates for JOIN button.
const isPrivate = computed(() => clan.value?.isPublic === false);
const isFull = computed(() => memberCount.value >= memberCap.value);

// Current user's own clanId — guests with no clan can JOIN public/non-full.
const ownClanId = computed(
  () => store.getters['master/getMaster']?.userData?.clanId || null,
);

const canJoin = computed(
  () => !ownClanId.value && !isPrivate.value && !isFull.value,
);

function back() {
  emit('back');
}

function retry() {
  if (route.params.id) {
    store.dispatch('clan/getGuestClanById', route.params.id);
  }
}

function onJoin() {
  // JOIN flow stub — real wiring deferred (Sub-epic 1b or PvP-integration
  // sub-epic). Backend endpoint exists (POST /v1/clan/change), but full UX
  // (confirm modal / leave-current-clan handling / WS update) out of scope.
  console.warn('[HudGuestClan] JOIN flow stub — deferred');
}
</script>

<style scoped>
/* HUD overlay convention (Lesson #34) — root pointer-events: none,
   interactive children opt-in pointer-events: auto. */
.guest-clan-hud {
  position: absolute;
  inset: 0;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  z-index: 50;
}

.gc-header {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: var(--bg-panel, rgba(14, 16, 28, 0.85));
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.gc-back-btn {
  background: transparent;
  border: 1px solid var(--text-mid, rgba(255, 255, 255, 0.3));
  color: var(--text-mid, rgba(255, 255, 255, 0.75));
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  padding: 6px 12px;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: border-color 0.2s, color 0.2s;
}

.gc-back-btn:hover {
  border-color: var(--hex-primary, #FF066F);
  color: var(--hex-primary, #FF066F);
}

.gc-title {
  font-family: var(--font-display, sans-serif);
  font-size: 18px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-mid, rgba(255, 255, 255, 0.85));
  margin: 0;
}

/* === STATUS PANELS (loading / 404 / error) === */
.gc-status-panel {
  pointer-events: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: var(--text-mid, rgba(255, 255, 255, 0.75));
  font-family: var(--font-body, sans-serif);
  text-align: center;
  padding: 24px;
}

.gc-error-msg {
  font-size: 16px;
  margin: 0;
  max-width: 400px;
}

.gc-action-row {
  display: flex;
  gap: 12px;
}

.gc-action-btn {
  background: transparent;
  border: 1px solid var(--text-mid, rgba(255, 255, 255, 0.3));
  color: var(--text-mid, rgba(255, 255, 255, 0.75));
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  padding: 8px 16px;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: border-color 0.2s, color 0.2s, background 0.2s;
}

.gc-action-btn:hover {
  border-color: var(--hex-primary, #FF066F);
  color: var(--hex-primary, #FF066F);
}

.gc-action-btn.primary {
  border-color: var(--hex-primary, #FF066F);
  color: var(--hex-primary, #FF066F);
}

.gc-action-btn.primary:hover {
  background: var(--hex-primary, #FF066F);
  color: #fff;
}

.gc-action-btn.block {
  display: block;
  width: 100%;
}

/* === SPINNER === */
.gc-spinner {
  width: 32px;
  height: 32px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--hex-primary, #FF066F);
  border-radius: 50%;
  animation: gc-spin 0.8s linear infinite;
}

@keyframes gc-spin {
  to { transform: rotate(360deg); }
}

/* === GRID === */
.gc-grid {
  pointer-events: auto;
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

.gc-card {
  background: var(--bg-panel, rgba(14, 16, 28, 0.85));
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 16px 18px;
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  color: var(--text-mid, rgba(255, 255, 255, 0.75));
  font-family: var(--font-body, sans-serif);
}

.gc-card-title {
  font-family: var(--font-display, sans-serif);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-dim, rgba(255, 255, 255, 0.5));
  margin-bottom: 12px;
}

/* === HEADER CARD === */
.gc-header-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.gc-crest {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  background: var(--bg-deep, rgba(7, 8, 17, 0.6));
  border: 2px solid var(--hex-primary, #FF066F);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display, sans-serif);
  font-size: 22px;
  color: var(--hex-primary, #FF066F);
  letter-spacing: 0.05em;
  margin-bottom: 10px;
}

.gc-name {
  font-family: var(--font-display, sans-serif);
  font-size: 16px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #fff;
  margin-bottom: 2px;
}

.gc-tag {
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  color: var(--text-dim, rgba(255, 255, 255, 0.5));
  margin-bottom: 14px;
}

.gc-meta {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.gc-meta-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.gc-meta-label {
  font-family: var(--font-mono, monospace);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-dim, rgba(255, 255, 255, 0.5));
}

.gc-meta-value {
  color: var(--text-mid, rgba(255, 255, 255, 0.85));
}

/* === ABOUT === */
.gc-description {
  font-size: 13px;
  line-height: 1.5;
  margin: 0;
  color: var(--text-mid, rgba(255, 255, 255, 0.85));
}

/* === STATS === */
.gc-stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.gc-stat {
  background: var(--bg-deep, rgba(7, 8, 17, 0.6));
  padding: 10px 6px;
  border-radius: 4px;
  text-align: center;
}

.gc-stat-value {
  font-family: var(--font-display, sans-serif);
  font-size: 18px;
  color: var(--text-mid, rgba(255, 255, 255, 0.85));
}

.gc-stat-value.good { color: #4ade80; }

.gc-stat-label {
  font-family: var(--font-mono, monospace);
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-dim, rgba(255, 255, 255, 0.5));
  margin-top: 4px;
}

/* === MEMBERS === */
.gc-member-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 200px;
  overflow-y: auto;
}

.gc-member-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  background: var(--bg-deep, rgba(7, 8, 17, 0.6));
  border-radius: 4px;
  font-size: 12px;
}

.gc-member-handle {
  color: var(--text-mid, rgba(255, 255, 255, 0.85));
}

.gc-member-role {
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-dim, rgba(255, 255, 255, 0.5));
}

/* === ACTION === */
.gc-action {
  display: flex;
  align-items: center;
  justify-content: center;
}

.gc-private-notice {
  font-size: 13px;
  color: var(--text-dim, rgba(255, 255, 255, 0.5));
  margin: 0;
  text-align: center;
}

@media (max-width: 720px) {
  .gc-grid {
    grid-template-columns: 1fr;
  }
}
</style>
