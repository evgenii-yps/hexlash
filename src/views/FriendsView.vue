<template>
  <div class="background background-friends">
    <div class="friends-container" @scroll="handleScroll">
      <div class="friends-content-wrapper">

        <button class="back-btn" @click="goBack">&larr; Back</button>

        <div class="friends-header">
          <span class="friends-title">FRIENDS</span>
        </div>

        <div class="empty-state">
          <div class="empty-icon">&#x1F465;</div>
          <div class="empty-text">No friends yet</div>
          <div class="empty-hint">Search to add friends</div>
        </div>

        <div class="scroll-gap"/>
      </div>
    </div>
  </div>
</template>

<script setup>
import router from '@/router/index.js';

const goBack = async () => {
  await router.push('/arena');
};

const emit = defineEmits(['scroll']);
const handleScroll = (event) => {
  emit('scroll', event.target.scrollTop);
};
</script>

<style scoped>
.background-friends {
  background: url('@/assets/images/background_page.webp') no-repeat center center;
  background-size: cover;
}

.background-friends::before {
  content: "";
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  background: linear-gradient(to bottom, rgba(0,0,0,0.92) 0%, rgba(9,9,9,0.75) 50%, rgba(0,0,0,0.95) 100%);
  z-index: 1;
}

.friends-container {
  position: relative;
  z-index: 10;
  overflow-y: auto;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
  -webkit-overflow-scrolling: auto;
  overscroll-behavior-y: none;
}

@supports (height: 100dvh) {
  .friends-container { height: 100dvh; }
}

.friends-content-wrapper {
  width: 100%;
  box-sizing: border-box;
  max-width: 700px;
  margin: 0 auto;
  padding: 80px 20px 20px;
}

.back-btn {
  background: var(--black-opacity-80);
  border: 1px solid var(--gray1);
  color: var(--gray3);
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 0.95rem;
  cursor: pointer;
  margin-bottom: 16px;
  transition: color 0.2s;
}

.back-btn:hover { color: var(--white); }

.friends-header {
  text-align: center;
  margin-bottom: 20px;
}

.friends-title {
  font-family: Anonymous, sans-serif;
  font-size: 1.4rem;
  color: var(--primary-color);
  letter-spacing: 2px;
  text-shadow: 0 0 10px rgba(255, 6, 111, 0.3);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  gap: 12px;
}

.empty-icon {
  font-size: 3rem;
  opacity: 0.6;
}

.empty-text {
  font-size: 1.1rem;
  color: #888;
  font-family: Anonymous, sans-serif;
}

.empty-hint {
  font-size: 0.85rem;
  color: #666;
}

.scroll-gap {
  display: block;
  position: relative;
  height: 150px;
}
</style>
