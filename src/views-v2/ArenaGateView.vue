<!-- ArenaGateView — /play/gate: ВОРОТА АРЕНЫ, пространство за дверью ARENA.

     Путь целиком, каким он станет: дом → FIGHT → острова режимов → дверь ARENA →
     пролёт камеры внутрь острова → чёрный кадр → экран загрузки → растемнение
     ВМЕСТЕ с подлётом камеры → острова выбора режима → острова выбора бойцов →
     объёмная кнопка старта → арена.

     ЧТО ЗДЕСЬ ВЫБИРАЮТ. Первые острова — режим боя: DUEL живой, SQUAD заперт с
     подписью SOON. Подписи стоят DOM-текстом поверх настоящих островов в 3D, а не
     нарисованы в сцене: текст обязан оставаться чётким на любом экране, а место
     ему каждый кадр считает сама сцена (gatePlateTags).

     ОТКАЗ. Клик по запертому острову никуда не ведёт: остров коротко дрожит
     вместе со своей подписью. Дрогнувшая плита при неподвижном имени читалась бы
     как сбой отрисовки, а не как «нельзя».

     ⚠️ ВРЕМЕННАЯ ПЕРЕАДРЕСАЦИЯ СНЯТА. До появления островов ворота сразу уводили
     игрока на плоский выбор состава — иначе путь в бой обрывался бы. Теперь в
     пространстве есть что делать, и уходит из него выбор режима. `?stay=1`
     остался служебной ручкой: с ним выбор режима не меняет адрес.

     Хром: та же полоса .hs-strip (home.css), что в зале FORGE и в пространстве,
     без брендового блока — ← BACK слева, SHOP + кабинет справа. Свои значения ей
     не нужны: .hs-chrome читает глобальные токены. Прижать правый кластер всё же
     приходится здесь — полоса разносит края, а слева брендового блока нет. -->
<template>
  <div class="gate-root" :class="{ 'is-diving': diving }">
    <ArenaGateScene
      @arrived="onArrived"
      @dive-start="onDiveStart"
      @pick="onPick"
      @refused="onRefused"
    />

    <!-- Подписи островов. Позицию каждый кадр пишет сцена; здесь только текст.
         aria-hidden: это ярлык предмета в сцене, а не отдельная кнопка — нажимают
         сам остров. -->
    <div
      v-for="m in MODES"
      :key="m.id"
      class="gate-cap"
      :class="{
        'is-lit': tags.hovered === m.id,
        'is-locked': m.locked,
        'is-refused': tags.refused === m.id,
      }"
      :style="{ transform: `translate3d(${tags[m.id].x}px, ${tags[m.id].y}px, 0)` }"
      aria-hidden="true"
    >
      <div class="gc-card" :class="{ 'is-shown': !diving && tags[m.id].visible }">
        <span class="gc-name">{{ m.name }}</span>
        <span class="gc-desc">{{ m.tagline }}</span>
        <span v-if="m.locked" class="gc-soon">{{ t.gate.soon }}</span>
      </div>
    </div>

    <div class="hs-strip">
      <button type="button" class="hs-chrome gate-back" @click="goBack" :aria-label="t.home.back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
        <span class="n">{{ t.home.back }}</span>
      </button>
      <div class="hs-cluster">
        <button type="button" class="hs-chrome hs-seg-shop" @click="goShop" :aria-label="t.home.shop">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M5 8h14l-1 11H6L5 8Z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></svg>
          <span class="n">{{ t.home.shop }}</span>
        </button>
        <button type="button" class="hs-chrome hs-seg-cab" @click="cabinetOpen = true" :aria-label="t.cabinet.chipOpen">
          <span class="av" aria-hidden="true"></span>
        </button>
      </div>
    </div>

    <PlayerCabinet
      :open="cabinetOpen"
      :balance="balance"
      :core-name="coreName"
      :core-sig="coreSig"
      @close="cabinetOpen = false"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import store from '@/core/state/store.js';
import { t } from '@/locales/index.js';
import { getCore } from '@/data/upgradeData.js';
import ArenaGateScene from '@/scene/ArenaGateScene.vue';
import PlayerCabinet from '@/views-v2/PlayerCabinet.vue';
import { ARENA_MODES } from '@/data/arenaModes.js';
import { gatePlateTags } from '@/scene/gatePlateTags.js';
import '@/styles/home.css';
import '@/styles/cabinet.css';

const router = useRouter();
const route = useRoute();

const cabinetOpen = ref(false);
const diving = ref(false);

const MODES = ARENA_MODES;
const tags = gatePlateTags;

// Служебная ручка: с ?stay=1 выбор режима запоминается, но адрес не меняется —
// можно рассматривать пространство, не улетая из него.
const stay = route.query.stay === '1';

function onArrived() { /* подлёт доехал — сцена сама включила выбор */ }

// Камера тронулась внутрь острова. Растворяем свой хром — по классу, чтобы он
// ушёл, а не пропал: пропажа в кадр читается как сбой, растворение — как уход.
function onDiveStart() { diving.value = true; }

