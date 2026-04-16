<template>
  <div class="background background-rating">
    <div class="rating-container" @scroll="handleScroll">
      <div class="rating-content-wrapper">
        <div class="rating-tabs">
          <VBtnDark :class="{'active-tab': activeTab === Tabs.MY_CLAN}"
                    @click="setActiveTab(Tabs.MY_CLAN)">
            {{ t.rating.lblMyClan }}
          </VBtnDark>
          <VBtnDark :class="{'active-tab': activeTab === Tabs.CLANS}"
                    @click="setActiveTab(Tabs.CLANS)">
            {{ t.rating.lblClans }}
          </VBtnDark>
          <VBtnDark :class="{'active-tab': activeTab === Tabs.FIGHTERS}"
                    @click="setActiveTab(Tabs.FIGHTERS)">
            {{ t.rating.lblFighters }}
          </VBtnDark>
        </div>

        <div v-if="activeTab === Tabs.MY_CLAN" class="table-wrapper">
          <MyClanTab :active="activeTab === Tabs.MY_CLAN" @switchTab="setActiveTab" />
        </div>

        <div v-if="activeTab === Tabs.CLANS" class="table-wrapper">
          <div class="table-header">
            <InputField
                v-model="searchClan"
                labelColor="var(--hex-text-primary)"
                inputBgColor="var(--hex-bg-card)"
                inputBorderColor="var(--hex-border-default)"
                inputTextColor="var(--hex-text-primary)"
                padding="0.8rem"
                :placeholder="t.rating.clanPlaceholder"
                class="search-input"
                @input="handleClanSearchInput"
            />

            <v-select
                v-model="sortClanBy"
                :items="clanSortItems"
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

          <div v-if="canCreateClan" class="create-clan-row">
            <HexButton variant="primary" size="sm" @click="dialogCreateClan = true">
              {{ t.profile.buttons.lblCreateClan }}
            </HexButton>
            <CreateClan :dialogCreate="dialogCreateClan" @close="dialogCreateClan = false" />
          </div>

          <div class="table-body">
            <div class="table-header-row">
              <span class="column">№</span>
              <span class="column-name">{{ t.rating.clanName }}</span>
              <span class="column">
                <img :class="{'active-sort-icon': sortClanBy === 'members'}" src="@/assets/images/icon_members.svg"
                     alt="sort icon"/>
              </span>
              <span class="column">
                <img :class="{'active-sort-icon': sortClanBy === 'battles'}" src="@/assets/images/icon_fights.svg"
                     alt="sort icon"/>
              </span>
              <span class="column">
                <img :class="{'active-sort-icon': sortClanBy === 'wins'}" src="@/assets/images/icon_wins.svg"
                     alt="sort icon"/>
              </span>
            </div>

            <VInfiniteScroll :items="clans" :onLoad="loadClans" class="infinite-scroll">
              <template v-if="clans.length" v-for="(clan, index) in clans" :key="clan.id">
                <div :class="['table-row', index % 2 === 0 ? '' : '']" @click="viewClan(clan.id)">
                  <span class="column">{{ index + 1 }}</span>
                  <span class="column-name">{{ clan.name }}</span>
                  <span class="column">{{ clan.members }}</span>
                  <span class="column">{{ formatNumber(clan.battles) }}</span>
                  <span class="column">{{ formatNumber(clan.wins) }}</span>
                </div>
              </template>
              <template v-else>
                <div class="no-results" v-if="clansLimitReached">{{ t.rating.noResults }}</div>
              </template>
              <template v-slot:loading>
                <v-progress-circular v-if="!clansLimitReached" class="loader" size="40" indeterminate/>
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
<!--              <span class="column-name">{{ t.rating.clan }}</span>-->

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
import CreateClan from "@/components/fragments/clan/CreateClan.vue";
import MyClanTab from "@/components/fragments/clan/MyClanTab.vue";
import PvPStatsCard from "@/components/fragments/profile/PvPStatsCard.vue";


// Enum для вкладок
const Tabs = {
  MY_CLAN: 'myclan',
  CLANS: 'clans',
  FIGHTERS: 'fighters',
};

const router = useRouter();
const route = useRoute();

const getInitialTab = () => {
  const type = route.params.type;
  if (type === Tabs.CLANS) return Tabs.CLANS;
  if (type === Tabs.FIGHTERS) return Tabs.FIGHTERS;
  return Tabs.MY_CLAN;
};
const activeTab = ref(getInitialTab());

const searchClan = ref(activeTab.value === Tabs.CLANS ? route.query.searchClan || '' : '');
const sortClanBy = ref(activeTab.value === Tabs.CLANS ? route.query.sortClanBy || 'battles' : 'battles');

