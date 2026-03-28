<template>
  <div class="my-club-tab">

    <!-- Loading -->
    <div v-if="loading" class="tab-loader">
      <v-progress-circular size="40" indeterminate />
    </div>

    <!-- State 1: Has club -->
    <div v-else-if="clubData" class="club-card">

      <!-- Avatar + info -->
      <div class="club-header">
        <div class="club-avatar">
          <ClubAvatar :avatarUrl="clubData.avatarUrl" />
        </div>
        <div class="club-info">
          <h3 class="club-name">{{ clubData.name }}</h3>
          <p v-if="clubData.description" class="club-description">{{ clubData.description }}</p>
        </div>
      </div>

      <!-- Stats row -->
      <div class="stats-row">
        <div class="stat-card">
          <span class="stat-value">{{ clubData.members }} / {{ clubData.maxMembers }}</span>
          <span class="stat-label">{{ t.rating.members }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ formatNumber(clubData.battles) }}</span>
          <span class="stat-label">{{ t.rating.total }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-value stat-wins">{{ formatNumber(clubData.wins) }}</span>
          <span class="stat-label">{{ t.rating.wins }}</span>
        </div>
      </div>

      <!-- Invite friend button -->
      <div v-if="isOwner || isDeputy" class="invite-row">
        <HexButton variant="primary" size="sm" @click="openInviteModal">
          {{ t.club.lblInviteFriend }}
        </HexButton>
      </div>

      <!-- Members list -->
      <div class="members-section">
        <div v-for="member in members" :key="member.id" class="member-row">
          <div class="member-left" @click="viewMember(member)">
            <div class="member-avatar">
              <span>{{ getInitial(member.name || member.login) }}</span>
            </div>
            <span class="member-name">{{ member.name || member.login || t.profile.anonymous }}</span>
            <span v-if="member.clubRole === 'owner'" class="role-badge owner-badge">OWNER</span>
            <span v-else-if="member.clubRole === 'deputy'" class="role-badge deputy-badge">{{ t.club.lblDeputy }}</span>
          </div>
          <div class="member-right">
            <span class="member-wins">{{ formatNumber(member.wins) }} W</span>
            <!-- Action menu button -->
            <button
                v-if="canManage(member)"
                class="action-btn"
                @click.stop="openActions(member)"
            >⋮</button>
          </div>
        </div>

        <div v-if="clubData.members > 5" class="view-all-row">
          <HexButton variant="ghost" size="sm" @click="goToClub">
            {{ t.club.lblViewAll }} →
          </HexButton>
        </div>
      </div>

      <!-- Owner controls -->
      <div v-if="isOwner" class="controls-row">
        <HexButton variant="ghost" size="sm" @click="goToClub">
          {{ t.club.lblEditClub }}
        </HexButton>
        <HexButton variant="ghost" size="sm" @click="togglePublic">
          {{ clubData.isPublic ? t.club.lblPublic : t.club.lblPrivate }}
        </HexButton>
        <HexButton variant="ghost" size="sm" @click="dialogTransfer = true">
          {{ t.club.lblTransferOwnership }}
        </HexButton>
      </div>

      <!-- Non-owner: leave -->
      <div v-else class="controls-row">
        <HexButton variant="danger" size="sm" @click="dialogLeave = true">
          {{ t.club.lblLeaveClub }}
        </HexButton>
      </div>

      <!-- Action menu modal -->
      <VModal v-model="dialogActions" max-width="320">
        <VCard v-if="selectedMember">
          <v-card-title class="headline action-title">{{ selectedMember.name || selectedMember.login }}</v-card-title>
          <v-card-text class="action-list">
            <!-- Owner sees promote/demote + kick -->
            <template v-if="isOwner">
              <button
                  v-if="selectedMember.clubRole === 'member'"
                  class="action-item"
                  @click="promoteDeputy"
              >{{ t.club.lblPromoteDeputy }}</button>
              <button
                  v-if="selectedMember.clubRole === 'deputy'"
                  class="action-item"
                  @click="demoteMember"
              >{{ t.club.lblDemoteMember }}</button>
            </template>
            <button class="action-item action-danger" @click="confirmKick">
              {{ t.club.lblKick }}
            </button>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn @click="dialogActions = false" class="cancel-btn">{{ t.modal.btnCancel }}</v-btn>
          </v-card-actions>
        </VCard>
      </VModal>

      <!-- Kick confirmation -->
      <VModal v-model="dialogKick" max-width="500">
        <VCard>
          <v-card-title class="headline">{{ t.club.lblKick }}</v-card-title>
          <v-card-text>{{ t.club.lblKickConfirm }} {{ kickTarget?.name || kickTarget?.login }}?</v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn @click="dialogKick = false" class="cancel-btn">{{ t.modal.btnCancel }}</v-btn>
            <v-btn @click="doKick" class="confirm-btn">{{ t.club.lblKick }}</v-btn>
          </v-card-actions>
        </VCard>
      </VModal>

      <!-- Transfer ownership modal -->
      <VModal v-model="dialogTransfer" max-width="500">
        <VCard>
          <v-card-title class="headline">{{ t.club.lblTransferOwnership }}</v-card-title>
          <v-card-text>
            <div v-if="!transferTarget" class="transfer-list">
              <div
                  v-for="member in transferCandidates"
                  :key="member.id"
                  class="transfer-item"
                  @click="transferTarget = member"
              >
                <span>{{ member.name || member.login }}</span>
                <span class="role-hint" v-if="member.clubRole === 'deputy'">{{ t.club.lblDeputy }}</span>
              </div>
            </div>
            <div v-else>
              {{ t.club.lblTransferConfirm }} {{ transferTarget.name || transferTarget.login }}?
            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn @click="cancelTransfer" class="cancel-btn">{{ t.modal.btnCancel }}</v-btn>
            <v-btn v-if="transferTarget" @click="doTransfer" class="confirm-btn">{{ t.modal.btnConfirm }}</v-btn>
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
            <div v-else class="transfer-list">
              <div
                  v-for="friend in invitableFriends"
                  :key="friend.id"
                  class="transfer-item"
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

      <!-- Leave confirmation -->
      <VModal v-model="dialogLeave" max-width="500">
        <VCard>
          <v-card-title class="headline">{{ t.club.lblLeaveClub }}</v-card-title>
          <v-card-text>{{ t.club.lblLeaveClubDescription }}</v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn @click="dialogLeave = false" class="cancel-btn">{{ t.modal.btnCancel }}</v-btn>
            <v-btn @click="confirmLeave" class="confirm-btn">{{ t.club.lblConfirm }}</v-btn>
          </v-card-actions>
        </VCard>
      </VModal>
    </div>

    <!-- State 2: No club -->
    <div v-else class="no-club">

      <p class="no-club-text">{{ t.club.lblNoClubYet }}</p>

      <div class="create-section">
        <HexButton
            variant="primary"
            @click="dialogCreate = true"
        >
          {{ t.profile.buttons.lblCreateClub }}
        </HexButton>
      </div>

      <CreateClub :dialogCreate="dialogCreate" @close="dialogCreate = false" />

      <div class="divider-row">
        <span class="divider-line" />
        <span class="divider-text">{{ t.club.lblOrJoinExisting }}</span>
        <span class="divider-line" />
      </div>

      <!-- Mini club list -->
      <div v-if="suggestedClubs.length" class="suggested-clubs">
        <div v-for="club in suggestedClubs" :key="club.id" class="suggested-row">
          <div class="suggested-info">
            <span class="suggested-name">{{ club.name }}</span>
            <span class="suggested-members">{{ club.members }} {{ t.rating.members }}</span>
          </div>
          <HexButton variant="primary" size="sm" @click="joinClub(club.id)">
            {{ t.club.lblJoin }}
          </HexButton>
        </div>
      </div>

      <div class="browse-row">
        <span class="browse-link" @click="$emit('switchTab', 'clubs')">
          {{ t.club.lblBrowseAllClubs }} →
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, computed, watch, onMounted, onUnmounted} from 'vue';
import store from "@/core/state/store.js";
import {useRouter} from 'vue-router';
import {t} from "@/locales/index.js";
import {formatNumber} from "@/core/constants.js";
import * as userService from "@/core/services/userService.js";
import * as clubService from "@/core/services/clubService.js";
import ClubAvatar from "@/components/fragments/club/ClubAvatar.vue";
import HexButton from "@/components/ui/HexButton.vue";
import CreateClub from "@/components/fragments/club/CreateClub.vue";

