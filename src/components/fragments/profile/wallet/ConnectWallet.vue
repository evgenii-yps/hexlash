<template>
  <div class="connect-wallet">

    <div class="button-container">
      <v-tooltip location="top"
                 max-width="250px"
                 contentClass="v-tooltip__content">
        <template #activator="{ props }">
          <VBtnDark v-bind="props" size="x-large" @click="switchAccount" class="input-button">
            Connect  wallet
          </VBtnDark>
        </template>
        <span>Подключите ваш кошелек, для покупки или вывода Fight Club токенов</span>
      </v-tooltip>
    </div>
  </div>
</template>

<script setup>


import { useMetaMaskWallet } from "vue-connect-wallet";

const wallet = useMetaMaskWallet();

const switchAccount = async () => {
  await wallet.switchAccounts();
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
