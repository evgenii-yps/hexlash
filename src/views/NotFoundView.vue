<template>
  <div class="background">
    <div class="not-found-container">
      <h1>Page not found</h1>
      <p>ERROR 404</p>
    </div>
  </div>
</template>

<script setup>

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
  font-family: Anonymous, sans-serif;
  font-size: 3rem;
  margin-bottom: 1rem;
  color: white;
}

p {
  font-family: Anonymous, sans-serif;
  font-size: 5rem;
  color: white;
}
</style>
