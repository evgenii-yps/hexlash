<template>
  <div class="search-result-card">
    <div class="player-avatar"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="var(--hex-text-secondary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M3 21c0-5 4-9 9-9s9 4 9 9"/></svg></div>
    <div class="player-info">
      <span class="player-name">{{ player.username }}</span>
    </div>
    <span v-if="isPending" class="pending-badge">{{ pendingText }}</span>
    <button v-else class="add-btn" @click.stop="$emit('add', player)">+ {{ addText }}</button>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import store from '@/core/state/store.js';

const props = defineProps({
  player: { type: Object, required: true },
  addText: { type: String, default: 'Add' },
  pendingText: { type: String, default: 'Pending' },
  ratingText: { type: String, default: 'Rating' },
});

defineEmits(['add']);

const isPending = computed(() => store.getters['friends/isRequestPending'](props.player.id));
</script>

<style scoped>
.search-result-card {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: color-mix(in srgb, var(--hex-bg-dark) 70%, transparent);
  border: 1px solid var(--hex-border-strong);
  border-radius: 10px;
  margin-bottom: 10px;
  transition: all 0.2s ease;
}

.search-result-card:hover {
  border-color: var(--hex-border-active);
  background: var(--hex-bg-light);
}

.player-avatar {
  margin-right: 12px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--hex-text-primary) 5%, transparent);
  border-radius: 50%;
  flex-shrink: 0;
}

.player-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.player-name {
  font-weight: 600;
  color: var(--hex-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-rating {
  font-size: 12px;
  color: var(--hex-text-muted);
}

.add-btn {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid var(--hex-primary);
  border-radius: 6px;
  color: var(--hex-primary);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.add-btn:hover {
  background: var(--hex-primary);
  color: var(--hex-text-primary);
}

.pending-badge {
  padding: 8px 16px;
  background: color-mix(in srgb, var(--hex-warning) 15%, transparent);
  border: 1px solid var(--hex-warning);
  border-radius: 6px;
  color: var(--hex-warning);
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}
</style>
