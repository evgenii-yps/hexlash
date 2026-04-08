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

          <!-- Member view — full clan page via shared component -->
          <ClanPageContent
              v-if="isMyClub"
              :clubData="clubData"
              :clubId="clubId"
              @club-left="onClubLeft"
              @club-deleted="onClubDeleted"
          />

          <!-- Visitor view -->
          <template v-if="!isMyClub">
            <!-- Clan Header (visitor) -->
            <div class="clan-header">
              <div class="clan-header-bg"></div>
              <div class="clan-header-content">
                <div class="clan-avatar-wrap">
                  <ClubAvatar :avatarUrl="clubData.avatarUrl"/>
                </div>
                <div class="clan-title-block">
                  <h2 class="clan-name">{{ clubData.name }}</h2>
                  <p v-if="clubData.description" class="clan-description">{{ clubData.description }}</p>
                </div>
              </div>

              <div class="clan-meta">
                <span class="level-badge">LVL {{ clanLevel }}</span>
                <span class="meta-separator">&middot;</span>
                <span class="meta-text">{{ clubData.members }} / {{ levelProgress.maxMembers }} {{ t.rating.members }}</span>
              </div>

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

            <ClubStats :clubData="clubData"/>

            <!-- Top-5 members without action menu -->
            <div class="visitor-section">
              <div v-if="membersLoading" class="members-loader">
                <v-progress-circular size="24" indeterminate />
              </div>

              <div v-else class="members-list">
                <div
                    v-for="(member, index) in visitorMembers"
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
                    </div>
                    <div class="member-stats-text">
                      <span class="member-wins">{{ formatNumber(member.wins || 0) }} W</span>
                      <span class="member-fights">{{ formatNumber(member.battles || member.totalFights || 0) }} {{ t.club.lblFights || 'fights' }}</span>
                    </div>
                  </div>
                </div>

                <div v-if="remainingMembers > 0" class="more-members">
                  + {{ remainingMembers }} more {{ t.rating.members }}
                </div>
              </div>

              <!-- Join action bar -->
              <div class="visitor-action-bar">
                <HexButton
                    v-if="isClanFull"
                    variant="primary"
                    block
                    disabled
                >{{ t.club.lblClanFull }}</HexButton>
                <HexButton
                    v-else-if="!isPublic"
                    variant="primary"
                    block
                    disabled
                >{{ t.club.lblClanPrivate }}</HexButton>
                <HexButton
                    v-else
                    variant="primary"
                    block
                    @click="btnToJoin"
                >{{ t.club.lblJoinClan }} {{ clubData.name }}</HexButton>
              </div>
            </div>

            <!-- Change club modal (visitor) -->
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
          </template>

        </div>

        <div v-else class="not-found-container">
          <p>{{ t.club.lblClubNotFound || 'Clan not found' }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, computed, onBeforeMount, watch} from 'vue';
import {useRoute} from 'vue-router';
import store from "@/core/state/store.js";
import {t} from "@/locales/index.js";

import ClubAvatar from "@/components/fragments/club/ClubAvatar.vue";
import ClubStats from "@/components/fragments/club/ClubStats.vue";
import ClanPageContent from "@/components/fragments/club/ClanPageContent.vue";
import HexButton from "@/components/ui/HexButton.vue";
import {formatNumber} from "@/core/constants.js";
import {getClanLevelProgress} from "@/data/clanLevels.js";
import * as userService from "@/core/services/userService.js";
import router from "@/router/index.js";
import * as amplitude from "@amplitude/analytics-browser";


const route = useRoute();
const clubId = route.params.id;
const master = computed(() => store.getters['master/getMaster']);

const clubData = ref(null);
const loading = ref(true);
const membersLoading = ref(false);
const membersList = ref([]);

const isPublic = ref(true);
const isMyClub = ref(false);

const dialogChangeClub = ref(false);
const notFound = ref(false);

// Clan Level — from API data
const levelProgress = computed(() => getClanLevelProgress(clubData.value?.level || 1, clubData.value?.xp || 0));
const clanLevel = computed(() => levelProgress.value.level);
const clanXPPercent = computed(() => levelProgress.value.percent);

const visitorMembers = computed(() => membersList.value.slice(0, 5));
const remainingMembers = computed(() => {
  const total = clubData.value?.members || membersList.value.length;
  return Math.max(0, total - 5);
});
const isClanFull = computed(() => {
  const max = clubData.value?.maxMembers || 50;
  return (clubData.value?.members || 0) >= max;
});

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
      isPublic.value = clubData.value.isPublic;
      loading.value = false;
      // Only load members for visitor view; member view handled by ClanPageContent
      if (!isMyClub.value) {
        loadMembers();
      }
    });

