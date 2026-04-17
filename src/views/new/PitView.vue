<template>
  <div class="pit-root">
    <canvas ref="canvasRef" class="pit-canvas" id="pit-scene-canvas"></canvas>

    <!-- Phase 4.7-FIN debug marker — visible green badge confirms new PitView mounted. Remove after confirmation. -->
    <div class="pit-debug-marker">PIT-NEW-RENDERED-{{ markerVersion }}</div>

    <div class="pit-hud pit-hud-root">
      <div class="pit-hud-top">
        <div class="pit-hud-left">
          <div class="pit-resources">
            <span class="pit-taps">{{ userTaps }}</span>
            <span class="pit-sep">/</span>
            <span class="pit-xp">{{ userXP }}</span>
          </div>
        </div>
        <div class="pit-hud-center">{{ t.pit?.lblTitle || 'THE PIT' }}</div>
        <div class="pit-hud-right">
          <button class="pit-icon-btn" aria-label="Notifications" @click="onNotifications">🔔</button>
          <button class="pit-icon-btn" aria-label="Profile" @click="goProfile">👤</button>
        </div>
      </div>

      <div ref="badgeWardenRef" class="pit-fighter-badge pit-badge-warden"></div>
      <div ref="badgePredatorRef" class="pit-fighter-badge pit-badge-predator"></div>

      <div ref="worldHintRef" class="pit-world-hint"></div>

      <div class="pit-hud-bottom">
        <span>{{ t.pit?.lblBottomHint || 'CLICK OBJECTS TO INTERACT' }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import store from '@/core/state/store.js';
import { t } from '@/locales/index.js';
import { initPitScene } from '@/three/scenes/pitScene.js';

export default {
  name: 'PitViewNew',
  setup() {
    console.log('[PIT-NEW] setup called');

    const router = useRouter();
    const canvasRef = ref(null);
    const badgeWardenRef = ref(null);
    const badgePredatorRef = ref(null);
    const worldHintRef = ref(null);

    const markerVersion = ref(Date.now());

    const master = computed(() => store.getters['master/getMaster']);
    const userTaps = computed(() => master.value?.userData?.totalTaps || 0);
    const userXP = computed(() => master.value?.userData?.progression?.freeXP || 0);
    const agents = computed(() => store.state.agent?.agents || []);
    const myClanId = computed(() => master.value?.userData?.clanId || null);

    let cleanup = null;

    function handleNavigation(target) {
      console.log('[PIT-NEW] navigate:', target);
      switch (target) {
        case 'training': router.push('/training'); break;
        case 'matchmaking': router.push('/matchmaking'); break;
        case 'ratings': router.push('/ratings'); break;
        case 'create': router.push('/arena/club/create'); break;
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
          if (agent) router.push(`/arena/club/${agent.id}`);
          break;
        }
      }
    }

    function goProfile() { router.push('/profile'); }

    function onNotifications() {
      store.commit('master/setInfoMessage', { text: t.value.pit?.msgNotifSoon || 'Notifications coming soon', timeout: 2000 });
    }

    console.log('[PIT-NEW] registering onMounted hook');
    onMounted(async () => {
      console.log('[PIT-NEW] onMounted fired');
      await nextTick();
      console.log('[PIT-NEW] canvasRef after nextTick:', canvasRef.value);
      console.log('[PIT-NEW] initPitScene type:', typeof initPitScene);

      if (!canvasRef.value) {
        console.error('[PIT-NEW] canvas ref is null after nextTick — abort');
        return;
      }

      if (!agents.value.length) {
        console.log('[PIT-NEW] dispatching fetchAgents');
        store.dispatch('agent/fetchAgents');
      }

      try {
        const result = initPitScene(canvasRef.value, {
          onObjectClick: handleNavigation,
          agents: agents.value,
          badgeWarden: badgeWardenRef.value,
          badgePredator: badgePredatorRef.value,
          worldHint: worldHintRef.value,
          hoverLabels: {
            training: t.value.pit?.lblTraining || 'Training · Heavy Bag',
            matchmaking: t.value.pit?.lblMatchmaking || 'Matchmaking · Terminal',
            create: t.value.pit?.lblCreateFighter || 'Create New Fighter',
            ratings: t.value.pit?.lblLeaderboard || 'Leaderboard',
            clan: t.value.pit?.lblClan || 'Clan',
            shop: t.value.pit?.lblShop || 'Locker · Cosmetics',
          },
        });
        cleanup = result?.cleanup;
        console.log('[PIT-NEW] initPitScene OK, cleanup set:', typeof cleanup);
      } catch (err) {
        console.error('[PIT-NEW] initPitScene threw:', err);
      }
    });

    onBeforeUnmount(() => {
      console.log('[PIT-NEW] onBeforeUnmount');
      if (cleanup) { cleanup(); cleanup = null; }
    });

    return {
      t, canvasRef, badgeWardenRef, badgePredatorRef, worldHintRef,
      userTaps, userXP, markerVersion,
      goProfile, onNotifications,
    };
  },
};
</script>

