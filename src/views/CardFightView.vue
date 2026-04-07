<template>
  <div class="background background-fight" :class="{ 'screen-flash': flashActive, 'overdrive-active': isOverdrive, 'pvp-mode': isPvP }" :style="flashStyle">

    <!-- Loading overlay: "Never give up" -->
    <Transition name="loading-fade">
      <div v-if="showLoadingOverlay" class="loading-overlay">
        <div class="loading-hexlash">HEXLASH</div>
        <div class="loading-never-give-up">{{ t.fight.lblNeverGiveUp }}</div>
      </div>
    </Transition>

    <div class="fight-container" @scroll="handleScroll">
      <div class="fight-content-wrapper">

        <!-- Countdown overlay -->
        <transition-group name="fade-scale" tag="div" class="countdown" v-if="showCountdown">
          <div v-if="countdownValue !== 0" :key="countdownValue" class="countdown-item">
            <p>{{ countdownValue }}</p>
          </div>
        </transition-group>

        <!-- Fighters with HP bars -->
        <div class="fighters-section">
          <div class="fighter-side" :class="{ 'fighter-shake': shakeLeft }">
            <div class="fighter-info">
              <UserAvatar :avatarUrl="master?.userData?.avatarUrl" width="40px" height="40px"/>
              <UserName :userName="master?.userData?.name || 'You'" style="width: auto !important;"/>
            </div>
            <v-img :src="`/images/skins/${master?.userData?.skin || 'skin_m_1.png'}`" class="fighter-skin" aspect-ratio="1"/>
            <HPBar :currentHP="liveHP1" :name="t.fight.lblHP"/>
            <div v-if="statusLeft" class="status-fighter">{{ statusLeft }}</div>
          </div>

          <div class="vs-center">
            <span>{{ t.fight.lblVS }}</span>
            <div class="round-dots" v-if="fightPhase === 'fighting'">
              <span
                v-for="n in TOTAL_ROUNDS"
                :key="n"
                class="round-dot"
                :class="{
                  'round-dot-done':      n < roundNum,
                  'round-dot-current':   n === roundNum,
                  'round-dot-overdrive': n > MAX_ROUNDS,
                }"
              ></span>
            </div>
            <span v-if="isOverdrive && fightPhase === 'fighting'" class="overdrive-label">{{ t.fight.overdrive }}</span>
          </div>

          <div class="fighter-side fighter-right" :class="{ 'fighter-shake': shakeRight }">
            <div class="fighter-info">
              <UserAvatar :avatarUrl="opponent?.avatarUrl || ''" width="40px" height="40px"/>
              <UserName :userName="opponent?.name || 'Opponent'" style="width: auto !important;"/>
            </div>
            <v-img :src="`/images/skins/${opponent?.skin || 'skin_m_1.png'}`" class="fighter-skin flipped" aspect-ratio="1"/>
            <HPBar :currentHP="liveHP2" :name="t.fight.lblHP"/>
            <div v-if="statusRight" class="status-fighter">{{ statusRight }}</div>
          </div>
        </div>

        <!-- Current round display (action-based) -->
        <RoundDisplay v-if="currentRound && fightPhase === 'fighting'" :round="currentRound"/>

        <!-- Event title (dice pickup, emergency protocol, crits) -->
        <transition name="title-pop">
          <div v-if="eventTitle" class="event-title" :class="eventTitleClass">
            <img v-if="eventImage" :src="eventImage" class="event-title-icon" alt=""/>
            {{ eventTitle }}
          </div>
        </transition>

        <!-- Dice of Fate (manual, with cooldown) -->
        <div class="dice-area" v-if="fightPhase === 'fighting' && roundNum > 0 && !isOverdrive && (diceState.ready || diceState.activeItem)">
          <button
            v-if="diceState.ready && !diceState.activeItem"
            class="dice-button dice-ready"
            @click="rollDice"
          >
            <img :src="iconDice" class="dice-icon-img" alt=""/>
          </button>
          <transition name="title-pop">
            <div v-if="diceState.activeItem" class="dice-item-result">
              <img :src="diceState.activeItem.image" class="dice-result-icon" alt=""/>
              <div class="dice-info">
                <span class="dice-name">{{ t.fight.diceName[diceState.activeItem.id] }}</span>
                <span class="dice-desc">{{ t.fight.diceDesc[diceState.activeItem.id] }}</span>
              </div>
            </div>
          </transition>
        </div>

        <!-- Active modifiers display (hidden while dice result is showing) -->
        <div class="modifiers-bar" v-if="fightPhase === 'fighting' && anyModActive && !diceState.activeItem">
          <span v-if="playerModifiers.attackMultiplier > 1" class="mod-badge mod-double"><img :src="iconAdrenaline" class="mod-icon" alt=""/> 2x ATK</span>
          <span v-if="playerModifiers.shieldActive"         class="mod-badge mod-shield"><img :src="iconShield" class="mod-icon" alt=""/> {{ t.fight.lblModShield }}</span>
          <span v-if="playerModifiers.blindActive"          class="mod-badge mod-blind"><img :src="iconBlind" class="mod-icon" alt=""/> {{ t.fight.lblModBlind }}</span>
        </div>

        <!-- Coach boost active indicator -->
        <div class="coach-active-bar" v-if="fightPhase === 'fighting' && coachAdvice.active">
          <img :src="iconTrainer" class="coach-active-icon" alt=""/>
          <span class="coach-active-label">{{ coachActionLabel(coachAdvice.action) }}</span>
          <span class="coach-active-rounds">{{ coachAdvice.roundsLeft }}R</span>
        </div>

      </div><!-- /fight-content-wrapper -->

      <!-- Coach advice overlay -->
      <div v-if="fightPhase === 'coach'" class="coach-overlay">
        <div class="coach-panel">
          <!-- Countdown timer -->
          <div class="advice-timer" :class="{ 'advice-timer--urgent': adviceTimer <= 3 }">
            <span class="advice-timer__number" :key="adviceTimer">{{ adviceTimer }}</span>
          </div>

          <div class="coach-header">
            <img :src="iconTrainer" class="coach-avatar" alt=""/>
            <span class="coach-title">{{ t.fight.lblCoachTitle }}</span>
          </div>
          <p class="coach-subtitle">{{ t.fight.lblCoachSubtitle }}</p>

          <div class="coach-options">
            <button class="coach-btn coach-btn-attack" @click="giveCoachAdvice('attack')">
              <img :src="iconAttack" class="coach-btn-icon" alt=""/>
              <span class="coach-btn-text">{{ t.fight.lblCoachAttack }}</span>
              <span class="coach-btn-desc">{{ t.fight.lblCoachAttackDesc }}</span>
            </button>
            <button class="coach-btn coach-btn-defense" @click="giveCoachAdvice('defense')">
              <img :src="iconDefense" class="coach-btn-icon" alt=""/>
              <span class="coach-btn-text">{{ t.fight.lblCoachDefense }}</span>
              <span class="coach-btn-desc">{{ t.fight.lblCoachDefenseDesc }}</span>
            </button>
            <button class="coach-btn coach-btn-position" @click="giveCoachAdvice('position')">
              <img :src="iconPosition" class="coach-btn-icon" alt=""/>
              <span class="coach-btn-text">{{ t.fight.lblCoachPosition }}</span>
              <span class="coach-btn-desc">{{ t.fight.lblCoachPositionDesc }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- PvP: Coach advice overlay (same 3 options as PvE, 10s timer) -->
      <div v-if="isPvP && showCoachChoice" class="coach-overlay">
        <div class="coach-panel">
          <div class="advice-timer" :class="{ 'advice-timer--urgent': coachTimerPvP <= 3 }">
            <span class="advice-timer__number" :key="coachTimerPvP">{{ coachTimerPvP }}</span>
          </div>

          <div class="coach-header">
            <img :src="iconTrainer" class="coach-avatar" alt=""/>
            <span class="coach-title">{{ t.fight.lblCoachTitle }}</span>
          </div>
          <p class="coach-subtitle">{{ t.fight.lblCoachSubtitle }}</p>

          <div class="coach-options">
            <button class="coach-btn coach-btn-attack" @click="onPvPCoachChoice('attack')">
              <img :src="iconAttack" class="coach-btn-icon" alt=""/>
              <span class="coach-btn-text">{{ t.fight.lblCoachAttack }}</span>
              <span class="coach-btn-desc">{{ t.fight.lblCoachAttackDesc }}</span>
            </button>
            <button class="coach-btn coach-btn-defense" @click="onPvPCoachChoice('defense')">
              <img :src="iconDefense" class="coach-btn-icon" alt=""/>
              <span class="coach-btn-text">{{ t.fight.lblCoachDefense }}</span>
              <span class="coach-btn-desc">{{ t.fight.lblCoachDefenseDesc }}</span>
            </button>
            <button class="coach-btn coach-btn-position" @click="onPvPCoachChoice('position')">
              <img :src="iconPosition" class="coach-btn-icon" alt=""/>
              <span class="coach-btn-text">{{ t.fight.lblCoachPosition }}</span>
              <span class="coach-btn-desc">{{ t.fight.lblCoachPositionDesc }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- PvP: Waiting overlay (coach: waiting for opponent) -->
      <div v-if="isPvP && showWaiting" class="pvp-waiting-overlay">
        <div class="pvp-waiting-spinner"></div>
        <div class="pvp-waiting-text">{{ waitingText }}</div>
      </div>

      <!-- Results overlay (full-screen centered, same for PvE and PvP) -->
      <div v-if="fightPhase === 'results'" class="results-overlay" @scroll="handleScroll">
          <div class="result-label" :class="resultClass">{{ resultText }}</div>

          <!-- XP за бой -->
          <div v-if="xpEarned" class="xp-earned-block">
            <div class="xp-earned-title">{{ t.fight.lblXpEarned }}</div>
            <div class="xp-earned-total">+{{ xpEarned }} XP</div>
          </div>

          <!-- AI Trainer (Claude API) -->
          <AiTrainerAnalysis
            v-if="showAiTrainer"
            :fight-data="aiTrainerFightData"
            :locale="getLanguage()"
          />

          <!-- Expandable detailed log -->
          <div class="log-section">
            <button class="log-toggle" @click="showDetailedLog = !showDetailedLog">
              {{ showDetailedLog ? t.fight.lblHideDetails + ' ▲' : t.fight.lblShowDetails + ' ▼' }}
            </button>
            <div v-if="showDetailedLog" class="detailed-log">
              <div v-for="r in roundLog" :key="r.roundNum" class="log-entry">
                <span class="log-round" :class="{ 'log-round-overdrive': r.roundNum > MAX_ROUNDS }">{{ r.roundNum > MAX_ROUNDS ? `E${r.roundNum - MAX_ROUNDS}` : `R${r.roundNum}` }}</span>
                <span class="log-action left" :class="'log-' + r.action1">
                  <img :src="logActionImage(r.action1)" class="log-action-icon" alt=""/> {{ logActionName(r.action1) }}
                </span>
                <span class="log-vs">vs</span>
                <span class="log-action right" :class="'log-' + r.action2">
                  <img :src="logActionImage(r.action2)" class="log-action-icon" alt=""/> {{ logActionName(r.action2) }}
                </span>
                <span class="log-hp">{{ r.hp1After }} / {{ r.hp2After }}</span>
              </div>
            </div>
          </div>

          <div v-if="pvpDisconnect" class="pvp-disconnect-note">
            {{ t.pvp.opponentDisconnected }}
          </div>

          <div v-if="!isPvP" class="result-buttons">
              <HexButton variant="primary" size="lg" block @click="fightAgain">{{ t.fight.lblFightAgain }}</HexButton>
              <HexButton variant="secondary" size="md" block @click="changeBuild">{{ t.fight.lblChangeDeck }}</HexButton>
          </div>
          <div v-if="isPvP" class="result-buttons">
              <HexButton variant="primary" size="lg" block @click="pvpFightAgain">{{ t.fight.lblFightAgain }}</HexButton>
              <HexButton variant="secondary" size="md" block @click="changeBuild">{{ t.fight.lblChangeDeck }}</HexButton>
          </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import store from '@/core/state/store.js';
import router from '@/router/index.js';
import { t, interpolate } from '@/locales/index.js';
import apiClient from '@/core/api/apiClient.js';
import { COUNTDOWN, ROUND_ANIMATION_MS, MAX_HP, MAX_ROUNDS, TOTAL_ROUNDS } from '@/core/constants.js';
import { ARCHETYPES } from '@/core/data/archetypes.js';
import { allMoves as movesData } from '@/data/moves.js';
import HPBar        from '@/components/fragments/fight/HPBar.vue';
import RoundDisplay from '@/components/fragments/fight/RoundDisplay.vue';
import UserAvatar   from '@/components/fragments/profile/UserAvatar.vue';
import UserName     from '@/components/fragments/profile/UserName.vue';
import iconDice     from '@/assets/images/icons/dice.svg';
import iconTrainer  from '@/assets/images/icons/trainer.svg';
import iconAdrenaline from '@/assets/images/icons/adrenaline.svg';
import iconShield   from '@/assets/images/icons/shield.svg';
import iconBlind    from '@/assets/images/icons/blind.svg';
import iconAttack   from '@/assets/images/icons/attack.svg';
import iconDefense  from '@/assets/images/icons/defense.svg';
import iconPosition from '@/assets/images/icons/position.svg';
import AiTrainerAnalysis from '@/components/AiTrainerAnalysis.vue';
import HexButton from '@/components/ui/HexButton.vue';

import { getLanguage } from '@/locales/index.js';

// ── PvP mode detection ─────────────────────────────────────────────────────
const fightRoute = useRoute();
const isPvP = computed(() => fightRoute.query.mode === 'pvp');
const pvpMatchId = computed(() => fightRoute.query.matchId);
const pvpFight = computed(() => store.getters['pvp/getCurrentPvPFight']);

// ── PvP state ──────────────────────────────────────────────────────────────
const pvpStatus = ref('waiting');        // waiting, countdown, fighting, paused_coach, finished
const showCoachChoice = ref(false);
const coachTimerPvP = ref(10);
const showWaiting = ref(false);
const waitingText = ref('');
const showPvPResult = ref(false);
const pvpResultType = ref('');           // win, lose, draw
const pvpResultReason = ref('');         // disconnect, normal
let pvpTimerInterval = null;
let fightStartTimeout = null;

// ── Countdown ──────────────────────────────────────────────────────────────
const showCountdown  = ref(true);
const countdownValue = ref(COUNTDOWN);
let countdownTimer   = null;

// ── Fight timer ────────────────────────────────────────────────────────────
let roundTimer = null;

// ── Animations ─────────────────────────────────────────────────────────────
const shakeLeft  = ref(false);
const shakeRight = ref(false);
const flashActive = ref(false);
const flashColor  = ref('transparent');

// ── Results state ──────────────────────────────────────────────────────────
const showDetailedLog = ref(false);

// ── Loading overlay ────────────────────────────────────────────────────────
const showLoadingOverlay = ref(false);
const triggerLoadingOverlay = () => {
  showLoadingOverlay.value = true;
  setTimeout(() => { showLoadingOverlay.value = false; }, 1200);
};

// ── Prev HP for shake detection ────────────────────────────────────────────
let prevHP1 = MAX_HP;
let prevHP2 = MAX_HP;

// ── Event title timer ──────────────────────────────────────────────────────
let eventTitleTimer = null;

// ─── Store getters ──────────────────────────────────────────────────────────
const fightPhase       = computed(() => store.getters['fight/getFightPhase']);
const liveHP1          = computed(() => store.getters['fight/getLiveHP1']);
const liveHP2          = computed(() => store.getters['fight/getLiveHP2']);
const roundNum         = computed(() => store.getters['fight/getRoundNum']);
const roundLog         = computed(() => store.getters['fight/getRoundLog']);
const currentRound     = computed(() => store.getters['fight/getCurrentRound']);
const opponent         = computed(() => store.getters['fight/getOpponent']);
const master           = computed(() => store.getters['master/getMaster']);
const diceState        = computed(() => store.getters['fight/getDiceState']);
const playerModifiers  = computed(() => store.getters['fight/getPlayerModifiers']);
const fightStats       = computed(() => store.getters['fight/getFightStats']);
const eventTitle       = computed(() => store.getters['fight/getEventTitle']);
const eventTitleClass  = computed(() => store.getters['fight/getEventTitleClass']);
const eventImage       = computed(() => store.getters['fight/getEventImage']);
const playerModules    = computed(() => store.getters['fight/getPlayerModules']);
const coachAdvice      = computed(() => store.getters['fight/getCoachAdvice']);

const anyModActive = computed(() =>
    playerModifiers.value.attackMultiplier > 1 ||
    playerModifiers.value.shieldActive ||
    playerModifiers.value.blindActive
);

// ── Overdrive ──────────────────────────────────────────────────────────────
const isOverdrive = computed(() => store.getters['fight/isOverdrive']);


// ── Action labels (for log) ───────────────────────────────────────────────
const LOG_ACTIONS = {
  attack:   { image: iconAttack,   key: 'fight.lblActionAttack' },
  defense:  { image: iconDefense,  key: 'fight.lblActionDefense' },
  position: { image: iconPosition, key: 'fight.lblActionPosition' },
};

const logActionImage = (action) => LOG_ACTIONS[action]?.image || '';
const logActionName  = (action) => {
  if (!LOG_ACTIONS[action]?.key) return action;
  const [ns, key] = LOG_ACTIONS[action].key.split('.');
  return t.value[ns]?.[key] || action;
};

// ── Result UI ──────────────────────────────────────────────────────────────
// Compute the raw result state (locale-independent) so comparisons
// never depend on translated strings matching each other.
const resultState = computed(() => {
  if (fightPhase.value !== 'results') return '';
  const p1win = (liveHP1.value > liveHP2.value && liveHP2.value <= 0) || (liveHP1.value > 0 && liveHP2.value <= 0);
  const draw  = liveHP1.value <= 0 && liveHP2.value <= 0;
  if (draw)  return 'draw';
  if (p1win) return 'win';
  if (liveHP1.value <= 0) return 'lose';
  if (liveHP1.value > liveHP2.value) return 'win';
  if (liveHP1.value < liveHP2.value) return 'lose';
  return 'draw';
});

const pvpDisconnect = computed(() => pvpResultReason.value === 'disconnect');

const statusLeft = computed(() => {
  if (!resultState.value) return '';
  if (resultState.value === 'win')  return t.value.fight.lblVictory;
  if (resultState.value === 'lose') return t.value.fight.lblDefeat;
  return t.value.fight.lblDraw;
});

const statusRight = computed(() => {
  if (!resultState.value) return '';
  if (resultState.value === 'win')  return t.value.fight.lblDefeat;
  if (resultState.value === 'lose') return t.value.fight.lblVictory;
  return t.value.fight.lblDraw;
});

const resultText  = computed(() => {
  if (fightPhase.value !== 'results') return '';
  // For PvP, prefer server-determined result
  if (isPvP.value && pvpResultType.value) {
    if (pvpResultType.value === 'win')  return t.value.fight.lblVictory;
    if (pvpResultType.value === 'lose') return t.value.fight.lblDefeat;
    return t.value.fight.lblDraw;
  }
  // For PvE, use HP-based result
  if (resultState.value === 'win')  return t.value.fight.lblVictory;
  if (resultState.value === 'lose') return t.value.fight.lblDefeat;
  return t.value.fight.lblDraw;
});
const resultClass = computed(() => {
  const state = (isPvP.value && pvpResultType.value) ? pvpResultType.value : resultState.value;
  if (state === 'win')  return 'result-win';
  if (state === 'lose') return 'result-lose';
  return 'result-draw';
});

// ── AI Trainer (Claude API) ─────────────────────────────────────────────
const aiTrainerFightData = computed(() => {
  const state = store.state.fight;

  let result = 'draw';
  if (state.liveHP1 > state.liveHP2) result = 'win';
  else if (state.liveHP1 < state.liveHP2) result = 'loss';

  return {
    rounds: state.roundLog || [],
    playerDeck: state.playerDeck || [],
    playerModules: store.getters['fight/getPlayerModules'] || [],
    opponentDeck: state.opponentDeck || [],
    result,
    playerHP: state.liveHP1,
    opponentHP: state.liveHP2,
    totalRounds: state.roundNum || 0,
    diceUsed: state.fightStats?.dicePickedUp > 0,
    diceEffect: state.diceState?.activeItem?.effect || null,
    coachUsed: state.coachAdvice?.used || false,
    coachChoice: state.coachAdvice?.action || null,
    emergencyUsed: state.emergencyProtocol?.used || false,
    emergencyType: state.emergencyProtocol?.type || null,
  };
});

const showAiTrainer = computed(() => {
  return store.state.fight.fightPhase === 'results';
});

// ── Auto-clear event title ──────────────────────────────────────────────
watch(eventTitle, (val) => {
  if (val) {
    clearTimeout(eventTitleTimer);
    eventTitleTimer = setTimeout(() => {
      store.commit('fight/clearEventTitle');
    }, 2000);
  }
});

// ── Watch for Overdrive start ──────────────────────────────────────────
watch(roundNum, (newVal, oldVal) => {
  if (newVal === MAX_ROUNDS + 1 && oldVal <= MAX_ROUNDS) {
    triggerFlash('overdrive');
  }
});

// ── Shake on HP change ──────────────────────────────────────────────────
watch(liveHP1, (newVal) => {
  if (newVal < prevHP1) {
    shakeLeft.value = true;
    setTimeout(() => { shakeLeft.value = false; }, 400);
    triggerFlash('damage');
  }
  prevHP1 = newVal;
});

watch(liveHP2, (newVal) => {
  if (newVal < prevHP2) {
    shakeRight.value = true;
    setTimeout(() => { shakeRight.value = false; }, 400);
  }
  prevHP2 = newVal;
});

// ── Flash ───────────────────────────────────────────────────────────────
const triggerFlash = (effect) => {
  const colors = {
    heal:       'color-mix(in srgb, var(--hex-dice-heal) 25%, transparent)',
    adrenaline: 'color-mix(in srgb, var(--hex-dice-adrenaline) 25%, transparent)',
    shield:     'color-mix(in srgb, var(--hex-dice-shield) 25%, transparent)',
    blind:      'color-mix(in srgb, var(--hex-dice-blind) 25%, transparent)',
    rage:       'color-mix(in srgb, var(--hex-dice-rage) 25%, transparent)',
    crit:       'color-mix(in srgb, var(--hex-dice-crit) 25%, transparent)',
    damage:     'color-mix(in srgb, var(--hex-dice-rage) 15%, transparent)',
    overdrive:  'color-mix(in srgb, var(--hex-warning) 30%, transparent)',
  };
  flashColor.value  = colors[effect] || 'color-mix(in srgb, var(--hex-text-primary) 15%, transparent)';
  flashActive.value = true;
  setTimeout(() => { flashActive.value = false; }, 350);
};

// ── Fight flow (fully automatic) ────────────────────────────────────────
const startCountdown = () => {
  clearInterval(countdownTimer);  // prevent double-countdown if called twice
  showCountdown.value  = true;
  countdownValue.value = COUNTDOWN;

  countdownTimer = setInterval(() => {
    if (countdownValue.value > 1) {
      countdownValue.value -= 1;
    } else {
      countdownValue.value = t.value.fight.lblFight;
      clearInterval(countdownTimer);
      setTimeout(() => {
        countdownValue.value = 0;
        showCountdown.value  = false;
        startFightTimer();
      }, 600);
    }
  }, 800);
};

const startFightTimer = () => {
  stopFightTimer();

  roundTimer = setInterval(() => {
    if (fightPhase.value === 'fighting') {
      store.dispatch('fight/computeNextRound');
    } else {
      stopFightTimer();
    }
  }, ROUND_ANIMATION_MS);
};

const stopFightTimer = () => {
  clearInterval(roundTimer);
  clearTimeout(eventTitleTimer);
};

// ── Lifecycle ─────────────────────────────────────────────────────────────
onMounted(async () => {
  triggerLoadingOverlay();

  if (isPvP.value && pvpMatchId.value) {
    // PvP mode — server-driven fight
    // If store has no opponent info (page was refreshed), the match is lost
    const hasMatchContext = store.getters['pvp/getOpponentInfo'] || store.getters['pvp/getCurrentMatchId'];
    if (!hasMatchContext) {
      store.commit('pvp/RESET_PVP_FIGHT');
      store.commit('master/setInfoMessage', { text: t.value.pvp.fightLostOnRefresh || 'Fight lost due to page reload', timeout: 3000 });
      await router.push('/arena');
      return;
    }
    initPvPFight();
  } else if (isPvP.value && pvpFight.value) {
    // Legacy PvP path
    await store.dispatch('fight/initFromStorage', { pvpOpponent: pvpFight.value.opponent.fighter });
    if (fightPhase.value === 'fighting') {
      if (roundNum.value === 0) startCountdown();
      else { showCountdown.value = false; startFightTimer(); }
    } else if (fightPhase.value === 'results') {
      showCountdown.value = false;
    } else {
      await router.push('/arena');
    }
  } else {
    // PvE mode — existing logic untouched
    await store.dispatch('fight/initFromStorage');

    if (fightPhase.value === 'fighting') {
      if (roundNum.value === 0) {
        startCountdown();
      } else {
        showCountdown.value = false;
        startFightTimer();
      }
    } else if (fightPhase.value === 'coach') {
      showCountdown.value = false;
    } else if (fightPhase.value === 'results') {
      showCountdown.value = false;
    } else {
      await router.push('/arena');
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('beforeunload', handleBeforeUnload);
});

onUnmounted(() => {
  stopFightTimer();
  stopCoachTimer();
  clearInterval(countdownTimer);
  if (isPvP.value) cleanupPvP();
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  window.removeEventListener('beforeunload', handleBeforeUnload);
});

// ── Tab visibility: dosimulate missed rounds when returning ───────────────
const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible' && fightPhase.value === 'fighting') {
    store.dispatch('fight/resumeMissedRounds');
  }
};

// ── Warn before leaving during a fight ───────────────────────────────────
const handleBeforeUnload = (e) => {
  if (fightPhase.value === 'fighting' || fightPhase.value === 'coach') {
    e.preventDefault();
    e.returnValue = '';
  }
};

const xpEarned = computed(() => store.getters['fight/getXpEarned']);

watch(fightPhase, (val, oldVal) => {
  // In PvP mode, server drives the fight — don't start local fight timer
  if (isPvP.value && pvpMatchId.value) return;

  // Resume timer after coach advice
  if (val === 'fighting' && oldVal === 'coach') {
    startFightTimer();
  }
  if (val === 'coach') {
    stopFightTimer();
    startCoachTimer();
  }
  if (oldVal === 'coach' && val !== 'coach') {
    stopCoachTimer();
  }
  if (val === 'results') {
    stopFightTimer();
    // Finish PvP fight if applicable (legacy PvP path only)
    if (isPvP.value && pvpFight.value && !pvpMatchId.value) {
      store.dispatch('pvp/finishPvPFight', resultState.value);
    }
    // Only award XP once (guard against double-award on restore)
    // Skip for server-driven PvP — XP is awarded in onPvPFightEnd
    if (!store.getters['fight/getXpAwarded'] && !(isPvP.value && pvpMatchId.value)) {
      const result = resultState.value === 'win' ? 'win' : 'lose';
      const expGain = result === 'win' ? 10 : 5;
      store.commit('fight/setXpEarned', expGain);
      store.commit('fight/setXpAwarded', true);
      store.dispatch('progression/onFightEnd', { result });

      const isWin  = resultState.value === 'win';
      const isDraw = resultState.value === 'draw';
      apiClient.post('/fight/save', {
        isWin,
        isDraw,
        roundsPlayed: roundNum.value,
        totalDamageDealt: fightStats.value.totalDamageDealt,
      }, { authRequired: true }).catch(() => {});

    }
  }
});

// ── Dice click ───────────────────────────────────────────────────────────
const rollDice = () => {
  if (isPvP.value && pvpMatchId.value) {
    // PvP: send dice_roll to server (instant, no pause)
    store.dispatch('webSocket/sendMessage', { type: 'dice_roll' });
    store.commit('fight/setDiceState', { activeItem: null, cooldownLeft: 0, ready: false });
  } else {
    store.dispatch('fight/rollDiceManual');
  }
};

// ── Coach advice timer ────────────────────────────────────────────────────
const adviceTimer = ref(15);
let coachTimerInterval = null;

const startCoachTimer = () => {
  adviceTimer.value = 15;
  coachTimerInterval = setInterval(() => {
    adviceTimer.value -= 1;
    if (adviceTimer.value <= 0) {
      clearInterval(coachTimerInterval);
      coachTimerInterval = null;
      store.dispatch('fight/skipCoachAdvice');
    }
  }, 1000);
};

const stopCoachTimer = () => {
  if (coachTimerInterval) {
    clearInterval(coachTimerInterval);
    coachTimerInterval = null;
  }
};

// ── Coach advice ─────────────────────────────────────────────────────────
const giveCoachAdvice = (action) => {
  stopCoachTimer();
  store.dispatch('fight/applyCoachAdvice', action);
};

const COACH_LABELS = {
  attack:   'ATK +',
  defense:  'DEF +',
  position: 'POS +',
};
const coachActionLabel = (action) => COACH_LABELS[action] || '';

// ── Navigation ────────────────────────────────────────────────────────────
const fightAgain = async () => {
  stopFightTimer();
  clearInterval(countdownTimer);
  showDetailedLog.value = false;
  prevHP1 = MAX_HP;
  prevHP2 = MAX_HP;
  triggerLoadingOverlay();
  await store.dispatch('fight/fightAgain');
  startCountdown();
};

const pvpFightAgain = () => {
  cleanupPvP();
  router.push('/matchmaking');
};

const changeBuild = async () => {
  await store.dispatch('fight/resetToPreparation');
};

// ── Scroll ────────────────────────────────────────────────────────────────
const emit = defineEmits(['scroll']);
const handleScroll = (event) => {
  emit('scroll', event.target.scrollTop);
};

// ── PvP functions ────────────────────────────────────────────────────────
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

  // Send ready + deck to server
  const deck = store.getters['progression/getDeck'] || [];
  const playerModules = store.state.fight.playerModules || [];
  store.dispatch('webSocket/sendMessage', {
    type: 'pvp_ready',
    matchId: pvpMatchId.value,
    deck: deck.map(id => ({ id, level: store.state.progression.moves[id]?.level || 1 })),
    modules: playerModules,
  });

  // Listen for PvP events
  window.addEventListener('pvp-fight_start', onPvPFightStart);
  window.addEventListener('pvp-round_result', onPvPRoundResult);
  window.addEventListener('pvp-dice_available', onPvPDiceAvailable);
  window.addEventListener('pvp-dice_rolled', onPvPDiceRolled);
  window.addEventListener('pvp-dice_error', onPvPDiceError);
  window.addEventListener('pvp-coach_pause', onPvPCoachPause);
  window.addEventListener('pvp-coach_result', onPvPCoachResult);
  window.addEventListener('pvp-coach_opponent_ready', onPvPCoachOpponentReady);
  window.addEventListener('pvp-fight_end', onPvPFightEnd);
  window.addEventListener('pvp-overdrive_start', onPvPOverdriveStart);
  window.addEventListener('match-cancelled', onMatchCancelled);

  // Timeout: if fight_start doesn't arrive within 30s, abort
  fightStartTimeout = setTimeout(() => {
    if (pvpStatus.value === 'waiting') {
      cleanupPvP();
      store.commit('master/setInfoMessage', { text: t.value.pvp.fightStartFailed || 'Failed to start fight', timeout: 3000 });
      router.push('/arena');
    }
  }, 30000);
}

function cleanupPvP() {
  clearPvPTimer();
  if (fightStartTimeout) {
    clearTimeout(fightStartTimeout);
    fightStartTimeout = null;
  }
  window.removeEventListener('pvp-fight_start', onPvPFightStart);
  window.removeEventListener('pvp-round_result', onPvPRoundResult);
  window.removeEventListener('pvp-dice_available', onPvPDiceAvailable);
  window.removeEventListener('pvp-dice_rolled', onPvPDiceRolled);
  window.removeEventListener('pvp-dice_error', onPvPDiceError);
  window.removeEventListener('pvp-coach_pause', onPvPCoachPause);
  window.removeEventListener('pvp-coach_result', onPvPCoachResult);
  window.removeEventListener('pvp-coach_opponent_ready', onPvPCoachOpponentReady);
  window.removeEventListener('pvp-fight_end', onPvPFightEnd);
  window.removeEventListener('pvp-overdrive_start', onPvPOverdriveStart);
  window.removeEventListener('match-cancelled', onMatchCancelled);
}

function getMyOdId() {
  return store.getters['master/getMaster']?.userData?.id;
}

function onPvPFightStart(e) {
  const data = e.detail;
  // Clear fight_start timeout — we got the event
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

  // Set opponent in fight store for display
  // Use skin from fight_start data (now included), fall back to existing store data
  const existingOpponent = store.state.fight?.opponent;
  store.commit('fight/setOpponent', {
    name: oppData?.username || 'Opponent',
    skin: oppData?.skin || existingOpponent?.skin || null,
    avatarUrl: oppData?.avatarUrl || existingOpponent?.avatarUrl || null,
    modules: [],
  });

  // Set fight phase to fighting (needed for UI: round dots, dice, modifiers etc.)
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

  // Map server data to my perspective
  const myData = isP1 ? data.player1 : data.player2;
  const oppData = isP1 ? data.player2 : data.player1;
  const myHp = myData.hp;
  const oppHp = oppData.hp;
  const myDmg = myData.damage;
  const oppDmg = oppData.damage;

  store.commit('fight/setLiveHP1', myHp);
  store.commit('fight/setLiveHP2', oppHp);
  store.commit('fight/setRoundNum', data.round);

  // Map branch to action type for RoundDisplay card styling
  const branchToAction = (branch) => {
    if (branch === 'speed') return 'attack';
    if (branch === 'power') return 'attack';
    if (branch === 'technique') return 'defense';
    return 'attack';
  };

  const myAction = branchToAction(myData.module?.branch);
  const oppAction = branchToAction(oppData.module?.branch);

  // Build events array for RoundDisplay
  const events = [];
  // Build effects from active effects
  for (const eff of (myData.effects || [])) {
    events.push({ fighter: 1, type: eff.type, value: 0 });
  }
  for (const eff of (oppData.effects || [])) {
    events.push({ fighter: 2, type: eff.type, value: 0 });
  }

  // Add to round log — matches PvE RoundResult format for RoundDisplay
  store.commit('fight/addRoundToLog', {
    roundNum: data.round,
    action1: myAction,
    action2: oppAction,
    damage1: oppDmg,
    damage2: myDmg,
    hp1After: myHp,
    hp2After: oppHp,
    events,
  });
  store.commit('fight/addStats', {
    totalDamageDealt: myDmg,
    totalDamageTaken: oppDmg,
  });

  // Clear dice result display after round, but preserve ready state
  // (dice_available event controls when dice button appears)
  if (diceState.value.activeItem) {
    store.commit('fight/setDiceState', { activeItem: null });
  }

  // Tick coach boost rounds down
  if (coachAdvice.value.active && coachAdvice.value.roundsLeft > 0) {
    const newLeft = coachAdvice.value.roundsLeft - 1;
    if (newLeft <= 0) {
      store.commit('fight/setCoachAdvice', { active: false, roundsLeft: 0, action: null });
    } else {
      store.commit('fight/setCoachAdvice', { roundsLeft: newLeft });
    }
  }

  // Show dodge/crit event titles for PvP archetype mechanics
  const myDodged = myData.dodged;
  const oppDodged = oppData.dodged;
  const myCritted = myData.critted;
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

  // Trigger shake animations
  if (oppDmg > 0) {
    shakeLeft.value = true;
    triggerFlash('damage');
    setTimeout(() => { shakeLeft.value = false; }, 400);
  }
  if (myDmg > 0) {
    shakeRight.value = true;
    setTimeout(() => { shakeRight.value = false; }, 400);
  }
}

function onPvPDiceAvailable(e) {
  // Show dice button — player can click to roll instantly
  store.commit('fight/setDiceState', { activeItem: null, cooldownLeft: 0, ready: true });
}

function onPvPDiceRolled(e) {
  const data = e.detail;
  // Apply dice effect visually
  if (data.effect) {
    triggerFlash(data.effect.type);

    // Map effect to dice item for display
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

    // Update HP for instant effects
    if (data.hp !== undefined) {
      store.commit('fight/setLiveHP1', data.hp);
    }

    // Instant damage effects (rage/crit) — update opponent HP
    if (data.oppHp !== undefined) {
      store.commit('fight/setLiveHP2', data.oppHp);
      store.commit('fight/addStats', {
        totalDamageDealt: data.effect.type === 'rage' ? 20 : 30,
      });

      // Show event title for instant damage
      const label = data.effect.type === 'rage' ? t.value.fight.lblEventRage : t.value.fight.lblEventCritical;
      store.commit('fight/setEventTitle', { title: label, cls: 'event-' + data.effect.type });
      setTimeout(() => store.commit('fight/clearEventTitle'), 1200);

      // Shake opponent
      shakeRight.value = true;
      setTimeout(() => { shakeRight.value = false; }, 400);
    }
  }
}

function onPvPDiceError(e) {
  // Dice on cooldown — show brief info, then re-enable after 2s
  const msg = e.detail?.message || 'dice_on_cooldown';
  store.commit('fight/setEventTitle', { title: t.value.fight.lblDiceUnavailable || 'Dice unavailable', cls: 'event-info' });
  setTimeout(() => store.commit('fight/clearEventTitle'), 1500);
  store.commit('fight/setDiceState', { activeItem: null, cooldownLeft: 0, ready: false });
  // Re-enable dice button after 2s debounce so player can retry
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
  // Opponent has chosen their coach advice — update waiting text
  if (showWaiting.value) {
    waitingText.value = t.value.pvp.opponentReady || t.value.pvp.waitingForOpponent;
  }
}

function onMatchCancelled() {
  // Match was cancelled by server (e.g. ready_timeout) — navigate back to arena
  cleanupPvP();
  store.commit('master/setInfoMessage', { text: t.value.pvp.matchCancelled || 'Match cancelled', timeout: 3000 });
  router.push('/arena');
}

function onPvPCoachResult(e) {
  const data = e.detail;
  pvpStatus.value = 'fighting';
  showWaiting.value = false;
  showCoachChoice.value = false;
  clearPvPTimer();

  // Show coach active bar if player chose an action
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
    showPvPResult.value = true;
    pvpResultType.value = 'win';
    pvpResultReason.value = 'disconnect';
  } else if (data.winner === 'draw') {
    showPvPResult.value = true;
    pvpResultType.value = 'draw';
  } else if (data.winner === myId) {
    showPvPResult.value = true;
    pvpResultType.value = 'win';
  } else {
    showPvPResult.value = true;
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
      const isP1 = store.getters['pvp/getIsPlayer1'];
      expGain = isP1 ? xpFromServer.player1 : xpFromServer.player2;
    } else {
      // Fallback: same as PvE
      expGain = pvpResultType.value === 'win' ? 10 : pvpResultType.value === 'draw' ? 7 : 5;
    }
    store.commit('fight/setXpEarned', expGain);
    store.commit('fight/setXpAwarded', true);
    store.dispatch('progression/onFightEnd', { result: pvpResultType.value === 'win' ? 'win' : 'lose' });
  }

  // Transition fight store to results so the result screen displays
  store.commit('fight/setFightPhase', 'results');

  // Clear saved fight state — PvP fight is over, prevent stale restore on next visit
  store.dispatch('fight/clearSavedFight');

  // Update pvp stats
  store.dispatch('pvp/finishPvPFight', pvpResultType.value);
}

