<template>
  <div class="background background-rating">
    <div class="rating-container" @scroll="handleScroll">
      <div class="rating-content-wrapper">
        <div class="rating-tabs">
          <VBtnDark :class="{'active-tab': activeTab === Tabs.CLUBS} "
                    @click="setActiveTab(Tabs.CLUBS)">
            {{t('rating.clubs')}}
          </VBtnDark>
          <VBtnDark :class="{'active-tab': activeTab === Tabs.FIGHTERS}"
                    @click="setActiveTab(Tabs.FIGHTERS)">
            {{t('rating.fighters')}}
          </VBtnDark>
        </div>

        <div v-if="activeTab === Tabs.CLUBS" class="table-wrapper">
          <div class="table-header">
            <InputField
                v-model="searchClub"
                labelColor="var(--white)"
                inputBgColor="var(--black-opacity-80)"
                inputBorderColor="var(--gray1)"
                inputTextColor="var(--white)"
                padding="0.8rem"
                :placeholder="t('rating.clubPlaceholder')"
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
                bg-color="var(--black-opacity-80)"
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

          <div class="table-body">
            <div class="table-header-row">
              <span class="column-name">{{t('rating.clubName')}}</span>
              <span class="column">
    <img :class="{'active-sort-icon': sortClubBy === 'members'}" src="@/assets/images/icon_members.svg"
         alt="sort icon"/>
  </span>
              <span class="column">
    <img :class="{'active-sort-icon': sortClubBy === 'points'}" src="@/assets/images/icon_wins.svg" alt="sort icon"/>
  </span>

            </div>


            <VInfiniteScroll :items="clubs" :onLoad="loadClubs" class="infinite-scroll">
              <template v-if="clubs.length" v-for="(club, index) in clubs" :key="club.id">
                <div :class="['table-row', index % 2 === 0 ? '' : '']" @click="viewClub(club.id)">
                  <span class="column-name">{{ club.name }}</span>
                  <span class="column">{{ club.members }}</span>
                  <span class="column">{{ club.points }}</span>
                </div>
              </template>
              <template v-else>
                <div class="no-results" v-if="clubsLimitReached">{{t('rating.noResults')}}</div>
              </template>
              <template v-slot:loading>
                <v-progress-circular v-if="!clubsLimitReached" class="loader" size="40" indeterminate/>
              </template>
              <template v-slot:error="{ props }">
                <v-alert type="error">
                  <div class="d-flex justify-space-between align-center">
                    {{t('rating.error')}}
                    <v-btn color="white" size="small" variant="outlined" v-bind="props">{{t('rating.btnRetry')}}</v-btn>
                  </div>
                </v-alert>
              </template>
            </VInfiniteScroll>
          </div>
        </div>

        <div v-if="activeTab === Tabs.FIGHTERS" class="table-wrapper">
          <div class="table-header">
            <InputField
                v-model="searchMember"
                labelColor="var(--white)"
                inputBgColor="var(--black-opacity-80)"
                inputBorderColor="var(--gray1)"
                inputTextColor="var(--white)"
                height="40px"
                :placeholder="t('rating.participantPlaceholder')"
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
                bg-color="var(--black-opacity-80)"
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
              <span class="column-name">{{t('rating.participantName')}}</span>
              <span class="column-name">{{t('rating.club')}}</span>

              <span class="column">
                <img class="icon" :class="{'active-sort-icon': sortParticipantBy === 'fc'}" src="@/assets/images/icon_tokens.svg"
                     alt="sort icon"/>
              </span>
              <span class="column">
                <img class="icon" :class="{'active-sort-icon': sortParticipantBy === 'losses'}" src="@/assets/images/icon_lose.svg"
                     alt="sort icon"/>
              </span>
              <span class="column">
                <img class="icon" :class="{'active-sort-icon': sortParticipantBy === 'luck'}" src="@/assets/images/icon_lucky.svg"
                     alt="sort icon"/>
              </span>
              <span class="column">
                <img class="icon" :class="{'active-sort-icon': sortParticipantBy === 'total'}" src="@/assets/images/icon_fights.svg"
                     alt="sort icon"/>
              </span>

              <span class="column">
                <img class="icon" :class="{'active-sort-icon': sortParticipantBy === 'wins'}" src="@/assets/images/icon_wins.svg"
                     alt="sort icon"/>
              </span>
            </div>

            <VInfiniteScroll :items="participants" :onLoad="loadParticipants" class="infinite-scroll">
              <template v-if="participants.length" v-for="(participant, index) in participants" :key="participant.id">
                <div :class="['table-row', index % 2 === 0 ? '' : '']" @click="viewParticipant(participant.id)">
                  <span class="column-name">{{ participant.name }}</span>
                  <span class="column-name">{{ participant.club }}</span>
                  <span class="column">{{ participant.fc }}</span>
                  <span class="column">{{ participant.losses }}</span>
                  <span class="column">{{ participant.luck }}</span>
                  <span class="column">{{ participant.total }}</span>
                  <span class="column">{{ participant.wins }}</span>
                </div>
              </template>
              <template v-else>
                <div class="no-results" v-if="participantsLimitReached">{{t('rating.noResults')}}</div>
              </template>
              <template v-slot:loading>
                <v-progress-circular v-if="!participantsLimitReached" class="loader" size="40" indeterminate/>
              </template>
              <template v-slot:error="{ props }">
                <v-alert type="error">
                  <div class="d-flex justify-space-between align-center">
                    {{t('rating.error')}}
                    <v-btn color="white" size="small" variant="outlined" v-bind="props"> {{t('rating.btnRetry')}}</v-btn>
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
import {ref, onMounted, watch} from 'vue';
import {useRouter, useRoute} from 'vue-router';
import InputField from "@/components/ui/InputField.vue";
import debounce from "debounce";
import {useI18n} from "vue-i18n";

