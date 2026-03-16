<template>
  <div class="background background-friends">
    <div class="friends-container" @scroll="handleScroll">
      <div class="friends-content-wrapper">

        <button class="back-btn" @click="goBack">&larr; Back</button>

        <div class="friends-header">
          <span class="friends-title">FRIENDS</span>
        </div>

        <!-- Search -->
        <div class="search-input-container">
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

        <!-- Friends list -->
        <div v-if="searchQuery.length < 3 && friends.length > 0" class="friends-list">
          <div class="section-label">FRIENDS ({{ friends.length }})</div>
          <PlayerSearchResult
            v-for="friend in friends"
            :key="friend.id"
            :player="friend"
            :is-friend="true"
            @remove="onRemoveFriend"
          />
        </div>

        <!-- Empty state (only when not searching and no friends) -->
        <div v-if="searchQuery.length < 3 && friends.length === 0" class="empty-state">
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
import { ref, computed, onMounted } from 'vue';
import store from '@/core/state/store.js';
import router from '@/router/index.js';
import PlayerSearchResult from '@/components/pvp/PlayerSearchResult.vue';

const searchQuery = ref('');
const searchResults = ref([]);

const friends = computed(() => store.getters['friends/getFriends']);

// Reactively search when query changes
import { watch } from 'vue';
watch(searchQuery, async (q) => {
  searchResults.value = await store.dispatch('friends/searchPlayers', q);
});

const onAddPlayer = (player) => {
  store.dispatch('friends/sendFriendRequest', player);
};

const onRemoveFriend = (player) => {
  store.dispatch('friends/removeFriend', player.id);
};

onMounted(() => {
  store.dispatch('friends/init');
});

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
.search-input-container {
  position: relative;
  margin-bottom: 24px;
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
  font-size: 18px;
  pointer-events: none;
}

.search-input {
  width: 100%;
  box-sizing: border-box;
  padding: 14px 16px 14px 48px;
  background: rgba(20, 20, 30, 0.8);
  border: 1px solid #444;
  border-radius: 12px;
  color: #fff;
  font-size: 16px;
  outline: none;
  transition: all 0.2s ease;
}

.search-input::placeholder {
  color: #666;
}

.search-input:focus {
  border-color: #FF066F;
  box-shadow: 0 0 15px rgba(255, 6, 111, 0.3);
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
