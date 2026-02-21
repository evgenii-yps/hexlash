<template>
  <div class="background background-fight">
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
          <div class="fighter-side">
            <div class="fighter-info">
              <UserAvatar :avatarUrl="master?.userData?.avatarUrl" width="40px" height="40px"/>
              <UserName :userName="master?.userData?.name || 'You'" style="width: auto !important;"/>
            </div>
            <v-img :src="`/images/skins/${master?.userData?.skin || 'skin_m_1.png'}`" class="fighter-skin" aspect-ratio="1"/>
            <HPBar :currentHP="playerHP" :name="t('fight.lblHP')"/>
            <div v-if="statusLeft" class="status-fighter">{{ statusLeft }}</div>
          </div>

          <div class="vs-center">VS</div>

          <div class="fighter-side fighter-right">
            <div class="fighter-info">
              <UserAvatar :avatarUrl="opponent?.avatarUrl || ''" width="40px" height="40px"/>
              <UserName :userName="opponent?.name || 'Opponent'" style="width: auto !important;"/>
            </div>
            <v-img :src="`/images/skins/${opponent?.skin || 'skin_m_1.png'}`" class="fighter-skin flipped" aspect-ratio="1"/>
            <HPBar :currentHP="opponentHP" :name="t('fight.lblHP')"/>
            <div v-if="statusRight" class="status-fighter">{{ statusRight }}</div>
          </div>
        </div>

        <!-- Current round display -->
        <RoundDisplay v-if="currentRound" :round="currentRound"/>

        <!-- Round history log -->
        <div class="round-log" v-if="playedRounds.length > 0">
          <div v-for="(r, i) in playedRounds" :key="i" class="log-entry">
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
              <span>{{ t('fight.lblRoundsPlayed') }}:</span> <span>{{ totalRounds }}</span>
            </div>
            <div class="report-row" v-if="playerStats">
              <span>{{ t('fight.lblTotalDamage') }}:</span> <span>{{ playerStats.totalDamageDealt }}</span>
            </div>
            <div class="report-row" v-if="playerStats">
              <span>{{ t('fight.lblTotalBlocked') }}:</span> <span>{{ playerStats.totalDamageBlocked }}</span>
            </div>
            <div class="report-row" v-if="playerStats">
              <span>{{ t('fight.lblCardsUsed') }}:</span> <span>{{ playerStats.cardsUsed }}</span>
            </div>
          </div>

          <div class="result-buttons">
            <VBtn class="result-btn" @click="fightAgain">{{ t('fight.lblFightAgain') }}</VBtn>
            <VBtn class="result-btn result-btn-secondary" @click="changeDeck">{{ t('fight.lblChangeDeck') }}</VBtn>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import {computed, onMounted, onUnmounted, ref, watch} from 'vue';
import {useStore} from "vuex";
import {useI18n} from "vue-i18n";
import {COUNTDOWN, ROUND_ANIMATION_MS, MAX_HP} from "@/core/constants.js";
import HPBar from "@/components/fragments/fight/HPBar.vue";
import RoundDisplay from "@/components/fragments/fight/RoundDisplay.vue";
import UserAvatar from "@/components/fragments/profile/UserAvatar.vue";
import UserName from "@/components/fragments/profile/UserName.vue";

const store = useStore();
const {t} = useI18n({useScope: 'global'});

const showCountdown = ref(true);
const countdownValue = ref(COUNTDOWN);
let animationTimer = null;
let countdownTimer = null;

const fightPhase = computed(() => store.getters['fight/getFightPhase']);
const combatResult = computed(() => store.getters['fight/getCombatResult']);
const currentRound = computed(() => store.getters['fight/getCurrentRoundData']);
const animationRound = computed(() => store.getters['fight/getAnimationRound']);
const totalRounds = computed(() => store.getters['fight/getTotalRounds']);
const opponent = computed(() => store.getters['fight/getOpponent']);
const master = computed(() => store.getters['master/getMaster']);

const playerHP = computed(() => {
  if (animationRound.value < 0 || !combatResult.value) return MAX_HP;
  const round = combatResult.value.rounds[animationRound.value];
  return round ? round.hp1After : MAX_HP;
});

const opponentHP = computed(() => {
  if (animationRound.value < 0 || !combatResult.value) return MAX_HP;
  const round = combatResult.value.rounds[animationRound.value];
  return round ? round.hp2After : MAX_HP;
});

const playedRounds = computed(() => {
  if (!combatResult.value || animationRound.value < 0) return [];
  return combatResult.value.rounds.slice(0, animationRound.value + 1);
});

const playerStats = computed(() => {
  if (!combatResult.value) return null;
  return combatResult.value.getStats(0);
});

const statusLeft = computed(() => {
  if (fightPhase.value !== 'results' || !combatResult.value) return '';
  if (combatResult.value.isDraw) return t('fight.lblDraw');
  return combatResult.value.winnerId === 'fighter1' ? t('fight.lblVictory') : t('fight.lblDefeat');
});

const statusRight = computed(() => {
  if (fightPhase.value !== 'results' || !combatResult.value) return '';
  if (combatResult.value.isDraw) return t('fight.lblDraw');
  return combatResult.value.winnerId === 'fighter1' ? t('fight.lblDefeat') : t('fight.lblVictory');
});

const resultText = computed(() => {
  if (!combatResult.value) return '';
  if (combatResult.value.isDraw) return t('fight.lblDraw');
  return combatResult.value.winnerId === 'fighter1' ? t('fight.lblVictory') : t('fight.lblDefeat');
});

