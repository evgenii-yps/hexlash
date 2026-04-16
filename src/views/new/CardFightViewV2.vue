<template>
  <div class="cfv2" :class="{ 'cfv2-overdrive': isOverdrive, 'cfv2-flash': flashActive }" :style="flashStyle">
    <canvas ref="sceneCanvas" class="scene-canvas" id="sceneFight"></canvas>
    <div class="scanlines" aria-hidden="true"></div>

    <div class="hud fight-hud">

      <!-- ── TOP BAR ──────────────────────────────────────────────────── -->
      <div class="cfv2-top">
        <button class="cfv2-back" @click="onBackClick" aria-label="back">←</button>

        <!-- Camera switcher -->
        <div class="cfv2-cam" role="tablist" aria-label="camera">
          <button
            v-for="mode in CAM_MODES"
            :key="mode.id"
            class="cfv2-cam-btn"
            :class="{ 'cfv2-cam-btn--active': cameraMode === mode.id }"
            @click="setCamera(mode.id)"
          >{{ fv2[mode.labelKey] || mode.fallback }}</button>
        </div>
      </div>

      <!-- ── FIGHTER CARDS + HP BARS + ROUND INDICATOR ───────────────── -->
      <div class="cfv2-fighters" v-if="showFighterPanels">
        <!-- LEFT -->
        <div class="cfv2-fighter cfv2-fighter--left" :class="{ 'cfv2-shake': shakeLeft }">
          <div class="cfv2-fname">{{ agentName || 'You' }}</div>
          <BeltBadge
            v-if="activeAgent"
            :grade="activeAgent.belt || 0"
            :isHexmaster="activeAgent.isHexmaster || false"
            size="sm"
          />
          <HPBar :currentHP="liveHP1" :name="''" class="cfv2-hp" />
        </div>

        <!-- CENTER — round indicator / OVERDRIVE -->
        <div class="cfv2-center">
          <div class="cfv2-round-label" v-if="fightPhase === 'fighting' && !isOverdrive">
            R{{ Math.max(1, roundNum) }}/{{ MAX_ROUNDS }}
          </div>
          <div class="cfv2-round-dots" v-if="fightPhase === 'fighting' && !isOverdrive">
            <span
              v-for="n in MAX_ROUNDS"
              :key="n"
              class="cfv2-round-dot"
              :class="{
                'cfv2-round-dot--done':    n < roundNum,
                'cfv2-round-dot--current': n === roundNum,
              }"
            ></span>
          </div>
          <div class="cfv2-overdrive-label" v-if="isOverdrive && fightPhase === 'fighting'">
            {{ fv2.lblOverdrive || 'OVERDRIVE' }}
          </div>
        </div>

        <!-- RIGHT -->
        <div class="cfv2-fighter cfv2-fighter--right" :class="{ 'cfv2-shake': shakeRight }">
          <div class="cfv2-fname">{{ opponent?.name || 'Opponent' }}</div>
          <BeltBadge
            v-if="opponent && typeof opponent.belt === 'number'"
            :grade="opponent.belt"
            :isHexmaster="!!opponent.isHexmaster"
            size="sm"
          />
          <HPBar :currentHP="liveHP2" :name="''" class="cfv2-hp" />
        </div>
      </div>

      <!-- ── ACTIVE MODIFIERS PILLS ──────────────────────────────────── -->
      <div
        class="cfv2-mods"
        v-if="fightPhase === 'fighting' && anyModActive && !diceState.activeItem"
      >
        <span v-if="playerModifiers.attackMultiplier > 1" class="cfv2-mod">2× ATK</span>
        <span v-if="playerModifiers.shieldActive" class="cfv2-mod">
          {{ fv2.lblModShield || 'SHIELD' }}
        </span>
        <span v-if="playerModifiers.blindActive" class="cfv2-mod">
          {{ fv2.lblModBlind || 'BLIND' }}
        </span>
      </div>

      <!-- ── EVENT TITLE POPUP (dice pickup, crits, emergency) ───────── -->
      <transition name="cfv2-pop">
        <div v-if="eventTitle" class="cfv2-event" :class="eventTitleClass">
          <img v-if="eventImage" :src="eventImage" class="cfv2-event-icon" alt=""/>
          <span>{{ eventTitle }}</span>
        </div>
      </transition>

      <!-- ── DICE AREA ───────────────────────────────────────────────── -->
      <div
        class="cfv2-dice-area"
        v-if="fightPhase === 'fighting' && roundNum > 0 && !isOverdrive && (diceState.ready || diceState.activeItem)"
      >
        <button
          v-if="diceState.ready && !diceState.activeItem"
          class="cfv2-dice-btn"
          @click="onRollDice"
          aria-label="roll dice"
        >
          <img :src="iconDice" class="cfv2-dice-icon" alt=""/>
        </button>
        <transition name="cfv2-pop">
          <div v-if="diceState.activeItem" class="cfv2-dice-result">
            <img :src="diceState.activeItem.image" class="cfv2-dice-result-icon" alt=""/>
            <div class="cfv2-dice-info">
              <span class="cfv2-dice-name">{{ (t.fight.diceName && t.fight.diceName[diceState.activeItem.id]) || diceState.activeItem.id }}</span>
              <span class="cfv2-dice-desc">{{ (t.fight.diceDesc && t.fight.diceDesc[diceState.activeItem.id]) || '' }}</span>
            </div>
          </div>
        </transition>
      </div>

      <!-- ── COMBAT LOG DRAWER ───────────────────────────────────────── -->
      <div class="cfv2-log" v-if="fightPhase === 'fighting' && lastLog.length > 0">
        <button class="cfv2-log-toggle" @click="logOpen = !logOpen">
          {{ fv2.lblLog || 'LOG' }} {{ logOpen ? '▾' : '▴' }}
        </button>
        <transition name="cfv2-log-slide">
          <div v-if="logOpen" class="cfv2-log-list">
            <div v-for="r in lastLog" :key="r.roundNum" class="cfv2-log-row">
              <span class="cfv2-log-r" :class="{ 'cfv2-log-r--od': r.roundNum > MAX_ROUNDS }">
                {{ r.roundNum > MAX_ROUNDS ? 'E' + (r.roundNum - MAX_ROUNDS) : 'R' + r.roundNum }}
              </span>
              <span class="cfv2-log-hp">{{ r.hp1After }} / {{ r.hp2After }}</span>
            </div>
          </div>
        </transition>
      </div>

      <!-- ── COUNTDOWN OVERLAY ───────────────────────────────────────── -->
      <transition-group name="cfv2-fade-scale" tag="div" class="cfv2-countdown" v-if="showCountdown">
        <div v-if="countdownValue !== 0" :key="countdownValue" class="cfv2-countdown-item">
          <p>{{ countdownValue }}</p>
        </div>
      </transition-group>

      <!-- ── COACH OVERLAY (PvE, 15s timer) ──────────────────────────── -->
      <div v-if="fightPhase === 'coach'" class="cfv2-coach-overlay">
        <div class="cfv2-coach-panel">
          <div class="cfv2-coach-timer" :class="{ 'cfv2-coach-timer--urgent': adviceTimer <= 3 }">
            <span :key="adviceTimer">{{ adviceTimer }}</span>
          </div>
          <div class="cfv2-coach-title">{{ fv2.lblCoachTitle || 'COACH' }}</div>
          <div class="cfv2-coach-subtitle">{{ fv2.lblCoachSubtitle || 'Choose your next move' }}</div>
          <div class="cfv2-coach-buttons">
            <button class="cfv2-coach-btn cfv2-coach-btn--attack" @click="onCoachChoice('attack')">
              {{ fv2.lblCoachAttack || 'ATTACK' }}
            </button>
            <button class="cfv2-coach-btn cfv2-coach-btn--defense" @click="onCoachChoice('defense')">
              {{ fv2.lblCoachDefense || 'DEFENSE' }}
            </button>
            <button class="cfv2-coach-btn cfv2-coach-btn--position" @click="onCoachChoice('position')">
              {{ fv2.lblCoachPosition || 'POSITION' }}
            </button>
          </div>
        </div>
      </div>

      <!-- ── RESULTS STUB (replaced by full overlay in 3.10.4) ───────── -->
      <div v-if="fightPhase === 'results'" class="cfv2-result-stub">
        <div class="cfv2-result-title" :class="'cfv2-result-title--' + resultState">{{ resultTitle }}</div>
        <div class="cfv2-result-xp" v-if="xpEarned">
          <div class="cfv2-result-xp-label">{{ fv2.lblXpEarned || 'XP EARNED' }}</div>
          <div class="cfv2-result-xp-value">+{{ xpEarned }} XP</div>
        </div>
        <div class="cfv2-result-actions">
          <button class="cfv2-result-btn cfv2-result-btn--primary" @click="onFightAgain">
            {{ fv2.lblFightAgain || 'FIGHT AGAIN' }}
          </button>
          <button class="cfv2-result-btn" @click="onExitToPit">
            {{ fv2.lblExitToPit || 'EXIT TO PIT' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import store from '@/core/state/store.js';
import apiClient from '@/core/api/apiClient.js';
import { t } from '@/locales/index.js';
import { initFightScene } from '@/three/scenes/fightArena.js';
import { COUNTDOWN, ROUND_ANIMATION_MS, MAX_HP, MAX_ROUNDS } from '@/core/constants.js';
import HPBar from '@/components/fragments/fight/HPBar.vue';
import BeltBadge from '@/components/ui/BeltBadge.vue';
import iconDice from '@/assets/images/icons/dice.svg';

const CAM_MODES = [
  { id: 'pit',    labelKey: 'lblCamPit',    fallback: 'PIT' },
  { id: 'side',   labelKey: 'lblCamSide',   fallback: 'SIDE' },
  { id: 'cinema', labelKey: 'lblCamCinema', fallback: 'CINEMA' },
];

export default {
  name: 'FightV2',
  components: { HPBar, BeltBadge },
  setup() {
    const route = useRoute();
    const router = useRouter();

    // ── Refs ──
    const sceneCanvas = ref(null);
    let sceneCtl = null;

    // ── PvP guard (PvE-only in this sub-ТЗ) ──
    const isPvP = computed(() => route.query.mode === 'pvp');

    // ── Locale ──
    const fv2 = computed(() => t.value.fight?.v2 || {});

    // ── Store getters ──
    const fightPhase      = computed(() => store.getters['fight/getFightPhase']);
    const liveHP1         = computed(() => store.getters['fight/getLiveHP1']);
    const liveHP2         = computed(() => store.getters['fight/getLiveHP2']);
    const roundNum        = computed(() => store.getters['fight/getRoundNum']);
    const roundLog        = computed(() => store.getters['fight/getRoundLog']);
    const opponent        = computed(() => store.getters['fight/getOpponent']);
    const activeAgent     = computed(() => store.getters['agent/activeAgent']);
    const isOverdrive     = computed(() => store.getters['fight/isOverdrive']);
    const diceState       = computed(() => store.getters['fight/getDiceState']);
    const playerModifiers = computed(() => store.getters['fight/getPlayerModifiers']);
    const eventTitle      = computed(() => store.getters['fight/getEventTitle']);
    const eventTitleClass = computed(() => store.getters['fight/getEventTitleClass']);
    const eventImage      = computed(() => store.getters['fight/getEventImage']);
    const fightStats      = computed(() => store.getters['fight/getFightStats']);
    const xpEarned        = computed(() => store.getters['fight/getXpEarned']);

    const agentName = computed(() => activeAgent.value?.name);

    const anyModActive = computed(() =>
      playerModifiers.value.attackMultiplier > 1 ||
      playerModifiers.value.shieldActive ||
      playerModifiers.value.blindActive
    );

    // ── Countdown ──
    const showCountdown  = ref(false);
    const countdownValue = ref(COUNTDOWN);
    let countdownTimer   = null;

    // ── Round timer ──
    let roundTimer = null;

    // ── Shake / flash ──
    const shakeLeft  = ref(false);
    const shakeRight = ref(false);
    const flashActive = ref(false);
    const flashColor  = ref('transparent');
    const flashStyle = computed(() => ({ '--cfv2-flash-color': flashColor.value }));
    let prevHP1 = MAX_HP;
    let prevHP2 = MAX_HP;

    // ── Camera ──
    const cameraMode = ref('pit');
    function setCamera(mode) {
      cameraMode.value = mode;
      if (sceneCtl && typeof sceneCtl.setCameraMode === 'function') {
        sceneCtl.setCameraMode(mode);
      }
    }

    // ── Combat log drawer ──
    const logOpen = ref(false);
    const lastLog = computed(() => {
      const log = roundLog.value;
      if (!Array.isArray(log)) return [];
      return log.slice(-5);
    });

    // ── Fighter panel visibility (hide during full-screen overlays) ──
    const showFighterPanels = computed(() =>
      fightPhase.value !== 'results' &&
      fightPhase.value !== 'coach'
    );

    // ── Coach advice timer (PvE: 15s) ──
    const adviceTimer = ref(15);
    let coachTimerInterval = null;
    function startCoachTimer() {
      adviceTimer.value = 15;
      stopCoachTimer();
      coachTimerInterval = setInterval(() => {
        adviceTimer.value -= 1;
        if (adviceTimer.value <= 0) {
          stopCoachTimer();
          store.dispatch('fight/skipCoachAdvice');
        }
      }, 1000);
    }
    function stopCoachTimer() {
      if (coachTimerInterval) {
        clearInterval(coachTimerInterval);
        coachTimerInterval = null;
      }
    }

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

    // ── Countdown / round loop ──
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
    function stopRoundTimer() { clearInterval(roundTimer); roundTimer = null; }

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
      if (typeof sceneCtl.setCameraMode === 'function') {
        sceneCtl.setCameraMode(cameraMode.value);
      }
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

    // ── Shake / flash triggers ──
    function triggerShake(side) {
      if (side === 'left') {
        shakeLeft.value = true;
        setTimeout(() => { shakeLeft.value = false; }, 400);
      } else {
        shakeRight.value = true;
        setTimeout(() => { shakeRight.value = false; }, 400);
      }
    }
    function triggerFlash(color) {
      flashColor.value = color;
      flashActive.value = true;
      setTimeout(() => { flashActive.value = false; }, 250);
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

    const stopHP1Watch = watch(liveHP1, (newV) => {
      if (newV < prevHP1) triggerShake('left');
      prevHP1 = newV;
    });
    const stopHP2Watch = watch(liveHP2, (newV) => {
      if (newV < prevHP2) triggerShake('right');
      prevHP2 = newV;
    });

    // Flash on dice activation / overdrive start
    const stopDiceWatch = watch(() => diceState.value?.activeItem, (item) => {
      if (!item) return;
      const id = item.id;
      if (id === 'crit')  triggerFlash('rgba(255, 230, 0, 0.35)');
      if (id === 'rage')  triggerFlash('rgba(255, 51, 51, 0.35)');
      if (id === 'heal')  triggerFlash('rgba(0, 255, 136, 0.25)');
    });
    const stopOverdriveWatch = watch(isOverdrive, (od) => {
      if (od) triggerFlash('rgba(255, 6, 111, 0.4)');
    });

    // Phase transitions
    const stopPhaseWatch = watch(fightPhase, (val, oldVal) => {
      // Coach enter / leave
      if (val === 'coach') {
        stopRoundTimer();
        startCoachTimer();
      }
      if (oldVal === 'coach' && val !== 'coach') {
        stopCoachTimer();
      }
      // Resume timer after coach
      if (val === 'fighting' && oldVal === 'coach') {
        startRoundTimer();
      } else if (val === 'fighting' && !roundTimer && roundNum.value > 0) {
        startRoundTimer();
      } else if (val !== 'fighting' && val !== 'coach') {
        stopRoundTimer();
      }
      // Results: POST /fight/save + XP award (bonus fix, missed in 3.10.2)
      if (val === 'results') {
        stopRoundTimer();
        if (!isPvP.value && !store.getters['fight/getXpAwarded']) {
          const expGain = resultState.value === 'win' ? 10
                        : resultState.value === 'draw' ? 7
                        : 5;
          store.commit('fight/setXpEarned', expGain);
          store.commit('fight/setXpAwarded', true);

          const isWin  = resultState.value === 'win';
          const isDraw = resultState.value === 'draw';
          apiClient.post('/fight/save', {
            isWin,
            isDraw,
            roundsPlayed: roundNum.value,
            totalDamageDealt: fightStats.value?.totalDamageDealt || 0,
          }, { authRequired: true })
            .then(() => store.dispatch('agent/fetchAgents'))
            .catch(() => { /* graceful */ });
        }
      }
    });

    // ── Actions ──
    function onRollDice() {
      store.dispatch('fight/rollDiceManual');
    }

    function onCoachChoice(action) {
      stopCoachTimer();
      store.dispatch('fight/applyCoachAdvice', action);
    }

    function onFightAgain() {
      stopRoundTimer();
      clearInterval(countdownTimer);
      store.dispatch('fight/fightAgain', { targetRoute: '/fight-v2' });
    }

    function onExitToPit() {
      store.dispatch('fight/resetToPreparation');
    }

    function onBackClick() {
      if (fightPhase.value === 'fighting' || fightPhase.value === 'coach') {
        // eslint-disable-next-line no-alert
        if (!confirm(fv2.value.lblConfirmLeave || 'Leave the fight?')) return;
        store.dispatch('fight/clearSavedFight');
      }
      router.push('/arena/pit');
    }

    // ── Prevent accidental reload during fight ──
    function handleBeforeUnload(e) {
      if (fightPhase.value === 'fighting' || fightPhase.value === 'coach') {
        e.preventDefault();
        e.returnValue = '';
      }
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

      prevHP1 = liveHP1.value ?? MAX_HP;
      prevHP2 = liveHP2.value ?? MAX_HP;

      maybeInitScene();

      if (fightPhase.value === 'fighting') {
        if (roundNum.value === 0) {
          startCountdown();
        } else {
          showCountdown.value = false;
          startRoundTimer();
        }
      } else if (fightPhase.value === 'coach') {
        showCountdown.value = false;
        startCoachTimer();
      } else if (fightPhase.value === 'results') {
        showCountdown.value = false;
      }

      window.addEventListener('beforeunload', handleBeforeUnload);
    });

    onBeforeUnmount(() => {
      stopRoundTimer();
      stopCoachTimer();
      clearInterval(countdownTimer);
      stopOpWatch();
      stopRoundWatch();
      stopPhaseWatch();
      stopHP1Watch();
      stopHP2Watch();
      stopDiceWatch();
      stopOverdriveWatch();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (sceneCtl) {
        sceneCtl.cleanup();
        sceneCtl = null;
      }
    });

    return {
      // refs
      sceneCanvas,
      // i18n
      t, fv2,
      // getters
      fightPhase, liveHP1, liveHP2, roundNum, roundLog,
      opponent, activeAgent, agentName, isOverdrive,
      diceState, playerModifiers, anyModActive,
      eventTitle, eventTitleClass, eventImage, xpEarned,
      // ui state
      showCountdown, countdownValue,
      showFighterPanels, logOpen, lastLog,
      adviceTimer, cameraMode, shakeLeft, shakeRight,
      flashActive, flashStyle,
      resultState, resultTitle,
      // static
      MAX_ROUNDS, CAM_MODES,
      iconDice,
      // handlers
      onRollDice, onCoachChoice, onFightAgain, onExitToPit, onBackClick,
      setCamera,
    };
  },
};
</script>

<style scoped>
.cfv2 {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: var(--hex-bg-deep);
}
@supports (height: 100dvh) { .cfv2 { height: 100dvh; } }

.scene-canvas { position: fixed; inset: 0; width: 100%; height: 100%; }

/* Screen-wide flash overlay */
.cfv2-flash::after {
  content: '';
  position: absolute; inset: 0;
  background: var(--cfv2-flash-color, transparent);
  pointer-events: none;
  z-index: 200;
  animation: cfv2-flash-fade 0.25s ease-out forwards;
}
@keyframes cfv2-flash-fade {
  0%   { opacity: 1; }
  100% { opacity: 0; }
}

/* ── TOP BAR ────────────────────────────────────────────────────── */
.cfv2-top {
  position: absolute; top: 0; left: 0; right: 0;
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px;
  z-index: 12;
}
.cfv2-back {
  background: var(--hex-bg-card);
  border: 1px solid var(--hex-border-default);
  color: var(--hex-text-primary);
  border-radius: var(--hex-radius-md);
  font-size: 18px;
  cursor: pointer;
  min-width: 44px; min-height: 44px;
  padding: 8px 14px;
}
.cfv2-back:hover { border-color: var(--hex-border-active); }

.cfv2-cam {
  display: flex; gap: 4px;
  background: var(--hex-bg-card);
  border: 1px solid var(--hex-border-default);
  border-radius: var(--hex-radius-md);
  padding: 2px;
}
.cfv2-cam-btn {
  background: transparent;
  border: none;
  color: var(--hex-text-muted);
  font-family: var(--hex-font-mono);
  font-size: 10px;
  letter-spacing: 1px;
  padding: 6px 10px;
  cursor: pointer;
  border-radius: var(--hex-radius-sm);
  min-height: 32px;
  transition: background var(--hex-transition-fast), color var(--hex-transition-fast);
}
.cfv2-cam-btn:hover { color: var(--hex-text-secondary); }
.cfv2-cam-btn--active {
  background: var(--hex-bg-medium);
  color: var(--hex-text-primary);
}

/* ── FIGHTER PANELS ─────────────────────────────────────────────── */
.cfv2-fighters {
  position: absolute;
  top: 68px; left: 0; right: 0;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 8px;
  padding: 0 12px;
  z-index: 10;
  pointer-events: none;
}
.cfv2-fighter {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
  background: var(--hex-bg-card);
  border: 1px solid var(--hex-border-default);
  border-radius: var(--hex-radius-md);
  padding: 8px 10px;
  min-width: 0;
}
.cfv2-fighter--right { align-items: flex-end; }
.cfv2-fname {
  font-family: var(--hex-font-body);
  font-size: 12px;
  color: var(--hex-text-primary);
  letter-spacing: 0.5px;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cfv2-hp { width: 100%; }

.cfv2-shake { animation: cfv2-shake 0.4s linear; }
@keyframes cfv2-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(6px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}

/* CENTER — round indicator */
.cfv2-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  padding: 0 4px;
}
.cfv2-round-dots {
  display: flex; gap: 3px;
  margin-bottom: 4px;
}
.cfv2-round-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--hex-border-default);
  transition: background 0.3s;
}
.cfv2-round-dot--done    { background: var(--hex-text-muted); }
.cfv2-round-dot--current { background: var(--hex-text-primary); transform: scale(1.3); }

