<!-- Epic 5 — Sub-Epic 5B Step 10.
     Steps 6-9 wired Identity/Performance/Friends/Settings. Step 10 upgrades
     the disconnected Wallet id-field to open the full ConnectWallet modal
     (lazy-loaded, reused verbatim from legacy via defineExpose({ openModal })).
     Connected-state copy-to-clipboard from Step 6 stays unchanged.
     Source: prototype hexlash_v24.html lines 4614-4618 (wallet field only —
     prototype never had a real Connect flow). -->
<template>
  <div class="hud-profile">
    <button class="profile-back" @click="$emit('back')">&larr; Back</button>

    <div class="profile-title">
      <div class="pt-kicker">Player</div>
      <div class="pt-name">PROFILE</div>
    </div>

    <div class="profile-grid">
      <!-- IDENTITY -->
      <div class="profile-card">
        <div class="profile-card-title">Identity</div>
        <div class="id-row">
          <div class="id-avatar">{{ initials }}</div>
          <div class="id-info">
            <div class="id-handle">{{ handle }}</div>
            <div class="id-meta">{{ metaText }}</div>
          </div>
        </div>
        <div class="id-fields">
          <div class="id-field">
            <span class="ifk">Wallet</span>
            <span
              class="ifv wallet"
              :class="{ disabled: !walletClickable }"
              :title="walletClickable ? 'Click to copy' : ''"
              @click="onWalletClick"
            >{{ walletText }}</span>
          </div>
          <div class="id-field">
            <span class="ifk">Belt</span>
            <span class="ifv belt-value">
              <BeltBadge :grade="beltGrade" :is-hexmaster="isHexmaster" size="sm" />
              <span class="belt-label">{{ beltLabel }}</span>
            </span>
          </div>
          <div class="id-field">
            <span class="ifk">Clan</span>
            <span class="ifv">{{ clanText }}</span>
          </div>
          <div class="id-field">
            <span class="ifk">Email</span>
            <span class="ifv">{{ emailText }}</span>
          </div>
          <div class="id-field">
            <span class="ifk">Referral</span>
            <span class="ifv referral" @click="onReferralClick">{{ referralLinkText }}</span>
          </div>
        </div>
      </div>

      <!-- PERFORMANCE -->
      <div class="profile-card">
        <div class="profile-card-title">Performance</div>
        <div class="stats-grid">
          <div class="stat-cell">
            <div class="sc-val">{{ statFights }}</div>
            <div class="sc-label">Fights</div>
          </div>
          <div class="stat-cell">
            <div class="sc-val">{{ statWins }}</div>
            <div class="sc-label">Wins</div>
          </div>
          <div class="stat-cell">
            <div class="sc-val">{{ statWinrate }}</div>
            <div class="sc-label">Winrate</div>
          </div>
          <div class="stat-cell">
            <div class="sc-val">{{ statRating }}</div>
            <div class="sc-label">ELO</div>
          </div>
          <div class="stat-cell">
            <div class="sc-val">{{ statPeak }}</div>
            <div class="sc-label">Peak</div>
          </div>
          <div class="stat-cell">
            <div class="sc-val">{{ statStreak }}</div>
            <div class="sc-label">Streak</div>
          </div>
        </div>
        <div class="ach-title">Achievements · {{ unlockedCount }} / 16</div>
        <div class="ach-grid">
          <div
            v-for="tile in achievementTiles"
            :key="tile.type"
            class="ach-item"
            :class="{ unlocked: tile.unlocked }"
            :title="tile.title"
          >{{ tile.abbr }}</div>
        </div>
      </div>

      <!-- FRIENDS -->
      <div class="profile-card friends-card">
        <div class="profile-card-title">Friends</div>
        <div class="fc-head">
          <input
            v-model="friendsSearch"
            class="fc-search"
            type="text"
            placeholder="Search friends..."
          />
          <button class="fc-add-btn" @click="onAddClick">+ Add</button>
        </div>
        <div v-if="showAddNotice" class="fc-empty fc-add-notice">
          Full player search lands in Sub-Epic 5G.
        </div>
        <div class="fc-tabs">
          <button
            v-for="tab in friendsTabs"
            :key="tab.id"
            class="fc-tab"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >{{ tab.label }} <span class="fc-tab-count">{{ tab.count }}</span></button>
        </div>
        <div class="fc-list">
          <div v-if="filteredFriends.length === 0" class="fc-empty">
            {{ friendsEmptyMsg }}
          </div>
          <div v-else v-for="f in filteredFriends" :key="f.id || f.requestId" class="fc-row">
            <div class="fc-avatar">
              {{ friendInitials(f) }}
              <span class="fc-status-dot" :class="friendStatusClass(f)"></span>
            </div>
            <div class="fc-info">
              <div class="fc-handle">{{ friendName(f) }}</div>
              <div class="fc-meta">
                <span class="fcm-elo">ELO {{ f.rating || 1000 }}</span>
                <template v-if="activeTab !== 'pending'">
                  <span> · </span>
                  <span class="fcm-status" :class="friendStatusClass(f)">{{ friendStatusLabel(f) }}</span>
                </template>
              </div>
            </div>
            <div class="fc-actions">
              <template v-if="activeTab === 'pending'">
                <button class="fc-action-btn primary" @click="onAccept(f)">Accept</button>
                <button class="fc-action-btn danger" @click="onDecline(f)">Decline</button>
              </template>
              <template v-else>
                <button
                  v-if="f.status === 'in_fight'"
                  class="fc-action-btn watch"
                  aria-label="Watch live fight"
                  @click="onWatch(f)"
                >{{ t.spectate.watch }}</button>
                <button
                  class="fc-action-btn primary"
                  :disabled="!canChallenge(f)"
                  @click="onChallenge(f)"
                >Challenge</button>
                <button class="fc-action-btn danger" @click="onRemove(f)">Remove</button>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- ConnectWallet host (Step 10) — hidden source; modal teleports to body. -->
      <component
        v-if="cwMounted && CWComp"
        :is="CWComp"
        ref="cwRef"
        style="display: none;"
      />

      <!-- ReferralModal host (5H) — lazy mount-on-demand; modal teleports to body. -->
      <component
        v-if="referralMounted && ReferralComp"
        :is="ReferralComp"
        @close="referralMounted = false"
        style="display: none;"
      />

      <!-- SETTINGS -->
      <div class="profile-card settings-card">
        <div class="settings-block">
          <div class="sb-label">Language</div>
          <div class="lang-picker">
            <button
              v-for="lang in availableLanguages"
              :key="lang.code"
              class="lang-btn"
              :class="{ active: currentLang === lang.code }"
              @click="changeLanguage(lang.code)"
            >{{ lang.code.toUpperCase() }}</button>
          </div>
        </div>
        <div class="settings-block">
          <div class="sb-label">Sound</div>
          <div class="toggle-row" :class="{ on: soundOn }" @click="toggleSound">
            <span class="tr-label">Ambient</span>
            <span class="toggle-pip"></span>
          </div>
        </div>
        <div class="settings-block">
          <div class="sb-label">Build</div>
          <div class="version-text">{{ buildText }}</div>
        </div>
        <div class="settings-block">
          <div class="sb-label">Session</div>
          <button class="logout-btn" @click="onLogout">Logout</button>
        </div>
      </div>

      <!-- 5J — Social Tasks card (relocated from HudTraining). HudSocialTasks
           own .tsp-header serves as card title (count badge UX preserved);
           no wrapper .profile-card-title to avoid double-title. -->
      <div class="profile-card social-tasks-card">
        <HudSocialTasks />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, shallowRef, markRaw, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useAccount } from '@wagmi/vue';
