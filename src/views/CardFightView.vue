<template>
  <div class="background background-fight" :class="{ 'screen-flash': flashActive, 'overdrive-active': isOverdrive }" :style="flashStyle">

    <!-- Loading overlay: "Never give up" -->
    <Transition name="loading-fade">
      <div v-if="showLoadingOverlay" class="loading-overlay">
        <div class="loading-hexlash">HEXLASH</div>
        <div class="loading-never-give-up">{{ t.fight.lblNeverGiveUp }}</div>
      </div>
    </Transition>

    <div class="fight-container" @scroll="handleScroll">
      <div class="fight-content-wrapper">

        <!-- PvP badge -->
        <div v-if="isPvP && pvpFight" class="pvp-badge">
          PVP: vs {{ pvpFight.opponent.username }}
        </div>

        <!-- Auto fight banner -->
        <div v-if="isAutoFightEnabled && !isPvP" class="autofight-banner">
          <span class="autofight-banner-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF066F" stroke-width="2" stroke-linecap="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10"/><path d="M20.49 15a9 9 0 01-14.85 3.36L1 14"/></svg></span>
          <span class="autofight-banner-text">{{ t.autoFight.lblAutoFightInProgress }}</span>
        </div>

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
            <transition name="title-pop">
              <span v-if="isOverdrive && fightPhase === 'fighting'" class="overdrive-label">{{ t.fight.overdrive }}</span>
            </transition>
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

          <!-- AI Trainer analysis -->
          <div class="ai-trainer">
            <div class="trainer-header">
              <img :src="iconTrainer" class="trainer-avatar-img" alt=""/>
              <span class="trainer-title">{{ t.fight.lblTrainerAnalysis }}</span>
            </div>
            <div class="trainer-analysis">
              <p>{{ trainerAnalysis }}</p>
            </div>
          </div>

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
              <VBtn class="result-btn" @click="fightAgain">{{ t.fight.lblFightAgain }}</VBtn>
              <VBtn class="result-btn result-btn-secondary" @click="changeBuild">{{ t.fight.lblChangeDeck }}</VBtn>
          </div>
          <div v-if="isPvP" class="result-buttons">
              <VBtn class="result-btn" @click="pvpFightAgain">{{ t.fight.lblFightAgain }}</VBtn>
              <VBtn class="result-btn result-btn-secondary" @click="changeBuild">{{ t.fight.lblChangeDeck }}</VBtn>
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

import { getLanguage } from '@/locales/index.js';

// ── PvP mode detection ─────────────────────────────────────────────────────
const fightRoute = useRoute();
const isPvP = computed(() => fightRoute.query.mode === 'pvp');
const pvpMatchId = computed(() => fightRoute.query.matchId);
const pvpFight = computed(() => store.getters['pvp/getCurrentPvPFight']);

// ── PvP state ──────────────────────────────────────────────────────────────
const pvpStatus = ref('waiting');        // waiting, countdown, fighting, paused_coach, finished
const showCoachChoice = ref(false);
const pvpCoachAdvice = ref(null);
const coachTimerPvP = ref(10);
const showWaiting = ref(false);
const waitingText = ref('');
const showPvPResult = ref(false);
const pvpResultType = ref('');           // win, lose, draw
const pvpResultReason = ref('');         // disconnect, normal
let pvpTimerInterval = null;

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

// ── Auto Fight ──────────────────────────────────────────────────────────────
const isAutoFightEnabled = computed(() => store.getters['autoFight/isEnabled']);
let autoFightContinueTimer = null;

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

