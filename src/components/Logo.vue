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
  font-family: 'Anonymous', 'Courier New', Consolas, monospace;
  font-size: 1.6em;
  color: var(--hex-primary);
  letter-spacing: 3px;
  margin: 17px auto 0 17px;
  cursor: pointer;
  text-shadow: 0 0 8px var(--hex-primary-glow);
  user-select: none;
}
</style>
