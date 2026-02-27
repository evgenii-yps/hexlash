<template>
  <div class="background background-fight" :class="{ 'screen-flash': flashActive }" :style="flashStyle">
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
            <div class="round-counter" v-if="fightPhase === 'fighting'">R{{ roundNum }}</div>
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
            {{ eventTitle }}
          </div>
        </transition>

        <!-- Dice of Fate (manual, with cooldown) -->
        <div class="dice-area" v-if="fightPhase === 'fighting'">
          <button
            class="dice-button"
            :class="{ 'dice-ready': diceState.ready && !diceState.activeItem }"
            :disabled="!diceState.ready || !!diceState.activeItem"
            @click="rollDice"
          >
            <span class="dice-icon">🎲</span>
            <span v-if="!diceState.ready && !diceState.activeItem" class="dice-cd">{{ diceState.cooldownLeft }}</span>
          </button>
          <transition name="title-pop">
            <div v-if="diceState.activeItem" class="dice-item-result">
              <span class="dice-emoji">{{ diceState.activeItem.emoji }}</span>
              <div class="dice-info">
                <span class="dice-name">{{ diceState.activeItem.name }}</span>
                <span class="dice-desc">{{ diceState.activeItem.desc }}</span>
              </div>
            </div>
          </transition>
        </div>

        <!-- Active modifiers display -->
        <div class="modifiers-bar" v-if="fightPhase === 'fighting' && anyModActive">
          <span v-if="playerModifiers.attackMultiplier > 1" class="mod-badge mod-double">⚡ 2x ATK</span>
          <span v-if="playerModifiers.shieldActive"         class="mod-badge mod-shield">🛡️ ЩИТ</span>
          <span v-if="playerModifiers.blindActive"          class="mod-badge mod-blind">✨ СЛЕПОТА</span>
        </div>

        <!-- Results overlay -->
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

          <!-- Expandable detailed log -->
          <div class="log-section">
            <button class="log-toggle" @click="showDetailedLog = !showDetailedLog">
              {{ showDetailedLog ? t('fight.lblHideDetails') + ' ▲' : t('fight.lblShowDetails') + ' ▼' }}
            </button>
            <div v-if="showDetailedLog" class="detailed-log">
              <div v-for="r in roundLog" :key="r.roundNum" class="log-entry">
                <span class="log-round">R{{ r.roundNum }}</span>
                <span class="log-action left" :class="'log-' + r.action1">{{ actionLabel(r.action1) }}</span>
                <span class="log-vs">vs</span>
                <span class="log-action right" :class="'log-' + r.action2">{{ actionLabel(r.action2) }}</span>
                <span class="log-hp">{{ r.hp1After }} / {{ r.hp2After }}</span>
              </div>
            </div>
          </div>

          <!-- AI Trainer stub -->
          <div class="ai-trainer">
            <div class="trainer-header">
              <span class="trainer-avatar">🎯</span>
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
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import store from '@/core/state/store.js';
import { useI18n } from 'vue-i18n';
import { COUNTDOWN, ROUND_ANIMATION_MS, MAX_HP } from '@/core/constants.js';
import { ARCHETYPES } from '@/core/data/archetypes.js';
import HPBar        from '@/components/fragments/fight/HPBar.vue';
import RoundDisplay from '@/components/fragments/fight/RoundDisplay.vue';
import UserAvatar   from '@/components/fragments/profile/UserAvatar.vue';
import UserName     from '@/components/fragments/profile/UserName.vue';

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
const playerModules    = computed(() => store.getters['fight/getPlayerModules']);

const anyModActive = computed(() =>
    playerModifiers.value.attackMultiplier > 1 ||
    playerModifiers.value.shieldActive ||
    playerModifiers.value.blindActive
);

// ── Action labels ─────────────────────────────────────────────────────────
const ACTION_LABELS = {
  attack:   '⚔️ Атака',
  defense:  '🛡️ Защита',
  position: '👣 Позиция',
};

