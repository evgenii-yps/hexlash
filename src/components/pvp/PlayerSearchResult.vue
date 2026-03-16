<template>
  <div class="search-result" @click="$emit('add', player)">
    <div class="result-avatar">&#x1F464;</div>
    <div class="result-info">
      <span class="result-name">{{ player.username }}</span>
      <span class="result-rating">Rating: {{ player.rating }}</span>
    </div>
    <button class="add-btn" @click.stop="$emit('add', player)">+ Add</button>
  </div>
</template>

<script setup>
defineProps({
  player: { type: Object, required: true }
});

defineEmits(['add']);
</script>

<style scoped>
.search-result {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.search-result:hover {
  border-color: rgba(255, 6, 111, 0.4);
}

.result-avatar {
  font-size: 1.6rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 50%;
  flex-shrink: 0;
}

.result-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.result-name {
  font-size: 0.95rem;
  color: white;
  font-weight: bold;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-rating {
  font-size: 0.8rem;
  color: var(--gray2);
  font-family: system-ui, sans-serif;
}

.add-btn {
  background: transparent;
  border: 1px solid rgba(255, 6, 111, 0.4);
  color: var(--primary-color);
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 0.85rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.add-btn:hover {
  background: rgba(255, 6, 111, 0.15);
}

.add-btn:active {
  background: var(--primary-color);
  color: white;
}
</style>