import store from '@/core/state/store.js';
import BeltBadge from '@/components/ui/BeltBadge.vue';
import HudSocialTasks from './HudSocialTasks.vue';
import { getBeltDisplay } from '@/utils/beltDisplay.js';
import {
  availableLanguages,
  getLanguage,
  t,
} from '@/locales/index.js';

defineEmits(['back']);

// 5N — router for Watch button (in_fight friends → /v2/spectate/:fightId).
const router = useRouter();

// --- Master data ---
// Email lives on master.email (top-level), not on userData — see masterModel.js
// fromJSON where it's extracted from the response and peeled off userData.
const master = computed(() => store.getters['master/getMaster'] || null);
const userData = computed(() => master.value?.userData || null);

// --- Avatar + handle + meta ---
const handle = computed(() => userData.value?.login || '—');
const initials = computed(() => {
  const login = userData.value?.login || '';
  return login.slice(0, 2).toUpperCase() || '??';
});
const joinedText = computed(() => {
  const raw = userData.value?.createdAt;
  if (!raw) return '—';
  // masterModel.fromJSON assigns userData directly without going through
  // UserModel, so createdAt arrives as an ISO string from /me — NOT a Date
  // instance (Step 6's assumption was wrong). String.toLocaleString ignores
  // locale options and returns the raw string. Wrap explicitly + NaN guard.
  // Sub-Epic 5B hot-fix 10.1.
  const d = raw instanceof Date ? raw : new Date(raw);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
});
const metaText = computed(() => {
  const fights = userData.value?.totalFights || 0;
  return `Joined ${joinedText.value} · ${fights} fights`;
});

