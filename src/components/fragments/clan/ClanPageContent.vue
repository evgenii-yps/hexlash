<template>
  <div class="clan-page-content">

    <!-- Clan Header -->
    <div class="clan-header">
      <div class="clan-header-bg"></div>
      <div class="clan-header-content">
        <div class="clan-avatar-wrap">
          <ClanOwnerAvatar v-if="isOwner" :clanData="clanData"/>
          <ClanAvatar v-else :avatarUrl="clanData.avatarUrl"/>
        </div>
        <div class="clan-title-block">
          <h2 class="clan-name">{{ clanData.name }}</h2>
          <p v-if="clanData.description" class="clan-description">{{ clanData.description }}</p>
        </div>
      </div>

      <!-- Meta row -->
      <div class="clan-meta">
        <span class="level-badge">LVL {{ clanLevel }}</span>
        <span class="meta-separator">&middot;</span>
        <span class="meta-text">{{ clanData.members }} / {{ levelProgress.maxMembers }} {{ t.rating.members }}</span>
      </div>

      <!-- Level progress bar -->
      <div class="level-progress">
        <div class="level-labels">
          <span class="level-current">
            <template v-if="levelProgress.isMaxLevel">LEVEL {{ clanLevel }} &mdash; MAX</template>
            <template v-else>LEVEL {{ clanLevel }} &rarr; {{ clanLevel + 1 }}</template>
          </span>
          <span class="level-xp">{{ formatNumber(levelProgress.progressXP) }} / {{ formatNumber(levelProgress.progressMax) }} XP</span>
        </div>
        <div class="level-bar">
          <div class="level-bar-fill" :style="{ width: clanXPPercent + '%' }"></div>
        </div>
      </div>
    </div>

    <!-- Stats Grid + Win Rate Bar -->
    <ClanStats :clanData="clanData"/>

    <!-- Tab Navigation -->
    <div class="tab-nav">
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

    <!-- Members Tab -->
    <div v-if="activeTab === 'members'" class="tab-content">
      <div v-if="isOwner || isDeputy" class="invite-row">
        <HexButton variant="primary" size="sm" @click="openInviteModal">
          {{ t.clan.lblInviteFriend }}
        </HexButton>
      </div>

      <div class="leaderboard-label">{{ t.clan.lblLeaderboard || 'CLAN LEADERBOARD' }}</div>

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
              <span v-if="member.clanRole === 'owner'" class="role-badge owner-badge">OWNER</span>
              <span v-else-if="member.clanRole === 'deputy'" class="role-badge deputy-badge">{{ t.clan.lblDeputy }}</span>
              <span v-if="member.isOnline" class="online-dot"></span>
            </div>
            <div class="member-stats-text">
              <span class="member-wins">{{ formatNumber(member.wins || 0) }} W</span>
              <span class="member-fights">{{ formatNumber(member.battles || member.totalFights || 0) }} {{ t.clan.lblFights || 'fights' }}</span>
            </div>
          </div>
          <button
              v-if="canManage(member)"
              class="action-menu-btn"
              @click.stop="toggleActionMenu(member, $event)"
          >&#x22EF;</button>
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
                v-if="selectedMember.clanRole === 'deputy'"
                class="action-menu-item"
                @click="doTransfer"
            >{{ t.clan.lblTransferOwnership }}</button>
            <button
                v-if="selectedMember.clanRole === 'deputy'"
                class="action-menu-item"
                @click="doDemote"
            >{{ t.clan.lblDemoteMember }}</button>
            <button
                v-if="selectedMember.clanRole === 'member'"
                class="action-menu-item"
                @click="doPromote"
            >{{ t.clan.lblPromoteDeputy }}</button>
          </template>
          <button class="action-menu-item action-danger" @click="doKick">
            {{ t.clan.lblKick }}
          </button>
        </div>
      </Teleport>

      <!-- Leave for members (non-owner) -->
      <div v-if="!isOwner" class="leave-row">
        <HexButton variant="danger" size="sm" @click="dialogLeaveClan = true">
          {{ t.clan.lblLeaveClan }}
        </HexButton>
      </div>
    </div>

    <!-- Activity Tab -->
    <div v-if="activeTab === 'activity'" class="tab-content">
      <ClanActivityFeed :clanId="clanId" />
    </div>

    <!-- Settings Tab -->
    <div v-if="activeTab === 'settings'" class="tab-content settings-tab">
      <div class="settings-section">
        <div class="settings-title">{{ t.clan.lblClanInfo || 'CLAN INFO' }}</div>
        <div class="settings-row">
          <span class="settings-label">{{ t.clan.lblClanName || 'Name' }}</span>
          <span class="settings-value">{{ clanData.name }}</span>
        </div>
        <div class="settings-row">
          <span class="settings-label">{{ t.clan.lblClanDescription || 'Description' }}</span>
          <span class="settings-value settings-value-desc">{{ clanData.description || '&mdash;' }}</span>
        </div>
        <div class="settings-row">
          <span class="settings-label">{{ t.clan.lblType || 'Type' }}</span>
          <span class="settings-value">{{ clanData.isPublic ? (t.clan.lblPublic || 'Public') : (t.clan.lblPrivate || 'Private') }}</span>
        </div>
        <div class="settings-row">
          <span class="settings-label">{{ t.clan.lblCreated || 'Created' }}</span>
          <span class="settings-value">{{ clanCreatedDate }}</span>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-title">{{ t.clan.lblLevelBonuses || 'LEVEL BONUSES' }}</div>
        <div class="settings-row">
          <span class="settings-label">{{ t.clan.lblMaxMembers || 'Max members' }}</span>
          <span class="settings-value">
            <span class="value-green">{{ levelProgress.maxMembers }}</span>
          </span>
        </div>
        <div class="settings-row">
          <span class="settings-label">{{ t.clan.lblXpBonus || 'XP bonus' }}</span>
          <span class="settings-value value-green">+{{ levelProgress.xpBonus }}%</span>
        </div>
        <div class="settings-row">
          <span class="settings-label">{{ t.clan.lblNextUnlock || 'Next unlock' }}</span>
          <span class="settings-value value-xp">{{ nextUnlockText }}</span>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-title">{{ t.clan.lblTreasury || 'TREASURY' }}</div>
        <div class="settings-row">
          <span class="settings-label">Balance</span>
          <span class="settings-value value-balance">{{ formatNumber(clanBalance) }}</span>
        </div>
        <div class="settings-row">
          <span class="settings-label">{{ t.clan.lblIncome || 'Income' }}</span>
          <span class="settings-value value-secondary">{{ t.clan.lblIncome || '5% of member taps' }}</span>
        </div>
      </div>

      <div class="settings-actions">
        <div v-if="isOwner" class="settings-btn-group">
          <ClanEdit :clanData="clanData"/>
          <HexButton variant="danger" size="sm" @click="confirmDisband">
            {{ t.clan.btnDisband || 'Disband Clan' }}
          </HexButton>
        </div>
        <div v-else class="settings-btn-group">
          <HexButton variant="danger" size="sm" @click="confirmLeaveSettings">
            {{ t.clan.lblLeaveClan }}
          </HexButton>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <VModal v-model="dialogLeaveClan" max-width="500">
      <VCard>
        <v-card-title class="headline">{{ t.clan.lblLeaveClan }}</v-card-title>
        <v-card-text>{{ t.clan.lblLeaveClanDescription }}</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="dialogLeaveClan = false" class="cancel-btn">{{ t.modal.btnCancel }}</v-btn>
          <v-btn @click="confirmLeave" class="confirm-btn">{{ t.clan.lblConfirm }}</v-btn>
        </v-card-actions>
      </VCard>
    </VModal>

    <VModal v-model="dialogInvite" max-width="400">
      <VCard>
        <v-card-title class="headline action-title">{{ t.clan.lblInviteFriend }}</v-card-title>
        <v-card-text>
          <div v-if="invitableFriends.length === 0" class="no-friends-text">
            {{ t.clan.lblPlayerHasClan }}
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

    <ClanConfirmModal
        :show="confirmModal.show"
        :title="confirmModal.title"
        :description="confirmModal.description"
        :confirmText="confirmModal.confirmText"
        :confirmDanger="confirmModal.danger"
        @confirm="handleConfirm"
        @cancel="closeConfirmModal"
    />
  </div>
