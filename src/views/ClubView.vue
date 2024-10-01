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

        <div v-else>

          <div class="club-header">

            <ClubOwnerAvatar v-if="isOwner" :clubData="clubData"/>
            <ClubAvatar v-else :avatarUrl="clubData.avatarUrl"/>

            <h2>{{ clubData.name }}</h2>
            <p>{{ clubData.description }}</p>

          </div>

          <ClubStats :clubData="clubData"/>

          <div class="club-buttons">
            <VBtnDark
                class="club-btn"
                @click="btnToMembers">
              <template #prepend>
                <img src="@/assets/images/icon_members.svg" alt="" class="custom-icon" style="width:30px;"/>
              </template>

              <div v-html="formattedMembers"/>
            </VBtnDark>

            <div v-if="isOwner" class="controls">
              <h2>Control</h2>

              <ClubWithdraw :balance="String(clubData.balance)" :wallet="master.userData.walletAddress"/>

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
                      <img v-bind="props" @click.stop="toggleToolTip" src="@/assets/images/icon_lock_white.svg" alt="" class="custom-icon"/>
                    </template>
                    <span>{{t('club.lblCloseClubTooltip')}}</span>
                  </v-tooltip>
                </template>
                {{t('club.lblOpenClub')}}
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

            <div v-else-if="isMyClub">

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
                {{t('club.lblChangeClub')}}
                <template #append>
                  <span class="custom-icon"/>
                </template>
              </VBtnDark>

              <VModal v-model="dialogChangeClub" max-width="500">
                <VCard>
                  <v-card-title class="headline">{{t('club.lblChangeClub')}}</v-card-title>
                  <v-card-text>
                    {{t('club.lblChangeClubDescription')}}
                  </v-card-text>
                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn @click="dialogChangeClub = false" class="cancel-btn">{{t('modal.btnCancel')}}</v-btn>
                    <v-btn @click="confirmExit" class="confirm-btn">{{t('club.lblConfirm')}}</v-btn>
                  </v-card-actions>
                </VCard>
              </VModal>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, computed, nextTick, onMounted, onBeforeMount, watch} from 'vue';
import {useRoute} from 'vue-router';
import store from "@/core/state/store.js";
import {useI18n} from "vue-i18n";

import ClubAvatar from "@/components/fragments/club/ClubAvatar.vue";
import ClubStats from "@/components/fragments/club/ClubStats.vue";
import router from "@/router/index.js";
import ClubWithdraw from "@/components/fragments/club/ClubWithdraw.vue";
import ClubEdit from "@/components/fragments/club/ClubEdit.vue";
import ClubOwnerAvatar from "@/components/fragments/club/ClubOwnerAvatar.vue";


const {t} = useI18n({useScope: 'global'})
const route = useRoute();
const clubId = route.params.id;
const master = computed(() => store.getters['master/getMaster']);

const clubData = ref(null);
const loading = ref(true);  // Флаг загрузки

const isPublic = ref(true);
const isOwner = ref(false);
const isMyClub = ref(false);
const showToolTip = ref(false);

const dialogChangeClub = ref(false);  // Флаг для отображения модального окна

const toggleToolTip = () => {
  showToolTip.value = !showToolTip.value;
};

const loadClub = async () => {
  loading.value = true;  // Устанавливаем флаг загрузки

  isMyClub.value = master.value && master.value.userData.clubId === clubId;
  await store.dispatch('club/loadClubById', clubId);

};

onBeforeMount(loadClub);

watch(route, loadClub);

// Следим за изменением данных пользователя в хранилище и обновляем clubData
watch(
    () => store.getters['club/getClubById'](clubId),
    (newValue) => {
      clubData.value = newValue;
      isOwner.value = master.value && master.value.userData.id === clubData.value.owner;
      isPublic.value = clubData.value.isPublic;
      loading.value = false;  // Сбрасываем флаг загрузки после загрузки данных

    }
);


const btnToMembers = () => {
  router.push({
    path: `/ratings/fighters`,
    query: {
      sortParticipantBy: 'wins',
      clubId: clubId
    }
  });
}


const btnIsPublic = () => {
  isPublic.value = !isPublic.value;

  clubData.value.isPublic = isPublic.value

  store.dispatch('club/updateClubData', clubData.value);
}


const btnToJoin = () => {
  dialogChangeClub.value = true;
}

const confirmExit = () => {
  dialogChangeClub.value = false;

  // TODO Exit
}


// Формирование строки и замена числа на пустую строку
const formattedMembers = computed( () => {
  const translation = t('club.lblClubMembers', clubData.value.members);
  const textWithoutNumber = translation.replace(clubData.value.members, '').trim();
  return `<span style="font-size: 1.5em; margin-right: 5px">${clubData.value.members}</span>${textWithoutNumber}`;
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
  margin: 0 auto;
}

.loader-container {
  height: 75vh;
  align-items: center;
  display: flex;
  justify-content: center;
}

.club-header {
  display: flex;
  align-items: center;
  flex-direction: column;
  color: white;
}

.club-header h2 {
  font-size: 3em;
  margin-top: 10px;
  font-family: 'Anonymous', sans-serif;
  text-align: center;
}

.club-header p {
  font-size: 1em;
  margin: 10px 10px;
  text-align: center;
  color: var(--gray3);
}

.club-avatar-container {
  width: 175px;
  height: 175px;
  border-radius: 50%;
  margin: 0 auto;
  cursor: pointer;
  background-color: var(--black-opacity-80);
  align-items: center;
  display: flex;
  justify-content: center;
}

.club-buttons {
  margin-top: 20px;
  margin-bottom: 40px;
}

.controls h2 {
  font-size: 2em;
  justify-content: center;
  color: white;
  margin: 30px auto 0 auto;
  font-family: 'Anonymous', sans-serif;
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
  background-color: var(--gray1) !important;
}

.custom-icon {
  width: 25px; /* Увеличиваем ширину изображения */
  height: 25px; /* Увеличиваем высоту изображения */
  margin-right: 10px; /* Добавляем отступ справа для расстояния между иконкой и текстом */
}

.switcher {
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 80%;
  margin: 10px auto 10px auto;
  background-color: var(--gray1);
  padding: 0 10px;
  border-radius: 4px;
  max-width: 500px;
  text-transform: uppercase;
}

.switcher p {
  display: flex;
  align-items: center;
  font-size: 1em;
  flex-grow: 1;
}

.club-switcher-public.checked :deep(.v-switch__thumb) {
  background-color: var(--primary-color) !important;
}

</style>
