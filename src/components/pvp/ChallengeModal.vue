<template>
  <Teleport to="body">
    <div v-if="visible" class="challenge-overlay" @click.self="handleDecline">
      <div class="challenge-modal">
        <div class="challenge-header">
          <span class="challenge-icon">&#x2694;&#xFE0F;</span>
          <h2 class="challenge-title">{{ challengeTitle }}</h2>
        </div>

        <div class="challenger-info">
          <div class="challenger-avatar">&#x1F464;</div>
          <div class="challenger-name">{{ challenger.username }}</div>
          <div class="challenger-rating">{{ ratingText }}: {{ challenger.rating }}</div>
        </div>

        <div class="challenge-text">{{ wantsToFightText }}</div>

        <div class="challenge-actions">
          <button class="accept-btn" @click="handleAccept">{{ acceptText }}</button>
          <button class="decline-btn" @click="handleDecline">{{ declineText }}</button>
        </div>

        <div class="challenge-timer">{{ expiresInText }}: {{ timeLeft }}s</div>

        <div class="timer-bar">
          <div class="timer-fill" :style="{ width: timerPercent + '%' }"></div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue';

const props = defineProps({
  visible: { type: Boolean, default: false },
  challenger: { type: Object, default: () => ({}) },
  challengeTitle: { type: String, default: 'FIGHT CHALLENGE!' },
  wantsToFightText: { type: String, default: 'wants to fight you!' },
  acceptText: { type: String, default: 'ACCEPT' },
  declineText: { type: String, default: 'DECLINE' },
  expiresInText: { type: String, default: 'Expires in' },
  ratingText: { type: String, default: 'Rating' },
});

const emit = defineEmits(['accept', 'decline']);

const CHALLENGE_DURATION = 10;
const timeLeft = ref(CHALLENGE_DURATION);
let timerInterval = null;

const timerPercent = computed(() => (timeLeft.value / CHALLENGE_DURATION) * 100);

watch(() => props.visible, (val) => {
  if (val) startTimer();
  else stopTimer();
});

function startTimer() {
  timeLeft.value = CHALLENGE_DURATION;
  timerInterval = setInterval(() => {
    timeLeft.value--;
    if (timeLeft.value <= 0) handleDecline();
  }, 1000);
}

function stopTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}

function handleAccept() {
  stopTimer();
  emit('accept', props.challenger);
}

function handleDecline() {
  stopTimer();
  emit('decline', props.challenger);
}

onUnmounted(() => stopTimer());
</script>

<style scoped>
.challenge-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.challenge-modal {
  background: rgba(15, 15, 25, 0.95);
  border: 2px solid #FF066F;
  border-radius: 20px;
  padding: 32px 40px;
  min-width: 340px;
  text-align: center;
  box-shadow:
    0 0 40px rgba(255, 6, 111, 0.5),
    0 0 80px rgba(255, 6, 111, 0.3);
  animation: scaleIn 0.3s ease;
}

@keyframes scaleIn {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.challenge-header {
  margin-bottom: 24px;
}

.challenge-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.challenge-title {
  font-family: Anonymous, sans-serif;
  font-size: 28px;
  color: #FF066F;
  text-transform: uppercase;
  letter-spacing: 3px;
  margin: 0;
  text-shadow: 0 0 20px rgba(255, 6, 111, 0.6);
}

.challenger-info {
  margin-bottom: 20px;
}

.challenger-avatar {
  font-size: 56px;
  margin-bottom: 8px;
}

.challenger-name {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 4px;
}

.challenger-rating {
  font-size: 14px;
  color: #888;
}

.challenge-text {
  font-size: 16px;
  color: #aaa;
  margin-bottom: 28px;
}

.challenge-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 24px;
}

.accept-btn {
  flex: 1;
  padding: 16px 24px;
  background: #FF066F;
  border: none;
  border-radius: 12px;
  color: #fff;
  font-family: Anonymous, sans-serif;
  font-size: 18px;
  text-transform: uppercase;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 0 20px rgba(255, 6, 111, 0.4);
}

.accept-btn:hover {
  background: #FF3D8E;
  box-shadow: 0 0 30px rgba(255, 6, 111, 0.7);
  transform: translateY(-2px);
}

.decline-btn {
  flex: 1;
  padding: 16px 24px;
  background: transparent;
  border: 2px solid #666;
  border-radius: 12px;
  color: #888;
  font-family: Anonymous, sans-serif;
  font-size: 18px;
  text-transform: uppercase;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.decline-btn:hover {
  border-color: #FF3333;
  color: #FF3333;
}

.challenge-timer {
  font-size: 14px;
  color: #FFB800;
  margin-bottom: 12px;
}

.timer-bar {
  width: 100%;
  height: 4px;
  background: #333;
  border-radius: 2px;
  overflow: hidden;
}

.timer-fill {
  height: 100%;
  background: linear-gradient(90deg, #FF066F, #FFB800);
  transition: width 1s linear;
}
</style>
