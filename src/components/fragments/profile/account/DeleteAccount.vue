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

    <v-dialog v-model="dialog" max-width="500">
      <v-card>
        <v-card-title class="headline">Confirm Deletion</v-card-title>
        <v-card-text>Are you sure you want to delete your account? This action cannot be undone.</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" @click="dialog = false">Cancel</v-btn>
          <v-btn color="red darken-1" @click="handleDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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
  margin: 0 20px;
}


.delete-btn {
  width: 100%;
  height: 50px;
  max-width: 500px;
  text-align: center;
  color: white;
  cursor: pointer;
  opacity: 0.5;
}

.custom-icon {
  width: 15px; /* Увеличиваем ширину изображения */
  height: 15px; /* Увеличиваем высоту изображения */
  margin-left: 10px; /* Добавляем отступ справа для расстояния между иконкой и текстом */
}

</style>
