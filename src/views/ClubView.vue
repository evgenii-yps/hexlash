<template>
  <div class="background background_club">
    <div class="club-container">
      <div class="club-content-wrapper">

        <div v-if="loading" class="loader-container">
          <v-progress-circular
              class="loader"
              size="40"
              indeterminate
          />
        </div>

        <div v-else-if="notFound" class="not-found-container">
          <div class="not-found-text">{{ t.club.lblClubNotFound || 'Clan not found' }}</div>
          <button class="back-btn" @click="$router.push('/ratings/clubs')">&larr; {{ t.nav?.lblBack || 'Back' }}</button>
        </div>

        <div v-else-if="clubData" class="clan-page">

          <!-- Clan Header -->
          <div class="clan-header">
            <div class="clan-header-bg"></div>
            <div class="clan-header-content">
              <div class="clan-avatar-wrap">
                <ClubOwnerAvatar v-if="isOwner" :clubData="clubData"/>
                <ClubAvatar v-else :avatarUrl="clubData.avatarUrl"/>
              </div>
              <div class="clan-title-block">
                <h2 class="clan-name">{{ clubData.name }}</h2>
                <p v-if="clubData.description" class="clan-description">{{ clubData.description }}</p>
              </div>
            </div>

            <!-- Meta row -->
            <div class="clan-meta">
              <span class="level-badge">LVL {{ clanLevel }}</span>
              <span class="meta-separator">·</span>
              <span class="meta-text">{{ clubData.members }} / {{ clubData.maxMembers || 50 }} {{ t.rating.members }}</span>
            </div>

            <!-- Level progress bar -->
            <div class="level-progress">
              <div class="level-labels">
                <span class="level-current">LEVEL {{ clanLevel }} → {{ clanLevel + 1 }}</span>
                <span class="level-xp">{{ formatNumber(clanXP) }} / {{ formatNumber(clanXPMax) }} XP</span>
              </div>
              <div class="level-bar">
                <div class="level-bar-fill" :style="{ width: clanXPPercent + '%' }"></div>
              </div>
            </div>
          </div>

          <!-- Stats Grid + Win Rate Bar -->
          <ClubStats :clubData="clubData"/>

          <!-- Tab Navigation -->
          <div class="tab-nav" v-if="isMyClub">
            <button
                v-for="tab in tabs"
                :key="tab.id"
                :class="['tab-btn', { active: activeTab === tab.id }]"
                @click="activeTab = tab.id"
            >
              {{ tab.label }}
              <span v-if="tab.id === 'activity' && activityCount > 0" class="tab-badge">{{ activityCount }}</span>
            </button>
          </div>

          <!-- Members Tab (default) -->
          <div v-if="activeTab === 'members'" class="tab-content">
            <!-- Invite button -->
            <div v-if="(isOwner || isDeputy) && isMyClub" class="invite-row">
              <HexButton variant="primary" size="sm" @click="openInviteModal">
                {{ t.club.lblInviteFriend }}
              </HexButton>
            </div>

            <div class="leaderboard-label">{{ t.club.lblLeaderboard || 'CLAN LEADERBOARD' }}</div>

            <div v-if="membersLoading" class="members-loader">
              <v-progress-circular size="24" indeterminate />
            </div>

            <div v-else class="members-list">
              <div
                  v-for="(member, index) in membersList"
                  :key="member.id"
                  class="member-row"
              >
                <span :class="['member-rank', { 'rank-top': index < 2 }]">{{ index + 1 }}</span>
                <div class="member-avatar">
                  <span>{{ getInitial(member.name || member.login) }}</span>
                </div>
                <div class="member-info" @click="viewMember(member)">
                  <div class="member-name-row">
                    <span class="member-name">{{ member.name || member.login }}</span>
                    <span v-if="member.clubRole === 'owner'" class="role-badge owner-badge">OWNER</span>
                    <span v-else-if="member.clubRole === 'deputy'" class="role-badge deputy-badge">{{ t.club.lblDeputy }}</span>
                    <span v-if="member.isOnline" class="online-dot"></span>
                  </div>
                  <div class="member-stats-text">
                    <span class="member-wins">{{ formatNumber(member.wins || 0) }} W</span>
                    <span class="member-fights">{{ formatNumber(member.battles || member.totalFights || 0) }} {{ t.club.lblFights || 'fights' }}</span>
                  </div>
                </div>
                <button
                    v-if="canManage(member)"
                    class="action-menu-btn"
                    @click.stop="toggleActionMenu(member, $event)"
                >⋯</button>
              </div>
            </div>

            <!-- Inline Action Menu -->
            <Teleport to="body">
              <div
                  v-if="actionMenuOpen"
                  class="action-menu-overlay"
                  @click="closeActionMenu"
              ></div>
              <div
                  v-if="actionMenuOpen && selectedMember"
                  class="action-menu"
                  :style="actionMenuStyle"
              >
                <template v-if="isOwner">
                  <button
                      v-if="selectedMember.clubRole === 'deputy'"
                      class="action-menu-item"
                      @click="doTransfer"
                  >{{ t.club.lblTransferOwnership }}</button>
                  <button
                      v-if="selectedMember.clubRole === 'deputy'"
                      class="action-menu-item"
                      @click="doDemote"
                  >{{ t.club.lblDemoteMember }}</button>
                  <button
                      v-if="selectedMember.clubRole === 'member'"
                      class="action-menu-item"
                      @click="doPromote"
                  >{{ t.club.lblPromoteDeputy }}</button>
                </template>
                <button class="action-menu-item action-danger" @click="doKick">
                  {{ t.club.lblKick }}
                </button>
              </div>
            </Teleport>

            <!-- Join button for visitors -->
            <div v-if="!isMyClub && isPublic" class="join-row">
              <HexButton variant="primary" @click="btnToJoin">
                {{ t.club.lblChangeClub }}
              </HexButton>
            </div>

            <!-- Leave for members -->
            <div v-if="isMyClub && !isOwner" class="leave-row">
              <HexButton variant="danger" size="sm" @click="dialogLeaveClub = true">
                {{ t.club.lblLeaveClub }}
              </HexButton>
            </div>
          </div>

          <!-- Activity Tab -->
          <div v-if="activeTab === 'activity'" class="tab-content">
            <ClanActivityFeed :members="membersList" :clubData="clubData" />
          </div>

          <!-- Settings Tab -->
          <div v-if="activeTab === 'settings'" class="tab-content settings-tab">

            <!-- Clan Info -->
            <div class="settings-section">
              <div class="settings-title">{{ t.club.lblClanInfo || 'CLAN INFO' }}</div>
              <div class="settings-row">
                <span class="settings-label">{{ t.club.lblClubName || 'Name' }}</span>
                <span class="settings-value">{{ clubData.name }}</span>
              </div>
              <div class="settings-row">
                <span class="settings-label">{{ t.club.lblClubDescription || 'Description' }}</span>
                <span class="settings-value settings-value-desc">{{ clubData.description || '—' }}</span>
              </div>
              <div class="settings-row">
                <span class="settings-label">{{ t.club.lblType || 'Type' }}</span>
                <span class="settings-value">{{ isPublic ? (t.club.lblPublic || 'Public') : (t.club.lblPrivate || 'Private') }}</span>
              </div>
              <div class="settings-row">
                <span class="settings-label">{{ t.club.lblCreated || 'Created' }}</span>
                <span class="settings-value">{{ clubCreatedDate }}</span>
              </div>
            </div>

            <!-- Level Bonuses -->
            <div class="settings-section">
              <div class="settings-title">{{ t.club.lblLevelBonuses || 'LEVEL BONUSES' }}</div>
              <div class="settings-row">
                <span class="settings-label">{{ t.club.lblMaxMembers || 'Max members' }}</span>
                <span class="settings-value">
                  <span class="value-green">{{ clubData.maxMembers || 50 }}</span>
                  <span class="value-muted"> (+0 {{ t.club.lblFromLevel || 'from level' }})</span>
                </span>
              </div>
              <div class="settings-row">
                <span class="settings-label">{{ t.club.lblXpBonus || 'XP bonus' }}</span>
                <span class="settings-value value-green">+0%</span>
              </div>
              <div class="settings-row">
                <span class="settings-label">{{ t.club.lblNextUnlock || 'Next unlock' }}</span>
                <span class="settings-value value-xp">Level 2</span>
              </div>
            </div>

            <!-- Treasury -->
            <div class="settings-section">
              <div class="settings-title">{{ t.club.lblTreasury || 'TREASURY' }}</div>
              <div class="settings-row">
                <span class="settings-label">Balance</span>
                <span class="settings-value value-balance">{{ formatNumber(clubBalance) }}</span>
              </div>
              <div class="settings-row">
                <span class="settings-label">{{ t.club.lblIncome || 'Income' }}</span>
                <span class="settings-value value-secondary">{{ t.club.lblIncome || '5% of member taps' }}</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="settings-actions">
              <div v-if="isOwner" class="settings-btn-group">
                <ClubEdit :clubData="clubData"/>
                <HexButton variant="danger" size="sm" @click="confirmDisband">
                  {{ t.club.btnDisband || 'Disband Clan' }}
                </HexButton>
              </div>
              <div v-else class="settings-btn-group">
                <HexButton variant="danger" size="sm" @click="confirmLeaveSettings">
                  {{ t.club.lblLeaveClub }}
                </HexButton>
              </div>
            </div>
          </div>

          <!-- Modals -->
          <VModal v-model="dialogLeaveClub" max-width="500">
            <VCard>
              <v-card-title class="headline">{{ t.club.lblLeaveClub }}</v-card-title>
              <v-card-text>{{ t.club.lblLeaveClubDescription }}</v-card-text>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn @click="dialogLeaveClub = false" class="cancel-btn">{{ t.modal.btnCancel }}</v-btn>
                <v-btn @click="confirmLeave" class="confirm-btn">{{ t.club.lblConfirm }}</v-btn>
              </v-card-actions>
            </VCard>
          </VModal>

          <VModal v-model="dialogChangeClub" max-width="500">
            <VCard>
              <v-card-title class="headline">{{ t.club.lblChangeClub }}</v-card-title>
              <v-card-text>{{ t.club.lblChangeClubDescription }}</v-card-text>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn @click="dialogChangeClub = false" class="cancel-btn">{{ t.modal.btnCancel }}</v-btn>
                <v-btn @click="confirmExit" class="confirm-btn">{{ t.club.lblConfirm }}</v-btn>
              </v-card-actions>
            </VCard>
          </VModal>

          <!-- Invite friend modal -->
          <VModal v-model="dialogInvite" max-width="400">
            <VCard>
              <v-card-title class="headline action-title">{{ t.club.lblInviteFriend }}</v-card-title>
              <v-card-text>
                <div v-if="invitableFriends.length === 0" class="no-friends-text">
                  {{ t.club.lblPlayerHasClub }}
                </div>
                <div v-else class="invite-list">
                  <div
                      v-for="friend in invitableFriends"
                      :key="friend.id"
                      class="invite-item"
                      @click="sendInvite(friend)"
                  >
                    <span>{{ friend.username || friend.name || friend.login }}</span>
                  </div>
                </div>
              </v-card-text>
              <v-card-actions>
                <v-spacer />
                <v-btn @click="dialogInvite = false" class="cancel-btn">{{ t.modal.btnCancel }}</v-btn>
              </v-card-actions>
            </VCard>
          </VModal>

        </div>

        <div v-else class="not-found-container">
          <p>{{ t.club.lblClubNotFound || 'Clan not found' }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, computed, onBeforeMount, onMounted, onBeforeUnmount, watch} from 'vue';