</template>

<script setup>
import {ref, computed, onMounted, onBeforeUnmount, watch} from 'vue';
import {useRouter} from 'vue-router';
import store from "@/core/state/store.js";
import {t} from "@/locales/index.js";
import {formatNumber} from "@/core/constants.js";
import {CLAN_LEVEL_CONFIG, getClanLevelProgress} from "@/data/clanLevels.js";
import * as userService from "@/core/services/userService.js";
import * as clanService from "@/core/services/clanService.js";

import ClanAvatar from "@/components/fragments/clan/ClanAvatar.vue";
import ClanOwnerAvatar from "@/components/fragments/clan/ClanOwnerAvatar.vue";
import ClanStats from "@/components/fragments/clan/ClanStats.vue";
import ClanActivityFeed from "@/components/fragments/clan/ClanActivityFeed.vue";
// Club Mode UI moved to FightClubView
import ClanEdit from "@/components/fragments/clan/ClanEdit.vue";
import HexButton from "@/components/ui/HexButton.vue";
import ClanConfirmModal from "@/components/fragments/clan/ClanConfirmModal.vue";

const props = defineProps({
  clanData: { type: Object, required: true },
  clanId: { type: String, required: true },
});

const emit = defineEmits(['clan-left', 'clan-deleted']);

const router = useRouter();
const master = computed(() => store.getters['master/getMaster']);

