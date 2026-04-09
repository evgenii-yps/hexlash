<template>
  <div class="my-club-tab">

    <!-- Loading -->
    <div v-if="loading" class="tab-loader">
      <v-progress-circular size="40" indeterminate />
    </div>

    <!-- State 1: Has club — full clan page -->
    <ClanPageContent
        v-else-if="clubData"
        :clubData="clubData"
        :clubId="String(clubId)"
        @club-left="onClubLeft"
        @club-deleted="onClubDeleted"
    />

    <!-- State 2: No club — browse/search clans -->
    <div v-else class="no-club">

      <!-- Pending Invites (top) -->
      <div v-if="pendingInvites.length" class="pending-invites">
        <div class="section-label">{{ t.club.lblPendingInvites || 'PENDING INVITES' }}</div>
        <div v-for="invite in pendingInvites" :key="invite.id" class="invite-banner">
          <div class="invite-banner-content">
            <span class="invite-icon">&#x2709;</span>
            <div class="invite-info">
              <span class="invite-club-name">{{ invite.club?.name || invite.clubName }}</span>
              <span class="invite-meta">{{ invite.club?.members || '?' }} {{ t.rating.members }} &middot; {{ formatExpiry(invite.expiresAt) }}</span>
            </div>
          </div>
          <div class="invite-banner-actions">
            <HexButton variant="primary" size="sm" @click="acceptInvite(invite)">Accept</HexButton>
            <HexButton variant="ghost" size="sm" @click="declineInvite(invite)">Decline</HexButton>
          </div>
        </div>
      </div>

      <!-- Create button + Search -->
      <div class="browse-header">
        <HexButton variant="primary" size="sm" @click="dialogCreate = true">
          {{ t.profile.buttons.lblCreateClub }}
        </HexButton>
        <CreateClub :dialogCreate="dialogCreate" @close="dialogCreate = false" />
      </div>

      <div class="search-row">
        <input
            v-model="searchQuery"
            type="text"
            class="search-input"
            :placeholder="t.rating.clubPlaceholder || 'Search clans...'"
            @input="debouncedSearch"
        />
      </div>

      <!-- Clan list -->
      <div v-if="searchLoading" class="clans-loader">
        <v-progress-circular size="24" indeterminate />
      </div>

      <div v-else-if="clanList.length === 0" class="no-results">
        {{ t.rating.noResults || 'No clans found' }}
      </div>

      <div v-else class="clan-list">
        <div v-for="club in clanList" :key="club.id" class="clan-row" @click="viewClan(club.id)">
          <div class="clan-avatar">
            <span>{{ getInitial(club.name) }}</span>
          </div>
          <div class="clan-info">
            <div class="clan-name-row">
              <span class="clan-name">{{ club.name }}</span>
              <span class="clan-lvl">LVL {{ club.level || 1 }}</span>
            </div>
            <span class="clan-meta">{{ club.members }} {{ t.rating.members }} &middot; {{ club.wins || 0 }} W &middot; {{ getWinRate(club) }}% WR</span>
          </div>
          <HexButton
              v-if="club.isPublic"
              variant="primary"
              size="sm"
              @click.stop="joinClan(club.id)"
          >{{ t.club.lblJoinClan }}</HexButton>
          <span v-else class="private-label">{{ t.club.lblPrivate }}</span>
        </div>
      </div>

      <!-- Load more -->
      <div v-if="!searchLoading && clanList.length > 0 && !allLoaded" class="load-more-row">
        <HexButton variant="ghost" size="sm" @click="loadMore">
          {{ t.rating.loadMore || 'Load more' }}
        </HexButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, computed, watch, onMounted, onUnmounted} from 'vue';
import {useRouter} from 'vue-router';
import store from "@/core/state/store.js";
import {t} from "@/locales/index.js";
import {formatNumber} from "@/core/constants.js";
import * as clanService from "@/core/services/clanService.js";
import ClanPageContent from "@/components/fragments/club/ClanPageContent.vue";
import HexButton from "@/components/ui/HexButton.vue";
import CreateClub from "@/components/fragments/club/CreateClub.vue";

const props = defineProps({
  active: Boolean,
});

const emit = defineEmits(['switchTab']);

const router = useRouter();

const master = computed(() => store.getters['master/getMaster']);
const clubId = computed(() => master.value?.userData?.clanId);

const loading = ref(false);
const clubData = ref(null);
const loaded = ref(false);

// No-clan state
const pendingInvites = ref([]);
const searchQuery = ref('');
const clanList = ref([]);
const searchLoading = ref(false);
const dialogCreate = ref(false);
const currentPage = ref(0);
const allLoaded = ref(false);
const PAGE_SIZE = 15;

let searchTimeout = null;

const getInitial = (name) => name ? name.charAt(0).toUpperCase() : '?';

const getWinRate = (club) => {
  if (!club.battles || club.battles === 0) return 0;
  return Math.round((club.wins || 0) / club.battles * 100);
};

const formatExpiry = (expiresAt) => {
  if (!expiresAt) return '';
  const diff = new Date(expiresAt) - new Date();
  if (diff <= 0) return 'Expired';
  const hours = Math.ceil(diff / (1000 * 60 * 60));
  return `Expires in ${hours}h`;
};

const acceptInvite = async (invite) => {
  try {
    await clanService.respondToInvite(invite.id, true);
    pendingInvites.value = pendingInvites.value.filter(i => i.id !== invite.id);
    loaded.value = false;
    await loadData();
  } catch (e) {
    store.commit('master/setErrorMessage', { text: e.message || 'Failed to accept invite', timeout: 3000, showButton: false });
  }
};