// --- Wallet ---
// UserModel.walletAddress is kept in sync by ProfileWallet / ConnectWallet via
// `master/updateMaster { walletAddress }` on connect/disconnect. Reading it
// here gives us a stable value without depending on a Wagmi hook.
const walletAddress = computed(() => userData.value?.walletAddress || '');
const walletClickable = computed(() => !!walletAddress.value);
const walletText = ref('');
watch(
  walletAddress,
  (addr) => {
    walletText.value = addr
      ? `${addr.slice(0, 6)}...${addr.slice(-4)}`
      : 'Not connected';
  },
  { immediate: true },
);
async function onWalletClick() {
  if (walletClickable.value) {
    // Connected → copy to clipboard (Step 6 behavior, unchanged).
    try {
      await navigator.clipboard.writeText(walletAddress.value);
      const orig = walletText.value;
      walletText.value = 'Copied!';
      setTimeout(() => { walletText.value = orig; }, 1200);
    } catch {
      // Clipboard API unavailable (non-HTTPS, insecure context) — silent per
      // prototype 9490 (`try { ... } catch {}`).
    }
    return;
  }
  // Disconnected → lazy-load ConnectWallet and open its modal.
  await openWalletModal();
}

// --- ConnectWallet modal integration (Step 10) ---
// ConnectWallet is reused verbatim from legacy (same component ProfileWallet
// mounts). We add `defineExpose({ openModal })` there so this HUD can trigger
// the modal without rendering the inline "Connect Wallet" button — and
// lazy-load via dynamic import so Profile bundle stays lean for users who
// never open it. The source layout is rendered with display:none; the modal
// itself teleports to body and is unaffected.
const CWComp = shallowRef(null);
const cwMounted = ref(false);
const cwRef = ref(null);

async function loadCW() {
  if (CWComp.value) return;
  const mod = await import('@/components/fragments/profile/wallet/ConnectWallet.vue');
  // markRaw — component objects should never be deeply reactive.
  CWComp.value = markRaw(mod.default);
}

async function openWalletModal() {
  await loadCW();
  cwMounted.value = true;
  // Two ticks cover: (1) v-if mount of <component :is>, (2) child setup
  // completion in ConnectWallet. defineExpose is populated by the end of
  // setup, so ref is always valid after.
  await nextTick();
  await nextTick();
  cwRef.value?.openModal?.();
}

