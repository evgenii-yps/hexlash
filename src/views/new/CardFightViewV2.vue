<template>
  <div class="cfv2">
    <canvas ref="sceneCanvas" class="scene-canvas" id="sceneFight"></canvas>
    <div class="scanlines" aria-hidden="true"></div>

    <div class="hud fight-hud">
      <!-- Top bar: minimal placeholder, full HUD in 3.10.3 -->
      <div class="cfv2-top">
        <button class="cfv2-back" @click="onBackClick">←</button>
        <div class="cfv2-phase-indicator">
          {{ phaseLabel }}
        </div>
      </div>

      <!-- Countdown overlay -->
      <transition-group name="cfv2-fade-scale" tag="div" class="cfv2-countdown" v-if="showCountdown">
        <div v-if="countdownValue !== 0" :key="countdownValue" class="cfv2-countdown-item">
          <p>{{ countdownValue }}</p>
        </div>
      </transition-group>

      <!-- Phase 'coach' temporary stub — full overlay in 3.10.3 -->
      <div v-if="fightPhase === 'coach'" class="cfv2-coach-stub">
        <div class="cfv2-coach-text">{{ fv2.lblCoachStub || 'Coach pause (HUD coming in 3.10.3)' }}</div>
        <div class="cfv2-coach-buttons">
          <button @click="onCoachChoice('attack')">Attack</button>
          <button @click="onCoachChoice('defense')">Defense</button>
          <button @click="onCoachChoice('position')">Position</button>
        </div>
      </div>

      <!-- Phase 'results' temporary stub — full overlay in 3.10.4 -->
      <div v-if="fightPhase === 'results'" class="cfv2-result-stub">
        <div class="cfv2-result-title">{{ resultTitle }}</div>
        <div class="cfv2-result-actions">
          <button @click="onFightAgain">{{ fv2.lblFightAgain || 'Fight Again' }}</button>
          <button @click="onExitToPit">{{ fv2.lblExitToPit || 'Exit to Pit' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import store from '@/core/state/store.js';
import { t } from '@/locales/index.js';
import { initFightScene } from '@/three/scenes/fightArena.js';
import { COUNTDOWN, ROUND_ANIMATION_MS } from '@/core/constants.js';

export default {
  name: 'FightV2',
  setup() {
    const route = useRoute();
    const router = useRouter();

    // ── Refs ──
    const sceneCanvas = ref(null);
    let sceneCtl = null; // controller from initFightScene

    // ── PvP guard (this sub-ТЗ is PvE-only) ──
    const isPvP = computed(() => route.query.mode === 'pvp');

    // ── Locale ──
    const fv2 = computed(() => t.value.fight?.v2 || {});

    // ── Vuex getters ──
    const fightPhase  = computed(() => store.getters['fight/getFightPhase']);
    const liveHP1     = computed(() => store.getters['fight/getLiveHP1']);
    const liveHP2     = computed(() => store.getters['fight/getLiveHP2']);
    const roundNum    = computed(() => store.getters['fight/getRoundNum']);
    const roundLog    = computed(() => store.getters['fight/getRoundLog']);
    const opponent    = computed(() => store.getters['fight/getOpponent']);
    const activeAgent = computed(() => store.getters['agent/activeAgent']);
    const isOverdrive = computed(() => store.getters['fight/isOverdrive']);

    // ── Countdown ──
    const showCountdown  = ref(false);
    const countdownValue = ref(COUNTDOWN);
    let countdownTimer   = null;

    // ── Round timer (PvE auto-advance) ──
    let roundTimer = null;

    // ── Phase label (placeholder, replaced in 3.10.3) ──
    const phaseLabel = computed(() => {
      if (fightPhase.value === 'fighting') return `Round ${roundNum.value}`;
      if (fightPhase.value === 'coach')    return 'Coach Pause';
      if (fightPhase.value === 'results')  return 'Result';
      return '';
    });

    // ── Result classification ──
    const resultState = computed(() => {
      if (fightPhase.value !== 'results') return '';
      const draw = liveHP1.value <= 0 && liveHP2.value <= 0;
      if (draw) return 'draw';
      if (liveHP1.value <= 0) return 'lose';
      if (liveHP2.value <= 0) return 'win';
      if (liveHP1.value > liveHP2.value) return 'win';
      if (liveHP1.value < liveHP2.value) return 'lose';
      return 'draw';
    });

    const resultTitle = computed(() => {
      if (resultState.value === 'win')  return fv2.value.lblVictory || 'VICTORY';
      if (resultState.value === 'lose') return fv2.value.lblDefeat  || 'DEFEAT';
      if (resultState.value === 'draw') return fv2.value.lblDraw    || 'DRAW';
      return '';
    });

    // ── Fight loop ──
    function startCountdown() {
      clearInterval(countdownTimer);
      showCountdown.value  = true;
      countdownValue.value = COUNTDOWN;
      countdownTimer = setInterval(() => {
        if (countdownValue.value > 1) {
          countdownValue.value -= 1;
        } else {
          countdownValue.value = fv2.value.lblFight || 'FIGHT';
          clearInterval(countdownTimer);
          setTimeout(() => {
            countdownValue.value = 0;
            showCountdown.value  = false;
            startRoundTimer();
          }, 600);
        }
      }, 800);
    }

    function startRoundTimer() {
      stopRoundTimer();
      roundTimer = setInterval(() => {
        if (fightPhase.value === 'fighting') {
          store.dispatch('fight/computeNextRound');
        } else {
          stopRoundTimer();
        }
      }, ROUND_ANIMATION_MS);
    }

    function stopRoundTimer() { clearInterval(roundTimer); }

    // ── 3D scene init ──
    function maybeInitScene() {
      if (sceneCtl) return;
      if (!sceneCanvas.value) return;
      const opp = opponent.value;
      const agent = activeAgent.value;
      if (!opp || !agent) return;

      const leftArch  = agent.primaryModule || 'warden';
      const rightArch = (Array.isArray(opp.modules) && opp.modules[0]) || 'predator';

      sceneCtl = initFightScene(sceneCanvas.value, {
        leftFighter:  { archetype: leftArch },
        rightFighter: { archetype: rightArch },
      });
    }

    // ── Round → 3D animation ──
    function playRoundAnimation(round) {
      if (!sceneCtl || !round) return;

      const A1 = round.action1;
      const A2 = round.action2;

      if (A1 === 'defense') sceneCtl.triggerAction('left',  'defend');
      if (A2 === 'defense') sceneCtl.triggerAction('right', 'defend');

      if (A1 === 'attack') setTimeout(() => sceneCtl?.triggerAction('left',  'attack'), 200);
      if (A2 === 'attack') setTimeout(() => sceneCtl?.triggerAction('right', 'attack'), 350);

      if (round.damage2 > 0) setTimeout(() => sceneCtl?.triggerAction('right', 'hit'), 600);
      if (round.damage1 > 0) setTimeout(() => sceneCtl?.triggerAction('left',  'hit'), 750);
    }

    // ── Watchers ──
    const stopOpWatch = watch([opponent, activeAgent, sceneCanvas], () => {
      maybeInitScene();
    }, { immediate: false });

    const stopRoundWatch = watch(roundLog, (newLog, oldLog) => {
      if (!Array.isArray(newLog)) return;
      const oldLen = Array.isArray(oldLog) ? oldLog.length : 0;
      if (newLog.length > oldLen) {
        const lastRound = newLog[newLog.length - 1];
        playRoundAnimation(lastRound);
      }
    }, { deep: false });

    // Restart round timer when phase returns to 'fighting' from 'coach'
    const stopPhaseWatch = watch(fightPhase, (phase) => {
      if (phase === 'fighting' && roundNum.value > 0) {
        startRoundTimer();
      } else if (phase !== 'fighting') {
        stopRoundTimer();
      }
    });

    // ── Coach + Results stubs ──
    function onCoachChoice(action) {
      store.dispatch('fight/applyCoachAdvice', action);
    }

    function onFightAgain() {
      store.dispatch('fight/fightAgain', { targetRoute: '/fight-v2' });
    }

    function onExitToPit() {
      store.dispatch('fight/resetToPreparation');
    }

    function onBackClick() {
      if (fightPhase.value === 'fighting' || fightPhase.value === 'coach') {
        if (!confirm(fv2.value.lblConfirmLeave || 'Leave the fight?')) return;
        store.dispatch('fight/clearSavedFight');
      }
      router.push('/arena/pit');
    }

    // ── Lifecycle ──
    onMounted(async () => {
      if (isPvP.value) {
        store.commit('master/setInfoMessage', { text: 'PvP not yet supported in V2 fight view', timeout: 3000 });
        await router.replace('/arena/pit');
        return;
      }

      await store.dispatch('fight/initFromStorage');

      if (fightPhase.value === 'idle' || fightPhase.value === 'preparation') {
        await router.replace('/arena/pit');
        return;
      }

      maybeInitScene();

      if (fightPhase.value === 'fighting') {
        if (roundNum.value === 0) {
          startCountdown();
        } else {
          showCountdown.value = false;
          startRoundTimer();
        }
      } else if (fightPhase.value === 'coach' || fightPhase.value === 'results') {
        showCountdown.value = false;
      }
    });

    onBeforeUnmount(() => {
      stopRoundTimer();
      clearInterval(countdownTimer);
      stopOpWatch();
      stopRoundWatch();
      stopPhaseWatch();
      if (sceneCtl) {
        sceneCtl.cleanup();
        sceneCtl = null;
      }
    });

    return {
      sceneCanvas,
      fv2,
      fightPhase, liveHP1, liveHP2, roundNum, isOverdrive,
      showCountdown, countdownValue, phaseLabel, resultTitle,
      onCoachChoice, onFightAgain, onExitToPit, onBackClick,
    };
  },
};
</script>

<style scoped>
.cfv2 { position: relative; width: 100%; height: 100vh; overflow: hidden; background: var(--hex-bg-deep); }
@supports (height: 100dvh) { .cfv2 { height: 100dvh; } }

.scene-canvas { position: fixed; inset: 0; width: 100%; height: 100%; }

/* Top bar */
.cfv2-top {
  position: absolute; top: 0; left: 0; right: 0;
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px;
  z-index: 10;
}
.cfv2-back {
  background: var(--hex-bg-card);
  border: 1px solid var(--hex-border-default);
  color: var(--hex-text-primary);
  border-radius: var(--hex-radius-md);
  padding: 8px 16px;
  font-size: 18px;
  cursor: pointer;
  min-height: 44px;
  min-width: 44px;
}
.cfv2-phase-indicator {
  font-family: var(--hex-font-display);
  color: var(--hex-text-primary);
  letter-spacing: 2px;
  font-size: 14px;
  background: var(--hex-bg-card);
  padding: 8px 16px;
  border-radius: var(--hex-radius-md);
}

/* Countdown overlay */
.cfv2-countdown {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  z-index: 50;
  pointer-events: none;
}
.cfv2-countdown-item {
  font-family: var(--hex-font-display);
  font-size: 96px;
  color: var(--hex-primary);
  text-shadow: 0 0 24px var(--hex-primary);
}
.cfv2-fade-scale-enter-active, .cfv2-fade-scale-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}
.cfv2-fade-scale-enter-from, .cfv2-fade-scale-leave-to {
  opacity: 0; transform: scale(1.3);
}

/* Coach stub */
.cfv2-coach-stub {
  position: absolute; bottom: 80px; left: 50%; transform: translateX(-50%);
  background: var(--hex-bg-card); border: 1px solid var(--hex-border-active);
  padding: 16px 24px; border-radius: var(--hex-radius-lg);
  text-align: center; min-width: 280px; z-index: 50;
}
.cfv2-coach-text {
  font-family: var(--hex-font-body); color: var(--hex-text-primary);
  margin-bottom: 12px; font-size: 13px;
}
.cfv2-coach-buttons { display: flex; gap: 8px; justify-content: center; }
.cfv2-coach-buttons button {
  background: var(--hex-bg-medium);
  border: 1px solid var(--hex-border-default);
  color: var(--hex-text-primary);
  padding: 8px 16px; border-radius: var(--hex-radius-md);
  cursor: pointer; min-height: 44px;
  font-family: var(--hex-font-display); font-size: 11px; letter-spacing: 1.5px;
}

/* Result stub */
.cfv2-result-stub {
  position: absolute; inset: 0;
  background: rgba(7, 8, 17, 0.85);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  z-index: 60;
}
.cfv2-result-title {
  font-family: var(--hex-font-display);
  font-size: 64px; letter-spacing: 6px;
  color: var(--hex-primary);
  margin-bottom: 32px;
  text-shadow: 0 0 24px var(--hex-primary);
}
.cfv2-result-actions { display: flex; gap: 12px; }
.cfv2-result-actions button {
  background: var(--hex-bg-card);
  border: 1px solid var(--hex-text-primary);
  color: var(--hex-text-primary);
  padding: 12px 24px; border-radius: var(--hex-radius-md);
  cursor: pointer; min-height: 44px;
  font-family: var(--hex-font-display); font-size: 12px; letter-spacing: 2px;
}
</style>
