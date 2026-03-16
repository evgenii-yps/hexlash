<template>
  <div class="mode-selector">

    <!-- Mode Button -->
    <button class="mode-btn" @click="toggleDropdown">
      <span class="mode-icon">{{ currentModeIcon }}</span>
      <span class="mode-label">{{ t.arena.mode }}: {{ currentModeName }}</span>
      <span class="dropdown-arrow" :class="{ open: isOpen }">&#x25BC;</span>
    </button>

    <!-- Overlay to close -->
    <div v-if="isOpen" class="dropdown-overlay" @click="isOpen = false"></div>

    <!-- Dropdown -->
    <div v-if="isOpen" class="mode-dropdown">

      <!-- PVE -->
      <div
        class="mode-option"
        :class="{ active: selectedMode === 'pve' }"
        @click="selectMode('pve')"
      >
        <span class="option-icon">&#x1F916;</span>
        <div class="option-info">
          <div class="option-name">PVE</div>
          <div class="option-desc">{{ t.arena.pveDesc }}</div>
        </div>
        <span v-if="selectedMode === 'pve'" class="check">&#x2713;</span>
      </div>

      <!-- PVP -->
      <div
        class="mode-option"
        :class="{ active: selectedMode === 'pvp' }"
        @click="selectMode('pvp')"
      >
        <span class="option-icon">&#x2694;&#xFE0F;</span>
        <div class="option-info">
          <div class="option-name">PVP</div>
          <div class="option-desc">{{ t.arena.pvpDesc }}</div>
          <div class="option-stat">
            <span class="online-dot"></span>
            {{ t.pvp.online }}: {{ onlineCount }}
          </div>
        </div>
        <span v-if="selectedMode === 'pvp'" class="check">&#x2713;</span>
      </div>

      <!-- Auto Fight -->
      <div
        class="mode-option"
        :class="{ active: selectedMode === 'auto' }"
        @click="selectMode('auto')"
      >
        <span class="option-icon">&#x1F504;</span>
        <div class="option-info">
          <div class="option-name">{{ t.arena.autoFight }}</div>
          <div class="option-desc">{{ t.arena.autoDesc }}</div>
        </div>
        <span v-if="selectedMode === 'auto'" class="check">&#x2713;</span>
      </div>

    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { t } from '@/locales/index.js';

defineProps({
  onlineCount: { type: Number, default: 0 },
});

const emit = defineEmits(['select']);

const isOpen = ref(false);
const selectedMode = ref('pve');

const modes = {
  pve: { icon: '\u{1F916}', name: 'PVE' },
  pvp: { icon: '\u2694\uFE0F', name: 'PVP' },
  auto: { icon: '\u{1F504}', name: 'AUTO' },
};

const currentModeIcon = computed(() => modes[selectedMode.value].icon);
const currentModeName = computed(() => modes[selectedMode.value].name);

function toggleDropdown() {
  isOpen.value = !isOpen.value;
}

function selectMode(mode) {
  selectedMode.value = mode;
  isOpen.value = false;
  emit('select', mode);
}
</script>

<style scoped>
.mode-selector {
  position: relative;
  width: 100%;
  max-width: 300px;
  margin: 16px auto;
}

.mode-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 24px;
  background: rgba(20, 20, 30, 0.9);
  border: 2px solid rgba(255, 6, 111, 0.5);
  border-radius: 12px;
  color: #fff;
  font-family: Anonymous, sans-serif;
  font-size: 16px;
  text-transform: uppercase;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mode-btn:active {
  border-color: #FF066F;
  box-shadow: 0 0 20px rgba(255, 6, 111, 0.4);
}

.mode-icon {
  font-size: 20px;
}

.dropdown-arrow {
  font-size: 12px;
  transition: transform 0.2s ease;
}

.dropdown-arrow.open {
  transform: rotate(180deg);
}

/* Dropdown */
.mode-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: rgba(15, 15, 25, 0.98);
  border: 2px solid #FF066F;
  border-radius: 16px;
  overflow: hidden;
  z-index: 100;
  box-shadow:
    0 0 30px rgba(255, 6, 111, 0.4),
    0 10px 40px rgba(0, 0, 0, 0.8);
  animation: dropdownIn 0.2s ease;
}

@keyframes dropdownIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.mode-option {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.mode-option:last-child {
  border-bottom: none;
}

.mode-option:active {
  background: rgba(255, 6, 111, 0.15);
}

.mode-option.active {
  background: rgba(255, 6, 111, 0.2);
}

.option-icon {
  font-size: 28px;
}

.option-info {
  flex: 1;
}

.option-name {
  font-family: Anonymous, sans-serif;
  font-size: 18px;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 4px;
}

.option-desc {
  font-size: 12px;
  color: #888;
}

.option-stat {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #00FF88;
  margin-top: 4px;
}

.online-dot {
  width: 6px;
  height: 6px;
  background: #00FF88;
  border-radius: 50%;
  box-shadow: 0 0 6px rgba(0, 255, 136, 0.8);
}

.check {
  color: #FF066F;
  font-size: 18px;
  font-weight: bold;
}

/* Overlay */
.dropdown-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 99;
}
</style>