import {useRoute} from 'vue-router';
import store from "@/core/state/store.js";
import {t} from "@/locales/index.js";

import ClubAvatar from "@/components/fragments/club/ClubAvatar.vue";
import ClubStats from "@/components/fragments/club/ClubStats.vue";
import ClanActivityFeed from "@/components/fragments/club/ClanActivityFeed.vue";
import router from "@/router/index.js";
// ClubWithdraw removed from Settings — balance display only now
import ClubEdit from "@/components/fragments/club/ClubEdit.vue";
import ClubOwnerAvatar from "@/components/fragments/club/ClubOwnerAvatar.vue";
import HexButton from "@/components/ui/HexButton.vue";
import {formatNumber} from "@/core/constants.js";
import * as userService from "@/core/services/userService.js";
import * as clubService from "@/core/services/clubService.js";
import * as amplitude from "@amplitude/analytics-browser";


const route = useRoute();
const clubId = route.params.id;
const master = computed(() => store.getters['master/getMaster']);

const clubData = ref(null);
const loading = ref(true);
const membersLoading = ref(false);
const membersList = ref([]);

const isPublic = ref(true);
const isOwner = ref(false);
const isDeputy = computed(() => master.value?.userData?.clubRole === 'deputy');
const isMyClub = ref(false);

