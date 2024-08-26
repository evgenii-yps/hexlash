<template>
  <div class="invite-container">
    <form @submit.prevent="handleInviteSubmit">
      <InputField
          :label="$t('auth.invite.lblInvite')"
          v-model="inviteCode"
          labelColor="var(--white)"
          labelSize="10px"
          inputBgColor="var(--black-opacity-80)"
          inputBorderColor="var(--gray1)"
          inputTextColor="var(--white)"
          padding="0.8rem"
          marginBottom="1.3rem"
      />

      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

      <v-progress-circular
          v-if="loading"
          class="loader"
          size="40"
          indeterminate
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
        {{$t('auth.invite.btnInvite')}}
      </ButtonRect>

      <div class="login" v-if="!loading">
        {{$t('auth.invite.question')}}
        <ButtonText @click="handleLogin"
                    textColor="var(--pink)"
                    text-size="1.5em">
          {{$t('auth.invite.btnLogin')}}
        </ButtonText>
      </div>

    </form>
  </div>
</template>

<script setup>
import {ref} from 'vue';
import ButtonRect from "@/components/ui/ButtonRect.vue";
import InputField from "@/components/ui/InputField.vue";
import ButtonText from "@/components/ui/ButtonText.vue";
import {useRouter} from 'vue-router';

const inviteCode = ref('');
const loading = ref(false);
const errorMessage = ref('');

const router = useRouter();

const handleInviteSubmit = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    // Imitate API call
    await new Promise((resolve, reject) => setTimeout(resolve, 2000));
    if (inviteCode.value === 'admin') {
      console.log('Login successful');
    } else {
      throw new Error('Invalid invite');
    }
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    loading.value = false;
  }
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


</style>
