<template>
  <div class="delete-account-container">
    <VBtnDark
        class="delete-btn"
        @click="confirmDelete">
      Delete Account
      <template #append>
        <img src="@/assets/images/icon_close.svg" alt="Close" class="custom-icon"/>
      </template>
    </VBtnDark>

    <VModal v-model="dialog" max-width="500">
      <VCard>
        <v-card-title class="headline">Confirm Deletion</v-card-title>
        <v-card-text>Are you sure you want to delete your account? This action cannot be undone.</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <VBtnDark  @click="dialog = false" class="cancel-btn">Cancel</VBtnDark>
          <VBtn  @click="handleDelete" class="confirm-delete-btn">Delete</VBtn>
        </v-card-actions>
      </VCard>
    </VModal>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import store from "@/core/state/store.js";

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
    console.log('Account deleted');
    dialog.value = false;
    // Дополнительная логика, например, выход из системы или перенаправление на главную страницу
  } catch (error) {
    console.error('Failed to delete account:', error);
    // Обработка ошибки при удалении аккаунта
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
  height: 50px;
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
