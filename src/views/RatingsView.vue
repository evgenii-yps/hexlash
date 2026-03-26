<template>
  <div class="background background-rating">
    <div class="rating-container" @scroll="handleScroll">
      <div class="rating-content-wrapper">
        <div class="rating-tabs">
          <VBtnDark :class="{'active-tab': activeTab === Tabs.MY_CLUB}"
                    @click="setActiveTab(Tabs.MY_CLUB)">
            {{ t.rating.lblMyClub }}
          </VBtnDark>
          <VBtnDark :class="{'active-tab': activeTab === Tabs.CLUBS}"
                    @click="setActiveTab(Tabs.CLUBS)">
            {{ t.rating.lblClubs }}
          </VBtnDark>
          <VBtnDark :class="{'active-tab': activeTab === Tabs.FIGHTERS}"
                    @click="setActiveTab(Tabs.FIGHTERS)">
            {{ t.rating.lblFighters }}
          </VBtnDark>
        </div>

        <div v-if="activeTab === Tabs.MY_CLUB" class="table-wrapper">
          <MyClubTab :active="activeTab === Tabs.MY_CLUB" @switchTab="setActiveTab" />
        </div>

        <div v-if="activeTab === Tabs.CLUBS" class="table-wrapper">
          <div class="table-header">
            <InputField
                v-model="searchClub"
                labelColor="var(--hex-text-primary)"
                inputBgColor="var(--hex-bg-card)"
                inputBorderColor="var(--hex-border-default)"
                inputTextColor="var(--hex-text-primary)"
                padding="0.8rem"
                :placeholder="t.rating.clubPlaceholder"
                class="search-input"
                @input="handleClubSearchInput"
            />

            <v-select
                v-model="sortClubBy"
                :items="clubSortItems"
                item-title="name"
                variant="outlined"
                :menu-icon="null"
                density="compact"
                bg-color="var(--hex-bg-card)"
                class="custom-select"
                style="max-width: 250px; width: 70%"
                :hideNoData="true">
              <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props"></v-list-item>
              </template>
              <template v-slot:append-inner>
                <img src="@/assets/images/icon_arrow_down.svg" alt="custom arrow" class="custom-arrow"/>
              </template>
            </v-select>
          </div>

          <div v-if="canCreateClub" class="create-club-row">
            <HexButton variant="primary" size="sm" @click="dialogCreateClub = true">
              {{ t.profile.buttons.lblCreateClub }}
            </HexButton>
            <CreateClub :dialogCreate="dialogCreateClub" @close="dialogCreateClub = false" />
          </div>

          <div class="table-body">
            <div class="table-header-row">
              <span class="column">№</span>
              <span class="column-name">{{ t.rating.clubName }}</span>
              <span class="column">
                <img :class="{'active-sort-icon': sortClubBy === 'members'}" src="@/assets/images/icon_members.svg"
                     alt="sort icon"/>
              </span>
              <span class="column">
                <img :class="{'active-sort-icon': sortClubBy === 'battles'}" src="@/assets/images/icon_fights.svg"
                     alt="sort icon"/>
              </span>
              <span class="column">
                <img :class="{'active-sort-icon': sortClubBy === 'wins'}" src="@/assets/images/icon_wins.svg"
                     alt="sort icon"/>
              </span>
            </div>

            <VInfiniteScroll :items="clubs" :onLoad="loadClubs" class="infinite-scroll">
              <template v-if="clubs.length" v-for="(club, index) in clubs" :key="club.id">
                <div :class="['table-row', index % 2 === 0 ? '' : '']" @click="viewClub(club.id)">
                  <span class="column">{{ index + 1 }}</span>
                  <span class="column-name">{{ club.name }}</span>
                  <span class="column">{{ club.members }}</span>
                  <span class="column">{{ formatNumber(club.battles) }}</span>
                  <span class="column">{{ formatNumber(club.wins) }}</span>
                </div>
              </template>
              <template v-else>
                <div class="no-results" v-if="clubsLimitReached">{{ t.rating.noResults }}</div>
              </template>
              <template v-slot:loading>
                <v-progress-circular v-if="!clubsLimitReached" class="loader" size="40" indeterminate/>
              </template>
              <template v-slot:error="{ props }">
                <v-alert type="error">
                  <div class="d-flex justify-space-between align-center">
                    {{ t.rating.error }}
                    <v-btn color="white" size="small" variant="outlined" v-bind="props">{{ t.rating.btnRetry }}
                    </v-btn>
                  </div>
                </v-alert>
              </template>
            </VInfiniteScroll>
          </div>
        </div>

        <div v-if="activeTab === Tabs.FIGHTERS" class="table-wrapper">
          <PvPStatsCard
            :sectionTitle="t.pvp.statsTitle"
            :winsText="t.pvp.wins"
            :lossesText="t.pvp.losses"
            :winRateText="t.pvp.winRate"
            :totalFightsText="t.pvp.totalFights"
            :nextLeagueText="t.pvp.nextLeague"
            class="fighters-pvp-card"
          />

          <div class="table-header">
            <InputField
                v-model="searchMember"
                labelColor="var(--hex-text-primary)"
                inputBgColor="var(--hex-bg-card)"
                inputBorderColor="var(--hex-border-default)"
                inputTextColor="var(--hex-text-primary)"
                height="40px"
                :placeholder="t.rating.participantPlaceholder"
                class="search-input"
                @input="handleMemberSearchInput"
            />

            <v-select
                v-model="sortParticipantBy"
                :items="membersSortedItem"
                item-title="name"
                variant="outlined"
                :menu-icon="null"
                density="compact"
                bg-color="var(--hex-bg-card)"
                class="custom-select"
                style="max-width: 250px; width: 70%"
                :hideNoData="true"
            >
              <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props"></v-list-item>
              </template>
              <template v-slot:append-inner>
                <img src="@/assets/images/icon_arrow_down.svg" alt="custom arrow" class="custom-arrow"/>
              </template>
            </v-select>
          </div>

          <div class="table-body">
            <div class="table-header-row">
              <span class="column-name">{{ t.rating.participantName }}</span>
