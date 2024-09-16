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
import {computed, onMounted, ref, watch} from "vue";
import store from "@/core/state/store.js";
import ConnectWallet from "@/components/fragments/profile/wallet/ConnectWallet.vue";
import {useI18n} from "vue-i18n";
import {InfoMessageModel} from "@/core/models/internal/infoMessageModel.js";
import {useRoute} from "vue-router";
import {backRef} from "@/router/index.js";
import BuyButton from "@/components/fragments/profile/wallet/BuyTokens.vue";


const route = useRoute();

const {t} = useI18n({useScope: 'global'})

const {address, isConnected} = useWeb3ModalAccount();

const gameBalance = ref(null);

const isConnectedWallet = computed(() => isConnected.value);
const walletAddress = computed(() => address.value);




watch(walletAddress, (newAddress) => {
      console.log("Address changed:", newAddress);

      if (newAddress) {
        // Выполнить действия при подключении кошелька
        store.dispatch('master/updateMaster', {walletAddress: newAddress});
      } else {
        // Выполнить действия при отключении кошелька
        store.dispatch('master/updateMaster', {walletAddress: ''});
      }
    }
);

watch(store.getters['master/getMaster'], async (master) => {
  if (master && master.userData) {
    gameBalance.value = master.getBalance();


   /* if (hasWallet.value) {

      // Подключение metamask или другого кошелька
      //  isConnected.value = await checkConnection();
      walletBalance.value = 0;
      // TODO взять баланс со смарт контракта

      titleText.value = t('profile.wallet.lblConnectAnotherWallet')
    } else {
      titleText.value = t('profile.wallet.lblAlreadyHaveWallet')
    }*/
  }
}, {immediate: true});


const income = () => {
  console.log("income");
}

const withdraw = () => {
  const withdraw = InfoMessageModel.withTimeout(t('info.withdrawAfterListing'), 3000);
  store.commit('master/setInfoMessage', withdraw);
}

onMounted(() => {


})


</script>

<style scoped>
.wallet-container {
  margin: 2rem 0 0 0;
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
  margin: 2rem auto;

}

</style>