const activeTab = ref('members');
const activityCount = ref(0);

const dialogChangeClub = ref(false);
const dialogLeaveClub = ref(false);
const dialogInvite = ref(false);

// Action menu
const actionMenuOpen = ref(false);
const selectedMember = ref(null);
const actionMenuStyle = ref({});

// Clan Level — static mock
const clanLevel = ref(1);
const clanXP = ref(0);
const clanXPMax = ref(1000);
const clanXPPercent = computed(() => {
  if (clanXPMax.value === 0) return 0;
  return Math.min(100, Math.round(clanXP.value / clanXPMax.value * 100));
});

const tabs = computed(() => [
  { id: 'members', label: t.value.club.tabMembers || 'Members' },
  { id: 'activity', label: t.value.club.tabActivity || 'Activity' },
  { id: 'settings', label: t.value.club.tabSettings || 'Settings' },
]);

const friends = computed(() => store.getters['friends/getFriends'] || []);
const invitableFriends = computed(() => friends.value.filter(f => !f.clubId));

const notFound = ref(false);

const loadClub = async () => {
  loading.value = true;
  notFound.value = false;

  isMyClub.value = master.value && master.value.userData.clubId === clubId;
  const result = await store.dispatch('club/loadClubById', clubId);
  if (!result) {
    loading.value = false;
    notFound.value = true;
  }
};

