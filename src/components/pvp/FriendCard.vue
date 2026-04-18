<template>
  <div class="friend-card" :class="{ 'is-fighting': friend.status === 'in_fight' }">
    <div class="friend-avatar"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="var(--hex-text-secondary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M3 21c0-5 4-9 9-9s9 4 9 9"/></svg></div>

    <div class="friend-info">
      <div class="friend-name">{{ friend.username }}</div>
      <UserCaptainBadge :captain="friend.captain" size="sm" />
      <div v-if="friend.status === 'in_fight' && friend.currentFight" class="fight-info">
        vs {{ friend.currentFight.opponent }}
      </div>
    </div>

    <div class="friend-status" :class="statusClass">
      <span class="status-dot"></span>
      {{ statusText }}
    </div>

    <div class="friend-actions">
      <button v-if="friend.status === 'in_fight'" class="action-btn watch-btn" @click="$emit('watch', friend)">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--hex-warning)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
      </button>
      <button v-else-if="isPendingChallenge" class="action-btn challenge-pending-btn" disabled>
        <span class="spinner"></span>
      </button>
      <button v-else class="action-btn fight-btn" @click="$emit('challenge', friend)" :disabled="friend.status === 'offline'">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--hex-text-secondary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="20" x2="14" y2="10"/><line x1="14" y1="10" x2="17" y2="7"/><line x1="17" y1="7" x2="21" y2="3"/><line x1="18" y1="6" x2="21" y2="3"/><line x1="20" y1="4" x2="14" y2="10"/><line x1="10" y1="14" x2="20" y2="4"/><line x1="3" y1="21" x2="10" y2="14"/><line x1="7" y1="17" x2="3" y2="21"/></svg>
      </button>

      <button class="action-btn remove-btn" @click="$emit('remove', friend)">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--hex-danger)" stroke-width="2" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import store from '@/core/state/store.js';
import UserCaptainBadge from '@/components/ui/UserCaptainBadge.vue';

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
  background: color-mix(in srgb, var(--hex-bg-dark) 70%, transparent);
  border: 1px solid var(--hex-border-strong);
  border-radius: 12px;
  margin-bottom: 12px;
  transition: all 0.2s ease;
}

.friend-card:hover {
  border-color: var(--hex-border-active);
  background: var(--hex-bg-light);
}

.friend-card.is-fighting {
  border-color: color-mix(in srgb, var(--hex-warning) 50%, transparent);
  background: color-mix(in srgb, var(--hex-warning) 5%, transparent);
}

.friend-avatar {
  margin-right: 14px;
  display: flex;
  align-items: center;
}

.friend-info {
  flex: 1;
}

.friend-name {
  font-weight: 600;
  font-size: 16px;
  color: var(--hex-text-primary);
  margin-bottom: 2px;
}

.friend-rating {
  font-size: 12px;
  color: var(--hex-text-muted);
}

.fight-info {
  font-size: 11px;
  color: var(--hex-warning);
  margin-top: 4px;
  font-style: italic;
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
  background: var(--hex-victory);
  box-shadow: 0 0 8px color-mix(in srgb, var(--hex-victory) 60%, transparent);
}

.status-online {
  color: var(--hex-victory);
}

.status-offline .status-dot {
  background: var(--hex-text-muted);
}

.status-offline {
  color: var(--hex-text-muted);
}

.status-in-fight .status-dot {
  background: var(--hex-warning);
  box-shadow: 0 0 8px color-mix(in srgb, var(--hex-warning) 60%, transparent);
  animation: fightPulse 1s ease-in-out infinite;
}

.status-in-fight {
  color: var(--hex-warning);
}

@keyframes fightPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
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
  background: color-mix(in srgb, var(--hex-bg-medium) 80%, transparent);
  border: 1px solid var(--hex-border-strong);
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.fight-btn:hover:not(:disabled) {
  border-color: var(--hex-border-active);
  background: var(--hex-bg-light);
}

.watch-btn {
  border-color: var(--hex-warning);
  background: color-mix(in srgb, var(--hex-warning) 10%, transparent);
}

.watch-btn:hover {
  background: color-mix(in srgb, var(--hex-warning) 30%, transparent);
  box-shadow: 0 0 15px color-mix(in srgb, var(--hex-warning) 40%, transparent);
}

.remove-btn:hover {
  border-color: var(--hex-danger);
  background: color-mix(in srgb, var(--hex-danger) 20%, transparent);
}

.challenge-pending-btn {
  background: color-mix(in srgb, var(--hex-warning) 20%, transparent) !important;
  border-color: var(--hex-warning) !important;
  cursor: wait !important;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top-color: var(--hex-warning);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
