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
      <div v-if="!isPvP && fightPhase === 'coach'" class="cfv2-coach-overlay">
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

      <!-- ── PvP COACH OVERLAY (10s timer, server-synced) ──────────────── -->
      <div v-if="isPvP && showCoachChoice" class="cfv2-coach-overlay">
        <div class="cfv2-coach-panel">
          <div class="cfv2-coach-timer" :class="{ 'cfv2-coach-timer--urgent': coachTimerPvP <= 3 }">
            <span :key="coachTimerPvP">{{ coachTimerPvP }}</span>
          </div>
          <div class="cfv2-coach-title">{{ fv2.lblCoachTitle || 'COACH' }}</div>
          <div class="cfv2-coach-subtitle">{{ fv2.lblCoachSubtitle || 'Choose your next move' }}</div>
          <div class="cfv2-coach-buttons">
            <button class="cfv2-coach-btn cfv2-coach-btn--attack" @click="onPvPCoachChoice('attack')">
              {{ fv2.lblCoachAttack || 'ATTACK' }}
            </button>
            <button class="cfv2-coach-btn cfv2-coach-btn--defense" @click="onPvPCoachChoice('defense')">
              {{ fv2.lblCoachDefense || 'DEFENSE' }}
            </button>
            <button class="cfv2-coach-btn cfv2-coach-btn--position" @click="onPvPCoachChoice('position')">
              {{ fv2.lblCoachPosition || 'POSITION' }}
            </button>
          </div>
        </div>
      </div>

      <!-- ── PvP WAITING-FOR-OPPONENT OVERLAY ─────────────────────────── -->
      <div v-if="isPvP && showWaiting" class="cfv2-pvp-waiting">
        <div class="cfv2-pvp-waiting-spinner" aria-hidden="true"></div>
        <div class="cfv2-pvp-waiting-text">{{ waitingText }}</div>
      </div>

      <!-- ── RESULT OVERLAY (3.10.4: full splash + AI Trainer + log) ──── -->
      <div v-if="fightPhase === 'results'" class="cfv2-result-stub">
        <div class="cfv2-result-inner">
          <div class="cfv2-result-title" :class="'cfv2-result-title--' + resultState">{{ resultTitle }}</div>

          <div class="cfv2-result-xp" v-if="xpEarned">
            <div class="cfv2-result-xp-label">{{ fv2.lblXpEarned || 'XP EARNED' }}</div>
            <div class="cfv2-result-xp-value">+{{ xpEarned }} XP</div>
          </div>

          <!-- AI Trainer (Claude API) — self-manages loading/error -->
          <div class="cfv2-ai-trainer-wrap">
            <AiTrainerAnalysis
              :fight-data="aiTrainerFightData"
              :locale="locale"
            />
          </div>

          <!-- Detailed log toggle -->
          <button class="cfv2-result-log-toggle" @click="showDetailedLog = !showDetailedLog">
            {{ showDetailedLog ? (fv2.lblHideDetails || 'HIDE DETAILS') : (fv2.lblShowDetails || 'SHOW DETAILS') }}
            {{ showDetailedLog ? '▲' : '▼' }}
          </button>
          <div v-if="showDetailedLog" class="cfv2-result-log">
            <div v-for="r in roundLog" :key="r.roundNum" class="cfv2-result-log-row">
              <span class="cfv2-result-log-r" :class="{ 'cfv2-result-log-r--od': r.roundNum > MAX_ROUNDS }">
                {{ r.roundNum > MAX_ROUNDS ? 'E' + (r.roundNum - MAX_ROUNDS) : 'R' + r.roundNum }}
              </span>
              <span class="cfv2-result-log-actions">
                {{ r.action1 }} vs {{ r.action2 }}
              </span>
              <span class="cfv2-result-log-hp">{{ r.hp1After }} / {{ r.hp2After }}</span>
            </div>
          </div>

          <div class="cfv2-result-actions">
            <button class="cfv2-result-btn cfv2-result-btn--primary" @click="onFightAgain">
              {{ fv2.lblFightAgain || 'FIGHT AGAIN' }}
            </button>
            <button class="cfv2-result-btn" @click="changeBuild">
              {{ fv2.lblChangeDeck || 'CHANGE DECK' }}
            </button>
            <button class="cfv2-result-btn" @click="onExitToPit">
              {{ fv2.lblExitToPit || 'EXIT TO PIT' }}
            </button>
          </div>
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
import { t, getLanguage } from '@/locales/index.js';
import { initFightScene } from '@/three/scenes/fightArena.js';
import { COUNTDOWN, ROUND_ANIMATION_MS, MAX_HP, MAX_ROUNDS } from '@/core/constants.js';
import HPBar from '@/components/fragments/fight/HPBar.vue';
import BeltBadge from '@/components/ui/BeltBadge.vue';
import AiTrainerAnalysis from '@/components/AiTrainerAnalysis.vue';
import iconDice from '@/assets/images/icons/dice.svg';
import iconAdrenaline from '@/assets/images/icons/adrenaline.svg';
import iconShield from '@/assets/images/icons/shield.svg';
import iconBlind from '@/assets/images/icons/blind.svg';