.cfv2-round-label {
  font-family: var(--hex-font-mono);
  font-size: 11px;
  color: var(--hex-text-secondary);
  letter-spacing: 1px;
}
.cfv2-overdrive-label {
  font-family: var(--hex-font-display);
  font-size: 14px;
  color: var(--hex-primary);
  letter-spacing: 2px;
  text-shadow: 0 0 12px var(--hex-primary);
  animation: cfv2-pulse 1.5s ease-in-out infinite;
}
@keyframes cfv2-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.65; }
}

/* ── MODIFIERS PILLS ────────────────────────────────────────────── */
.cfv2-mods {
  position: absolute;
  top: 170px;
  left: 0; right: 0;
  display: flex; justify-content: center; gap: 6px;
  z-index: 10;
  pointer-events: none;
  flex-wrap: wrap;
  padding: 0 16px;
}
.cfv2-mod {
  background: var(--hex-bg-card);
  border: 1px solid var(--hex-border-active);
  color: var(--hex-text-primary);
  font-family: var(--hex-font-mono);
  font-size: 10px;
  letter-spacing: 1px;
  padding: 4px 8px;
  border-radius: var(--hex-radius-sm);
}

/* ── EVENT TITLE ────────────────────────────────────────────────── */
.cfv2-event {
  position: absolute;
  top: 38%; left: 50%;
  transform: translate(-50%, -50%);
  display: flex; align-items: center; gap: 10px;
  background: var(--hex-bg-card);
  border: 1px solid var(--hex-border-strong);
  padding: 10px 18px;
  border-radius: var(--hex-radius-md);
  z-index: 40;
  pointer-events: none;
}
.cfv2-event-icon { width: 24px; height: 24px; }
.cfv2-event span {
  font-family: var(--hex-font-body);
  font-size: 13px;
  color: var(--hex-text-primary);
  letter-spacing: 0.5px;
}

