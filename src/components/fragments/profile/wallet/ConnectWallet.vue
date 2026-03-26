<template>
  <div class="connect-wallet">
    <!-- Connected state -->
    <template v-if="isConnected">
      <div class="connected-info">
        <div class="connected-row">
          <div class="connected-details">
            <span class="connected-address">{{ shortAddress }}</span>
            <span class="connected-chain">{{ chain?.name || 'Base' }}</span>
          </div>
          <HexButton variant="ghost" size="sm" @click="handleDisconnect">
            {{ t.profile.wallet.lblReconnectWallet }}
          </HexButton>
        </div>
      </div>
    </template>

    <!-- Disconnected state -->
    <template v-else>
      <div class="button-container">
        <HexButton variant="primary" size="lg" block @click="openModal">
          {{ t.profile.wallet.lblConnectWallet }}
        </HexButton>
      </div>
    </template>

    <!-- Modal overlay -->
    <Teleport to="body">
      <Transition name="hex-fade">
        <div v-if="showModal" class="wallet-modal-overlay" @click.self="closeModal">
          <Transition name="hex-slide-up">
            <div v-if="showModal" class="wallet-modal">
              <!-- Close button -->
              <button class="modal-close" @click="closeModal">&times;</button>

              <!-- Connecting state -->
              <template v-if="pendingConnector">
                <div class="modal-header">
                  <h3 class="modal-title">{{ t.profile.wallet.lblConnecting }}</h3>
                </div>
                <div class="modal-connecting">
                  <div class="connecting-spinner"></div>
                  <HexButton variant="ghost" size="sm" @click="cancelConnect">
                    {{ t.nav?.lblBack || 'Cancel' }}
                  </HexButton>
                </div>
              </template>

              <!-- Connector list -->
              <template v-else>
                <div class="modal-header">
                  <h3 class="modal-title">{{ t.profile.wallet.lblConnectYourWallet || 'Select Wallet' }}</h3>
                  <p class="modal-subtitle">{{ t.profile.wallet.msgConnectWalletTooltip }}</p>
                </div>
                <div class="connectors-list">
                  <button
                    v-for="connector in uniqueConnectors"
                    :key="connector.uid"
                    class="connector-btn"
                    @click="handleConnect(connector)"
                  >
                    <span class="connector-icon">
                      <img
                        v-if="connectorIcon(connector).startsWith('http') || connectorIcon(connector).startsWith('data:')"
                        :src="connectorIcon(connector)"
                        :alt="connectorName(connector)"
                        class="connector-icon-img"
                      />
                      <span v-else class="connector-icon-emoji">{{ connectorIcon(connector) }}</span>
                    </span>
                    <span class="connector-name">{{ connectorName(connector) }}</span>
                  </button>
                </div>
              </template>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAccount, useConnect, useDisconnect, useConnectors } from '@wagmi/vue'
import { t } from '@/locales/index.js'
import HexButton from '@/components/ui/HexButton.vue'

const { address, isConnected, chain } = useAccount()
const { connect } = useConnect()
const { disconnect } = useDisconnect()
const connectors = useConnectors()

const showModal = ref(false)
const pendingConnector = ref(null)

const shortAddress = computed(() => {
  if (!address.value) return ''
  return `${address.value.slice(0, 6)}...${address.value.slice(-4)}`
})

const uniqueConnectors = computed(() => {
  const seen = new Set()
  return connectors.value.filter(c => {
    const key = c.name.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
})

const connectorIcon = (connector) => {
  if (connector.icon) return connector.icon
  const fallbacks = {
    'injected': '🌐',
    'metamask': '🦊',
    'coinbase wallet': '🔵',
    'coinbase smart wallet': '🔵',
    'walletconnect': '🔗',
  }
  return fallbacks[connector.name.toLowerCase()] || '👛'
}

const connectorName = (connector) => {
  if (connector.name === 'Injected') return 'Browser Wallet'
  return connector.name
}

const openModal = () => {
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  pendingConnector.value = null
}

const handleConnect = (connector) => {
  pendingConnector.value = connector.uid
  connect({ connector }, {
    onSuccess: () => {
      pendingConnector.value = null
      showModal.value = false
    },
    onError: () => {
      pendingConnector.value = null
    },
  })
}

const cancelConnect = () => {
  pendingConnector.value = null
}

const handleDisconnect = () => {
  disconnect()
}

const onKeydown = (e) => {
  if (e.key === 'Escape' && showModal.value) {
    closeModal()
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})
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

/* Connected state */
.connected-info {
  margin-top: 2rem;
}

.connected-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--hex-bg-card);
  border: 1px solid var(--hex-border-default);
  border-radius: 12px;
  padding: 12px 16px;
}

.connected-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.connected-address {
  font-family: 'AnonymousBalance', monospace;
  font-size: 0.9rem;
  color: var(--hex-text-primary);
}

.connected-chain {
  font-size: 0.7rem;
  color: var(--hex-victory);
}

/* Modal overlay */
.wallet-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.75);
  padding: 20px;
}

/* Modal card */
.wallet-modal {
  position: relative;
  width: 100%;
  max-width: 400px;
  background: var(--hex-bg-medium);
  border: 1px solid var(--hex-border-default);
  border-radius: 16px;
  padding: 28px 24px;
}

.modal-close {
  position: absolute;
  top: 12px;
  right: 16px;
  background: none;
  border: none;
  color: var(--hex-text-muted);
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
  padding: 4px;
  transition: color 0.2s;
}

.modal-close:hover {
  color: var(--hex-text-primary);
}

/* Modal header */
.modal-header {
  text-align: center;
  margin-bottom: 24px;
}

.modal-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--hex-text-primary);
  margin: 0 0 6px 0;
}

.modal-subtitle {
  font-size: 0.8rem;
  color: var(--hex-text-secondary);
  margin: 0;
}

/* Connector list */
.connectors-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.connector-btn {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 14px 18px;
  background: var(--hex-bg-light);
  border: 1px solid var(--hex-border-default);
  border-radius: 12px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}

.connector-btn:hover {
  border-color: var(--hex-primary);
  background: var(--hex-bg-card);
}

.connector-btn:active {
  transform: scale(0.98);
}

.connector-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.connector-icon-img {
  width: 32px;
  height: 32px;
  border-radius: 8px;
}

.connector-icon-emoji {
  font-size: 1.5rem;
  line-height: 1;
}

.connector-name {
  font-size: 0.95rem;
  color: var(--hex-text-primary);
  font-weight: 500;
}

/* Connecting state */
.modal-connecting {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 20px 0;
}

.connecting-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--hex-border-default);
  border-top-color: var(--hex-primary);
  border-radius: 50%;
  animation: wallet-spin 0.8s linear infinite;
}

@keyframes wallet-spin {
  to { transform: rotate(360deg); }
}

/* Mobile */
@media (max-width: 360px) {
  .wallet-modal {
    padding: 20px 16px;
  }

  .connector-btn {
    padding: 12px 14px;
  }
}
</style>
