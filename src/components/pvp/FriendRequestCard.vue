<template>
  <div class="request-card">
    <div class="request-avatar">&#x1F464;</div>

    <div class="request-info">
      <div class="request-name">{{ request.username }}</div>
      <div class="request-rating">Rating: {{ request.rating }}</div>
    </div>

    <div class="request-actions">
      <button class="accept-btn" @click="$emit('accept', request)">
        &#x2713; Accept
      </button>
      <button class="decline-btn" @click="$emit('decline', request)">
        &#x2716; Decline
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  request: { type: Object, required: true }
});

defineEmits(['accept', 'decline']);
</script>

<style scoped>
.request-card {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  background: rgba(255, 184, 0, 0.05);
  border: 1px solid rgba(255, 184, 0, 0.3);
  border-radius: 12px;
  margin-bottom: 12px;
  transition: all 0.2s ease;
}

.request-card:hover {
  border-color: rgba(255, 184, 0, 0.6);
  background: rgba(255, 184, 0, 0.1);
}

.request-avatar {
  font-size: 28px;
  margin-right: 14px;
}

.request-info {
  flex: 1;
}

.request-name {
  font-weight: 600;
  font-size: 16px;
  color: #fff;
  margin-bottom: 2px;
}

.request-rating {
  font-size: 12px;
  color: #888;
}

.request-actions {
  display: flex;
  gap: 10px;
}

.accept-btn {
  padding: 8px 16px;
  background: rgba(0, 255, 136, 0.15);
  border: 1px solid #00FF88;
  border-radius: 8px;
  color: #00FF88;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.accept-btn:hover {
  background: #00FF88;
  color: #000;
}

.decline-btn {
  padding: 8px 16px;
  background: rgba(255, 51, 51, 0.1);
  border: 1px solid #FF3333;
  border-radius: 8px;
  color: #FF3333;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.decline-btn:hover {
  background: #FF3333;
  color: #fff;
}
</style>