// ── AI Trainer analysis (based on real fight data) ───────────────────────
const trainerAnalysis = computed(() => {
  const result = resultState.value;
  const stats = fightStats.value;
  const rounds = roundNum.value;
  const modules = playerModules.value;
  const names = modules.filter(id => id).map(id =>
    getLanguage() === 'ru' ? (ARCHETYPES[id]?.nameRu || id) : (ARCHETYPES[id]?.name || id)
  );
  const buildStr = names.join(' + ');
  const f = t.value.fight;

  const parts = [];

  // Result-based opener
  if (result === 'win') {
    const hpLeft = liveHP1.value;
    if (hpLeft > 70) parts.push(f.trainerDominant);
    else if (hpLeft > 30) parts.push(f.trainerCloseWin);
    else parts.push(f.trainerLuckyWin);
  } else if (result === 'lose') {
    const hpOpp = liveHP2.value;
    if (hpOpp > 70) parts.push(f.trainerCrushed);
    else if (hpOpp > 30) parts.push(f.trainerOutplayed);
    else parts.push(f.trainerCloseLose);
  } else {
    parts.push(f.trainerDrawResult);
  }

  // Damage ratio analysis
  const dealt = stats.totalDamageDealt || 0;
  const taken = stats.totalDamageTaken || 0;
  if (taken > 0) {
    const ratio = dealt / taken;
    if (ratio > 1.5) parts.push(f.trainerDamageDominance);
    else if (ratio < 0.7) parts.push(f.trainerDamageDeficit);
  }

  // Round duration analysis
  if (rounds <= 4) parts.push(f.trainerQuickFight);
  else if (rounds >= 9) parts.push(f.trainerLongFight);

  // Critical hits
  if (stats.criticalHits >= 3) parts.push(f.trainerManyCrits);
  else if (stats.criticalHits > 0) parts.push(interpolate(f.trainerCritsLanded, { count: stats.criticalHits }));

  // Build verdict
  if (result === 'win') {
    parts.push(interpolate(f.trainerBuildEffective, { build: buildStr }));
  } else if (result === 'lose') {
    parts.push(interpolate(f.trainerBuildFailed, { build: buildStr }));
  }

  return parts.join(' ');
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
    heal:       'rgba(46, 204, 113, 0.25)',
    adrenaline: 'rgba(255, 145, 0, 0.25)',
    shield:     'rgba(68, 138, 255, 0.25)',
    blind:      'rgba(224, 64, 251, 0.25)',
    rage:       'rgba(255, 23, 68, 0.25)',
    crit:       'rgba(255, 214, 0, 0.25)',
    damage:     'rgba(255, 23, 68, 0.15)',
    overdrive:  'rgba(255, 100, 0, 0.3)',
  };
  flashColor.value  = colors[effect] || 'rgba(255,255,255,0.15)';
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
  clearTimeout(autoFightContinueTimer);
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
    // Auto-handle coach when auto fight is active
    if (isAutoFightEnabled.value) {
      // Auto-select attack if low HP, else attack (aggressive auto strategy)
      const autoAction = liveHP1.value < 50 ? 'defense' : 'attack';
      setTimeout(() => {
        store.dispatch('fight/applyCoachAdvice', autoAction);
      }, 500);
    } else {
      startCoachTimer();
    }
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

      // Log to auto fight if enabled
      if (isAutoFightEnabled.value) {
        store.dispatch('autoFight/onFightEnd', {
          result: resultState.value,
          rounds: roundNum.value,
          hp1: liveHP1.value,
          hp2: liveHP2.value,
        });

        // Return to arena after showing the result — next fight will be scheduled by timer (30-60 min)
        clearTimeout(autoFightContinueTimer);
        autoFightContinueTimer = setTimeout(() => {
          if (isAutoFightEnabled.value) {
            router.push('/arena');
          }
        }, 3000);
      }
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

// ── Auto-dice for auto fights ──────────────────────────────────────────
watch([() => diceState.value.ready, fightPhase], ([ready, phase]) => {
  if (isAutoFightEnabled.value && ready && phase === 'fighting' && roundNum.value > 0) {
    setTimeout(() => {
      if (diceState.value.ready && fightPhase.value === 'fighting') {
        store.dispatch('fight/rollDiceManual');
      }
    }, 800);
  }
});

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
  console.log('[PVP] Sending pvp_ready, matchId:', pvpMatchId.value, 'deck:', deck);
  store.dispatch('webSocket/sendMessage', {
    type: 'pvp_ready',
    matchId: pvpMatchId.value,
    deck: deck.map(id => ({ id, level: store.state.progression.moves[id]?.level || 1 })),
  });

  // Listen for PvP events
  window.addEventListener('pvp-fight_start', onPvPFightStart);
  window.addEventListener('pvp-round_result', onPvPRoundResult);
  window.addEventListener('pvp-dice_available', onPvPDiceAvailable);
  window.addEventListener('pvp-dice_rolled', onPvPDiceRolled);
  window.addEventListener('pvp-dice_error', onPvPDiceError);
  window.addEventListener('pvp-coach_pause', onPvPCoachPause);
  window.addEventListener('pvp-coach_result', onPvPCoachResult);
  window.addEventListener('pvp-fight_end', onPvPFightEnd);
  window.addEventListener('pvp-overdrive_start', onPvPOverdriveStart);
}