/* ── DICE AREA ──────────────────────────────────────────────────── */
.cfv2-dice-area {
  position: absolute;
  bottom: 96px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  display: flex;
  justify-content: center;
  align-items: center;
}
.cfv2-dice-btn {
  width: 72px; height: 72px;
  border-radius: 50%;
  background: var(--hex-bg-card);
  border: 2px solid var(--hex-primary);
  color: var(--hex-primary);
  cursor: pointer;
  box-shadow: 0 0 20px var(--hex-primary-glow, rgba(255, 6, 111, 0.5));
  display: flex; align-items: center; justify-content: center;
  transition: transform var(--hex-transition-fast), box-shadow var(--hex-transition-normal);
  animation: cfv2-dice-pulse 2s ease-in-out infinite;
}
.cfv2-dice-btn:hover { transform: scale(1.05); }
.cfv2-dice-btn:active { transform: scale(0.95); }
.cfv2-dice-icon { width: 40px; height: 40px; }
@keyframes cfv2-dice-pulse {
  0%, 100% { box-shadow: 0 0 14px var(--hex-primary-glow, rgba(255, 6, 111, 0.4)); }
  50%      { box-shadow: 0 0 28px var(--hex-primary); }
}

.cfv2-dice-result {
  display: flex; align-items: center; gap: 12px;
  background: var(--hex-bg-card);
  border: 1px solid var(--hex-border-strong);
  padding: 10px 16px;
  border-radius: var(--hex-radius-md);
}
.cfv2-dice-result-icon { width: 32px; height: 32px; }
.cfv2-dice-info { display: flex; flex-direction: column; gap: 2px; }
.cfv2-dice-name {
  font-family: var(--hex-font-body);
  font-size: 13px;
  color: var(--hex-text-primary);
  font-weight: 600;
}
.cfv2-dice-desc {
  font-family: var(--hex-font-body);
  font-size: 11px;
  color: var(--hex-text-secondary);
}

