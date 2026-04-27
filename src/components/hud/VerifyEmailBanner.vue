<!-- Sub-Epic 5F Step 2 — VerifyEmailBanner.
     Top-fixed banner shown when user.userData.emailVerified is falsy.
     Mounted globally in AppV2.vue so it persists across all /v2/* routes.
     CSS body added in Step 3 (src/styles/v24/verify.css or co-located).

     Vuex field name: `emailVerified` (NOT `verified`). Set by
     master/sendVerifyEmail action via commit('updateMaster',
     { emailVerified: true }) on successful code submission.

     Verify Now button → router.push('/verify-email') (legacy view that
     accepts the verification code from the email link). 5F decision Q3:
     no separate "resend" backend endpoint exists; sending user to the
     existing verify flow is the minimal additive functional change. -->
<template>
  <Transition name="verify-slide">
    <div v-if="visible" class="verify-banner show">
      <div class="vb-text">
        <strong>Verify your email</strong> to unlock Clans, Ratings, and on-chain features.
      </div>
      <button class="vb-btn" @click="onVerifyNow">Verify Now</button>
      <button class="vb-dismiss" title="Dismiss" @click="onDismiss">×</button>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

const store = useStore();
const router = useRouter();
const dismissed = ref(false);

const emailVerified = computed(() => !!store.state.master?.userData?.emailVerified);
const visible = computed(() => !emailVerified.value && !dismissed.value);

function onVerifyNow() {
  router.push('/verify-email');
}

function onDismiss() {
  dismissed.value = true;
}

// Push HUD top-bar down via body class (per prototype 3444 push-down rule —
// CSS port lands in Step 3). Sync on mount + reactive on visibility flip.
function syncBodyClass() {
  if (visible.value) document.body.classList.add('verify-shown');
  else document.body.classList.remove('verify-shown');
}

onMounted(syncBodyClass);
onBeforeUnmount(() => {
  document.body.classList.remove('verify-shown');
});
watch(visible, syncBodyClass);
</script>

<style scoped>
/* Visual styles in shop sub-epic style: ported in Step 3 (verify.css).
   Vue Transition keeps slide animation local to component lifecycle. */
.verify-slide-enter-active,
.verify-slide-leave-active {
  transition: transform 0.4s ease;
}
.verify-slide-enter-from,
.verify-slide-leave-to {
  transform: translateY(-100%);
}
</style>
