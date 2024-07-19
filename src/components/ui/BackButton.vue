<template>
  <button @click="goBack" class="back-button">
    Назад
  </button>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const goBack = () => {
  router.back();
};
</script>

<style scoped>
.back-button {
  background-color: #f0f0f0;
  border: none;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  border-radius: 5px;
  margin: 10px;
}

.back-button:hover {
  background-color: #e0e0e0;
}
</style>
