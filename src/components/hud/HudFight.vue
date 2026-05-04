<!-- Epic 3A Step 14 — Fight HUD skeleton: fight-top (2 fighter cards + round
     counter + HP bars), cam-switcher (pit/side/cinema), back button,
     spectate badge. Layout and mocks 1-to-1 from prototype 4444-4472;
     fight-log + coach-pause + prep/result overlays arrive in Steps 15-17. -->
<template>
  <div class="hud fight-hud">
    <button class="fight-back" @click="onBack">&larr; Back</button>
    <!-- Sub-epic 4b — surrender button. Visible only during own active fight
         phase. Mutually exclusive с .spectate-badge (same top-right position;
         spectate gated на V2Spectate route, surrender gated на matchActive).
         Browser confirm() dialog acceptable per ТЗ (custom modal deferred). -->
    <button v-if="matchActive && fightState.phase === 'fight'"
            class="surrender-btn" @click="onSurrender" type="button">Surrender</button>
    <div v-if="isSpectating" class="spectate-badge"><span class="sb-dot"></span>Spectating</div>

    <div class="fight-top">
      <div class="fight-fighter left">
        <div class="ff-name">{{ fightState.leftName }}</div>
        <div class="ff-arch">{{ fightState.leftArch }}</div>
        <div class="ff-hp">
          <div class="ff-hp-fill" :style="{ width: leftHpPct + '%' }"></div>
        </div>
        <div class="ff-hp-num">
          {{ Math.round(fightState.leftHp) }} / {{ fightState.leftMaxHp }}
        </div>
      </div>

      <div class="fight-round">
        <div class="fr-kicker">Round</div>
        <div class="fr-num">{{ fightState.round }} / {{ fightState.totalRounds }}</div>
      </div>

      <div class="fight-fighter right">
        <div class="ff-name">{{ fightState.rightName }}</div>
        <div class="ff-arch">{{ fightState.rightArch }}</div>
        <div class="ff-hp">
          <div class="ff-hp-fill" :style="{ width: rightHpPct + '%' }"></div>
        </div>
        <div class="ff-hp-num">
          {{ Math.round(fightState.rightHp) }} / {{ fightState.rightMaxHp }}
        </div>
      </div>
    </div>

    <div class="cam-switcher">
      <button :class="{ active: camMode === 'pit' }"    @click="selectCam('pit')">Pit</button>
      <button :class="{ active: camMode === 'side' }"   @click="selectCam('side')">Side</button>
      <button :class="{ active: camMode === 'cinema' }" @click="selectCam('cinema')">Cinema</button>
    </div>

    <!-- Sub-epic 4a Commit 8b — dice scaffold. PvP-only render guard
         on matchActive; mock fallback path skips entirely. -->
    <div v-if="matchActive && (fightState.diceReady || fightState.diceActiveType)" class="dice-area">
      <button v-if="fightState.diceReady && !fightState.diceActiveType"
              class="dice-button dice-ready"
              @click="onDiceClick">🎲 ROLL</button>
      <div v-if="fightState.diceActiveType" class="dice-active-pill">
        {{ fightState.diceActiveType.toUpperCase() }}
      </div>
    </div>

    <!-- Combat log (Step 15, populated by useFightSimulation in Step 16). -->
    <div class="fight-log" ref="fightLogEl">
      <div
        v-for="(line, idx) in fightLog.lines"
        :key="idx"
        class="log-line"
        :class="line.cls"
        v-html="line.html"
      ></div>
    </div>

    <!-- White flash on hit (Step 15). -->
    <div class="hit-flash" :class="{ flash: flashing }"></div>

    <!-- Phase overlays + coach pause (Step 16). Styles live in
         src/styles/v24/fight-overlays.css (shared across overlays). -->
    <PrepOverlay
      :open="fightState.phase === 'prep'"
      :left-name="fightState.leftName"
      :left-arch="fightState.leftArch"
      :right-name="fightState.rightName"
      :right-arch="fightState.rightArch"
      @cancel="onBack"
      @start="onStartFight"
    />
    <CoachPause
      :open="fightState.coachPauseOpen"
      :text="fightState.coachPauseText"
      @select="onCoachSelect"
    />
    <ResultOverlay
      :open="fightState.phase === 'result'"
      :won="fightState.resultWon"
      :summary="fightState.resultSummary"
      @rematch="onRematch"
      @exit="onExit"
    />
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';
import { fightSceneApi } from '@/scene/scenes/useFightSceneApi.js';
import { fightLog } from './common/useFightLog.js';
import { flashing } from './common/useFlashHit.js';
import PrepOverlay from './common/PrepOverlay.vue';
import ResultOverlay from './common/ResultOverlay.vue';
import CoachPause from './common/CoachPause.vue';
import {
  fightState,
  startFight,
  resetFight,
  setCoachStrategy,
} from './common/useFightSimulation.js';

