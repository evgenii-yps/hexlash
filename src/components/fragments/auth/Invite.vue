<template>
  <div class="invite-container">
    <form @submit.prevent="handleInviteSubmit">
      <InputField
          :label="t.auth.invite.lblInvite"
          v-model="inviteCode"
          labelColor="var(--hex-text-primary)"
          labelSize="0.5rem"
          inputBgColor="var(--hex-bg-card)"
          inputBorderColor="var(--hex-border-default)"
          inputTextColor="var(--hex-text-primary)"
          height="40px"
          marginBottom="0.8rem"
          :upperCase="true"
          :center="true"
      />

      <div v-if="inviteState.errorMessage" class="error-message">{{ inviteState.errorMessage }}</div>

      <v-progress-circular
          v-if="loading"
          class="loader"
          size="40"
          indeterminate
      />

      <VBtn v-if="!loading" class="auth-btn" @click="handleInviteSubmit">
        {{ t.auth.invite.btnInvite }}
      </VBtn>

      <div class="login" v-if="!inviteState.loading">
        {{ t.auth.invite.question }}
        <ButtonText @click="handleLogin"
                    textColor="var(--hex-primary)"
                    text-size="1.5em">
          {{ t.auth.invite.btnLogin }}
        </ButtonText>
      </div>
    </form>
  </div>
</template>

<script setup>
import {ref, computed, onMounted} from 'vue';
import InputField from "@/components/ui/InputField.vue";
import ButtonText from "@/components/ui/ButtonText.vue";
import {useRoute, useRouter} from 'vue-router';
import {t} from "@/locales/index.js";
import store from "@/core/state/store.js";

const inviteCode = ref('');
const router = useRouter();
const route = useRoute();
const loading = ref(false);

const inviteState = computed(() => store.getters['master/getSignupState']);

const handleInviteSubmit = async () => {
  if (inviteCode.value) {
    loading.value = true;

    try {
      await store.dispatch('master/sendInvite', inviteCode.value);
    } finally {
      loading.value = false;
    }
  }
};

const handleLogin = () => {
  router.push('/auth/login');
};


// Автоматически проверяем наличие параметра invite в URL
onMounted(() => {
  const inviteParam = route.query.code;
  if (inviteParam) {
    inviteCode.value = inviteParam.toUpperCase();  // Если нужно автоматически приводить в верхний регистр
    handleInviteSubmit();  // Автоматически отправляем запрос
  }
});

</script>

<style scoped>
.invite-container {
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
  width: 180px;
}

.login {
  margin-top: 0.5rem;
  font-size: 0.7rem;
  color: var(--hex-text-secondary);
  align-self: flex-end;
  display: block;
}


.error-message {
  color: var(--hex-primary-dark);
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
}

.auth-btn {
  color: white;
  width: 100%;
  height: 40px !important;
  cursor: pointer;
}


</style>
