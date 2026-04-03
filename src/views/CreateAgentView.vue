<template>
  <div class="background">
    <div class="create-agent-container">
      <h2 class="page-title">Create Agent</h2>
      <p class="page-subtitle">Coming soon</p>
      <button class="back-btn" @click="$router.back()">&larr; Back</button>
    </div>
  </div>
</template>

<style scoped>
.create-agent-container {
  padding: 24px 16px;
  text-align: center;
}
.page-title {
  font-family: 'Anonymous', monospace;
  font-size: 18px;
  color: var(--hex-text-primary);
  margin-bottom: 8px;
}
.page-subtitle {
  font-size: 13px;
  color: var(--hex-text-muted);
  margin-bottom: 24px;
}
.back-btn {
  font-size: 13px;
  color: var(--hex-primary);
  background: none;
  border: none;
  cursor: pointer;
}
</style>
