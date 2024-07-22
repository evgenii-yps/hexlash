<template>
  <div>
    <v-btn color="blue darken-1" @click="linkWallet">Привязать кошелек</v-btn>
    <br/>
    <p style="color:white;">or</p>
    <br/>
    <v-btn color="green darken-1" @click="createWallet">Создать новый кошелек</v-btn>
  </div>
</template>

<script setup>
const linkWallet = () => {
  // Логика для привязки кошелька
};

const createWallet = () => {
  // Логика для создания нового кошелька
};
</script>

<style scoped>
.v-btn {
  margin: 5px;
}
</style>
