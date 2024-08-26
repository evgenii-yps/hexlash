<template>
  <div class="wallet-container">
    <BackButton/>

    <div class="wallet-content">
      <ConnectWallet v-if="!hasWallet"/>
      <WalletInfo v-if="hasWallet"/>

      <div class="balance-cards-container">
        <GameBalanceCard :balance=String(gameBalance) @click="withdraw"/>
      </div>

    </div>
  </div>

</template>

<script setup>
import BackButton from "@/components/ui/BackButton.vue";
import WalletInfo from "@/components/fragments/profile/wallet/WalletInfo.vue";
import GameBalanceCard from "@/components/fragments/profile/wallet/GameBalanceCard.vue";
import {ref, watch} from "vue";
import store from "@/core/state/store.js";
import {useMetaMaskWallet} from "vue-connect-wallet";
import {WalletTypes} from "@/core/models/userModel.js";
import ConnectWallet from "@/components/fragments/profile/wallet/ConnectWallet.vue";
import {useI18n} from "vue-i18n";

const { t } = useI18n({ useScope: 'global' })

const wallet = useMetaMaskWallet();


const gameBalance = ref(null);
const walletBalance = ref(null);

const hasWallet = ref(false);
const titleText = ref(null);

const isConnected = ref(false);


const checkConnection = async () => {
  const accounts = await wallet.getAccounts();
  if (typeof accounts === "string") return false;
  return accounts.length > 0;
};


watch(store.getters['master/getMaster'], async (master) => {
  if (master && master.userData) {
    gameBalance.value = master.userData.balance;

    hasWallet.value = master.userData.walletAddress != null && master.userData.walletAddress !== '';

    if (hasWallet.value) {
      // Проверяем какой кошелек, импорт или сгенерированный
      if (master.userData.walletType === WalletTypes.GENERATED) {
        // Все вызовы на запрос баланса и перевод на игровой баланс, будут идти через API
        walletBalance.value = master.userData.walletBalance;
        isConnected.value = true;
      } else {
        // Подключение metamask или другого кошелька
        isConnected.value = await checkConnection();
        walletBalance.value = 0;
        // TODO взять баланс со смарт контракта
      }

      titleText.value = t('profile.wallet.lblConnectAnotherWallet')
    } else {
      titleText.value = t('profile.wallet.lblAlreadyHaveWallet')
    }
  }
}, {immediate: true});


const income = () => {
  console.log("income");
}

const withdraw = () => {
  console.log("withdraw")
}


wallet.onAccountsChanged((accounts) => {
  console.log('account changed to: ', accounts[0]);

  const account = accounts[0] ? accounts[0] : '';

  store.dispatch('master/updateMaster', {walletAddress: account});

});

wallet.onChainChanged(async (chainId) => {
  console.log('chain changed to:', chainId);
});


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