const isOwner = computed(() => master.value?.userData?.clanRole === 'owner' && master.value?.userData?.clanId === props.clanId);
const isDeputy = computed(() => master.value?.userData?.clanRole === 'deputy' && master.value?.userData?.clanId === props.clanId);

const membersLoading = ref(false);
const membersList = ref([]);
const activeTab = ref('members');
const activityCount = ref(0);

const dialogLeaveClan = ref(false);
const dialogInvite = ref(false);

// Confirm modal
const confirmModal = ref({ show: false, title: '', description: '', confirmText: '', danger: false, onConfirm: null });
const openConfirmModal = (opts) => { confirmModal.value = { show: true, ...opts }; };
const closeConfirmModal = () => { confirmModal.value = { ...confirmModal.value, show: false, onConfirm: null }; };
const handleConfirm = () => { if (confirmModal.value.onConfirm) confirmModal.value.onConfirm(); closeConfirmModal(); };

// Action menu
const actionMenuOpen = ref(false);
const selectedMember = ref(null);
const actionMenuStyle = ref({});

// Clan Level — from API data
const levelProgress = computed(() => getClanLevelProgress(props.clanData.level || 1, props.clanData.xp || 0));
const clanLevel = computed(() => levelProgress.value.level);
const clanXPPercent = computed(() => levelProgress.value.percent);

const nextUnlockText = computed(() => {
  const lp = levelProgress.value;
  if (lp.isMaxLevel) return t.value.clan.lblAllBonuses || 'All bonuses unlocked';
  const nextConfig = CLAN_LEVEL_CONFIG[lp.level + 1];
  const currentConfig = CLAN_LEVEL_CONFIG[lp.level];
  const parts = [];
  if (nextConfig.maxMembers > currentConfig.maxMembers) {
    parts.push(`+${nextConfig.maxMembers - currentConfig.maxMembers} member slots`);
  }
  if (nextConfig.xpBonus > currentConfig.xpBonus) {
    parts.push(`+${nextConfig.xpBonus - currentConfig.xpBonus}% XP bonus`);
  }
  if (parts.length === 0) return `Level ${lp.level + 1}`;
  return `Level ${lp.level + 1}: ${parts.join(', ')}`;
});

const tabs = computed(() => [
  { id: 'members', label: t.value.clan.tabMembers || 'Members' },
  { id: 'activity', label: t.value.clan.tabActivity || 'Activity' },
  { id: 'settings', label: t.value.clan.tabSettings || 'Settings' },
]);

const friends = computed(() => store.getters['friends/getFriends'] || []);
const invitableFriends = computed(() => friends.value.filter(f => !f.clanId));

const clanBalance = computed(() => {
  try { return props.clanData?.getBalance?.() || 0; } catch { return 0; }
});

const clanCreatedDate = computed(() => {
  const d = props.clanData?.createdAt;
  if (!d) return '—';
  return new Date(d).toLocaleDateString();
});