function onPvPOverdriveStart() {
  triggerFlash('overdrive');
  store.commit('fight/setEventTitle', { title: t.value.fight.overdrive || 'OVERDRIVE', cls: 'event-overdrive' });
  setTimeout(() => store.commit('fight/clearEventTitle'), 2000);
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

// ── Flash style ──────────────────────────────────────────────────────────
const flashStyle = computed(() => ({
  '--flash-color': flashColor.value,
}));
</script>

<style scoped>
/* ── Background & layout ─────────────────────────────────────────── */
.background-fight {
  background: url('@/assets/images/background_page.webp') no-repeat center center;
  background-size: cover;
}

.background-fight::before {
  content: "";
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  background: linear-gradient(
    to bottom,
    color-mix(in srgb, var(--hex-bg-dark) 88%, transparent) 0%,
    color-mix(in srgb, var(--hex-bg-dark) 65%, transparent) 40%,
    color-mix(in srgb, var(--hex-bg-dark) 92%, transparent) 100%
  );
  z-index: 1;
}

.background-fight::after {
  content: "";
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  background: var(--hex-bg-dark);
  z-index: 2;
  opacity: 1;
  animation: fadeOut 1s forwards;
}

.screen-flash::before {
  background: var(--flash-color, transparent) !important;
  animation: none !important;
}

@keyframes fadeOut { to { opacity: 0; } }

/* ── Loading overlay ─────────────────────────────────────────────── */
.loading-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  background: var(--hex-bg-dark);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 200;
  pointer-events: none;
}

