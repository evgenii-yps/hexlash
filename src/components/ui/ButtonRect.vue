<template>
  <button
      :type="btnType"
      :class="['primary-btn', customClass]"
      :style="{ ...customStyles, marginBottom: marginBottom }"
      @mouseover="hover = true"
      @mouseleave="hover = false"
      @mousedown="active = true"
      @mouseup="active = false">
    <slot></slot>
  </button>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  btnType: {
    type: String,
    default: 'button'
  },
  bgColor: {
    type: String,
    default: 'var(--pink)'
  },
  textColor: {
    type: String,
    default: 'var(--white)'
  },
  borderColor: {
    type: String,
    default: 'var(--pink)'
  },
  hoverBgColor: {
    type: String,
    default: 'var(--pinkDark)'
  },
  customClass: {
    type: String,
    default: ''
  },
  borderRadius: {
    type: String,
    default: '4px'
  },
  padding: {
    type: String,
    default: '10px'
  },
  marginBottom: {
    type: String,
    default: '1rem' // Значение по умолчанию
  }
});

const hover = ref(false);
const active = ref(false);

const customStyles = computed(() => ({
  backgroundColor: `var(${props.bgColor})`,
  color: `var(${props.textColor})`,
  borderColor: `var(${props.borderColor})`,
  width: '100%',
  height: '100%',
  borderRadius: props.borderRadius,
  padding: props.padding,
  boxShadow: hover.value
      ? '0 10px 20px rgba(0, 0, 0, 0.1)'
      : '0 10px 20px rgba(255, 6, 111, 0.2)',
  outline: active.value ? '2px solid rgba(0, 0, 0, 0.2)' : 'none',
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden'
}));
</script>

<style scoped>
.primary-btn {
  font-family: 'Roboto', sans-serif;
  font-style: normal;
  font-weight: 500;
  font-size: 16px;
  line-height: 19px;
  cursor: pointer;
  border: none;
  box-shadow: none;
  outline: none;
  position: relative;
  overflow: hidden;
  z-index: 0;
}

.primary-btn::before,
.primary-btn::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.1);
  transition: opacity 0.3s ease;
  z-index: -1;
}

.primary-btn::before {
  opacity: 0;
}

.primary-btn:hover::before {
  opacity: 1;
}

.primary-btn::after {
  opacity: 0;
}

.primary-btn:active::after {
  opacity: 1;
}

.primary-btn:disabled {
  opacity: 0.5;
}

.primary-btn:hover {
  text-decoration: none;
  box-shadow: 0 2px 2px rgba(0, 0, 0, 0.2);
}

.primary-btn:focus {
  text-decoration: none;
  outline: none;
}

.primary-btn:active {
  outline: 2px solid rgba(0, 0, 0, 0.2);
}
</style>
