<template>
</template>

<script setup>

</script>

<style scoped>
.background_create_club {
  background: url('@/assets/images/background_club.webp') no-repeat center center;
}

.background_create_club::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to left top, black 40%, transparent 75%);
  z-index: 1;
}

.background_create_club::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: black;
  z-index: 2;
  opacity: 1;
  animation: fadeOut 1s forwards;
}

@keyframes fadeOut {
  to {
    opacity: 0;
  }
}

.create-club-container {
  position: relative;
  z-index: 10;
  overflow-y: auto;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.create-club-content-wrapper {
  width: 100%;
  padding: 10vh 0;
  box-sizing: border-box;
}

</style>
