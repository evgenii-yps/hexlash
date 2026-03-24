<template>
  <div class="mode-selector">

    <!-- Compact Mode Button -->
    <button class="mode-compact-btn" :class="[currentModeClass, { 'mode-locked': autoFightActive }]" @click="toggleDropdown">
      <span class="mode-compact-label">{{ currentModeName }}</span>
      <span class="mode-compact-arrow" :class="{ open: isOpen }">
        <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </span>
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
        <div class="option-icon pve-icon">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#00E5FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L4 7v10l8 5 8-5V7z"/>
            <path d="M12 22V12"/>
            <path d="M4 7l8 5 8-5"/>
          </svg>
        </div>
        <div class="option-info">
          <div class="option-name">PVE</div>
          <div class="option-desc">{{ t.arena.pveDesc }}</div>
        </div>
        <span v-if="selectedMode === 'pve'" class="check">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#FF066F" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="4 12 10 18 20 6"/>
          </svg>
        </span>
      </div>

      <!-- PVP -->
      <div
        class="mode-option"
        :class="{ active: selectedMode === 'pvp' }"
        @click="selectMode('pvp')"
      >
        <div class="option-icon pvp-icon">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#FF066F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="6" y1="20" x2="18" y2="4"/>
            <line x1="16" y1="4" x2="20" y2="4"/>
            <line x1="18" y1="2" x2="18" y2="6"/>
            <line x1="18" y1="20" x2="6" y2="4"/>
            <line x1="4" y1="4" x2="8" y2="4"/>
            <line x1="6" y1="2" x2="6" y2="6"/>
          </svg>
        </div>
        <div class="option-info">
          <div class="option-name">PVP</div>
          <div class="option-desc">{{ t.arena.pvpDesc }}</div>
          <div class="option-stat">
            <span class="online-dot"></span>
            {{ t.pvp.online }}: {{ onlineCount }}
          </div>
        </div>
        <span v-if="selectedMode === 'pvp'" class="check">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#FF066F" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="4 12 10 18 20 6"/>
          </svg>
        </span>
      </div>

      <!-- Auto Fight -->
      <div
        class="mode-option"
        :class="{ active: selectedMode === 'auto' }"
        @click="selectMode('auto')"
      >
        <div class="option-icon auto-icon">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#00FF88" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 2v6h-6"/>
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
            <path d="M3 22v-6h6"/>
            <path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
          </svg>
        </div>
        <div class="option-info">
          <div class="option-name">{{ t.arena.autoFight }}</div>
          <div class="option-desc">{{ t.arena.autoDesc }}</div>
        </div>
        <span v-if="selectedMode === 'auto'" class="check">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#FF066F" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="4 12 10 18 20 6"/>
          </svg>
        </span>
      </div>

    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { t } from '@/locales/index.js';

const props = defineProps({
  onlineCount: { type: Number, default: 0 },
  autoFightActive: { type: Boolean, default: false },
});

const emit = defineEmits(['select']);

const isOpen = ref(false);
const selectedMode = ref('pve');

const modeNames = { pve: 'PvE', pvp: 'PvP', auto: 'Auto' };
const modeCss   = { pve: 'mode-pve', pvp: 'mode-pvp', auto: 'mode-auto' };

const currentModeName  = computed(() => modeNames[selectedMode.value]);
const currentModeClass = computed(() => modeCss[selectedMode.value]);

function toggleDropdown() {
  if (props.autoFightActive) return;
  isOpen.value = !isOpen.value;
}

function selectMode(mode) {
  if (props.autoFightActive && mode !== 'auto') return;
  selectedMode.value = mode;
  isOpen.value = false;
  emit('select', mode);
}
</script>

<style scoped>
.mode-selector {
  position: relative;
}

/* ── Compact square button ───────────────────────────────── */
.mode-compact-btn {
  width: 60px;
  height: 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  background: rgba(20, 20, 30, 0.9);
  border: 1px solid rgba(255, 6, 111, 0.4);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.mode-compact-btn:active {
  border-color: #FF066F;
  box-shadow: 0 0 16px rgba(255, 6, 111, 0.3);
}

.mode-compact-btn.mode-locked {
  opacity: 0.4;
  pointer-events: none;
}

.mode-compact-btn.mode-pve { border-color: rgba(0, 229, 255, 0.4); }
.mode-compact-btn.mode-pve:active { border-color: #00E5FF; box-shadow: 0 0 16px rgba(0, 229, 255, 0.3); }
.mode-compact-btn.mode-pvp { border-color: rgba(255, 6, 111, 0.4); }
.mode-compact-btn.mode-auto { border-color: rgba(0, 255, 136, 0.4); }
.mode-compact-btn.mode-auto:active { border-color: #00FF88; box-shadow: 0 0 16px rgba(0, 255, 136, 0.3); }

.mode-compact-label {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  line-height: 1;
  text-transform: uppercase;
}

.mode-compact-btn.mode-pve .mode-compact-label { color: #00E5FF; }
.mode-compact-btn.mode-pvp .mode-compact-label { color: #FF066F; }
.mode-compact-btn.mode-auto .mode-compact-label { color: #00FF88; }

.mode-compact-arrow {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
  transition: transform 0.2s ease;
  line-height: 1;
  display: flex;
}

.mode-compact-arrow.open {
  transform: rotate(180deg);
}

/* ── Dropdown ────────────────────────────────────────────── */
.mode-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  width: 280px;
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
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: translateY(0); }
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

.mode-option:last-child { border-bottom: none; }
.mode-option:active { background: rgba(255, 6, 111, 0.15); }
.mode-option.active { background: rgba(255, 6, 111, 0.2); }

.option-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  flex-shrink: 0;
}

.pve-icon  { background: rgba(0, 191, 255, 0.15); border: 1px solid rgba(0, 191, 255, 0.4); }
.pvp-icon  { background: rgba(255, 6, 111, 0.15); border: 1px solid rgba(255, 6, 111, 0.4); }
.auto-icon { background: rgba(0, 255, 136, 0.15); border: 1px solid rgba(0, 255, 136, 0.4); }

.option-info { flex: 1; }

.option-name {
  font-family: 'Anonymous', 'Courier New', Consolas, monospace;
  font-size: 18px;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 4px;
}

.option-desc { font-size: 12px; color: #888; }

.option-stat {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #00FF88;
  margin-top: 4px;
}

.online-dot {
  width: 6px; height: 6px;
  background: #00FF88;
  border-radius: 50%;
  box-shadow: 0 0 6px rgba(0, 255, 136, 0.8);
}

.check { color: #FF066F; }

.dropdown-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 99;
}

@media (max-width: 400px) {
  .mode-compact-btn {
    width: 52px;
    height: 42px;
  }
  .mode-compact-label { font-size: 11px; }
}
</style>
