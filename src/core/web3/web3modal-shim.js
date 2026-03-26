/**
 * Compatibility shim: maps @web3modal/ethers/vue API to @wagmi/vue.
 * Allows existing wallet components to work without code changes
 * while the migration to native wagmi composables happens in Phase 1.2.
 */
import { ref, computed } from 'vue'
import { useAccount, useDisconnect as wagmiUseDisconnect } from '@wagmi/vue'

/**
 * Shim for useWeb3ModalAccount() → wagmi useAccount()
 * Returns reactive { address, isConnected }
 */
export function useWeb3ModalAccount() {
  const { address: wagmiAddress, isConnected: wagmiIsConnected } = useAccount()

  return {
    address: wagmiAddress,
    isConnected: wagmiIsConnected,
  }
}

/**
 * Shim for useDisconnect()
 */
export function useDisconnect() {
  const { disconnect } = wagmiUseDisconnect()
  return { disconnect }
}

/**
 * Shim for useWeb3Modal() — open/close wallet modal.
 * With pure wagmi there's no built-in modal UI,
 * so these are no-ops for now. Phase 1.2 will replace
 * ConnectWallet.vue with native wagmi connect logic.
 */
export function useWeb3Modal() {
  return {
    open: async () => {
      console.warn('[web3modal-shim] open() is a no-op. Migrate to wagmi connectors in Phase 1.2.')
    },
    close: async () => {
      console.warn('[web3modal-shim] close() is a no-op.')
    },
  }
}

/**
 * Shim for createWeb3Modal() — no-op, wagmi config handles this now.
 */
export function createWeb3Modal() {
  console.warn('[web3modal-shim] createWeb3Modal() is a no-op. Wagmi config is in wagmiConfig.js.')
  return {}
}

/**
 * Shim for defaultConfig() — no-op.
 */
export function defaultConfig() {
  return {}
}
