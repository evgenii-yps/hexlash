<template>
  <div class="wallet-info">
    <div class="wallet-address-row">
      <div class="address-block">
        <span class="address-label">{{ t.profile.wallet.lblConnectedWalletAddress }}</span>
        <span class="address-value">{{ shortAddress }}</span>
      </div>
      <div class="btn-container" @click="copyAddress">
        <img src="@/assets/images/icon_copy.svg" alt="" class="btn-copy-address"/>
      </div>
    </div>
    <div class="chain-row">
      <span class="chain-label">{{ chain?.name || 'Base' }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAccount } from '@wagmi/vue'
import { t } from '@/locales/index.js'
import store from '@/core/state/store.js'
import { InfoMessageModel } from '@/core/models/internal/infoMessageModel.js'

const { address, chain } = useAccount()

const shortAddress = computed(() => {
  if (!address.value) return ''
  return `${address.value.slice(0, 6)}...${address.value.slice(-4)}`
})

const copyAddress = () => {
  navigator.clipboard.writeText(address.value).then(() => {
    const msg = InfoMessageModel.withTimeout(t.value.profile.wallet.msgWalletAddressCopied, 2000)
    store.commit('master/setInfoMessage', msg)
  }).catch(err => {
    console.error('Copy error:', err)
  })
}
</script>

<style scoped>
.wallet-info {
  display: block;
  max-width: 500px;
  margin: 1.5rem auto 0 auto;
}

.wallet-address-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--hex-bg-card);
  border: 1px solid var(--hex-border-default);
  border-radius: 8px;
  padding: 0.6rem 0.8rem;
}

.address-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.address-label {
  font-size: 0.5rem;
  color: var(--hex-text-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.address-value {
  font-family: 'AnonymousBalance', monospace;
  font-size: 0.85rem;
  color: var(--hex-text-muted);
}

.btn-container {
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 4px;
}

.btn-copy-address {
  width: 18px;
  height: 18px;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.btn-copy-address:hover {
  opacity: 1;
}

.chain-row {
  margin-top: 0.4rem;
  text-align: right;
}

.chain-label {
  font-size: 0.7rem;
  color: var(--hex-text-muted);
}
</style>