.loading-hexlash {
  position: absolute;
  top: 22%;
  left: 50%;
  transform: translateX(-50%);
  font-size: 72px;
  font-weight: 900;
  color: color-mix(in srgb, var(--hex-text-secondary) 8%, transparent);
  letter-spacing: 14px;
  text-transform: uppercase;
  user-select: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  white-space: nowrap;
}

.loading-never-give-up {
  font-size: 42px;
  font-weight: 700;
  color: var(--hex-text-primary);
  text-transform: uppercase;
  letter-spacing: 5px;
  text-align: center;
  width: 100%;
  z-index: 1;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.loading-fade-leave-active { transition: opacity 0.4s ease; }
.loading-fade-leave-to     { opacity: 0; }

.fight-container {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--hex-text-primary);
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: auto;
  overscroll-behavior-y: none;
}
@supports (height: 100dvh) { .fight-container { height: 100dvh; } }

.fight-content-wrapper {
  width: 100%;
  padding: 76px 12px 90px;
  box-sizing: border-box;
  max-width: 500px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* ── PvP mode: no BottomMenu, use full height ─────────────────────── */
.pvp-mode .fight-content-wrapper {
  padding-bottom: 20px;
}

/* ── Countdown ───────────────────────────────────────────────────── */
.countdown {
  position: fixed;
  top: 40%; left: 50%;
  transform: translate(-50%, -50%);
  font-size: 4em;
  color: var(--hex-text-primary);
  z-index: 100;
  font-family: 'AnonymousBalance', 'Courier New', Consolas, monospace;
}
.fade-scale-enter-active, .fade-scale-leave-active { transition: opacity 0.5s ease, transform 0.5s ease; }
.fade-scale-leave-to  { opacity: 0; transform: scale(3.5); }
.fade-scale-enter-to  { opacity: 1; transform: scale(1); }
.countdown-item {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  display: flex; justify-content: center; align-items: center;
}

/* ── Fighters ────────────────────────────────────────────────────── */
.fighters-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
  margin-bottom: 12px;
  padding: 12px 8px;
  background: linear-gradient(135deg, var(--hex-bg-dark) 0%, var(--hex-bg-light) 100%);
  border: 1px solid var(--hex-border-default);
  border-radius: var(--hex-radius-lg);
}