const {t} = useI18n({useScope: 'global'})

// Enum для вкладок
const Tabs = {
  CLUBS: 'clubs',
  FIGHTERS: 'fighters'
};

const router = useRouter();
const route = useRoute();

const activeTab = ref(route.params.type === Tabs.CLUBS ? Tabs.CLUBS : Tabs.FIGHTERS);

const searchClub = ref(activeTab.value === Tabs.CLUBS ? route.query.searchClub || '' : '');
const searchMember = ref(activeTab.value === Tabs.FIGHTERS ? route.query.searchMember || '' : '');

const sortClubBy = ref(activeTab.value === Tabs.CLUBS ? route.query.sortClubBy || 'points' : 'points');
const sortParticipantBy = ref(activeTab.value === Tabs.FIGHTERS ? route.query.sortParticipantBy || 'wins' : 'wins');

const participantsLimitReached = ref(false);
const clubsLimitReached = ref(false);

const clubSortItems = [
  {name: t('rating.points'), value: 'points'},
  {name: t('rating.members'), value: 'members'}
];

const membersSortedItem = [
  {name: t('rating.wins'), value: 'wins'},
  {name: t('rating.fc'), value: 'fc'},
  {name: t('rating.losses'), value: 'losses'},
  {name: t('rating.total'), value: 'total'},
  {name: t('rating.luck'), value: 'luck'}
];

const clubs = ref([]);
const participants = ref([]);

const clubPage = ref(1);
const participantPage = ref(1);
const pageSize = 10;

const loadClubs = async ({done}) => {
  const newClubs = await fetchClubsFromAPI({
    search: searchClub.value,
    sortBy: sortClubBy.value,
    page: clubPage.value,
    limit: pageSize
  });
  if (newClubs.length === 0) {
    clubsLimitReached.value = true;
  }
  clubs.value.push(...newClubs);
  clubPage.value++;
  done('ok');
};

const loadParticipants = async ({done}) => {
  const newParticipants = await fetchParticipantsFromAPI({
    searchMember: searchMember.value,
    sortBy: sortParticipantBy.value,
    page: participantPage.value,
    limit: pageSize
  });
  if (newParticipants.length === 0) {
    participantsLimitReached.value = true;
  }
  participants.value.push(...newParticipants);
  participantPage.value++;
  done('ok');
};

const fetchClubsFromAPI = async (params) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const totalClubs = 50; // Всего клубов
      const start = (params.page - 1) * params.limit;
      const end = params.page * params.limit;
      const filteredClubs = Array.from({length: totalClubs}, (_, i) => ({
        id: i + 1,
        name: `Клуб ${i + 1}`,
        points: Math.floor(Math.random() * 2000),
        members: Math.floor(Math.random() * 50)
      })).slice(start, end);

      resolve(filteredClubs);
    }, 1000);
  });
};