// Visitor helpers
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

const btnToJoin = () => {
  dialogChangeClub.value = true;
};

const confirmExit = () => {
  dialogChangeClub.value = false;
  store.dispatch('club/changeClub', clubData.value.id);
  amplitude.track('ChangeClub', clubData.value.id);
};

// ClanPageContent events
const onClubLeft = () => {
  router.push('/ratings/clubs');
};

const onClubDeleted = () => {
  router.push('/ratings/clubs');
};
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

/* ===== VISITOR HEADER ===== */
.clan-header {
  position: relative;
  padding: 20px 16px 16px;
  overflow: hidden;
}

.clan-header-bg {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(180deg, var(--hex-bg-medium) 0%, var(--hex-bg-dark) 100%);
  z-index: 0;
}

.clan-header-bg::after {
  content: '';
  position: absolute;
  top: -40%; left: 50%;
  transform: translateX(-50%);
  width: 120%; height: 80%;
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

.clan-avatar-wrap :deep(.default-avatar) { width: 60%; }
.clan-avatar-wrap :deep(.non-default-avatar) { border: none; border-radius: var(--hex-radius-lg); }

.clan-title-block { flex: 1; min-width: 0; }

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

.clan-meta {
  position: relative; z-index: 1;
  display: flex; align-items: center; gap: 8px; margin-top: 12px;
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

.meta-separator { color: var(--hex-text-muted); font-size: 12px; }
.meta-text { color: var(--hex-text-secondary); font-size: 12px; }

.level-progress { position: relative; z-index: 1; margin-top: 10px; }
.level-labels { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }
.level-current { font-size: 10px; font-family: 'AnonymousBalance', 'Courier New', monospace; color: var(--hex-success); letter-spacing: 0.5px; }
.level-xp { font-size: 10px; font-family: 'AnonymousBalance', 'Courier New', monospace; color: var(--hex-text-muted); }
.level-bar { height: 6px; background: var(--hex-bg-dark); border-radius: 3px; overflow: hidden; }
.level-bar-fill { height: 100%; background: linear-gradient(90deg, var(--hex-success), #33CC77); border-radius: 3px; box-shadow: 0 0 8px rgba(0, 255, 136, 0.3); transition: width 0.4s ease; }

/* ===== VISITOR MEMBERS ===== */
.visitor-section { margin-top: 12px; }

.members-loader { display: flex; justify-content: center; padding: 30px 0; }
.members-list { padding: 0 8px; }

.member-row {
  display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: 6px; transition: background 0.15s;
}
.member-row:hover { background: color-mix(in srgb, var(--hex-bg-light) 50%, transparent); }

.member-rank { width: 24px; text-align: center; font-family: 'AnonymousBalance', 'Courier New', monospace; font-size: 14px; color: var(--hex-text-muted); flex-shrink: 0; }
.rank-top { color: var(--hex-draw); }

.member-avatar {
  width: 38px; height: 38px; border-radius: var(--hex-radius-md);
  background: var(--hex-bg-light); border: 1px solid var(--hex-border-default);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; font-size: 15px; font-weight: bold; color: var(--hex-text-primary);
}

.member-info { flex: 1; min-width: 0; cursor: pointer; }
.member-name-row { display: flex; align-items: center; gap: 6px; }
.member-name { font-size: 13px; font-weight: 600; color: var(--hex-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.role-badge { font-size: 9px; padding: 1px 5px; border-radius: 3px; color: var(--hex-text-primary); white-space: nowrap; font-weight: bold; letter-spacing: 0.3px; }
.owner-badge { background: var(--hex-bg-light); border: 1px solid var(--hex-border-active); }
.deputy-badge { background: var(--hex-bg-light); border: 1px solid var(--hex-border-default); opacity: 0.8; }

.member-stats-text { display: flex; gap: 8px; margin-top: 2px; }
.member-wins { font-size: 11px; color: var(--hex-victory); }
.member-fights { font-size: 11px; color: var(--hex-text-muted); }

.more-members { text-align: center; font-size: 13px; color: var(--hex-text-muted); padding: 12px 0 4px; }
.visitor-action-bar { padding: 16px; margin-top: 8px; }

/* Not found */
.not-found-container {
  height: 75vh;
  display: flex; flex-direction: column; gap: 20px;
  align-items: center; justify-content: center;
  color: var(--hex-text-muted); font-size: 1.2em;
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

.back-btn:hover { background-color: var(--hex-bg-medium); }
</style>