// --- ReferralModal lazy mount (Sub-Epic 5H) ---
// Symmetric с ConnectWallet (5B) integration ABOVE — same lazy import +
// markRaw + dynamic <component :is> host pattern. Differs in lifecycle:
// ReferralModal is **mount-on-demand** (data fetched fresh per open via
// apiClient.getReferrals + QRCode.toDataURL on mount). No internal isOpen
// state, no defineExpose — `v-if` mount toggle suffices. See 5H §5
// "Augmentation pattern simplified vs 5B" divergence.
const ReferralComp = shallowRef(null);
const referralMounted = ref(false);

async function loadReferralModal() {
  if (ReferralComp.value) return;
  const mod = await import('@/components/fragments/profile/ReferralModal.vue');
  ReferralComp.value = markRaw(mod.default);
}

async function onReferralClick() {
  await loadReferralModal();
  referralMounted.value = true;
}

const referralLinkText = computed(() => {
  const login = userData.value?.login || '';
  if (!login) return 'hexlash.com/r/...';
  const text = `hexlash.com/r/${login}`;
  return text.length > 24 ? text.slice(0, 22) + '…' : text;
});

// --- Wallet address sync (Step 10) ---
// Legacy ProfileWallet.vue keeps master.userData.walletAddress in sync with
// Wagmi's useAccount(address) via dispatch('master/updateMaster'). That
// component only mounts on /profile/wallet — v2 users who connect from
// /v2/profile would otherwise be stranded with a stale walletAddress. This
// watcher covers the v2 case with the same pattern.
const { address: wagmiAddress } = useAccount();
watch(wagmiAddress, async (newAddress) => {
  const current = userData.value?.walletAddress || '';
  const next = newAddress || '';
  if (current === next) return;
  try {
    await store.dispatch('master/updateMaster', { walletAddress: next });
  } catch {
    // Network hiccup — wagmi state remains authoritative, next watcher
    // fire or legacy page visit will re-sync.
  }
});

// --- Belt ---
// Per CLAUDE.md "Captain in Public UI": all public views show the captain's
// belt (User.rating is frozen legacy). `userData.captain` is a sub-object
// populated by /me + getCaptainPublicInfo. Falls back to 0 / not-hexmaster
// when the user has no captain yet (fresh migration / no agent).
const captain = computed(() => userData.value?.captain || null);
const beltGrade = computed(() => captain.value?.belt ?? 0);
const isHexmaster = computed(() => captain.value?.isHexmaster ?? false);
const beltLabel = computed(() => {
  if (isHexmaster.value) return 'Hexmaster';
  const { color } = getBeltDisplay(beltGrade.value);
  return color.charAt(0).toUpperCase() + color.slice(1) + ' Belt';
});

// --- Clan ---
// Resolve clan name on demand via clan/getClanById action (returns cached
// entry from state.clans if present, otherwise fetches). Silent failure →
// fallback to "In Clan" so an API hiccup doesn't empty the field.
const clanName = ref('');
async function loadClanName(id) {
  if (!id) { clanName.value = ''; return; }
  try {
    const clan = await store.dispatch('clan/getClanById', id);
    clanName.value = clan?.name || '';
  } catch {
    clanName.value = '';
  }
}
watch(
  () => userData.value?.clanId,
  (id) => loadClanName(id),
  { immediate: true },
);
const clanText = computed(() => {
  if (!userData.value?.clanId) return 'No Clan';
  return clanName.value || 'In Clan';
});

// --- Email ---
const emailText = computed(() => master.value?.email || '—');

