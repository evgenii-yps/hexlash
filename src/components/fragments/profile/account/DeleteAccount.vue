<template>
  <div class="delete-account-container">
    <v-btn
        color="red-darken-4"
        @click="confirmDelete">
      Delete Account
    </v-btn>

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
  justify-content: center;
  margin-top: 2rem;
}
</style>
