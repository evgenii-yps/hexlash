<template>
  <div class="wallet-container">
    <BackButton :defaultRoute="backRef(route)"/>

    <div class="wallet-content">

      <WalletInfo v-if="isConnectedWallet"/>

      <ConnectWallet/>

      <div class="balance-cards-container">
        <GameBalanceCard :balance=String(gameBalance) @click="withdraw"/>
      </div>
      <BuyButton v-if="isConnectedWallet"/>



    </div>
  </div>

</template>

<script setup>
import {createWeb3Modal, defaultConfig, useWeb3ModalAccount} from '@web3modal/ethers/vue'
import BackButton from "@/components/ui/BackButton.vue";
import WalletInfo from "@/components/fragments/profile/wallet/WalletInfo.vue";
import GameBalanceCard from "@/components/fragments/profile/wallet/GameBalanceCard.vue";
import {computed, onBeforeMount, onMounted, ref, watch} from "vue";
import store from "@/core/state/store.js";
import ConnectWallet from "@/components/fragments/profile/wallet/ConnectWallet.vue";
import {t} from "@/locales/index.js";
import {InfoMessageModel} from "@/core/models/internal/infoMessageModel.js";
import {useRoute} from "vue-router";
import {backRef} from "@/router/index.js";
import BuyButton from "@/components/fragments/profile/wallet/BuyTokens.vue";



const projectId = '96482c2638a251eef7399e040f66bcb5';

const mainnet = {
  chainId: 1,
  name: 'Ethereum',
  currency: 'ETH',
  explorerUrl: 'https://etherscan.io',
  rpcUrl: 'https://cloudflare-eth.com'
}

const metadata = {
  name: 'Hexlash',
  description: 'The club is your right to life, a real life.\n' +
      'Join us. Your liberation awaits.',
  url: 'https://hexlash.com',
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


const route = useRoute();


const {address, isConnected} = useWeb3ModalAccount();

const gameBalance = ref(null);

const isConnectedWallet = computed(() => isConnected.value);
const walletAddress = computed(() => address.value);




watch(walletAddress, async (newAddress) =>  {
      console.log("Address changed:", newAddress);

      if (newAddress) {
        // Выполнить действия при подключении кошелька
        await store.dispatch('master/updateMaster', {walletAddress: newAddress});
      } else {
        // Выполнить действия при отключении кошелька
        await store.dispatch('master/updateMaster', {walletAddress: ''});
      }
    }
);

watch(store.getters['master/getMaster'], async (master) => {
  if (master && master.userData) {
    gameBalance.value = master.getBalance();
  }
}, {immediate: true});


const income = () => {
  console.log("income");
}

const withdraw = () => {
  const withdraw = InfoMessageModel.withTimeout(t.value.info.withdrawAfterListing, 3000);
  store.commit('master/setInfoMessage', withdraw);
}

onBeforeMount(() => {
  store.commit('contract/setWeb3Modal', modal)
})


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

</style>