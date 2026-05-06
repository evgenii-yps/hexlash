<template>
  <div class="chatid-container">
    <form @submit.prevent="handleSubmit">
      <InputField
          :label="t.auth.telegram.lblAuth"
          v-model="chatId"
          labelColor="var(--hex-text-primary)"
          labelSize="0.5rem"
          inputBgColor="var(--hex-bg-card)"
          inputBorderColor="var(--hex-border-default)"
          inputTextColor="var(--hex-text-primary)"
          height="40px"
          marginBottom="0.8rem"
          :disabled="true"
      />

      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

      <!-- B-AW1 (#4 closes): v-progress-circular → canonical .hex-spinner; VBtn → HexButton.
           v-if pattern preserved (button hides during loading, spinner replaces). -->
      <div v-if="loading" class="hex-spinner auth-loader" aria-label="Loading"></div>

      <HexButton
          v-if="!loading"
          variant="primary"
          size="lg"
          block
          class="auth-btn"
          @click="handleSubmit"
      >
        {{ t.auth.telegram.retry }}
      </HexButton>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import InputField from "@/components/ui/InputField.vue";
import HexButton from "@/components/ui/HexButton.vue";
import {t} from "@/locales/index.js";
import store from "@/core/state/store.js";

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
const inviteCode = ref(null);
const initData = ref(null);
const hash = ref(null);

const initTelegramWebApp = () => {
  loading.value = true;
  errorMessage.value = '';

  if (window.Telegram && window.Telegram.WebApp) {
    initData.value = window.Telegram.WebApp.initData; // Сырой initData

    const initDataUnsafe = window.Telegram.WebApp.initDataUnsafe;

    store.dispatch('master/saveTelegramFlag');

    const url = new URL(window.location.href);
    if(url.searchParams.get('invite')) {
      inviteCode.value = url.searchParams.get('invite');
    }

    chatId.value = initDataUnsafe?.user?.id || null;  // Сохраняем chatId
    hash.value = initDataUnsafe.hash;

    store.dispatch('master/telegram', {
      chatId: chatId.value,
      initData: initData.value,
      hash: hash.value,
      inviteCode: inviteCode.value
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
  color: var(--hex-danger);
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
}

/* B-AW1 (#4 closes): HexButton variant=primary size=lg block provides bg/color/sizing/font.
   Telegram-specific styling absent (no glow shadow per pre-edit verbatim, mirror C12/C13
   pattern but with auth-glow opt-out preserved). */

/* B-AW1 (#4 closes): center .hex-spinner during Telegram auth (canonical post-C9). */
.auth-loader {
  margin: 20px auto;
  width: 32px;
  height: 32px;
  border-width: 3px;
}
</style>
