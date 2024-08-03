<template>
  <VCard class="game-card">
    <p>{{ balance }}</p>
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

.balance-card h3 {
  margin: 0 0 8px;
  font-size: 1.2em;
}

.balance-card p {
  margin: 0;
  font-size: 1em;
  color: #333;
}
</style>