const loadMembers = async () => {
  membersLoading.value = true;
  try {
    const list = await userService.searchParticipants({
      clubId: clubId,
      sortBy: 'wins',
      size: 50,
      sortDirection: 'DESC',
    });
    membersList.value = list || [];
  } catch (e) {
    console.error('Load members error:', e);
  } finally {
    membersLoading.value = false;
  }
};

onBeforeMount(loadClub);

watch(route, loadClub);

watch(
    () => store.getters['club/getClubById'](clubId),
    (newValue) => {
      if (!newValue) return;
      clubData.value = newValue;
      isOwner.value = master.value && master.value.userData.id === clubData.value.owner;
      isPublic.value = clubData.value.isPublic;
      loading.value = false;
      loadMembers();
    });

// Member management
const getInitial = (name) => name ? name.charAt(0).toUpperCase() : '?';

const viewMember = (member) => {
  if (member.login) {
    if (master.value.getLogin() === member.login) {
      router.push({ path: '/profile' });
    } else {
      router.push({ path: `/user/${member.login}` });
    }
  }
};

const canManage = (member) => {
  if (!isMyClub.value) return false;
  const myId = master.value?.userData?.id;
  if (member.id === myId) return false;
  if (isOwner.value) return member.clubRole !== 'owner';
  if (isDeputy.value) return member.clubRole === 'member';
  return false;
};

const toggleActionMenu = (member, event) => {
  if (actionMenuOpen.value && selectedMember.value?.id === member.id) {
    closeActionMenu();
    return;
  }
  selectedMember.value = member;
  const rect = event.target.getBoundingClientRect();
  actionMenuStyle.value = {
    position: 'fixed',
    top: `${rect.bottom + 4}px`,
    right: `${window.innerWidth - rect.right}px`,
    zIndex: 9999,
  };
  actionMenuOpen.value = true;
};

const closeActionMenu = () => {
  actionMenuOpen.value = false;
  selectedMember.value = null;
};

const doPromote = async () => {
  const member = selectedMember.value;
  closeActionMenu();
  try {
    await store.dispatch('club/setMemberRole', { userId: member.id, role: 'deputy' });
    await loadMembers();
  } catch (e) {
    store.commit('master/setErrorMessage', { text: e.message, timeout: 3000, showButton: false });
  }
};

const doDemote = async () => {
  const member = selectedMember.value;
  closeActionMenu();
  try {
    await store.dispatch('club/setMemberRole', { userId: member.id, role: 'member' });
    await loadMembers();
  } catch (e) {
    store.commit('master/setErrorMessage', { text: e.message, timeout: 3000, showButton: false });
  }
};

