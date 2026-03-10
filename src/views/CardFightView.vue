<template>
  <div class="background background-fight" :class="{ 'screen-flash': flashActive }" :style="flashStyle">

    <!-- Loading overlay: "Never give up" -->
    <Transition name="loading-fade">
      <div v-if="showLoadingOverlay" class="loading-overlay">
        <div class="loading-hexlash">HEXLASH</div>
        <div class="loading-never-give-up">Never give up</div>
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
            <HPBar :currentHP="liveHP1" :name="t('fight.lblHP')"/>
            <div v-if="statusLeft" class="status-fighter">{{ statusLeft }}</div>
          </div>

          <div class="vs-center">
            <span>VS</span>
            <div class="round-dots" v-if="fightPhase === 'fighting'">
              <span
                v-for="n in 10"
                :key="n"
                class="round-dot"
                :class="{
                  'round-dot-done':    n < roundNum,
                  'round-dot-current': n === roundNum,
                }"
              ></span>
            </div>
          </div>

          <div class="fighter-side fighter-right" :class="{ 'fighter-shake': shakeRight }">
            <div class="fighter-info">
              <UserAvatar :avatarUrl="opponent?.avatarUrl || ''" width="40px" height="40px"/>
              <UserName :userName="opponent?.name || 'Opponent'" style="width: auto !important;"/>
            </div>
            <v-img :src="`/images/skins/${opponent?.skin || 'skin_m_1.png'}`" class="fighter-skin flipped" aspect-ratio="1"/>
            <HPBar :currentHP="liveHP2" :name="t('fight.lblHP')"/>
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
        <div class="dice-area" v-if="fightPhase === 'fighting' && (diceState.ready || diceState.activeItem)">
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
                <span class="dice-name">{{ diceState.activeItem.name }}</span>
                <span class="dice-desc">{{ diceState.activeItem.desc }}</span>
              </div>
            </div>
          </transition>
        </div>

        <!-- Active modifiers display -->
        <div class="modifiers-bar" v-if="fightPhase === 'fighting' && anyModActive">
          <span v-if="playerModifiers.attackMultiplier > 1" class="mod-badge mod-double"><img :src="iconAdrenaline" class="mod-icon" alt=""/> 2x ATK</span>
          <span v-if="playerModifiers.shieldActive"         class="mod-badge mod-shield"><img :src="iconShield" class="mod-icon" alt=""/> ЩИТ</span>
          <span v-if="playerModifiers.blindActive"          class="mod-badge mod-blind"><img :src="iconBlind" class="mod-icon" alt=""/> СЛЕПОТА</span>
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
          <div class="coach-header">
            <img :src="iconTrainer" class="coach-avatar" alt=""/>
            <span class="coach-title">{{ t('fight.lblCoachTitle') }}</span>
          </div>
          <p class="coach-subtitle">{{ t('fight.lblCoachSubtitle') }}</p>

          <div class="coach-options">
            <button class="coach-btn coach-btn-attack" @click="giveCoachAdvice('attack')">
              <img :src="iconAttack" class="coach-btn-icon" alt=""/>
              <span class="coach-btn-text">{{ t('fight.lblCoachAttack') }}</span>
              <span class="coach-btn-desc">{{ t('fight.lblCoachAttackDesc') }}</span>
            </button>
            <button class="coach-btn coach-btn-defense" @click="giveCoachAdvice('defense')">
              <img :src="iconDefense" class="coach-btn-icon" alt=""/>
              <span class="coach-btn-text">{{ t('fight.lblCoachDefense') }}</span>
              <span class="coach-btn-desc">{{ t('fight.lblCoachDefenseDesc') }}</span>
            </button>
            <button class="coach-btn coach-btn-position" @click="giveCoachAdvice('position')">
              <img :src="iconPosition" class="coach-btn-icon" alt=""/>
              <span class="coach-btn-text">{{ t('fight.lblCoachPosition') }}</span>
              <span class="coach-btn-desc">{{ t('fight.lblCoachPositionDesc') }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Results overlay (full-screen centered) -->
      <div v-if="fightPhase === 'results'" class="results-overlay">
          <div class="result-label" :class="resultClass">{{ resultText }}</div>

          <div class="fight-report">
            <div class="report-title">{{ t('fight.lblReport') }}</div>
            <div class="report-row">
              <span>{{ t('fight.lblRoundsPlayed') }}:</span>
              <span>{{ roundNum }}</span>
            </div>
            <div class="report-row">
              <span>{{ t('fight.lblTotalDamage') }}:</span>
              <span>{{ fightStats.totalDamageDealt }}</span>
            </div>
            <div class="report-row">
              <span>{{ t('fight.lblPickedUp') }}:</span>
              <span>{{ fightStats.dicePickedUp }}</span>
            </div>
            <div class="report-row">
              <span>{{ t('fight.lblRemainingHP') }}:</span>
              <span>{{ liveHP1 }}</span>
            </div>
          </div>

          <!-- XP за бой -->
          <div v-if="xpEarned" class="xp-earned-block">
            <div class="xp-earned-title">Получено опыта</div>
            <div class="xp-earned-rows">
              <div class="xp-row"><span class="xp-branch">Скорость</span><span class="xp-val">+{{ xpEarned.speed ?? 0 }} XP</span></div>
              <div class="xp-row"><span class="xp-branch">Сила</span><span class="xp-val">+{{ xpEarned.power ?? 0 }} XP</span></div>
              <div class="xp-row"><span class="xp-branch">Техника</span><span class="xp-val">+{{ xpEarned.technique ?? 0 }} XP</span></div>
            </div>
          </div>

          <!-- Expandable detailed log -->
          <div class="log-section">
            <button class="log-toggle" @click="showDetailedLog = !showDetailedLog">
              {{ showDetailedLog ? t('fight.lblHideDetails') + ' ▲' : t('fight.lblShowDetails') + ' ▼' }}
            </button>
            <div v-if="showDetailedLog" class="detailed-log">
              <div v-for="r in roundLog" :key="r.roundNum" class="log-entry">
                <span class="log-round">R{{ r.roundNum }}</span>
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

          <!-- AI Trainer stub -->
          <div class="ai-trainer">
            <div class="trainer-header">
              <img :src="iconTrainer" class="trainer-avatar-img" alt=""/>
              <span class="trainer-title">{{ t('fight.lblTrainerAnalysis') }}</span>
            </div>
            <div class="trainer-analysis">
              <p>{{ trainerAnalysis }}</p>
            </div>
          </div>

          <div class="result-buttons">
            <VBtn class="result-btn" @click="fightAgain">{{ t('fight.lblFightAgain') }}</VBtn>
            <VBtn class="result-btn result-btn-secondary" @click="changeBuild">{{ t('fight.lblChangeDeck') }}</VBtn>
          </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import store from '@/core/state/store.js';
import router from '@/router/index.js';
import { useI18n } from 'vue-i18n';
import apiClient from '@/core/api/apiClient.js';
import { COUNTDOWN, ROUND_ANIMATION_MS, MAX_HP } from '@/core/constants.js';
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

const { t } = useI18n({ useScope: 'global' });

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

// ── Action labels (for log) ───────────────────────────────────────────────
const LOG_ACTIONS = {
  attack:   { image: iconAttack,   name: 'Атака' },
  defense:  { image: iconDefense,  name: 'Защита' },
  position: { image: iconPosition, name: 'Позиция' },
};

const logActionImage = (action) => LOG_ACTIONS[action]?.image || '';
const logActionName  = (action) => LOG_ACTIONS[action]?.name || action;

// ── Result UI ──────────────────────────────────────────────────────────────
const statusLeft = computed(() => {
  if (fightPhase.value !== 'results') return '';
  const p1win = (liveHP1.value > liveHP2.value && liveHP2.value <= 0) || (liveHP1.value > 0 && liveHP2.value <= 0);
  const draw  = liveHP1.value <= 0 && liveHP2.value <= 0;
  if (draw)  return t('fight.lblDraw');
  if (p1win) return t('fight.lblVictory');
  if (liveHP1.value <= 0) return t('fight.lblDefeat');
  if (liveHP1.value > liveHP2.value) return t('fight.lblVictory');
  if (liveHP1.value < liveHP2.value) return t('fight.lblDefeat');
  return t('fight.lblDraw');
});

const statusRight = computed(() => {
  if (fightPhase.value !== 'results') return '';
  const left = statusLeft.value;
  if (left === t('fight.lblVictory')) return t('fight.lblDefeat');
  if (left === t('fight.lblDefeat'))  return t('fight.lblVictory');
  return t('fight.lblDraw');
});

const resultText  = computed(() => statusLeft.value);
const resultClass = computed(() => {
  const t2 = resultText.value;
  if (t2 === t('fight.lblVictory')) return 'result-win';
  if (t2 === t('fight.lblDefeat'))  return 'result-lose';
  return 'result-draw';
});

// ── AI Trainer stub ──────────────────────────────────────────────────────
const trainerAnalysis = computed(() => {
  const won = liveHP1.value > liveHP2.value;
  const modules = playerModules.value;
  const names = modules.filter(id => id).map(id => ARCHETYPES[id]?.nameRu || id);
  const buildStr = names.join(' + ');

  if (won) {
    return `Отличный бой! Ваш билд [${buildStr}] эффективно работал. ` +
        `Особенно хорошо показал себя ${names[0]} в роли основного модуля.`;
  } else {
    return `Ваш боец [${buildStr}] проиграл. ` +
        `Рекомендация: попробуйте заменить ${names[0]} на Стража для лучшей защиты против агрессивных стилей.`;
  }
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
      countdownValue.value = 'Fight!';
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

  // Restore fight from localStorage (handles page reload / tab switch)
  await store.dispatch('fight/initFromStorage');

  if (fightPhase.value === 'fighting') {
    if (roundNum.value === 0) {
      startCountdown();
    } else {
      // Restored in-progress fight — skip countdown, resume timer
      showCountdown.value = false;
      startFightTimer();
    }
  } else if (fightPhase.value === 'coach') {
    showCountdown.value = false;
    // Timer is paused; coach overlay will show
  } else if (fightPhase.value === 'results') {
    showCountdown.value = false;
  } else {
    // No active fight — go to preparation
    await router.push('/arena');
  }

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('beforeunload', handleBeforeUnload);
});

onUnmounted(() => {
  stopFightTimer();
  clearInterval(countdownTimer);
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
  // Resume timer after coach advice
  if (val === 'fighting' && oldVal === 'coach') {
    startFightTimer();
  }
  if (val === 'coach') {
    stopFightTimer();
  }
  if (val === 'results') {
    stopFightTimer();
    // Only award XP once (guard against double-award on restore)
    if (!store.getters['fight/getXpAwarded']) {
      const result = statusLeft.value === t('fight.lblVictory') ? 'win' : 'lose';
      const deck = store.getters['progression/getDeck'];
      const expGain = result === 'win' ? 10 : 5;
      const branchCount = { speed: 0, power: 0, technique: 0 };
      deck.forEach(id => { const b = movesData[id]?.branch; if (b) branchCount[b]++; });
      const earned = {};
      Object.entries(branchCount).forEach(([branch, count]) => {
        if (count > 0) {
          const xp = Math.floor(expGain * count / deck.length);
          if (xp > 0) earned[branch] = xp;
        }
      });
      store.commit('fight/setXpEarned', earned);
      store.commit('fight/setXpAwarded', true);
      store.dispatch('progression/onFightEnd', { result, deck });

      const isWin  = statusLeft.value === t('fight.lblVictory');
      const isDraw = statusLeft.value === t('fight.lblDraw');
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
  store.dispatch('fight/rollDiceManual');
};

// ── Coach advice ─────────────────────────────────────────────────────────
const giveCoachAdvice = (action) => {
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

const changeBuild = async () => {
  await store.dispatch('fight/resetToPreparation');
};

// ── Scroll ────────────────────────────────────────────────────────────────
const emit = defineEmits(['scroll']);
const handleScroll = (event) => {
  emit('scroll', event.target.scrollTop);
};

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
  font-family: Anonymous, sans-serif;
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
  font-family: Anonymous, sans-serif;
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
  padding: 16px 12px;
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
  font-family: Anonymous, sans-serif;
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
  font-family: Anonymous, sans-serif;
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

.status-fighter {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
  font-family: Anonymous, sans-serif;
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
  100% { transform: scale(1); }
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
.event-dice-pickup {
  color: #2ecc71;
  background: rgba(46, 204, 113, 0.08);
  border-color: rgba(46, 204, 113, 0.4);
  box-shadow: 0 0 16px rgba(46, 204, 113, 0.15);
}
.event-dice-ignore {
  color: var(--gray3);
  background: rgba(255, 255, 255, 0.04);
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
  z-index: 50;
  background: rgba(0, 0, 0, 0.82);
  animation: resultsOverlayIn 0.5s ease-out forwards;
  overflow-y: auto;
  padding: 24px 16px 80px;
  box-sizing: border-box;
}
@supports (height: 100dvh) { .results-overlay { height: 100dvh; } }
@keyframes resultsOverlayIn {
  0%   { opacity: 0; }
  100% { opacity: 1; }
}
.result-label {
  font-size: 2.5em; font-family: Anonymous, sans-serif;
  margin-bottom: 16px; letter-spacing: 2px;
  text-align: center;
  animation: resultLabelPop 0.6s ease-out forwards;
}
@keyframes resultLabelPop {
  0%   { opacity: 0; transform: scale(2.5); }
  60%  { opacity: 1; transform: scale(0.95); }
  100% { transform: scale(1); }
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

.fight-report {
  width: 92%; max-width: 400px;
  background: linear-gradient(135deg, rgba(9, 9, 9, 0.9) 0%, rgba(26, 26, 46, 0.65) 100%);
  border: 1px solid rgba(255, 6, 111, 0.2);
  border-radius: 10px;
  padding: 14px 18px; margin-bottom: 12px;
  position: relative; overflow: hidden;
}
.fight-report::before {
  content: "";
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--primary-color), transparent);
}
.report-title {
  font-size: 0.75rem; color: var(--primary-color); text-align: center;
  margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px;
  font-weight: bold;
}
.report-row {
  display: flex; justify-content: space-between;
  font-size: 0.7rem; color: var(--gray3); padding: 4px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}
.report-row:last-child { border-bottom: none; }

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
  position: relative; overflow: hidden;
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
  z-index: 60;
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
  font-family: Anonymous, sans-serif;
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
  font-family: Anonymous, sans-serif;
  font-size: 0.75rem;
  color: var(--pink);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 8px;
}

.xp-earned-rows {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.xp-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.xp-branch {
  font-size: 0.85rem;
  color: var(--gray3);
}

.xp-val {
  font-family: AnonymousBalance, sans-serif;
  font-size: 0.9rem;
  color: var(--pink);
}
</style>
