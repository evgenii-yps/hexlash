<template>
  <div class="logo-container">
    <span class="logo-text" @click="goToHome">HEXLASH</span>
  </div>
</template>

<script setup>
import router from "@/router/index.js";

const goToHome = () => {
  router.push('/');
};
</script>

<style scoped>
.logo-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
}

.logo-text {
  font-family: 'Saira Condensed', -apple-system, sans-serif;
  font-size: 1.6em;
  font-weight: 900;
  text-transform: uppercase;
  color: var(--ink);
  letter-spacing: 0.04em;
  margin: 16px auto 0 16px;
  cursor: pointer;
  user-select: none;
}
</style>