const doKick = async () => {
  const member = selectedMember.value;
  closeActionMenu();
  const name = member.name || member.login;
  if (!confirm(`${t.value.club.lblKickConfirm} ${name}?`)) return;
  try {
    await store.dispatch('club/kickMember', { userId: member.id });
    await loadMembers();
  } catch (e) {
    store.commit('master/setErrorMessage', { text: e.message, timeout: 3000, showButton: false });
  }
};

const doTransfer = async () => {
  const member = selectedMember.value;
  closeActionMenu();
  const name = member.name || member.login;
  if (!confirm(`${t.value.club.lblTransferConfirm} ${name}?`)) return;
  try {
    await store.dispatch('club/transferOwnership', { newOwnerId: member.id });
    await loadMembers();
  } catch (e) {
    store.commit('master/setErrorMessage', { text: e.message, timeout: 3000, showButton: false });
  }
};

// Invite
const openInviteModal = () => {
  store.dispatch('friends/loadFriends');
  dialogInvite.value = true;
};

const sendInvite = async (friend) => {
  try {
    await clubService.inviteToClub(friend.id);
    dialogInvite.value = false;
    const name = friend.username || friend.name || friend.login;
    store.commit('master/setInfoMessage', {
      text: `${t.value.club.lblInviteSent} ${name}`,
      timeout: 3000,
      showButton: false,
    });
  } catch (e) {
    store.commit('master/setErrorMessage', {
      text: e.message || 'Failed to send invite',
      timeout: 3000,
      showButton: false,
    });
  }
};

const clubBalance = computed(() => {
  try { return clubData.value?.getBalance?.() || 0; } catch { return 0; }
});

const clubCreatedDate = computed(() => {
  const d = clubData.value?.createdAt;
  if (!d) return '—';
  return new Date(d).toLocaleDateString();
});

const confirmDisband = () => {
  if (!confirm(t.value.club.lblDisbandDesc || 'This will permanently delete the clan. All members will be removed.')) return;
  store.dispatch('club/deleteClub');
  router.push('/ratings/clubs');
};

const confirmLeaveSettings = () => {
  if (!confirm(t.value.club.lblLeaveDesc || 'You will lose your role and clan XP bonuses.')) return;
  store.dispatch('club/leaveClub');
  router.push('/ratings/clubs');
};

const btnToJoin = () => {
  dialogChangeClub.value = true;
}

const confirmExit = () => {
  dialogChangeClub.value = false;
  store.dispatch('club/changeClub', clubData.value.id);
  amplitude.track('ChangeClub', clubData.value.id);
}

const confirmLeave = async () => {
  dialogLeaveClub.value = false;
  await store.dispatch('club/leaveClub');
  router.push('/ratings/clubs');
}

// Close action menu on Escape
const onKeydown = (e) => {
  if (e.key === 'Escape') closeActionMenu();
};

onMounted(() => {
  document.addEventListener('keydown', onKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown);
});
</script>

<style scoped>
.background_club {
  background: url('@/assets/images/background_club.webp') no-repeat 35% center;
}

.background_club::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(to left top, black 15%, transparent 130%);
  z-index: 1;
}

.background_club::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: black;
  z-index: 2;
  opacity: 1;
  animation: fadeOut 1s forwards;
}

@keyframes fadeOut {
  to {
    opacity: 0;
  }
}

.club-container {
  position: relative;
  z-index: 10;
  overflow-y: auto;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.club-content-wrapper {
  width: 100%;
  padding: 10vh 0;
  box-sizing: border-box;
  max-width: 1024px;
  margin: 0 auto 100px;
}

.loader-container {
  height: 75vh;
  align-items: center;
  display: flex;
  justify-content: center;
}

/* ===== CLAN HEADER ===== */
.clan-header {
  position: relative;
  padding: 20px 16px 16px;
  overflow: hidden;
}

.clan-header-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, var(--hex-bg-medium) 0%, var(--hex-bg-dark) 100%);
  z-index: 0;
}

.clan-header-bg::after {
  content: '';
  position: absolute;
  top: -40%;
  left: 50%;
  transform: translateX(-50%);
  width: 120%;
  height: 80%;
  background: radial-gradient(ellipse, rgba(255, 6, 111, 0.08) 0%, transparent 70%);
  pointer-events: none;
}

