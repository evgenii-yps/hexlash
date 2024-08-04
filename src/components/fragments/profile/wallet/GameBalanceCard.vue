<template>
  <VCard class="game-card">
    <h3>GAME BALANCE</h3>
    <p>{{ balance }}</p>
    <img src="@/assets/images/icon_money_out.svg" alt=""/>
    <div class="desc">Вывести на кошелек</div>
  </VCard>
</template>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  balance: {
    type: String,
    required: true
  }
});
</script>

<style scoped>
.game-card {
  border: none !important;
  padding: 16px;
  width: 220px;
  text-align: center;
}

.game-card h3 {
  margin: 0 0 8px;
  font-size: 0.8em;
  text-align: center;
  text-transform: capitalize;
}

.game-card p {
  margin: 0;
  font-size: 2.5em;
  color: var(--primary-color);
}

.game-card img{
  margin-top: 1.5em;
  width: 40px;
}

.desc {
  font-size: 1em;
  color: white;
  padding: 10px 0 20px;
  text-align: center;
  width: 150px;
  margin: 0 auto;
}
</style>
