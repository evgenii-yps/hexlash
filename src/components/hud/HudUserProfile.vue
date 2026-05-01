<!-- Sub-Epic 6B-3 — Guest Profile HUD.
     Renders 4 read-only cards (Identity / Performance / Achievements /
     Captain showcase) + 6 UI states (loading / found / 404 / banned /
     network error / retry). Path C state reads:
       — guestUser : getters['user/getUserByLogin'](route.params.userLogin)
                     (cache populated by getGuestUserByLogin → setUser)
       — loading   : state.user.loadingGuest
       — error     : state.user.errorGuest ({ status, message })
     i18n: custom reactive `t` ref (NOT $t / vue-i18n). Mirror HelpView (6B-1)
     pattern. New userProfile keys added in Commit 4. -->
<template>
  <div class="user-profile-hud">
    <!-- Header: back + title (title shows when guest user data loaded) -->
    <div class="up-header">
      <button class="up-back-btn" @click="back" type="button">
        ← {{ t.common?.back || 'Back' }}
      </button>
      <h1 class="up-title" v-if="guestUser">{{ guestUser.name || guestUser.login }}</h1>
    </div>

    <!-- Loading state — first fetch in flight, no cached data yet -->
    <div v-if="loading && !guestUser" class="up-status-panel">
      <div class="up-spinner"></div>
      <p>{{ t.loading || 'Loading...' }}</p>
    </div>

    <!-- 404 — user not found -->
    <div v-else-if="error && error.status === 404" class="up-status-panel">
      <p class="up-error-msg">{{ t.userProfile?.notFound || 'User not found' }}</p>
      <button class="up-action-btn" @click="back" type="button">
        ← {{ t.common?.back || 'Back' }}
      </button>
    </div>

    <!-- Banned — account suspended -->
    <div v-else-if="userBlocked" class="up-status-panel">
      <p class="up-error-msg">{{ t.userProfile?.banned || 'This account has been suspended' }}</p>
      <button class="up-action-btn" @click="back" type="button">
        ← {{ t.common?.back || 'Back' }}
      </button>
    </div>

    <!-- Network / 500 error — retry available -->
    <div v-else-if="error" class="up-status-panel">
      <p class="up-error-msg">{{ t.userProfile?.error || 'Failed to load profile' }}</p>
      <div class="up-action-row">
        <button class="up-action-btn primary" @click="retry" type="button">
          {{ t.tryAgain || 'Retry' }}
        </button>
        <button class="up-action-btn" @click="back" type="button">
          ← {{ t.common?.back || 'Back' }}
        </button>
      </div>
    </div>

    <!-- Found — render cards -->
    <div v-else-if="guestUser" class="up-grid">

      <!-- Identity card (read-only) -->
      <div class="up-card up-identity">
        <div class="up-avatar-wrap">
          <img
            v-if="guestUser.avatarUrl"
            :src="guestUser.avatarUrl"
            class="up-avatar-img"
            alt="Avatar"
          />
          <div v-else class="up-avatar-fallback">{{ initials }}</div>
        </div>
        <div class="up-id-name">{{ guestUser.name || guestUser.login }}</div>
        <div class="up-id-handle">@{{ guestUser.login }}</div>
        <div class="up-id-meta">
          <div class="up-id-row" v-if="guestUser.rating !== undefined">
            <span class="up-id-label">{{ t.profile?.rating || 'Rating' }}</span>
            <span class="up-id-value">{{ guestUser.rating }}</span>
          </div>
          <div class="up-id-row" v-if="guestUser.clanId">
            <span class="up-id-label">{{ t.profile?.clan || 'Clan' }}</span>
            <span class="up-id-value">{{ guestUser.clanRole || 'member' }}</span>
          </div>
          <div class="up-id-row" v-if="joinedText">
            <span class="up-id-label">{{ t.profile?.joined || 'Joined' }}</span>
            <span class="up-id-value">{{ joinedText }}</span>
          </div>
        </div>
      </div>

      <!-- Performance card -->
      <div class="up-card up-performance">
        <div class="up-card-title">{{ t.profile?.performance || 'Performance' }}</div>
        <div class="up-stat-grid">
          <div class="up-stat">
            <div class="up-stat-value">{{ guestUser.totalFights || 0 }}</div>
            <div class="up-stat-label">{{ t.profile?.totalFights || 'Fights' }}</div>
          </div>
          <div class="up-stat">
            <div class="up-stat-value good">{{ guestUser.wins || 0 }}</div>
            <div class="up-stat-label">W</div>
          </div>
          <div class="up-stat">
            <div class="up-stat-value bad">{{ guestUser.losses || 0 }}</div>
            <div class="up-stat-label">L</div>
          </div>
          <div class="up-stat">
            <div class="up-stat-value">{{ guestUser.draws || 0 }}</div>
            <div class="up-stat-label">D</div>
          </div>
        </div>
        <div class="up-stat-row">
          <span class="up-stat-key">PvE</span>
          <span class="up-stat-trio">
            <span class="good">{{ guestUser.pveWins || 0 }}</span> /
            <span class="bad">{{ guestUser.pveLosses || 0 }}</span> /
            <span>{{ guestUser.pveDraws || 0 }}</span>
          </span>
        </div>
        <div class="up-stat-row">
          <span class="up-stat-key">PvP</span>
          <span class="up-stat-trio">
            <span class="good">{{ guestUser.pvpWins || 0 }}</span> /
            <span class="bad">{{ guestUser.pvpLosses || 0 }}</span> /
            <span>{{ guestUser.pvpDraws || 0 }}</span>
          </span>
        </div>
        <div class="up-stat-row" v-if="guestUser.luckPercentage !== undefined && guestUser.luckPercentage !== null">
          <span class="up-stat-key">{{ t.rating?.luck || 'Luck' }}</span>
          <span class="up-stat-trio">{{ guestUser.luckPercentage }}%</span>
        </div>
        <div class="up-stat-row" v-if="guestUser.invitedUsers !== undefined && guestUser.invitedUsers > 0">
          <span class="up-stat-key">{{ t.profile?.invited || 'Invited' }}</span>
          <span class="up-stat-trio">{{ guestUser.invitedUsers }}</span>
        </div>
      </div>

      <!-- Achievements card (only if any unlocked) -->
      <div class="up-card up-achievements" v-if="guestUser.achievements && guestUser.achievements.length">
        <div class="up-card-title">{{ t.profile?.achievements?.lblAchievements || 'Achievements' }}</div>
        <div class="up-achievement-list">
          <span
            v-for="aid in guestUser.achievements"
            :key="aid"
            class="up-achievement-id"
          >{{ aid }}</span>
        </div>
      </div>

      <!-- Captain showcase (only if user has set a captain) -->
      <div class="up-card up-captain" v-if="guestUser.captain">
        <div class="up-card-title">{{ t.profile?.captain || 'Captain' }}</div>
        <img
          v-if="guestUser.captain.skin"
          :src="`/images/skins/${guestUser.captain.skin}`"
          class="up-captain-skin"
          alt="Captain skin"
        />
        <div class="up-captain-name">{{ guestUser.captain.name }}</div>
        <div class="up-captain-stats">
          <div v-if="guestUser.captain.belt !== undefined && guestUser.captain.belt !== null">
            <span class="up-stat-key">{{ t.profile?.belt || 'Belt' }}</span>
            <span class="up-stat-trio">{{ guestUser.captain.belt }}</span>
          </div>
          <div v-if="guestUser.captain.elo !== undefined && guestUser.captain.elo !== null">
            <span class="up-stat-key">ELO</span>
            <span class="up-stat-trio">{{ guestUser.captain.elo }}</span>
          </div>
          <div v-if="guestUser.captain.qualifiedWins !== undefined && guestUser.captain.qualifiedWins !== null">
            <span class="up-stat-key">{{ t.profile?.qualifiedWins || 'Qualified Wins' }}</span>
            <span class="up-stat-trio">{{ guestUser.captain.qualifiedWins }}</span>
          </div>
        </div>
        <div v-if="guestUser.captain.isHexmaster" class="up-hexmaster-badge">
          ⭐ HEXMASTER
        </div>
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

