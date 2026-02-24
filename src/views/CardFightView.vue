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

        <!-- Current round display -->
        <RoundDisplay v-if="currentRound" :round="currentRound"/>

        <!-- ── Dice of Fate ────────────────────────────────────────── -->
        <div class="dice-area" v-if="fightPhase === 'fighting'">

          <!-- Rolling animation -->
          <div v-if="diceState.rolling" class="dice-roll-anim">
            <span class="dice-spin">🎲</span>
            <span class="dice-spin-label">{{ t('fight.lblDiceRolling') }}</span>
          </div>

          <!-- Active item: tap to use -->
          <div
              v-else-if="diceState.activeItem"
              class="dice-item"
              @click="onUseDice"
          >
            <span class="dice-emoji">{{ diceState.activeItem.emoji }}</span>
            <div class="dice-info">
              <span class="dice-name">{{ diceState.activeItem.name }}</span>
              <span class="dice-desc">{{ diceState.activeItem.desc }}</span>
            </div>
            <span class="dice-tap">{{ t('fight.lblDiceTap') }}</span>
          </div>
        </div>

        <!-- ── Manual Override ─────────────────────────────────────── -->
        <div
            v-if="overrideAvailable && fightPhase === 'fighting'"
            class="override-btn"
            :style="{ '--override-progress': overrideProgress + '%' }"
            @click="onUseOverride"
        >
          <span class="override-icon">⚔️</span>
          <span class="override-label">OVERRIDE!</span>
          <span class="override-dmg">-{{ overrideDamage }} HP</span>
        </div>

        <!-- Active modifiers display -->
        <div class="modifiers-bar" v-if="fightPhase === 'fighting' && anyModActive">
          <span v-if="playerModifiers.attackMultiplier > 1" class="mod-badge mod-double">⚡ 2x ATK</span>
          <span v-if="playerModifiers.shieldActive"         class="mod-badge mod-shield">🛡️ ЩИТ</span>
          <span v-if="playerModifiers.blindActive"          class="mod-badge mod-blind">✨ СЛЕПОТА</span>
        </div>

        <!-- Round history log -->
        <div class="round-log" v-if="roundLog.length > 0" ref="logEndRef">
          <div v-for="(r, i) in roundLog" :key="i" class="log-entry">
            <span class="log-round">R{{ r.roundNum }}</span>
            <span class="log-card left" :class="'log-' + r.card1.type">{{ r.card1.name }}</span>
            <span class="log-vs">vs</span>
            <span class="log-card right" :class="'log-' + r.card2.type">{{ r.card2.name }}</span>
            <span class="log-hp">{{ r.hp1After }} / {{ r.hp2After }}</span>
          </div>
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
              <span>{{ t('fight.lblDiceUsed') }}:</span>
              <span>{{ fightStats.diceUsed }}</span>
            </div>
            <div class="report-row">
              <span>{{ t('fight.lblOverridesHit') }}:</span>
              <span>{{ fightStats.overridesHit }}</span>
            </div>
            <div class="report-row">
              <span>{{ t('fight.lblRemainingHP') }}:</span>
              <span>{{ liveHP1 }}</span>
            </div>
          </div>

          <div class="result-buttons">
            <VBtn class="result-btn"           @click="fightAgain">{{ t('fight.lblFightAgain') }}</VBtn>
            <VBtn class="result-btn result-btn-secondary" @click="changeDeck">{{ t('fight.lblChangeDeck') }}</VBtn>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import {computed, onMounted, onUnmounted, ref, watch, nextTick} from 'vue';
import store from "@/core/state/store.js";
import {useI18n} from "vue-i18n";
import {COUNTDOWN, ROUND_ANIMATION_MS, MAX_HP} from "@/core/constants.js";
import HPBar        from "@/components/fragments/fight/HPBar.vue";
import RoundDisplay from "@/components/fragments/fight/RoundDisplay.vue";
import UserAvatar   from "@/components/fragments/profile/UserAvatar.vue";
import UserName     from "@/components/fragments/profile/UserName.vue";

const {t} = useI18n({useScope: 'global'});

// ── Countdown ──────────────────────────────────────────────────────────────
const showCountdown  = ref(true);
const countdownValue = ref(COUNTDOWN);
let countdownTimer   = null;

// ── Fight timers ───────────────────────────────────────────────────────────
let roundTimer    = null;
let diceTimer     = null;
let diceItemTimer = null;
let overrideTimer = null;

// ── Animations ─────────────────────────────────────────────────────────────
const shakeLeft  = ref(false);
const shakeRight = ref(false);
const flashActive = ref(false);
const flashColor  = ref('transparent');

// Override countdown (for progress bar)
const overrideProgress  = ref(100);
let overrideProgressInt = null;

const logEndRef = ref(null);

