<template>
  <div class="background background-arena">
    <div class="arena-container" @scroll="handleScroll">
      <div class="arena-content-wrapper">

        <div class="player-header">
          <UserAvatar :avatarUrl="master?.userData?.avatarUrl" width="50px" height="50px"/>
          <UserName :userName="master?.userData?.name || ''" style="width: auto !important;"/>
        </div>

        <!-- Fighter avatar -->
        <div class="fighter-avatar">
          <v-img :src="`/images/skins/${master?.userData?.skin || 'skin_m_1.png'}`" class="avatar-skin"/>
        </div>

        <!-- Action row: Mode | START FIGHT | Friends -->
        <div class="action-row">
          <ModeSelector
            :onlineCount="onlinePlayersCount"
            :autoFightActive="isAutoFightEnabled"
            @select="onModeSelect"
          />

          <HexButton
              variant="primary"
              size="lg"
              class="fight-btn"
              :class="{ 'fight-btn-auto-active': selectedMode === 'auto' && isAutoFightEnabled }"
              :disabled="!isBuildValid && selectedMode !== 'auto'"
              @click="startFight"
          >
            {{ startButtonText }}
          </HexButton>

          <HexButton
              variant="secondary"
              size="sm"
              class="friends-compact-btn"
              @click="goToFriends"
          >
            {{ t.arena.lblFriends }}
          </HexButton>
        </div>

        <!-- Auto Fight Status (shown when auto mode selected or auto fight active) -->
        <div v-if="selectedMode === 'auto' || isAutoFightEnabled" class="autofight-status-section">
          <AutoFightStatus v-if="isAutoFightEnabled"/>
          <div v-else class="autofight-inactive-hint">
            <svg class="hint-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--hex-text-muted)" stroke-width="2" stroke-linecap="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10"/><path d="M20.49 15a9 9 0 01-14.85 3.36L1 14"/></svg>
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
import HexButton from "@/components/ui/HexButton.vue";
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
  background: linear-gradient(to right bottom, var(--hex-bg-dark) 25%, transparent 75%);
  z-index: 1;
}

.background-arena::after {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: var(--hex-bg-dark);
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
  color: var(--hex-text-primary);
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

.fighter-avatar {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}

.avatar-skin {
  width: 120px;
  height: 200px;
}

/* ── Action Row ───────────────────────────────────────────── */
.action-row {
  margin-top: 20px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
}

.fight-btn {
  flex: 1;
  max-width: 220px;
  min-height: 48px !important;
}

.fight-btn-auto-active {
  background-color: transparent !important;
  border: 2px solid var(--hex-mode-auto) !important;
  color: var(--hex-mode-auto) !important;
  box-shadow: 0 0 20px color-mix(in srgb, var(--hex-mode-auto) 30%, transparent);
}

/* ── Friends compact button ──────────────────────────────── */
.friends-compact-btn {
  flex-shrink: 0;
  min-height: 48px;
}


/* ── Auto Fight Status ────────────────────────────────────── */
.autofight-status-section {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.hint-icon {
  flex-shrink: 0;
}

.autofight-inactive-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  border: 1px solid var(--hex-border-default);
  border-radius: 10px;
  font-family: 'Anonymous', 'Courier New', Consolas, monospace;
  font-size: 13px;
  color: var(--hex-text-muted);
  letter-spacing: 1px;
  text-transform: uppercase;
}

@media (max-width: 400px) {
  .friends-compact-btn {
    min-height: 42px;
  }
}

.scroll-gap {
  display: block;
  position: relative;
  height: 150px;
}
</style>
