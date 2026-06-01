<!-- Account settings (email / login / password / delete account).
     Game-cleanup reset: the shared 3D ProfileScene background was removed with
     the scene layer. This view now renders the account HUD over the plain
     /play background. -->
<template>
  <div class="account-view">
    <HudProfileAccount @back="onBack" />
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import HudProfileAccount from '@/components/hud/HudProfileAccount.vue';

const router = useRouter();

function onBack() {
  router.push('/play/profile');
}

function onKeydown(e) {
  if (e.key === 'Escape') onBack();
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
});
</script>

<style scoped>
.account-view {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 50;
}
</style>
