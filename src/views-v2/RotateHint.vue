<!-- RotateHint — "turn your phone" recommendation overlay for the game shell.
     Touch devices in portrait, AFTER the loading screen has lifted (sceneLoading
     is idle), get a full-screen scrim with a large rotate animation: a
     matte-chrome phone outline (.edit-space / SHOP-chip family — hairline frame,
     glass fill, NO glow) that rotates portrait↔landscape, wrapped by the ONE pink
     bloom on screen — the rotation arc-arrow (#FF0069, soft glow). The phone has
     no glow.

     It's a recommendation, not a gate: tap anywhere dismisses it (play in
     portrait), rotating to landscape hides it automatically. Dismissal is
     in-memory only and resets on each return to portrait — so the hint repeats
     every time the device is held vertically, it's not a one-shot tutorial.

     Desktop (fine pointer) → v-if is always false → the overlay never exists.
     Mounted once in AppV2, so it's scoped to the /play/* game shell. -->
<template>
  <div v-if="visible" class="rotate-hint" @click="onDismiss">
    <div class="rh-stage">
      <div class="rh-anim">
        <!-- the single pink bloom: static rotation arc-arrow around the phone -->
        <svg class="rh-arc" viewBox="0 0 320 320" fill="none" aria-hidden="true">
          <path d="M 78 104 A 92 92 0 0 1 242 104" stroke="#FF0069" stroke-width="5" stroke-linecap="round" />
          <!-- arrowhead sits ON the arc's tangent at its end point (242,104), so the
               legs sweep back off the curve instead of running along it and crossing
               it. Same stroke-width as the arc — it stays a line, not a blot. -->
          <polyline points="250,79 242,104 217,96" stroke="#FF0069" stroke-width="5"
                    stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <!-- matte-chrome phone outline — rotates; one indicator detail (camera). -->
        <div class="rh-phone">
          <span class="rh-cam" />
        </div>
      </div>

      <div class="rh-label">{{ t.rotateHint.label }}</div>
      <div class="rh-dismiss">{{ t.rotateHint.dismiss }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { t } from '@/locales/index.js';
import { loadingState } from '@/services/sceneLoading.js';

const coarse = ref(false);    // touch device (pointer: coarse)
const portrait = ref(false);  // (orientation: portrait)
const dismissed = ref(false); // in-memory only — repeats, not a one-shot tutorial

// Show only on a touch device held vertically, once load/transition has settled,
// and not after a tap-dismiss. Reactive on loadingState.active + the matchMedia
// refs below.
const visible = computed(() =>
  coarse.value && portrait.value && !loadingState.active && !dismissed.value
);

function onDismiss() { dismissed.value = true; }

let mqPortrait = null;
let onPortraitChange = null;

onMounted(() => {
  coarse.value = window.matchMedia('(pointer: coarse)').matches;

  mqPortrait = window.matchMedia('(orientation: portrait)');
  portrait.value = mqPortrait.matches;
  onPortraitChange = (e) => {
    portrait.value = e.matches;
    // Rotated to landscape → reset dismissal so the hint returns next time the
    // device is held in portrait.
    if (!e.matches) dismissed.value = false;
  };
  mqPortrait.addEventListener('change', onPortraitChange);
});

onUnmounted(() => {
  if (mqPortrait && onPortraitChange) mqPortrait.removeEventListener('change', onPortraitChange);
});
</script>

<style scoped>
/* Подсказка «поверни телефон» — целиком одна кнопка «закрыть». Отклика на
   касание у неё намеренно нет: она исчезает от нажатия, а сжимать полноэкранную
   поверхность перед исчезновением — шум. Это единственное исключение из 5.3. */
.rotate-hint {
  position: fixed;
  inset: 0;
  /* Ниже экрана загрузки, но они никогда не видны вместе: подсказка ждёт, пока
     загрузка не снимется (mode === 'none'). Выше сцены и интерфейса. */
  z-index: var(--z-load);
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--void) 92%, transparent);
  color: var(--ink);
  user-select: none;
  cursor: pointer;
  pointer-events: auto;
  /* very faint diagonal guides — pure decor, no glow */
  background-image:
    repeating-linear-gradient(45deg, var(--fill-1) 0 1px, transparent 1px 46px),
    radial-gradient(130% 80% at 50% 120%,
      color-mix(in srgb, var(--pink) 12%, var(--void)) 0%, transparent 60%);
}
.rotate-hint * { box-sizing: border-box; margin: 0; }

.rh-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4vmin;
}

.rh-anim {
  position: relative;
  width: min(72vw, 360px);
  height: min(72vw, 360px);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* the single bloom — pink arc-arrow, static, wrapping the phone */
.rh-arc {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  /* ONE shadow, not two stacked: a second drop-shadow blurs the FIRST one's halo
     as well as the shape, compounding the bloom far past the line. Blur is kept at
     the line's own thickness so the halo edge never runs wider than the stroke. */
  filter: drop-shadow(0 0 4px color-mix(in srgb, var(--pink) 45%, transparent));
}

/* matte-chrome phone — hairline frame + glass fill, NO glow */
.rh-phone {
  position: relative;
  width: 34%;
  height: 62%;
  border: 2px solid var(--line-strong);
  /* Это РИСУНОК телефона, а не поверхность интерфейса: со скруглением 0 он
     перестаёт читаться как телефон. Форма изображения, не скругление UI. */
  border-radius: 20px;
  background: color-mix(in srgb, var(--carbon) 60%, transparent);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  transform-origin: center;
  /* Темп жеста — токен --d-hint (Правка 1.2 §2, группа 3): подсказка
     показывает действие, и скорость показа тоже часть смысла. */
  animation: rh-rotate var(--d-hint) var(--e-weight) infinite;
}
.rh-cam {
  position: absolute;
  top: 9px;
  left: 50%;
  transform: translateX(-50%);
  width: 22%;
  height: 5px;
  border-radius: 3px;
  background: var(--line-strong);
}

@keyframes rh-rotate {
  0%, 16%   { transform: rotate(0deg); }    /* hold portrait */
  44%, 70%  { transform: rotate(-90deg); }  /* swing to landscape + hold */
  100%      { transform: rotate(0deg); }    /* back to portrait */
}

.rh-label {
  font-family: var(--font-display);
  font-weight: 700;
  text-transform: uppercase;
  font-size: clamp(16px, 4.4vmin, 26px);
  letter-spacing: .06em;
  text-align: center;
  max-width: 86vw;
}
.rh-dismiss {
  font-size: clamp(11px, 2.6vmin, 14px);
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--ink-dim);
}

@media (prefers-reduced-motion: reduce) {
  .rh-phone { animation: none; transform: rotate(-90deg); }
}
</style>
