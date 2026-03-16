<template>
  <div class="friend-card">
    <div class="friend-avatar">&#x1F464;</div>

    <div class="friend-info">
      <div class="friend-name">{{ friend.username }}</div>
      <div class="friend-rating">{{ ratingText }}: {{ friend.rating }}</div>
    </div>

    <div class="friend-status" :class="statusClass">
      <span class="status-dot"></span>
      {{ statusText }}
    </div>

    <div class="friend-actions">
      <button v-if="friend.status === 'in_fight'" class="action-btn watch-btn" @click="$emit('watch', friend)">
        &#x1F441;&#xFE0F;
      </button>
      <button v-else-if="isPendingChallenge" class="action-btn challenge-pending-btn" disabled>
        <span class="spinner"></span>
      </button>
      <button v-else class="action-btn fight-btn" @click="$emit('challenge', friend)" :disabled="friend.status === 'offline'">
        &#x2694;&#xFE0F;
      </button>

      <button class="action-btn remove-btn" @click="$emit('remove', friend)">
        &#x2716;&#xFE0F;
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import store from '@/core/state/store.js';

const props = defineProps({
  friend: { type: Object, required: true },
  statusTexts: { type: Object, default: () => ({ online: 'Online', offline: 'Offline', in_fight: 'In Fight' }) },
  ratingText: { type: String, default: 'Rating' },
});

defineEmits(['challenge', 'watch', 'remove']);

const statusClass = computed(() => ({
  'status-online': props.friend.status === 'online',
  'status-offline': props.friend.status === 'offline',
  'status-in-fight': props.friend.status === 'in_fight',
}));

const statusText = computed(() => props.statusTexts[props.friend.status] || props.friend.status);

const isPendingChallenge = computed(() => store.getters['friends/hasPendingChallenge'](props.friend.id));
</script>

<style scoped>
.friend-card {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  background: rgba(20, 20, 30, 0.7);
  border: 1px solid #333;
  border-radius: 12px;
  margin-bottom: 12px;
  transition: all 0.2s ease;
}

.friend-card:hover {
  border-color: rgba(255, 6, 111, 0.5);
  background: rgba(255, 6, 111, 0.05);
}

.friend-avatar {
  font-size: 28px;
  margin-right: 14px;
}

.friend-info {
  flex: 1;
}

.friend-name {
  font-weight: 600;
  font-size: 16px;
  color: #fff;
  margin-bottom: 2px;
}

.friend-rating {
  font-size: 12px;
  color: #888;
}

.friend-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  margin-right: 16px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-online .status-dot {
  background: #00FF88;
  box-shadow: 0 0 8px rgba(0, 255, 136, 0.6);
}

.status-online {
  color: #00FF88;
}

.status-offline .status-dot {
  background: #666;
}

.status-offline {
  color: #666;
}

.status-in-fight .status-dot {
  background: #FFB800;
  box-shadow: 0 0 8px rgba(255, 184, 0, 0.6);
}

.status-in-fight {
  color: #FFB800;
}

.friend-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(30, 30, 40, 0.8);
  border: 1px solid #444;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.fight-btn:hover:not(:disabled), .watch-btn:hover {
  border-color: #FF066F;
  background: rgba(255, 6, 111, 0.2);
}

.remove-btn:hover {
  border-color: #FF3333;
  background: rgba(255, 51, 51, 0.2);
}

.challenge-pending-btn {
  background: rgba(255, 184, 0, 0.2) !important;
  border-color: #FFB800 !important;
  cursor: wait !important;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top-color: #FFB800;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