.fighter-side {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 150px;
  position: relative;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-6px); }
  40%       { transform: translateX(6px); }
  60%       { transform: translateX(-4px); }
  80%       { transform: translateX(4px); }
}
.fighter-shake { animation: shake 0.35s ease; }

.fighter-info {
  display: flex; flex-direction: column;
  align-items: center; gap: 2px; margin-bottom: 4px;
}
.fighter-info :deep(.user-name) { font-size: 0.5em; }

.fighter-skin {
  width: 100px; height: 170px; padding: 5px;
}
.flipped { transform: scaleX(-1); }

.vs-center {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding-top: 80px;
}
.vs-center > span {
  font-size: 1.6rem;
  font-weight: 900;
  font-family: 'AnonymousBalance', 'Courier New', Consolas, monospace;
  color: var(--hex-text-secondary);
  letter-spacing: 3px;
}

.round-dots {
  display: flex;
  gap: 4px;
  margin-top: 8px;
}

.round-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--hex-border-default);
  border: 1px solid var(--hex-border-active);
  transition: background 0.3s ease, transform 0.3s ease;
}

.round-dot-done {
  background: var(--hex-text-muted);
  border-color: var(--hex-text-muted);
}

.round-dot-current {
  background: var(--hex-text-primary);
  border-color: var(--hex-text-primary);
  transform: scale(1.3);
}

