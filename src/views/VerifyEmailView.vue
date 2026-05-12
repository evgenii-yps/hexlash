<template>
  <div class="background">
    <div class="verification-container">

      <div>
        <h1>{{ t.verify.title }}</h1>
        <div v-if="loading" class="loader-container">
          <v-progress-circular
              class="loader"
              size="40"
              indeterminate
          />
        </div>
        <p v-else-if="success" class="success">
          {{ t.verify.successMsg }}
        </p>
        <p v-else-if="error" class="error">
          {{ t.verify.errorMsg }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, onBeforeMount, onMounted} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import store from '@/core/state/store.js';
import {t} from '@/locales/index.js';
import {InfoMessageModel} from '@/core/models/internal/infoMessageModel.js';
import * as amplitude from "@amplitude/analytics-browser";

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const success = ref(false);
const error = ref(false);

const verifyEmail = async () => {
  // Email Auth Phase 5 — accept ?token=... query param (was ?code=... pre-1b).
  // Backend POST /v1/user/verify-email now expects { token } body per Phase 4
  // rewrite. Action master/verifyEmail (renamed from sendVerifyEmail) dispatches
  // к new endpoint shape.
  // Backward compat: if ?code=... still in URL (old emails в transit during
  // deploy window), try it as token — backend will 400 on stale/invalid
  // tokens regardless.
  const rawToken = route.query.token || route.query.code;
  if (!rawToken || typeof rawToken !== 'string') {
    loading.value = false;
    error.value = true;
    return;
  }
  const token = decodeURIComponent(rawToken);

  if (!token || token.length < 5) {
    loading.value = false;
    error.value = true;
    return;
  }

  loading.value = true;
  try {
    await store.dispatch('master/verifyEmail', { token });

    // Amplitude
    amplitude.track('VerifyEmail');

    success.value = true;

    // Email Auth Phase 5.5 — UX fix: show success message briefly, then
    // redirect к /play hub with toast confirmation. Without this, user
    // sees verify view embedded в /play shell (header + bottom menu)
    // and may not realize they should proceed back к game. 2s gives time
    // to read "verified ✓" before navigation.
    setTimeout(() => {
      store.commit(
        'master/setInfoMessage',
        InfoMessageModel.withoutButton('Email verified successfully ✓', 4000)
      );
      router.push('/play');
    }, 2000);
  } catch (err) {
    // Failure (expired/invalid token) — NO redirect; user stays on page
    // с error message + can request new link via Resend.
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
  font-family: 'Anonymous', 'Courier New', Consolas, monospace;
  font-size: 3rem;
  margin-bottom: 1rem;
  color: var(--hex-text-primary);
}

.error{
  color: var(--hex-primary-dark);
  margin: 0 20px;
}

.success{
  color: var(--hex-text-primary);
  margin: 0 20px;
}


.loader {
  color: var(--hex-primary);
  margin: 0 auto;
}
</style>
