<!-- Epic 3A Step 8a — Fighter Detail HUD without BranchPanel (that arrives in 8b).
     Layout and mocks copied 1-for-1 from prototype HTML 4378-4441 + data
     7681-7744. Branch labels are DOM-pinned to 3D column tops via fdLabels
     reactive store, written by FighterDetailScene.tick (Step 8a). -->
<template>
  <div class="hud detail-hud">
    <button class="back-btn" @click="onBack">&larr; Back</button>

    <!-- 5G Captain switch — only for real backend agents. Legacy mock
         routes (/v2/fd/warden|predator) have agent === null, so neither
         button nor badge render. -->
    <template v-if="props.agent">
      <div v-if="props.agent.isCaptain" class="captain-badge">&check; Captain</div>
      <button
        v-else
        class="set-captain-btn"
        :class="{ busy: settingCaptain }"
        :disabled="settingCaptain"
        @click="onSetCaptain"
      >Set as Captain</button>
    </template>

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
import { useStore } from 'vuex';
import { fdLabels } from '@/scene/interaction/useFdLabels.js';
import { getBeltDisplay } from '@/utils/beltDisplay.js';
import BranchPanel from './common/BranchPanel.vue';
import { FD_BRANCH_DATA } from './common/fdBranchData.js';

const props = defineProps({
  // Legacy mock route key — only meaningful when `agent` is null. Drives
  // the static KICKER/NAME/META mocks below for the legacy
  // /v2/fd/warden|predator paths.
  keyProp: { type: String, default: 'warden' },
  // Epic 4 Step 6 — when set, HUD renders real backend data instead of
  // mocks. View resolves either createdFighter cache OR fetchAgent and
  // hands the resulting Vuex agent down. null preserves legacy behaviour.
  agent: { type: Object, default: null },
});

const router = useRouter();
const store = useStore();

// 5G + 5L Phase 2 — Captain switch with optimistic update + rollback toast.
// UI flips isCaptain immediately via OPTIMISTIC_SET_CAPTAIN mutation
// (currentAgent + agents array). On success, fetchAgents syncs server-truth
// in background. On error, ROLLBACK_AGENTS restores snapshot and the action
// commits master/setErrorMessage toast. settingCaptain is re-entrancy guard
// preventing double-clicks during the dispatch round-trip.
const settingCaptain = ref(false);

async function onSetCaptain() {
  if (!props.agent || props.agent.isCaptain || settingCaptain.value) return;
  settingCaptain.value = true;
  try {
    await store.dispatch('agent/setCaptain', props.agent.id);
    // Hub auto-refreshes via CanvasLayer watcher (Epic 4 Step 5.5):
    // optimistic mutation → agentsList getter recomputes →
    // watcher fires → pit.refreshFighters({captain, secondAgent}).
  } catch (err) {
    console.error('[HudFighterDetail] setCaptain failed', err);
    // Toast surfaced from action (master/setErrorMessage commit).
  } finally {
    settingCaptain.value = false;
  }
}

// Mocks (prototype 7681-7744 + openFighterDetail 7958-7970).
// Used only when agent prop is null (legacy /v2/fd/warden|predator).
const KICKER = { warden: 'Captain \u00b7 Warden', predator: 'Predator' };
const NAME   = { warden: 'FIGHTER #1',            predator: 'FIGHTER #2' };
const META   = {
  warden:   'White Belt \u00b7 3W-1L-0D \u00b7 ELO 1247',
  predator: 'White Belt \u00b7 1W-0L-0D \u00b7 ELO 1043',
};
const LEGACY_STATS = [
  { val: '4',     label: 'Fights'    },
  { val: '75%',   label: 'Winrate'   },
  { val: '1,247', label: 'ELO'       },
  { val: '62%',   label: 'To Yellow' },
];
const LEGACY_RESOURCES = { taps: 880, xp: 300 };
const LEGACY_LEVELS = { speed: 6, power: 10, technique: 4 };

// Branch levels for any real agent (Epic 4 scope) — all zeroed. Real
// progression numbers wire in a later epic alongside the upgrade flow;
// upgrade buttons in BranchPanel are already disabled with the "Epic 4"
// title attribute.
const REAL_AGENT_LEVELS = { speed: 0, power: 0, technique: 0 };

const branchPanel = ref(null);
const panelData = ref(null);
const panelCost = ref(null);

