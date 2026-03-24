<template>
  <div class="background background-arena">
    <div class="arena-container" @scroll="handleScroll">
      <div class="arena-content-wrapper">

        <div class="player-header">
          <UserAvatar :avatarUrl="master?.userData?.avatarUrl" width="50px" height="50px"/>
          <UserName :userName="master?.userData?.name || ''" style="width: auto !important;"/>
        </div>

        <!-- Action row: Mode | START FIGHT | Friends -->
        <div class="action-row">
          <ModeSelector
            :onlineCount="onlinePlayersCount"
            :autoFightActive="isAutoFightEnabled"
            @select="onModeSelect"
          />

          <VBtn
              size="large"
              class="fight-btn"
              :class="{ 'fight-btn-auto-active': selectedMode === 'auto' && isAutoFightEnabled }"
              :disabled="!isBuildValid && selectedMode !== 'auto'"
              @click="startFight"
          >
            {{ startButtonText }}
          </VBtn>

          <button class="friends-compact-btn" @click="goToFriends">
            <span class="friends-compact-label">Friends</span>
          </button>
        </div>

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

        <ModuleBuilder/>

        <div class="scroll-gap"/>

      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, computed, watch, onMounted, onBeforeUnmount} from 'vue';
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

// Force auto mode when auto fight is active
watch(isAutoFightEnabled, (active) => {
  if (active) selectedMode.value = 'auto';
}, { immediate: true });

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

/* ── Action Row ───────────────────────────────────────────── */
.action-row {
  margin-top: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
}

.fight-btn {
  flex: 1;
  max-width: 220px;
  cursor: pointer;
  background-color: var(--primary-color);
  color: white !important;
  font-size: 1rem;
  min-height: 48px !important;
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

/* ── Friends compact button ──────────────────────────────── */
.friends-compact-btn {
  width: 60px;
  height: 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  background: rgba(20, 20, 30, 0.9);
  border: 1px solid rgba(255, 6, 111, 0.4);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  position: relative;
}

.friends-compact-btn:active {
  border-color: #FF066F;
  box-shadow: 0 0 16px rgba(255, 6, 111, 0.3);
}

.friends-compact-label {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  line-height: 1;
  text-transform: uppercase;
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
  font-family: 'Anonymous', 'Courier New', Consolas, monospace;
  font-size: 13px;
  color: var(--gray2);
  letter-spacing: 1px;
  text-transform: uppercase;
}

.hint-icon {
  color: var(--gray2);
  flex-shrink: 0;
}

@media (max-width: 400px) {
  .friends-compact-btn {
    width: 52px;
    height: 42px;
  }
  .friends-compact-label { font-size: 11px; }
}

.scroll-gap {
  display: block;
  position: relative;
  height: 150px;
}
</style>
