<!-- Epic 3A Step 14 — Fight HUD skeleton: fight-top (2 fighter cards + round
     counter + HP bars), cam-switcher (pit/side/cinema), back button,
     spectate badge. Layout and mocks 1-to-1 from prototype 4444-4472;
     fight-log + coach-pause + prep/result overlays arrive in Steps 15-17. -->
<template>
  <div class="hud fight-hud">
    <button class="fight-back" @click="onBack">&larr; Back</button>
    <div class="spectate-badge"><span class="sb-dot"></span>Spectating</div>

    <div class="fight-top">
      <div class="fight-fighter left">
        <div class="ff-name">{{ state.leftName }}</div>
        <div class="ff-arch">{{ state.leftArch }}</div>
        <div class="ff-hp">
          <div class="ff-hp-fill" :style="{ width: leftHpPct + '%' }"></div>
        </div>
        <div class="ff-hp-num">
          {{ Math.round(state.leftHp) }} / {{ state.leftMaxHp }}
        </div>
      </div>

      <div class="fight-round">
        <div class="fr-kicker">Round</div>
        <div class="fr-num">{{ state.round }} / {{ state.totalRounds }}</div>
      </div>

      <div class="fight-fighter right">
        <div class="ff-name">{{ state.rightName }}</div>
        <div class="ff-arch">{{ state.rightArch }}</div>
        <div class="ff-hp">
          <div class="ff-hp-fill" :style="{ width: rightHpPct + '%' }"></div>
        </div>
        <div class="ff-hp-num">
          {{ Math.round(state.rightHp) }} / {{ state.rightMaxHp }}
        </div>
      </div>
    </div>

    <div class="cam-switcher">
      <button :class="{ active: camMode === 'pit' }"    @click="selectCam('pit')">Pit</button>
      <button :class="{ active: camMode === 'side' }"   @click="selectCam('side')">Side</button>
      <button :class="{ active: camMode === 'cinema' }" @click="selectCam('cinema')">Cinema</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { fightSceneApi } from '@/scene/scenes/useFightSceneApi.js';

const router = useRouter();

// Step 14 mocks — Step 16 replaces with reactive fightState driven by
// useFightSimulation. Values match the prototype's starting state.
const state = ref({
  round:       1,
  totalRounds: 5,
  leftName:    'FIGHTER #1',
  leftArch:    'Captain \u00b7 Warden',
  leftHp:      100,
  leftMaxHp:   100,
  rightName:   'FIGHTER #2',
  rightArch:   'Predator',
  rightHp:     100,
  rightMaxHp:  100,
});

const camMode = ref('pit');

const leftHpPct = computed(() =>
  Math.max(0, Math.round(100 * state.value.leftHp  / state.value.leftMaxHp)),
);
const rightHpPct = computed(() =>
  Math.max(0, Math.round(100 * state.value.rightHp / state.value.rightMaxHp)),
);

function selectCam(mode) {
  camMode.value = mode;
  fightSceneApi.setCamMode(mode);
}

function onBack() {
  router.push('/v2/fd/warden');
}
</script>

<style scoped>
.fight-hud {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 50;
  color: #fff;
}

/* fight-top (prototype 838-881) */
.fight-top {
  position: fixed;
  top: 14px;
  left: 14px;
  right: 14px;
  display: flex;
  gap: 16px;
  align-items: center;
  pointer-events: none;
}
.fight-fighter {
  flex: 1;
  min-width: 0;
  background: var(--bg-panel);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 8px 12px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
.fight-fighter.left  { border-left:  3px solid #D4A843; }
.fight-fighter.right { border-right: 3px solid var(--hex-primary); text-align: right; }
.ff-name {
  font-family: var(--font-display);
  font-size: 14px;
  letter-spacing: 2px;
}
.ff-arch {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-top: 2px;
}
.fight-fighter.left  .ff-arch { color: #D4A843; }
.fight-fighter.right .ff-arch { color: var(--hex-primary); }
.ff-hp {
  height: 6px;
  margin-top: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
  overflow: hidden;
}
.ff-hp-fill {
  height: 100%;
  width: 100%;
  background: linear-gradient(90deg, #2ee07f, #2ee07f 60%, #ffbb33 80%, #ff4444);
  transition: width 0.4s ease;
}
.fight-fighter.right .ff-hp-fill {
  transform-origin: right;
}
.ff-hp-num {
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--text-mid);
  margin-top: 2px;
  letter-spacing: 1px;
}

/* fight-round (prototype 883-903) */
.fight-round {
  position: fixed;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  background: var(--bg-panel);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  padding: 6px 14px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  min-width: 100px;
  pointer-events: none;
}
.fr-kicker {
  font-family: var(--font-mono);
  font-size: 8px;
  letter-spacing: 2px;
  color: var(--text-dim);
  text-transform: uppercase;
}
.fr-num {
  font-family: var(--font-display);
  font-size: 16px;
  letter-spacing: 3px;
  margin-top: 1px;
}

/* cam-switcher (prototype 905-930) */
.cam-switcher {
  position: fixed;
  top: 90px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 4px;
  background: var(--bg-panel);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  padding: 4px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  pointer-events: auto;
  z-index: 60;
}
.cam-switcher button {
  background: transparent;
  border: none;
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  padding: 5px 10px;
  color: var(--text-dim);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s ease;
}
.cam-switcher button.active {
  background: rgba(255, 6, 111, 0.18);
  color: #fff;
  box-shadow: inset 0 0 0 1px rgba(255, 6, 111, 0.45);
}
.cam-switcher button:hover:not(.active) {
  color: var(--text-mid);
  background: rgba(255, 255, 255, 0.04);
}

/* fight-back (prototype 968-986) */
.fight-back {
  position: fixed;
  top: 90px;
  left: 14px;
  background: var(--bg-panel);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  padding: 6px 12px;
  color: var(--text-mid);
  cursor: pointer;
  pointer-events: auto;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 2px;
  text-transform: uppercase;
  transition: all 0.15s ease;
  z-index: 60;
}
.fight-back:hover {
  color: #fff;
  border-color: rgba(255, 6, 111, 0.4);
  background: rgba(255, 6, 111, 0.08);
}

/* spectate-badge (prototype 1645-1667). Always visible in our spectate-by-
   default HUD; prototype gated on body.fight-readonly which we don't use. */
.spectate-badge {
  position: fixed;
  top: 90px;
  right: 14px;
  background: var(--bg-deep);
  border: 1px solid var(--hex-primary);
  border-radius: 16px;
  padding: 4px 14px;
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 2px;
  color: var(--hex-primary);
  text-transform: uppercase;
  z-index: 60;
  pointer-events: none;
}
.sb-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--hex-primary);
  box-shadow: 0 0 6px rgba(255, 6, 111, 0.6);
  margin-right: 4px;
  animation: livePulse 1.4s ease-in-out infinite;
}
@keyframes livePulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.5; }
}
</style>