const props = defineProps({
  active: Boolean,
});

const emit = defineEmits(['switchTab']);

const router = useRouter();

const master = computed(() => store.getters['master/getMaster']);
const clubId = computed(() => master.value?.userData?.clubId);
const myRole = computed(() => master.value?.userData?.clubRole);

const loading = ref(false);
const clubData = ref(null);
const members = ref([]);
const suggestedClubs = ref([]);
const dialogLeave = ref(false);
const dialogCreate = ref(false);
const dialogActions = ref(false);
const dialogKick = ref(false);
const dialogTransfer = ref(false);
const dialogInvite = ref(false);
const selectedMember = ref(null);
const kickTarget = ref(null);
const transferTarget = ref(null);
const loaded = ref(false);

const isOwner = computed(() => myRole.value === 'owner');
const isDeputy = computed(() => myRole.value === 'deputy');

const friends = computed(() => store.getters['friends/getFriends'] || []);
const invitableFriends = computed(() => friends.value.filter(f => !f.clubId));

const transferCandidates = computed(() => {
  const myId = master.value?.userData?.id;
  return members.value.filter(m => m.id !== myId);
});

const getInitial = (name) => {
  return name ? name.charAt(0).toUpperCase() : '?';
};

const canManage = (member) => {
  const myId = master.value?.userData?.id;
  if (member.id === myId) return false;
  if (isOwner.value) return member.clubRole !== 'owner';
  if (isDeputy.value) return member.clubRole === 'member';
  return false;
};

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

