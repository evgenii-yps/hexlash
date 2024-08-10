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
            <div class="club-avatar-container">
              <ClubAvatar :avatarUrl="clubData.avatarUrl"/>
            </div>
            <h2>{{ clubData.name }}</h2>
            <p>Клуб 6й улицы Нью Йорка, если ты не снами, ты против нас</p>

          </div>

          <ClubStats :clubData="clubData"/>

          <div class="club-buttons">

            <VBtnDark
                class="club-btn"
                @click="btnToMembers">
              <template #prepend>
                <img src="@/assets/images/icon_members.svg" alt="" class="custom-icon" style="width:30px;"/>
              </template>
              <span> {{ clubData.members }}</span> участников
            </VBtnDark>

            <div class="controls">
              <h2>Control</h2>
              <VBtnDark
                  class="club-btn"
                  @click="btnToBalance">
                <template #prepend>
                  <img src="@/assets/images/icon_tokens.svg" alt="" class="custom-icon"/>
                </template>
                Токены клуба
                <template #append>
                  <span class="custom-icon"/>
                  <span style="right: 0; position: absolute;"> {{ clubData.balance }}$</span>
                </template>
              </VBtnDark>

              <VBtnDark
                  class="club-btn"
                  @click="btnIsPublic">
                <template #prepend>
                  <img src="@/assets/images/icon_lock_white.svg" alt="" class="custom-icon"/>
                </template>
                Открытый клуб
                <template #append>
                  <span class="custom-icon"/>
                  <v-switch
                      style="position: absolute; right:10px;"
                      v-model="isPublic"
                      :class="{ checked: isPublic }"
                      class="club-switcher-public"
                      :value="clubData.isPublic"
                      hide-details
                  ></v-switch>
                </template>
              </VBtnDark>

              <VBtnDark
                  class="club-btn"
                  @click="btnToEdit">
                <template #prepend>
                  <img src="@/assets/images/icon_pencil.svg" alt="" class="custom-icon"/>
                </template>
                Редактировать
                <template #append>
                  <span class="custom-icon"/>
                </template>
              </VBtnDark>

            </div>

          </div>

          <!--        <div class="club-buttons" v-if="!isMember">-->
          <!--          <button @click="joinClub">Перейти в клуб</button>-->
          <!--        </div>-->

          <!--        <div class="club-buttons">-->
          <!--          <button @click="viewMembers">Участники</button>-->
          <!--        </div>-->

          <!--        <div v-if="isOwner">-->
          <!--          <Withdraw />-->
          <!--        </div>-->

        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, computed, nextTick, onMounted, onBeforeMount, watch} from 'vue';
import {useRoute} from 'vue-router';
import store from "@/core/state/store.js";
import ClubAvatar from "@/components/fragments/club/ClubAvatar.vue";
import ClubStats from "@/components/fragments/club/ClubStats.vue";

const route = useRoute();
const clubId = route.params.id;
const master = computed(() => store.getters['master/getMaster']);

const clubData = ref(null);
const loading = ref(true);  // Флаг загрузки

const isPublic = ref(true);

const loadClub = async () => {
  console.log("loadClub");
  loading.value = true;  // Устанавливаем флаг загрузки
  //isOwner.value = master.value && master.value.userData.clubId === clubId;
  clubData.value = await store.dispatch('club/getClubById', clubId);

  loading.value = false;  // Сбрасываем флаг загрузки после загрузки данных
};

onBeforeMount(loadClub);

watch(route, loadClub);

// Следим за изменением данных пользователя в хранилище и обновляем userData
watch(
    () => store.getters['club/getClubById'](clubId),
    (newValue) => {
      clubData.value = newValue;
    }
);

const btnToMembers = () => {
  console.log("navigateToMembers");
}

const btnToBalance = () => {
  console.log("navigateToBalance");
}

const btnIsPublic = () => {
  isPublic.value = !isPublic.value;
}

const btnToEdit = () => {
  console.log("btnToEdit");
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
  height: 50px;
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

.club-btn span {
  font-size: 1.5em;
  margin-right: 5px
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
