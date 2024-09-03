<template>
  <div class="logo-container">
    <img width="68" height="50" src="@/assets/images/logo.svg" alt="logo" @click="goToHome"/>
  </div>
</template>

<script setup>
import router from "@/router/index.js";

const goToHome = () => {
  router.push('/');
};
</script>

<style>
.logo-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
}

.logo-container img {
  margin: 17px auto 0 17px;
}
</style>