// Capitalise an archetype id for display ('predator' -> 'Predator').
function capArch(s) {
  if (!s || typeof s !== 'string') return 'Fighter';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Format Belt grade as a label for the meta line (e.g. "Yellow Belt").
// Falls back to "White Belt" for grade 0 / unknown via getBeltDisplay.
function beltLabel(grade) {
  const g = typeof grade === 'number' ? grade : 0;
  const c = getBeltDisplay(g).color || 'white';
  return c.charAt(0).toUpperCase() + c.slice(1) + ' Belt';
}

const kicker = computed(() => {
  if (props.agent) {
    // 5G — kicker bug fix: respect isCaptain flag. Pre-5G every real agent
    // showed "Captain · ..." prefix regardless of captain status.
    return props.agent.isCaptain
      ? 'Captain · ' + capArch(props.agent.primaryModule)
      : capArch(props.agent.primaryModule);
  }
  return KICKER[props.keyProp] || KICKER.warden;
});
const name = computed(() => {
  if (props.agent) return props.agent.name || 'Fighter';
  return NAME[props.keyProp] || NAME.warden;
});
const meta = computed(() => {
  if (props.agent) {
    const a = props.agent;
    const wins   = a.wins   != null ? a.wins   : 0;
    const losses = a.losses != null ? a.losses : 0;
    const draws  = a.draws  != null ? a.draws  : 0;
    const elo    = a.elo    != null ? a.elo    : 1000;
    return `${beltLabel(a.belt)} · ${wins}W-${losses}L-${draws}D · ELO ${elo}`;
  }
  return META[props.keyProp] || META.warden;
});

const stats = computed(() => {
  if (!props.agent) return LEGACY_STATS;
  const a = props.agent;
  const fights = a.totalFights != null
    ? a.totalFights
    : (a.wins || 0) + (a.losses || 0) + (a.draws || 0);
  const winrate = fights > 0
    ? Math.round(((a.wins || 0) / fights) * 100) + '%'
    : '—';
  return [
    { val: String(fights),                                  label: 'Fights'    },
    { val: winrate,                                         label: 'Winrate'   },
    { val: (a.elo != null ? a.elo : 1000).toLocaleString(), label: 'ELO'       },
    { val: '—',                                        label: 'To Yellow' },
  ];
});

// Resources block (Taps / Free XP) — these are User-level fields, not
// per-agent. Real wiring is out of scope for Epic 4; default to zeros for
// real agents so the layout stays balanced.
const resources = computed(() =>
  props.agent ? { taps: 0, xp: 0 } : LEGACY_RESOURCES,
);

// Branch column levels — mocks for legacy keys, zeros for any real agent
// per ТЗ Step 6. Drives the "Lv N" tag in branch labels + BranchPanel level.
const levels = computed(() =>
  props.agent ? REAL_AGENT_LEVELS : LEGACY_LEVELS,
);

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

// Step 8b — open BranchPanel with mocked branch data + derived cost.
// Cost formula from prototype 7739-7742 (branchUpgradeCost).
// `levels` became a computed in Epic 4 Step 6 — unwrap with .value here in
// <script> (template auto-unwrap doesn't apply outside the render context).
function openBranchPanel(branchId) {
  const level = levels.value[branchId];
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

/* Resource tiles (prototype 648-652 + .res 81-100).
   right: 14px restored to prototype-parity in Step 11 — the temporary
   fd-fight-btn that caused the 150px offset in 3A is gone. */
.fd-resources {
  position: fixed;
  top: 14px; right: 14px;
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
/* ===== 5G — Set-as-Captain button + Captain badge =====
   Mirrors .back-btn placement (position: fixed, top:14px, z-index 60) on
   the right edge. Style language matches existing v2 buttons: dark bg
   + white border, hover→pink (--hex-primary), active scale(0.97), busy
   state via opacity 0.6. Badge is non-clickable status indicator with
   pink-tinted bg/border/text — semantic "captain" highlight. */
.set-captain-btn,
.captain-badge {
  position: fixed;
  top: 14px;
  right: 14px;
  z-index: 60;
  pointer-events: auto;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  border-radius: 6px;
}

.set-captain-btn {
  background: var(--bg-panel);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--text-mid);
  padding: 8px 14px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.set-captain-btn:hover:not(:disabled) {
  border-color: rgba(255, 6, 111, 0.45);
  color: #fff;
  background: rgba(255, 6, 111, 0.08);
}
.set-captain-btn:active:not(:disabled) {
  transform: scale(0.97);
}
.set-captain-btn.busy,
.set-captain-btn:disabled {
  opacity: 0.6;
  pointer-events: none;
  cursor: default;
}

.captain-badge {
  background: rgba(255, 6, 111, 0.12);
  border: 1px solid rgba(255, 6, 111, 0.45);
  color: var(--hex-primary);
  padding: 8px 14px;
  user-select: none;
}

@media (max-width: 820px) {
  .set-captain-btn,
  .captain-badge {
    padding: 6px 10px;
    font-size: 10px;
    letter-spacing: 1px;
  }
}
</style>