const declineInvite = async (invite) => {
  try {
    await clanService.respondToInvite(invite.id, false);
    pendingInvites.value = pendingInvites.value.filter(i => i.id !== invite.id);
  } catch (e) {
    store.commit('master/setErrorMessage', { text: e.message || 'Failed to decline invite', timeout: 3000, showButton: false });
  }
};

const loadClans = async (append = false) => {
  searchLoading.value = !append;
  try {
    const clubs = await clanService.searchClans({
      name: searchQuery.value,
      sortBy: 'members',
      size: PAGE_SIZE,
      page: currentPage.value,
      sortDirection: 'DESC',
    });
    const result = clubs || [];
    if (append) {
      clanList.value = [...clanList.value, ...result];
    } else {
      clanList.value = result;
    }
    allLoaded.value = result.length < PAGE_SIZE;
  } catch (e) {
    console.error('Load clans error:', e);
  } finally {
    searchLoading.value = false;
  }
};

const loadMore = () => {
  currentPage.value++;
  loadClans(true);
};

const debouncedSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 0;
    allLoaded.value = false;
    loadClans();
  }, 300);
};

const loadData = async () => {
  if (loaded.value) return;
  loading.value = true;

  try {
    if (clubId.value) {
      const club = await store.dispatch('clan/getClanById', clubId.value);
      if (club) {
        clubData.value = club;
      }
    } else {
      // Load pending invites + clan list in parallel
      const [invites] = await Promise.all([
        clanService.getPendingInvites().catch(() => []),
        loadClans(),
      ]);
      pendingInvites.value = invites || [];
    }
  } catch (e) {
    console.error('MyClubTab load error:', e);
  } finally {
    loading.value = false;
    loaded.value = true;
  }
};

const viewClan = (id) => {
  router.push({ path: `/club/${id}` });
};

const joinClan = async (id) => {
  try {
    await store.dispatch('clan/changeClan', id);
    loaded.value = false;
    await loadData();
  } catch (e) {
    store.commit('master/setErrorMessage', { text: e.message || 'Failed to join clan', timeout: 3000, showButton: false });
  }
};

// ClanPageContent events
const onClubLeft = () => {
  clubData.value = null;
  loaded.value = false;
  loadData();
};

const onClubDeleted = () => {
  clubData.value = null;
  loaded.value = false;
  loadData();
};

// Reload when someone joins via invite
const onInviteAccepted = () => {
  loaded.value = false;
  loadData();
};

onMounted(() => {
  window.addEventListener('clan-invite-accepted', onInviteAccepted);
});

onUnmounted(() => {
  window.removeEventListener('clan-invite-accepted', onInviteAccepted);
  clearTimeout(searchTimeout);
});

// Load when tab becomes active
watch(() => props.active, (val) => {
  if (val) {
    loadData();
  }
}, {immediate: true});
</script>

<style scoped>
.my-club-tab {
  padding: 10px;
}

.tab-loader {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

/* ===== NO CLAN STATE ===== */
.no-club {
  max-width: 500px;
  margin: 0 auto;
}

.section-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--hex-text-muted);
  margin-bottom: 8px;
}

/* Pending Invites */
.pending-invites {
  margin-bottom: 16px;
}

.invite-banner {
  background: linear-gradient(135deg, rgba(255, 6, 111, 0.08) 0%, rgba(255, 6, 111, 0.03) 100%);
  border: 1px solid rgba(255, 6, 111, 0.2);
  border-radius: var(--hex-radius-md);
  padding: 12px;
  margin-bottom: 8px;
}

.invite-banner-content {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.invite-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.invite-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.invite-club-name {
  font-size: 14px;
  font-weight: bold;
  color: var(--hex-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.invite-meta {
  font-size: 11px;
  color: var(--hex-text-muted);
}

.invite-banner-actions {
  display: flex;
  gap: 8px;
}

/* Browse header */
.browse-header {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}

/* Search */
.search-row {
  margin-bottom: 12px;
}

.search-input {
  width: 100%;
  padding: 10px 12px;
  background: var(--hex-bg-card);
  border: 1px solid var(--hex-border-default);
  border-radius: var(--hex-radius-md);
  color: var(--hex-text-primary);
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.search-input:focus {
  border-color: var(--hex-border-active);
}

.search-input::placeholder {
  color: var(--hex-text-muted);
}

/* Clan list */
.clans-loader {
  display: flex;
  justify-content: center;
  padding: 30px 0;
}

.no-results {
  text-align: center;
  color: var(--hex-text-muted);
  font-size: 13px;
  padding: 30px 0;
}

.clan-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.clan-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--hex-radius-md);
  background: var(--hex-bg-light);
  border: 0.5px solid var(--hex-border-default);
  cursor: pointer;
  transition: background 0.15s;
}

.clan-row:hover {
  background: var(--hex-bg-light);
}

.clan-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--hex-radius-md);
  background: var(--hex-bg-medium);
  border: 1px solid var(--hex-border-default);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 16px;
  font-weight: bold;
  color: var(--hex-text-primary);
}

.clan-info {
  flex: 1;
  min-width: 0;
}

.clan-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.clan-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--hex-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.clan-lvl {
  font-size: 9px;
  padding: 1px 5px;
  background: var(--hex-bg-light);
  color: var(--hex-text-primary);
  border-radius: 3px;
  font-family: 'AnonymousBalance', 'Courier New', monospace;
  font-weight: bold;
  white-space: nowrap;
}

.clan-meta {
  font-size: 11px;
  color: var(--hex-text-muted);
  display: block;
  margin-top: 2px;
}

.private-label {
  font-size: 11px;
  color: var(--hex-text-muted);
  white-space: nowrap;
}

.load-more-row {
  display: flex;
  justify-content: center;
  margin-top: 12px;
}
</style>
