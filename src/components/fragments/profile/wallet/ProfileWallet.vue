<template>
  <div>
    <BackButton />
    <div class="wallet-manager-container">
      <WalletInfo />
      <PrivateKeyButton />
      <LinkOrCreateWallet />
    </div>
  </div>
</template>

<script setup>
import BackButton from "@/components/ui/BackButton.vue";
import WalletInfo from "@/components/fragments/profile/wallet/WalletInfo.vue";
import PrivateKeyButton from "@/components/fragments/profile/wallet/PrivateKeyButton.vue";
import LinkOrCreateWallet from "@/components/fragments/profile/wallet/LinkOrCreateWallet.vue";
</script>

<style scoped>
.wallet-manager-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 2rem;
}
</style>