const loadData = async () => {
  if (loaded.value) return;
  loading.value = true;

  try {
    if (clubId.value) {
      const club = await store.dispatch('club/getClubById', clubId.value);
      if (club) {
        clubData.value = club;
        const membersList = await userService.searchParticipants({
          clubId: clubId.value,
          sortBy: 'wins',
          size: 5,
          sortDirection: 'DESC',
        });
        members.value = membersList || [];
      }
    } else {
      const clubs = await clubService.searchClubs({
        sortBy: 'members',
        size: 5,
        sortDirection: 'DESC',
      });
      suggestedClubs.value = (clubs || []).filter(c => c.isPublic);
    }
  } catch (e) {
    console.error('MyClubTab load error:', e);
  } finally {
    loading.value = false;
    loaded.value = true;
  }
};

const reloadClub = async () => {
  loaded.value = false;
  await loadData();
};

const goToClub = () => {
  if (clubData.value) {
    router.push({path: `/club/${clubData.value.id}`});
  }
};

const viewMember = (member) => {
  if (member.login) {
    if (master.value.getLogin() === member.login) {
      router.push({path: '/profile'});
    } else {
      router.push({path: `/user/${member.login}`});
    }
  }
};

const togglePublic = async () => {
  if (!clubData.value) return;
  const newValue = !clubData.value.isPublic;
  await store.dispatch('club/updateClubData', {
    id: clubData.value.id,
    isPublic: newValue,
  });
  clubData.value.isPublic = newValue;
};

// Action menu
const openActions = (member) => {
  selectedMember.value = member;
  dialogActions.value = true;
};

const promoteDeputy = async () => {
  try {
    await store.dispatch('club/setMemberRole', {
      userId: selectedMember.value.id,
      role: 'deputy',
    });
    dialogActions.value = false;
    await reloadClub();
  } catch (e) {
    store.commit('master/setErrorMessage', { text: e.message, timeout: 3000, showButton: false });
  }
};

const demoteMember = async () => {
  try {
    await store.dispatch('club/setMemberRole', {
      userId: selectedMember.value.id,
      role: 'member',
    });
    dialogActions.value = false;
    await reloadClub();
  } catch (e) {
    store.commit('master/setErrorMessage', { text: e.message, timeout: 3000, showButton: false });
  }
};

const confirmKick = () => {
  kickTarget.value = selectedMember.value;
  dialogActions.value = false;
  dialogKick.value = true;
};

const doKick = async () => {
  try {
    await store.dispatch('club/kickMember', {userId: kickTarget.value.id});
    dialogKick.value = false;
    kickTarget.value = null;
    await reloadClub();
  } catch (e) {
    store.commit('master/setErrorMessage', { text: e.message, timeout: 3000, showButton: false });
  }
};

// Transfer ownership
const cancelTransfer = () => {
  dialogTransfer.value = false;
  transferTarget.value = null;
};

const doTransfer = async () => {
  try {
    await store.dispatch('club/transferOwnership', {newOwnerId: transferTarget.value.id});
    dialogTransfer.value = false;
    transferTarget.value = null;
    await reloadClub();
  } catch (e) {
    store.commit('master/setErrorMessage', { text: e.message, timeout: 3000, showButton: false });
  }
};

const confirmLeave = async () => {
  dialogLeave.value = false;
  await store.dispatch('club/leaveClub');
  clubData.value = null;
  members.value = [];
  loaded.value = false;
  await loadData();
};

const joinClub = async (id) => {
  try {
    await store.dispatch('club/changeClub', id);
    loaded.value = false;
    await loadData();
  } catch (e) {
    console.error('Join club error:', e);
  }
};

// Reload when someone joins via invite
const onInviteAccepted = (event) => {
  if (event.detail.acceptedByName) {
    reloadClub();
  }
};

onMounted(() => {
  window.addEventListener('club-invite-accepted', onInviteAccepted);
});