const resultClass = computed(() => {
  if (!combatResult.value) return '';
  if (combatResult.value.isDraw) return 'result-draw';
  return combatResult.value.winnerId === 'fighter1' ? 'result-win' : 'result-lose';
});

const fightAgain = async () => {
  await store.dispatch('fight/fightAgain');
  resetAnimation();
};

const changeDeck = async () => {
  await store.dispatch('fight/resetToPreparation');
};

const startCountdown = () => {
  showCountdown.value = true;
  countdownValue.value = COUNTDOWN;

  countdownTimer = setInterval(() => {
    if (countdownValue.value > 1) {
      countdownValue.value -= 1;
    } else {
      countdownValue.value = 'Fight!';
      clearInterval(countdownTimer);
      setTimeout(() => {
        countdownValue.value = 0;
        showCountdown.value = false;
        startRoundAnimation();
      }, 600);
    }
  }, 800);
};

const startRoundAnimation = () => {
  store.dispatch('fight/nextAnimationRound');
  animationTimer = setInterval(() => {
    if (fightPhase.value === 'fighting') {
      store.dispatch('fight/nextAnimationRound');
    } else {
      clearInterval(animationTimer);
    }
  }, ROUND_ANIMATION_MS);
};

const resetAnimation = () => {
  clearInterval(animationTimer);
  clearInterval(countdownTimer);
  startCountdown();
};

onMounted(() => {
  if (fightPhase.value === 'fighting') {
    startCountdown();
  }
});

onUnmounted(() => {
  clearInterval(animationTimer);
  clearInterval(countdownTimer);
});

// If fight phase switches to fighting (e.g., fight again)
watch(fightPhase, (newVal) => {
  if (newVal === 'fighting' && animationRound.value === -1) {
    startCountdown();
  }
});

const emit = defineEmits(['scroll']);
const handleScroll = (event) => {
  emit('scroll', event.target.scrollTop);
};
</script>

<style scoped>
.background-fight {
  background: url('@/assets/images/background_page.webp') no-repeat center center;
  background-size: cover;
}

.background-fight::before {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(to right top, black 25%, transparent 125%);
  z-index: 1;
}

.background-fight::after {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: black;
  z-index: 2;
  opacity: 1;
  animation: fadeOut 1s forwards;
}

@keyframes fadeOut {
  to { opacity: 0; }
}

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

@supports (height: 100dvh) {
  .fight-container {
    height: 100dvh;
  }
}

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

/* Countdown */
.countdown {
  position: fixed;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 3em;
  color: white;
  z-index: 100;
  padding: 10px 20px;
  border-radius: 4px;
}

.fade-scale-enter-active, .fade-scale-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.fade-scale-leave-to {
  opacity: 0;
  transform: scale(3.5);
}

.fade-scale-enter-to {
  opacity: 1;
  transform: scale(1);
}

.countdown-item {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Fighters section */
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

.fighter-right {
  /* Mirrored display */
}

.fighter-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  margin-bottom: 4px;
}

.fighter-info :deep(.user-name) {
  font-size: 0.5em;
}

.fighter-skin {
  width: 120px;
  height: 200px;
  padding: 5px;
}

.flipped {
  transform: scaleX(-1);
}

.vs-center {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: var(--gray2);
  font-weight: bold;
  padding-top: 100px;
}

.status-fighter {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
  font-family: Anonymous, sans-serif;
  font-size: 2em;
  background-color: var(--black-opacity-80);
  padding: 2px 16px;
  border-radius: 4px;
  animation: statusPopIn 0.5s ease-in-out forwards;
}

@keyframes statusPopIn {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(3); }
  100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}

/* Round log */
.round-log {
  width: 100%;
  margin-top: 16px;
  max-height: 200px;
  overflow-y: auto;
}

.log-entry {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background-color: var(--black-opacity-80);
  border-radius: 4px;
  margin-bottom: 4px;
  font-size: 0.65rem;
}

.log-round {
  color: var(--gray2);
  min-width: 24px;
}

.log-card {
  flex: 1;
  text-align: center;
}

.log-card.left { text-align: right; }
.log-card.right { text-align: left; }

.log-attack { color: #e74c3c; }
.log-defense { color: #3498db; }
.log-special { color: #f39c12; }

.log-vs {
  color: var(--gray2);
  font-size: 0.55rem;
}

.log-hp {
  color: var(--gray3);
  min-width: 50px;
  text-align: right;
  font-size: 0.55rem;
}

/* Results */
.results-overlay {
  width: 100%;
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: statusPopIn 0.5s ease-in-out forwards;
}

.result-label {
  font-size: 2.5em;
  font-family: Anonymous, sans-serif;
  margin-bottom: 16px;
}

.result-win { color: #2ecc71; }
.result-lose { color: #e74c3c; }
.result-draw { color: #f1c40f; }

.fight-report {
  width: 100%;
  max-width: 300px;
  background-color: var(--black-opacity-80);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
}

.report-title {
  font-size: 0.8rem;
  color: var(--gray2);
  text-align: center;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.report-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: var(--gray3);
  padding: 3px 0;
}

.result-buttons {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}

.result-btn {
  background-color: var(--primary-color) !important;
  color: white !important;
  font-size: 0.8rem !important;
}

.result-btn-secondary {
  background-color: var(--black-opacity-80) !important;
  border: 1px solid var(--gray2);
}
</style>
