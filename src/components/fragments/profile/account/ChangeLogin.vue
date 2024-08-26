<template>
  <div class="login-change-container">
    <form @submit.prevent="handleLoginSubmit" novalidate>
      <InputField
          :label="$t('profile.account.lblChangeLogin')"
          type="text"
          v-model="login"
          labelColor="var(--white)"
          labelSize="10px"
          inputBgColor="var(--black-opacity-80)"
          inputBorderColor="var(--gray1)"
          inputTextColor="var(--white)"
          padding="0.8rem"
          marginBottom="0.5rem"
          @input="handleLoginInput"
          :showButton="loginChanged"
      >
        <template v-slot>
          <div class="btn-container">
            <div class="status-container">
              <div v-if="loginAvailable && loginChanged && !errorMessage" class="success-message">
                {{ $t('profile.account.lblAvailableLogin') }}

              </div>
              <v-progress-circular v-if="loading" color="var(--primary-color)" indeterminate :size="20"/>
              <img v-if="!loading && loginAvailable && loginChanged" src="@/assets/images/icon_pencil.svg"
                   @click="confirmChange"
                   alt="change login" class="btn-change-login"/>
            </div>
          </div>
        </template>
      </InputField>
    </form>

    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

    <VModal v-model="dialog" max-width="500">
      <VCard>
        <v-card-title class="headline"> {{ $t('profile.account.lblConfirmChange') }}</v-card-title>
        <v-card-text>
          {{ $t('profile.account.msgConfirmChange', {newLogin: login}) }}
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="dialog = false" class="cancel-btn"> {{ $t('modal.btnCancel') }}</v-btn>
          <v-btn @click="handleLoginSubmit" class="confirm-btn"> {{ $t('modal.btnConfirm') }}</v-btn>
        </v-card-actions>
      </VCard>
    </VModal>
  </div>
</template>

<script setup>
import {computed, ref, watch} from 'vue';
import InputField from '@/components/ui/InputField.vue';
import store from "@/core/state/store.js";
import debounce from "debounce";

// Сервис для проверки наличия логина
// import { checkLoginAvailability } from '@/core/services/userService';

const master = computed(() => store.getters['master/getMaster']);
const originalLogin = ref(master.value.userData.login);

const login = ref(originalLogin.value);
const loginChanged = ref(false);
const loginAvailable = ref(false);
const loading = ref(false);
const errorMessage = ref('');
const dialog = ref(false);

const validateLogin = (login) => {
  const loginPattern = /^[a-zA-Z0-9_]{3,}$/;
  return loginPattern.test(login);
};

const handleLoginSubmit = () => {
  errorMessage.value = '';

  if (!login.value) {
    errorMessage.value = $t('profile.account.lblLoginRequired');
    return;
  }

  if (!validateLogin(login.value)) {
    errorMessage.value = $t('profile.account.lblInvalidLoginFormat');
    return;
  }

  if (!loginAvailable.value) {
    errorMessage.value = $t('profile.account.lblLoginNotAvailable');
    return;
  }

  // Обновляем login через мутацию
  store.dispatch("master/updateMaster", {login: login.value});

  dialog.value = false;
};

const confirmChange = () => {
  dialog.value = true;
};

const handleLoginInput = () => {
  loginChanged.value = login.value !== originalLogin.value;
  if (loginChanged.value) {
    errorMessage.value = '';
    loginAvailable.value = false;

    debouncedCheckLoginExistence();
  }
};

const debouncedCheckLoginExistence = debounce(async () => {
  if (!loginChanged.value) return;


  loading.value = true;

  try {

    // Добавляем задержку в 1 секунду, чтобы показать лоадер
    await new Promise(resolve => setTimeout(resolve, 1000));

    const available = true;
    // const available = await checkLoginAvailability(login.value);
    loginAvailable.value = available;

    if (!available) {
      errorMessage.value = $t('profile.account.lblLoginAlreadyTaken');
    }
  } catch (error) {
    errorMessage.value = $t('profile.account.lblFailedToCheckLoginAvailability');
  } finally {
    loading.value = false;
  }
}, 500);

watch(() => master.value.userData.login, (newLogin) => {
  originalLogin.value = newLogin;
  login.value = newLogin;
  loginChanged.value = false;
  loginAvailable.value = false;
}, {immediate: true});

</script>

<style scoped>
.login-change-container {
  align-items: center;
  margin: 10px 20px;
}

form {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 500px;
  margin: 0 auto;
}

.btn-container {
  margin: 0 20px;
}

.status-container {
  display: flex;
  align-items: center;
}

.success-message {
  color: #004e00;
  font-size: 0.8rem;
  margin-right: 10px;
}

.btn-change-login {
  cursor: pointer;
}

.error-message {
  color: var(--pinkDark);
  font-size: 0.8rem;
  text-align: center;
}
</style>