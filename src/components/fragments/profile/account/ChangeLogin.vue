<template>
  <div class="login-change-container">
    <form @submit.prevent="handleLoginSubmit" novalidate>
      <InputField
          label="LOGIN"
          type="text"
          v-model="login"
          labelColor="var(--white)"
          labelSize="10px"
          inputBgColor="var(--black-opacity-80)"
          inputBorderColor="var(--gray1)"
          inputTextColor="var(--white)"
          padding="0.8rem"
          marginBottom="0.5rem"
          @input="checkLoginChange"
          @blur="checkLoginExistence"
      />
      <ButtonRect
          v-if="!loading && loginChanged"
          @click="confirmChange"
          bgColor="--pink"
          textColor="--white"
          borderColor="--pink"
          hoverBgColor="--pinkDark"
          customClass="confirm-button"
          borderRadius="0px"
          padding="0.4rem"
          marginBottom="0"
      >
        Change Login
      </ButtonRect>
    </form>
    <CircularLoader v-if="loading" :size="24" />
    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
    <div v-if="loginAvailable && loginChanged" class="success-message">Login is available</div>

    <v-dialog v-model="dialog" max-width="500">
      <v-card>
        <v-card-title class="headline">Confirm Change</v-card-title>
        <v-card-text>Are you sure you want to change your login to "{{ login }}"?</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" @click="dialog = false">Cancel</v-btn>
          <v-btn color="blue darken-1" @click="handleLoginSubmit">Confirm</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import InputField from '@/components/ui/InputField.vue';
import ButtonRect from '@/components/ui/ButtonRect.vue';
import CircularLoader from '@/components/ui/CircularLoader.vue';
import store from "@/core/state/store.js";

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
    errorMessage.value = 'Login is required';
    return;
  }

  if (!validateLogin(login.value)) {
    errorMessage.value = 'Invalid login format';
    return;
  }

  if (!loginAvailable.value) {
    errorMessage.value = 'Login is not available';
    return;
  }

  // Обновляем login через мутацию
  store.dispatch("master/updateMaster", { login: login.value });

  // Дополнительная логика для подтверждения логина
  // TODO Send
  dialog.value = false;
};

const confirmChange = () => {
  dialog.value = true;
};

const checkLoginChange = () => {
  loginChanged.value = login.value !== originalLogin.value;
  if (loginChanged.value) {
    checkLoginExistence();
  }
};

const checkLoginExistence = async () => {
  if (!loginChanged.value) return;

  errorMessage.value = '';
  loginAvailable.value = false;
  loading.value = true;

  try {
    const available = true;
    // const available = await checkLoginAvailability(login.value);
    loginAvailable.value = available;

    if (!available) {
      errorMessage.value = 'Login is already taken';
    }
  } catch (error) {
    errorMessage.value = 'Failed to check login availability';
  } finally {
    loading.value = false;
  }
};

watch(() => master.value.userData.login, (newLogin) => {
  originalLogin.value = newLogin;
  login.value = newLogin;
  loginChanged.value = false;
  loginAvailable.value = false;
});
</script>

<style scoped>
.login-change-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

form {
  display: flex;
  flex-direction: column;
  align-items: center;
}


.error-message {
  color: var(--pinkDark);
  font-size: 0.8rem;
  margin-top: 0.5rem;
}

.success-message {
  color: #004e00;
  font-size: 0.8rem;
  margin-top: 0.5rem;
}
</style>