/* ── COMBAT LOG ─────────────────────────────────────────────────── */
.cfv2-log {
  position: absolute;
  bottom: 12px; left: 12px; right: 12px;
  z-index: 11;
}
.cfv2-log-toggle {
  background: var(--hex-bg-card);
  border: 1px solid var(--hex-border-default);
  color: var(--hex-text-secondary);
  font-family: var(--hex-font-mono);
  font-size: 10px;
  letter-spacing: 1px;
  padding: 6px 10px;
  cursor: pointer;
  border-radius: var(--hex-radius-sm);
  min-height: 32px;
}
.cfv2-log-toggle:hover { color: var(--hex-text-primary); }

.cfv2-log-list {
  margin-top: 6px;
  background: var(--hex-bg-card);
  border: 1px solid var(--hex-border-default);
  border-radius: var(--hex-radius-sm);
  padding: 6px 10px;
  max-height: 140px;
  overflow-y: auto;
  display: flex; flex-direction: column; gap: 3px;
}
.cfv2-log-row {
  display: flex; justify-content: space-between; gap: 8px;
  font-family: var(--hex-font-mono);
  font-size: 10px;
  color: var(--hex-text-secondary);
}
.cfv2-log-r {
  color: var(--hex-text-muted);
  min-width: 28px;
}
.cfv2-log-r--od { color: var(--hex-text-primary); font-weight: 700; }
.cfv2-log-hp { color: var(--hex-text-primary); }

