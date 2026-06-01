<!-- Wallet (Connect Wallet — web3). Game-cleanup reset: the shared 3D
     ProfileScene background + the game GameBalanceCard were removed. This view
     renders the wallet HUD (ConnectWallet) over the plain /play background. -->
<template>
  <div class="wallet-view">
    <HudProfileWallet @back="onBack" />
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import HudProfileWallet from '@/components/hud/HudProfileWallet.vue';

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
.wallet-view {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 50;
}
</style>