const router = useRouter();
const route = useRoute();
const store = useStore();

// Sub-epic 4a Commit 8a — PvP-aware coach select. CoachPause emits mock
// vocabulary ('aggressive' | 'defensive' | 'counter'); BE expects action
// vocabulary ('attack' | 'defense' | 'position'). ACTION_MAP translates
// when matchActive; falls back к existing setCoachStrategy mock callback
// when not (PvE / unauthenticated path).
const matchActive = computed(() => store.getters['pvp/getCurrentMatchId'] !== null);
const ACTION_MAP = { aggressive: 'attack', defensive: 'defense', counter: 'position' };

function onCoachSelect(strat) {
  if (matchActive.value) {
    const action = ACTION_MAP[strat];
    if (!action) return;
    store.dispatch('webSocket/sendMessage', {
      type: 'coach_choice',
      choice: { action },
    });
    fightState.coachPauseText = 'Waiting for opponent...';
  } else {
    setCoachStrategy(strat);
  }
}

// Sub-epic 4a Commit 8b — dice click handler. Bare {type: 'dice_roll'}
// payload mirrors v1 verbatim (Lesson #32). BE drives cooldown — FE clears
// diceReady immediately; dice_available re-enables на следующий tick.
function onDiceClick() {
  if (!matchActive.value || !fightState.diceReady) return;
  store.dispatch('webSocket/sendMessage', { type: 'dice_roll' });
  fightState.diceReady = false;
}

// Sub-epic 4b — surrender handler. Browser confirm() dialog (custom modal
// deferred). Bare {type: 'pvp_surrender'} payload mirrors dice_roll convention
// (Lesson #32) — BE C3 handler resolves match via getMatchByPlayer(user.odId),
// no need to send matchId. Defensive matchActive guard mirrors onDiceClick.
function onSurrender() {
  if (!matchActive.value) return;
  if (!confirm('Surrender this match? You will lose this fight.')) return;
  store.dispatch('webSocket/sendMessage', { type: 'pvp_surrender' });
}

// 5N — gate .spectate-badge on actual spectate route. Epic 3A shipped it
// always-visible (prototype 1645-1667 has it gated on body.fight-readonly,
// which v2 doesn't use). Bundled fix: visible only at /v2/spectate/:fightId.
const isSpectating = computed(() =>
  route.name === 'V2Spectate' || route.path.startsWith('/v2/spectate'),
);

// Step 16 — HP bars bind directly to fightState from useFightSimulation.
// No local `state` ref anymore; prep/fight/result transitions and round
// state are all driven by the shared reactive store.
const camMode = ref('pit');

const leftHpPct = computed(() =>
  Math.max(0, Math.round(100 * fightState.leftHp  / fightState.leftMaxHp)),
);
const rightHpPct = computed(() =>
  Math.max(0, Math.round(100 * fightState.rightHp / fightState.rightMaxHp)),
);

function selectCam(mode) {
  camMode.value = mode;
  fightSceneApi.setCamMode(mode);
}

function onBack() {
  router.push('/v2/fd/warden');
}

function onStartFight(strat) {
  startFight(strat);
}

function onRematch() {
  resetFight();
}

function onExit() {
  router.push('/v2/fd/warden');
}

// Re-export for the template (setCoachStrategy is bound to CoachPause @select).
// Nothing extra needed — direct import suffices.