.cfv2-log-slide-enter-active, .cfv2-log-slide-leave-active {
  transition: max-height 0.25s, opacity 0.2s;
  overflow: hidden;
}
.cfv2-log-slide-enter-from, .cfv2-log-slide-leave-to { max-height: 0; opacity: 0; }
.cfv2-log-slide-enter-to, .cfv2-log-slide-leave-from { max-height: 160px; opacity: 1; }

/* ── COUNTDOWN ──────────────────────────────────────────────────── */
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

/* ── COACH OVERLAY ──────────────────────────────────────────────── */
.cfv2-coach-overlay {
  position: absolute; inset: 0;
  background: rgba(7, 8, 17, 0.88);
  display: flex; align-items: center; justify-content: center;
  z-index: 70;
  padding: 16px;
}
.cfv2-coach-panel {
  background: var(--hex-bg-card);
  border: 1px solid var(--hex-border-active);
  border-radius: var(--hex-radius-lg);
  padding: 24px 20px;
  max-width: 360px;
  width: 100%;
  text-align: center;
  position: relative;
}
.cfv2-coach-timer {
  position: absolute;
  top: -18px; left: 50%;
  transform: translateX(-50%);
  width: 40px; height: 40px;
  border-radius: 50%;
  background: var(--hex-bg-medium);
  border: 1px solid var(--hex-border-active);
  color: var(--hex-text-primary);
  font-family: var(--hex-font-mono);
  font-size: 16px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  transition: border-color var(--hex-transition-fast), color var(--hex-transition-fast);
}
.cfv2-coach-timer--urgent {
  border-color: var(--hex-danger);
  color: var(--hex-danger);
}
.cfv2-coach-title {
  font-family: var(--hex-font-display);
  font-size: 22px;
  letter-spacing: 3px;
  color: var(--hex-text-primary);
  margin-top: 8px;
  margin-bottom: 4px;
}
.cfv2-coach-subtitle {
  font-family: var(--hex-font-body);
  font-size: 13px;
  color: var(--hex-text-secondary);
  margin-bottom: 18px;
}
.cfv2-coach-buttons {
  display: flex; flex-direction: column; gap: 8px;
}
.cfv2-coach-btn {
  background: var(--hex-bg-medium);
  border: 1px solid var(--hex-border-default);
  color: var(--hex-text-primary);
  font-family: var(--hex-font-body);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 1.5px;
  padding: 12px 16px;
  border-radius: var(--hex-radius-md);
  cursor: pointer;
  min-height: 44px;
  transition: background var(--hex-transition-fast), border-color var(--hex-transition-fast);
}
.cfv2-coach-btn--attack { border-left: 3px solid var(--hex-action-attack); }
.cfv2-coach-btn--defense { border-left: 3px solid var(--hex-action-defense); }
.cfv2-coach-btn--position { border-left: 3px solid var(--hex-action-position); }
.cfv2-coach-btn:hover { background: var(--hex-bg-light); border-color: var(--hex-border-active); }

