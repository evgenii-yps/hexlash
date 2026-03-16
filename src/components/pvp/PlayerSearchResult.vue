<template>
  <div class="search-result-card">
    <div class="player-avatar">&#x1F464;</div>
    <div class="player-info">
      <span class="player-name">{{ player.username }}</span>
      <span class="player-rating">Rating: {{ player.rating }}</span>
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
.search-result-card {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: rgba(20, 20, 30, 0.7);
  border: 1px solid #333;
  border-radius: 10px;
  margin-bottom: 10px;
  transition: all 0.2s ease;
}

.search-result-card:hover {
  border-color: #FF066F;
  background: rgba(255, 6, 111, 0.1);
}

.player-avatar {
  font-size: 24px;
  margin-right: 12px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
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
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-rating {
  font-size: 12px;
  color: #888;
}

.add-btn {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid #FF066F;
  border-radius: 6px;
  color: #FF066F;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.add-btn:hover {
  background: #FF066F;
  color: #fff;
}
</style>