// Path C state reads — `users` array cache populated by getGuestUserByLogin
// action via setUser mutation. Loading/error tracked via dedicated state.
const guestUser = computed(() =>
  store.getters['user/getUserByLogin'](route.params.userLogin) || null,
);
const loading = computed(() => store.state.user?.loadingGuest || false);
const error = computed(() => store.state.user?.errorGuest || null);

const userBlocked = computed(() => guestUser.value?.isBlocked === true);

const initials = computed(() => {
  const source = guestUser.value?.name || guestUser.value?.login || '';
  return source.slice(0, 2).toUpperCase();
});

const joinedText = computed(() => {
  const raw = guestUser.value?.createdAt;
  if (!raw) return '';
  // Backend returns ISO string; UserModel may wrap as Date. Handle both.
  const date = raw instanceof Date ? raw : new Date(raw);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
});

function back() {
  emit('back');
}

function retry() {
  // useRoute() already in setup scope — pull current param at click time
  // (route may have changed via watcher in parent UserProfileView, but that
  // would re-trigger fetch — manual retry handles 5xx/network re-attempt).
  if (route.params.userLogin) {
    store.dispatch('user/getGuestUserByLogin', route.params.userLogin);
  }
}
</script>

<style scoped>
/* HUD overlay convention (Lesson #34) — root pointer-events: none,
   interactive children opt-in pointer-events: auto. */
.user-profile-hud {
  position: absolute;
  inset: 0;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  z-index: 50;
}