// Auto-scroll log to newest line on every append.
const fightLogEl = ref(null);
watch(() => fightLog.lines.length, () => {
  nextTick(() => {
    if (fightLogEl.value) {
      fightLogEl.value.scrollTop = fightLogEl.value.scrollHeight;
    }
  });
});
</script>

<style scoped>
.fight-hud {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 50;
  color: #fff;
}

/* fight-top (prototype 838-881) */
.fight-top {
  position: fixed;
  top: 14px;
  left: 14px;
  right: 14px;
  display: flex;
  gap: 16px;
  align-items: center;
  pointer-events: none;
}
.fight-fighter {
  flex: 1;
  min-width: 0;
  background: var(--bg-panel);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 8px 12px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
.fight-fighter.left  { border-left:  3px solid #D4A843; }
.fight-fighter.right { border-right: 3px solid var(--hex-primary); text-align: right; }
.ff-name {
  font-family: var(--font-display);
  font-size: 14px;
  letter-spacing: 2px;
}
.ff-arch {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-top: 2px;
}
.fight-fighter.left  .ff-arch { color: #D4A843; }
.fight-fighter.right .ff-arch { color: var(--hex-primary); }
.ff-hp {
  height: 6px;
  margin-top: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
  overflow: hidden;
}
.ff-hp-fill {
  height: 100%;
  width: 100%;
  background: linear-gradient(90deg, #2ee07f, #2ee07f 60%, #ffbb33 80%, #ff4444);
  transition: width 0.4s ease;
}
.fight-fighter.right .ff-hp-fill {
  transform-origin: right;
}
.ff-hp-num {
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--text-mid);
  margin-top: 2px;
  letter-spacing: 1px;
}

/* fight-round (prototype 883-903) */
.fight-round {
  position: fixed;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  background: var(--bg-panel);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  padding: 6px 14px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  min-width: 100px;
  pointer-events: none;
}
.fr-kicker {
  font-family: var(--font-mono);
  font-size: 8px;
  letter-spacing: 2px;
  color: var(--text-dim);
  text-transform: uppercase;
}
.fr-num {
  font-family: var(--font-display);
  font-size: 16px;
  letter-spacing: 3px;
  margin-top: 1px;
}

/* cam-switcher (prototype 905-930) */
.cam-switcher {
  position: fixed;
  top: 90px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 4px;
  background: var(--bg-panel);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  padding: 4px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  pointer-events: auto;
  z-index: 60;
}
.cam-switcher button {
  background: transparent;
  border: none;
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  padding: 5px 10px;
  color: var(--text-dim);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s ease;
}
.cam-switcher button.active {
  background: rgba(255, 6, 111, 0.18);
  color: #fff;
  box-shadow: inset 0 0 0 1px rgba(255, 6, 111, 0.45);
}
.cam-switcher button:hover:not(.active) {
  color: var(--text-mid);
  background: rgba(255, 255, 255, 0.04);
}

/* fight-back (prototype 968-986) */
.fight-back {
  position: fixed;
  top: 90px;
  left: 14px;
  background: var(--bg-panel);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  padding: 6px 12px;
  color: var(--text-mid);
  cursor: pointer;
  pointer-events: auto;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 2px;
  text-transform: uppercase;
  transition: all 0.15s ease;
  z-index: 60;
}
.fight-back:hover {
  color: #fff;
  border-color: rgba(255, 6, 111, 0.4);
  background: rgba(255, 6, 111, 0.08);
}

/* Sub-epic 4b — surrender-btn. Top-right mirror of .fight-back baseline
   (top:90px). Mutually exclusive с .spectate-badge (same coords; spectate
   gated on V2Spectate route, surrender gated on matchActive). Destructive
   red palette per fight-overlays.css .phase-card.defeat precedent (#ff4444).
   pointer-events: auto required — .fight-hud parent has pointer-events: none. */
.surrender-btn {
  position: fixed;
  top: 90px;
  right: 14px;
  background: rgba(255, 68, 68, 0.08);
  border: 1px solid rgba(255, 68, 68, 0.4);
  border-radius: 6px;
  padding: 6px 12px;
  color: #ff8888;
  cursor: pointer;
  pointer-events: auto;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 2px;
  text-transform: uppercase;
  transition: all 0.15s ease;
  z-index: 60;
}
.surrender-btn:hover {
  color: #ffaaaa;
  border-color: rgba(255, 68, 68, 0.7);
  background: rgba(255, 68, 68, 0.16);
}

/* spectate-badge (prototype 1645-1667). 5N gated on V2Spectate route name
   / path prefix (replacing always-visible Epic 3A behavior). Prototype's
   body.fight-readonly equivalent in v2 = active /v2/spectate/:fightId. */
.spectate-badge {
  position: fixed;
  top: 90px;
  right: 14px;
  background: var(--bg-deep);
  border: 1px solid var(--hex-primary);
  border-radius: 16px;
  padding: 4px 14px;
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 2px;
  color: var(--hex-primary);
  text-transform: uppercase;
  z-index: 60;
  pointer-events: none;
}
.sb-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--hex-primary);
  box-shadow: 0 0 6px rgba(255, 6, 111, 0.6);
  margin-right: 4px;
  animation: livePulse 1.4s ease-in-out infinite;
}
@keyframes livePulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.5; }
}

