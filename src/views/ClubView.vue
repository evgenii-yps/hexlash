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

            <!-- Meta row: level badge, member count, online -->
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

          <!-- Action Buttons -->
          <div class="club-buttons">
            <div v-if="isOwner" class="controls">
              <h2>{{ t.club.lblControl }}</h2>

              <ClubWithdraw :balance="String(formatNumber(clubData.getBalance()))" :wallet="master.userData.walletAddress"/>

              <VBtnDark
                  class="club-btn"
                  @click="btnIsPublic">
                <template #prepend>
                  <v-tooltip
                      v-model="showToolTip"
                      location="top"
                      max-width="250px"
                      contentClass="v-tooltip__content">
                    <template #activator="{ props }">
                      <img v-bind="props" @click.stop="toggleToolTip" src="@/assets/images/icon_lock_white.svg" alt=""
                           class="custom-icon"/>
                    </template>
                    <span>{{ t.club.lblCloseClubTooltip }}</span>
                  </v-tooltip>
                </template>
                {{ t.club.lblOpenClub }}
                <template #append>
                  <span class="custom-icon"/>
                  <v-switch
                      style="position: absolute; right:10px;"
                      v-model="isPublic"
                      :class="{ checked: isPublic }"
                      class="club-switcher-public"
                      hide-details
                  ></v-switch>
                </template>
              </VBtnDark>

              <ClubEdit :clubData="clubData "/>

            </div>

            <div v-else-if="isMyClub" style="margin-top: 20px; display: flex; justify-content: center;">
              <HexButton variant="danger" size="sm" @click="dialogLeaveClub = true">
                {{ t.club.lblLeaveClub }}
              </HexButton>

              <VModal v-model="dialogLeaveClub" max-width="500">
                <VCard>
                  <v-card-title class="headline">{{ t.club.lblLeaveClub }}</v-card-title>
                  <v-card-text>
                    {{ t.club.lblLeaveClubDescription }}
                  </v-card-text>
                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn @click="dialogLeaveClub = false" class="cancel-btn">{{ t.modal.btnCancel }}</v-btn>
                    <v-btn @click="confirmLeave" class="confirm-btn">{{ t.club.lblConfirm }}</v-btn>
                  </v-card-actions>
                </VCard>
              </VModal>
            </div>

            <div v-else>
              <VBtnDark
                  v-if="isPublic && !isMyClub"
                  class="club-btn"
                  style="margin-top: 20px;"
                  @click="btnToJoin">
                <template #prepend>
                  <img src="@/assets/images/icon_arrow.svg" alt="" class="custom-icon"/>
                </template>
                {{ t.club.lblChangeClub }}
                <template #append>
                  <span class="custom-icon"/>
                </template>
              </VBtnDark>

              <VModal v-model="dialogChangeClub" max-width="500">
                <VCard>
                  <v-card-title class="headline">{{ t.club.lblChangeClub }}</v-card-title>
                  <v-card-text>
                    {{ t.club.lblChangeClubDescription }}
                  </v-card-text>
                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn @click="dialogChangeClub = false" class="cancel-btn">{{ t.modal.btnCancel }}</v-btn>
                    <v-btn @click="confirmExit" class="confirm-btn">{{ t.club.lblConfirm }}</v-btn>
                  </v-card-actions>
                </VCard>
              </VModal>
            </div>
          </div>
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
import {t, interpolate} from "@/locales/index.js";

import ClubAvatar from "@/components/fragments/club/ClubAvatar.vue";
import ClubStats from "@/components/fragments/club/ClubStats.vue";
import router from "@/router/index.js";
import ClubWithdraw from "@/components/fragments/club/ClubWithdraw.vue";
import ClubEdit from "@/components/fragments/club/ClubEdit.vue";
import ClubOwnerAvatar from "@/components/fragments/club/ClubOwnerAvatar.vue";
import HexButton from "@/components/ui/HexButton.vue";
import {formatNumber} from "@/core/constants.js";
import * as amplitude from "@amplitude/analytics-browser";


const route = useRoute();
const clubId = route.params.id;
const master = computed(() => store.getters['master/getMaster']);

const clubData = ref(null);
const loading = ref(true);

const isPublic = ref(true);
const isOwner = ref(false);
const isMyClub = ref(false);
const showToolTip = ref(false);

const dialogChangeClub = ref(false);
const dialogLeaveClub = ref(false);

// Clan Level — static mock (will be replaced by real system later)
const clanLevel = ref(1);
const clanXP = ref(0);
const clanXPMax = ref(1000);
const clanXPPercent = computed(() => {
  if (clanXPMax.value === 0) return 0;
  return Math.min(100, Math.round(clanXP.value / clanXPMax.value * 100));
});

const toggleToolTip = () => {
  showToolTip.value = !showToolTip.value;
};

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
    });


const btnIsPublic = () => {
  isPublic.value = !isPublic.value;
  clubData.value.isPublic = isPublic.value;
  store.dispatch('club/updateClubData', clubData.value);
}

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

/* ===== BUTTONS (legacy, moved to Settings in ТЗ C) ===== */
.club-buttons {
  margin-top: 20px;
  margin-bottom: 40px;
}

.controls h2 {
  font-size: 2em;
  justify-content: center;
  color: white;
  margin: 30px auto 0 auto;
  font-family: 'Anonymous', 'Courier New', Consolas, monospace;
  display: flex;
}

.club-btn {
  height: 50px !important;
  margin: 15px auto;
  width: 80%;
  max-width: 500px;
  justify-content: space-between;
  text-align: center;
  color: white;
  cursor: pointer;
  display: flex;
  background-color: var(--hex-bg-light) !important;
}

.custom-icon {
  width: 25px;
  height: 25px;
  margin-right: 10px;
}

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

.club-switcher-public.checked :deep(.v-switch__thumb) {
  background-color: var(--hex-primary) !important;
}
</style>
