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
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.xp-modal {
  background: transparent;
  border: 2px solid var(--pink);
  border-radius: 16px;
  padding: 32px;
  min-width: 300px;
  max-width: 360px;
  width: 90%;
  text-align: center;
  box-shadow:
    0 0 30px rgba(255, 6, 111, 0.4),
    0 0 60px rgba(255, 6, 111, 0.2);
}

.modal-title {
  font-family: 'Impact', 'Anton', sans-serif;
  font-size: 1.8rem;
  color: var(--pink);
  text-transform: uppercase;
  letter-spacing: 3px;
  margin: 0 0 24px;
  text-shadow: 0 0 15px rgba(255, 6, 111, 0.6);
}

.free-xp {
  font-size: 0.9rem;
  color: var(--gray2);
  margin-bottom: 24px;
}

.free-xp .xp-value {
  color: var(--pink);
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
  color: var(--gray2);
  font-size: 0.8rem;
  min-width: 30px;
}

.hex-slider {
  flex: 1;
  -webkit-appearance: none;
  height: 6px;
  background: #333;
  border-radius: 3px;
  outline: none;
}

.hex-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  background: var(--pink);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(255, 6, 111, 0.8);
}

.hex-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: var(--pink);
  border-radius: 50%;
  cursor: pointer;
  border: none;
  box-shadow: 0 0 10px rgba(255, 6, 111, 0.8);
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
  background: rgba(30, 30, 40, 0.8);
  border: 2px solid #444;
  border-radius: 8px;
  color: white;
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
  border-color: var(--pink);
  box-shadow: 0 0 15px rgba(255, 6, 111, 0.4);
}

.input-label {
  color: var(--gray2);
  font-size: 1rem;
  font-weight: bold;
}

.hex-btn-filled {
  width: 100%;
  padding: 14px 32px;
  background: var(--pink);
  border: none;
  border-radius: 8px;
  color: white;
  font-family: 'Inter', 'Roboto', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
  cursor: pointer;
  margin-bottom: 12px;
  box-shadow: 0 0 20px rgba(255, 6, 111, 0.5);
  transition: all 0.2s ease;
}

.hex-btn-filled:hover:not(:disabled) {
  background: #FF3D8E;
  box-shadow: 0 0 30px rgba(255, 6, 111, 0.8);
  transform: translateY(-2px);
}

.hex-btn-filled:disabled {
  background: #444;
  box-shadow: none;
  cursor: not-allowed;
  opacity: 0.5;
}

.hex-btn-secondary {
  width: 100%;
  padding: 12px 24px;
  background: transparent;
  border: 1px solid #666;
  border-radius: 8px;
  color: var(--gray2);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.hex-btn-secondary:hover {
  border-color: var(--pink);
  color: var(--pink);
}
</style>
