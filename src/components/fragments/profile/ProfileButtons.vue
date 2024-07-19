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
        @click="navigateTo('Club')"
    >
      <template #prepend>
        <img src="@/assets/images/icon_pencil.svg" alt="Custom Icon" class="custom-icon"/>
      </template>
      Управление клубом
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
import { ref } from 'vue';
import router from "@/router/index.js";

const navigateTo = (route) => {
  router.push({ name: route });
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