<!--              <span class="column-name">{{ t.rating.club }}</span>-->

              <span class="column">
                <img class="icon" :class="{'active-sort-icon': sortParticipantBy === 'fc'}"
                     src="@/assets/images/icon_tokens.svg"
                     alt="sort icon"/>
              </span>
              <span class="column">
                <img class="icon" :class="{'active-sort-icon': sortParticipantBy === 'losses'}"
                     src="@/assets/images/icon_lose.svg"
                     alt="sort icon"/>
              </span>
              <span class="column">
                <img class="icon" :class="{'active-sort-icon': sortParticipantBy === 'luck'}"
                     src="@/assets/images/icon_lucky.svg"
                     alt="sort icon"/>
              </span>
              <span class="column">
                <img class="icon" :class="{'active-sort-icon': sortParticipantBy === 'battles'}"
                     src="@/assets/images/icon_fights.svg"
                     alt="sort icon"/>
              </span>

              <span class="column">
                <img class="icon" :class="{'active-sort-icon': sortParticipantBy === 'wins'}"
                     src="@/assets/images/icon_wins.svg"
                     alt="sort icon"/>
              </span>
            </div>

            <VInfiniteScroll :items="participants" :onLoad="loadParticipants" class="infinite-scroll">
              <template v-if="participants.length" v-for="(participant, index) in participants" :key="participant.id">
                <div :class="['table-row', index % 2 === 0 ? '' : '']" @click="viewParticipant(participant.login)">
                  <span class="column-name">{{ participant.name || t.profile.anonymous }}</span>
