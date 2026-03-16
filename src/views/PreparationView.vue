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
              width="200"
              size="large"
              class="fight-btn"
              :class="{ 'fight-btn-auto-active': selectedMode === 'auto' && isAutoFightEnabled }"
              :disabled="!isBuildValid && selectedMode !== 'auto'"
              @click="startFight"
          >
            {{ startButtonText }}
          </VBtn>
        </div>

        <!-- Mode Selector -->
        <ModeSelector
          :onlineCount="onlinePlayersCount"
          @select="onModeSelect"
        />

        <!-- Auto Fight Status (shown when auto mode selected or auto fight active) -->
        <div v-if="selectedMode === 'auto' || isAutoFightEnabled" class="autofight-status-section">
          <AutoFightStatus v-if="isAutoFightEnabled"/>
          <div v-else class="autofight-inactive-hint">
            <svg class="hint-icon" viewBox="0 0 24 24" width="18" height="18">
              <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" fill="currentColor"/>
            </svg>
            <span>{{ t.arena.autoFightInactive }}</span>
          </div>
        </div>

        <!-- Friends Button -->
        <div class="friends-section">
          <button class="friends-btn" @click="goToFriends">
            <svg class="friends-svg" viewBox="0 0 24 24" width="20" height="20">
              <circle cx="9" cy="8" r="3.5" fill="none" stroke="currentColor" stroke-width="1.8"/>
              <path d="M2 20c0-3.5 3.5-5.5 7-5.5s7 2 7 5.5" fill="none" stroke="currentColor" stroke-width="1.8"/>
              <circle cx="17" cy="8" r="3" fill="none" stroke="currentColor" stroke-width="1.8"/>
              <path d="M17 14.5c2.5 0 5 1.5 5 5.5" fill="none" stroke="currentColor" stroke-width="1.8"/>
            </svg>
            <span class="friends-label">{{ t.friends.title }}</span>
            <span class="friends-divider">&#x2022;</span>
            <span class="friends-online-inline">
              <span class="online-dot-small"></span>
              {{ t.friends.online }}: {{ onlineFriendsCount }}
            </span>
          </button>
        </div>

        <div class="scroll-gap"/>

      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, computed, onMounted, onBeforeUnmount} from 'vue';
import store from "@/core/state/store.js";
import router from "@/router/index.js";
import {t} from "@/locales/index.js";
import UserAvatar from "@/components/fragments/profile/UserAvatar.vue";
import UserName from "@/components/fragments/profile/UserName.vue";
import ModuleBuilder from "@/components/fragments/modules/ModuleBuilder.vue";
import AutoFightStatus from "@/components/fragments/fight/AutoFightStatus.vue";
import ModeSelector from "@/components/arena/ModeSelector.vue";
import {getOnlinePlayersCount} from "@/core/services/statsService.js";

const master = computed(() => store.getters['master/getMaster']);
const isBuildValid = computed(() => store.getters['fight/isBuildValid']);
const isAutoFightEnabled = computed(() => store.getters['autoFight/isEnabled']);

// PvP data
const onlineFriendsCount = computed(() => store.getters['friends/onlineFriendsCount']);
const onlinePlayersCount = ref(0);
let onlineRefreshInterval = null;

const selectedMode = ref('pve');

// Button text depends on selected mode
const startButtonText = computed(() => {
  if (selectedMode.value === 'auto') {
    return isAutoFightEnabled.value ? t.value.arena.stopAuto : t.value.arena.startAuto;
  }
  return t.value.arena.lblStartFight;
});

const onModeSelect = (mode) => {
  selectedMode.value = mode;
};

const startFight = async () => {
  switch (selectedMode.value) {
    case 'pvp':
      await router.push('/matchmaking');
      break;
    case 'auto':
      if (isAutoFightEnabled.value) {
        await store.dispatch('autoFight/disable');
      } else {
        await store.dispatch('autoFight/enable');
      }
      break;
    default:
      await store.dispatch('fight/startFight');
      break;
  }
};

const goToFriends = async () => {
  await router.push('/friends');
};

onMounted(async () => {
  store.dispatch('fight/loadModules');
  onlinePlayersCount.value = await getOnlinePlayersCount();
  onlineRefreshInterval = setInterval(async () => {
    onlinePlayersCount.value = await getOnlinePlayersCount();
  }, 30000);
});

onBeforeUnmount(() => {
  if (onlineRefreshInterval) {
    clearInterval(onlineRefreshInterval);
  }
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

.fight-btn-auto-active {
  background-color: transparent !important;
  border: 2px solid #00FF88 !important;
  color: #00FF88 !important;
  box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
}

/* ── Auto Fight Status ────────────────────────────────────── */
.autofight-status-section {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.autofight-inactive-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  font-family: Anonymous, sans-serif;
  font-size: 13px;
  color: var(--gray2);
  letter-spacing: 1px;
  text-transform: uppercase;
}

.hint-icon {
  color: var(--gray2);
  flex-shrink: 0;
}

/* ── Friends Section ─────────────────────────────────────── */
.friends-section {
  text-align: center;
  margin-top: 24px;
}

.friends-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 24px;
  background: rgba(20, 20, 30, 0.85);
  border: 1px solid rgba(255, 6, 111, 0.4);
  border-radius: 12px;
  color: #fff;
  font-family: Anonymous, sans-serif;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.friends-btn:active {
  border-color: #FF066F;
  box-shadow: 0 0 20px rgba(255, 6, 111, 0.3);
}

.friends-svg {
  color: #FF066F;
  flex-shrink: 0;
}

.friends-divider {
  color: #444;
  font-size: 16px;
}

.friends-online-inline {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
  color: #00FF88;
}

.online-dot-small {
  width: 6px;
  height: 6px;
  background: #00FF88;
  border-radius: 50%;
  box-shadow: 0 0 6px rgba(0, 255, 136, 0.8);
}

.scroll-gap {
  display: block;
  position: relative;
  height: 150px;
}
</style>