/* ── EVENT & DICE POP TRANSITIONS ───────────────────────────────── */
.cfv2-pop-enter-active {
  transition: opacity 0.25s, transform 0.25s;
}
.cfv2-pop-leave-active {
  transition: opacity 0.2s;
}
.cfv2-pop-enter-from { opacity: 0; transform: translateY(10px) scale(0.9); }
.cfv2-pop-leave-to   { opacity: 0; }

/* ── RESULT STUB ────────────────────────────────────────────────── */
.cfv2-result-stub {
  position: absolute; inset: 0;
  background: rgba(7, 8, 17, 0.9);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  z-index: 60;
  padding: 20px;
}
.cfv2-result-title {
  font-family: var(--hex-font-display);
  font-size: 56px;
  letter-spacing: 6px;
  margin-bottom: 16px;
}
.cfv2-result-title--win  { color: var(--hex-victory); text-shadow: 0 0 24px var(--hex-victory); }
.cfv2-result-title--lose { color: var(--hex-defeat);  text-shadow: 0 0 24px var(--hex-defeat); }
.cfv2-result-title--draw { color: var(--hex-draw);    text-shadow: 0 0 16px var(--hex-draw); }

.cfv2-result-xp {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  margin-bottom: 24px;
}
.cfv2-result-xp-label {
  font-family: var(--hex-font-body);
  font-size: 11px;
  color: var(--hex-text-muted);
  letter-spacing: 1.5px;
}
.cfv2-result-xp-value {
  font-family: var(--hex-font-mono);
  font-size: 24px;
  color: var(--hex-text-primary);
  font-weight: 700;
}

.cfv2-result-actions {
  display: flex; flex-direction: column; gap: 10px;
  width: 100%; max-width: 320px;
}
.cfv2-result-btn {
  background: var(--hex-bg-card);
  border: 1px solid var(--hex-border-default);
  color: var(--hex-text-primary);
  font-family: var(--hex-font-body);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 2px;
  padding: 14px 20px;
  border-radius: var(--hex-radius-md);
  cursor: pointer;
  min-height: 48px;
}
.cfv2-result-btn:hover { border-color: var(--hex-border-active); }
.cfv2-result-btn--primary {
  background: var(--hex-primary);
  border-color: var(--hex-primary);
  color: #fff;
  box-shadow: 0 0 14px var(--hex-primary-glow, rgba(255, 6, 111, 0.4));
}
.cfv2-result-btn--primary:hover {
  background: var(--hex-primary-light, var(--hex-primary));
  border-color: var(--hex-primary-light, var(--hex-primary));
}
</style>
