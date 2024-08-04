<template>
  <div class="no-wallet">
    <p>{{ titleText }}</p>

    <div class="button-container">
      <v-tooltip location="top"
                 max-width="250px"
                 contentClass="v-tooltip__content">
        <template #activator="{ props }">
          <VBtnDark v-bind="props" @click="createNewWallet" class="input-button">
            Create new wallet
          </VBtnDark>
        </template>
        <span>Создать новый кошелек, приватный ключ будет храниться на сервере в зашифрованном виде, ты сможешь восстановить приватный ключ</span>
      </v-tooltip>

      <v-tooltip location="top"
                 max-width="250px"
                 contentClass="v-tooltip__content">
        <template #activator="{ props }">
          <VBtnDark v-bind="props" @click="connectWallet" class="input-button">
            Connect your wallet
          </VBtnDark>
        </template>
        <span>Подключить ваш кошелек, мы не будем знать ваш приватный ключ и не сможем восстановить доступ к вашим средствам</span>
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



const props = defineProps({
  titleText: {
    type: String,
    required: true
  }
});

const createNewWallet = () => {
  console.log("createNewWallet");
  // TODO Отправляем запрос на сервер апи для создания кошелька
}

const connectWallet = () => {
  switchAccount();
}
</script>

<style scoped>
.no-wallet {
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
  font-size: 0.8rem;
  cursor: pointer;
}
</style>