<!--                  <span class="column-name">{{ participant.club }}</span>-->
                  <span class="column">{{ formatNumber(participant.wonTokens) }}</span>
                  <span class="column">{{ formatNumber(participant.losses) }}</span>
                  <span class="column">{{ participant.totalFights < 10 ? "-" : participant.luckPercentage + "%" }}</span>
                  <span class="column">{{ formatNumber(participant.totalFights) }}</span>
                  <span class="column">{{ formatNumber(participant.wins) }}</span>
                </div>
              </template>
              <template v-else>
                <div class="no-results" v-if="participantLimitReached">{{ t.rating.noResults }}</div>
              </template>
              <template v-slot:loading>
                <v-progress-circular v-if="!participantLimitReached" class="loader" size="40" indeterminate/>
              </template>
              <template v-slot:error="{ props }">
                <v-alert type="error">
                  <div class="d-flex justify-space-between align-center">
                    {{ t.rating.error }}
                    <v-btn color="white" size="small" variant="outlined" v-bind="props"> {{ t.rating.btnRetry }}
                    </v-btn>
                  </div>
                </v-alert>
              </template>
            </VInfiniteScroll>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>
<script setup>
import {ref, onMounted, watch, computed, onUnmounted} from 'vue';
import {useRouter, useRoute} from 'vue-router';
import InputField from "@/components/ui/InputField.vue";
import debounce from "debounce";
import {t} from "@/locales/index.js";
import store from "@/core/state/store.js";
import {formatNumber} from "@/core/constants.js";
import * as amplitude from "@amplitude/analytics-browser";
import HexButton from "@/components/ui/HexButton.vue";
import CreateClub from "@/components/fragments/club/CreateClub.vue";
import MyClubTab from "@/components/fragments/club/MyClubTab.vue";
import PvPStatsCard from "@/components/fragments/profile/PvPStatsCard.vue";


// Enum для вкладок
const Tabs = {
  MY_CLUB: 'myclub',
  CLUBS: 'clubs',
  FIGHTERS: 'fighters'
};

const router = useRouter();
const route = useRoute();

const getInitialTab = () => {
  const type = route.params.type;
  if (type === Tabs.CLUBS) return Tabs.CLUBS;
  if (type === Tabs.FIGHTERS) return Tabs.FIGHTERS;
  return Tabs.MY_CLUB;
};
const activeTab = ref(getInitialTab());

const searchClub = ref(activeTab.value === Tabs.CLUBS ? route.query.searchClub || '' : '');
const sortClubBy = ref(activeTab.value === Tabs.CLUBS ? route.query.sortClubBy || 'battles' : 'battles');

const searchMember = ref(activeTab.value === Tabs.FIGHTERS ? route.query.searchMember || '' : '');

const sortParticipantBy = ref(activeTab.value === Tabs.FIGHTERS ? route.query.sortParticipantBy || 'wins' : 'wins');
const clubsLimitReached = computed(() => store.getters['club/isLimitReached']);
const participantLimitReached = computed(() => store.getters['user/isLimitReached']);

const clubId = ref(route.query.clubId);

const master = computed(() => store.getters['master/getMaster']);
const canCreateClub = computed(() => !master.value?.userData?.clubId);
const dialogCreateClub = ref(false);

const clubSortItems = computed(() => [
  {name: t.value.rating.total, value: 'battles'},
  {name: t.value.rating.members, value: 'members'},
  {name: t.value.rating.wins, value: 'wins'}
]);

const membersSortedItem = computed(() => [
  {name: t.value.rating.wins, value: 'wins'},
  {name: t.value.rating.fc, value: 'fc'},
  {name: t.value.rating.losses, value: 'losses'},
  {name: t.value.rating.total, value: 'battles'},
  {name: t.value.rating.luck, value: 'luck'}
]);

const clubs = computed(() => store.getters['club/getClubRatingsList']);
const participants = computed(() => store.getters['user/getParticipantRatingsList']);


const page = ref(0);

let doneClubs = null;
let doneParticipants = null;