function cleanupPvP() {
  clearPvPTimer();
  window.removeEventListener('pvp-fight_start', onPvPFightStart);
  window.removeEventListener('pvp-round_result', onPvPRoundResult);
  window.removeEventListener('pvp-dice_available', onPvPDiceAvailable);
  window.removeEventListener('pvp-dice_rolled', onPvPDiceRolled);
  window.removeEventListener('pvp-dice_error', onPvPDiceError);
  window.removeEventListener('pvp-coach_pause', onPvPCoachPause);
  window.removeEventListener('pvp-coach_result', onPvPCoachResult);
  window.removeEventListener('pvp-fight_end', onPvPFightEnd);
  window.removeEventListener('pvp-overdrive_start', onPvPOverdriveStart);
}

function getMyOdId() {
  return store.getters['master/getMaster']?.userData?.id;
}

function onPvPFightStart(e) {
  const data = e.detail;
  console.log('[PVP] fight_start received:', data);
  pvpStatus.value = 'countdown';

  const myId = getMyOdId();
  console.log('[PVP] myId:', myId, 'p1:', data.player1?.odId, 'p2:', data.player2?.odId);
  const isP1 = data.player1?.odId === myId;
  const oppData = isP1 ? data.player2 : data.player1;

  store.commit('pvp/SET_PVP_MATCH', {
    matchId: data.matchId,
    opponent: oppData,
    isPlayer1: isP1,
  });

  // Set opponent in fight store for display
  store.commit('fight/setOpponent', {
    name: oppData?.username || 'Opponent',
    skin: oppData?.skin || null,
    avatarUrl: oppData?.avatarUrl || null,
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
  console.log('[PVP] round_result:', data.round, data);
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

  // Update dice state — reset ready based on cooldown info from server
  // (dice_available event will set ready=true when available)
  store.commit('fight/setDiceState', { activeItem: null, cooldownLeft: 0, ready: false });

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
  console.log('[PVP] dice_available:', e.detail);
  // Show dice button — player can click to roll instantly
  store.commit('fight/setDiceState', { activeItem: null, cooldownLeft: 0, ready: true });
}

function onPvPDiceRolled(e) {
  const data = e.detail;
  console.log('[PVP] dice_rolled:', data);

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

    // Update HP if heal
    if (data.effect.type === 'heal' && data.hp !== undefined) {
      store.commit('fight/setLiveHP1', data.hp);
    }
  }
}

function onPvPDiceError(e) {
  console.log('[PVP] dice_error:', e.detail);
  // Dice not available — hide button
  store.commit('fight/setDiceState', { activeItem: null, cooldownLeft: 0, ready: false });
}

function onPvPCoachPause(e) {
  const data = e.detail;
  pvpStatus.value = 'paused_coach';
  showWaiting.value = false;
  showCoachChoice.value = true;
  pvpCoachAdvice.value = data.advice;
  coachTimerPvP.value = 10;
  startPvPTimer('coach');
}

function onPlayerCoachChoice(accept) {
  store.dispatch('webSocket/sendMessage', {
    type: 'coach_choice',
    choice: { accept },
  });
  showCoachChoice.value = false;
  showWaiting.value = true;
  waitingText.value = t.value.pvp.waitingForOpponent;
}

function onPvPCoachResult() {
  pvpStatus.value = 'fighting';
  showWaiting.value = false;
  showCoachChoice.value = false;
  clearPvPTimer();
}

function onPvPFightEnd(e) {
  const data = e.detail;
  console.log('[PVP] fight_end:', data);
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

  // Update pvp stats
  store.dispatch('pvp/finishPvPFight', pvpResultType.value);
}

function onPvPOverdriveStart() {
  triggerFlash('overdrive');
}

function startPvPTimer(type) {
  clearPvPTimer();
  pvpTimerInterval = setInterval(() => {
    if (type === 'coach') {
      coachTimerPvP.value--;
      if (coachTimerPvP.value <= 0) {
        clearPvPTimer();
        if (showCoachChoice.value) onPlayerCoachChoice(false);
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
    rgba(0, 0, 0, 0.88) 0%,
    rgba(9, 9, 9, 0.65) 40%,
    rgba(0, 0, 0, 0.92) 100%
  );
  z-index: 1;
}

.background-fight::after {
  content: "";
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  background: black;
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
  background: #000;
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
  color: rgba(255, 6, 111, 0.08);
  letter-spacing: 14px;
  text-transform: uppercase;
  user-select: none;
  font-family: 'Anonymous', 'Courier New', Consolas, monospace;
  white-space: nowrap;
}

.loading-never-give-up {
  font-size: 42px;
  font-weight: 700;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 5px;
  text-align: center;
  width: 100%;
  z-index: 1;
  font-family: 'Anonymous', 'Courier New', Consolas, monospace;
  text-shadow:
    0 0 20px var(--primary-color),
    0 0 40px rgba(255, 6, 111, 0.4);
}

.loading-fade-leave-active { transition: opacity 0.4s ease; }
.loading-fade-leave-to     { opacity: 0; }

.fight-container {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: auto;
  overscroll-behavior-y: none;
}
@supports (height: 100dvh) { .fight-container { height: 100dvh; } }

.fight-content-wrapper {
  width: 100%;
  padding: 16px 12px 90px;
  box-sizing: border-box;
  max-width: 500px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* ── Countdown ───────────────────────────────────────────────────── */
.countdown {
  position: fixed;
  top: 40%; left: 50%;
  transform: translate(-50%, -50%);
  font-size: 4em;
  color: white;
  z-index: 100;
  font-family: 'Anonymous', 'Courier New', Consolas, monospace;
  text-shadow:
    0 0 30px var(--primary-color),
    0 0 60px rgba(255, 6, 111, 0.4);
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
  background: linear-gradient(135deg, rgba(9, 9, 9, 0.85) 0%, rgba(26, 26, 46, 0.5) 100%);
  border: 1px solid rgba(255, 6, 111, 0.15);
  border-radius: 12px;
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
  filter: drop-shadow(0 4px 16px rgba(255, 6, 111, 0.25));
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
  font-family: 'Anonymous', 'Courier New', Consolas, monospace;
  color: var(--primary-color);
  text-shadow:
    0 0 20px rgba(255, 6, 111, 0.6),
    0 0 40px rgba(255, 6, 111, 0.25);
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
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.15);
  transition: background 0.3s ease, transform 0.3s ease;
}

.round-dot-done {
  background: rgba(255, 6, 111, 0.35);
  border-color: rgba(255, 6, 111, 0.4);
}

.round-dot-current {
  background: var(--primary-color);
  border-color: var(--primary-color);
  box-shadow: 0 0 6px rgba(255, 6, 111, 0.8);
  transform: scale(1.3);
}

.round-dot-overdrive {
  border-color: rgba(255, 100, 0, 0.4);
}

.round-dot-overdrive.round-dot-done {
  background: rgba(255, 100, 0, 0.5);
  border-color: rgba(255, 100, 0, 0.6);
}

.round-dot-overdrive.round-dot-current {
  background: #FF6400;
  border-color: #FF6400;
  box-shadow: 0 0 8px rgba(255, 100, 0, 0.9);
}

.status-fighter {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
  font-family: 'Anonymous', 'Courier New', Consolas, monospace;
  font-size: 1.6em;
  background: var(--black-opacity-80);
  border: 1px solid var(--primary-color);
  padding: 4px 16px; border-radius: 6px;
  text-shadow: 0 0 10px rgba(255, 6, 111, 0.5);
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
  color: #FFD600;
  background: rgba(255, 214, 0, 0.08);
  border-color: rgba(255, 214, 0, 0.5);
  box-shadow: 0 0 16px rgba(255, 214, 0, 0.2);
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
  border: 2px solid var(--primary-color);
  background: linear-gradient(135deg, #0d0d1a 0%, #1a1a2e 100%);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  flex-shrink: 0;
  box-shadow:
    0 0 14px rgba(255, 6, 111, 0.5),
    0 0 30px rgba(255, 6, 111, 0.2);
  animation: dicePulse 1.5s ease-in-out infinite;
}

.dice-button:active {
  transform: scale(0.9);
}

@keyframes dicePulse {
  0%, 100% {
    box-shadow: 0 0 14px rgba(255, 6, 111, 0.5), 0 0 30px rgba(255, 6, 111, 0.2);
  }
  50% {
    box-shadow: 0 0 22px rgba(255, 6, 111, 0.7), 0 0 44px rgba(255, 6, 111, 0.3);
  }
}

.dice-icon-img {
  width: 28px; height: 28px;
  filter: drop-shadow(0 0 4px rgba(255, 6, 111, 0.3));
}

.dice-item-result {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #0d0d1a 0%, #1a1a2e 100%);
  border: 1px solid rgba(255, 214, 0, 0.4);
  border-radius: 10px;
  max-width: 220px;
  box-shadow: 0 0 14px rgba(255, 214, 0, 0.12);
}

.dice-result-icon {
  width: 32px; height: 32px;
  filter: drop-shadow(0 0 6px rgba(255, 214, 0, 0.4));
}

.dice-info {
  display: flex; flex-direction: column; flex: 1;
}
.dice-name {
  font-size: 0.75rem; font-weight: bold;
  color: #FFD600; letter-spacing: 0.5px;
}
.dice-desc {
  font-size: 0.6rem; color: var(--gray3);
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
  background: rgba(255, 145, 0, 0.15);
  border: 1px solid rgba(255, 145, 0, 0.6);
  color: #FF9100;
  box-shadow: 0 0 10px rgba(255, 145, 0, 0.2);
}
.mod-shield {
  background: rgba(68, 138, 255, 0.15);
  border: 1px solid rgba(68, 138, 255, 0.6);
  color: #448AFF;
  box-shadow: 0 0 10px rgba(68, 138, 255, 0.2);
}
.mod-blind {
  background: rgba(224, 64, 251, 0.15);
  border: 1px solid rgba(224, 64, 251, 0.6);
  color: #E040FB;
  box-shadow: 0 0 10px rgba(224, 64, 251, 0.2);
}

/* ── Results ─────────────────────────────────────────────────────── */
.results-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  display: flex; flex-direction: column;
  align-items: center; justify-content: flex-start;
  z-index: 200;
  background: rgba(0, 0, 0, 0.82);
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
  color: #2ecc71;
  text-shadow: 0 0 20px rgba(46, 204, 113, 0.5), 0 0 40px rgba(46, 204, 113, 0.2);
}
.result-lose {
  color: #e74c3c;
  text-shadow: 0 0 20px rgba(231, 76, 60, 0.5), 0 0 40px rgba(231, 76, 60, 0.2);
}
.result-draw {
  color: #f1c40f;
  text-shadow: 0 0 20px rgba(241, 196, 15, 0.5), 0 0 40px rgba(241, 196, 15, 0.2);
}

/* ── Expandable log ──────────────────────────────────────────────── */
.log-section {
  width: 92%; max-width: 400px;
  margin-bottom: 12px;
}

.log-toggle {
  width: 100%;
  padding: 10px;
  background: linear-gradient(135deg, rgba(9, 9, 9, 0.9) 0%, rgba(26, 26, 46, 0.65) 100%);
  border: 1px solid rgba(255, 6, 111, 0.15);
  border-radius: 8px;
  color: var(--gray2);
  font-size: 0.7rem;
  cursor: pointer;
  text-align: center;
  transition: border-color 0.2s ease;
}
.log-toggle:active {
  border-color: var(--primary-color);
}

.detailed-log {
  margin-top: 6px;
  max-height: 200px;
  overflow-y: auto;
}

.log-entry {
  display: flex; align-items: center; gap: 6px;
  padding: 5px 8px;
  background: rgba(9, 9, 9, 0.7);
  border-left: 2px solid rgba(255, 6, 111, 0.15);
  border-radius: 0 4px 4px 0;
  margin-bottom: 2px;
  font-size: 0.6rem;
}
.log-round  { color: var(--gray2); min-width: 24px; font-weight: bold; }
.log-action {
  flex: 1; text-align: center;
  display: flex; align-items: center; gap: 3px;
}
.log-action.left  { justify-content: flex-end; }
.log-action.right { justify-content: flex-start; }
.log-action-icon { width: 12px; height: 12px; flex-shrink: 0; }
.log-attack   { color: #e74c3c; }
.log-defense  { color: #3498db; }
.log-position { color: #9b59b6; }
.log-vs  { color: var(--gray2); font-size: 0.55rem; }
.log-hp  { color: var(--gray3); min-width: 50px; text-align: right; font-size: 0.55rem; }

/* ── AI Trainer ──────────────────────────────────────────────────── */
.ai-trainer {
  width: 92%; max-width: 400px;
  background: linear-gradient(135deg, rgba(9, 9, 9, 0.9) 0%, rgba(26, 26, 46, 0.65) 100%);
  border: 1px solid rgba(255, 6, 111, 0.2);
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 16px;
  position: relative; overflow: visible;
}
.ai-trainer::before {
  content: "";
  position: absolute;
  top: 0; left: 0; bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, var(--primary-color), transparent);
}

.trainer-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.trainer-avatar-img {
  width: 24px; height: 24px;
  filter: drop-shadow(0 0 4px rgba(255, 6, 111, 0.3));
}

.trainer-title {
  font-size: 0.75rem;
  color: var(--primary-color);
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.trainer-analysis p {
  font-size: 0.7rem;
  color: var(--gray3);
  line-height: 1.5;
  margin: 0;
}

/* ── Buttons ─────────────────────────────────────────────────────── */
.result-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
  width: 92%;
  max-width: 400px;
}
.result-btn {
  width: 100% !important;
  background: var(--primary-color) !important;
  color: white !important;
  font-size: 0.95rem !important;
  font-weight: 700 !important;
  border-radius: 8px !important;
  letter-spacing: 1px !important;
  box-shadow: 0 0 20px rgba(255, 6, 111, 0.45) !important;
  min-height: 48px !important;
}
.result-btn-secondary {
  width: 100% !important;
  background: transparent !important;
  border: 1px solid rgba(255, 6, 111, 0.4) !important;
  color: var(--gray3) !important;
  font-size: 0.78rem !important;
  box-shadow: none !important;
  min-height: 38px !important;
}

/* ── Coach Overlay ──────────────────────────────────────────────── */
.coach-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  background: rgba(0, 0, 0, 0.85);
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
  font-family: 'Anonymous', 'Courier New', Consolas, monospace;
  font-size: 3rem;
  font-weight: bold;
  color: var(--primary-color);
  text-shadow:
    0 0 10px rgba(255, 6, 111, 0.8),
    0 0 20px rgba(255, 6, 111, 0.5),
    2px 2px 0 #000;
  animation: coachTimerPulse 1s ease-in-out;
}

.advice-timer--urgent .advice-timer__number {
  color: #FF2222;
  text-shadow:
    0 0 15px rgba(255, 34, 34, 0.9),
    0 0 30px rgba(255, 34, 34, 0.6),
    2px 2px 0 #000;
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
  background: linear-gradient(135deg, rgba(9, 9, 9, 0.95) 0%, rgba(26, 26, 46, 0.8) 100%);
  border: 1px solid rgba(255, 6, 111, 0.3);
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
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--primary-color), transparent);
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
  filter: drop-shadow(0 0 6px rgba(255, 6, 111, 0.4));
}

.coach-title {
  font-size: 1rem;
  font-family: 'Anonymous', 'Courier New', Consolas, monospace;
  color: var(--primary-color);
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  text-shadow: 0 0 10px rgba(255, 6, 111, 0.3);
}

.coach-subtitle {
  font-size: 0.7rem;
  color: var(--gray3);
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
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(135deg, rgba(15, 15, 30, 0.9) 0%, rgba(30, 30, 55, 0.7) 100%);
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
  color: var(--gray2);
  margin-left: auto;
}

/* Attack */
.coach-btn-attack {
  border-color: rgba(231, 76, 60, 0.2);
}
.coach-btn-attack::before { background: #e74c3c; }
.coach-btn-attack .coach-btn-text { color: #e74c3c; }
.coach-btn-attack .coach-btn-icon { filter: drop-shadow(0 0 4px rgba(231, 76, 60, 0.4)); }
.coach-btn-attack:active {
  border-color: rgba(231, 76, 60, 0.5);
  box-shadow: 0 0 20px rgba(231, 76, 60, 0.15);
}

/* Defense */
.coach-btn-defense {
  border-color: rgba(52, 152, 219, 0.2);
}
.coach-btn-defense::before { background: #3498db; }
.coach-btn-defense .coach-btn-text { color: #3498db; }
.coach-btn-defense .coach-btn-icon { filter: drop-shadow(0 0 4px rgba(52, 152, 219, 0.4)); }
.coach-btn-defense:active {
  border-color: rgba(52, 152, 219, 0.5);
  box-shadow: 0 0 20px rgba(52, 152, 219, 0.15);
}

/* Position */
.coach-btn-position {
  border-color: rgba(155, 89, 182, 0.2);
}
.coach-btn-position::before { background: #9b59b6; }
.coach-btn-position .coach-btn-text { color: #9b59b6; }
.coach-btn-position .coach-btn-icon { filter: drop-shadow(0 0 4px rgba(155, 89, 182, 0.4)); }
.coach-btn-position:active {
  border-color: rgba(155, 89, 182, 0.5);
  box-shadow: 0 0 20px rgba(155, 89, 182, 0.15);
}

/* ── Coach Active Indicator ─────────────────────────────────────── */
.coach-active-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(9, 9, 9, 0.9) 0%, rgba(26, 26, 46, 0.7) 100%);
  border: 1px solid rgba(255, 6, 111, 0.3);
  margin: 6px 0;
  animation: coachBarPulse 2s ease-in-out infinite;
}

@keyframes coachBarPulse {
  0%, 100% { box-shadow: 0 0 8px rgba(255, 6, 111, 0.2); }
  50%      { box-shadow: 0 0 16px rgba(255, 6, 111, 0.4); }
}

.coach-active-icon {
  width: 16px; height: 16px;
  filter: drop-shadow(0 0 3px rgba(255, 6, 111, 0.3));
}

.coach-active-label {
  font-size: 0.65rem;
  font-weight: bold;
  color: var(--primary-color);
  letter-spacing: 0.5px;
}

.coach-active-rounds {
  font-size: 0.55rem;
  color: var(--gray3);
  margin-left: 2px;
}
/* ── XP Earned block ── */
.xp-earned-block {
  background: rgba(255, 6, 111, 0.08);
  border: 1px solid rgba(255, 6, 111, 0.3);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 12px;
}

.xp-earned-title {
  font-family: 'Anonymous', 'Courier New', Consolas, monospace;
  font-size: 0.75rem;
  color: var(--pink);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 8px;
}

.xp-earned-total {
  font-family: 'AnonymousBalance', 'Courier New', Consolas, monospace;
  font-size: 1.4rem;
  color: var(--pink);
  font-weight: bold;
  text-align: center;
  text-shadow: 0 0 10px rgba(255, 6, 111, 0.4);
}

/* ── PvP Badge ─────────────────────────────────────────────────── */
.pvp-badge {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 20px;
  background: rgba(255, 6, 111, 0.2);
  border: 1px solid #FF066F;
  border-radius: 20px;
  color: #FF066F;
  font-weight: 600;
  font-size: 14px;
  z-index: 10;
  font-family: 'Anonymous', 'Courier New', Consolas, monospace;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* ── Auto Fight Banner ──────────────────────────────────────────── */
.autofight-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 6px 16px;
  background: linear-gradient(135deg, rgba(255, 6, 111, 0.15) 0%, rgba(255, 6, 111, 0.05) 100%);
  border: 1px solid rgba(255, 6, 111, 0.4);
  border-radius: 20px;
  margin-bottom: 8px;
  animation: bannerPulse 2.5s ease-in-out infinite;
}

@keyframes bannerPulse {
  0%, 100% { box-shadow: 0 0 8px rgba(255, 6, 111, 0.2); }
  50% { box-shadow: 0 0 20px rgba(255, 6, 111, 0.5); }
}

.autofight-banner-icon {
  font-size: 0.9rem;
  animation: spin 3s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.autofight-banner-text {
  font-size: 0.7rem;
  font-weight: bold;
  color: var(--primary-color);
  letter-spacing: 1px;
  text-transform: uppercase;
}

/* ── PvP Modals & Overlays ──────────────────────────────────────── */
.pvp-modal-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 150;
}

.pvp-modal {
  background: linear-gradient(135deg, rgba(20, 20, 20, 0.95) 0%, rgba(9, 9, 9, 0.98) 100%);
  border: 1px solid rgba(255, 6, 111, 0.4);
  border-radius: 16px;
  padding: 32px 28px;
  text-align: center;
  max-width: 320px;
  width: 90%;
}

.pvp-modal-title {
  font-size: 1.2rem;
  font-weight: bold;
  color: #fff;
  margin: 12px 0 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.pvp-timer {
  font-size: 2rem;
  font-weight: 900;
  color: var(--primary-color);
  font-family: 'AnonymousBalance', 'Courier New', Consolas, monospace;
  margin: 8px 0 16px;
  text-shadow: 0 0 15px rgba(255, 6, 111, 0.5);
}

.pvp-modal-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn-roll {
  padding: 10px 24px;
  background: linear-gradient(135deg, var(--primary-color) 0%, #a50344 100%);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-weight: bold;
  font-size: 0.9rem;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: box-shadow 0.2s;
}

.btn-roll:hover {
  box-shadow: 0 0 20px rgba(255, 6, 111, 0.6);
}

.btn-skip {
  padding: 10px 24px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: bold;
  font-size: 0.9rem;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: border-color 0.2s;
}

.btn-skip:hover {
  border-color: rgba(255, 255, 255, 0.6);
}

.pvp-coach-text {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.85rem;
  margin: 4px 0 8px;
  line-height: 1.4;
}

.pvp-waiting-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  background: rgba(0, 0, 0, 0.7);
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
  border: 3px solid rgba(255, 6, 111, 0.3);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.pvp-waiting-text {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.pvp-result-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  background: rgba(0, 0, 0, 0.9);
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
  color: #4caf50;
  text-shadow: 0 0 30px rgba(76, 175, 80, 0.5);
}

.pvp-result-text.result-lose {
  color: #f44336;
  text-shadow: 0 0 30px rgba(244, 67, 54, 0.5);
}

.pvp-result-text.result-draw {
  color: #ff9800;
  text-shadow: 0 0 30px rgba(255, 152, 0, 0.5);
}

.pvp-disconnect-note {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
}

.btn-back {
  margin-top: 16px;
  padding: 12px 32px;
  background: linear-gradient(135deg, var(--primary-color) 0%, #a50344 100%);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: box-shadow 0.2s;
}

.btn-back:hover {
  box-shadow: 0 0 20px rgba(255, 6, 111, 0.6);
}

/* ── Overdrive ──────────────────────────────────────────────────── */
.overdrive-active .fighters-section {
  border-color: rgba(255, 100, 0, 0.4);
  animation: overdrivePulse 1.5s ease-in-out infinite;
}

@keyframes overdrivePulse {
  0%, 100% {
    border-color: rgba(255, 100, 0, 0.3);
    box-shadow: 0 0 10px rgba(255, 100, 0, 0.1);
  }
  50% {
    border-color: rgba(255, 100, 0, 0.7);
    box-shadow: 0 0 25px rgba(255, 100, 0, 0.3), inset 0 0 15px rgba(255, 100, 0, 0.05);
  }
}

.overdrive-label {
  display: inline-block;
  margin-top: 6px;
  font-size: 0.65rem;
  font-weight: 900;
  font-family: 'Anonymous', 'Courier New', Consolas, monospace;
  color: #FF6B00;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-shadow:
    0 0 8px rgba(255, 107, 0, 0.7),
    0 0 16px rgba(255, 107, 0, 0.3);
  animation: overdriveLabelPulse 1.5s ease-in-out infinite;
}

@keyframes overdriveLabelPulse {
  0%, 100% { opacity: 0.8; }
  50%      { opacity: 1; text-shadow: 0 0 12px rgba(255, 107, 0, 0.9), 0 0 24px rgba(255, 107, 0, 0.5); }
}

.log-round-overdrive {
  color: #FF6400 !important;
}
</style>
