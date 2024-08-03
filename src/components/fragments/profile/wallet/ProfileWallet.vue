<template>
  <div>
    <BackButton />
    <div class="wallet-manager-container">
      <WalletInfo />
      <GameBalanceCard/>
      <WalletBalanceCard/>
      <NoWallet />
    </div>
  </div>
</template>

<script setup>
import BackButton from "@/components/ui/BackButton.vue";
import WalletInfo from "@/components/fragments/profile/wallet/WalletInfo.vue";
</script>

<style scoped>
.wallet-manager-container {

  margin: 0 auto;
}
</style>