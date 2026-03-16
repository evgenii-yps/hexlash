<template>
  <div class="background background-matchmaking">
    <div class="matchmaking-container">
      <div class="matchmaking-content">
        <div class="matchmaking-icon">&#x2694;&#xFE0F;</div>
        <h1 class="matchmaking-title">{{ t.pvp.searchingForOpponent }}</h1>
        <p class="matchmaking-subtitle">{{ t.pvp.playersOnline }}: {{ onlineCount }}</p>
        <button class="matchmaking-back-btn" @click="goBack">{{ t.nav?.back || 'Back' }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import router from '@/router/index.js';
import { t } from '@/locales/index.js';

const onlineCount = computed(() => Math.floor(Math.random() * 50) + 20);

const goBack = () => {
  router.push('/arena');
};
</script>

<style scoped>
.background-matchmaking {
  min-height: 100vh;
  background: #090909;
}

.matchmaking-container {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  color: white;
  padding: 20px;
}

.matchmaking-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}

.matchmaking-icon {
  font-size: 64px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

.matchmaking-title {
  font-family: Anonymous, sans-serif;
  font-size: 1.2rem;
  color: var(--primary-color);
  text-transform: uppercase;
  letter-spacing: 2px;
}

.matchmaking-subtitle {
  font-size: 0.8rem;
  color: var(--gray2);
}

.matchmaking-back-btn {
  margin-top: 24px;
  padding: 12px 32px;
  background: rgba(20, 20, 30, 0.85);
  border: 1px solid rgba(255, 6, 111, 0.4);
  border-radius: 12px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.matchmaking-back-btn:active {
  border-color: #FF066F;
  box-shadow: 0 0 20px rgba(255, 6, 111, 0.3);
}
</style>