// --- Performance stats ---
// UserModel exposes: rating, totalFights, wins, losses, draws (see schema +
// userModel.js). Prisma User has no peakRating / winStreak fields — those
// fall back to 0 per Step 7 instruction ("honest picture, no padding").
//
// Note on ELO: per CLAUDE.md "Captain in Arena", User.rating is frozen legacy
// (no longer updated post #P1-captain-2) — belt progression moved to the
// captain Agent. We still surface userData.rating here because Step 7 spec
// said "Source: userData"; swapping to captain.elo is a polish deferral.
function fmt(n) {
  return (n ?? 0).toLocaleString('en-US');
}
const statFights = computed(() => fmt(userData.value?.totalFights));
const statWins = computed(() => fmt(userData.value?.wins));
const statWinrate = computed(() => {
  const w = userData.value?.wins || 0;
  const t = userData.value?.totalFights || 0;
  if (t === 0) return '0%';
  return Math.round((w / t) * 100) + '%';
});
const statRating = computed(() => fmt(userData.value?.rating));
const statPeak = computed(() => fmt(0));   // not tracked on User
const statStreak = computed(() => fmt(0)); // not tracked on User

// --- Achievements ---
// `allAchievements` is seeded at app init (main.js:113 → initAllAchievements).
// `userData.achievements` holds the per-user completion records with
// { type, isCompleted, obtainedAt }. Legacy ProfileAchievements.vue matches
// by `type` — we do the same, 1-to-1 parity.
//
// The 16 tiles come from the prototype (4647-4662) with fixed visual order
// + 3-letter abbreviations. Tile `type` matches the backend seed (CLAUDE.md).
const ACHIEVEMENT_TILES = [
  { type: 'NEWBIE',              abbr: 'NEW',  title: 'Newbie' },
  { type: 'CONNECTED_FIGHTER',   abbr: 'CON',  title: 'Connected' },
  { type: 'REGULAR_FIGHTER',     abbr: 'REG',  title: 'Regular' },
  { type: 'BATTLE_VETERAN',      abbr: 'VET',  title: 'Veteran' },
  { type: 'COACH',               abbr: 'COA',  title: 'Coach' },
  { type: 'FIGHT_MASTER',        abbr: 'MST',  title: 'Master' },
  { type: 'RECRUITER',           abbr: 'REC',  title: 'Recruiter' },
  { type: 'PROJECT_MAYHEM',      abbr: 'MAY',  title: 'Mayhem' },
  { type: 'MEATLOAF',            abbr: 'MTL',  title: 'Meatloaf' },
  { type: 'TYLER',               abbr: 'TYL',  title: 'Tyler' },
  { type: 'EXPERT',              abbr: 'EXP',  title: 'Expert' },
  { type: 'LUCKY_ONE',           abbr: 'LCK',  title: 'Lucky' },
  { type: 'BOB',                 abbr: 'BOB',  title: 'Bob' },
  { type: 'PAPER_STREET',        abbr: 'PPS',  title: 'Paper Street' },
  { type: 'MEETING_PARTICIPANT', abbr: 'MEET', title: 'Meeting' },
  { type: 'GOLDEN_RULE',         abbr: 'GRL',  title: 'Golden Rule' },
];
const unlockedTypes = computed(() => {
  const list = userData.value?.achievements || [];
  const set = new Set();
  for (const a of list) {
    if (a?.isCompleted && a.type) set.add(a.type);
  }
  return set;
});
const achievementTiles = computed(() =>
  ACHIEVEMENT_TILES.map((tile) => ({
    ...tile,
    unlocked: unlockedTypes.value.has(tile.type),
  })),
);
const unlockedCount = computed(() => unlockedTypes.value.size);

// --- Friends ---
// Full reuse of `friends/*` Vuex module (same actions the legacy FriendsView
// dispatches). WS challenge goes through webSocket/sendMessage — infrastructure
// is live in AppV2 context because App.vue (root) auto-connects WS on auth.
//
// Known gaps deferred to Sub-Epic 5D/5G:
//   - ChallengeNotification widget is hidden on /v2/* (App.vue v-if), so v2
//     users don't see incoming challenge toasts. Step 8 only sends.
//   - challenge_start server event navigates to legacy /fight in the WS
//     handler — a v2 sender lands on legacy Fight view. Cross-wiring for
//     /v2/fight is a separate PvP-integration sub-epic.
const friendsList = computed(() => store.getters['friends/getFriends'] || []);
const incomingRequests = computed(() => store.getters['friends/getIncomingRequests'] || []);
const onlineFriendsCount = computed(
  () => store.getters['friends/onlineFriendsCount'] || 0,
);

