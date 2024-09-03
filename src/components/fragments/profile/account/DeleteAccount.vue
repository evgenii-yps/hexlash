<template>
  <div class="delete-account-container">
    <VBtnDark
        class="delete-btn"
        @click="confirmDelete">
      {{ t('profile.account.lblDeleteAccount') }}
      <template #append>
        <img src="@/assets/images/icon_close.svg" alt="Close" class="custom-icon"/>
      </template>
    </VBtnDark>

    <VModal v-model="dialog" max-width="500">
      <VCard>
        <v-card-title class="headline"> {{ t('profile.account.lblConfirmDeletion') }}</v-card-title>
        <v-card-text>{{ t('profile.account.msgConfirmDelete') }}</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <VBtnDark  @click="dialog = false" class="cancel-btn">{{ t('modal.btnCancel') }}</VBtnDark>
          <VBtn  @click="handleDelete" class="confirm-delete-btn">{{ t('modal.btnConfirm') }}</VBtn>
        </v-card-actions>
      </VCard>
    </VModal>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import store from "@/core/state/store.js";
import router from "@/router/index.js";
import {useI18n} from "vue-i18n";

const { t } = useI18n({ useScope: 'global' })

// Сервис для удаления аккаунта
// import { deleteUserAccount } from '@/core/services/userService';

const dialog = ref(false);

const confirmDelete = () => {
  dialog.value = true;
};

const handleDelete = async () => {
  try {
    // const response = await deleteUserAccount();
    // Обработка успешного удаления аккаунта
    dialog.value = false;

    await router.push("/");

  } catch (error) {
    console.error('Failed to delete account:', error);
  }
};
</script>

<style scoped>
.delete-account-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 20px 20px;
}


.delete-btn {
  width: 100%;
  height: 50px !important;
  max-width: 500px;
  text-align: center;
  color: white;
  cursor: pointer;
  opacity: 0.7;
  background-color: var(--gray2) !important;
}

.custom-icon {
  width: 15px; /* Увеличиваем ширину изображения */
  height: 15px; /* Увеличиваем высоту изображения */
  margin-left: 15px; /* Добавляем отступ справа для расстояния между иконкой и текстом */
}

.confirm-delete-btn{
  cursor: pointer;
  background-color: var(--pinkDark);
  color: white !important;
  margin: 10px;
  opacity: 0.9;
}

</style>