const loadClubs = async (options = {}) => {
  const {done} = options;

  if (done) {
    doneClubs = done;
  }

  if (clubsLimitReached.value) {

    if (doneClubs) {
      doneClubs('empty');
    }
    return;
  }

  await store.dispatch('club/loadClubRatings', {
    search: searchClub.value,
    sortBy: sortClubBy.value,
    page: page.value
  });

  page.value = page.value + 1;

  if (doneClubs) {
    doneClubs('ok');
  }

};

const loadParticipants = async (options = {}) => {
  const {done} = options;

  if (done) {
    doneParticipants = done;
  }

  if (participantLimitReached.value) {

    if (doneParticipants) {
      doneParticipants('empty');
    }
    return;
  }

  await store.dispatch('user/loadParticipantRatings', {
    search: searchMember.value,
    sortBy: sortParticipantBy.value,
    page: page.value,
    clubId: clubId.value
  });

  page.value = page.value + 1;

  if (doneParticipants) {
    doneParticipants('ok');
  }
};

const setActiveTab = (tab) => {
  activeTab.value = tab;

  const { query, path } = router.currentRoute.value;
  delete query.clubId; // Удаляем clubId из query
  router.replace({ path, query });
  clubId.value = null;

  updateQueryParams();
};

const viewClub = (clubId) => {
  if (clubId) {
    router.push({path: `/club/${clubId}`});
  }
};

const viewParticipant = (participantLogin) => {
  if (participantLogin) {
    if(store.getters['master/getMaster'].getLogin() === participantLogin){
      router.push({path: `/profile`});
    }else{
      router.push({path: `/user/${participantLogin}`});
    }
  }
};

const debouncedLoadClubs = debounce(() => {
  updateQueryParams();
}, 500);

const debouncedLoadParticipants = debounce(() => {
  updateQueryParams();
}, 500);

const handleClubSearchInput = () => {
  debouncedLoadClubs();
};

const handleMemberSearchInput = () => {
  debouncedLoadParticipants();
};

const emit = defineEmits(['scroll']);

const handleScroll = (event) => {
  emit('scroll', event.target.scrollTop);
};

watch([searchClub, sortClubBy], () => {
  if (activeTab.value === Tabs.CLUBS) {
    debouncedLoadClubs();
  }
});

watch([searchMember, sortParticipantBy], () => {
  if (activeTab.value === Tabs.FIGHTERS) {
    debouncedLoadParticipants();
  }
});

watch(route, async (newRoute) => {
  // Сброс параметров
  page.value = 0;

  if (newRoute.params.type === Tabs.CLUBS) {
    store.commit('club/resetClubRatings');
    searchClub.value = newRoute.query.searchClub || '';
    sortClubBy.value = newRoute.query.sortClubBy || 'wins';

    if (doneClubs) {
      doneClubs('ok');
    }

  } else if (newRoute.params.type === Tabs.FIGHTERS) {
    store.commit('user/resetParticipantRatings');

    searchMember.value = newRoute.query.searchMember || '';
    sortParticipantBy.value = newRoute.query.sortParticipantBy || 'wins';
    clubId.value = newRoute.query.clubId || null;

    if(doneParticipants){
      doneParticipants('ok')
    }
  }
});

const updateQueryParams = () => {
  const queryParams = {};
  if (activeTab.value === Tabs.CLUBS) {
    queryParams.searchClub = searchClub.value;
    queryParams.sortClubBy = sortClubBy.value || 'wins';
  } else {
    queryParams.searchMember = searchMember.value;
    queryParams.sortParticipantBy = sortParticipantBy.value || 'wins';
    queryParams.clubId = clubId.value || null;
  }

  router.replace({path: `/ratings/${activeTab.value}`, query: queryParams});
};


onMounted(() => {
  store.commit('club/resetClubRatings');
  store.commit('user/resetParticipantRatings');

  // Amplitude
  amplitude.track('OpenRatingsView');

})

</script>


<style scoped>
.background-rating {
  background: url('@/assets/images/background_rating.webp') no-repeat 35% center;
}