const actionLabel = (action) => ACTION_LABELS[action] || action;

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
onMounted(() => {
  if (fightPhase.value === 'fighting' && roundNum.value === 0) {
    startCountdown();
  }
});

onUnmounted(() => {
  stopFightTimer();
  clearInterval(countdownTimer);
});

watch(fightPhase, (val) => {
  if (val === 'fighting' && roundNum.value === 0) {
    startCountdown();
  }
  if (val === 'results') {
    stopFightTimer();
  }
});

// ── Dice click ───────────────────────────────────────────────────────────
const rollDice = () => {
  store.dispatch('fight/rollDiceManual');
};

// ── Navigation ────────────────────────────────────────────────────────────
const fightAgain = async () => {
  stopFightTimer();
  clearInterval(countdownTimer);
  showDetailedLog.value = false;
  prevHP1 = MAX_HP;
  prevHP2 = MAX_HP;
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
  background: linear-gradient(to right top, black 25%, transparent 125%);
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
  padding: 20px 16px;
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
  font-size: 3em;
  color: white;
  z-index: 100;
  padding: 10px 20px;
  border-radius: 4px;
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
  margin-bottom: 20px;
}

.fighter-side {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 160px;
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

.fighter-skin { width: 120px; height: 200px; padding: 5px; }
.flipped { transform: scaleX(-1); }

.vs-center {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  font-size: 1.2rem; color: var(--gray2);
  font-weight: bold; padding-top: 100px;
}

.round-counter {
  font-size: 0.6rem;
  color: var(--gray3);
  margin-top: 4px;
  letter-spacing: 1px;
}

.status-fighter {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
  font-family: Anonymous, sans-serif;
  font-size: 2em;
  background-color: var(--black-opacity-80);
  padding: 2px 16px; border-radius: 4px;
  animation: statusPopIn 0.5s ease-in-out forwards;
}
@keyframes statusPopIn {
  0%   { opacity: 0; transform: translate(-50%, -50%) scale(3); }
  100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}

/* ── Event title ─────────────────────────────────────────────────── */
.event-title {
  font-size: 1.2rem;
  font-weight: bold;
  padding: 8px 20px;
  border-radius: 8px;
  text-align: center;
  margin: 8px 0;
  animation: titlePop 0.4s ease-out;
}

@keyframes titlePop {
  0%   { opacity: 0; transform: scale(0.5); }
  60%  { opacity: 1; transform: scale(1.1); }
  100% { transform: scale(1); }
}

.title-pop-enter-active { animation: titlePop 0.4s ease-out; }
.title-pop-leave-active { transition: opacity 0.3s ease; }
.title-pop-leave-to     { opacity: 0; }

.event-emergency     { color: #FFD600; background: rgba(255, 214, 0, 0.15); border: 1px solid #FFD600; }
.event-dice-pickup   { color: #2ecc71; background: rgba(46, 204, 113, 0.15); }
.event-dice-ignore   { color: var(--gray3); background: rgba(255, 255, 255, 0.05); }

/* ── Dice (manual, with cooldown) ────────────────────────────────── */
.dice-area {
  width: 100%;
  min-height: 48px;
  margin: 4px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.dice-button {
  position: relative;
  width: 48px; height: 48px;
  border-radius: 50%;
  border: 2px solid rgba(255, 214, 0, 0.2);
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.dice-button:disabled {
  opacity: 0.5;
  cursor: default;
}

.dice-button.dice-ready {
  border-color: #FFD600;
  box-shadow: 0 0 12px rgba(255, 214, 0, 0.4), 0 0 24px rgba(255, 214, 0, 0.15);
  animation: dicePulse 1.5s ease-in-out infinite;
}

@keyframes dicePulse {
  0%, 100% { box-shadow: 0 0 12px rgba(255, 214, 0, 0.4), 0 0 24px rgba(255, 214, 0, 0.15); }
  50%      { box-shadow: 0 0 18px rgba(255, 214, 0, 0.6), 0 0 36px rgba(255, 214, 0, 0.25); }
}

.dice-icon { font-size: 1.4rem; }

.dice-cd {
  position: absolute;
  bottom: -2px; right: -2px;
  font-size: 0.55rem;
  font-weight: bold;
  color: var(--gray3);
  background: rgba(0,0,0,0.7);
  border-radius: 8px;
  padding: 1px 4px;
  line-height: 1;
}

.dice-item-result {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 1px solid rgba(255, 214, 0, 0.3);
  border-radius: 10px;
  max-width: 220px;
}

.dice-emoji { font-size: 1.6rem; }

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
  justify-content: center; margin: 4px 0;
}
.mod-badge {
  padding: 3px 10px; border-radius: 20px;
  font-size: 0.65rem; font-weight: bold; letter-spacing: 0.5px;
}
.mod-double { background: rgba(255,145,0,0.3); border: 1px solid #FF9100; color: #FF9100; }
.mod-shield { background: rgba(68,138,255,0.3); border: 1px solid #448AFF; color: #448AFF; }
.mod-blind  { background: rgba(224,64,251,0.3); border: 1px solid #E040FB; color: #E040FB; }

/* ── Results ─────────────────────────────────────────────────────── */
.results-overlay {
  width: 100%; margin-top: 20px;
  display: flex; flex-direction: column; align-items: center;
  animation: statusPopIn 0.5s ease-in-out forwards;
}
.result-label {
  font-size: 2.5em; font-family: Anonymous, sans-serif; margin-bottom: 16px;
}
.result-win  { color: #2ecc71; }
.result-lose { color: #e74c3c; }
.result-draw { color: #f1c40f; }

.fight-report {
  width: 100%; max-width: 300px;
  background-color: var(--black-opacity-80);
  border-radius: 8px; padding: 12px 16px; margin-bottom: 16px;
}
.report-title {
  font-size: 0.8rem; color: var(--gray2); text-align: center;
  margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;
}
.report-row {
  display: flex; justify-content: space-between;
  font-size: 0.7rem; color: var(--gray3); padding: 3px 0;
}

/* ── Expandable log ──────────────────────────────────────────────── */
.log-section {
  width: 100%; max-width: 300px;
  margin-bottom: 12px;
}

.log-toggle {
  width: 100%;
  padding: 8px;
  background-color: var(--black-opacity-80);
  border: 1px solid var(--gray2);
  border-radius: 6px;
  color: var(--gray2);
  font-size: 0.7rem;
  cursor: pointer;
  text-align: center;
}

.detailed-log {
  margin-top: 6px;
  max-height: 200px;
  overflow-y: auto;
}

.log-entry {
  display: flex; align-items: center; gap: 6px;
  padding: 4px 8px;
  background-color: var(--black-opacity-80);
  border-radius: 4px; margin-bottom: 3px;
  font-size: 0.6rem;
}
.log-round  { color: var(--gray2); min-width: 24px; }
.log-action { flex: 1; text-align: center; }
.log-action.left  { text-align: right; }
.log-action.right { text-align: left; }
.log-attack   { color: #e74c3c; }
.log-defense  { color: #3498db; }
.log-position { color: #9b59b6; }
.log-vs  { color: var(--gray2); font-size: 0.55rem; }
.log-hp  { color: var(--gray3); min-width: 50px; text-align: right; font-size: 0.55rem; }

/* ── AI Trainer ──────────────────────────────────────────────────── */
.ai-trainer {
  width: 100%; max-width: 300px;
  background-color: var(--black-opacity-80);
  border: 1px solid rgba(255, 214, 0, 0.2);
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 16px;
}

.trainer-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.trainer-avatar {
  font-size: 1.2rem;
}

.trainer-title {
  font-size: 0.75rem;
  color: #FFD600;
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
.result-buttons { display: flex; gap: 10px; margin-top: 8px; }
.result-btn {
  background-color: var(--primary-color) !important;
  color: white !important; font-size: 0.8rem !important;
}
.result-btn-secondary {
  background-color: var(--black-opacity-80) !important;
  border: 1px solid var(--gray2);
}
</style>
