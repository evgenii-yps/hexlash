<template>
  <div class="background">
    <div class="verification-container">

      <div>
        <h1>Email verification</h1>
        <div v-if="loading" class="loader-container">
          <v-progress-circular
              class="loader"
              size="40"
              indeterminate
          />
        </div>
        <p v-else-if="success" class="success">
          Your email has been successfully verified! Thank you for confirming. You can continue using the service as usual.
        </p>
        <p v-else-if="error" class="error">
          There was an issue verifying your email. Please check the code and try again. If the problem persists, please contact support.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, onBeforeMount, onMounted} from 'vue';
import {useRoute} from 'vue-router';
import store from '@/core/state/store.js';
import {ampli} from "@/amplitude.js";

const route = useRoute();
const loading = ref(true);
const success = ref(false);
const error = ref(false);

const verifyEmail = async () => {
  let code = route.query.code;
  code = decodeURIComponent(code);


  if (!code || code.length < 5) {
    loading.value = false;
    error.value = true;
    return;
  }

  loading.value = true;
  try {
    await store.dispatch('master/sendVerifyEmail', {code});

    // Amplitude
    ampli.logEvent('VerifyEmail');

    success.value = true;
  } catch (err) {
    error.value = true;
  } finally {
    loading.value = false;
  }
};

onBeforeMount(verifyEmail);
</script>

<style scoped>
.verification-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  text-align: center;
}

h1 {
  font-family: Anonymous, sans-serif;
  font-size: 3rem;
  margin-bottom: 1rem;
  color: white;
}

.error{
  color: var(--pinkDark);
  margin: 0 20px;
}

.success{
  color: white;
  margin: 0 20px;
}


.loader {
  color: var(--primary-color);
  margin: 0 auto;
}
</style>