.background-rating::before {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(to left top, var(--hex-bg-dark) 25%, transparent 75%);
  z-index: 1;
}

.background-rating::after {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: var(--hex-bg-dark);
  z-index: 2;
  opacity: 1;
  animation: fadeOut 1s forwards;
}

@keyframes fadeOut {
  to {
    opacity: 0;
  }
}

.rating-container {
  position: relative;
  z-index: 10;
  overflow-y: auto;
  height: 100vh;
  display: flex;
  flex-direction: column;
  -webkit-overflow-scrolling: auto; /* Отключить резиновый скролл*/
  overscroll-behavior-y: none;
}

@supports (height: 100dvh) {
  .rating-container {
    height: 100dvh;
  }
}

.rating-content-wrapper {
  width: 100%;
  padding: 0;
  max-width: 700px;
  justify-content: center;
  margin: 13vh auto 0;
}

.rating-tabs {
  display: flex;
  border-bottom: 1px solid var(--hex-border-default);
  margin-bottom: 10px;
  padding: 0 10px;
}

.rating-tabs .active-tab {
  color: var(--hex-primary) !important;
  border-bottom: 2px solid var(--hex-primary);
  font-weight: 600;
}

.rating-tabs button {
  flex: 1;
  padding: 10px 0;
  margin: 0;
  cursor: pointer;
  color: var(--hex-text-secondary);
  background: transparent !important;
  border: none;
  border-bottom: 2px solid transparent;
  border-radius: 0 !important;
  height: auto;
  white-space: normal;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.5px;
  transition: color 0.2s ease;
}

.rating-tabs button:hover {
  color: var(--hex-text-primary);
}

.rating-tabs :deep(button .v-btn__content) {
  white-space: pre-wrap !important;
  font-size: 13px;
}

.custom-select {
  color: var(--hex-text-muted) !important;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-wrapper {
  flex-grow: 1;
  overflow-y: auto;
  margin: 20px 10px 0 10px;
}

.table-body {
  margin-top: 10px;
  background-color: var(--hex-bg-card) !important;
  border: 1px solid var(--hex-border-default) !important;
  margin-bottom: 20px;
}

.table-header-row {
  color: var(--hex-text-primary);
  margin-top: 5px;
  font-size: 0.9em;
  padding: 5px 10px 0 10px;

  display: flex;
  justify-content: space-between;
  align-items: center;

  box-sizing: border-box;
}

.column-name {
  flex: 5;
  text-align: left;
}

.column {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--hex-text-muted) !important;
}

.table-row {
  padding: 7px 10px;
  color: var(--hex-text-primary);
  cursor: pointer;
  font-size: 0.8em;
  display: flex;
  justify-content: space-between;
  align-items: center;

  box-sizing: border-box;
}

.table-row:hover {
  background-color: color-mix(in srgb, var(--hex-bg-dark) 36%, transparent) !important;
}

.infinite-scroll {
  overflow: hidden !important;
}

.no-results {
  text-align: center;
  padding: 20px;
  color: var(--hex-text-muted);
}

.icon {
  width: 25px;
  height: 25px;
  padding: 5px;
  object-fit: contain;
}

.active-sort-icon {
  background-color: var(--hex-primary) !important;
  border-radius: 50%;
  padding: 4px;
  object-fit: contain;
  width: 25px;
  height: 25px;
}


.search-input {
  max-width: 300px;
  margin-bottom: 0 !important;
  display: block;
  margin-right: 10px;
  width: 100%;
}

.create-club-row {
  display: flex;
  justify-content: center;
  margin: 10px 0;
}

.fighters-pvp-card {
  background: var(--hex-bg-light) !important;
  border: 1px solid color-mix(in srgb, var(--hex-primary) 20%, transparent) !important;
  border-radius: 12px !important;
  padding: 16px !important;
  margin-bottom: 16px;
}

:deep(.v-select__selection-text) {
  font-size: 0.8rem;
}
</style>