.round-dot-overdrive {
  border-color: color-mix(in srgb, var(--hex-warning) 40%, transparent);
}

.round-dot-overdrive.round-dot-done {
  background: color-mix(in srgb, var(--hex-warning) 50%, transparent);
  border-color: color-mix(in srgb, var(--hex-warning) 60%, transparent);
}

.round-dot-overdrive.round-dot-current {
  background: var(--hex-warning);
  border-color: var(--hex-warning);
  box-shadow: 0 0 8px color-mix(in srgb, var(--hex-warning) 90%, transparent);
}

.status-fighter {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 1.6em;
  background: color-mix(in srgb, var(--hex-bg-dark) 80%, transparent);
  border: 1px solid var(--hex-border-strong);
  padding: 4px 16px; border-radius: 8px;
  animation: statusPopIn 0.5s ease-in-out forwards;
}
@keyframes statusPopIn {
  0%   { opacity: 0; transform: translate(-50%, -50%) scale(3); }
  100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}

/* ── Event title ─────────────────────────────────────────────────── */
.event-title {
  font-size: 1.1rem;
  font-weight: bold;
  padding: 8px 24px;
  border-radius: 8px;
  text-align: center;
  margin: 6px 0;
  border: 1px solid transparent;
  animation: titlePop 0.4s ease-out;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.event-title-icon {
  width: 24px; height: 24px;
  filter: drop-shadow(0 0 4px currentColor);
}

@keyframes titlePop {
  0%   { opacity: 0; transform: scale(0.5); }
  60%  { opacity: 1; transform: scale(1.1); }
  100% { opacity: 1; transform: scale(1); }
}

.title-pop-enter-active { animation: titlePop 0.4s ease-out; }
.title-pop-leave-active { transition: opacity 0.3s ease; }
.title-pop-leave-to     { opacity: 0; }

.event-emergency {
  color: var(--hex-dice-crit);
  background: color-mix(in srgb, var(--hex-dice-crit) 8%, transparent);
  border-color: color-mix(in srgb, var(--hex-dice-crit) 50%, transparent);
  box-shadow: 0 0 16px color-mix(in srgb, var(--hex-dice-crit) 20%, transparent);
}

.event-overdrive {
  color: var(--hex-warning);
  background: color-mix(in srgb, var(--hex-warning) 12%, transparent);
  border-color: color-mix(in srgb, var(--hex-warning) 60%, transparent);
  box-shadow: 0 0 20px color-mix(in srgb, var(--hex-warning) 30%, transparent);
  font-size: 1.3rem;
  letter-spacing: 4px;
  text-transform: uppercase;
  text-shadow: 0 0 12px color-mix(in srgb, var(--hex-warning) 70%, transparent);
}

/* ── Dice (manual, with cooldown) ────────────────────────────────── */
.dice-area {
  width: 100%;
  min-height: 56px;
  margin: 6px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.dice-button {
  position: relative;
  width: 56px; height: 56px;
  border-radius: 50%;
  border: 2px solid var(--hex-primary);
  background: linear-gradient(135deg, var(--hex-bg-dark) 0%, var(--hex-bg-light) 100%);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  flex-shrink: 0;
  box-shadow:
    0 0 14px var(--hex-primary-glow),
    0 0 30px color-mix(in srgb, var(--hex-primary) 20%, transparent);
  animation: dicePulse 1.5s ease-in-out infinite;
}

.dice-button:active {
  transform: scale(0.9);
}

@keyframes dicePulse {
  0%, 100% {
    box-shadow: 0 0 14px var(--hex-primary-glow), 0 0 30px color-mix(in srgb, var(--hex-primary) 20%, transparent);
  }
  50% {
    box-shadow: 0 0 22px color-mix(in srgb, var(--hex-primary) 70%, transparent), 0 0 44px color-mix(in srgb, var(--hex-primary) 30%, transparent);
  }
}

.dice-icon-img {
  width: 28px; height: 28px;
}

.dice-item-result {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: linear-gradient(135deg, var(--hex-bg-dark) 0%, var(--hex-bg-light) 100%);
  border: 1px solid color-mix(in srgb, var(--hex-dice-crit) 40%, transparent);
  border-radius: 10px;
  max-width: 220px;
  box-shadow: 0 0 14px color-mix(in srgb, var(--hex-dice-crit) 12%, transparent);
}

.dice-result-icon {
  width: 32px; height: 32px;
  filter: drop-shadow(0 0 6px color-mix(in srgb, var(--hex-dice-crit) 40%, transparent));
}

.dice-info {
  display: flex; flex-direction: column; flex: 1;
}
.dice-name {
  font-size: 0.75rem; font-weight: bold;
  color: var(--hex-dice-crit); letter-spacing: 0.5px;
}
.dice-desc {
  font-size: 0.6rem; color: var(--hex-text-muted);
}

/* ── Active modifiers ────────────────────────────────────────────── */
.modifiers-bar {
  display: flex; gap: 6px; flex-wrap: wrap;
  justify-content: center; margin: 6px 0;
}
.mod-badge {
  padding: 4px 12px; border-radius: 20px;
  font-size: 0.65rem; font-weight: bold; letter-spacing: 0.5px;
  display: flex; align-items: center; gap: 4px;
}
.mod-icon {
  width: 14px; height: 14px;
}
.mod-double {
  background: color-mix(in srgb, var(--hex-dice-adrenaline) 15%, transparent);
  border: 1px solid color-mix(in srgb, var(--hex-dice-adrenaline) 60%, transparent);
  color: var(--hex-dice-adrenaline);
  box-shadow: 0 0 10px color-mix(in srgb, var(--hex-dice-adrenaline) 20%, transparent);
}
.mod-shield {
  background: color-mix(in srgb, var(--hex-dice-shield) 15%, transparent);
  border: 1px solid color-mix(in srgb, var(--hex-dice-shield) 60%, transparent);
  color: var(--hex-dice-shield);
  box-shadow: 0 0 10px color-mix(in srgb, var(--hex-dice-shield) 20%, transparent);
}
.mod-blind {
  background: color-mix(in srgb, var(--hex-dice-blind) 15%, transparent);
  border: 1px solid color-mix(in srgb, var(--hex-dice-blind) 60%, transparent);
  color: var(--hex-dice-blind);
  box-shadow: 0 0 10px color-mix(in srgb, var(--hex-dice-blind) 20%, transparent);
}

/* ── Results ─────────────────────────────────────────────────────── */
.results-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  display: flex; flex-direction: column;
  align-items: center; justify-content: flex-start;
  z-index: 200;
  background: color-mix(in srgb, var(--hex-bg-dark) 82%, transparent);
  animation: resultsOverlayIn 0.5s ease-out forwards;
  overflow-y: auto;
  padding: 80px 16px 110px;
  box-sizing: border-box;
}
@supports (height: 100dvh) { .results-overlay { height: 100dvh; } }
@keyframes resultsOverlayIn {
  0%   { opacity: 0; }
  100% { opacity: 1; }
}
.result-label {
  font-size: 2.5em; font-family: 'Anonymous', 'Courier New', Consolas, monospace;
  margin-bottom: 16px; letter-spacing: 2px;
  text-align: center;
  animation: resultLabelPop 0.6s ease-out forwards;
}
@keyframes resultLabelPop {
  0%   { opacity: 0; transform: scale(2.5); }
  60%  { opacity: 1; transform: scale(0.95); }
  100% { opacity: 1; transform: scale(1); }
}
.result-win {
  color: var(--hex-victory);
  text-shadow: 0 0 20px color-mix(in srgb, var(--hex-victory) 50%, transparent), 0 0 40px color-mix(in srgb, var(--hex-victory) 20%, transparent);
}
.result-lose {
  color: var(--hex-defeat);
  text-shadow: 0 0 20px color-mix(in srgb, var(--hex-defeat) 50%, transparent), 0 0 40px color-mix(in srgb, var(--hex-defeat) 20%, transparent);
}
.result-draw {
  color: var(--hex-draw);
  text-shadow: 0 0 20px color-mix(in srgb, var(--hex-draw) 50%, transparent), 0 0 40px color-mix(in srgb, var(--hex-draw) 20%, transparent);
}

/* ── Expandable log ──────────────────────────────────────────────── */
.log-section {
  width: 92%; max-width: 400px;
  margin-bottom: 12px;
}

.log-toggle {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, var(--hex-bg-dark) 0%, var(--hex-bg-light) 100%);
  border: 1px solid var(--hex-border-default);
  border-radius: var(--hex-radius-md);
  color: var(--hex-text-secondary);
  font-size: 0.7rem;
  cursor: pointer;
  text-align: center;
  transition: border-color 0.2s ease;
}
.log-toggle:active {
  border-color: var(--hex-border-strong);
}

