<template>
  <div class="card-overlay">
    <div class="card-container">
      <button v-if="showCloseButton" class="close-btn" @click="$emit('close')">
        <img src="@/assets/images/icon_close.svg" alt="Close" class="close-icon"/>
      </button>
      <div class="card" :style="cardStyles">
        <div class="card-header">
          <div class="btn-back">
            <slot name="back"/>
          </div>
          <h2 class="card-title">{{ title }}</h2>
        </div>
        <div class="card-content">
          <slot></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

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
    default: 'var(--hex-text-primary)'
  },
  borderColor: {
    type: String,
    default: 'var(--hex-border-default)'
  },
  textColor: {
    type: String,
    default: 'var(--hex-bg-dark)'
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
    default: '75vh'
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
  overflowY: 'auto'
}));
</script>

<style scoped>
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
  overflow: hidden;
}

.card-container {
  position: relative;
  width: 100%;
  max-width: 1024px;
  margin: 0 auto;
  transform: translateY(-2vw);
}

.card {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--hex-border-default);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
  background: var(--hex-text-primary);
  box-sizing: border-box;
  overflow: auto;
  --scrollbar-bg: var(--hex-text-primary);
  --scrollbar-thin: var(--hex-text-secondary);
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
  font-family: 'Anonymous', 'Courier New', Consolas, monospace;
}

.close-btn {
  background: var(--hex-primary);
  border: none;
  cursor: pointer;
  position: absolute;
  right: 0; /* Позиционируем правее границы */
  z-index: 1100; /* Устанавливаем z-index выше, чем у родительских элементов */
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;
}

.close-icon {
  width: 1.5rem;
  height: 1.5rem;
  object-fit: cover;
}

.card-content {
  flex-grow: 1;
  font-size: 0.9em;
  line-height: 1.3em;
}

.btn-back{
  position: absolute;
  left: 0;
}


</style>
