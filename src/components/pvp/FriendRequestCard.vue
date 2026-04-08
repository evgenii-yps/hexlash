<template>
  <div class="request-card">
    <div class="request-avatar"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="var(--hex-text-secondary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M3 21c0-5 4-9 9-9s9 4 9 9"/></svg></div>

    <div class="request-info">
      <div class="request-name">{{ request.username }}</div>
      <div class="request-rating">{{ ratingText }}: {{ request.rating }}</div>
    </div>

    <div class="request-actions">
      <button class="accept-btn" @click="$emit('accept', request)">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--hex-victory)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="4,12 10,18 20,6"/></svg> {{ acceptText }}
      </button>
      <button class="decline-btn" @click="$emit('decline', request)">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--hex-danger)" stroke-width="2.5" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg> {{ declineText }}
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  request: { type: Object, required: true },
  acceptText: { type: String, default: 'Accept' },
  declineText: { type: String, default: 'Decline' },
  ratingText: { type: String, default: 'Rating' },
});

defineEmits(['accept', 'decline']);
</script>

<style scoped>
.request-card {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  background: color-mix(in srgb, var(--hex-warning) 5%, transparent);
  border: 1px solid color-mix(in srgb, var(--hex-warning) 30%, transparent);
  border-radius: 12px;
  margin-bottom: 12px;
  transition: all 0.2s ease;
}

.request-card:hover {
  border-color: color-mix(in srgb, var(--hex-warning) 60%, transparent);
  background: color-mix(in srgb, var(--hex-warning) 10%, transparent);
}

.request-avatar {
  margin-right: 14px;
  display: flex;
  align-items: center;
}

.request-info {
  flex: 1;
}

.request-name {
  font-weight: 600;
  font-size: 16px;
  color: var(--hex-text-primary);
  margin-bottom: 2px;
}

.request-rating {
  font-size: 12px;
  color: var(--hex-text-muted);
}

.request-actions {
  display: flex;
  gap: 10px;
}

.accept-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: color-mix(in srgb, var(--hex-victory) 15%, transparent);
  border: 1px solid var(--hex-victory);
  border-radius: 8px;
  color: var(--hex-victory);
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.accept-btn:hover {
  background: var(--hex-victory);
  color: var(--hex-bg-dark);
}

.decline-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: color-mix(in srgb, var(--hex-danger) 10%, transparent);
  border: 1px solid var(--hex-danger);
  border-radius: 8px;
  color: var(--hex-danger);
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.decline-btn:hover {
  background: var(--hex-danger);
  color: var(--hex-text-primary);
}
</style>
