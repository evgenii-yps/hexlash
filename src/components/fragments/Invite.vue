<template>
  <div class="invite-container">
    <form @submit.prevent="handleInviteSubmit">
      <InputField
          label="INVITE CODE"
          v-model="inviteCode"
          labelColor="var(--white)"
          labelSize="10px"
          inputBgColor="var(--white)"
          inputBorderColor="var(--gray1)"
          inputTextColor="var(--dark)"
          padding="0.8rem"
          marginBottom="1.3rem"
      />
      <ButtonRect
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
        Join Club
      </ButtonRect>

      <div class="login">
        Already have an account? <ButtonText @click="handleLogin"
                                             textColor="var(--pink)"
                                             text-size="1.5em"
      >Login</ButtonText>
      </div>

    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import ButtonRect from "@/components/ui/ButtonRect.vue";
import InputField from "@/components/ui/InputField.vue";
import ButtonText from "@/components/ui/ButtonText.vue";
import { useRouter } from 'vue-router';

const inviteCode = ref('');
const router = useRouter();

const handleInviteSubmit = () => {
  console.log('Invite Code:', inviteCode.value);
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
  transform: translate(-50%,70%);
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
</style>