.up-header {
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

.up-back-btn {
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

.up-back-btn:hover {
  border-color: var(--hex-primary, #FF066F);
  color: var(--hex-primary, #FF066F);
}

.up-title {
  font-family: var(--font-display, sans-serif);
  font-size: 18px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-mid, rgba(255, 255, 255, 0.85));
  margin: 0;
}

/* === STATUS PANELS (loading / 404 / banned / error) === */
.up-status-panel {
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

.up-error-msg {
  font-size: 16px;
  margin: 0;
  max-width: 400px;
}

.up-action-row {
  display: flex;
  gap: 12px;
}

.up-action-btn {
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

.up-action-btn:hover {
  border-color: var(--hex-primary, #FF066F);
  color: var(--hex-primary, #FF066F);
}

.up-action-btn.primary {
  border-color: var(--hex-primary, #FF066F);
  color: var(--hex-primary, #FF066F);
}

.up-action-btn.primary:hover {
  background: var(--hex-primary, #FF066F);
  color: #fff;
}

/* === SPINNER === */
.up-spinner {
  width: 32px;
  height: 32px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--hex-primary, #FF066F);
  border-radius: 50%;
  animation: up-spin 0.8s linear infinite;
}

@keyframes up-spin {
  to { transform: rotate(360deg); }
}

/* === GRID === */
.up-grid {
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

.up-card {
  background: var(--bg-panel, rgba(14, 16, 28, 0.85));
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 16px 18px;
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  color: var(--text-mid, rgba(255, 255, 255, 0.75));
  font-family: var(--font-body, sans-serif);
}

.up-card-title {
  font-family: var(--font-display, sans-serif);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-dim, rgba(255, 255, 255, 0.5));
  margin-bottom: 12px;
}

/* === IDENTITY CARD === */
.up-identity {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.up-avatar-wrap {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--bg-deep, #070811);
  border: 2px solid var(--hex-primary, #FF066F);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin-bottom: 10px;
}

.up-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.up-avatar-fallback {
  font-family: var(--font-display, sans-serif);
  font-size: 22px;
  color: var(--hex-primary, #FF066F);
  letter-spacing: 0.05em;
}

.up-id-name {
  font-family: var(--font-display, sans-serif);
  font-size: 16px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #fff;
  margin-bottom: 2px;
}

.up-id-handle {
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  color: var(--text-dim, rgba(255, 255, 255, 0.5));
  margin-bottom: 14px;
}

.up-id-meta {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.up-id-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.up-id-label {
  font-family: var(--font-mono, monospace);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-dim, rgba(255, 255, 255, 0.5));
}

.up-id-value {
  color: var(--text-mid, rgba(255, 255, 255, 0.85));
}

/* === PERFORMANCE CARD === */
.up-stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.up-stat {
  background: var(--bg-deep, rgba(7, 8, 17, 0.6));
  padding: 10px 6px;
  border-radius: 4px;
  text-align: center;
}

.up-stat-value {
  font-family: var(--font-display, sans-serif);
  font-size: 18px;
  color: var(--text-mid, rgba(255, 255, 255, 0.85));
}

.up-stat-value.good { color: #4ade80; }
.up-stat-value.bad { color: #f87171; }

.up-stat-label {
  font-family: var(--font-mono, monospace);
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-dim, rgba(255, 255, 255, 0.5));
  margin-top: 4px;
}

.up-stat-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 12px;
  padding: 4px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.up-stat-key {
  font-family: var(--font-mono, monospace);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-dim, rgba(255, 255, 255, 0.5));
}

.up-stat-trio {
  color: var(--text-mid, rgba(255, 255, 255, 0.85));
}

.up-stat-trio .good { color: #4ade80; }
.up-stat-trio .bad { color: #f87171; }

/* === ACHIEVEMENTS === */
.up-achievement-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.up-achievement-id {
  background: var(--bg-deep, rgba(7, 8, 17, 0.6));
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 4px 8px;
  border-radius: 4px;
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  text-transform: uppercase;
  color: var(--text-mid, rgba(255, 255, 255, 0.85));
}

/* === CAPTAIN === */
.up-captain {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.up-captain-skin {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  margin-bottom: 8px;
  background: var(--bg-deep, #070811);
  object-fit: cover;
}

.up-captain-name {
  font-family: var(--font-display, sans-serif);
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #fff;
  margin-bottom: 10px;
}

.up-captain-stats {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.up-captain-stats > div {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  padding: 4px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.up-hexmaster-badge {
  margin-top: 12px;
  padding: 6px 12px;
  background: linear-gradient(90deg, rgba(255, 6, 111, 0.15), rgba(255, 215, 0, 0.15));
  border: 1px solid rgba(255, 215, 0, 0.4);
  border-radius: 4px;
  font-family: var(--font-display, sans-serif);
  font-size: 11px;
  letter-spacing: 0.1em;
  color: #ffd700;
}

@media (max-width: 720px) {
  .up-grid {
    grid-template-columns: 1fr;
  }
}
</style>
