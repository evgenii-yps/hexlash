<template>
  <div class="login-container">
    <form @submit.prevent="handleSubmit">
      <InputField
          :label="t('auth.login.lblLogin')"
          v-model="login"
          labelColor="var(--white)"
          labelSize="10px"
          inputBgColor="var(--black-opacity)"
          inputBorderColor="var(--gray1)"
          inputTextColor="var(--white)"
          padding="0.8rem"
          marginBottom="0.5rem"
      />
      <InputField
          :label="t('auth.login.lblPassword')"
          type="password"
          v-model="password"
          labelColor="var(--white)"
          labelSize="10px"
          inputBgColor="var(--black-opacity)"
          inputBorderColor="var(--gray1)"
          inputTextColor="var(--white)"
          padding="0.8rem"
          marginBottom="1.3rem"
      />

      <div v-if="authState.authError" class="error-message">{{ t('auth.login.authError') }}<!--{{ authState.authError }}--></div>

      <v-progress-circular
          v-if="loading"
          class="loader"
          size="40"
          indeterminate
      />


      <VBtn  v-if="!loading" class="auth-btn" @click="handleSubmit">
        {{ t('auth.login.btnLogin') }}
      </VBtn>


    </form>

    <div class="invite" v-if="!loading">
      {{ t('auth.login.question') }}
      <ButtonText @click="handleInvite"
                  textColor="var(--pink)"
                  text-size="1.5em">
        {{ t('auth.login.btnInvite') }}
      </ButtonText>
      <div v-if="authState.authError">
        {{ t('auth.login.lblOrPass') }}
      <ButtonText @click="handleReset"
                  textColor="var(--pink)"
                  text-size="1.5em">
        {{ t('auth.login.btnReset') }}
      </ButtonText>
      </div>
      ?
    </div>


  </div>
</template>

<script setup>
import {computed, ref} from 'vue';
import ButtonRect from "@/components/ui/ButtonRect.vue";
import InputField from "@/components/ui/InputField.vue";
import ButtonText from "@/components/ui/ButtonText.vue";
import {useRouter} from 'vue-router';

import store from "@/core/state/store.js";
import {useI18n} from "vue-i18n";
const {t} = useI18n({useScope: 'global'})

const router = useRouter();

const login = ref('');
const password = ref('');
const loading = ref(false);

const authState = computed(() => store.getters['master/getAuthState']); // Получаем стейт

const handleSubmit = async () => {

  loading.value = true;

  try {
    const credentials = {login: login.value, password: password.value};
    await store.dispatch('master/login', credentials); // Используем action для логина
  } finally {
    loading.value = false;
  }

};

const handleInvite = () => {
  router.push('/auth/invite');
};

const handleReset = () => {
  router.push('/auth/reset');
};

</script>

<style scoped>
.login-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, 50%);
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

.invite {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: var(--gray2);
  align-self: flex-end;
  display: block;
}

.error-message {
  color: var(--pinkDark);
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
}

.auth-btn{
  color:white;
  width: 100%;
  height: 44px;
  cursor: pointer;
}

</style>