const searchMember = ref(activeTab.value === Tabs.FIGHTERS ? route.query.searchMember || '' : '');

const sortParticipantBy = ref(activeTab.value === Tabs.FIGHTERS ? route.query.sortParticipantBy || 'wins' : 'wins');
const clansLimitReached = computed(() => store.getters['clan/isLimitReached']);
const participantLimitReached = computed(() => store.getters['user/isLimitReached']);

const clanId = ref(route.query.clanId);

const master = computed(() => store.getters['master/getMaster']);
const canCreateClan = computed(() => !master.value?.userData?.clanId);
const dialogCreateClan = ref(false);

const clanSortItems = computed(() => [
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

const clans = computed(() => store.getters['clan/getClanRatingsList']);
const participants = computed(() => store.getters['user/getParticipantRatingsList']);


const clanPage = ref(0);
const fighterPage = ref(0);

let doneClans = null;
let doneParticipants = null;

const loadClans = async (options = {}) => {
  const {done} = options;

  if (done) {
    doneClans = done;
  }

  if (clansLimitReached.value) {

    if (doneClans) {
      doneClans('empty');
    }
    return;
  }

  await store.dispatch('clan/loadClanRatings', {
    search: searchClan.value,
    sortBy: sortClanBy.value,
    page: clanPage.value
  });

  clanPage.value = clanPage.value + 1;

  if (doneClans) {
    doneClans('ok');
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
    page: fighterPage.value,
    clanId: clanId.value
  });

  fighterPage.value = fighterPage.value + 1;

  if (doneParticipants) {
    doneParticipants('ok');
  }
};

const setActiveTab = (tab) => {
  activeTab.value = tab;

  const { query, path } = router.currentRoute.value;
  delete query.clanId; // Удаляем clanId из query
  router.replace({ path, query });
  clanId.value = null;

  updateQueryParams();
};

const viewClan = (clanId) => {
  if (clanId) {
    router.push({path: `/clan/${clanId}`});
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

const debouncedLoadClans = debounce(() => {
  updateQueryParams();
}, 500);

const debouncedLoadParticipants = debounce(() => {
  updateQueryParams();
}, 500);

const handleClanSearchInput = () => {
  debouncedLoadClans();
};

const handleMemberSearchInput = () => {
  debouncedLoadParticipants();
};

const emit = defineEmits(['scroll']);

const handleScroll = (event) => {
  emit('scroll', event.target.scrollTop);
};

watch([searchClan, sortClanBy], () => {
  if (activeTab.value === Tabs.CLANS) {
    debouncedLoadClans();
  }
});

watch([searchMember, sortParticipantBy], () => {
  if (activeTab.value === Tabs.FIGHTERS) {
    debouncedLoadParticipants();
  }
});

watch(route, async (newRoute) => {
  if (newRoute.params.type === Tabs.CLANS) {
    clanPage.value = 0;
    store.commit('clan/resetClanRatings');
    searchClan.value = newRoute.query.searchClan || '';
    sortClanBy.value = newRoute.query.sortClanBy || 'wins';

    if (doneClans) {
      doneClans('ok');
    }

  } else if (newRoute.params.type === Tabs.FIGHTERS) {
    fighterPage.value = 0;
    store.commit('user/resetParticipantRatings');

    searchMember.value = newRoute.query.searchMember || '';
    sortParticipantBy.value = newRoute.query.sortParticipantBy || 'wins';
    clanId.value = newRoute.query.clanId || null;

    if(doneParticipants){
      doneParticipants('ok')
    }
  }
});

const updateQueryParams = () => {
  const queryParams = {};
  if (activeTab.value === Tabs.CLANS) {
    queryParams.searchClan = searchClan.value;
    queryParams.sortClanBy = sortClanBy.value || 'wins';
  } else {
    queryParams.searchMember = searchMember.value;
    queryParams.sortParticipantBy = sortParticipantBy.value || 'wins';
    queryParams.clanId = clanId.value || null;
  }

  router.replace({path: `/ratings/${activeTab.value}`, query: queryParams});
};


onMounted(() => {
  store.commit('clan/resetClanRatings');
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
  color: var(--hex-text-primary) !important;
  border-bottom: 2px solid var(--hex-text-primary);
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
  background-color: var(--hex-bg-light) !important;
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

.create-clan-row {
  display: flex;
  justify-content: center;
  margin: 10px 0;
}

.fighters-pvp-card {
  background: var(--hex-bg-light) !important;
  border: 1px solid var(--hex-border-default) !important;
  border-radius: 12px !important;
  padding: 16px !important;
  margin-bottom: 16px;
}

:deep(.v-select__selection-text) {
  font-size: 0.8rem;
}

@media (min-width: 1024px) {
  .rating-content-wrapper {
    max-width: 1024px;
  }
}
</style>