.detailed-log {
  margin-top: 6px;
  max-height: 200px;
  overflow-y: auto;
}

.log-entry {
  display: flex; align-items: center; gap: 6px;
  padding: 5px 8px;
  background: color-mix(in srgb, var(--hex-bg-dark) 70%, transparent);
  border-left: 2px solid var(--hex-border-default);
  border-radius: 0 4px 4px 0;
  margin-bottom: 2px;
  font-size: 0.6rem;
}
.log-round  { color: var(--hex-text-secondary); min-width: 24px; font-weight: bold; }
.log-action {
  flex: 1; text-align: center;
  display: flex; align-items: center; gap: 3px;
}
.log-action.left  { justify-content: flex-end; }
.log-action.right { justify-content: flex-start; }
.log-action-icon { width: 12px; height: 12px; flex-shrink: 0; }
.log-attack   { color: var(--hex-action-attack); }
.log-defense  { color: var(--hex-action-defense); }
.log-position { color: var(--hex-action-position); }
.log-vs  { color: var(--hex-text-secondary); font-size: 0.55rem; }
.log-hp  { color: var(--hex-text-muted); min-width: 50px; text-align: right; font-size: 0.55rem; }

/* ── Buttons ─────────────────────────────────────────────────────── */
.result-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
  width: 92%;
  max-width: 400px;
}
/* Result buttons use HexButton component — minimal overrides */

