<template>
  <Transition name="slide-down">
    <div v-if="invite" class="club-invite-notification">
      <div class="invite-content">
        <div class="invite-icon">
          <svg viewBox="0 0 32 32" width="28" height="28" fill="none" stroke="var(--hex-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="4" y="8" width="24" height="18" rx="2"/>
            <path d="M4 10l12 8 12-8"/>
          </svg>
        </div>
        <div class="invite-info">
          <span class="invite-title">{{ t.club.lblInviteReceived }}</span>
          <span class="invite-detail">{{ invite.inviterName }} → {{ invite.clubName }}</span>
        </div>
        <div class="invite-timer">{{ timer }}s</div>
      </div>
      <div class="invite-buttons">
        <button class="btn-accept-invite" @click="acceptInvite">
          {{ t.friends.challenge.accept }}
        </button>
        <button class="btn-decline-invite" @click="declineInvite">
          {{ t.friends.challenge.decline }}
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import store from '@/core/state/store.js';
import { t } from '@/locales/index.js';

const INVITE_DURATION = 30;
const invite = ref(null);
const timer = ref(INVITE_DURATION);
let timerInterval = null;

function onInviteReceived(event) {
  const data = event.detail;
  invite.value = data;
  timer.value = INVITE_DURATION;
  startTimer();
}

function onInviteAccepted(event) {
  const data = event.detail;
  clearTimer();
  invite.value = null;

  // If this is the acceptor (has clubName), update master state
  if (data.clubName) {
    store.dispatch('master/updateMaster', { clubId: data.clubId, clubRole: 'member' });
    store.commit('master/setInfoMessage', {
      text: t.value.club.lblInviteAccepted,
      timeout: 3000,
      showButton: false,
    });
  } else if (data.acceptedByName) {
    // This is the inviter getting notified
    store.commit('master/setInfoMessage', {
      text: `${data.acceptedByName} ${t.value.club.lblPlayerJoined}`,
      timeout: 3000,
      showButton: false,
    });
  }
}

function onInviteDeclined(event) {
  const data = event.detail;
  store.commit('master/setInfoMessage', {
    text: `${data.declinedByName} ${t.value.club.lblInviteDeclined}`,
    timeout: 3000,
    showButton: false,
  });
}

function onInviteError(event) {
  const data = event.detail;
  store.commit('master/setErrorMessage', {
    text: data.message || 'Invite error',
    timeout: 3000,
    showButton: false,
  });
  clearTimer();
  invite.value = null;
}

onMounted(() => {
  window.addEventListener('club-invite-received', onInviteReceived);
  window.addEventListener('club-invite-accepted', onInviteAccepted);
  window.addEventListener('club-invite-declined', onInviteDeclined);
  window.addEventListener('club-invite-error', onInviteError);
});

onUnmounted(() => {
  window.removeEventListener('club-invite-received', onInviteReceived);
  window.removeEventListener('club-invite-accepted', onInviteAccepted);
  window.removeEventListener('club-invite-declined', onInviteDeclined);
  window.removeEventListener('club-invite-error', onInviteError);
  clearTimer();
});

function startTimer() {
  clearTimer();
  timerInterval = setInterval(() => {
    timer.value--;
    if (timer.value <= 0) {
      declineInvite();
    }
  }, 1000);
}

function clearTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function acceptInvite() {
  store.dispatch('webSocket/sendMessage', {
    type: 'club_invite_accept',
    clubId: invite.value.clubId,
    inviterId: invite.value.inviterId,
  });
  clearTimer();
  // Don't hide — wait for club_invite_accepted from server
}

function declineInvite() {
  if (invite.value) {
    store.dispatch('webSocket/sendMessage', {
      type: 'club_invite_decline',
      inviterId: invite.value.inviterId,
    });
  }
  clearTimer();
  invite.value = null;
}
</script>

<style scoped>
.club-invite-notification {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9998;
  background: linear-gradient(180deg, color-mix(in srgb, var(--hex-bg-dark) 98%, transparent) 0%, color-mix(in srgb, var(--hex-bg-dark) 95%, transparent) 100%);
  border-bottom: 1px solid var(--hex-victory);
  padding: 12px 16px;
  box-shadow: 0 4px 20px color-mix(in srgb, var(--hex-victory) 30%, transparent);
}

.invite-content {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.invite-icon {
  display: flex;
  align-items: center;
}

.invite-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.invite-title {
  color: var(--hex-victory);
  font-family: 'Anonymous', 'Courier New', Consolas, monospace;
  font-size: 12px;
  text-transform: uppercase;
}

.invite-detail {
  color: var(--hex-text-primary);
  font-family: 'Anonymous', 'Courier New', Consolas, monospace;
  font-size: 14px;
  margin-top: 2px;
}

.invite-timer {
  font-family: 'AnonymousBalance', 'Courier New', Consolas, monospace;
  font-size: 24px;
  color: var(--hex-victory);
}

.invite-buttons {
  display: flex;
  gap: 10px;
}

.btn-accept-invite {
  flex: 1;
  background: var(--hex-victory);
  border: none;
  color: var(--hex-bg-dark);
  padding: 10px;
  border-radius: 6px;
  font-family: 'Anonymous', 'Courier New', Consolas, monospace;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-accept-invite:hover {
  background: color-mix(in srgb, var(--hex-victory) 85%, white);
  box-shadow: 0 0 15px color-mix(in srgb, var(--hex-victory) 40%, transparent);
}

.btn-decline-invite {
  flex: 1;
  background: transparent;
  border: 1px solid var(--hex-text-secondary);
  color: var(--hex-text-secondary);
  padding: 10px;
  border-radius: 6px;
  font-family: 'Anonymous', 'Courier New', Consolas, monospace;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-decline-invite:hover {
  border-color: var(--hex-danger);
  color: var(--hex-danger);
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