// ── Prev HP for shake detection ────────────────────────────────────────────
let prevHP1 = MAX_HP;
let prevHP2 = MAX_HP;

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
const overrideAvailable= computed(() => store.getters['fight/getOverrideAvailable']);
const overrideDamage   = computed(() => store.getters['fight/getOverrideDamage']);
const playerModifiers  = computed(() => store.getters['fight/getPlayerModifiers']);
const fightStats       = computed(() => store.getters['fight/getFightStats']);

const anyModActive = computed(() =>
    playerModifiers.value.attackMultiplier > 1 ||
    playerModifiers.value.shieldActive ||
    playerModifiers.value.blindActive
);

// ── Result UI ──────────────────────────────────────────────────────────────
const statusLeft = computed(() => {
  if (fightPhase.value !== 'results') return '';
  const p1win = liveHP1.value > liveHP2.value && liveHP2.value <= 0 || (liveHP1.value > 0 && liveHP2.value <= 0);
  const draw  = liveHP1.value <= 0 && liveHP2.value <= 0;
  if (draw)  return t('fight.lblDraw');
  if (p1win) return t('fight.lblVictory');
  if (liveHP1.value <= 0) return t('fight.lblDefeat');
  // by HP remaining
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

// ── Override progress bar ──────────────────────────────────────────────────
watch(overrideAvailable, (val) => {
  if (val) {
    overrideProgress.value = 100;
    clearInterval(overrideProgressInt);
    overrideProgressInt = setInterval(() => {
      overrideProgress.value -= 2.2;  // ~2.2s to drain (100 steps × ~22ms ≈ 2.2s)
      if (overrideProgress.value <= 0) {
        clearInterval(overrideProgressInt);
      }
    }, 22);

    overrideTimer = setTimeout(() => {
      store.dispatch('fight/dismissOverride');
    }, 2200);
  } else {
    clearInterval(overrideProgressInt);
    clearTimeout(overrideTimer);
  }
});

// ── Shake + flash on HP change ─────────────────────────────────────────────
watch(liveHP1, (newVal) => {
  if (newVal < prevHP1) {
    shakeLeft.value = true;
    setTimeout(() => { shakeLeft.value = false; }, 400);
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

// Auto-scroll log
watch(roundLog, async () => {
  await nextTick();
  if (logEndRef.value) {
    logEndRef.value.scrollTop = logEndRef.value.scrollHeight;
  }
}, {deep: true});

// ── Dice of Fate ──────────────────────────────────────────────────────────
const rollDiceNow = () => {
  if (fightPhase.value !== 'fighting') return;
  if (diceState.value.rolling || diceState.value.activeItem) return;

  store.dispatch('fight/rollDice');

  // Auto-dismiss item after 3s if not used (1.2s spin + 3s window)
  diceItemTimer = setTimeout(() => {
    store.dispatch('fight/dismissDice');
  }, 1200 + 3000);
};

const onUseDice = () => {
  clearTimeout(diceItemTimer);
  triggerFlash(diceState.value.activeItem?.effect);
  store.dispatch('fight/useDice');
};

const triggerFlash = (effect) => {
  const colors = {
    heal:   'rgba(46, 204, 113, 0.25)',
    double: 'rgba(255, 145, 0, 0.25)',
    shield: 'rgba(68, 138, 255, 0.25)',
    blind:  'rgba(224, 64, 251, 0.25)',
    rage:   'rgba(255, 23, 68, 0.25)',
    crit:   'rgba(255, 214, 0, 0.25)',
  };
  flashColor.value  = colors[effect] || 'rgba(255,255,255,0.15)';
  flashActive.value = true;
  setTimeout(() => { flashActive.value = false; }, 350);
};

// ── Override ──────────────────────────────────────────────────────────────
const onUseOverride = () => {
  clearTimeout(overrideTimer);
  triggerFlash('rage');
  store.dispatch('fight/useOverride');
};

// ── Fight flow ─────────────────────────────────────────────────────────────
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
        startFightTimers();
      }, 600);
    }
  }, 800);
};

const startFightTimers = () => {
  stopFightTimers();

  // Round timer
  roundTimer = setInterval(() => {
    if (fightPhase.value === 'fighting') {
      store.dispatch('fight/computeNextRound');
    } else {
      stopFightTimers();
    }
  }, ROUND_ANIMATION_MS);

  // Dice timer: first roll after 2.5s, then every 7s
  const firstDice = setTimeout(rollDiceNow, 2500);
  diceTimer = setInterval(rollDiceNow, 7000);

  // Store firstDice handle so we can cancel it
  diceTimer._firstDice = firstDice;
};

const stopFightTimers = () => {
  clearInterval(roundTimer);
  clearInterval(diceTimer);
  clearTimeout(diceTimer?._firstDice);
  clearTimeout(diceItemTimer);
  clearTimeout(overrideTimer);
  clearInterval(overrideProgressInt);
};