/* ── Coach Overlay ──────────────────────────────────────────────── */
.coach-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  background: color-mix(in srgb, var(--hex-bg-dark) 85%, transparent);
  animation: coachFadeIn 0.4s ease-out forwards;
  padding: 20px;
  box-sizing: border-box;
}
@supports (height: 100dvh) { .coach-overlay { height: 100dvh; } }

@keyframes coachFadeIn {
  0%   { opacity: 0; }
  100% { opacity: 1; }
}

/* ── Coach Timer ─────────────────────────────────────────────────── */
.advice-timer {
  text-align: center;
  margin-bottom: 12px;
}

.advice-timer__number {
  display: inline-block;
  font-family: 'AnonymousBalance', 'Courier New', Consolas, monospace;
  font-size: 3rem;
  font-weight: bold;
  color: var(--hex-text-primary);
  text-shadow: 2px 2px 0 var(--hex-bg-dark);
  animation: coachTimerPulse 1s ease-in-out;
}

.advice-timer--urgent .advice-timer__number {
  color: var(--hex-danger);
  text-shadow:
    0 0 15px color-mix(in srgb, var(--hex-danger) 90%, transparent),
    0 0 30px color-mix(in srgb, var(--hex-danger) 60%, transparent),
    2px 2px 0 var(--hex-bg-dark);
  animation: coachTimerPulseUrgent 0.5s ease-in-out;
}

