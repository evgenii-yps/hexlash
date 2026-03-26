<template>
  <div class="connect-wallet">
    <template v-if="isConnected">
      <div class="connected-row">
        <span class="connected-address">{{ shortAddress }}</span>
        <HexButton variant="ghost" size="sm" @click="handleDisconnect">
          {{ t.profile.wallet.lblReconnectWallet }}
        </HexButton>
      </div>
    </template>

    <template v-else>
      <div v-if="!showConnectors" class="button-container">
        <HexButton variant="primary" size="lg" block @click="showConnectors = true">
          {{ t.profile.wallet.lblConnectWallet }}
        </HexButton>
      </div>

      <div v-else class="connectors-list">
        <HexButton
          v-for="connector in connectors"
          :key="connector.uid"
          variant="secondary"
          size="md"
          block
          :loading="pendingConnector === connector.uid"
          @click="handleConnect(connector)"
        >
          {{ connector.name }}
        </HexButton>
        <HexButton variant="ghost" size="sm" block @click="showConnectors = false">
          {{ t.nav?.lblBack || 'Back' }}
        </HexButton>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAccount, useConnect, useDisconnect, useConnectors } from '@wagmi/vue'
import { t } from '@/locales/index.js'
import HexButton from '@/components/ui/HexButton.vue'

const { address, isConnected } = useAccount()
const { connect } = useConnect()
const { disconnect } = useDisconnect()
const connectors = useConnectors()

const showConnectors = ref(false)
const pendingConnector = ref(null)

const shortAddress = computed(() => {
  if (!address.value) return ''
  return `${address.value.slice(0, 6)}...${address.value.slice(-4)}`
})

const handleConnect = (connector) => {
  pendingConnector.value = connector.uid
  connect({ connector }, {
    onSuccess: () => {
      pendingConnector.value = null
      showConnectors.value = false
    },
    onError: () => {
      pendingConnector.value = null
    },
  })
}

const handleDisconnect = () => {
  disconnect()
}
</script>

<style scoped>
.connect-wallet {
  display: block;
  max-width: 500px;
  margin: 0 auto;
}

.button-container {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}

.connectors-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 2rem;
}

.connected-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}

.connected-address {
  font-family: 'AnonymousBalance', monospace;
  font-size: 0.9rem;
  color: var(--hex-text-secondary);
}
</style>