.clan-header-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 16px;
}

.clan-avatar-wrap {
  flex-shrink: 0;
  width: 64px;
  height: 64px;
}

.clan-avatar-wrap :deep(.avatar-container) {
  width: 64px !important;
  height: 64px !important;
  border: 2px solid var(--hex-primary);
  border-radius: var(--hex-radius-lg);
  box-shadow: 0 0 12px var(--hex-primary-glow);
}

.clan-avatar-wrap :deep(.default-avatar) {
  width: 60%;
}

.clan-avatar-wrap :deep(.non-default-avatar) {
  border: none;
  border-radius: var(--hex-radius-lg);
}

.clan-title-block {
  flex: 1;
  min-width: 0;
}

.clan-name {
  font-size: 22px;
  font-family: 'Anonymous', 'Courier New', Consolas, monospace;
  color: var(--hex-text-primary);
  margin: 0;
  line-height: 1.2;
}

.clan-description {
  font-size: 12px;
  font-style: italic;
  color: var(--hex-text-muted);
  margin: 4px 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* Meta row */
.clan-meta {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
}

.level-badge {
  display: inline-block;
  padding: 2px 8px;
  background: var(--hex-primary);
  color: var(--hex-text-primary);
  font-size: 10px;
  font-weight: bold;
  font-family: 'AnonymousBalance', 'Courier New', monospace;
  border-radius: var(--hex-radius-sm);
  letter-spacing: 0.5px;
}

.meta-separator {
  color: var(--hex-text-muted);
  font-size: 12px;
}

.meta-text {
  color: var(--hex-text-secondary);
  font-size: 12px;
}

/* Level Progress Bar */
.level-progress {
  position: relative;
  z-index: 1;
  margin-top: 10px;
}

.level-labels {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 4px;
}

.level-current {
  font-size: 10px;
  font-family: 'Anonymous', 'Courier New', Consolas, monospace;
  color: var(--hex-primary);
  letter-spacing: 0.5px;
}

.level-xp {
  font-size: 10px;
  font-family: 'AnonymousBalance', 'Courier New', monospace;
  color: var(--hex-text-muted);
}

.level-bar {
  height: 6px;
  background: var(--hex-bg-dark);
  border-radius: 3px;
  overflow: hidden;
}

.level-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--hex-primary), #FF3399);
  border-radius: 3px;
  box-shadow: 0 0 8px var(--hex-primary-glow);
  transition: width 0.4s ease;
}

/* ===== TAB NAVIGATION ===== */
.tab-nav {
  display: flex;
  background: var(--hex-bg-medium);
  margin-top: 12px;
  position: sticky;
  top: 0;
  z-index: 50;
}

.tab-btn {
  flex: 1;
  padding: 12px 0;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--hex-text-muted);
  font-family: 'Anonymous', 'Courier New', Consolas, monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s;
  position: relative;
}

.tab-btn.active {
  color: var(--hex-primary);
  border-bottom-color: var(--hex-primary);
}

.tab-btn:hover:not(.active) {
  color: var(--hex-text-secondary);
}

.tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  margin-left: 4px;
  background: var(--hex-primary);
  color: var(--hex-text-primary);
  font-size: 9px;
  font-family: 'AnonymousBalance', 'Courier New', monospace;
  border-radius: 8px;
  vertical-align: middle;
}

/* ===== TAB CONTENT ===== */
.tab-content {
  margin-top: 8px;
}

/* ===== MEMBERS LEADERBOARD ===== */
.invite-row {
  display: flex;
  justify-content: center;
  margin: 12px 0;
}

.leaderboard-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--hex-text-muted);
  padding: 0 16px;
  margin-bottom: 8px;
}

.members-loader {
  display: flex;
  justify-content: center;
  padding: 30px 0;
}

.members-list {
  padding: 0 8px;
}

.member-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 6px;
  transition: background 0.15s;
}

.member-row:hover {
  background: color-mix(in srgb, var(--hex-bg-light) 50%, transparent);
}

.member-rank {
  width: 24px;
  text-align: center;
  font-family: 'Anonymous', 'Courier New', Consolas, monospace;
  font-size: 14px;
  color: var(--hex-text-muted);
  flex-shrink: 0;
}

