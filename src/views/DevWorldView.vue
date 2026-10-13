<template>
  <!-- СКРЫТАЯ СТРАНИЦА-ПРОБА «ЖИВОЙ МИР» (ТЗ 13.10.2026, world diorama).
       Адрес /dev/world, ниоткуда не линкуется, закрыта от поисковиков тегом robots
       (не через robots.txt — строка запрета там публична и работает как указатель).

       Внутри — НАСТОЯЩИЙ дом игрока (HomeScene.vue, без единой правки): остров,
       бродящие бойцы, груши, свободная камера со стартовым ракурсом. Слой мира
       (worldLayer.js) подключается к его отрисовке снаружи, см. installHook ниже.
       Ростер здесь ВЫДУМАННЫЙ и передаётся свойством: страница не читает и не
       пишет прогресс игрока. -->
  <div class="dw">
    <HomeScene
      :core-hue="'#FF0069'"
      :core-id="null"
      :fighters="roster"
      :picked-id="'w0'"
    />

    <div class="dw-panel" role="group" aria-label="Слои мира">
      <button
        v-for="l in LAYERS" :key="l.id"
        type="button" class="dw-btn" :class="{ 'is-on': on[l.id] }" :title="l.id"
        :aria-pressed="on[l.id]"
        @click="toggle(l.id)"
      >{{ l.name }}</button>
      <div class="dw-read" aria-live="off">КАДР {{ read.renderMs }} мс · ИНТ {{ read.intervalMs }} · СЛОЁВ {{ read.layers }}</div>
    </div>
  </div>
</template>

<script setup>
import { reactive, onMounted, onBeforeUnmount } from 'vue';
import * as THREE from 'three';
import HomeScene from '@/scene/HomeScene.vue';
import { createWorld } from '@/scene/worldLayer.js';
import { getCore } from '@/data/upgradeData.js';

// Выдуманный ростер: шесть бойцов, двое заняты (у них груши — как на живом доме).
const CORE_IDS = ['natisk', 'nalet', 'skala', 'zasada', 'natisk', 'skala'];
const STATES = ['free', 'busy', 'free', 'free', 'busy', 'free'];
const roster = CORE_IDS.map((c, i) => ({ id: 'w' + i, coreId: c, hue: getCore(c).hue, state: STATES[i] }));

const LAYERS = [
  { id: 'sea', name: 'МОРЕ' },
  { id: 'ripple', name: 'РЯБЬ' },
  { id: 'clouds', name: 'ОБЛАКА' },
  { id: 'stars', name: 'ЗВЁЗДЫ' },
  { id: 'islands', name: 'ОСТРОВА' },
];
const on = reactive({ sea: true, ripple: true, clouds: true, stars: true, islands: true });
const read = reactive({ renderMs: '—', intervalMs: '—', layers: '5/5' });

let world = null;
const pending = { ...on }; // переключения, пришедшие раньше, чем мир собрался

function toggle(id) {
  on[id] = !on[id];
  pending[id] = on[id];
  if (world) world.setLayer(id, on[id]);
  read.layers = `${Object.values(on).filter(Boolean).length}/5`;
  samples.length = 0; intervals.length = 0; // старые замеры относились к другому набору слоёв
}

// ───────────────── подключение к отрисовке дома, снаружи ─────────────────
// HomeScene держит scene/camera/renderer у себя и наружу их не отдаёт. Чтобы НЕ
// править дом, страница ловит сцену в момент, когда дом кладёт в неё первую вещь
// (Object3D.prototype.add, на один раз), и дальше сидит на штатных крючках сцены
// onBeforeRender / onAfterRender — три вызывает их сам, и там уже лежат renderer и
// camera. Для встраивания в игру дому понадобится один шов (отдать наружу scene /
// camera / canvas); на пробе он не нужен, и общий код не тронут.
const objAdd = THREE.Object3D.prototype.add;
let captured = null;
THREE.Object3D.prototype.add = function addAndCapture(...objs) {
  if (!captured && this.isScene) {
    captured = this;
    THREE.Object3D.prototype.add = objAdd; // ловушка одноразовая
    hookScene(this);
  }
  return objAdd.apply(this, objs);
};

const samples = [];     // мс на кадр: тик мира + отрисовка + дожидание видеокарты
const intervals = [];   // мс между кадрами (как считает __homeProbe дома)
let lastStart = 0;
let frameStart = 0;
let syncMeasure = true; // gl.finish() после кадра: иначе замерили бы только постановку в очередь

