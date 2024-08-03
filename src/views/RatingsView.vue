<template>
  <div class="background background-rating">
    <div class="rating-container">
      <div class="rating-content-wrapper">
        <div class="rating-tabs">
          <button :class="{'active-tab': isClubRating}" @click="showClubRating">Рейтинг клубов</button>
          <button :class="{'active-tab': !isClubRating}" @click="showParticipantRating">Рейтинг участников</button>
          <button class="create-club-button" @click="openCreateClubModal">Создать клуб</button>
        </div>

        <div v-if="isClubRating" class="rating-table-wrapper">
          <div class="rating-header">
            <input type="text" v-model="searchClub" placeholder="Поиск клуба" class="search-input"/>
            <select v-model="sortClubBy">
              <option value="points">Очки побед</option>
              <option value="members">Количество участников</option>
            </select>
          </div>
          <VInfiniteScroll :items="clubs" :onLoad="loadClubs" class="infinity-scroll">
            <template v-for="(club, index) in clubs" :key="club.id">
              <div :class="['rating-row', index % 2 === 0 ? 'bg-grey-lighten-2' : '']" @click="viewClub(club.id)">
                <span>{{ club.name }}</span>
                <span>{{ club.points }}</span>
                <span>{{ club.members }}</span>
              </div>
            </template>
            <template v-slot:loading>
              <CircularLoader style="scale: 0.3"
                              :size="5"
                              :speed="2"
                              :opacity="80"
              />
            </template>
            <template v-slot:error="{ props }">
              <v-alert type="error">
                <div class="d-flex justify-space-between align-center">
                  Something went wrong...
                  <v-btn
                      color="white"
                      size="small"
                      variant="outlined"
                      v-bind="props"
                  >
                    Retry
                  </v-btn>
                </div>
              </v-alert>
            </template>
          </VInfiniteScroll>
        </div>

        <div v-else class="rating-table-wrapper">
          <div class="rating-header">
            <select v-model="filterByClub">
              <option value="">Все клубы</option>
              <option v-for="club in allClubs" :key="club.id" :value="club.id">{{ club.name }}</option>
            </select>
            <select v-model="sortParticipantBy">
              <option value="wins">Выигранные бои</option>
              <option value="fc">Количество FC</option>
              <option value="losses">Проигранные бои</option>
              <option value="total">Общее количество боев</option>
              <option value="luck">Процент удачи</option>
            </select>
          </div>
          <VInfiniteScroll :items="participants" :onLoad="loadParticipants" class="infinity-scroll">
            <template v-for="(participant, index) in participants" :key="participant.id">
              <div :class="['rating-row', index % 2 === 0 ? 'bg-grey-lighten-2' : '']" @click="viewParticipant(participant.id)">
                <span>{{ participant.name }}</span>
                <span>{{ participant.club }}</span>
                <span>{{ participant.wins }}</span>
                <span>{{ participant.fc }}</span>
                <span>{{ participant.losses }}</span>
                <span>{{ participant.total }}</span>
                <span>{{ participant.luck }}</span>
              </div>
            </template>
          </VInfiniteScroll>
        </div>
      </div>
    </div>

    <CreateClubModal v-model="isCreateClubModalOpen" @close="isCreateClubModalOpen = false" />
  </div>
</template>


<script setup>
import { ref, onMounted, watch } from 'vue';
import CreateClubModal from "@/components/fragments/ratings/CreateClubModal.vue";
import CircularLoader from "@/components/ui/CircularLoader.vue";

const isClubRating = ref(true);
const searchClub = ref('');
const sortClubBy = ref('points');
const filterByClub = ref('');
const sortParticipantBy = ref('wins');
const isCreateClubModalOpen = ref(false);

const clubs = ref([]);
const participants = ref([]);

const loadClubs = async ({ done }) => {
  const newClubs = await fetchClubsFromAPI({
    search: searchClub.value,
    sortBy: sortClubBy.value
  });
  done('ok');
  clubs.value.push(...newClubs);
};

const loadParticipants = async ({ done }) => {
  const newParticipants = await fetchParticipantsFromAPI({
    filterByClub: filterByClub.value,
    sortBy: sortParticipantBy.value
  });
  participants.value.push(...newParticipants);
  done('ok');
};

const fetchClubsFromAPI = async (params) => {
  return new Promise(resolve => {
    setTimeout(() => {
      const newClubs = Array.from({ length: 10 }, (_, i) => ({
        id: clubs.value.length + i + 1,
        name: `Новый клуб ${clubs.value.length + i + 1}`,
        points: Math.floor(Math.random() * 2000),
        members: Math.floor(Math.random() * 50),
      }));
      resolve(newClubs);
    }, 1000);
  });
};

const fetchParticipantsFromAPI = async (params) => {
  // Здесь должен быть ваш API вызов для получения данных участников
  return new Promise(resolve => {
    setTimeout(() => {
      const newParticipants = Array.from({ length: 10 }, (_, i) => ({
        id: participants.value.length + i + 1,
        name: `Новый участник ${participants.value.length + i + 1}`,
        club: 'Клуб 1',
        wins: Math.floor(Math.random() * 100),
        fc: Math.floor(Math.random() * 150),
        losses: Math.floor(Math.random() * 50),
        total: Math.floor(Math.random() * 200),
        luck: Math.floor(Math.random() * 100),
      }));
      resolve(newParticipants);
    }, 1000);
  });
};

const showClubRating = () => {
  isClubRating.value = true;
};

const showParticipantRating = () => {
  isClubRating.value = false;
};

function openCreateClubModal() {
  isCreateClubModalOpen.value = true;
}

const viewClub = (clubId) => {
  console.log(`Просмотр клуба с ID: ${clubId}`);
};

const viewParticipant = (participantId) => {
  console.log(`Просмотр участника с ID: ${participantId}`);
};

// Watchers to reload data when filters change
watch([searchClub, sortClubBy], () => {
  clubs.value = [];
  loadClubs({ done: () => {} });
});

watch([filterByClub, sortParticipantBy], () => {
  participants.value = [];
  loadParticipants({ done: () => {} });
});

onMounted(() => {
  loadClubs({ done: () => {} });
  loadParticipants({ done: () => {} });
});
</script>



<style scoped>
.background-rating {
  background: url('@/assets/images/background_rating.webp') no-repeat 35% center;
}

.background-rating::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(to left bottom, black 25%, transparent 75%);
  z-index: 1;
}

.background-rating::after {
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

.rating-container {
  position: relative;
  z-index: 10;
  overflow-y: auto;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.rating-content-wrapper {
  width: 100%;
  padding: 10vh 0;
  box-sizing: border-box;
}

.rating-tabs {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.rating-tabs button {
  padding: 10px 20px;
  margin: 0 10px;
  cursor: pointer;
  background-color: #444;
  color: white;
  border: none;
  border-radius: 5px;
  outline: none;
}

.rating-tabs .active-tab {
  background-color: #888;
}

.create-club-button {
  padding: 10px 20px;
  margin-left: 10px;
  cursor: pointer;
  background-color: #444;
  color: white;
  border: none;
  border-radius: 5px;
  outline: none;
}

.rating-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-input, select {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.rating-table-wrapper {
  flex-grow: 1;
  overflow-y: auto;
}

.rating-table {
  display: flex;
  flex-direction: column;
}

.rating-row {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background-color: #222;
  color: white;
  margin-bottom: 5px;
  cursor: pointer;
}

.rating-header-row {
  background-color: #444;
  font-weight: bold;
}

.rating-row:hover {
  background-color: #333;
}

.infinity-scroll {
  overflow: hidden !important;
}
</style>
