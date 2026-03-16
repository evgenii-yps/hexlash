<template>
  <div class="background background-spectate">
    <div class="spectate-container">
      <div class="spectate-content">
        <div class="spectate-icon">&#x1F441;&#xFE0F;</div>
        <h1 class="spectate-title">{{ t.friends.watching }}</h1>
        <p class="spectate-info">{{ t.pvp.vs }} {{ route.query.odName || '...' }}</p>
        <button class="spectate-back-btn" @click="goBack">&larr; {{ t.friends.back }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router';
import router from '@/router/index.js';
import { t } from '@/locales/index.js';

const route = useRoute();

const goBack = () => {
  router.push('/friends');
};
</script>

<style scoped>
.background-spectate {
  min-height: 100vh;
  background: #090909;
}

.spectate-container {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  color: white;
  padding: 20px;
  text-align: center;
}

.spectate-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.spectate-icon {
  font-size: 48px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

.spectate-title {
  font-family: Anonymous, sans-serif;
  font-size: 28px;
  color: #FFB800;
  text-transform: uppercase;
  letter-spacing: 3px;
  text-shadow: 0 0 20px rgba(255, 184, 0, 0.5);
}

.spectate-info {
  font-size: 14px;
  color: var(--gray2);
}

.spectate-back-btn {
  margin-top: 24px;
  padding: 12px 32px;
  background: rgba(20, 20, 30, 0.85);
  border: 1px solid rgba(255, 184, 0, 0.4);
  border-radius: 12px;
  color: #FFB800;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.spectate-back-btn:active {
  border-color: #FFB800;
  box-shadow: 0 0 20px rgba(255, 184, 0, 0.3);
}
</style>
