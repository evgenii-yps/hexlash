<template>
  <div class="training-v2">
    <div class="training-scroll">
      <!-- Top bar -->
      <div class="tr-top-bar">
        <button class="tr-back" @click="$router.push('/arena/pit')">← {{ tv2.lblBack || 'BACK' }}</button>
        <div class="tr-title">{{ tv2.lblTitle || 'TRAINING' }}</div>
        <div class="tr-taps">
          <span class="tr-taps-val">{{ formattedTaps }}</span>
          <span class="tr-taps-label">{{ tv2.lblTaps || 'TAPS' }}</span>
        </div>
      </div>

      <!-- 3D Bag area -->
      <div class="tr-bag-area" @pointerdown="onTap">
        <Punch3D v-if="!is2DPunch" class="tr-bag-canvas" :width="bagWidth" :height="bagHeight" />
        <div v-else class="tr-bag-2d">
          <img src="@/assets/images/punch_bag.webp" class="bag-2d-img" alt="" />
        </div>

        <!-- Floating +N numbers -->
        <TransitionGroup name="float-up">
          <div v-for="num in floatingNums" :key="num.id" class="floating-num" :style="{ left: num.x + 'px', top: num.y + 'px' }">
            +{{ num.value }}
          </div>
        </TransitionGroup>

        <!-- Combo display -->
        <Transition name="combo-pop">
          <div v-if="comboMultiplier > 1" class="combo-display" :class="'x' + comboMultiplier">
            ×{{ comboMultiplier }} {{ tv2.lblCombo || 'COMBO' }}
          </div>
        </Transition>
      </div>

      <!-- Bottom stats -->
      <div class="tr-stats">
        <div class="tr-stat-row">
          <span class="tr-stat-label">{{ tv2.lblEnergy || 'ENERGY' }}</span>
          <div class="tr-energy-bar">
            <div class="tr-energy-fill" :style="{ width: energyPercent + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- Hint -->
      <div class="tr-hint">{{ tv2.lblHint || 'TAP THE BAG' }}</div>

      <div class="scroll-gap"></div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import store from '@/core/state/store.js';
import { t } from '@/locales/index.js';
import { COST_PER_CLICK } from '@/core/constants.js';
import Punch3D from '@/components/fragments/training/Punch3D.vue';

export default {
  name: 'TrainingViewV2',
  components: { Punch3D },
  setup() {
    const tv2 = computed(() => t.value.training?.v2 || {});
    const is2DPunch = computed(() => store.getters['punch/is2DPunchEnabled']);
    const totalTaps = computed(() => store.getters['progression/getTotalTaps'] || 0);
    const formattedTaps = computed(() => totalTaps.value.toLocaleString());
    const bagWidth = ref(280);
    const bagHeight = ref(350);

    // Combo state
    const comboCount = ref(0);
    const comboMultiplier = ref(1);
    let comboTimer = null;

    // Floating numbers
    const floatingNums = ref([]);
    let numIdCounter = 0;

    // Energy (stub — v23 concept, not in current store)
    const energyPercent = ref(100);

    function updateCombo() {
      const c = comboCount.value;
      if (c >= 25) comboMultiplier.value = 5;
      else if (c >= 12) comboMultiplier.value = 3;
      else if (c >= 5) comboMultiplier.value = 2;
      else comboMultiplier.value = 1;
    }

    function spawnFloatingNumber(value, x, y) {
      const id = numIdCounter++;
      floatingNums.value.push({ id, value, x, y });
      setTimeout(() => {
        floatingNums.value = floatingNums.value.filter(n => n.id !== id);
      }, 800);
    }

    function onTap(event) {
      // Combo tracking
      comboCount.value++;
      clearTimeout(comboTimer);
      comboTimer = setTimeout(() => {
        comboCount.value = 0;
        comboMultiplier.value = 1;
      }, 700);
      updateCombo();

      // Dispatch to store (same as existing TrainingView)
      const tapValue = COST_PER_CLICK;
      store.dispatch('punch/handlePunch', tapValue);
      store.dispatch('progression/addTap');

      // Haptic
      if (navigator.vibrate) navigator.vibrate(50);

      // Floating number
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      spawnFloatingNumber(tapValue * comboMultiplier.value, x, y - 20);
    }

    onMounted(() => {
      store.dispatch('punch/synchronizePunchInfo').catch(() => {});
      store.dispatch('punch/startPunchTimer').catch(() => {});
    });

    onBeforeUnmount(() => {
      store.dispatch('punch/stopPunchTimer').catch(() => {});
      clearTimeout(comboTimer);
    });

    return {
      t, tv2, is2DPunch, formattedTaps, bagWidth, bagHeight,
      comboCount, comboMultiplier, floatingNums, energyPercent,
      onTap,
    };
  },
};
</script>

