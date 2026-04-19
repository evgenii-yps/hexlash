<!-- Epic 3A Step 8a — Fighter Detail HUD without BranchPanel (that arrives in 8b).
     Layout and mocks copied 1-for-1 from prototype HTML 4378-4441 + data
     7681-7744. Branch labels are DOM-pinned to 3D column tops via fdLabels
     reactive store, written by FighterDetailScene.tick (Step 8a). -->
<template>
  <div class="hud detail-hud">
    <button class="back-btn" @click="onBack">&larr; Back</button>
    <button
      class="fd-fight-btn"
      title="Temporary — moves to Matchmaking in Epic 3B"
      @click="onFight"
    >FIGHT &rarr;</button>

    <div class="fd-top">
      <div class="fd-kicker">{{ kicker }}</div>
      <div class="fd-name">{{ name }}</div>
      <div class="fd-meta">{{ meta }}</div>
    </div>

    <div class="fd-resources">
      <div class="res gold">
        <div class="res-label">Taps</div>
        <div class="res-val">{{ fmt(resources.taps) }}</div>
      </div>
      <div class="res energy">
        <div class="res-label">Free XP</div>
        <div class="res-val">{{ fmt(resources.xp) }}</div>
      </div>
    </div>

    <div class="fd-stats">
      <div v-for="s in stats" :key="s.label" class="fd-stat">
        <div class="fd-stat-val">{{ s.val }}</div>
        <div class="fd-stat-label">{{ s.label }}</div>
      </div>
    </div>

    <div
      class="branch-label speed"
      :style="labelStyle('speed')"
    >
      <div class="bl-name">Speed</div>
      <div class="bl-lvl">Lv {{ levels.speed }}</div>
    </div>
    <div
      class="branch-label power"
      :style="labelStyle('power')"
    >
      <div class="bl-name">Power</div>
      <div class="bl-lvl">Lv {{ levels.power }}</div>
    </div>
    <div
      class="branch-label technique"
      :style="labelStyle('technique')"
    >
      <div class="bl-name">Technique</div>
      <div class="bl-lvl">Lv {{ levels.technique }}</div>
    </div>

    <BranchPanel
      ref="branchPanel"
      :data="panelData"
      :cost="panelCost"
      @close="closeBranchPanel"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
import { useRouter } from 'vue-router';
import { fdLabels } from '@/scene/interaction/useFdLabels.js';
import BranchPanel from './common/BranchPanel.vue';
import { FD_BRANCH_DATA } from './common/fdBranchData.js';

const props = defineProps({
  keyProp: { type: String, default: 'warden' },
});

const router = useRouter();

// Mocks (prototype 7681-7744 + openFighterDetail 7958-7970).
const KICKER = { warden: 'Captain \u00b7 Warden', predator: 'Predator' };
const NAME   = { warden: 'FIGHTER #1',            predator: 'FIGHTER #2' };
const META   = {
  warden:   'White Belt \u00b7 3W-1L-0D \u00b7 ELO 1247',
  predator: 'White Belt \u00b7 1W-0L-0D \u00b7 ELO 1043',
};
const stats = [
  { val: '4',     label: 'Fights'    },
  { val: '75%',   label: 'Winrate'   },
  { val: '1,247', label: 'ELO'       },
  { val: '62%',   label: 'To Yellow' },
];
const resources = { taps: 880, xp: 300 };
const levels = { speed: 6, power: 10, technique: 4 };

const branchPanel = ref(null);
const panelData = ref(null);
const panelCost = ref(null);

const kicker = computed(() => KICKER[props.keyProp] || KICKER.warden);
const name   = computed(() => NAME[props.keyProp]   || NAME.warden);
const meta   = computed(() => META[props.keyProp]   || META.warden);

function fmt(n) { return n.toLocaleString(); }

function labelStyle(id) {
  const l = fdLabels[id];
  return {
    left:    l.x + 'px',
    top:     l.y + 'px',
    opacity: l.visible ? 1 : 0,
  };
}

function onBack() { router.push('/v2'); }
function onFight() { router.push('/v2/fight'); }

// Step 8b — open BranchPanel with mocked branch data + derived cost.
// Cost formula from prototype 7739-7742 (branchUpgradeCost).
function openBranchPanel(branchId) {
  const level = levels[branchId];
  const d = FD_BRANCH_DATA[branchId];
  if (level == null || !d) return;
  panelData.value = {
    kicker: d.kicker,
    title:  d.title,
    level,
    moves:  d.moves,
  };
  panelCost.value = {
    taps: 100 + level * 100,
    xp:   25  + level * 25,
  };
  branchPanel.value?.open(branchId);
}

