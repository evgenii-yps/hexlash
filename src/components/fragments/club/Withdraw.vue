<template>
  <div class="owner-controls">
    <button @click="withdraw">Вывести токены</button>
  </div>
</template>

<script setup>


const withdraw = () => {
  // Логика вывода
};
</script>

<style scoped>
.owner-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.owner-controls button {
  padding: 10px 20px;
  cursor: pointer;
}
</style>