/* fight-log (prototype 932-966) */
.fight-log {
  position: fixed;
  bottom: 14px;
  left: 14px;
  right: 14px;
  max-height: 22vh;
  background: var(--bg-panel);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 10px 14px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  overflow-y: auto;
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 1.5;
  pointer-events: auto;
  z-index: 55;
}
.fight-log::-webkit-scrollbar { width: 4px; }
.fight-log::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.12); }

.log-line {
  color: var(--text-mid);
  margin-bottom: 2px;
  opacity: 0;
  transform: translateY(4px);
  animation: logIn 0.3s ease forwards;
}
@keyframes logIn {
  to { opacity: 1; transform: translateY(0); }
}
.log-line :deep(.lt) {
  color: var(--text-dim);
  font-size: 9px;
  margin-right: 6px;
  letter-spacing: 1px;
}
.log-line.actor-warden  :deep(.ln) { color: #D4A843; }
.log-line.actor-predator :deep(.ln) { color: var(--hex-primary); }
.log-line.miss  { color: var(--text-dim); }
.log-line.crit  { color: #ff4488; font-weight: 500; }
.log-line.round { color: #fff; margin-top: 6px; letter-spacing: 1.5px; }

/* hit-flash (prototype 1337-1351) */
.hit-flash {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background: rgba(255, 255, 255, 0);
  z-index: 70;
}
.hit-flash.flash {
  background: rgba(255, 255, 255, 0.18);
  animation: hitflash 0.18s ease-out;
}
@keyframes hitflash {
  0%   { background: rgba(255, 255, 255, 0.3); }
  100% { background: rgba(255, 255, 255, 0); }
}

/* Sub-epic 4a Commit 8b — dice scaffold (PvP-only). HUD overlay
   convention (Lesson #34): pointer-events: auto on interactive button,
   inherits none from parent .fight-hud. */
.dice-area {
  position: fixed;
  bottom: 220px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  z-index: 60;
  pointer-events: none;
}
.dice-button {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 2px solid var(--hex-primary);
  background: rgba(255, 6, 111, 0.15);
  color: var(--hex-primary);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  cursor: pointer;
  pointer-events: auto;
  transition: transform 0.12s ease, background 0.18s ease;
  animation: dicePulse 1.4s ease-in-out infinite;
}
.dice-button:hover { transform: scale(1.06); }
.dice-button:active { transform: scale(0.96); }
.dice-active-pill {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 1.5px;
  padding: 4px 10px;
  border-radius: 12px;
  background: rgba(255, 6, 111, 0.18);
  color: var(--hex-primary);
  border: 1px solid rgba(255, 6, 111, 0.4);
}
@keyframes dicePulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 6, 111, 0.4); }
  50%      { box-shadow: 0 0 0 8px rgba(255, 6, 111, 0); }
}
</style>