.rank-top {
  color: var(--hex-draw);
}

.member-avatar {
  width: 38px;
  height: 38px;
  border-radius: var(--hex-radius-md);
  background: var(--hex-bg-light);
  border: 1px solid var(--hex-border-default);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 15px;
  font-weight: bold;
  color: var(--hex-text-primary);
}

.member-info {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.member-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.member-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--hex-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.role-badge {
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 3px;
  color: white;
  white-space: nowrap;
  font-weight: bold;
  letter-spacing: 0.3px;
}

.owner-badge {
  background: var(--hex-primary);
}

.deputy-badge {
  background: var(--hex-draw);
  opacity: 0.8;
  color: var(--hex-bg-dark);
}

.online-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--hex-victory);
  box-shadow: 0 0 4px rgba(0, 255, 136, 0.6);
  flex-shrink: 0;
}

.member-stats-text {
  display: flex;
  gap: 8px;
  margin-top: 2px;
}

.member-wins {
  font-size: 11px;
  color: var(--hex-victory);
}

.member-fights {
  font-size: 11px;
  color: var(--hex-text-muted);
}

/* Action menu trigger */
.action-menu-btn {
  background: none;
  border: none;
  color: var(--hex-text-secondary);
  font-size: 20px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  line-height: 1;
  flex-shrink: 0;
  letter-spacing: 2px;
}

.action-menu-btn:hover {
  background: var(--hex-bg-light);
  color: var(--hex-text-primary);
}

/* Inline action menu (Teleported to body) */
.action-menu-overlay {
  position: fixed;
  inset: 0;
  z-index: 9998;
}

.action-menu {
  background: var(--hex-bg-card);
  border: 1px solid var(--hex-border-active);
  border-radius: var(--hex-radius-md);
  box-shadow: var(--hex-shadow-elevated);
  padding: 4px;
  min-width: 180px;
  backdrop-filter: blur(10px);
}

.action-menu-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  background: none;
  border: none;
  border-radius: 6px;
  color: var(--hex-text-primary);
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s;
}

.action-menu-item:hover {
  background: var(--hex-bg-light);
}

.action-danger {
  color: var(--hex-defeat);
}

/* Join / Leave rows */
.join-row,
.leave-row {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}


/* ===== SETTINGS TAB ===== */
.settings-tab {
  padding: 0 16px;
}

.settings-section {
  margin-bottom: 20px;
}

.settings-title {
  font-family: 'Anonymous', 'Courier New', Consolas, monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--hex-text-muted);
  padding-bottom: 8px;
  border-bottom: 1px solid var(--hex-border-default);
  margin-bottom: 8px;
}

.settings-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.settings-label {
  font-size: 13px;
  color: var(--hex-text-secondary);
}

.settings-value {
  font-size: 13px;
  color: var(--hex-text-primary);
  text-align: right;
  max-width: 60%;
}

.settings-value-desc {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.value-green {
  color: var(--hex-victory);
}

.value-muted {
  color: var(--hex-text-muted);
  font-size: 11px;
}

.value-xp {
  color: var(--hex-draw);
}

.value-balance {
  font-family: 'AnonymousBalance', 'Courier New', monospace;
  color: var(--hex-draw);
  font-size: 16px;
}

.value-secondary {
  color: var(--hex-text-secondary);
}

.settings-actions {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--hex-border-default);
}

.settings-btn-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

/* Not found */
.not-found-container {
  height: 75vh;
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
  justify-content: center;
  color: var(--hex-text-muted);
  font-size: 1.2em;
}

.back-btn {
  padding: 8px 20px;
  background-color: var(--hex-bg-light);
  color: var(--hex-text-primary);
  border: 1px solid var(--hex-border-default);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  transition: background-color 0.2s;
}

.back-btn:hover {
  background-color: var(--hex-bg-medium);
}

/* Invite modal */
.no-friends-text {
  text-align: center;
  color: var(--hex-text-muted);
  padding: 20px 0;
  font-size: 13px;
}

.invite-list {
  max-height: 300px;
  overflow-y: auto;
}

.invite-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  cursor: pointer;
  border-radius: 6px;
  color: var(--hex-text-primary);
  font-size: 14px;
}

.invite-item:hover {
  background: var(--hex-bg-light);
}
</style>
