<template>
  <div class="background background-friends">
    <div class="friends-container" @scroll="handleScroll">
      <div class="friends-content-wrapper">

        <button class="back-btn" @click="goBack">&larr; Back</button>

        <div class="friends-header">
          <span class="friends-title">FRIENDS</span>
        </div>

        <!-- Search -->
        <div class="search-wrapper">
          <span class="search-icon">&#x1F50D;</span>
          <input
            v-model="searchQuery"
            class="search-input"
            type="text"
            placeholder="Search by username..."
          />
        </div>

        <!-- Search results -->
        <div v-if="searchQuery.length >= 3" class="search-results">
          <div class="section-label">SEARCH RESULTS</div>
          <PlayerSearchResult
            v-for="player in searchResults"
            :key="player.id"
            :player="player"
            @add="onAddPlayer"
          />
          <div v-if="searchResults.length === 0" class="no-results">
            Player not found
          </div>
        </div>

        <!-- Empty state (only when not searching) -->
        <div v-if="searchQuery.length < 3" class="empty-state">
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
import { ref, computed } from 'vue';
import router from '@/router/index.js';
import PlayerSearchResult from '@/components/pvp/PlayerSearchResult.vue';

const searchQuery = ref('');

const mockPlayers = [
  { id: 'p1', username: 'Shadow_X', rating: 1280 },
  { id: 'p2', username: 'ShadowKnight', rating: 980 },
  { id: 'p3', username: 'NightFury', rating: 1150 },
  { id: 'p4', username: 'IronFist', rating: 1420 },
  { id: 'p5', username: 'DarkPhoenix', rating: 1650 }
];

const searchResults = computed(() => {
  if (searchQuery.value.length < 3) return [];
  const q = searchQuery.value.toLowerCase();
  return mockPlayers.filter(p => p.username.toLowerCase().includes(q));
});

const onAddPlayer = (player) => {
  // TODO: implement add friend logic
  console.log('Add friend:', player.username);
};

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

/* Search */
.search-wrapper {
  position: relative;
  margin-bottom: 20px;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1rem;
  opacity: 0.6;
  pointer-events: none;
}

.search-input {
  width: 100%;
  box-sizing: border-box;
  padding: 12px 16px 12px 42px;
  background: rgba(9, 9, 9, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: white;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;
}

.search-input::placeholder {
  color: var(--gray2);
}

.search-input:focus {
  border-color: var(--primary-color);
}

/* Search results */
.search-results {
  margin-bottom: 20px;
}

.section-label {
  font-family: Anonymous, sans-serif;
  font-size: 0.8rem;
  color: var(--gray2);
  letter-spacing: 1.5px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.no-results {
  text-align: center;
  color: var(--gray2);
  font-size: 0.95rem;
  padding: 30px 0;
}

/* Empty state */
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
