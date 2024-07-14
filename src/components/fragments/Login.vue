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

      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

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


      <div class="invite" v-if="!loading">
        Do you have
        <ButtonText @click="handleInvite"
                    textColor="var(--pink)"
                    text-size="1.5em"
        >invite
        </ButtonText>
        ?
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
import CircularLoader from "@/components/ui/CircularLoader.vue";

const router = useRouter();

const login = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref('');

const handleSubmit = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    // Imitate API call
    await new Promise((resolve, reject) => setTimeout(resolve, 2000));

    // Replace the below line with actual login logic
    if (login.value === 'admin' && password.value === 'admin') {
      console.log('Login successful');
      // Redirect to another page or perform any action after successful login
    } else {
      throw new Error('Invalid login or password');
    }
  } catch (error) {
    errorMessage.value = error.message;
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
