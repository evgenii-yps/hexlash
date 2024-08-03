<template>
  <div class="background-wallet">
    <BackButton />
    <div class="wallet-manager-container">
      <WalletInfo />

      <div class="balance-cards-container">
        <GameBalanceCard balance="100"/>
        <WalletBalanceCard balance="1300"/>
      </div>

      <NoWallet />

    </div>
  </div>
</template>

<script setup>
import BackButton from "@/components/ui/BackButton.vue";
import WalletInfo from "@/components/fragments/profile/wallet/WalletInfo.vue";
import WalletBalanceCard from "@/components/fragments/profile/wallet/WalletBalanceCard.vue";
import GameBalanceCard from "@/components/fragments/profile/wallet/GameBalanceCard.vue";
</script>

<style scoped>
.wallet-manager-container {
  margin: 0 20px 0 20px;
}

.balance-cards-container {
  display: flex;
  gap: 16px;
  justify-content: space-between;
  align-items: center;
  max-width: 500px;
  margin: 2rem auto;

}
</style>