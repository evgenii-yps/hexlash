<template>
  <div class="invite-container">
    <form @submit.prevent="handleInviteSubmit">
      <InputField
          :label="t('auth.invite.lblInvite')"
          v-model="inviteCode"
          labelColor="var(--white)"
          labelSize="10px"
          inputBgColor="var(--black-opacity)"
          inputBorderColor="var(--gray1)"
          inputTextColor="var(--white)"
          padding="0.8rem"
          marginBottom="1.3rem"
      />

      <div v-if="inviteState.errorMessage" class="error-message">{{ inviteState.errorMessage }}</div>
      <div v-if="inviteState.successMessage" class="success-message">{{ inviteState.successMessage }}</div>

      <v-progress-circular
          v-if="inviteState.loading"
          class="loader"
          size="40"
          indeterminate
      />

      <VBtn v-if="!inviteState.loading" class="auth-btn" @click="handleInviteSubmit">
        {{ t('auth.invite.btnInvite') }}
      </VBtn>

      <div class="login" v-if="!inviteState.loading">
        {{ t('auth.invite.question') }}
        <ButtonText @click="handleLogin"
                    textColor="var(--pink)"
                    text-size="1.5em">
          {{ t('auth.invite.btnLogin') }}
        </ButtonText>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import InputField from "@/components/ui/InputField.vue";
import ButtonText from "@/components/ui/ButtonText.vue";
import { useRouter } from 'vue-router';
import { useI18n } from "vue-i18n";
import store from "@/core/state/store.js";

const { t } = useI18n({ useScope: 'global' });

const inviteCode = ref('');
const router = useRouter();

const inviteState = computed(() => store.getters['master/getInviteState']);

const handleInviteSubmit = () => {
  store.dispatch('master/sendInvite', inviteCode.value);
};

const handleLogin = () => {
  router.push('/auth/login');
};
</script>

<style scoped>
.invite-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, 70%);
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

.login {
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

.auth-btn {
  color: white;
  width: 100%;
  height: 44px !important;
  cursor: pointer;
}


</style>