<style scoped>
.training-v2 {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: var(--hex-bg-deep);
}
@supports (height: 100dvh) { .training-v2 { height: 100dvh; } }

.training-scroll {
  position: relative;
  z-index: 10;
  overflow-y: auto;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 16px;
  -webkit-overflow-scrolling: auto;
  overscroll-behavior-y: none;
}

/* Top bar */
.tr-top-bar {
  width: 100%;
  max-width: 500px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  margin-top: 60px;
}
.tr-back {
  background: none; border: none; color: var(--hex-text-secondary);
  font-family: var(--hex-font-body); font-size: 14px; cursor: pointer;
  min-height: 44px; display: flex; align-items: center;
}
.tr-title {
  font-family: var(--hex-font-display); font-size: 20px;
  color: var(--hex-text-primary); letter-spacing: 3px;
}
.tr-taps { text-align: right; }
.tr-taps-val {
  display: block; font-family: var(--hex-font-mono); font-size: 22px;
  color: #FFD262;
}
.tr-taps-label {
  font-size: 9px; color: var(--hex-text-muted); letter-spacing: 2px; text-transform: uppercase;
}

/* Bag area */
.tr-bag-area {
  position: relative;
  width: 100%;
  max-width: 400px;
  min-height: 380px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
}
.tr-bag-canvas { pointer-events: none; }
.bag-2d-img { width: 200px; height: auto; }

/* Floating numbers */
.floating-num {
  position: absolute;
  font-family: var(--hex-font-mono);
  font-size: 24px;
  font-weight: 700;
  color: #FFD262;
  pointer-events: none;
  text-shadow: 0 0 8px rgba(255, 210, 98, 0.5);
}
.float-up-enter-active { transition: all 0.6s ease-out; }
.float-up-leave-active { transition: all 0.2s ease-in; }
.float-up-enter-from { opacity: 1; transform: translateY(0); }
.float-up-leave-to { opacity: 0; transform: translateY(-40px); }
.float-up-enter-to { opacity: 0.3; transform: translateY(-50px); }

/* Combo display */
.combo-display {
  position: absolute;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  font-family: var(--hex-font-display);
  font-size: 36px;
  color: var(--hex-text-primary);
  text-shadow: 0 0 20px var(--hex-primary-glow);
  pointer-events: none;
  letter-spacing: 4px;
}
.combo-display.x3 { color: var(--hex-warning); text-shadow: 0 0 20px rgba(255, 184, 0, 0.5); }
.combo-display.x5 { color: var(--hex-danger); text-shadow: 0 0 20px rgba(255, 51, 51, 0.5); font-size: 44px; }

.combo-pop-enter-active { transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); }
.combo-pop-leave-active { transition: all 0.3s ease-out; }
.combo-pop-enter-from { opacity: 0; transform: translateX(-50%) scale(0.5); }
.combo-pop-leave-to { opacity: 0; transform: translateX(-50%) scale(1.2); }

/* Stats */
.tr-stats {
  width: 100%;
  max-width: 500px;
  padding: 12px 0;
}
.tr-stat-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.tr-stat-label {
  font-size: 10px;
  color: var(--hex-text-muted);
  letter-spacing: 1.5px;
  text-transform: uppercase;
  flex-shrink: 0;
  width: 60px;
}
.tr-energy-bar {
  flex: 1;
  height: 6px;
  background: var(--hex-bg-light);
  border-radius: 3px;
  overflow: hidden;
}
.tr-energy-fill {
  height: 100%;
  background: var(--hex-branch-speed);
  border-radius: 3px;
  transition: width 0.3s;
}

/* Hint */
.tr-hint {
  font-family: var(--hex-font-mono);
  font-size: 11px;
  color: var(--hex-text-muted);
  letter-spacing: 2px;
  margin-top: 12px;
}

.scroll-gap { height: 120px; flex-shrink: 0; }
</style>