// Камера доехала внутрь острова: режим выбран. Кладём его в сейф ДО перехода —
// экран состава спрашивает у него, сколько бойцов набирать.
function onPick(id) {
  store.commit('prefight/SET_MODE', id);
  if (stay) { diving.value = false; return; }
  router.push('/play');
}

// Клик по запертому острову. Дрожит сцена, вид только отзывается подписью —
// поэтому здесь ничего делать не нужно, кроме как не мешать.
function onRefused() {}

function goBack() { router.push('/play/mode'); }
function goShop() { router.push({ path: '/play/home', query: { view: 'shop' } }); }

// Кабинет просит те же три вещи, что и в остальных залах.
const master = computed(() => store.getters['master/getMaster']);
const balance = computed(() => master.value?.userData?.balance ?? 0);
const coreId = computed(() => store.getters['prefight/selectedCoreId'] || null);
const core = computed(() => (coreId.value ? getCore(coreId.value) : null));
const coreName = computed(() => core.value?.name || '');
const coreSig = computed(() => core.value?.sig || '');
</script>

<style scoped>
.gate-root {
  position: absolute; inset: 0; overflow: hidden;
  background: var(--void); color: var(--ink);
  font-family: var(--font-display);
}

/* Брендового блока нет → правый кластер прижимаем сами: .hs-strip разносит
   содержимое по краям, и без левого блока кластер уехал бы в начало. Правка
   локальная — home.css общий и остаётся нетронутым (так же в зале и в
   пространстве). */
.hs-cluster { margin-left: auto; }

/* Хром растворяется, когда камера тронулась внутрь острова. Тот же приём, что на
   экране режимов: уход, а не пропажа. */
.gate-root.is-diving .hs-strip {
  opacity: 0; pointer-events: none;
  transition: opacity var(--d-hover) var(--e-weight);
}

/* ── подписи островов ───────────────────────────────────────────────────────
   Семья та же, что у подписей островов дома (.mode-cap / .mc-* в HomeView): это
   один язык — имя крупным дисплейным, строка под ним моноширинным. Свои классы, а
   не общие: там подписи живут внутри домашней сцены и завязаны на её состояния,
   и один файл на две двери разошёлся бы на первой правке. */
.gate-cap {
  position: absolute; left: 0; top: 0; width: 0; height: 0;
  z-index: 9; pointer-events: none; will-change: transform;
}
.gc-card {
  position: absolute; left: 0; top: 0;
  transform: translate(-50%, 6px);
  display: flex; flex-direction: column; align-items: center; gap: var(--sp-1);
  white-space: nowrap; text-align: center;
  opacity: 0;
  transition: opacity var(--d-hover) var(--e-weight), transform var(--d-hover) var(--e-weight);
}
.gc-card.is-shown { opacity: 1; }
.gc-name {
  font-family: var(--font-display);
  font-weight: 900; font-size: var(--t-3xl); line-height: 0.9;
  letter-spacing: var(--ls-tight); text-transform: uppercase;
  color: var(--ink);
}
.gc-desc {
  font-family: var(--font-mono);
  font-size: var(--t-xs); letter-spacing: var(--ls-meta); text-transform: uppercase;
  color: var(--ink-off);
  transition: color var(--d-hover) var(--e-weight);
}
.gate-cap.is-lit .gc-desc { color: var(--ink-dim); }

/* Запертый читается приглушением, а не перечёркиванием: остров не сломан, он
   просто ещё не открыт. Метка SOON — матовая, своего свечения у неё нет. */
.gate-cap.is-locked .gc-name { color: var(--ink-off); }
.gate-cap.is-locked .gc-desc { color: var(--ink-dim); opacity: 0.55; }
.gc-soon {
  margin-top: var(--sp-1);
  font-family: var(--font-mono); font-size: var(--t-micro); font-weight: 700;
  letter-spacing: var(--ls-wide); text-transform: uppercase;
  color: var(--ink-soft);
  padding: var(--sp-1) var(--sp-3);
  background: linear-gradient(180deg, var(--line), var(--fill-1));
  border: 1px solid var(--line-strong);
}

/* Отказ — подпись дрожит заодно с островом. Амплитуда меньше, чем у плиты: текст
   мельче, и та же величина на нём читалась бы как рябь. */
.gate-cap.is-refused .gc-card { animation: gateRefuse 380ms var(--e-weight); }
@keyframes gateRefuse {
  0%, 100% { transform: translate(-50%, 6px); }
  15%  { transform: translate(calc(-50% - 5px), 6px); }
  38%  { transform: translate(calc(-50% + 4px), 6px); }
  61%  { transform: translate(calc(-50% - 3px), 6px); }
  84%  { transform: translate(calc(-50% + 2px), 6px); }
}
@media (prefers-reduced-motion: reduce) {
  .gate-cap.is-refused .gc-card { animation: none; }
}

@media (max-width: 560px) {
  .gc-name { font-size: var(--t-xl); }
  .gc-desc { font-size: var(--t-micro); letter-spacing: var(--ls-title); }
}
</style>