const CAM_MODES = [
  { id: 'pit',    labelKey: 'lblCamPit',    fallback: 'PIT' },
  { id: 'side',   labelKey: 'lblCamSide',   fallback: 'SIDE' },
  { id: 'cinema', labelKey: 'lblCamCinema', fallback: 'CINEMA' },
];

export default {
  name: 'FightV2',
  components: { HPBar, BeltBadge, AiTrainerAnalysis },
  setup() {
    const route = useRoute();
    const router = useRouter();

    // ── Refs ──
    const sceneCanvas = ref(null);
    let sceneCtl = null;

    // ── PvP mode detection ──
    const isPvP       = computed(() => route.query.mode === 'pvp');
    const pvpMatchId  = computed(() => route.query.matchId);
    const pvpFight    = computed(() => store.getters['pvp/getCurrentPvPFight']);

    // ── PvP state (server-driven fight) ──
    const pvpStatus        = ref('waiting');   // waiting | countdown | fighting | paused_coach | finished
    const showCoachChoice  = ref(false);
    const coachTimerPvP    = ref(10);
    const showWaiting      = ref(false);
    const waitingText      = ref('');
    const pvpResultType    = ref('');          // win | lose | draw
    const pvpResultReason  = ref('');          // disconnect | normal
    let   pvpTimerInterval = null;
    let   fightStartTimeout = null;

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

    // ── Result overlay state (3.10.4) ──
    const showDetailedLog = ref(false);
    const locale = computed(() => getLanguage());

    // ── AI Trainer payload (copied AS-IS from legacy CardFightView:409-432) ──
    // KNOWN LIMITATION (D9): diceEffect ≈ null at results phase because
    // rollDiceManual clears activeItem after 1.5s. Not fixed in this scope —
    // legacy behavior, backend accepts null.
    const aiTrainerFightData = computed(() => {
      const s = store.state.fight;
      let result = 'draw';
      // PvP: prefer server-driven result (handles opponent_disconnected)
      if (isPvP.value && pvpResultType.value) {
        if (pvpResultType.value === 'win')       result = 'win';
        else if (pvpResultType.value === 'lose') result = 'loss';
        else                                     result = 'draw';
      } else {
        if (s.liveHP1 > s.liveHP2) result = 'win';
        else if (s.liveHP1 < s.liveHP2) result = 'loss';
      }
      return {
        rounds: s.roundLog || [],
        playerDeck: s.playerDeck || [],
        playerModules: store.getters['fight/getPlayerModules'] || [],
        opponentDeck: s.opponentDeck || [],
        result,
        playerHP: s.liveHP1,
        opponentHP: s.liveHP2,
        totalRounds: s.roundNum || 0,
        diceUsed: s.fightStats?.dicePickedUp > 0,
        diceEffect: s.diceState?.activeItem?.effect || null,
        coachUsed: s.coachAdvice?.used || false,
        coachChoice: s.coachAdvice?.action || null,
        emergencyUsed: s.emergencyProtocol?.used || false,
        emergencyType: s.emergencyProtocol?.type || null,
      };
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
      // PvP: server-driven, prefer pvpResultType when set (handles opponent_disconnected case)
      if (isPvP.value && pvpResultType.value) return pvpResultType.value;
      // PvE: HP-derived
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
      // PvP: server drives the fight — skip local round/coach timers (handled by PvP handlers)
      const isServerPvP = isPvP.value && pvpMatchId.value;
      if (isServerPvP) {
        if (val === 'results') stopRoundTimer();
        return;
      }
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
 claude/setup-project-initialization-buyXe
            stake: store.getters['fight/getStakeLevel'],  // Phase 4.3 — null = no payout
          }, { authRequired: true })
            .then((res) => {
              if (res?.data?.newBalance !== undefined) {
                store.commit('master/setBalance', res.data.newBalance);
              }
              return store.dispatch('agent/fetchAgents');

            // Stake payout (Phase 4.3) — backend credits payout based on stake level + result
            stake: store.getters['fight/getStakeLevel'] || null,
          }, { authRequired: true })
            .then((res) => {
              if (res?.data?.newBalance !== undefined && res.data.newBalance !== null) {
                store.commit('master/setBalance', res.data.newBalance);
              }
              store.dispatch('agent/fetchAgents');
 main
            })
            .catch(() => { /* graceful */ });
        }
      }
    });

    // ── Actions ──
    function onRollDice() {
      if (isPvP.value && pvpMatchId.value) {
        // PvP: send dice_roll to server (instant, no pause)
        store.dispatch('webSocket/sendMessage', { type: 'dice_roll' });
        store.commit('fight/setDiceState', { activeItem: null, cooldownLeft: 0, ready: false });
      } else {
        store.dispatch('fight/rollDiceManual');
      }
    }

    function onCoachChoice(action) {
      stopCoachTimer();
      store.dispatch('fight/applyCoachAdvice', action);
    }

    function onFightAgain() {
      showDetailedLog.value = false;
      stopRoundTimer();
      clearInterval(countdownTimer);
      if (isPvP.value) {
        pvpFightAgain();
      } else {
        store.dispatch('fight/fightAgain', { targetRoute: '/fight-v2' });
      }
    }

    function onExitToPit() {
      store.dispatch('fight/resetToPreparation');
    }

    function changeBuild() {
      stopRoundTimer();
      clearInterval(countdownTimer);
      router.push('/arena/fight-v2');
    }

    function onBackClick() {
      if (fightPhase.value === 'fighting' || fightPhase.value === 'coach') {
        // eslint-disable-next-line no-alert
        if (!confirm(fv2.value.lblConfirmLeave || 'Leave the fight?')) return;
        store.dispatch('fight/clearSavedFight');
      }
      router.push('/arena/pit');
    }

    // ──────────────────────────────────────────────────────────────────────
    //  PvP — server-driven fight (11 WS handlers + lifecycle)
    //  Ported from legacy CardFightView.vue:708-1157 AS-IS per ТЗ.
    //  Router targets adapted: /arena → /arena/pit, /matchmaking → /matchmaking-v2.
    // ──────────────────────────────────────────────────────────────────────

    function getMyOdId() {
      return store.getters['master/getMaster']?.userData?.id;
    }

    function startPvPTimer(type) {
      clearPvPTimer();
      pvpTimerInterval = setInterval(() => {
        if (type === 'coach') {
          coachTimerPvP.value--;
          if (coachTimerPvP.value <= 0) {
            clearPvPTimer();
            if (showCoachChoice.value) onPvPCoachChoice(null);
          }
        }
      }, 1000);
    }

    function clearPvPTimer() {
      if (pvpTimerInterval) {
        clearInterval(pvpTimerInterval);
        pvpTimerInterval = null;
      }
    }

    function pvpFightAgain() {
      cleanupPvP();
      router.push('/matchmaking-v2');
    }

    function initPvPFight() {
      pvpStatus.value = 'waiting';
      showCountdown.value = false;

      // Initialize fight store for PvP display
      store.commit('fight/setLiveHP1', MAX_HP);
      store.commit('fight/setLiveHP2', MAX_HP);
      store.commit('fight/setRoundNum', 0);
      store.commit('fight/clearRoundLog');
      store.commit('fight/resetPlayerModifiers');
      store.commit('fight/clearDice');
      store.commit('fight/clearEventTitle');
      store.commit('fight/resetCoachAdvice');
      store.commit('fight/resetStats');
      store.commit('fight/setXpEarned', null);
      store.commit('fight/setXpAwarded', false);

      // Set opponent from pvpState for display
      const pvpOpp = store.getters['pvp/getOpponentInfo'];
      if (pvpOpp) {
        store.commit('fight/setOpponent', {
          name: pvpOpp.username || 'Opponent',
          skin: pvpOpp.skin || null,
          avatarUrl: pvpOpp.avatarUrl || null,
          modules: [],
        });
      }

      // Send ready + active agent deck/modules to server
      const agent = store.getters['agent/activeAgent'];
      const agentProg = agent?.progression || {};
      const agentDeck = Array.isArray(agentProg.deck) ? agentProg.deck : [];
      const agentMoves = Array.isArray(agentProg.moves) ? agentProg.moves : [];
      const agentModules = [agent?.primaryModule, agent?.secondaryModule, agent?.tertiaryModule].filter(Boolean);
      const moveLevelMap = {};
      for (const m of agentMoves) { if (m.moveId) moveLevelMap[m.moveId] = m.level || 1; }
      store.dispatch('webSocket/sendMessage', {
        type: 'pvp_ready',
        matchId: pvpMatchId.value,
        deck: agentDeck.map(id => ({ id, level: moveLevelMap[id] || 1 })),
        modules: agentModules,
      });

      // Listen for PvP events
      window.addEventListener('pvp-fight_start',          onPvPFightStart);
      window.addEventListener('pvp-round_result',         onPvPRoundResult);
      window.addEventListener('pvp-dice_available',       onPvPDiceAvailable);
      window.addEventListener('pvp-dice_rolled',          onPvPDiceRolled);
      window.addEventListener('pvp-dice_error',           onPvPDiceError);
      window.addEventListener('pvp-coach_pause',          onPvPCoachPause);
      window.addEventListener('pvp-coach_result',         onPvPCoachResult);
      window.addEventListener('pvp-coach_opponent_ready', onPvPCoachOpponentReady);
      window.addEventListener('pvp-fight_end',            onPvPFightEnd);
      window.addEventListener('pvp-overdrive_start',      onPvPOverdriveStart);
      window.addEventListener('match-cancelled',          onMatchCancelled);

      // Timeout: if fight_start doesn't arrive within 30s, abort
      fightStartTimeout = setTimeout(() => {
        if (pvpStatus.value === 'waiting') {
          cleanupPvP();
          store.commit('master/setInfoMessage', {
            text: t.value.pvp.fightStartFailed || 'Failed to start fight',
            timeout: 3000,
          });
          router.push('/arena/pit');
        }
      }, 30000);
    }

    function cleanupPvP() {
      clearPvPTimer();
      if (fightStartTimeout) {
        clearTimeout(fightStartTimeout);
        fightStartTimeout = null;
      }
      window.removeEventListener('pvp-fight_start',          onPvPFightStart);
      window.removeEventListener('pvp-round_result',         onPvPRoundResult);
      window.removeEventListener('pvp-dice_available',       onPvPDiceAvailable);
      window.removeEventListener('pvp-dice_rolled',          onPvPDiceRolled);
      window.removeEventListener('pvp-dice_error',           onPvPDiceError);
      window.removeEventListener('pvp-coach_pause',          onPvPCoachPause);
      window.removeEventListener('pvp-coach_result',         onPvPCoachResult);
      window.removeEventListener('pvp-coach_opponent_ready', onPvPCoachOpponentReady);
      window.removeEventListener('pvp-fight_end',            onPvPFightEnd);
      window.removeEventListener('pvp-overdrive_start',      onPvPOverdriveStart);
      window.removeEventListener('match-cancelled',          onMatchCancelled);
    }

    function onPvPFightStart(e) {
      const data = e.detail;
      if (fightStartTimeout) {
        clearTimeout(fightStartTimeout);
        fightStartTimeout = null;
      }
      pvpStatus.value = 'countdown';

      const myId = getMyOdId();
      const isP1 = data.player1?.odId === myId;
      const oppData = isP1 ? data.player2 : data.player1;

      store.commit('pvp/SET_PVP_MATCH', {
        matchId: data.matchId,
        opponent: oppData,
        isPlayer1: isP1,
      });

      // Set opponent in fight store for display (preserve existing skin as fallback)
      const existingOpponent = store.state.fight?.opponent;
      store.commit('fight/setOpponent', {
        name: oppData?.username || 'Opponent',
        skin: oppData?.skin || existingOpponent?.skin || null,
        avatarUrl: oppData?.avatarUrl || existingOpponent?.avatarUrl || null,
        modules: [],
      });

      store.commit('fight/setFightPhase', 'fighting');

      // Reuse existing countdown animation
      showCountdown.value = true;
      countdownValue.value = 3;
      clearInterval(countdownTimer);
      countdownTimer = setInterval(() => {
        if (countdownValue.value > 1) {
          countdownValue.value -= 1;
        } else {
          countdownValue.value = t.value.fight.lblFight;
          clearInterval(countdownTimer);
          setTimeout(() => {
            countdownValue.value = 0;
            showCountdown.value = false;
            pvpStatus.value = 'fighting';
          }, 600);
        }
      }, 800);
    }

    function onPvPRoundResult(e) {
      const data = e.detail;
      const isP1 = store.getters['pvp/getIsPlayer1'];

      const myData  = isP1 ? data.player1 : data.player2;
      const oppData = isP1 ? data.player2 : data.player1;
      const myHp    = myData.hp;
      const oppHp   = oppData.hp;
      const myDmg   = myData.damage;
      const oppDmg  = oppData.damage;

      store.commit('fight/setLiveHP1', myHp);
      store.commit('fight/setLiveHP2', oppHp);
      store.commit('fight/setRoundNum', data.round);

      // Map branch to action type for card styling
      const branchToAction = (branch) => {
        if (branch === 'speed')     return 'attack';
        if (branch === 'power')     return 'attack';
        if (branch === 'technique') return 'defense';
        return 'attack';
      };

      const myAction  = branchToAction(myData.module?.branch);
      const oppAction = branchToAction(oppData.module?.branch);

      // Build events array
      const events = [];
      for (const eff of (myData.effects  || [])) events.push({ fighter: 1, type: eff.type, value: 0 });
      for (const eff of (oppData.effects || [])) events.push({ fighter: 2, type: eff.type, value: 0 });

      store.commit('fight/addRoundToLog', {
        roundNum: data.round,
        action1:  myAction,
        action2:  oppAction,
        damage1:  oppDmg,
        damage2:  myDmg,
        hp1After: myHp,
        hp2After: oppHp,
        events,
      });
      store.commit('fight/addStats', {
        totalDamageDealt: myDmg,
        totalDamageTaken: oppDmg,
      });

      // Clear dice result display after round (preserve ready state)
      if (diceState.value.activeItem) {
        store.commit('fight/setDiceState', { activeItem: null });
      }

      // Tick coach boost rounds down
      const cv = store.getters['fight/getCoachAdvice'];
      if (cv?.active && cv.roundsLeft > 0) {
        const newLeft = cv.roundsLeft - 1;
        if (newLeft <= 0) {
          store.commit('fight/setCoachAdvice', { active: false, roundsLeft: 0, action: null });
        } else {
          store.commit('fight/setCoachAdvice', { roundsLeft: newLeft });
        }
      }

      // Dodge/crit event titles for PvP archetype mechanics
      const myDodged   = myData.dodged;
      const oppDodged  = oppData.dodged;
      const myCritted  = myData.critted;
      const oppCritted = oppData.critted;

      if (myDodged) {
        store.commit('fight/setEventTitle', { title: t.value.fight.lblDodged, cls: 'event-dodge' });
        setTimeout(() => store.commit('fight/clearEventTitle'), 1200);
      } else if (oppCritted) {
        store.commit('fight/setEventTitle', { title: t.value.fight.lblCrit, cls: 'event-crit' });
        setTimeout(() => store.commit('fight/clearEventTitle'), 1200);
      } else if (oppDodged) {
        store.commit('fight/setEventTitle', { title: t.value.fight.lblDodged, cls: 'event-dodge' });
        setTimeout(() => store.commit('fight/clearEventTitle'), 1200);
      } else if (myCritted) {
        store.commit('fight/setEventTitle', { title: t.value.fight.lblCrit, cls: 'event-crit' });
        setTimeout(() => store.commit('fight/clearEventTitle'), 1200);
      }

      // Shake animations
      if (oppDmg > 0) {
        triggerShake('left');
        triggerFlash('rgba(255, 51, 51, 0.25)');
      }
      if (myDmg > 0) {
        triggerShake('right');
      }
    }

    function onPvPDiceAvailable() {
      store.commit('fight/setDiceState', { activeItem: null, cooldownLeft: 0, ready: true });
    }

    function onPvPDiceRolled(e) {
      const data = e.detail;
      if (!data?.effect) return;
      triggerFlash(
        data.effect.type === 'crit'  ? 'rgba(255, 230, 0, 0.35)' :
        data.effect.type === 'rage'  ? 'rgba(255, 51, 51, 0.35)' :
        data.effect.type === 'heal'  ? 'rgba(0, 255, 136, 0.25)' :
        'rgba(255, 255, 255, 0.2)'
      );

      const DICE_EFFECTS = {
        heal:       { id: 'heal',       image: iconDice },
        adrenaline: { id: 'adrenaline', image: iconAdrenaline },
        shield:     { id: 'shield',     image: iconShield },
        blind:      { id: 'blind',      image: iconBlind },
        rage:       { id: 'rage',       image: iconDice },
        crit:       { id: 'crit',       image: iconDice },
      };
      const diceItem = DICE_EFFECTS[data.effect.type] || { id: data.effect.type, image: iconDice };
      store.commit('fight/setDiceState', { activeItem: diceItem, cooldownLeft: 3, ready: false });

      if (data.hp !== undefined) {
        store.commit('fight/setLiveHP1', data.hp);
      }
      if (data.oppHp !== undefined) {
        store.commit('fight/setLiveHP2', data.oppHp);
        store.commit('fight/addStats', {
          totalDamageDealt: data.effect.type === 'rage' ? 20 : 30,
        });
        const label = data.effect.type === 'rage'
          ? t.value.fight.lblEventRage
          : t.value.fight.lblEventCritical;
        store.commit('fight/setEventTitle', { title: label, cls: 'event-' + data.effect.type });
        setTimeout(() => store.commit('fight/clearEventTitle'), 1200);
        triggerShake('right');
      }
    }

    function onPvPDiceError() {
      store.commit('fight/setEventTitle', {
        title: t.value.fight.lblDiceUnavailable || 'Dice unavailable',
        cls: 'event-info',
      });
      setTimeout(() => store.commit('fight/clearEventTitle'), 1500);
      store.commit('fight/setDiceState', { activeItem: null, cooldownLeft: 0, ready: false });
      // Re-enable after 2s debounce
      setTimeout(() => {
        if (pvpStatus.value === 'fighting') {
          store.commit('fight/setDiceState', { activeItem: null, cooldownLeft: 0, ready: true });
        }
      }, 2000);
    }

    function onPvPCoachPause() {
      pvpStatus.value = 'paused_coach';
      showWaiting.value = false;
      showCoachChoice.value = true;
      coachTimerPvP.value = 10;
      startPvPTimer('coach');
    }

    function onPvPCoachChoice(action) {
      store.dispatch('webSocket/sendMessage', {
        type: 'coach_choice',
        choice: { action },
      });
      showCoachChoice.value = false;
      showWaiting.value = true;
      waitingText.value = t.value.pvp.waitingForOpponent;
    }

    function onPvPCoachOpponentReady() {
      if (showWaiting.value) {
        waitingText.value = t.value.pvp.opponentReady || t.value.pvp.waitingForOpponent;
      }
    }

    function onMatchCancelled() {
      cleanupPvP();
      store.commit('master/setInfoMessage', {
        text: t.value.pvp.matchCancelled || 'Match cancelled',
        timeout: 3000,
      });
      router.push('/arena/pit');
    }

    function onPvPCoachResult(e) {
      const data = e.detail;
      pvpStatus.value = 'fighting';
      showWaiting.value = false;
      showCoachChoice.value = false;
      clearPvPTimer();

      const isP1 = store.getters['pvp/getIsPlayer1'];
      const myResult = isP1 ? data.player1 : data.player2;
      if (myResult?.action) {
        store.commit('fight/setCoachAdvice', {
          used: true, active: true, action: myResult.action, roundsLeft: 4,
        });
      }
    }

    function onPvPFightEnd(e) {
      const data = e.detail;
      pvpStatus.value = 'finished';
      clearPvPTimer();
      showWaiting.value = false;
      showCoachChoice.value = false;

      const myId = getMyOdId();

      if (data.reason === 'opponent_disconnected') {
        pvpResultType.value = 'win';
        pvpResultReason.value = 'disconnect';
      } else if (data.winner === 'draw') {
        pvpResultType.value = 'draw';
      } else if (data.winner === myId) {
        pvpResultType.value = 'win';
      } else {
        pvpResultType.value = 'lose';
      }

      // Set final HPs from server data
      const isP1 = store.getters['pvp/getIsPlayer1'];
      if (data.player1 && data.player2) {
        store.commit('fight/setLiveHP1', isP1 ? data.player1.finalHp : data.player2.finalHp);
        store.commit('fight/setLiveHP2', isP1 ? data.player2.finalHp : data.player1.finalHp);
      }

      // Award XP for PvP fight
      if (!store.getters['fight/getXpAwarded']) {
        const xpFromServer = data.xp;
        let expGain;
        if (xpFromServer) {
          expGain = isP1 ? xpFromServer.player1 : xpFromServer.player2;
        } else {
          expGain = pvpResultType.value === 'win'
            ? 10 : pvpResultType.value === 'draw' ? 7 : 5;
        }
        store.commit('fight/setXpEarned', expGain);
        store.commit('fight/setXpAwarded', true);
      }

      store.commit('fight/setFightPhase', 'results');
      store.dispatch('fight/clearSavedFight');
      store.dispatch('pvp/finishPvPFight', pvpResultType.value);
    }

    function onPvPOverdriveStart() {
      // NOTE (D10): webSocketState does not currently dispatch 'pvp-overdrive_start'.
      // Listener registered per legacy AS-IS for future-proofing.
      triggerFlash('rgba(255, 6, 111, 0.4)');
      store.commit('fight/setEventTitle', {
        title: fv2.value.lblOverdrive || 'OVERDRIVE',
        cls: 'event-overdrive',
      });
      setTimeout(() => store.commit('fight/clearEventTitle'), 2000);
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
      // ── PvP server-driven path ──
      if (isPvP.value && pvpMatchId.value) {
        // Refresh detection: if store has no opponent info, the match is lost
        const hasMatchContext =
          store.getters['pvp/getOpponentInfo'] ||
          store.getters['pvp/getCurrentMatchId'];
        if (!hasMatchContext) {
          store.commit('pvp/RESET_PVP_FIGHT');
          store.commit('master/setInfoMessage', {
            text: t.value.pvp.fightLostOnRefresh || 'Fight lost due to page reload',
            timeout: 3000,
          });
          await router.replace('/arena/pit');
          return;
        }
        prevHP1 = MAX_HP;
        prevHP2 = MAX_HP;
        initPvPFight();
        maybeInitScene();
        window.addEventListener('beforeunload', handleBeforeUnload);
        return;
      }

      // ── Legacy PvP path (pvpFight in store, no matchId in route) ──
      if (isPvP.value && pvpFight.value) {
        await store.dispatch('fight/initFromStorage');
        prevHP1 = liveHP1.value ?? MAX_HP;
        prevHP2 = liveHP2.value ?? MAX_HP;
        maybeInitScene();
        if (fightPhase.value === 'fighting') {
          if (roundNum.value === 0) startCountdown();
          else { showCountdown.value = false; startRoundTimer(); }
        } else if (fightPhase.value === 'results') {
          showCountdown.value = false;
        } else {
          await router.replace('/arena/pit');
          return;
        }
        window.addEventListener('beforeunload', handleBeforeUnload);
        return;
      }

      // ── PvE path (unchanged from 3.10.4) ──
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
      // PvP-specific cleanup: WS listeners + timers
      if (isPvP.value) cleanupPvP();
      if (sceneCtl) {
        sceneCtl.cleanup();
        sceneCtl = null;
      }
    });

    return {
      // refs
      sceneCanvas,
      // i18n
      t, fv2, locale,
      // getters
      fightPhase, liveHP1, liveHP2, roundNum, roundLog,
      opponent, activeAgent, agentName, isOverdrive,
      diceState, playerModifiers, anyModActive,
      eventTitle, eventTitleClass, eventImage, xpEarned,
      // ui state
      showCountdown, countdownValue,
      showFighterPanels, logOpen, lastLog,
      showDetailedLog,
      adviceTimer, cameraMode, shakeLeft, shakeRight,
      flashActive, flashStyle,
      resultState, resultTitle,
      // AI Trainer payload (3.10.4)
      aiTrainerFightData,
      // PvP state (3.10.2b)
      isPvP, pvpMatchId, pvpStatus,
      showCoachChoice, coachTimerPvP,
      showWaiting, waitingText,
      // static
      MAX_ROUNDS, CAM_MODES,
      iconDice,
      // handlers
      onRollDice, onCoachChoice, onFightAgain, onExitToPit, onBackClick,
      setCamera, changeBuild,
      // PvP handlers (3.10.2b)
      onPvPCoachChoice, pvpFightAgain,
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

/* ── RESULT OVERLAY (3.10.4) ─────────────────────────────────────── */
.cfv2-result-stub {
  position: absolute; inset: 0;
  background: rgba(7, 8, 17, 0.92);
  z-index: 60;
  overflow-y: auto;
  overscroll-behavior: contain;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 24px 16px 40px;
}
.cfv2-result-inner {
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.cfv2-result-title {
  font-family: var(--hex-font-display);
  font-size: 56px;
  letter-spacing: 6px;
  margin: 8px 0 4px;
  text-align: center;
}
.cfv2-result-title--win  { color: var(--hex-victory); text-shadow: 0 0 24px var(--hex-victory); }
.cfv2-result-title--lose { color: var(--hex-defeat);  text-shadow: 0 0 24px var(--hex-defeat); }
.cfv2-result-title--draw { color: var(--hex-draw);    text-shadow: 0 0 16px var(--hex-draw); }

.cfv2-result-xp {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
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

/* AI Trainer wrap — constrain to overlay max-width */
.cfv2-ai-trainer-wrap {
  width: 100%;
  max-width: 480px;
}

/* Detailed log toggle */
.cfv2-result-log-toggle {
  background: none;
  border: 1px solid var(--hex-border-default);
  color: var(--hex-text-secondary);
  font-family: var(--hex-font-body);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1.5px;
  padding: 8px 14px;
  border-radius: var(--hex-radius-md);
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s;
}
.cfv2-result-log-toggle:hover {
  color: var(--hex-text-primary);
  border-color: var(--hex-border-active);
}

/* Detailed log list */
.cfv2-result-log {
  width: 100%;
  max-width: 480px;
  max-height: 300px;
  overflow-y: auto;
  background: var(--hex-bg-card);
  border: 1px solid var(--hex-border-default);
  border-radius: var(--hex-radius-md);
  padding: 8px 12px;
}
.cfv2-result-log-row {
  display: grid;
  grid-template-columns: 40px 1fr auto;
  gap: 8px;
  align-items: center;
  font-family: var(--hex-font-mono);
  font-size: 11px;
  padding: 4px 0;
  border-bottom: 1px dashed var(--hex-border-default);
}
.cfv2-result-log-row:last-child { border-bottom: none; }
.cfv2-result-log-r {
  font-family: var(--hex-font-mono);
  font-weight: 600;
  color: var(--hex-text-muted);
}
.cfv2-result-log-r--od {
  color: var(--hex-text-primary);
}
.cfv2-result-log-actions {
  color: var(--hex-text-secondary);
  letter-spacing: 0.5px;
  text-transform: uppercase;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cfv2-result-log-hp {
  color: var(--hex-text-primary);
  font-weight: 700;
}

.cfv2-result-actions {
  display: flex; flex-direction: column; gap: 10px;
  width: 100%; max-width: 320px;
  margin-top: 8px;
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

/* ── PvP WAITING OVERLAY (3.10.2b) ───────────────────────────────── */
.cfv2-pvp-waiting {
  position: absolute; inset: 0;
  background: rgba(7, 8, 17, 0.85);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  z-index: 65;
  pointer-events: auto;
}
.cfv2-pvp-waiting-spinner {
  width: 40px;
  height: 40px;
  border: 2px solid var(--hex-border-default);
  border-top-color: var(--hex-text-primary);
  border-radius: 50%;
  animation: cfv2-pvp-spin 600ms linear infinite;
}
@keyframes cfv2-pvp-spin {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.cfv2-pvp-waiting-text {
  font-family: var(--hex-font-body);
  color: var(--hex-text-secondary);
  font-size: 12px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  text-align: center;
  max-width: 280px;
}
</style>