const friendsSearch = ref('');
const activeTab = ref('all');
const showAddNotice = ref(false);
let addNoticeTimer = null;

const friendsTabs = computed(() => [
  { id: 'all',     label: 'All',     count: friendsList.value.length },
  { id: 'online',  label: 'Online',  count: onlineFriendsCount.value },
  { id: 'pending', label: 'Pending', count: incomingRequests.value.length },
]);

const filteredFriends = computed(() => {
  const q = friendsSearch.value.trim().toLowerCase();
  let pool = [];
  if (activeTab.value === 'pending') {
    pool = incomingRequests.value;
  } else if (activeTab.value === 'online') {
    // Prototype collapses online + in_fight into the "Online" tab (12854).
    pool = friendsList.value.filter(
      (f) => f.status === 'online' || f.status === 'in_fight',
    );
  } else {
    // Sort: online → in_fight → offline (legacy FriendsView parity).
    const order = { online: 0, in_fight: 1, offline: 2 };
    pool = [...friendsList.value].sort(
      (a, b) => (order[a.status] ?? 3) - (order[b.status] ?? 3),
    );
  }
  if (!q) return pool;
  return pool.filter((f) => {
    const name = (f.username || f.login || '').toLowerCase();
    return name.includes(q);
  });
});

const friendsEmptyMsg = computed(() => {
  if (friendsSearch.value.trim()) return 'No matches';
  if (activeTab.value === 'pending') return 'No pending requests';
  if (activeTab.value === 'online') return 'No friends online';
  return 'No friends yet';
});

function friendName(f) {
  return f?.username || f?.login || 'Player';
}
function friendInitials(f) {
  const name = friendName(f);
  return name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || '??';
}
function friendStatusClass(f) {
  // Backend uses 'in_fight' (underscore); prototype CSS uses 'in-fight' (dash).
  if (f?.status === 'in_fight') return 'in-fight';
  return f?.status || 'offline';
}
function friendStatusLabel(f) {
  if (f?.status === 'in_fight') return 'In Fight';
  if (f?.status === 'online')   return 'Online';
  return 'Offline';
}

// --- Friend actions ---
// sendChallenge guards internally: refuses offline targets and existing
// outgoing. hasPendingChallenge getter reflects the 10s WS cooldown so the
// button stays disabled until expiry or challenge_start arrives.
const hasPendingChallenge = (id) => store.getters['friends/hasPendingChallenge'](id);
function canChallenge(f) {
  return f?.status === 'online' && !hasPendingChallenge(f.id);
}
function onChallenge(f) {
  if (!canChallenge(f)) return;
  store.dispatch('friends/sendChallenge', f);
}
// 5N — Watch live fight (Path α mock port). currentFight is defined on the
// friend object but never populated by the current backend, so f.id is the
// always-used fallback today; the optional chain protects future wiring.
function onWatch(f) {
  const fightId = f.currentFight?.id || f.id;
  router.push(`/v2/spectate/${fightId}`);
}
function onAccept(req) {
  store.dispatch('friends/acceptFriendRequest', req);
}
function onDecline(req) {
  store.dispatch('friends/declineFriendRequest', req.id);
}
function onRemove(f) {
  // Window.confirm is sufficient for v2 parity — legacy FriendsView uses
  // no confirm at all, so adding one here is already stricter. Custom modal
  // can land in 5G polish alongside full search UI.
  const name = friendName(f);
  if (!confirm(`Remove ${name} from friends?`)) return;
  store.dispatch('friends/removeFriend', f.id);
}
function onAddClick() {
  // Stub — ephemeral inline notice, auto-dismiss after 3s. Full search UI
  // deferred to Sub-Epic 5G.
  showAddNotice.value = true;
  if (addNoticeTimer) clearTimeout(addNoticeTimer);
  addNoticeTimer = setTimeout(() => {
    showAddNotice.value = false;
    addNoticeTimer = null;
  }, 3000);
}

