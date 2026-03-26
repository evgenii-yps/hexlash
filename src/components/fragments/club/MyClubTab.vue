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
          <span class="stat-value">{{ clubData.members }}</span>
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

      <!-- Members list -->
      <div class="members-section">
        <div v-for="member in members" :key="member.id" class="member-row" @click="viewMember(member)">
          <div class="member-left">
            <div class="member-avatar">
              <span>{{ getInitial(member.name || member.login) }}</span>
            </div>
            <span class="member-name">{{ member.name || member.login || t.profile.anonymous }}</span>
            <span v-if="member.id === clubData.owner" class="owner-badge">OWNER</span>
          </div>
          <span class="member-wins">{{ formatNumber(member.wins) }} W</span>
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
      </div>

      <!-- Non-owner: leave -->
      <div v-else class="controls-row">
        <HexButton variant="danger" size="sm" @click="dialogLeave = true">
          {{ t.club.lblLeaveClub }}
        </HexButton>
      </div>

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
            :disabled="!canCreate"
            @click="dialogCreate = true"
        >
          {{ t.profile.buttons.lblCreateClub }}
        </HexButton>
        <p v-if="!canCreate" class="need-taps">{{ t.club.lblNeedTaps }}</p>
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
import {ref, computed, watch} from 'vue';
import store from "@/core/state/store.js";
import {useRouter} from 'vue-router';
import {t} from "@/locales/index.js";
import {formatNumber, COST_CREATE_CLUB} from "@/core/constants.js";
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
const canCreate = computed(() => master.value?.getBalance() >= COST_CREATE_CLUB);

const loading = ref(false);
const clubData = ref(null);
const members = ref([]);
const suggestedClubs = ref([]);
const dialogLeave = ref(false);
const dialogCreate = ref(false);
const loaded = ref(false);

const isOwner = computed(() => clubData.value && master.value && master.value.userData.id === clubData.value.owner);

const getInitial = (name) => {
  return name ? name.charAt(0).toUpperCase() : '?';
};

const loadData = async () => {
  if (loaded.value) return;
  loading.value = true;

  try {
    if (clubId.value) {
      const club = await store.dispatch('club/getClubById', clubId.value);
      if (club) {
        clubData.value = club;
        // Load top 5 members
        const membersList = await userService.searchParticipants({
          clubId: clubId.value,
          sortBy: 'wins',
          size: 5,
          sortDirection: 'DESC',
        });
        members.value = membersList || [];
      }
    } else {
      // Load suggested public clubs
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

/* Members */
.members-section {
  margin-bottom: 16px;
}

.member-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  cursor: pointer;
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

.owner-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--hex-primary);
  color: white;
  white-space: nowrap;
}

.member-wins {
  font-size: 12px;
  color: var(--hex-text-muted);
  white-space: nowrap;
}

.view-all-row {
  display: flex;
  justify-content: center;
  margin-top: 8px;
}

/* Controls */
.controls-row {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 8px;
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

.need-taps {
  color: var(--hex-text-muted);
  font-size: 12px;
  margin-top: 6px;
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
