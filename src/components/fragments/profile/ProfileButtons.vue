<template>
  <div class="buttons-container">
    <VBtnDark
        class="profile-btn"
        @click="navigateTo('Wallet')"
    >
      <template #prepend>
        <img src="@/assets/images/icon_arrow.svg" alt="Arrow Icon" class="custom-icon"/>
      </template>
      Управление кошельком
    </VBtnDark>
    <VBtnDark
        class="profile-btn"
        @click="navigateToClub"
    >
      <template #prepend>
        <img src="@/assets/images/icon_arrow.svg" alt="Arrow Icon" class="custom-icon"/>
      </template>
      {{ isOwner ? 'Управление клубом' : 'Мой клуб' }}
    </VBtnDark>
    <VBtnDark
        class="profile-btn"
        @click="navigateTo('Account')"
    >
      <template #prepend>
        <img src="@/assets/images/icon_arrow.svg" alt="Arrow Icon" class="custom-icon"/>
      </template>
      Управление аккаунтом
    </VBtnDark>


  </div>
</template>

<script setup>
import {computed, onMounted, ref} from 'vue';
import router from "@/router/index.js";
import store from "@/core/state/store.js";

const master = computed(() => store.getters['master/getMaster']);
const clubId = computed(() => master.value ? master.value.userData.clubId : null);

const isOwner = ref(false);

const checkIsOwner = async () => {
  if (clubId.value) {
    await store.dispatch('club/fetchClubById', clubId.value);
    const club = store.getters['club/getSelectedClub'];
    isOwner.value = club && String(club.owner) === String(master.value.id);
  }
};

onMounted(() => {
  checkIsOwner();
});

const navigateTo = (route) => {
  router.push({name: route});
};

const navigateToClub = () => {
  if (clubId.value) {
    router.push({path: `/club/${clubId.value}`});
  }
};
</script>

<style scoped>
.buttons-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 15px 20px 0 20px;
}

.profile-btn {
  width: 100%;
  height: 50px;
  margin: 5px 0;
  max-width: 500px;
  justify-content: flex-start;
  text-align: left;
  color: white;
  cursor: pointer;
}

.custom-icon {
  width: 15px; /* Увеличиваем ширину изображения */
  height: 15px; /* Увеличиваем высоту изображения */
  margin-right: 10px; /* Добавляем отступ справа для расстояния между иконкой и текстом */
}

</style>
