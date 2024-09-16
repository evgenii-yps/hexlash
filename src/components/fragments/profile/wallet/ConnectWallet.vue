<template>
  <div class="connect-wallet">
    <div class="button-container">
      <v-tooltip location="top"
                 max-width="250px"
                 contentClass="v-tooltip__content">
        <template #activator="{ props }">
          <VBtnDark v-bind="props" size="x-large" @click="switchAccount" class="input-button">
            {{ buttonText }}
          </VBtnDark>
        </template>
        <span>{{ t('profile.wallet.msgConnectWalletTooltip') }}</span>
      </v-tooltip>
    </div>
  </div>
</template>

<script setup>
import {useI18n} from "vue-i18n";
import {computed} from "vue";

const { t } = useI18n({ useScope: 'global' })

import {useDisconnect, useWeb3Modal, useWeb3ModalAccount} from '@web3modal/ethers/vue'

const { address } = useWeb3ModalAccount();
const { disconnect } = useDisconnect()
const { open, close } = useWeb3Modal()

// Создаем computed-свойство для отслеживания address
const walletAddress = computed(() => address.value);

const buttonText = computed(() => {
  return address.value
      ? t('profile.wallet.lblReconnectWallet') // Текст для кнопки "Реконнект"
      : t('profile.wallet.lblConnectWallet'); // Текст для кнопки "Подключить кошелек"
});

const switchAccount = async () => {
  // Отключаем текущий аккаунт, если он подключен
  if (address.value) {
    await disconnect();
  }
  // После отключения открываем окно для подключения кошелька
  await open();
};

</script>

<style scoped>
.connect-wallet {
  color: white;
  display: block;
  max-width: 500px;
  margin: 2rem auto 0 auto;
  text-align: center; /* Выровнять текст по центру */
}

.button-container {
  display: flex;
  justify-content: center;
  gap: 1rem; /* Расстояние между кнопками */
  margin-top: 1rem;
}

.input-button {
  border: 1px solid var(--gray1);
  color: var(--gray2);
  font-size: 1rem;
  cursor: pointer;
}
</style>
