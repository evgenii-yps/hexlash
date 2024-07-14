<template>
  <div class="card-overlay">
    <div class="card" :style="cardStyles">
      <div class="card-header">
        <h2 class="card-title">{{ title }}</h2>
        <button v-if="showCloseButton" class="close-btn" @click="$emit('close')">✖</button>
      </div>
      <div class="card-content">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, computed } from 'vue';

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  showCloseButton: {
    type: Boolean,
    default: false
  },
  bgColor: {
    type: String,
    default: 'var(--white)'
  },
  borderColor: {
    type: String,
    default: 'var(--gray1)'
  },
  textColor: {
    type: String,
    default: 'var(--dark)'
  },
  borderRadius: {
    type: String,
    default: '4px'
  },
  padding: {
    type: String,
    default: '10px'
  },
  margin: {
    type: String,
    default: '1rem'
  },
  height: {
    type: String,
    default: '80vh'
  }
});

const cardStyles = computed(() => ({
  backgroundColor: props.bgColor,
  borderColor: props.borderColor,
  color: props.textColor,
  borderRadius: props.borderRadius,
  padding: props.padding,
  margin: props.margin,
  height: props.height,
  overflowY: 'auto',
  '--scrollbar-bg': props.bgColor, // добавляем CSS переменную для фона скролла
  '--scrollbar-thin': props.borderColor // добавляем CSS переменную для фона скролла
}));

</script>

<style scoped>
@font-face {
  font-family: 'Anonymous';
  src: url('@/assets/fonts/Anonymous.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

.card-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  overflow: hidden; /* убираем скролл для overlay */
}

.card {
  display: flex;
  flex-direction: column;
  width: 90%;
  max-width: 1024px;
  margin: 0 auto;
  border: 1px solid var(--gray1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
  background: var(--white);
  box-sizing: border-box;
  overflow-y: auto;
  --scrollbar-bg: var(--white);
  --scrollbar-thin: var(--gray2);
}

.card-header {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  position: relative;
}

.card-title {
  margin: 0;
  font-size: 5rem;
  flex-grow: 1;
  text-align: center;
  font-family: 'Anonymous', sans-serif;
}

.close-btn {
  color: white;
  position: absolute;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
}

.card-content {
  flex-grow: 1;
  padding: 1rem;
}


/* Custom scrollbar styles */
.card::-webkit-scrollbar {
  width: 12px;
}

.card::-webkit-scrollbar-track {
  background: var(--scrollbar-thin); /* Используем CSS переменную */
}

.card::-webkit-scrollbar-thumb {
  background-color: black;
  border-radius: 6px;
  border: 1px solid var(--scrollbar-thin); /* Используем CSS переменную */
}

.card {
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-bg) var(--scrollbar-thin); /* Используем CSS переменную */
}

</style>
