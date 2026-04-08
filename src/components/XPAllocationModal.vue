<template>
  <div class="modal-overlay" v-if="visible" @click.self="close">
    <div class="xp-modal">
      <!-- Title -->
      <h2 class="modal-title">
        {{ t.xpAllocation.allocateTo }} {{ branchName }}
      </h2>

      <!-- Free XP -->
      <div class="free-xp">
        {{ t.xpAllocation.freeXP }}: <span class="xp-value">{{ freeXP }} XP</span>
      </div>

      <!-- Slider -->
      <div class="slider-container">
        <span class="slider-min">0</span>
        <input
          type="range"
          v-model.number="selectedAmount"
          :min="0"
          :max="freeXP"
          class="hex-slider"
        />
        <span class="slider-max">{{ freeXP }}</span>
      </div>

      <!-- Number input -->
      <div class="input-container">
        <input
          type="number"
          v-model.number="selectedAmount"
          :min="0"
          :max="freeXP"
          class="hex-input"
          @input="validateInput"
        />
        <span class="input-label">XP</span>
      </div>

      <!-- Allocate button -->
      <button
        class="hex-btn-filled"
        @click="allocate"
        :disabled="selectedAmount === 0"
      >
        {{ t.xpAllocation.allocate }}
      </button>

      <!-- Cancel button -->
      <button class="hex-btn-secondary" @click="close">
        {{ t.xpAllocation.cancel }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { t } from '@/locales/index.js';

const props = defineProps({
  branch: { type: String, required: true },
  branchName: { type: String, required: true },
  freeXP: { type: Number, required: true },
  visible: { type: Boolean, default: false }
});

const emit = defineEmits(['allocate', 'close']);

const selectedAmount = ref(0);

function validateInput() {
  if (selectedAmount.value < 0) selectedAmount.value = 0;
  if (selectedAmount.value > props.freeXP) selectedAmount.value = props.freeXP;
  selectedAmount.value = Math.floor(selectedAmount.value);
}

watch(() => props.visible, (newVal) => {
  if (newVal) selectedAmount.value = 0;
});

function allocate() {
  if (selectedAmount.value > 0) {
    emit('allocate', props.branch, selectedAmount.value);
  }
}

function close() {
  emit('close');
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: color-mix(in srgb, var(--hex-bg-dark) 40%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.xp-modal {
  background: transparent;
  border: 1px solid var(--hex-border-strong);
  border-radius: 16px;
  padding: 32px;
  min-width: 300px;
  max-width: 360px;
  width: 90%;
  text-align: center;
}

.modal-title {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-weight: bold;
  font-size: 1.4rem;
  color: var(--hex-text-primary);
  text-transform: uppercase;
  letter-spacing: 2px;
  margin: 0 0 24px;
}

.free-xp {
  font-size: 0.9rem;
  color: var(--hex-text-secondary);
  margin-bottom: 24px;
}

.free-xp .xp-value {
  color: var(--hex-text-primary);
  font-weight: bold;
  font-size: 1.3rem;
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.slider-min, .slider-max {
  color: var(--hex-text-secondary);
  font-size: 0.8rem;
  min-width: 30px;
}

.hex-slider {
  flex: 1;
  -webkit-appearance: none;
  height: 6px;
  background: var(--hex-bg-light);
  border-radius: 3px;
  outline: none;
}

.hex-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  background: var(--hex-text-primary);
  border-radius: 50%;
  cursor: pointer;
}

.hex-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: var(--hex-text-primary);
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

.input-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 24px;
}

.hex-input {
  width: 100px;
  padding: 12px 16px;
  background: color-mix(in srgb, var(--hex-bg-light) 80%, transparent);
  border: 2px solid var(--hex-border-strong);
  border-radius: 8px;
  color: var(--hex-text-primary);
  font-size: 1.2rem;
  font-weight: bold;
  text-align: center;
  outline: none;
  transition: all 0.2s ease;
  -moz-appearance: textfield;
}

.hex-input::-webkit-inner-spin-button,
.hex-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.hex-input:focus {
  border-color: var(--hex-border-active);
}

.input-label {
  color: var(--hex-text-secondary);
  font-size: 1rem;
  font-weight: bold;
}

.hex-btn-filled {
  width: 100%;
  padding: 14px 32px;
  background: var(--hex-primary);
  border: none;
  border-radius: 8px;
  color: var(--hex-text-primary);
  font-family: 'Inter', 'Roboto', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
  cursor: pointer;
  margin-bottom: 12px;
  box-shadow: 0 0 20px var(--hex-primary-glow);
  transition: all 0.2s ease;
}

.hex-btn-filled:hover:not(:disabled) {
  background: color-mix(in srgb, var(--hex-primary) 85%, white);
  box-shadow: 0 0 30px color-mix(in srgb, var(--hex-primary) 80%, transparent);
  transform: translateY(-2px);
}

.hex-btn-filled:disabled {
  background: var(--hex-border-strong);
  box-shadow: none;
  cursor: not-allowed;
  opacity: 0.5;
}

.hex-btn-secondary {
  width: 100%;
  padding: 12px 24px;
  background: transparent;
  border: 1px solid var(--hex-border-active);
  border-radius: 8px;
  color: var(--hex-text-secondary);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.hex-btn-secondary:hover {
  border-color: var(--hex-text-primary);
  color: var(--hex-text-primary);
}
</style>
