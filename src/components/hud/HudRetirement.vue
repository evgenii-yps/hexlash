<!--
  HudRetirement.vue — 5Q Phase 1.

  Pure-presentational HUD component (per HUD-v2 convention — Lesson #32).
  Dispatches Vuex actions master/fetchRetirementStatus + master/retire,
  stores response в local component refs (no Vuex caching state per ТЗ
  §Decision). Mirrors HudSocialTasks pattern (5I precedent): useStore +
  onMounted dispatch + button click → dispatch.

  3 template branches per RetirementPanel (legacy components/club/, removed in 5S):
    - loading        (initial fetch in flight)
    - data?.legend   (already retired — show legend display)
    - data           (retirement progress + requirements + buff preview)

  Visual: Hexlash tokens (--hex-primary, --font-mono, --bg-panel),
  native <button>, .hr-spinner CSS keyframes (per .tsp-spinner / .mm-spinner
  convention). NO Vuetify (replaces v-progress-circular + HexButton from
  legacy RetirementPanel, removed in 5S).

  i18n: 5 existing retirement keys (lblRetirement, lblReadyToRetire,
  lblRetireFighter, lblRetireWarning, lblRetireSuccess) + supporting
  (lblAllUnlocked, lblBuffPreview, lblNoLegend) reused. No new keys в P1.

  Component не mounted в P1 — P2 wires в HudProfile.
-->

<template>
  <div class="hud hr-panel">
    <Transition name="hr-fade" mode="out-in">
      <div v-if="loading" key="loading" class="hr-loading">
        <div class="hr-spinner" aria-label="Loading"></div>
      </div>

      <!-- Legend display (already retired) -->
      <div v-else-if="data?.legend" key="legend" class="hr-legend-branch">
        <div class="hr-legend-header">
          <span class="hr-legend-title">{{ t.club?.lblLegend || 'Legend' }}</span>
        </div>
        <div class="hr-legend-display">
          <img
            :src="`/images/skins/${data.legend.skin}`"
            :alt="archName(data.legend.archetype)"
            class="hr-legend-skin"
          />
          <div class="hr-legend-info">
            <div class="hr-legend-archetype">{{ archName(data.legend.archetype) }}</div>
            <div class="hr-legend-buffs">
              <div class="hr-buff-line buff-xp">+{{ pct(data.legend.buff?.xpBonus) }}% XP</div>
              <div class="hr-buff-line buff-dmg">+{{ pct(data.legend.buff?.dmgBonus) }}% DMG</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Retirement progress -->
      <div v-else-if="data" key="progress" class="hr-progress-branch">
        <div class="hr-header">
          <span class="hr-title">
            {{ data.canRetire
              ? (t.club?.lblReadyToRetire || 'Ready to Retire!')
              : (t.club?.lblRetirement || 'Fighter Retirement') }}
          </span>
        </div>

        <div class="hr-progress-wrap">
          <div class="hr-progress-label">{{ data.progress?.overallProgress || 0 }}%</div>
          <div class="hr-progress-track">
            <div
              class="hr-progress-fill"
              :style="{ width: (data.progress?.overallProgress || 0) + '%' }"
            ></div>
          </div>
        </div>

        <div class="hr-req-list">
          <div :class="['hr-req', { done: data.requirements?.allUnlocked }]">
            <span class="hr-req-mark">{{ data.requirements?.allUnlocked ? '✓' : '✗' }}</span>
            {{ t.club?.lblAllUnlocked || 'All moves unlocked' }}
            ({{ data.progress?.unlockedMoves || 0 }}/{{ data.progress?.totalMoves || 0 }})
          </div>
          <div :class="['hr-req', { done: data.requirements?.minLevel3 }]">
            <span class="hr-req-mark">{{ data.requirements?.minLevel3 ? '✓' : '✗' }}</span>
            {{ data.progress?.movesAtLevel3Plus || 0 }} moves at Lv3+ (need 12)
          </div>
          <div :class="['hr-req', { done: data.requirements?.minLevel5 }]">
            <span class="hr-req-mark">{{ data.requirements?.minLevel5 ? '✓' : '✗' }}</span>
            {{ data.progress?.movesAtLevel5 || 0 }} moves at Lv5 (need 3)
          </div>
          <div :class="['hr-req', { done: data.requirements?.hasClub }]">
            <span class="hr-req-mark">{{ data.requirements?.hasClub ? '✓' : '✗' }}</span>
            {{ t.clan?.lblHasClan || 'In a clan' }}
          </div>
          <div :class="['hr-req', { done: data.requirements?.noExistingLegend }]">
            <span class="hr-req-mark">{{ data.requirements?.noExistingLegend ? '✓' : '✗' }}</span>
            {{ t.club?.lblNoLegend || 'No existing legend' }}
          </div>
        </div>

        <template v-if="data.canRetire && data.buffPreview">
          <div class="hr-buff-preview">
            <div class="hr-buff-preview-title">{{ t.club?.lblBuffPreview || 'Legend Buff Preview' }}</div>
            <div class="hr-buff-line buff-xp">+{{ pct(data.buffPreview.xpBonus) }}% XP for all agents</div>
            <div class="hr-buff-line buff-dmg">+{{ pct(data.buffPreview.dmgBonus) }}% damage</div>
          </div>
          <div class="hr-warning">{{ t.club?.lblRetireWarning || 'This action cannot be undone' }}</div>
          <button
            class="hr-retire-btn"
            type="button"
            :disabled="retiring"
            @click="onRetire"
          >
            {{ retiring ? '…' : (t.club?.lblRetireFighter || 'Retire Fighter') }}
          </button>
        </template>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import { t } from '@/locales/index.js';

const store = useStore();

const data = ref(null);
const loading = ref(true);
const retiring = ref(false);

const ARCH_NAMES = {
  predator: 'Predator',
  sentinel: 'Sentinel',
  ghost: 'Ghost',
  analyst: 'Analyst',
  maverick: 'Maverick',
  juggernaut: 'Juggernaut',
};

function archName(id) {
  return ARCH_NAMES[id] || id || '—';
}

function pct(v) {
  return Math.round((v || 0) * 100);
}

async function load() {
  loading.value = true;
  try {
    const result = await store.dispatch('master/fetchRetirementStatus');
    data.value = result || null;
  } finally {
    loading.value = false;
  }
}

async function onRetire() {
  if (!data.value?.canRetire || retiring.value) return;
  retiring.value = true;
  try {
    const success = await store.dispatch('master/retire');
    if (success) {
      // Refetch — server will return data.legend, template flips к legend display.
      await load();
    }
  } finally {
    retiring.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.hr-panel {
  position: relative;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  background: var(--bg-panel, rgba(20, 20, 28, 0.85));
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  font-family: var(--font-mono, 'JetBrains Mono', monospace);
  color: var(--text-mid, #c0c0cc);
}

/* Loading */
.hr-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80px;
}
.hr-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--hex-primary, #ff066f);
  border-radius: 50%;
  animation: hr-spin 0.8s linear infinite;
}
@keyframes hr-spin {
  to { transform: rotate(360deg); }
}

/* Legend display (already retired) */
.hr-legend-header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.hr-legend-title {
  font-size: 11px;
  letter-spacing: 1.5px;
  color: var(--hex-primary, #ff066f);
  text-transform: uppercase;
  font-weight: 600;
}
.hr-legend-display {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 10px;
  background: rgba(255, 6, 111, 0.06);
  border: 1px solid rgba(255, 6, 111, 0.25);
  border-radius: 6px;
  animation: hr-legend-arrive 0.8s ease-out 0.15s both;
}
.hr-legend-skin {
  width: 56px;
  height: 56px;
  border-radius: 6px;
  object-fit: cover;
  background: rgba(255, 255, 255, 0.04);
}
.hr-legend-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}
.hr-legend-archetype {
  font-size: 13px;
  color: var(--text-mid, #c0c0cc);
  text-transform: uppercase;
  letter-spacing: 1px;
}
.hr-legend-buffs {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* Progress section */
.hr-header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.hr-title {
  font-size: 11px;
  letter-spacing: 1.5px;
  color: var(--text-dim, #808088);
  text-transform: uppercase;
}
.hr-progress-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.hr-progress-label {
  font-size: 11px;
  color: var(--text-dim, #808088);
  text-align: right;
}
.hr-progress-track {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 2px;
  overflow: hidden;
}
.hr-progress-fill {
  height: 100%;
  background: var(--hex-primary, #ff066f);
  transition: width 0.3s ease;
}

/* Requirements */
.hr-req-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.hr-req {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text-dim, #808088);
  padding: 4px 0;
}
.hr-req.done {
  color: var(--text-mid, #c0c0cc);
}
.hr-req-mark {
  display: inline-block;
  width: 12px;
  text-align: center;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.3);
}
.hr-req.done .hr-req-mark {
  color: #4ade80;
}

/* Buff preview */
.hr-buff-preview {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
  background: rgba(255, 6, 111, 0.06);
  border: 1px solid rgba(255, 6, 111, 0.2);
  border-radius: 6px;
  margin-top: 4px;
  animation: hr-buff-preview-in 0.35s ease-out both;
}
.hr-buff-preview-title {
  font-size: 10px;
  letter-spacing: 1.5px;
  color: var(--hex-primary, #ff066f);
  text-transform: uppercase;
  margin-bottom: 2px;
}
.hr-buff-line {
  font-size: 11px;
}
.hr-buff-line.buff-xp { color: #4ade80; }
.hr-buff-line.buff-dmg { color: var(--hex-primary, #ff066f); }

/* Warning + retire button */
.hr-warning {
  font-size: 10px;
  color: rgba(255, 200, 100, 0.85);
  text-align: center;
  padding: 4px 0;
  letter-spacing: 0.5px;
}
.hr-retire-btn {
  width: 100%;
  padding: 10px 14px;
  background: var(--hex-primary, #ff066f);
  color: #fff;
  border: 1px solid var(--hex-primary, #ff066f);
  border-radius: 6px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 120ms ease, transform 80ms ease;
}
.hr-retire-btn:hover:not(:disabled) {
  background: rgba(255, 6, 111, 0.85);
}
.hr-retire-btn:active:not(:disabled) {
  transform: scale(0.97);
}
.hr-retire-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 5U Phase 1 — Animation #1: Vue Transition for 3-branch swap (loading / legend / progress).
   mode="out-in" → non-overlapping fade. 0.3s ease-out mirrors hex-fade-in legacy convention
   + v24 0.3s state-transition pattern (Phase 0 Q2). */
.hr-fade-enter-active,
.hr-fade-leave-active {
  transition: opacity 0.3s ease-out;
}
.hr-fade-enter-from,
.hr-fade-leave-to {
  opacity: 0;
}

/* 5U Phase 1 — Animation #4: Buff-preview scale-in entrance.
   Fires when v-if (canRetire && buffPreview) flips к true and element mounts.
   `both` fill-mode preserves start state (opacity 0, scale 0.92) + end state (opacity 1, scale 1). */
@keyframes hr-buff-preview-in {
  from { opacity: 0; transform: scale(0.92); }
  to   { opacity: 1; transform: scale(1); }
}

/* 5U Phase 1 — Animation #5: Legend display ceremony entrance.
   0.8s duration cites shipped `hex-float-up 0.8s` precedent (Phase 0 Q5 — NOT NewAchievement
   600ms TODO comment, that's intent not shipped). 0.15s delay sequences ceremony AFTER outer
   #1 Transition (0.3s) completes — smoother layered reveal. `both` fill-mode covers delay
   period (opacity 0) + post-animation hold (opacity 1). */
@keyframes hr-legend-arrive {
  from { opacity: 0; transform: translateY(12px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
</style>