onUnmounted(() => {
  window.removeEventListener('club-invite-accepted', onInviteAccepted);
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

/* Club card */
.club-card {
  max-width: 500px;
  margin: 0 auto;
}

.club-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.club-avatar {
  flex-shrink: 0;
  width: 64px;
  height: 64px;
}

.club-avatar :deep(.avatar-container) {
  width: 64px !important;
  height: 64px !important;
  border: 2px solid var(--hex-primary);
  border-radius: 50%;
}

.club-avatar :deep(.default-avatar) {
  width: 60%;
}

.club-avatar :deep(.non-default-avatar) {
  border: none;
}

.club-info {
  flex: 1;
  min-width: 0;
}

.club-name {
  font-size: 16px;
  font-weight: bold;
  color: var(--hex-text-primary);
  margin: 0;
}

.club-description {
  font-size: 12px;
  color: var(--hex-text-secondary);
  margin: 4px 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* Stats */
.stats-row {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.stat-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 8px;
  background: var(--hex-bg-light);
  border: 0.5px solid var(--hex-border-default);
  border-radius: 10px;
}

.stat-value {
  font-size: 16px;
  font-weight: bold;
  color: var(--hex-text-primary);
}

.stat-wins {
  color: var(--hex-victory);
}

.stat-label {
  font-size: 11px;
  color: var(--hex-text-muted);
  margin-top: 2px;
}

/* Invite */
.invite-row {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}

.no-friends-text {
  text-align: center;
  color: var(--hex-text-muted);
  padding: 20px 0;
  font-size: 13px;
}

/* Members */
.members-section {
  margin-bottom: 16px;
}

.member-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  border-radius: 6px;
}

.member-row:hover {
  background: color-mix(in srgb, var(--hex-bg-light) 50%, transparent);
}

.member-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  cursor: pointer;
  flex: 1;
}

.member-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.member-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--hex-bg-light);
  border: 1px solid var(--hex-border-default);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 14px;
  font-weight: bold;
  color: var(--hex-text-primary);
}

.member-name {
  font-size: 13px;
  color: var(--hex-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.role-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  color: white;
  white-space: nowrap;
}

.owner-badge {
  background: var(--hex-primary);
}

.deputy-badge {
  background: var(--hex-draw);
  color: var(--hex-bg-dark);
}

.member-wins {
  font-size: 12px;
  color: var(--hex-text-muted);
  white-space: nowrap;
}

.action-btn {
  background: none;
  border: none;
  color: var(--hex-text-secondary);
  font-size: 18px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  line-height: 1;
}

.action-btn:hover {
  background: var(--hex-bg-light);
  color: var(--hex-text-primary);
}

.view-all-row {
  display: flex;
  justify-content: center;
  margin-top: 8px;
}

/* Action modal */
.action-title {
  font-size: 14px !important;
}

.action-list {
  padding: 8px 16px !important;
}

.action-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  background: none;
  border: none;
  border-radius: 6px;
  color: var(--hex-text-primary);
  font-size: 14px;
  cursor: pointer;
}

.action-item:hover {
  background: var(--hex-bg-light);
}

.action-danger {
  color: var(--hex-defeat);
}

/* Transfer modal */
.transfer-list {
  max-height: 300px;
  overflow-y: auto;
}

.transfer-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  cursor: pointer;
  border-radius: 6px;
  color: var(--hex-text-primary);
  font-size: 14px;
}

.transfer-item:hover {
  background: var(--hex-bg-light);
}

.role-hint {
  font-size: 11px;
  color: var(--hex-draw);
}

/* Controls */
.controls-row {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 8px;
  flex-wrap: wrap;
}

/* No club state */
.no-club {
  max-width: 500px;
  margin: 0 auto;
  text-align: center;
}

.no-club-text {
  color: var(--hex-text-secondary);
  font-size: 14px;
  margin-bottom: 20px;
  padding-top: 20px;
}

.create-section {
  margin-bottom: 20px;
}

.divider-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 20px 0;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: var(--hex-border-default);
}

.divider-text {
  color: var(--hex-text-muted);
  font-size: 12px;
  white-space: nowrap;
}

/* Suggested clubs */
.suggested-clubs {
  margin-bottom: 16px;
}

.suggested-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--hex-bg-light);
  border: 0.5px solid var(--hex-border-default);
  margin-bottom: 8px;
}

.suggested-info {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.suggested-name {
  font-size: 14px;
  color: var(--hex-text-primary);
  font-weight: bold;
}

.suggested-members {
  font-size: 11px;
  color: var(--hex-text-muted);
}

.browse-row {
  margin-top: 12px;
}

.browse-link {
  color: var(--hex-primary);
  font-size: 13px;
  cursor: pointer;
}

.browse-link:hover {
  text-decoration: underline;
}
</style>
