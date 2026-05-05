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

    <!-- Modal overlay — B-AW2 (#4): canonical .hex-modal-* taxonomy с .cw-* modifier overrides
         (z-index 9000 для wallet-priority, narrower max-width, lighter border). -->
    <Teleport to="body">
      <Transition name="hex-fade">
        <div v-if="showModal" class="hex-modal-overlay cw-modal-overlay" @click.self="closeModal">
          <Transition name="hex-slide-up">
            <div v-if="showModal" class="hex-modal cw-modal-content">
              <!-- Close button -->
              <button class="hex-modal-close" @click="closeModal">&times;</button>

              <!-- Connecting state -->
              <template v-if="pendingConnector">
                <div class="modal-header">
                  <h3 class="modal-title">{{ t.profile.wallet.lblConnecting }}</h3>
                </div>
                <div class="modal-connecting">
                  <div class="hex-spinner cw-spinner-lg"></div>
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

// Expose openModal so external callers (e.g. v2 HudProfile Identity card)
// can trigger the modal directly without rendering the inline "Connect
// Wallet" button. Epic 5 Sub-Epic 5B Step 10. Additive — does not affect
// legacy consumers (ProfileWallet.vue) which use the component as-is.
defineExpose({ openModal })
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

/* B-AW2 (#4): canonical .hex-modal-* taxonomy applied (overlay/modal/close from
   src/styles/hexlash-ui.css). Modifier overrides below preserve wallet visual
   character (z-index 9000 для wallet-priority, narrower 400px max-width,
   subtle 1px border instead of canonical 2px primary). */
.cw-modal-overlay {
  z-index: 9000;
  background: rgba(0, 0, 0, 0.75);
  padding: 20px;
}

.cw-modal-content {
  width: 100%;
  max-width: 400px;
  border: 1px solid var(--hex-border-default);
  border-radius: 16px;
  padding: 28px 24px;
  position: relative;
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
  border-color: var(--hex-border-active);
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

/* B-AW2 (#4): .hex-spinner canonical (post-C9) + .cw-spinner-lg size override
   (40px wallet-specific vs canonical 20px). hex-spin keyframes provided globally. */
.cw-spinner-lg {
  width: 40px;
  height: 40px;
  border-width: 3px;
}

/* Mobile */
@media (max-width: 360px) {
  .cw-modal-content {
    padding: 20px 16px;
  }

  .connector-btn {
    padding: 12px 14px;
  }
}
</style>
