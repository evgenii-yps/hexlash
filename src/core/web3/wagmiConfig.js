import { http, createConfig } from '@wagmi/vue'
import { base } from '@wagmi/vue/chains'
import { coinbaseWallet, walletConnect, injected } from '@wagmi/vue/connectors'

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '5591a1606e3dab80a0262f4f534f494d'

export const config = createConfig({
  chains: [base],
  connectors: [
    injected(),
    coinbaseWallet({
      appName: 'Hexlash',
      preference: 'smartWalletOnly',
    }),
    walletConnect({ projectId }),
  ],
  transports: {
    [base.id]: http(),
  },
})
