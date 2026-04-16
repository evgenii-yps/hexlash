<template>
  <div class="pit-view">
    <canvas ref="sceneCanvas" class="scene-canvas" id="scene"></canvas>

    <!-- HUD overlay -->
    <div class="hud pit-hud">
      <!-- Top bar -->
      <div class="top-bar">
        <div class="top-bar-left">
          <div class="resources-chip">
            <span class="taps">{{ userTaps }}</span>
            <span class="separator">/</span>
            <span class="xp">{{ userXP }}</span>
          </div>
        </div>

        <div class="top-bar-center">{{ t.pit?.lblTitle || 'THE PIT' }}</div>

        <div class="top-bar-right">
          <button class="icon-btn bell-btn" aria-label="Notifications" @click="onNotifications">🔔</button>
          <button class="icon-btn avatar-btn" aria-label="Profile" @click="goProfile">👤</button>
        </div>
      </div>

      <!-- Fighter badges (positioned via JS over 3D fighters) -->
      <div ref="badgeWarden" class="fighter-badge badge-warden"></div>
      <div ref="badgePredator" class="fighter-badge badge-predator"></div>

      <!-- World hover hint -->
      <div ref="worldHint" class="world-hint"></div>

      <!-- Bottom hint -->
      <div class="bottom-hint">
        <span>{{ t.pit?.lblBottomHint || 'CLICK OBJECTS TO INTERACT' }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import store from '@/core/state/store.js';
import { t } from '@/locales/index.js';
import { initPitScene } from '@/three/scenes/pitScene.js';

export default {
  name: 'PitView',
  setup() {
    const router = useRouter();
    const sceneCanvas = ref(null);
    const badgeWarden = ref(null);
    const badgePredator = ref(null);
    const worldHint = ref(null);

    // Store data
    const master = computed(() => store.getters['master/getMaster']);
    const userTaps = computed(() => master.value?.userData?.totalTaps || 0);
    const userXP = computed(() => master.value?.userData?.progression?.freeXP || 0);
    const agents = computed(() => store.state.agent?.agents || []);
    const myClanId = computed(() => master.value?.userData?.clanId || null);

    let sceneCleanup = null;

    function handleNavigation(target) {
      switch (target) {
        case 'training':
          router.push('/training');
          break;
        case 'matchmaking':
          router.push('/matchmaking');
          break;
        case 'ratings':
          router.push('/ratings');
          break;
        case 'create':
          router.push('/arena/club/create');
          break;
        case 'shop':
          store.commit('master/setInfoMessage', { text: t.value.pit?.msgShopSoon || 'Shop coming soon', timeout: 2000 });
          break;
        case 'clan':
          if (myClanId.value) {
            router.push(`/clan/${myClanId.value}`);
          } else {
            store.commit('master/setInfoMessage', { text: t.value.pit?.msgNoClan || 'Join a clan from Ratings', timeout: 2000 });
          }
          break;
        case 'warden':
        case 'predator': {
          const sorted = [...agents.value].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          const idx = target === 'warden' ? 0 : 1;
          const agent = sorted[idx];
          if (agent) {
            router.push(`/arena/club/${agent.id}`);
          }
          break;
        }
      }
    }

    function goProfile() {
      router.push('/profile');
    }

    function onNotifications() {
      store.commit('master/setInfoMessage', { text: t.value.pit?.msgNotifSoon || 'Notifications coming soon', timeout: 2000 });
    }

    onMounted(() => {
      // Fetch agents if not loaded
      if (!agents.value.length) {
        store.dispatch('agent/fetchAgents');
      }

      if (sceneCanvas.value) {
        const result = initPitScene(sceneCanvas.value, {
          onObjectClick: handleNavigation,
          agents: agents.value,
          badgeWarden: badgeWarden.value,
          badgePredator: badgePredator.value,
          worldHint: worldHint.value,
          hoverLabels: {
            training: t.value.pit?.lblTraining || 'Training · Heavy Bag',
            matchmaking: t.value.pit?.lblMatchmaking || 'Matchmaking · Terminal',
            create: t.value.pit?.lblCreateFighter || 'Create New Fighter',
            ratings: t.value.pit?.lblLeaderboard || 'Leaderboard',
            clan: t.value.pit?.lblClan || 'Clan',
            shop: t.value.pit?.lblShop || 'Locker · Cosmetics',
          },
        });
        sceneCleanup = result.cleanup;
      }
    });

    onBeforeUnmount(() => {
      if (sceneCleanup) {
        sceneCleanup();
        sceneCleanup = null;
      }
    });

    return {
      t,
      sceneCanvas,
      badgeWarden,
      badgePredator,
      worldHint,
      userTaps,
      userXP,
      goProfile,
      onNotifications,
    };
  },
};
</script>

<style scoped>
.pit-view {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: var(--hex-bg-deep);
}

@supports (height: 100dvh) {
  .pit-view { height: 100dvh; }
}

/* Top bar */
.top-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px;
  z-index: 10;
}

.top-bar-left,
.top-bar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.top-bar-center {
  font-family: var(--hex-font-display);
  font-size: 20px;
  color: var(--hex-text-primary);
  letter-spacing: 3px;
  text-shadow: 0 0 12px var(--hex-primary-glow);
  text-transform: uppercase;
}

.resources-chip {
  font-family: var(--hex-font-mono);
  font-size: 13px;
  color: var(--hex-text-primary);
  background: var(--hex-bg-card);
  padding: 6px 12px;
  border-radius: var(--hex-radius-md);
  border: 1px solid var(--hex-border-default);
  display: flex;
  gap: 4px;
  align-items: center;
}
.resources-chip .taps { color: #FFD262; }
.resources-chip .separator { color: var(--hex-text-muted); }
.resources-chip .xp { color: #6EE7FF; }

.icon-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--hex-bg-card);
  border: 1px solid var(--hex-border-default);
  border-radius: var(--hex-radius-md);
  cursor: pointer;
  font-size: 16px;
  transition: border-color 0.2s;
}
.icon-btn:hover { border-color: var(--hex-border-active); }

/* Fighter badges — positioned by JS */
.fighter-badge {
  position: fixed;
  transform: translate(-50%, -100%);
  pointer-events: none;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.3s;
}

/* World hover hint */
.world-hint {
  position: fixed;
  pointer-events: none;
  z-index: 20;
  font-family: var(--hex-font-mono);
  font-size: 11px;
  color: var(--hex-text-primary);
  background: var(--hex-bg-card);
  padding: 4px 10px;
  border-radius: var(--hex-radius-sm);
  border: 1px solid var(--hex-border-default);
  opacity: 0;
  transform: translate(12px, -50%);
  transition: opacity 0.15s;
  white-space: nowrap;
}
.world-hint.show { opacity: 1; }

/* Bottom hint */
.bottom-hint {
  position: absolute;
  bottom: 32px;
  left: 0;
  right: 0;
  text-align: center;
  font-family: var(--hex-font-mono);
  font-size: 11px;
  color: var(--hex-text-muted);
  letter-spacing: 2px;
  z-index: 10;
}
</style>
