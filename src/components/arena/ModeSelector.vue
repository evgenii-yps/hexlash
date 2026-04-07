<template>
  <div class="mode-selector">

    <!-- Compact Mode Button -->
    <button class="mode-compact-btn" :class="[currentModeClass]" @click="toggleDropdown">
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
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="var(--hex-mode-pve)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
        </div>
        <div class="option-info">
          <div class="option-name">PVE</div>
          <div class="option-desc">{{ t.arena.pveDesc }}</div>
        </div>
        <span v-if="selectedMode === 'pve'" class="check"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--hex-text-primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 12 10 18 20 6"/></svg></span>
      </div>

      <!-- PVP -->
      <div
        class="mode-option"
        :class="{ active: selectedMode === 'pvp' }"
        @click="selectMode('pvp')"
      >
        <div class="option-icon pvp-icon">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="var(--hex-mode-pvp)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="20" x2="14" y2="10"/><line x1="14" y1="10" x2="17" y2="7"/><line x1="17" y1="7" x2="21" y2="3"/><line x1="18" y1="6" x2="21" y2="3"/><line x1="20" y1="4" x2="14" y2="10"/><line x1="10" y1="14" x2="20" y2="4"/><line x1="3" y1="21" x2="10" y2="14"/><line x1="7" y1="17" x2="3" y2="21"/></svg>
        </div>
        <div class="option-info">
          <div class="option-name">PVP</div>
          <div class="option-desc">{{ t.arena.pvpDesc }}</div>
          <div class="option-stat">
            <span class="online-dot"></span>
            {{ t.pvp.online }}: {{ onlineCount }}
          </div>
        </div>
        <span v-if="selectedMode === 'pvp'" class="check"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--hex-text-primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 12 10 18 20 6"/></svg></span>
      </div>

    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { t } from '@/locales/index.js';
const props = defineProps({
  onlineCount: { type: Number, default: 0 },
});

const emit = defineEmits(['select']);

const isOpen = ref(false);
const selectedMode = ref('pve');

const modeNames = { pve: 'PvE', pvp: 'PvP' };
const modeCss   = { pve: 'mode-pve', pvp: 'mode-pvp' };

const currentModeName  = computed(() => modeNames[selectedMode.value]);
const currentModeClass = computed(() => modeCss[selectedMode.value]);

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
}

/* ── Compact square button ───────────────────────────────── */
.mode-compact-btn {
  width: 60px;
  height: 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: var(--hex-bg-card);
  border: 1px solid var(--hex-border-active);
  border-radius: var(--hex-radius-lg);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.mode-compact-btn:active {
  border-color: var(--hex-border-strong);
  background: var(--hex-bg-light);
}

.mode-compact-label {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: var(--hex-text-primary);
  line-height: 1;
  text-transform: uppercase;
}

.mode-compact-arrow {
  font-size: 10px;
  color: var(--hex-text-muted);
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
  background: var(--hex-bg-medium);
  border: 1px solid var(--hex-border-strong);
  border-radius: var(--hex-radius-xl);
  overflow: hidden;
  z-index: 100;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8); /* deep shadow, no glow */
  animation: dropdownIn 0.2s ease;
}

@keyframes dropdownIn {
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: translateY(0); }
}

.mode-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid var(--hex-border-default);
}

.mode-option:last-child { border-bottom: none; }
.mode-option:active { background: var(--hex-bg-light); }
.mode-option.active { background: var(--hex-bg-light); }

.option-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--hex-radius-md);
  flex-shrink: 0;
}

.pve-icon  { background: color-mix(in srgb, var(--hex-mode-pve) 15%, transparent); border: 1px solid color-mix(in srgb, var(--hex-mode-pve) 40%, transparent); }
.pvp-icon  { background: color-mix(in srgb, var(--hex-mode-pvp) 15%, transparent); border: 1px solid color-mix(in srgb, var(--hex-mode-pvp) 40%, transparent); }

.option-info { flex: 1; }

.option-name {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: var(--hex-text-primary);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 4px;
}

.option-desc { font-size: 12px; color: var(--hex-text-muted); }

.option-stat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--hex-success);
  margin-top: 4px;
}

.online-dot {
  width: 6px; height: 6px;
  background: var(--hex-success);
  border-radius: 50%;
  box-shadow: 0 0 6px color-mix(in srgb, var(--hex-success) 80%, transparent);
}

.check {
  display: flex;
  align-items: center;
}

.dropdown-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 99;
}

@media (max-width: 400px) {
  .mode-compact-btn {
    width: 52px;
    height: 44px;
  }
  .mode-compact-label { font-size: 11px; }
}

@media (max-width: 360px) {
  .mode-dropdown {
    width: calc(100vw - 40px);
  }
  .mode-compact-btn {
    width: 48px;
    height: 44px;
  }
  .mode-compact-label { font-size: 10px; }
}
</style>
