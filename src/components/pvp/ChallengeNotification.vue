<template>
  <Transition name="slide-down">
    <div v-if="challenge" class="challenge-notification">
      <div class="challenge-content">
        <div class="challenge-icon">
          <svg viewBox="0 0 32 32" width="28" height="28" fill="none" stroke="#FF066F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="6" y1="26" x2="21" y2="6"/>
            <line x1="19" y1="6" x2="23" y2="6"/>
            <line x1="21" y1="4" x2="21" y2="8"/>
            <line x1="26" y1="26" x2="11" y2="6"/>
            <line x1="9" y1="6" x2="13" y2="6"/>
            <line x1="11" y1="4" x2="11" y2="8"/>
          </svg>
        </div>
        <div class="challenge-info">
          <span class="challenge-title">{{ t.friends.challenge.title }}</span>
          <span class="challenge-player">{{ challenge.from.username }} ({{ challenge.from.rating }})</span>
        </div>
        <div class="challenge-timer">{{ timer }}s</div>
      </div>
      <div class="challenge-buttons">
        <button class="btn-accept-challenge" @click="acceptChallenge">
          {{ t.friends.challenge.accept }}
        </button>
        <button class="btn-decline-challenge" @click="declineChallenge">
          {{ t.friends.challenge.decline }}
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import store from '@/core/state/store.js';
import { t } from '@/locales/index.js';

const router = useRouter();

const CHALLENGE_DURATION = 10;
const challenge = ref(null);
const timer = ref(CHALLENGE_DURATION);
let timerInterval = null;

function onChallengeReceived(event) {
  const data = event.detail;
  challenge.value = data;
  timer.value = CHALLENGE_DURATION;
  startTimer();
}

function onChallengeStart(event) {
  const data = event.detail;
  clearTimer();
  challenge.value = null;

  store.commit('pvp/SET_PVP_MATCH', {
    matchId: data.matchId,
    opponent: data.opponent,
    isPlayer1: false,
  });

  router.push({
    path: '/fight',
    query: { mode: 'pvp', matchId: data.matchId },
  });
}

function onChallengeSent() {
  const msg = t.value.friends.challenge.sending;
  store.commit('master/setInfoMessage', { text: msg, timeout: 3000, showButton: false });
}

function onChallengeDeclinedResponse() {
  const msg = t.value.friends.challenge.declined;
  store.commit('master/setInfoMessage', { text: msg, timeout: 3000, showButton: false });
}

function onChallengeError(event) {
  const data = event.detail;
  let msg = data.message || 'Error';
  if (data.message === 'friend_offline') {
    msg = t.value.friends.challenge.friendOffline;
  } else if (data.message === 'challenger_offline') {
    msg = t.value.friends.challenge.challengerOffline;
  }
  store.commit('master/setErrorMessage', { text: msg, timeout: 3000, showButton: false });
}

onMounted(() => {
  window.addEventListener('challenge-received', onChallengeReceived);
  window.addEventListener('challenge-start', onChallengeStart);
  window.addEventListener('challenge-sent', onChallengeSent);
  window.addEventListener('challenge-declined-response', onChallengeDeclinedResponse);
  window.addEventListener('challenge-error', onChallengeError);
});

onUnmounted(() => {
  window.removeEventListener('challenge-received', onChallengeReceived);
  window.removeEventListener('challenge-start', onChallengeStart);
  window.removeEventListener('challenge-sent', onChallengeSent);
  window.removeEventListener('challenge-declined-response', onChallengeDeclinedResponse);
  window.removeEventListener('challenge-error', onChallengeError);
  clearTimer();
});

function startTimer() {
  clearTimer();
  timerInterval = setInterval(() => {
    timer.value--;
    if (timer.value <= 0) {
      declineChallenge();
    }
  }, 1000);
}

function clearTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function acceptChallenge() {
  store.dispatch('webSocket/sendMessage', {
    type: 'challenge_accepted',
    challengerOdId: challenge.value.from.odId,
    challengerUsername: challenge.value.from.username,
    challengerRating: challenge.value.from.rating,
  });
  clearTimer();
  // Don't hide — wait for challenge_start from server
}

function declineChallenge() {
  if (challenge.value) {
    store.dispatch('webSocket/sendMessage', {
      type: 'challenge_declined',
      challengerOdId: challenge.value.from.odId,
    });
  }
  clearTimer();
  challenge.value = null;
}
</script>

<style scoped>
.challenge-notification {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  background: linear-gradient(180deg, rgba(9,9,9,0.98) 0%, rgba(9,9,9,0.95) 100%);
  border-bottom: 1px solid var(--pink);
  padding: 12px 16px;
  box-shadow: 0 4px 20px rgba(255, 6, 111, 0.3);
}

.challenge-content {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.challenge-icon {
  display: flex;
  align-items: center;
}

.challenge-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.challenge-title {
  color: var(--pink);
  font-family: 'Anonymous', 'Courier New', Consolas, monospace;
  font-size: 12px;
  text-transform: uppercase;
}

.challenge-player {
  color: var(--white);
  font-family: 'Anonymous', 'Courier New', Consolas, monospace;
  font-size: 16px;
  margin-top: 2px;
}

.challenge-timer {
  font-family: 'AnonymousBalance', 'Courier New', Consolas, monospace;
  font-size: 24px;
  color: var(--pink);
}

.challenge-buttons {
  display: flex;
  gap: 10px;
}

.btn-accept-challenge {
  flex: 1;
  background: var(--pink);
  border: none;
  color: var(--white);
  padding: 10px;
  border-radius: 6px;
  font-family: 'Anonymous', 'Courier New', Consolas, monospace;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-accept-challenge:hover {
  background: #FF3D8E;
  box-shadow: 0 0 15px rgba(255, 6, 111, 0.5);
}

.btn-decline-challenge {
  flex: 1;
  background: transparent;
  border: 1px solid var(--gray2);
  color: var(--gray2);
  padding: 10px;
  border-radius: 6px;
  font-family: 'Anonymous', 'Courier New', Consolas, monospace;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-decline-challenge:hover {
  border-color: #FF3333;
  color: #FF3333;
}

/* Animation */
.slide-down-enter-active {
  transition: transform 0.3s ease-out, opacity 0.3s;
}
.slide-down-leave-active {
  transition: transform 0.2s ease-in, opacity 0.2s;
}
.slide-down-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}
.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