const median = (a) => {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  return s[Math.floor(s.length / 2)];
};

function hookScene(scene) {
  scene.onBeforeRender = (renderer, _scene, camera) => {
    if (!world) {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      world = createWorld({ scene, camera, canvas: renderer.domElement, reduced });
      for (const [k, v] of Object.entries(pending)) world.setLayer(k, v);
    }
    frameStart = performance.now();
    world.tick();
  };
  scene.onAfterRender = (renderer) => {
    if (syncMeasure) renderer.getContext().finish();
    const t1 = performance.now();
    samples.push(t1 - frameStart); if (samples.length > 90) samples.shift();
    if (lastStart) { intervals.push(frameStart - lastStart); if (intervals.length > 90) intervals.shift(); }
    lastStart = frameStart;
  };
}

let readTimer = null;
let robotsTag = null;
let prevTitle = null;

onMounted(() => {
  prevTitle = document.title;
  document.title = 'World preview';
  robotsTag = document.createElement('meta');
  robotsTag.setAttribute('name', 'robots');
  robotsTag.setAttribute('content', 'noindex, nofollow, noarchive');
  document.head.appendChild(robotsTag);

  readTimer = setInterval(() => {
    read.renderMs = samples.length ? median(samples).toFixed(1) : '—';
    read.intervalMs = intervals.length ? median(intervals).toFixed(1) : '—';
  }, 500);

  // Служебная линейка приёмки: числа, которых не видно глазами. Только эта страница.
  window.__worldProbe = {
    get world() { return world; },
    setLayers(map) { for (const [k, v] of Object.entries(map)) { on[k] = v; pending[k] = v; if (world) world.setLayer(k, v); } samples.length = 0; intervals.length = 0; },
    /** Медиана и p90 мс на кадр за n кадров при текущем наборе слоёв. */
    measure(n = 120) {
      samples.length = 0; intervals.length = 0;
      return new Promise((resolve) => {
        const tick = () => {
          if (samples.length >= n) {
            const s = [...samples].sort((a, b) => a - b);
            resolve({ n: s.length, median: +median(samples).toFixed(2), p90: +s[Math.floor(s.length * 0.9)].toFixed(2), interval: +median(intervals).toFixed(2) });
          } else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    },
    setSync(v) { syncMeasure = !!v; },
  };
});

onBeforeUnmount(() => {
  THREE.Object3D.prototype.add = objAdd;
  if (captured) { captured.onBeforeRender = () => {}; captured.onAfterRender = () => {}; }
  clearInterval(readTimer);
  if (world) world.dispose();
  world = null; captured = null;
  delete window.__worldProbe;
  if (prevTitle !== null) document.title = prevTitle;
  if (robotsTag) robotsTag.remove();
});
</script>

<style scoped>
.dw {
  position: fixed;
  inset: 0;
  background: var(--void);
  color: var(--ink);
}

/* Пульт пробы: матовый хром вторичных кнопок (прямоугольник без скругления,
   Saira Condensed), без розового и без свечения. Стоит одной строкой под текстовым
   логотипом приложения (он стоит на всех не-игровых маршрутах, в том числе на
   /dev/*) и на телефоне остаётся в верхней полосе — центр кадра, где остров, чист. */
.dw-panel {
  position: absolute;
  top: 56px;
  left: var(--sp-3);
  right: var(--sp-3);
  z-index: var(--z-ui);
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
  pointer-events: none;
}
.dw-btn {
  flex: 1 1 0;
  min-width: 0;
  height: 28px;
  padding: 0 var(--sp-2);
  border: 1px solid var(--line);
  border-radius: 0;
  background: var(--fill-1);
  color: var(--ink-off);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: var(--t-sm);
  letter-spacing: var(--ls-title);
  text-transform: uppercase;
  white-space: nowrap;
  cursor: pointer;
  pointer-events: auto;
  transition: background var(--d-fast), border-color var(--d-fast), color var(--d-fast);
}
.dw-btn:hover { background: var(--fill-2); border-color: var(--line-strong); }
.dw-btn:active { transition-duration: var(--d-press); }
.dw-btn.is-on { color: var(--ink); border-color: var(--line-strong); background: var(--fill-2); }

.dw-read {
  flex: 1 0 100%;
  font-family: var(--font-mono);
  font-size: var(--t-micro);
  letter-spacing: 0.04em;
  color: var(--ink-dim);
  white-space: nowrap;
}
</style>
