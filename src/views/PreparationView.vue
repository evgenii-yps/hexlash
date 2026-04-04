<template>
  <div class="background background-arena">
    <div class="arena-container" @scroll="handleScroll">
      <div class="arena-content-wrapper">

        <button class="switch-mode-btn" @click="$router.push('/arena?force=true')">
          {{ t.arena.hub?.switchBack || '← Arena' }}
        </button>

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
            @select="onModeSelect"
          />

          <HexButton
              variant="primary"
              size="lg"
              class="fight-btn hex-glow-pulse"
              :disabled="!isBuildValid"
              @click="startFight"
          >
            {{ t.arena.lblStartFight }}
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

        <ModuleBuilder/>

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
import ModeSelector from "@/components/arena/ModeSelector.vue";
import HexButton from "@/components/ui/HexButton.vue";
import {getOnlinePlayersCount} from "@/core/services/statsService.js";

const master = computed(() => store.getters['master/getMaster']);
const isBuildValid = computed(() => store.getters['fight/isBuildValid']);

// PvP data
const onlineFriendsCount = computed(() => store.getters['friends/onlineFriendsCount']);
const onlinePlayersCount = ref(0);
let onlineRefreshInterval = null;

const selectedMode = ref('pve');

const onModeSelect = (mode) => {
  selectedMode.value = mode;
};

const startFight = async () => {
  switch (selectedMode.value) {
    case 'pvp':
      await router.push('/matchmaking');
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

/* ── Friends compact button ──────────────────────────────── */
.friends-compact-btn {
  flex-shrink: 0;
  min-height: 48px;
}


@media (max-width: 400px) {
  .friends-compact-btn {
    min-height: 42px;
  }
}

@media (max-width: 360px) {
  .fight-btn {
    max-width: 160px;
  }
  .action-row {
    gap: 8px;
  }
}

.scroll-gap {
  display: block;
  position: relative;
  height: 150px;
}

.switch-mode-btn {
  align-self: flex-start;
  background: none;
  border: 1px solid var(--hex-border-default);
  border-radius: var(--hex-radius-md);
  color: var(--hex-text-muted);
  font-family: 'Anonymous', 'Courier New', Consolas, monospace;
  font-size: 12px;
  letter-spacing: 1px;
  padding: 6px 12px;
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s;
}

.switch-mode-btn:hover {
  color: var(--hex-text-primary);
  border-color: var(--hex-border-active);
}
</style>
