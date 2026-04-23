<!-- Epic 5 — Sub-Epic 5B Step 6.
     Step 5 added the 4-card grid skeleton. Step 6 fills in Identity card —
     avatar-initials, handle, meta, and 4 id-fields (Wallet / Belt / Clan /
     Email). Wallet click-to-copy only; full ConnectWallet modal arrives in
     Step 10. Styles live in src/styles/v24/profile.css (scoped .app-v2).
     Source: prototype hexlash_v24.html lines 4604-4632. -->
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

      <!-- PERFORMANCE — Step 7 -->
      <div class="profile-card">
        <div class="profile-card-title">Performance</div>
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
