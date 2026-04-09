<template>
  <Transition name="slide-down">
    <div v-if="invite" class="clan-invite-notification">
      <div class="invite-content">
        <div class="invite-icon">
          <svg viewBox="0 0 32 32" width="28" height="28" fill="none" stroke="var(--hex-victory)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="4" y="8" width="24" height="18" rx="2"/>
            <path d="M4 10l12 8 12-8"/>
          </svg>
        </div>
        <div class="invite-info">
          <span class="invite-title">{{ t.clan.lblInviteReceived }}</span>
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
import * as clanService from '@/core/services/clanService.js';

const INVITE_DURATION = 30;
const invite = ref(null);
const timer = ref(INVITE_DURATION);
let timerInterval = null;
// Queue of pending invites from DB (shown one by one)
const pendingQueue = ref([]);

function onInviteReceived(event) {
  const data = event.detail;
  // WS invite now includes inviteId from DB
  // TODO #P1-rename-3-cleanup: remove clubId fallback after backend WS response rename
  invite.value = {
    inviteId: data.inviteId || null,
    clanId: data.clanId || data.clubId,
    clubName: data.clubName,
    inviterId: data.inviterId,
    inviterName: data.inviterName,
  };
  timer.value = INVITE_DURATION;
  startTimer();
}

function onInviteAccepted(event) {
  const data = event.detail;
  clearTimer();
  invite.value = null;

  // If this is the acceptor (has clubName), update master state
  // TODO #P1-rename-3-cleanup: remove clubId fallback after backend WS response rename
  if (data.clubName) {
    store.commit('master/updateMaster', { clanId: data.clanId || data.clubId, clanRole: 'member' });
    store.commit('master/setInfoMessage', {
      text: t.value.clan.lblInviteAccepted,
      timeout: 3000,
      showButton: false,
    });
  } else if (data.acceptedByName) {
    // This is the inviter getting notified
    store.commit('master/setInfoMessage', {
      text: `${data.acceptedByName} ${t.value.clan.lblPlayerJoined}`,
      timeout: 3000,
      showButton: false,
    });
  }
}

function onInviteDeclined(event) {
  const data = event.detail;
  store.commit('master/setInfoMessage', {
    text: `${data.declinedByName} ${t.value.clan.lblInviteDeclined}`,
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
  window.addEventListener('clan-invite-received', onInviteReceived);
  window.addEventListener('clan-invite-accepted', onInviteAccepted);
  window.addEventListener('clan-invite-declined', onInviteDeclined);
  window.addEventListener('clan-invite-error', onInviteError);
  // Check for pending DB invites on login
  loadPendingInvites();
});

onUnmounted(() => {
  window.removeEventListener('clan-invite-received', onInviteReceived);
  window.removeEventListener('clan-invite-accepted', onInviteAccepted);
  window.removeEventListener('clan-invite-declined', onInviteDeclined);
  window.removeEventListener('clan-invite-error', onInviteError);
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

async function acceptInvite() {
  clearTimer();
  const current = invite.value;
  if (!current) return;

  if (current.inviteId) {
    // DB-backed invite — use REST API
    try {
      const result = await clanService.respondToInvite(current.inviteId, 'accept');
      store.commit('master/updateMaster', { clanId: current.clanId, clanRole: 'member' });
      store.commit('master/setInfoMessage', {
        text: t.value.clan.lblInviteAccepted,
        timeout: 3000,
        showButton: false,
      });
      invite.value = null;
      showNextPending();
    } catch (e) {
      store.commit('master/setErrorMessage', {
        text: e.message || 'Failed to accept invite',
        timeout: 3000,
        showButton: false,
      });
      invite.value = null;
      showNextPending();
    }
  } else {
    // Legacy WS-only invite
    store.dispatch('webSocket/sendMessage', {
      type: 'club_invite_accept',
      clanId: current.clanId,
      inviterId: current.inviterId,
    });
    // Don't hide — wait for club_invite_accepted from server
  }
}

async function declineInvite() {
  const current = invite.value;
  clearTimer();

  if (current?.inviteId) {
    // DB-backed invite — use REST API
    clanService.respondToInvite(current.inviteId, 'decline').catch(() => {});
  } else if (current) {
    // Legacy WS-only invite
    store.dispatch('webSocket/sendMessage', {
      type: 'club_invite_decline',
      inviterId: current.inviterId,
    });
  }

  invite.value = null;
  showNextPending();
}

function showNextPending() {
  if (pendingQueue.value.length > 0) {
    const next = pendingQueue.value.shift();
    invite.value = next;
    timer.value = INVITE_DURATION;
    startTimer();
  }
}

async function loadPendingInvites() {
  // Only check if user is authenticated and not already in a clan
  const master = store.getters['master/getMaster'];
  if (!master?.userData || master.userData.clanId) return;

  const invites = await clanService.getPendingInvites();
  if (invites.length > 0 && !invite.value) {
    // Show first invite immediately, queue the rest
    const [first, ...rest] = invites;
    // TODO #P1-rename-3-cleanup: remove clubId fallback after backend WS response rename
    invite.value = {
      inviteId: first.id,
      clanId: first.clanId || first.clubId,
      clubName: first.clubName,
      inviterId: first.inviterId,
      inviterName: first.inviterName,
    };
    pendingQueue.value = rest.map(inv => ({
      inviteId: inv.id,
      clanId: inv.clanId || inv.clubId,
      clubName: inv.clubName,
      inviterId: inv.inviterId,
      inviterName: inv.inviterName,
    }));
    timer.value = INVITE_DURATION;
    startTimer();
  }
}
</script>

<style scoped>
.clan-invite-notification {
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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-weight: bold;
  font-size: 12px;
  text-transform: uppercase;
}

.invite-detail {
  color: var(--hex-text-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-weight: bold;
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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