<style scoped>
.pit-root {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: var(--hex-bg-deep);
}
@supports (height: 100dvh) {
  .pit-root { height: 100dvh; }
}

.pit-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}

/* Phase 4.7-FIN debug marker */
.pit-debug-marker {
  position: fixed;
  top: 50px;
  left: 50%;
  transform: translateX(-50%);
  background: lime;
  color: black;
  padding: 10px;
  z-index: 99999;
  font-family: monospace;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 1px;
  pointer-events: none;
}

.pit-hud-root {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 10;
}
.pit-hud-root > * { pointer-events: auto; }
.pit-hud-root .pit-fighter-badge,
.pit-hud-root .pit-world-hint { pointer-events: none; }

.pit-hud-top {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
}
.pit-hud-left,
.pit-hud-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.pit-hud-center {
  font-family: var(--hex-font-display);
  font-size: 14px;
  letter-spacing: 4px;
  color: var(--hex-text-primary);
  text-transform: uppercase;
}

.pit-resources {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--hex-bg-card);
  border: 1px solid var(--hex-border-default);
  border-radius: var(--hex-radius-sm);
  font-family: var(--hex-font-mono);
  font-size: 12px;
}
.pit-taps { color: var(--hex-text-primary); }
.pit-sep { color: var(--hex-text-muted); }
.pit-xp { color: var(--hex-primary); }

.pit-icon-btn {
  background: var(--hex-bg-card);
  border: 1px solid var(--hex-border-default);
  border-radius: var(--hex-radius-sm);
  font-size: 16px;
  padding: 6px 10px;
  cursor: pointer;
  color: var(--hex-text-primary);
}
.pit-icon-btn:hover { border-color: var(--hex-border-active); }

.pit-fighter-badge {
  position: absolute;
  transform: translate(-50%, -50%);
  padding: 4px 8px;
  background: var(--hex-bg-card);
  border: 1px solid var(--hex-border-default);
  border-radius: var(--hex-radius-sm);
  font-family: var(--hex-font-mono);
  font-size: 10px;
  color: var(--hex-text-primary);
  opacity: 0;
  transition: opacity 0.2s;
}

.pit-world-hint {
  position: absolute;
  transform: translate(-50%, calc(-100% - 12px));
  padding: 4px 10px;
  background: var(--hex-bg-card);
  border: 1px solid var(--hex-border-active);
  border-radius: var(--hex-radius-sm);
  font-family: var(--hex-font-mono);
  font-size: 11px;
  color: var(--hex-text-primary);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s;
  white-space: nowrap;
}
.pit-world-hint.show { opacity: 1; }

.pit-hud-bottom {
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  text-align: center;
  font-family: var(--hex-font-mono);
  font-size: 11px;
  color: var(--hex-text-muted);
  letter-spacing: 2px;
}
</style>
