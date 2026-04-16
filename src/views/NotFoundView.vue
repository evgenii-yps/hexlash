<template>
  <div class="background">
    <div class="not-found-container">
      <h1>{{ t.errors.pageNotFound }}</h1>
      <p>{{ t.errors.error404Code }}</p>
    </div>
  </div>
</template>

<script setup>
import {t} from '@/locales/index.js';
</script>

<style scoped>
.not-found-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  text-align: center;
}

h1 {
  font-family: var(--hex-font-display);
  font-size: 3rem;
  margin-bottom: 1rem;
  color: var(--hex-text-primary);
}

p {
  font-family: var(--hex-font-display);
  font-size: 5rem;
  color: var(--hex-text-primary);
}
</style>
