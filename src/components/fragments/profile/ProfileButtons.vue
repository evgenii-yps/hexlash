<template>
  <div class="buttons-container">
    <v-btn
        variant="elevated"
        class="profile-btn"
        base-color="white"
        @click="navigateTo('Wallet')"
    >
      <template #prepend>
        <img src="@/assets/images/icon_pencil.svg" alt="Custom Icon" class="custom-icon"/>
      </template>
      Управление кошельком
    </v-btn>
    <v-btn
        variant="elevated"
        class="profile-btn"
        base-color="white"
        @click="navigateToClub"
    >
      <template #prepend>
        <img src="@/assets/images/icon_pencil.svg" alt="Custom Icon" class="custom-icon"/>
      </template>
      {{ isOwner ? 'Управление клубом' : 'Мой клуб' }}
    </v-btn>
    <v-btn
        variant="elevated"
        class="profile-btn"
        base-color="white"
        @click="navigateTo('Account')"
    >
      <template #prepend>
        <img src="@/assets/images/icon_pencil.svg" alt="Custom Icon" class="custom-icon"/>
      </template>
      Управление аккаунтом
    </v-btn>

    <!-- Центрирование кнопки "Пополнить баланс" -->
    <div class="centered-button-container">
      <v-btn
          color="success"
          @click="navigateTo('Balance')"
      >
        <template #prepend>
          <img src="@/assets/images/icon_pencil.svg" alt="Custom Icon" class="custom-icon"/>
        </template>
        Пополнить баланс
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import {computed, onMounted, ref} from 'vue';
import router from "@/router/index.js";
import store from "@/core/state/store.js";

const currentUser = computed(() => store.getters['user/getCurrentUser']);
const clubId = computed(() => currentUser.value ? currentUser.value.clubId : null);

const isOwner = ref(false);

const checkIsOwner = async () => {
  if (clubId.value) {
    await store.dispatch('club/fetchClubById', clubId.value);
    const club = store.getters['club/getSelectedClub'];
    isOwner.value = club && String(club.owner) === String(currentUser.value.id);
  }
};

onMounted(() => {
  checkIsOwner();
});

const navigateTo = (route) => {
  router.push({ name: route });
};

const navigateToClub = () => {
  if (clubId.value) {
    router.push({ path: `/club/${clubId.value}` });
  }
};
</script>

<style scoped>
.buttons-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.profile-btn {
  width: 100%;
  height: 50px;
  margin: 10px 0;
  max-width: 500px;
  justify-content: flex-start;
  text-align: left;
  background-color: var(--blackOpacity80);
  color: white;
  cursor: pointer;
}

.profile-btn:hover {
  background-color: var(--pink) !important;
  color: white;
}

:deep(.profile-btn:hover > .v-btn__overlay) {
  opacity: 0.04
}

:deep(.v-btn__overlay) {
  background-color: var(--pink) !important;
}

:deep(.profile-btn .v-ripple__container) {
  background-color: var(--pink) !important;
  opacity: 0.3 !important;
}

:deep(.profile-btn .v-ripple__animation) {
  background-color: var(--pinkDark) !important;
}

/* Стили для центрирования кнопки "Пополнить баланс" */
.centered-button-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  margin-top: 20px;
}
</style>