// --- Lifecycle ---
// init() fetches friends + both request directions in parallel. The refresh
// poll mirrors legacy FriendsView (1s there) but eased to 5s: WS pushes
// friend_status in realtime, so the poll is mostly a safety net for missed
// events + catching newly-accepted requests.
let friendsRefreshTimer = null;
onMounted(() => {
  store.dispatch('friends/init');
  friendsRefreshTimer = setInterval(() => {
    store.dispatch('friends/loadFriends');
    store.dispatch('friends/loadIncomingRequests');
  }, 5000);
});
onBeforeUnmount(() => {
  if (friendsRefreshTimer) {
    clearInterval(friendsRefreshTimer);
    friendsRefreshTimer = null;
  }
  if (addNoticeTimer) {
    clearTimeout(addNoticeTimer);
    addNoticeTimer = null;
  }
});

// --- Settings: Language ---
// locales/index.js exposes getLanguage + the reactive `t` computed. We mirror
// currentLanguage into a local ref via watch(t) for active-state highlighting.
//
// Switching goes through master/setLanguage Vuex action (same as legacy
// ChangeLanguage.vue), which internally:
//   1. calls setLanguage() from locales/index.js (updates currentLanguage ref
//      + localStorage → triggers `t` recompute → any template reading t.*.*
//      re-renders),
//   2. commits updateMaster({ language }) → master.language Vuex synced,
//   3. writes through to local DB,
//   4. syncs to backend silently via masterService.changeProfile.
// Sub-Epic 5B hot-fix 10.2: direct setLanguage() call missed steps 2-4, so
// Vuex-derived `master/getLanguage` stayed stale — legacy templates reading
// it didn't update until logout/login re-initialized from localStorage.
const currentLang = ref(getLanguage());
watch(t, () => { currentLang.value = getLanguage(); });
function changeLanguage(code) {
  store.dispatch('master/setLanguage', code);
}

// --- Settings: Sound ---
// punch/isMuted holds the mute flag (persisted via setMuted → localStorage).
// Prototype's `.toggle-row.on` = pip on the right = sound ON = NOT muted.
const soundOn = computed(() => !store.getters['punch/isMuted']);
function toggleSound() {
  store.commit('punch/setMuted', soundOn.value);
}

// --- Settings: Build ---
// __APP_VERSION__ / __IS_PROD__ are compile-time defines from vite.config
// (see CLAUDE.md Build section). Legacy ProfileView.vue:101-102 reads the
// same way. Format mirrors prototype 4708: "v0.13.0 · prod".
const buildText = computed(() => {
  const env = __IS_PROD__ ? 'prod' : 'test';
  return `v${__APP_VERSION__} · ${env}`;
});

// --- Settings: Logout ---
// master/logout internally disconnects WS, clears auth data, and router-pushes
// to `/`. The nav guard then redirects unauthenticated users to `/auth/login`,
// so no explicit push from here (would double-fire). Legacy ProfileButtons
// uses the same single-dispatch pattern. No confirm per prototype.
function onLogout() {
  store.dispatch('master/logout');
}
</script>

<style scoped>
/* Wrapper-only positioning. All .profile-* / .id-* / .stat-* / .ach-* /
   .fc-* / .settings-* / .lang-* / .toggle-* / .logout-* styles live in
   src/styles/v24/profile.css (scoped to .app-v2). */
.hud-profile {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.hud-profile > * {
  pointer-events: auto;
}
</style>
