<template>
  <div class="background background-arena">
    <div class="arena-container" @scroll="handleScroll">
      <div class="arena-content-wrapper">

        <div class="player-header">
          <UserAvatar :avatarUrl="master?.userData?.avatarUrl" width="50px" height="50px"/>
          <UserName :userName="master?.userData?.name || ''" style="width: auto !important;"/>
        </div>

        <ModuleBuilder/>

        <div class="fight-button-wrapper">
          <VBtn
              v-if="!isAutoFightEnabled"
              width="200"
              size="large"
              class="fight-btn"
              :disabled="!isBuildValid"
              @click="startFight"
          >
            {{ t.arena.lblStartFight }}
          </VBtn>
          <div v-else class="fight-btn-blocked">
            <span class="blocked-icon">&#x1F504;</span>
            {{ t.autoFight.lblAutoFightInProgress }}
          </div>
        </div>

        <!-- PvP Mode Cards -->
        <div class="pvp-modes">
          <!-- VS PLAYER Card -->
          <div class="pvp-mode-card" @click="goToMatchmaking">
            <div class="mode-icon">&#x2694;&#xFE0F;</div>
            <div class="mode-title">{{ t.pvp.vsPlayer }}</div>
            <div class="mode-description">{{ t.pvp.findOpponent }}</div>
            <div class="mode-stats">
              <div class="stat-row">
                <span class="stat-dot online"></span>
                <span>{{ t.pvp.online }}: {{ onlinePlayersCount }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-icon">&#x1F3C6;</span>
                <span>{{ t.pvp.yourRating }}: {{ playerRating }} ({{ leagueName }})</span>
              </div>
            </div>
          </div>

          <!-- FRIENDS Card -->
          <div class="pvp-mode-card" @click="goToFriends">
            <div class="mode-icon">&#x1F465;</div>
            <div class="mode-title">{{ t.friends.title }}</div>
            <div class="mode-description">{{ t.pvp.fightFriends }}</div>
            <div class="mode-stats">
              <div class="stat-row">
                <span class="stat-dot online"></span>
                <span>{{ t.pvp.online }}: {{ onlineFriendsCount }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="auto-fight-section">
          <AutoFightToggle/>
        </div>

        <div class="autofight-status-section">
          <AutoFightStatus/>
        </div>

        <div class="scroll-gap"/>

      </div>
    </div>
  </div>
</template>

<script setup>
import {computed, onMounted} from 'vue';
import store from "@/core/state/store.js";
import router from "@/router/index.js";
import {t} from "@/locales/index.js";
import UserAvatar from "@/components/fragments/profile/UserAvatar.vue";
import UserName from "@/components/fragments/profile/UserName.vue";
import ModuleBuilder from "@/components/fragments/modules/ModuleBuilder.vue";
import AutoFightToggle from "@/components/fragments/fight/AutoFightToggle.vue";
import AutoFightStatus from "@/components/fragments/fight/AutoFightStatus.vue";

const master = computed(() => store.getters['master/getMaster']);
const isBuildValid = computed(() => store.getters['fight/isBuildValid']);
const isAutoFightEnabled = computed(() => store.getters['autoFight/isEnabled']);

// PvP data
const playerRating = computed(() => store.getters['pvp/getPvpStats'].rating);
const leagueName = computed(() => store.getters['pvp/league'].name);
const onlineFriendsCount = computed(() => store.getters['friends/onlineFriendsCount']);
const onlinePlayersCount = computed(() => Math.floor(Math.random() * 50) + 20);

const startFight = async () => {
  await store.dispatch('fight/startFight');
};

const goToFriends = async () => {
  await router.push('/friends');
};

const goToMatchmaking = async () => {
  await router.push('/matchmaking');
};

onMounted(() => {
  store.dispatch('fight/loadModules');
});

const emit = defineEmits(['scroll']);
const handleScroll = (event) => {
  emit('scroll', event.target.scrollTop);
};
</script>

<style scoped>
.background-arena {
  background: url('@/assets/images/background_arena.webp') no-repeat center center;
}

.background-arena::before {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(to right bottom, black 25%, transparent 75%);
  z-index: 1;
}

.background-arena::after {
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

.arena-container {
  position: relative;
  z-index: 10;
  overflow-y: auto;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
  -webkit-overflow-scrolling: auto;
  overscroll-behavior-y: none;
}

@supports (height: 100dvh) {
  .arena-container {
    height: 100dvh;
  }
}

.arena-content-wrapper {
  width: 100%;
  box-sizing: border-box;
  max-width: 500px;
  margin: 0 auto;
  padding: 20px 16px;
}

.player-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 16px;
  gap: 4px;
}

.fight-button-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.fight-btn {
  cursor: pointer;
  background-color: var(--primary-color);
  color: white !important;
  font-size: 1rem;
}

.fight-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.fight-btn-blocked {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 8px;
  border: 1px solid rgba(255, 6, 111, 0.4);
  background: rgba(255, 6, 111, 0.1);
  color: var(--primary-color);
  font-family: Anonymous, sans-serif;
  font-size: 0.85rem;
  font-weight: bold;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.blocked-icon {
  animation: spin 3s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ── PvP Mode Cards ─────────────────────────────────────────── */
.pvp-modes {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-top: 24px;
  padding: 0 4px;
}

.pvp-mode-card {
  flex: 1;
  max-width: 280px;
  background: rgba(20, 20, 30, 0.85);
  border: 1px solid rgba(255, 6, 111, 0.3);
  border-radius: 16px;
  padding: 20px 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.pvp-mode-card:active {
  border-color: #FF066F;
  background: rgba(255, 6, 111, 0.1);
  box-shadow: 0 0 30px rgba(255, 6, 111, 0.3);
  transform: translateY(-2px);
}

.mode-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.mode-title {
  font-family: Anonymous, sans-serif;
  font-size: 18px;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 6px;
  font-weight: bold;
}

.mode-description {
  font-size: 12px;
  color: var(--gray2);
  margin-bottom: 16px;
  line-height: 1.3;
}

.mode-stats {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--gray3);
}

.stat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.stat-dot.online {
  background: #00FF88;
  box-shadow: 0 0 8px rgba(0, 255, 136, 0.6);
}

.stat-icon {
  font-size: 14px;
}

/* ── Auto Fight Section ────────────────────────────────────── */
.auto-fight-section {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.autofight-status-section {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.scroll-gap {
  display: block;
  position: relative;
  height: 150px;
}
</style>
