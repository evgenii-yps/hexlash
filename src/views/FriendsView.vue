<template>
  <div class="background background-friends">
    <div class="friends-container" @scroll="handleScroll">
      <div class="friends-content-wrapper">

        <button class="back-btn" @click="goBack">&larr; {{ t.friends.back }}</button>

        <div class="friends-header">
          <span class="friends-title">{{ t.friends.title }}</span>
        </div>

        <!-- Search -->
        <div class="search-input-container">
          <span class="search-icon">&#x1F50D;</span>
          <input
            v-model="searchQuery"
            class="search-input"
            type="text"
            :placeholder="t.friends.searchPlaceholder"
          />
        </div>

        <!-- Search results -->
        <div v-if="searchQuery.length >= 3" class="search-results">
          <div class="section-label">{{ t.friends.searchResults }}</div>
          <PlayerSearchResult
            v-for="player in searchResults"
            :key="player.id"
            :player="player"
            :addText="t.friends.add"
            :pendingText="t.friends.pending"
            :ratingText="t.friends.rating"
            @add="onAddPlayer"
          />
          <div v-if="searchResults.length === 0" class="no-results">
            {{ t.friends.noResults }}
          </div>
        </div>

        <!-- Friend Requests -->
        <div v-if="searchQuery.length < 3 && incomingRequests.length > 0" class="section">
          <div class="section-header">
            <span class="section-icon">&#x1F4E9;</span>
            {{ t.friends.friendRequests }} ({{ incomingRequests.length }})
          </div>
          <FriendRequestCard
            v-for="request in incomingRequests"
            :key="request.id"
            :request="request"
            :acceptText="t.friends.accept"
            :declineText="t.friends.decline"
            :ratingText="t.friends.rating"
            @accept="onAccept"
            @decline="onDecline"
          />
        </div>

        <!-- Friends list -->
        <div v-if="searchQuery.length < 3 && friends.length > 0" class="section">
          <div class="section-header">
            {{ t.friends.title }} ({{ friends.length }})
          </div>
          <FriendCard
            v-for="friend in sortedFriends"
            :key="friend.id"
            :friend="friend"
            :statusTexts="{ online: t.friends.online, offline: t.friends.offline, in_fight: t.friends.inFight }"
            :ratingText="t.friends.rating"
            @challenge="onChallenge"
            @watch="onWatch"
            @remove="onRemoveFriend"
          />
        </div>

        <!-- Empty state (only when not searching, no friends, no requests) -->
        <div v-if="searchQuery.length < 3 && friends.length === 0 && incomingRequests.length === 0" class="empty-state">
          <div class="empty-icon">&#x1F465;</div>
          <div class="empty-text">{{ t.friends.noFriends }}</div>
          <div class="empty-hint">{{ t.friends.searchToAdd }}</div>
        </div>

        <!-- Test button for simulating incoming challenge -->
        <button class="test-challenge-btn" @click="onTestChallenge">
          Test Incoming Challenge
        </button>

        <div class="scroll-gap"/>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import store from '@/core/state/store.js';
import router from '@/router/index.js';
import { t } from '@/locales/index.js';
import PlayerSearchResult from '@/components/pvp/PlayerSearchResult.vue';
import FriendCard from '@/components/pvp/FriendCard.vue';
import FriendRequestCard from '@/components/pvp/FriendRequestCard.vue';

const searchQuery = ref('');
const searchResults = ref([]);

const friends = computed(() => store.getters['friends/getFriends']);
const incomingRequests = computed(() => store.getters['friends/getIncomingRequests']);

const sortedFriends = computed(() => {
  const order = { 'online': 0, 'in_fight': 1, 'offline': 2 };
  return [...friends.value].sort((a, b) => (order[a.status] ?? 3) - (order[b.status] ?? 3));
});

watch(searchQuery, async (q) => {
  searchResults.value = await store.dispatch('friends/searchPlayers', q);
});

const onAddPlayer = (player) => {
  store.dispatch('friends/sendFriendRequest', player);
};

const onRemoveFriend = (friend) => {
  store.dispatch('friends/removeFriend', friend.id);
};

const onChallenge = (friend) => {
  store.dispatch('friends/sendChallenge', friend);
};

const onTestChallenge = () => {
  store.dispatch('friends/simulateIncomingChallenge');
};

const onWatch = (friend) => {
  router.push({
    path: `/spectate/${friend.id}`,
    query: { odName: friend.currentFight?.opponent },
  });
};

const onAccept = (request) => {
  store.dispatch('friends/acceptFriendRequest', request.id);
};

const onDecline = (request) => {
  store.dispatch('friends/declineFriendRequest', request.id);
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

/* Sections */
.section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: Anonymous, sans-serif;
  font-size: 14px;
  color: #FF066F;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 6, 111, 0.3);
}

.section-icon {
  font-size: 16px;
}

/* Search results */
.search-results {
  margin-bottom: 20px;
}

.search-results .section-label {
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

.test-challenge-btn {
  width: 100%;
  padding: 14px;
  background: rgba(255, 184, 0, 0.15);
  border: 1px dashed #FFB800;
  border-radius: 12px;
  color: #FFB800;
  font-family: Anonymous, sans-serif;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  margin-top: 24px;
  transition: all 0.2s ease;
}

.test-challenge-btn:hover {
  background: rgba(255, 184, 0, 0.25);
}

.scroll-gap {
  display: block;
  position: relative;
  height: 150px;
}
</style>