// ── Lifecycle ─────────────────────────────────────────────────────────────
onMounted(() => {
  if (fightPhase.value === 'fighting' && roundNum.value === 0) {
    startCountdown();
  }
});

onUnmounted(() => {
  stopFightTimers();
  clearInterval(countdownTimer);
});

watch(fightPhase, (val) => {
  if (val === 'fighting' && roundNum.value === 0) {
    startCountdown();
  }
  if (val === 'results') {
    stopFightTimers();
  }
});

// ── Navigation ────────────────────────────────────────────────────────────
const fightAgain = async () => {
  stopFightTimers();
  clearInterval(countdownTimer);
  prevHP1 = MAX_HP;
  prevHP2 = MAX_HP;
  await store.dispatch('fight/fightAgain');
  startCountdown();
};

const changeDeck = async () => {
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

/* Screen flash overlay */
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

/* ── Dice of Fate ────────────────────────────────────────────────── */
.dice-area {
  width: 100%;
  min-height: 56px;
  margin: 8px 0;
  display: flex;
  justify-content: center;
}

/* Rolling animation */
.dice-roll-anim {
  display: flex; flex-direction: column; align-items: center;
  gap: 4px; padding: 10px;
}

@keyframes spin3d {
  0%   { transform: rotateY(0deg); }
  100% { transform: rotateY(360deg); }
}
.dice-spin {
  font-size: 2rem;
  display: inline-block;
  animation: spin3d 0.3s linear infinite;
}
.dice-spin-label {
  font-size: 0.6rem; color: var(--gray2); text-transform: uppercase; letter-spacing: 1px;
}

/* Active item card */
.dice-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid #FFD600;
  border-radius: 12px;
  cursor: pointer;
  animation: dicePopIn 0.3s ease-out;
  transition: transform 0.15s ease;
  max-width: 320px; width: 100%;
}
.dice-item:active { transform: scale(0.96); }

@keyframes dicePopIn {
  from { opacity: 0; transform: scale(0.7); }
  to   { opacity: 1; transform: scale(1); }
}

.dice-emoji { font-size: 2rem; }

.dice-info {
  display: flex; flex-direction: column; flex: 1;
}
.dice-name {
  font-size: 0.85rem; font-weight: bold;
  color: #FFD600; letter-spacing: 1px;
}
.dice-desc {
  font-size: 0.7rem; color: var(--gray3);
}
.dice-tap {
  font-size: 0.6rem; color: var(--gray2);
  text-transform: uppercase; letter-spacing: 1px;
  animation: pulse 1s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}

/* ── Override button ─────────────────────────────────────────────── */
.override-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #FF1744, #D50000);
  border: 2px solid #FF1744;
  border-radius: 12px;
  cursor: pointer;
  margin: 6px 0;
  width: 100%;
  max-width: 320px;
  position: relative;
  overflow: hidden;
  animation: overridePulse 0.5s ease-in-out infinite alternate;
  transition: transform 0.15s ease;
}
.override-btn:active { transform: scale(0.96); }

/* Progress drain (CSS custom property updated by JS) */
.override-btn::before {
  content: '';
  position: absolute;
  bottom: 0; left: 0;
  width: var(--override-progress, 100%);
  height: 3px;
  background: rgba(255, 255, 255, 0.5);
  transition: width 0.022s linear;
}

@keyframes overridePulse {
  from { box-shadow: 0 0 8px rgba(255, 23, 68, 0.6); }
  to   { box-shadow: 0 0 20px rgba(255, 23, 68, 0.9); }
}

.override-icon  { font-size: 1.4rem; }
.override-label { flex: 1; font-size: 1rem; font-weight: bold; color: white; letter-spacing: 2px; }
.override-dmg   { font-size: 0.9rem; color: #FFD600; font-weight: bold; }

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

/* ── Round log ───────────────────────────────────────────────────── */
.round-log {
  width: 100%;
  margin-top: 16px;
  max-height: 200px;
  overflow-y: auto;
}
.log-entry {
  display: flex; align-items: center; gap: 6px;
  padding: 4px 8px;
  background-color: var(--black-opacity-80);
  border-radius: 4px; margin-bottom: 4px;
  font-size: 0.65rem;
}
.log-round { color: var(--gray2); min-width: 24px; }
.log-card  { flex: 1; text-align: center; }
.log-card.left  { text-align: right; }
.log-card.right { text-align: left; }
.log-attack  { color: #e74c3c; }
.log-defense { color: #3498db; }
.log-special { color: #f39c12; }
.log-vs  { color: var(--gray2); font-size: 0.55rem; }
.log-hp  { color: var(--gray3); min-width: 50px; text-align: right; font-size: 0.55rem; }

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
