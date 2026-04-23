<!-- Epic 5 — Sub-Epic 5B Step 7.
     Step 6 filled Identity card. Step 7 fills Performance card — 6-cell
     stats-grid + 16-tile achievement grid with 3-letter abbreviations.
     Styles live in src/styles/v24/profile.css (scoped .app-v2).
     Source: prototype hexlash_v24.html lines 4604-4663. -->
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

      <!-- FRIENDS — Step 8 -->
      <div class="profile-card friends-card">
        <div class="profile-card-title">Friends</div>
      </div>

      <!-- SETTINGS — Step 9 -->
      <div class="profile-card settings-card">
        <div class="profile-card-title">Settings</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import store from '@/core/state/store.js';
import BeltBadge from '@/components/ui/BeltBadge.vue';
import { getBeltDisplay } from '@/utils/beltDisplay.js';

defineEmits(['back']);

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
  const d = userData.value?.createdAt;
  if (!d) return '—';
  // UserModel constructor already wraps createdAt as new Date(string).
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
  if (!walletClickable.value) return;
  try {
    await navigator.clipboard.writeText(walletAddress.value);
    const orig = walletText.value;
    walletText.value = 'Copied!';
    setTimeout(() => { walletText.value = orig; }, 1200);
  } catch {
    // Clipboard API unavailable (non-HTTPS, insecure context) — silent per
    // prototype 9490 (`try { ... } catch {}`).
  }
}

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
