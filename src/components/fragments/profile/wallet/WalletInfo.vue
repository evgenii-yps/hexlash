<template>
  <div>
    <p class="wallet-info">Адрес кошелька: {{ walletAddress }}</p>
    <p class="wallet-info">Баланс кошелька: {{ walletBalance }}</p>
    <button @click="depositToGame">Завести в игру</button>
    <button @click="withdrawToWallet">Вывести на кошелек</button>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const walletAddress = ref('0x434a1253bAf9EE7552fd6b0Af973B7E312cb5fCf');
const walletBalance = ref('100');

const depositToGame = () => {
  // Логика для заведения средств в игру
};

const withdrawToWallet = () => {
  // Логика для вывода средств на кошелек
};
</script>

<style scoped>
.wallet-info {
  color: white;
  display: block;
  margin-bottom: 10px;
}

button {
  margin: 5px;
  display: block;
}
</style>
