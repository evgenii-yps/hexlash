<template>
  <div class="pit-root">
    <!-- Pit 3D + HUD: visible under flag-off, or flag-on + scene === 'pit' -->
    <template v-if="!useSceneMachine || scene === 'pit'">
      <canvas ref="canvasRef" class="pit-canvas" id="pit-scene-canvas"></canvas>

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
    </template>

    <!-- HUD slots: flag-on + scene !== 'pit'. Shop intentionally omitted (kept as toast). -->
    <template v-else>
      <HUDPlaceholder v-if="scene === 'profile'"       title="PROFILE"         @back="back" />
      <HUDPlaceholder v-else-if="scene === 'training'" title="TRAINING"        @back="back" />
      <HUDPlaceholder v-else-if="scene === 'ratings'"  title="RATINGS"         @back="back" />
      <HUDPlaceholder v-else-if="scene === 'clan'"     title="CLAN"            @back="back" />
      <HUDPlaceholder v-else-if="scene === 'mm'"       title="MATCHMAKING"     @back="back" />
      <HUDPlaceholder v-else-if="scene === 'detail'"   title="FIGHTER DETAIL"  @back="back" />
      <HUDPlaceholder v-else-if="scene === 'fight'"    title="FIGHT"           @back="back" />
      <HUDPlaceholder v-else-if="scene === 'create'"   title="CREATE FIGHTER"  @back="back" />
    </template>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import store from '@/core/state/store.js';
import { t } from '@/locales/index.js';
import { initPitScene } from '@/three/scenes/pitScene.js';
import { useScene } from '@/composables/useScene.js';
import HUDPlaceholder from '@/views/new/hud/HUDPlaceholder.vue';

const VALID_SCENE_QUERY = ['pit', 'profile', 'training', 'ratings', 'clan', 'mm', 'shop', 'detail', 'fight', 'create'];

export default {
  name: 'PitView',
  components: { HUDPlaceholder },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const canvasRef = ref(null);
    const badgeWardenRef = ref(null);
    const badgePredatorRef = ref(null);
    const worldHintRef = ref(null);

    const useSceneMachine = __USE_STATE_MACHINE__;
    const { scene, setScene, back } = useScene();

    const master = computed(() => store.getters['master/getMaster']);
    const userTaps = computed(() => master.value?.userData?.totalTaps || 0);
    const userXP = computed(() => master.value?.userData?.progression?.freeXP || 0);
    const agents = computed(() => store.state.agent?.agents || []);
    const myClanId = computed(() => master.value?.userData?.clanId || null);

    let cleanup = null;

    function handleNavigation(target) {
      if (useSceneMachine) {
        switch (target) {
          case 'training':    setScene('training'); break;
          case 'matchmaking': setScene('mm'); break;
          case 'ratings':     setScene('ratings'); break;
          case 'create':      setScene('create'); break;
          case 'shop':
            store.commit('master/setInfoMessage', { text: t.value.pit?.msgShopSoon || 'Shop coming soon', timeout: 2000 });
            break;
          case 'clan':
            if (myClanId.value) {
              setScene({ scene: 'clan', params: { clanId: myClanId.value } });
            } else {
              store.commit('master/setInfoMessage', { text: t.value.pit?.msgNoClan || 'Join a clan from Ratings', timeout: 2000 });
            }
            break;
          case 'warden':
          case 'predator': {
            const sorted = [...agents.value].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            const idx = target === 'warden' ? 0 : 1;
            const agent = sorted[idx];
            if (agent) setScene({ scene: 'detail', params: { agentId: agent.id, fighterKey: target } });
            break;
          }
        }
        return;
      }
      // LEGACY BRANCH — unchanged
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

    function goProfile() {
      if (useSceneMachine) setScene('profile');
      else router.push('/profile');
    }

    function onNotifications() {
      store.commit('master/setInfoMessage', { text: t.value.pit?.msgNotifSoon || 'Notifications coming soon', timeout: 2000 });
    }

    function initPitSceneLocal() {
      if (!canvasRef.value) return;
      if (!agents.value.length) {
        store.dispatch('agent/fetchAgents');
      }
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
    }

    onMounted(async () => {
      await nextTick();

      // Deep-link initial scene from query (only under flag-on)
      if (useSceneMachine) {
        const querySceneRaw = route.query.scene;
        if (typeof querySceneRaw === 'string' && VALID_SCENE_QUERY.includes(querySceneRaw)) {
          const queryParams = {};
          ['matchId', 'agentId', 'clanId', 'fighterKey'].forEach(k => {
            if (route.query[k]) queryParams[k] = route.query[k];
          });
          setScene({ scene: querySceneRaw, params: queryParams });
        }
      }

      // Init Three.js scene only when pit is active
      const shouldInitPit = useSceneMachine ? scene.value === 'pit' : true;
      if (shouldInitPit && canvasRef.value) {
        initPitSceneLocal();
      }
    });

    // Under flag-on: watch scene transitions to mount/unmount Three.js scene
    if (useSceneMachine) {
      watch(scene, async (newScene, oldScene) => {
        if (newScene === 'pit' && oldScene !== 'pit') {
          await nextTick();
          if (canvasRef.value && !cleanup) {
            initPitSceneLocal();
          }
        } else if (oldScene === 'pit' && newScene !== 'pit') {
          if (cleanup) { cleanup(); cleanup = null; }
        }
      });
    }

    onBeforeUnmount(() => {
      if (cleanup) { cleanup(); cleanup = null; }
    });

    return {
      t,
      canvasRef, badgeWardenRef, badgePredatorRef, worldHintRef,
      userTaps, userXP,
      goProfile, onNotifications,
      useSceneMachine, scene, back,
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
