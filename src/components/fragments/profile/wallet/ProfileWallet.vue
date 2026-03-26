<template>
  <div class="wallet-container">
    <BackButton :defaultRoute="backRef(route)"/>

    <div class="wallet-content">

      <ConnectWallet/>

      <div class="balance-cards-container">
        <GameBalanceCard :balance="String(gameBalance)" @click="withdraw"/>
      </div>

      <HexCard v-if="isConnected" variant="default" padding="md">
        <p class="coming-soon-text">
          {{ t.profile?.wallet?.lblTokenPurchaseComingSoon || 'Token purchase coming soon on Base chain' }}
        </p>
      </HexCard>

    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useAccount } from '@wagmi/vue'
import BackButton from '@/components/ui/BackButton.vue'
import GameBalanceCard from '@/components/fragments/profile/wallet/GameBalanceCard.vue'
import ConnectWallet from '@/components/fragments/profile/wallet/ConnectWallet.vue'
import HexCard from '@/components/ui/HexCard.vue'
import { t } from '@/locales/index.js'
import { InfoMessageModel } from '@/core/models/internal/infoMessageModel.js'
import store from '@/core/state/store.js'
import { useRoute } from 'vue-router'
import { backRef } from '@/router/index.js'

const route = useRoute()
const { address, isConnected } = useAccount()

const gameBalance = ref(null)

watch(address, async (newAddress) => {
  if (newAddress) {
    await store.dispatch('master/updateMaster', { walletAddress: newAddress })
  } else {
    await store.dispatch('master/updateMaster', { walletAddress: '' })
  }
})

watch(store.getters['master/getMaster'], async (master) => {
  if (master && master.userData) {
    gameBalance.value = master.getBalance()
  }
}, { immediate: true })

const withdraw = () => {
  const msg = InfoMessageModel.withTimeout(t.value.info.withdrawAfterListing, 3000)
  store.commit('master/setInfoMessage', msg)
}
</script>

<style scoped>
.wallet-container {
  margin: 1.2rem 0 0 0;
}

.wallet-content {
  margin: 0 20px;
}

.balance-cards-container {
  display: flex;
  gap: 16px;
  justify-content: center;
  align-items: center;
  max-width: 500px;
  margin: 1rem auto;
}

.coming-soon-text {
  color: var(--hex-text-muted);
  font-size: 0.8rem;
  margin: 0;
  text-align: center;
}
</style>
