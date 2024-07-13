<template>
  <button @click="$emit('click')" :class="customClass" :style="computedStyles">
    <slot></slot>
  </button>
</template>

<script setup>
import { computed, defineProps } from 'vue';

const props = defineProps({
  textColor: {
    type: String,
    default: 'var(--pink)'
  },
  customClass: {
    type: String,
    default: ''
  },
  textSize: {
    type: String,
    default: 'inherit'
  }
});

const computedStyles = computed(() => ({
  background: 'none',
  border: 'none',
  color: props.textColor,
  cursor: 'pointer',
  padding: 0,
  font: 'inherit',
  fontSize: props.textSize
}));
</script>

<style scoped>
button:hover {
  text-decoration: underline;
}
</style>