@keyframes coachTimerPulse {
  0%   { transform: scale(1.15); opacity: 0.7; }
  50%  { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes coachTimerPulseUrgent {
  0%   { transform: scale(1.25); opacity: 0.6; }
  50%  { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

.coach-panel {
  width: 92%;
  max-width: 380px;
  background: linear-gradient(135deg, var(--hex-bg-dark) 0%, var(--hex-bg-light) 100%);
  border: 1px solid var(--hex-border-strong);
  border-radius: 14px;
  padding: 24px 20px;
  position: relative;
  overflow: hidden;
  animation: coachPanelPop 0.5s ease-out forwards;
}
.coach-panel::before {
  content: "";
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--hex-border-active), transparent);
}

@keyframes coachPanelPop {
  0%   { opacity: 0; transform: scale(0.85) translateY(20px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

.coach-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.coach-avatar {
  width: 32px; height: 32px;
}

.coach-title {
  font-size: 1rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: var(--hex-text-primary);
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1.5px;
}

.coach-subtitle {
  font-size: 0.7rem;
  color: var(--hex-text-muted);
  margin: 0 0 18px 0;
  line-height: 1.4;
}

.coach-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.coach-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 16px;
  border-radius: 10px;
  border: 1px solid var(--hex-border-default);
  background: linear-gradient(135deg, var(--hex-bg-dark) 0%, var(--hex-bg-light) 100%);
  cursor: pointer;
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;
}
.coach-btn::before {
  content: "";
  position: absolute;
  top: 0; left: 0; bottom: 0;
  width: 3px;
  border-radius: 3px 0 0 3px;
  transition: all 0.25s ease;
}

.coach-btn:active {
  transform: scale(0.97);
}

.coach-btn-icon {
  width: 28px; height: 28px;
  flex-shrink: 0;
  transition: filter 0.25s ease;
}

.coach-btn-text {
  font-size: 0.85rem;
  font-weight: bold;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.coach-btn-desc {
  font-size: 0.6rem;
  color: var(--hex-text-secondary);
  margin-left: auto;
}

/* Attack */
.coach-btn-attack {
  border-color: color-mix(in srgb, var(--hex-action-attack) 20%, transparent);
}
.coach-btn-attack::before { background: var(--hex-action-attack); }
.coach-btn-attack .coach-btn-text { color: var(--hex-action-attack); }
.coach-btn-attack .coach-btn-icon { filter: drop-shadow(0 0 4px color-mix(in srgb, var(--hex-action-attack) 40%, transparent)); }
.coach-btn-attack:active {
  border-color: color-mix(in srgb, var(--hex-action-attack) 50%, transparent);
  box-shadow: 0 0 20px color-mix(in srgb, var(--hex-action-attack) 15%, transparent);
}

/* Defense */
.coach-btn-defense {
  border-color: color-mix(in srgb, var(--hex-action-defense) 20%, transparent);
}
.coach-btn-defense::before { background: var(--hex-action-defense); }
.coach-btn-defense .coach-btn-text { color: var(--hex-action-defense); }
.coach-btn-defense .coach-btn-icon { filter: drop-shadow(0 0 4px color-mix(in srgb, var(--hex-action-defense) 40%, transparent)); }
.coach-btn-defense:active {
  border-color: color-mix(in srgb, var(--hex-action-defense) 50%, transparent);
  box-shadow: 0 0 20px color-mix(in srgb, var(--hex-action-defense) 15%, transparent);
}

/* Position */
.coach-btn-position {
  border-color: color-mix(in srgb, var(--hex-action-position) 20%, transparent);
}
.coach-btn-position::before { background: var(--hex-action-position); }
.coach-btn-position .coach-btn-text { color: var(--hex-action-position); }
.coach-btn-position .coach-btn-icon { filter: drop-shadow(0 0 4px color-mix(in srgb, var(--hex-action-position) 40%, transparent)); }
.coach-btn-position:active {
  border-color: color-mix(in srgb, var(--hex-action-position) 50%, transparent);
  box-shadow: 0 0 20px color-mix(in srgb, var(--hex-action-position) 15%, transparent);
}

/* ── Coach Active Indicator ─────────────────────────────────────── */
.coach-active-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  background: linear-gradient(135deg, var(--hex-bg-dark) 0%, var(--hex-bg-light) 100%);
  border: 1px solid var(--hex-border-default);
  margin: 8px 0;
}

.coach-active-icon {
  width: 16px; height: 16px;
}

.coach-active-label {
  font-size: 0.65rem;
  font-weight: bold;
  color: var(--hex-text-secondary);
  letter-spacing: 0.5px;
}

.coach-active-rounds {
  font-size: 0.55rem;
  color: var(--hex-text-muted);
  margin-left: 2px;
}
/* ── XP Earned block ── */
.xp-earned-block {
  background: var(--hex-bg-card);
  border: 1px solid var(--hex-border-default);
  border-radius: var(--hex-radius-md);
  padding: 12px 16px;
  margin-bottom: 12px;
}

.xp-earned-title {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 0.75rem;
  color: var(--hex-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 8px;
}

.xp-earned-total {
  font-family: 'AnonymousBalance', 'Courier New', Consolas, monospace;
  font-size: 1.4rem;
  color: var(--hex-success);
  font-weight: bold;
  text-align: center;
}

/* ── PvP Badge ─────────────────────────────────────────────────── */
.pvp-badge {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 20px;
  background: var(--hex-bg-card);
  border: 1px solid var(--hex-border-default);
  border-radius: 20px;
  color: var(--hex-text-secondary);
  font-weight: 600;
  font-size: 14px;
  z-index: 10;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* ── PvP Modals & Overlays ──────────────────────────────────────── */
.pvp-modal-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  background: color-mix(in srgb, var(--hex-bg-dark) 85%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 150;
}

.pvp-modal {
  background: linear-gradient(135deg, var(--hex-bg-medium) 0%, var(--hex-bg-dark) 100%);
  border: 1px solid var(--hex-border-strong);
  border-radius: 16px;
  padding: 32px 28px;
  text-align: center;
  max-width: 320px;
  width: 90%;
}

.pvp-modal-title {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--hex-text-primary);
  margin: 12px 0 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.pvp-timer {
  font-size: 2rem;
  font-weight: 900;
  color: var(--hex-text-primary);
  font-family: 'AnonymousBalance', 'Courier New', Consolas, monospace;
  margin: 8px 0 16px;
}

.pvp-modal-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn-roll {
  padding: 10px 24px;
  background: linear-gradient(135deg, var(--hex-primary) 0%, var(--hex-primary-dark) 100%);
  border: none;
  border-radius: var(--hex-radius-md);
  color: var(--hex-text-primary);
  font-weight: bold;
  font-size: 0.9rem;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: box-shadow 0.2s;
}

.btn-roll:hover {
  box-shadow: 0 0 20px var(--hex-primary-glow);
}

.btn-skip {
  padding: 10px 24px;
  background: transparent;
  border: 1px solid var(--hex-border-strong);
  border-radius: var(--hex-radius-md);
  color: var(--hex-text-secondary);
  font-weight: bold;
  font-size: 0.9rem;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: border-color 0.2s;
}

.btn-skip:hover {
  border-color: var(--hex-text-secondary);
}

.pvp-coach-text {
  color: var(--hex-text-secondary);
  font-size: 0.85rem;
  margin: 4px 0 8px;
  line-height: 1.4;
}

.pvp-waiting-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  background: color-mix(in srgb, var(--hex-bg-dark) 70%, transparent);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 140;
  gap: 16px;
}

.pvp-waiting-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--hex-text-muted);
  border-top-color: var(--hex-text-secondary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.pvp-waiting-text {
  color: var(--hex-text-secondary);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.pvp-result-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  background: color-mix(in srgb, var(--hex-bg-dark) 90%, transparent);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 160;
  gap: 16px;
}

.pvp-result-text {
  font-size: 3rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 4px;
  font-family: 'Anonymous', 'Courier New', Consolas, monospace;
}

.pvp-result-text.result-win {
  color: var(--hex-victory);
  text-shadow: 0 0 30px color-mix(in srgb, var(--hex-victory) 50%, transparent);
}

.pvp-result-text.result-lose {
  color: var(--hex-defeat);
  text-shadow: 0 0 30px color-mix(in srgb, var(--hex-defeat) 50%, transparent);
}

.pvp-result-text.result-draw {
  color: var(--hex-draw);
  text-shadow: 0 0 30px color-mix(in srgb, var(--hex-draw) 50%, transparent);
}

.pvp-disconnect-note {
  color: var(--hex-text-secondary);
  font-size: 0.85rem;
}

/* btn-back and btn-roll use HexButton primary style */
.btn-back {
  margin-top: 16px;
  padding: 12px 32px;
  background: var(--hex-primary);
  border: none;
  border-radius: var(--hex-radius-md);
  color: var(--hex-text-primary);
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: box-shadow 0.2s;
}

.btn-back:hover {
  box-shadow: 0 0 20px var(--hex-primary-glow);
}

/* ── Overdrive ──────────────────────────────────────────────────── */
.overdrive-active .fighters-section {
  border-color: color-mix(in srgb, var(--hex-warning) 40%, transparent);
  animation: overdrivePulse 1.5s ease-in-out infinite;
}

@keyframes overdrivePulse {
  0%, 100% {
    border-color: color-mix(in srgb, var(--hex-warning) 30%, transparent);
    box-shadow: 0 0 10px color-mix(in srgb, var(--hex-warning) 10%, transparent);
  }
  50% {
    border-color: color-mix(in srgb, var(--hex-warning) 70%, transparent);
    box-shadow: 0 0 25px color-mix(in srgb, var(--hex-warning) 30%, transparent), inset 0 0 15px color-mix(in srgb, var(--hex-warning) 5%, transparent);
  }
}

.overdrive-label {
  display: inline-block;
  margin-top: 6px;
  font-size: 0.65rem;
  font-weight: 900;
  font-family: 'Anonymous', 'Courier New', Consolas, monospace;
  color: var(--hex-warning);
  text-transform: uppercase;
  letter-spacing: 2px;
  text-shadow:
    0 0 8px color-mix(in srgb, var(--hex-warning) 70%, transparent),
    0 0 16px color-mix(in srgb, var(--hex-warning) 30%, transparent);
  animation: overdriveLabelPulse 1.5s ease-in-out infinite;
}

@keyframes overdriveLabelPulse {
  0%, 100% { opacity: 0.8; }
  50%      { opacity: 1; text-shadow: 0 0 12px color-mix(in srgb, var(--hex-warning) 90%, transparent), 0 0 24px color-mix(in srgb, var(--hex-warning) 50%, transparent); }
}

.log-round-overdrive {
  color: var(--hex-warning) !important;
}

/* ── Responsive: small screens ──────────────────────────────────── */
@media (max-width: 360px) {
  .fight-content-wrapper {
    padding: 12px 8px 90px;
  }
  .fighter-side {
    width: 120px;
  }
  .fighter-skin {
    width: 80px;
    height: 136px;
  }
  .fighters-section {
    padding: 8px 4px;
  }
}
</style>
