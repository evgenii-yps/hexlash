<template>
  <div class="login-container">
    <form @submit.prevent="handleSubmit">
      <InputField
          label="LOGIN"
          v-model="login"
          labelColor="var(--white)"
          labelSize="10px"
          inputBgColor="var(--blackOpacity)"
          inputBorderColor="var(--gray1)"
          inputTextColor="var(--white)"
          padding="0.8rem"
          marginBottom="0.5rem"
      />
      <InputField
          label="PASSWORD"
          type="password"
          v-model="password"
          labelColor="var(--white)"
          labelSize="10px"
          inputBgColor="var(--blackOpacity)"
          inputBorderColor="var(--gray1)"
          inputTextColor="var(--white)"
          padding="0.8rem"
          marginBottom="1.3rem"
      />

      <div v-if="authError" class="error-message">Wrong login or password<!--{{ authError }}--></div>

      <CircularLoader style="scale: 0.3"
                      v-if="loading"
                      :size="5"
                      :speed="2"
                      :opacity="80"

      />

      <ButtonRect
          v-if="!loading"
          type="submit"
          bgColor="--pink"
          textColor="--white"
          borderColor="--pink"
          hoverBgColor="--pinkDark"
          customClass=""
          borderRadius="0px"
          padding="0.8rem"
          marginBottom="0.5rem"
      >
        Login
      </ButtonRect>

    </form>

    <div class="invite" v-if="!loading">
      Do you have
      <ButtonText @click="handleInvite"
                  textColor="var(--pink)"
                  text-size="1.5em"
      >invite
      </ButtonText>
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
import CircularLoader from "@/components/ui/CircularLoader.vue";
import store from "@/core/state/store.js";


const router = useRouter();

const login = ref('');
const password = ref('');
const loading = ref(false);
const authError = computed(() => store.getters['auth/getAuthError']); // Получаем ошибку из нового модуля auth


const handleSubmit = async () => {

  loading.value = true;

  store.commit('auth/setAuthError', null);

  try {
    const credentials = {login: login.value, password: password.value};
    await store.dispatch('auth/login', credentials); // Используем action для логина
    if (!store.getters['auth/getAuthError']) {
      await router.push('/profile');
    }
  } finally {
    loading.value = false;
  }

};


const handleInvite = () => {
  router.push('/auth/invite');
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


</style>
