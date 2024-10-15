<template>
  <div class="chatid-container">
    <form @submit.prevent="handleSubmit">
      <InputField
          :label="t('auth.telegram.lblAuth')"
          v-model="chatId"
          labelColor="var(--white)"
          labelSize="0.5rem"
          inputBgColor="var(--black-opacity)"
          inputBorderColor="var(--gray1)"
          inputTextColor="var(--white)"
          height="40px"
          marginBottom="0.8rem"
          :disabled="true"
      />

      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

      <v-progress-circular
          v-if="loading"
          class="loader"
          size="40"
          indeterminate
      />

      <VBtn v-if="!loading" class="auth-btn" @click="handleSubmit">
        {{ t('auth.telegram.retry') }}
      </VBtn>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import InputField from "@/components/ui/InputField.vue";
import { useI18n } from 'vue-i18n';
import store from "@/core/state/store.js";

const { t } = useI18n({ useScope: 'global' });

const loading = ref(false);
const errorMessage = ref('');

const handleSubmit = async () => {
  try {
    // Отправляем запрос на сервер
    initTelegramWebApp();

  } catch (error) {
    errorMessage.value = 'Failed to send chatId';
  } finally {
    loading.value = false;
  }
};

const chatId = ref(null);
const initData = ref(null);
const hash = ref(null);

const initTelegramWebApp = () => {
  loading.value = true;
  errorMessage.value = '';

  if (window.Telegram && window.Telegram.WebApp) {
    initData.value = window.Telegram.WebApp.initData; // Сырой initData

    const initDataUnsafe = window.Telegram.WebApp.initDataUnsafe;
    alert(initDataUnsafe);

    chatId.value = initDataUnsafe?.user?.id || null;  // Сохраняем chatId
    hash.value = initDataUnsafe.hash;

    store.dispatch('master/telegram', {
      chatId: chatId.value,
      initData: initData.value,
      hash: hash.value
    });

  }
};


onMounted(() => {
  initTelegramWebApp();
})


</script>

<style scoped>
.chatid-container {
  position: absolute;
  bottom: 10vh;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
}

form {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 200px;
}

.error-message {
  color: var(--pinkDark);
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
}

.auth-btn {
  color: white;
  width: 100%;
  height: 40px !important;
  cursor: pointer;
}

.loader {
  margin: 20px 0;
}
</style>
