import { http, createConfig } from '@wagmi/vue'
import { base } from '@wagmi/vue/chains'
import { coinbaseWallet, walletConnect, injected } from '@wagmi/vue/connectors'

const projectId = '96482c2638a251eef7399e040f66bcb5'

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