const fetchParticipantsFromAPI = async (params) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const totalParticipants = 100; // Всего участников
      const start = (params.page - 1) * params.limit;
      const end = params.page * params.limit;
      const filteredParticipants = Array.from({length: totalParticipants}, (_, i) => ({
        id: i + 1,
        name: `Участник ${i + 1}`,
        club: `Клуб ${Math.floor(Math.random() * 10) + 1}`,
        wins: Math.floor(Math.random() * 100),
        fc: Math.floor(Math.random() * 150),
        losses: Math.floor(Math.random() * 50),
        total: Math.floor(Math.random() * 200),
        luck: Math.floor(Math.random() * 100)
      })).slice(start, end);

      resolve(filteredParticipants);
    }, 1000);
  });
};


const setActiveTab = (tab) => {
  activeTab.value = tab;
  router.replace({path: `/ratings/${tab}`, query: updateQueryParams()});
};


const viewClub = (clubId) => {
  console.log(`Просмотр клуба с ID: ${clubId}`);
};

const viewParticipant = (participantId) => {
  console.log(`Просмотр участника с ID: ${participantId}`);
};

const debouncedLoadClubs = debounce(() => {
  clubs.value = [];
  clubsLimitReached.value = false;
  clubPage.value = 1;
  loadClubs({
    done: () => {
    }
  });
  router.replace({query: updateQueryParams()});
}, 500);

const debouncedLoadParticipants = debounce(() => {
  participants.value = [];
  participantsLimitReached.value = false;
  participantPage.value = 1;
  loadParticipants({
    done: () => {
    }
  });
  router.replace({query: updateQueryParams()});
}, 500);

const handleClubSearchInput = () => {
  debouncedLoadClubs();
};

const handleMemberSearchInput = () => {
  debouncedLoadParticipants();
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

const updateQueryParams = () => {
  const queryParams = {};
  if (activeTab.value === Tabs.CLUBS) {
    queryParams.searchClub = searchClub.value;
    queryParams.sortClubBy = sortClubBy.value || 'points';
  } else {
    queryParams.searchMember = searchMember.value;
    queryParams.sortParticipantBy = sortParticipantBy.value || 'wins';
  }

  return queryParams;
};

const emit = defineEmits(['scroll']);

const handleScroll = (event) => {
  emit('scroll', event.target.scrollTop);
};

onMounted(() => {
  loadClubs({
    done: () => {
    }
  });
  loadParticipants({
    done: () => {
    }
  });
});
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
  background: linear-gradient(to left top, black 25%, transparent 75%);
  z-index: 1;
}

.background-rating::after {
  content: "";
  position: fixed;
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
  margin-top: 13vh;
}

.rating-tabs {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.rating-tabs .active-tab {
  background-color: var(--primary-color) !important;
  color: white;
}

.rating-tabs button {
  flex: 1;
  padding: 10px 20px;
  margin: 0 10px;
  cursor: pointer;
  color: var(--gray2);
  height: 40px;
  white-space: normal;

}

.rating-tabs :deep(button .v-btn__content) {
  white-space: pre-wrap !important;
  font-size: 0.7rem;
}

.custom-select {
  color: var(--gray3) !important;
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
  background-color: var(--black-opacity-80) !important;
  border: 1px solid var(--gray1) !important;
  margin-bottom: 20px;
}

.table-header-row {
  color: white;
  margin-top: 5px;
  font-size: 0.9em;
  padding: 5px 10px 0 10px;

  display: flex;
  justify-content: space-between;
  align-items: center;

  box-sizing: border-box;
}

.column-name {
  flex: 3;
  text-align: left;
}

.column {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gray3) !important;
}

.table-row {
  padding: 7px 10px;
  color: white;
  cursor: pointer;
  font-size: 0.8em;
  display: flex;
  justify-content: space-between;
  align-items: center;

  box-sizing: border-box;
}

.table-row:hover {
  background-color: var(--black-opacity) !important;
}

.infinite-scroll {
  overflow: hidden !important;
}

.no-results {
  text-align: center;
  padding: 20px;
  color: var(--gray3);
}

.icon{
  width: 25px;
  height: 25px;
  padding: 5px;
  object-fit: contain;
}
.active-sort-icon {
  background-color: var(--primary-color) !important;
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

:deep(.v-select__selection-text){
  font-size: 0.8rem;
}
</style>
