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
          <PixelIcon name="pve" :size="24" color="var(--hex-mode-pve)"/>
        </div>
        <div class="option-info">
          <div class="option-name">PVE</div>
          <div class="option-desc">{{ t.arena.pveDesc }}</div>
        </div>
        <span v-if="selectedMode === 'pve'" class="check">✓</span>
      </div>

      <!-- PVP -->
      <div
        class="mode-option"
        :class="{ active: selectedMode === 'pvp' }"
        @click="selectMode('pvp')"
      >
        <div class="option-icon pvp-icon">
          <PixelIcon name="pvp" :size="24" color="var(--hex-mode-pvp)"/>
        </div>
        <div class="option-info">
          <div class="option-name">PVP</div>
          <div class="option-desc">{{ t.arena.pvpDesc }}</div>
          <div class="option-stat">
            <span class="online-dot"></span>
            {{ t.pvp.online }}: {{ onlineCount }}
          </div>
        </div>
        <span v-if="selectedMode === 'pvp'" class="check">✓</span>
      </div>

      <!-- Auto Fight -->
      <div
        class="mode-option"
        :class="{ active: selectedMode === 'auto' }"
        @click="selectMode('auto')"
      >
        <div class="option-icon auto-icon">
          <PixelIcon name="auto" :size="24" color="var(--hex-mode-auto)"/>
        </div>
        <div class="option-info">
          <div class="option-name">{{ t.arena.autoFight }}</div>
          <div class="option-desc">{{ t.arena.autoDesc }}</div>
        </div>
        <span v-if="selectedMode === 'auto'" class="check">✓</span>
      </div>

    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { t } from '@/locales/index.js';
import PixelIcon from '@/components/ui/PixelIcon.vue';

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
  background: var(--hex-bg-card);
  border: 1px solid var(--hex-border-active);
  border-radius: var(--hex-radius-lg);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.mode-compact-btn:active {
  border-color: var(--hex-primary);
  box-shadow: 0 0 16px var(--hex-primary-glow);
}

.mode-compact-btn.mode-locked {
  opacity: 0.4;
  pointer-events: none;
}

.mode-compact-btn.mode-pve { border-color: color-mix(in srgb, var(--hex-mode-pve) 40%, transparent); }
.mode-compact-btn.mode-pve:active { border-color: var(--hex-mode-pve); box-shadow: 0 0 16px color-mix(in srgb, var(--hex-mode-pve) 30%, transparent); }
.mode-compact-btn.mode-pvp { border-color: color-mix(in srgb, var(--hex-mode-pvp) 40%, transparent); }
.mode-compact-btn.mode-auto { border-color: color-mix(in srgb, var(--hex-mode-auto) 40%, transparent); }
.mode-compact-btn.mode-auto:active { border-color: var(--hex-mode-auto); box-shadow: 0 0 16px color-mix(in srgb, var(--hex-mode-auto) 30%, transparent); }

.mode-compact-label {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: var(--hex-text-primary);
  line-height: 1;
  text-transform: uppercase;
}

.mode-compact-btn.mode-pve .mode-compact-label { color: var(--hex-mode-pve); }
.mode-compact-btn.mode-pvp .mode-compact-label { color: var(--hex-mode-pvp); }
.mode-compact-btn.mode-auto .mode-compact-label { color: var(--hex-mode-auto); }

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
  border: 2px solid var(--hex-primary);
  border-radius: var(--hex-radius-xl);
  overflow: hidden;
  z-index: 100;
  box-shadow:
    0 0 30px var(--hex-primary-glow),
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
  border-bottom: 1px solid var(--hex-border-default);
}

.mode-option:last-child { border-bottom: none; }
.mode-option:active { background: color-mix(in srgb, var(--hex-primary) 15%, transparent); }
.mode-option.active { background: color-mix(in srgb, var(--hex-primary) 20%, transparent); }

.option-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  flex-shrink: 0;
}

.pve-icon  { background: color-mix(in srgb, var(--hex-mode-pve) 15%, transparent); border: 1px solid color-mix(in srgb, var(--hex-mode-pve) 40%, transparent); }
.pvp-icon  { background: color-mix(in srgb, var(--hex-mode-pvp) 15%, transparent); border: 1px solid color-mix(in srgb, var(--hex-mode-pvp) 40%, transparent); }
.auto-icon { background: color-mix(in srgb, var(--hex-mode-auto) 15%, transparent); border: 1px solid color-mix(in srgb, var(--hex-mode-auto) 40%, transparent); }

.option-info { flex: 1; }

.option-name {
  font-family: 'Anonymous', 'Courier New', Consolas, monospace;
  font-size: 18px;
  color: var(--hex-text-primary);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 4px;
}

.option-desc { font-size: 12px; color: var(--hex-text-muted); }

.option-stat {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--hex-mode-auto);
  margin-top: 4px;
}

.online-dot {
  width: 6px; height: 6px;
  background: var(--hex-mode-auto);
  border-radius: 50%;
  box-shadow: 0 0 6px color-mix(in srgb, var(--hex-mode-auto) 80%, transparent);
}

.check {
  color: var(--hex-primary);
  font-size: 18px;
  font-weight: bold;
}

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
