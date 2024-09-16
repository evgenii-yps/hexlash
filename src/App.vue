<template>
  <div class="app-container">
    <header class="header">
      <div class="header-content">
        <Logo/>
        <div v-if="balance !== null" class="balance">
          {{ balance }}$
        </div>
      </div>
    </header>

    <main class="content">
      <RouterView/>
    </main>

    <Info :text="infoMessage.text"
          :timeout="infoMessage.timeout"
          :showButton="infoMessage.showButton"
    />

    <footer class="footer">
      <transition name="slide-up-down">
        <BottomMenu v-if="showBottomMenu"/>
      </transition>
    </footer>
  </div>
</template>

<script setup>
import {RouterView} from 'vue-router'
import {computed, onMounted, ref} from "vue";
import BottomMenu from "@/components/menu/BottomMenu.vue";
import Logo from "@/components/Logo.vue";
import store from "@/core/state/store.js";
import Info from "@/components/Info.vue";
import {createWeb3Modal, defaultConfig} from "@web3modal/ethers/vue";

const balance = computed(() => {
  const master = store.getters['master/getMaster'];
  if (master && master.userData) {
    return master.getBalance();
  }
  return null;
});

// Определяем, нужно ли показывать InfoMessage
const showInfoMessage = ref(false);

const infoMessage = computed(() => {
  const newInfoMessage = store.getters['master/getInfoMessage'];
  showInfoMessage.value = newInfoMessage.text !== "";
  return newInfoMessage;
});

const showBottomMenu = computed(() => {
  return store.getters['master/getAuthState'].isAuthenticated
});


const projectId = '96482c2638a251eef7399e040f66bcb5';

const mainnet = {
  chainId: 1,
  name: 'Ethereum',
  currency: 'ETH',
  explorerUrl: 'https://etherscan.io',
  rpcUrl: 'https://cloudflare-eth.com'
}

const metadata = {
  name: 'FightClub',
  description: 'The club is your right to life, a real life.\n' +
      'Join us. Your liberation awaits.',
  url: 'https://bitfightclub.com',
  icons: ['/images/logo500x500.png'],
}

const ethersConfig = defaultConfig({
  /*Required*/
  metadata,

  auth: {
    email: false,
    socials: [],
    showWallets: true,
    walletFeatures: true
  },

  /*Optional*/
  enableEIP6963: true, // true by default
  enableInjected: true, // true by default
  enableCoinbase: true, // true by default
  rpcUrl: '...', // used for the Coinbase SDK
  defaultChainId: 1, // used for the Coinbase SDK
})


const modal = createWeb3Modal({
  ethersConfig,
  chains: [mainnet],
  projectId,
  enableAnalytics: true, // Optional - defaults to your Cloud configuration
})

onMounted(() => {
  store.commit('contract/setWeb3Modal', modal)
})

</script>

<style scoped>

@font-face {
  font-family: 'AnonymousBalance';
  src: url('@/assets/fonts/AnonymousBalance.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

.content {
  position: relative;
  overflow-y: auto;
  height: 100vh;
}

.header {
  width: 100vw;
  position: relative;
  z-index: 2;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.balance {
  font-size: 2.5em;
  color: white;
  font-family: 'AnonymousBalance', sans-serif;
  position: absolute;
  top: 0;
  right: 20px;
  margin-top: 20px;
}

/* Анимация выезжания вверх и вниз */
.slide-up-down-enter-active, .slide-up-down-leave-active {
  transition: transform 0.5s ease;
}

.slide-up-down-enter-from {
  transform: translateY(100%);
}

.slide-up-down-enter-to {
  transform: translateY(0);
}

.slide-up-down-leave-from {
  transform: translateY(0);
}

.slide-up-down-leave-to {
  transform: translateY(100%);
}

.footer {
  display: flex;
  justify-content: center;
  align-items: center;
}


</style>
