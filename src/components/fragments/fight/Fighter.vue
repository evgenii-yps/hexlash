<template>
  <div class="fighter-container">
    <img :src="fighterImage" alt="Fighter" class="fighter-image"/>
    <div class="actions">
      <div class="action" v-for="action in actions" :key="action" @click="selectAction(action)">
        {{ action }}
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  actions: {
    type: Array,
    required: true
  }
});

const emits = defineEmits(['actionSelected']);

const fighterImage = require('@/assets/images/fighter.png');

const selectAction = (action) => {
  emits('actionSelected', action);
};
</script>

<style scoped>
.fighter-container {
  position: relative;
  display: inline-block;
  text-align: center;
}

.fighter-image {
  width: 150px;
  height: 300px;
}

.actions {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}

.action {
  margin: 0 5px;
  padding: 10px;
  background-color: #ff4d4d;
  color: white;
  cursor: pointer;
  border-radius: 5px;
  transition: background-color 0.3s ease;
}

.action:hover {
  background-color: #ff1a1a;
}
</style>