// Load members
const loadMembers = async () => {
  membersLoading.value = true;
  try {
    const list = await userService.searchParticipants({
      clanId: props.clanId,
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
  const myId = master.value?.userData?.id;
  if (member.id === myId) return false;
  if (isOwner.value) return member.clanRole !== 'owner';
  if (isDeputy.value) return member.clanRole === 'member';
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
    await store.dispatch('clan/setMemberRole', { userId: member.id, role: 'deputy' });
    await loadMembers();
  } catch (e) {
    store.commit('master/setErrorMessage', { text: e.message, timeout: 3000, showButton: false });
  }
};

const doDemote = async () => {
  const member = selectedMember.value;
  closeActionMenu();
  try {
    await store.dispatch('clan/setMemberRole', { userId: member.id, role: 'member' });
    await loadMembers();
  } catch (e) {
    store.commit('master/setErrorMessage', { text: e.message, timeout: 3000, showButton: false });
  }
};

const doKick = () => {
  const member = selectedMember.value;
  closeActionMenu();
  const name = member.name || member.login;
  const desc = (t.value.clan.lblKickDesc || '').replace('{name}', name);
  openConfirmModal({
    title: t.value.clan.lblKickTitle,
    description: desc,
    confirmText: t.value.clan.lblKick,
    danger: true,
    onConfirm: async () => {
      try {
        await store.dispatch('clan/kickMember', { userId: member.id });
        await loadMembers();
      } catch (e) {
        store.commit('master/setErrorMessage', { text: e.message, timeout: 3000, showButton: false });
      }
    },
  });
};

const doTransfer = () => {
  const member = selectedMember.value;
  closeActionMenu();
  const name = member.name || member.login;
  const desc = (t.value.clan.lblTransferDesc || '').replace('{name}', name);
  openConfirmModal({
    title: t.value.clan.lblTransferTitle,
    description: desc,
    confirmText: t.value.clan.lblTransferOwnership,
    danger: false,
    onConfirm: async () => {
      try {
        await store.dispatch('clan/transferOwnership', { newOwnerId: member.id });
        await loadMembers();
      } catch (e) {
        store.commit('master/setErrorMessage', { text: e.message, timeout: 3000, showButton: false });
      }
    },
  });
};

// Invite
const openInviteModal = () => {
  store.dispatch('friends/loadFriends');
  dialogInvite.value = true;
};

const sendInvite = async (friend) => {
  try {
    await clanService.inviteToClan(friend.id);
    dialogInvite.value = false;
    const name = friend.username || friend.name || friend.login;
    store.commit('master/setInfoMessage', {
      text: `${t.value.clan.lblInviteSent} ${name}`,
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

// Leave / Disband
const confirmLeave = async () => {
  dialogLeaveClan.value = false;
  await store.dispatch('clan/leaveClan');
  emit('clan-left');
};

const confirmLeaveSettings = () => {
  openConfirmModal({
    title: t.value.clan.lblLeaveTitle,
    description: t.value.clan.lblLeaveDesc,
    confirmText: t.value.clan.lblLeaveClan,
    danger: true,
    onConfirm: async () => {
      await store.dispatch('clan/leaveClan');
      emit('clan-left');
    },
  });
};

const confirmDisband = () => {
  openConfirmModal({
    title: t.value.clan.lblDisbandTitle,
    description: t.value.clan.lblDisbandDesc,
    confirmText: t.value.clan.btnDisband || 'Disband',
    danger: true,
    onConfirm: async () => {
      await store.dispatch('clan/deleteClan');
      emit('clan-deleted');
    },
  });
};

// Escape closes action menu
const onKeydown = (e) => {
  if (e.key === 'Escape') closeActionMenu();
};

onMounted(() => {
  document.addEventListener('keydown', onKeydown);
  loadMembers();
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown);
});

// Reload members when clanData changes (e.g. after edit)
watch(() => props.clanData, () => {
  loadMembers();
});
</script>

<style scoped>
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
  border: 2px solid var(--hex-border-strong);
  border-radius: var(--hex-radius-lg);
  box-shadow: 0 0 12px rgba(255, 255, 255, 0.08);
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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-weight: bold;
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
  background: var(--hex-bg-light);
  color: var(--hex-text-primary);
  font-size: 10px;
  font-weight: bold;
  font-family: 'AnonymousBalance', 'Courier New', monospace;
  border-radius: var(--hex-radius-sm);
  letter-spacing: 0.5px;
  border: 1px solid var(--hex-border-default);
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
  font-family: 'AnonymousBalance', 'Courier New', monospace;
  color: var(--hex-success);
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
  background: linear-gradient(90deg, var(--hex-success), #33CC77);
  border-radius: 3px;
  box-shadow: 0 0 8px rgba(0, 255, 136, 0.3);
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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-weight: bold;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s;
  position: relative;
}

.tab-btn.active {
  color: var(--hex-text-primary);
  border-bottom-color: var(--hex-text-primary);
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
  background: transparent;
  color: var(--hex-text-muted);
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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-weight: bold;
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
  color: var(--hex-text-primary);
  white-space: nowrap;
  font-weight: bold;
  letter-spacing: 0.3px;
}

.owner-badge {
  background: var(--hex-bg-light);
  border: 1px solid var(--hex-border-active);
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

/* Leave row */
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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-weight: bold;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--hex-text-primary);
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