function closeBranchPanel() {
  branchPanel.value?.close();
}

// Esc closes FD — prototype 7977-7981.
function onKeyDown(e) {
  if (e.key === 'Escape') router.push('/v2');
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown);
});
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown);
});

defineExpose({ openBranchPanel });
</script>

<style scoped>
/* Container — pointer-events:none lets 3D under stay clickable, children
   that need clicks override it. */
.detail-hud {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 50;
  color: #fff;
}

/* Back button (prototype 605-623). */
.back-btn {
  position: fixed;
  top: 14px; left: 14px;
  background: var(--bg-panel);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 6px;
  padding: 8px 14px 8px 10px;
  color: var(--text-mid);
  cursor: pointer;
  pointer-events: auto;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 2px;
  text-transform: uppercase;
  transition: all 0.15s ease;
  z-index: 60;
}
.back-btn:hover {
  color: #fff;
  border-color: rgba(255,6,111,0.4);
  background: rgba(255,6,111,0.08);
}

/* Temporary FIGHT button (ТЗ Step 8 spec; replaced by Matchmaking in 3B). */
.fd-fight-btn {
  position: fixed;
  top: 20px; right: 20px;
  z-index: 60;
  padding: 10px 20px;
  font-family: var(--font-display);
  background: var(--hex-primary);
  color: #fff;
  border: none;
  cursor: pointer;
  pointer-events: auto;
  letter-spacing: 0.1em;
}

/* Top header (prototype 627-644). */
.fd-top {
  position: fixed;
  top: 14px; left: 50%;
  transform: translateX(-50%);
  text-align: center;
  pointer-events: none;
}
.fd-kicker {
  font-family: var(--font-mono);
  font-size: 9px; letter-spacing: 4px;
  color: #D4A843;
  text-transform: uppercase;
  margin-bottom: 4px;
}
.fd-name {
  font-family: var(--font-display);
  font-size: 22px; letter-spacing: 4px;
  line-height: 1;
}
.fd-meta {
  font-family: var(--font-mono);
  font-size: 10px; letter-spacing: 2px;
  color: var(--text-mid);
  margin-top: 5px;
}

/* Resource tiles (prototype 648-652 + .res 81-100). */
.fd-resources {
  position: fixed;
  top: 14px; right: 150px;
  display: flex;
  gap: 6px;
  pointer-events: none;
}
.res {
  background: var(--bg-panel);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 6px;
  padding: 6px 10px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  min-width: 64px;
}
.res-label {
  font-size: 8px; letter-spacing: 1.5px;
  color: var(--text-dim);
  text-transform: uppercase;
  font-weight: 500;
}
.res-val {
  font-family: var(--font-mono);
  font-size: 13px; color: #fff;
  margin-top: 1px; font-weight: 500;
}
.res.gold   .res-val { color: #FFD262; }
.res.energy .res-val { color: #6EE7FF; }

/* Stats strip (prototype 654-677). */
.fd-stats {
  position: fixed;
  bottom: 16px; left: 50%;
  transform: translateX(-50%);
  display: flex; gap: 32px;
  background: var(--bg-panel);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px;
  padding: 12px 24px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  pointer-events: none;
}
.fd-stat {
  text-align: center;
  min-width: 60px;
}
.fd-stat-val {
  font-family: var(--font-mono);
  font-size: 16px; color: #fff;
  font-weight: 500;
}
.fd-stat-label {
  font-family: var(--font-mono);
  font-size: 8px; letter-spacing: 1.5px;
  color: var(--text-dim);
  text-transform: uppercase;
  margin-top: 2px;
}

/* Branch labels — 3D-tracked (prototype 808-836). */
.branch-label {
  position: fixed;
  transform: translate(-50%, -100%);
  background: rgba(7, 8, 17, 0.92);
  border-radius: 4px;
  padding: 4px 8px;
  pointer-events: none;
  white-space: nowrap;
  margin-top: -8px;
  transition: opacity 0.2s ease;
}
.branch-label.speed     { border: 1px solid rgba(0,229,255,0.4); }
.branch-label.power     { border: 1px solid rgba(255,6,111,0.4); }
.branch-label.technique { border: 1px solid rgba(168,85,247,0.4); }
.bl-name {
  font-family: var(--font-mono);
  font-size: 8px; letter-spacing: 2px;
  text-transform: uppercase;
  font-weight: 500;
}
.branch-label.speed     .bl-name { color: #00E5FF; }
.branch-label.power     .bl-name { color: #FF066F; }
.branch-label.technique .bl-name { color: #A855F7; }
.bl-lvl {
  font-family: var(--font-mono);
  font-size: 11px; color: #fff;
  margin-top: 1px;
}
</style>
