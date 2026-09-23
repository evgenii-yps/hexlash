<template>
  <!-- СКРЫТАЯ СТРАНИЦА-МАКЕТ ГРАНЕЙ (ТЗ 24.09.2026).
       Адрес /dev/facets, ниоткуда не линкуется, закрыта от поисковиков тегом
       robots (не через robots.txt — строка запрета там публична и работает как
       указатель). Ничего не встраивает в игру: зал FORGE не трогается, ростер
       не заменяется. Задача — посмотреть интерфейс граней глазами.

       ⚠️ ФИГУРА НЕ РИСУЕТСЯ ЗДЕСЬ. Ядро приходит компонентом HexCore — тем же,
       что стоит на лендинге, в деке и на экране входа. Грани выведены из того
       же coreFigure() через src/data/coreFacetSlices.js. Второй отрисовки в
       проекте быть не должно.

       СЛОВАРЬ: ветка — клин, грань — пятая часть клина, кристалл — то, что
       грань даёт бойцу. -->
  <div class="fx" :data-state="state">
    <header class="fx-bar">
      <span class="fx-bar__title">ГРАНИ И КРИСТАЛЛЫ · МАКЕТ</span>
      <span class="fx-bar__step">{{ stepLabel }}</span>
      <button
        v-if="state !== 'rest'"
        type="button" class="fx-chip" @click="toRest"
      >сброс</button>
    </header>

    <main class="fx-page">
      <!-- ── ЯДРО ─────────────────────────────────────────────────── -->
      <section class="fx-stage">
        <!-- Затемнение вокруг ядра. Радиальное и во весь холст: краёв у него
             нет, границей оно не читается. Не панель и не окно. -->
        <div class="fx-dim" aria-hidden="true"></div>

        <svg
          class="fx-svg"
          :viewBox="`0 0 ${box} ${box}`"
          :style="{ color: hue }"
          @click.self="onBackdrop"
        >
          <defs>
            <!-- Свет грани. Пятно вытянуто ПОПЕРЁК клина и сходит в ноль
                 вдоль него — до среза соседней грани. Клин остаётся цельным:
                 шаги показывает свет, а не линии. -->
            <radialGradient
              v-for="f in facets" :key="`g${f.key}`"
              :id="`fxp-${uid}-${f.key}`"
              gradientUnits="userSpaceOnUse"
              cx="0" cy="0" r="1"
              :gradientTransform="`translate(${f.cx} ${f.cy}) rotate(${f.deg + 90}) scale(${POOL_ACROSS} ${POOL_ALONG})`"
            >
              <stop offset="0" stop-color="currentColor" stop-opacity="1" />
              <stop offset=".5" stop-color="currentColor" stop-opacity=".45" />
              <!-- ⚠️ НЕ НОЛЬ. Ровный слабый подсвет по всей грани держит клин
                   цельным: пятна становятся яркими МЕСТАМИ на сплошной ветке,
                   а не отдельными полосками с чёрными промежутками между ними.
                   На нуле ветка распадалась на лесенку — то же, что
                   перегородки, только светом. -->
              <stop offset="1" stop-color="currentColor" stop-opacity=".16" />
            </radialGradient>
          </defs>

          <!-- Пустое место: нажатие по нему возвращает в покой. -->
          <rect class="fx-void" x="0" y="0" :width="box" :height="box" @click="onBackdrop" />

          <!-- Ядро целиком. В покое — на своём месте; когда грань вынесена
               вперёд, уходит назад глубиной, а не исчезает. -->
          <g class="fx-core" :style="backStyle" @click="onCoreTap">
            <!-- ⚠️ :fill выключается на выборе СОЗНАТЕЛЬНО. Своё бегущее
                 заполнение ядра — тот же цвет и ярче: поверх него пятна граней
                 не видны вовсе (проверено рендером). Пока игрок выбирает,
                 свет несут грани, а ветка стоит тихой. Компонент при этом не
                 правится — выключателем, который у него уже есть. -->
            <HexCore mode="full" :hue="hue" :flicker="true" :fill="state === 'rest'" />
          </g>

          <!-- Отклик на нажатие. ⚠️ ОТДЕЛЬНЫМ СЛОЕМ, а не на самой грани:
               грань в этот момент уже летит вперёд, и розовое улетало вместе
               с ней — к краю экрана, где читалось случайной плашкой. Здесь
               вспышка остаётся ТАМ, ГДЕ НАЖАЛИ, и уходит назад вместе с ядром.
               Единственное розовое на странице и живёт четверть секунды. -->
          <g v-if="flashFacet" class="fx-flash" :style="backStyle" aria-hidden="true">
            <polygon :points="flashFacet.points" />
          </g>

          <!-- Пятнадцать граней. Каждая — своя фигура, но рисунка у неё нет:
               в покое она невидима и служит только зоной нажатия. -->
          <g
            v-for="f in facets" :key="f.key"
            class="fx-facet"
            :class="{ 'is-sel': sel === f.key }"
            :style="sel === f.key ? frontStyle(f) : backStyle"
          >
            <polygon
              class="fx-facet__lit"
              :points="f.points"
              :fill="`url(#fxp-${uid}-${f.key})`"
            />
            <!-- Край. Появляется ТОЛЬКО у вынесенной вперёд грани: отдельно
                 стоящий осколок обязан иметь край, иначе он читается пятном
                 света, а не куском ядра. Внутри фигуры края нет — там это
                 была бы перегородка. Толщина не растёт вместе с гранью:
                 vector-effect держит её в точках экрана. -->
            <polygon
              class="fx-facet__edge"
              :points="f.points"
              vector-effect="non-scaling-stroke"
            />
            <polygon
              class="fx-facet__hit"
              :points="f.points"
              role="button"
              tabindex="0"
              :aria-label="labelOf(f)"
              @click.stop="onFacetTap(f)"
              @keydown.enter.prevent="onFacetTap(f)"
              @keydown.space.prevent="onFacetTap(f)"
            />
          </g>
        </svg>
      </section>

      <!-- ── ПОДСКАЗКА / КРИСТАЛЛЫ ────────────────────────────────── -->
      <section class="fx-side">
        <p v-if="state !== 'open'" class="fx-hint">{{ hint }}</p>

        <div v-else class="fx-list">
          <header class="fx-list__head">
            <span class="fx-list__branch">{{ branchName }}</span>
            <h2 class="fx-list__name">{{ facetName }}</h2>
          </header>

          <ul class="fx-list__body">
            <li v-for="c in crystals" :key="c.name" class="fx-cry">
              <span class="fx-cry__mark" aria-hidden="true"></span>
              <div class="fx-cry__text">
                <h3 class="fx-cry__name">{{ c.name }}</h3>
                <p class="fx-cry__desc">{{ c.text }}</p>
              </div>
            </li>
          </ul>

          <button type="button" class="fx-back" @click="toPick">← назад к ядру</button>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, useId } from 'vue';
import HexCore from '@/components/core/HexCore.vue';
import { coreFacetSlices } from '@/data/coreFacetSlices.js';
import { accentRgb } from '@/data/coreCycle.js';
import { CRYSTALS } from '@/data/upgradeData.js';
import { crystalsOf } from '@/locales/facetCrystals.mockup.en.js';

/* Макет показан на ядре ONSLAUGHT: у него в данных игры уже есть имена веток
   и граней, и выдумывать вторые не нужно. Кристаллы — заглушки, см.
   src/locales/facetCrystals.mockup.en.js. */
const CORE_ID = 'natisk';

/* Световое пятно грани в единицах холста. Поперёк клина — с запасом на его
   полуширину (она идёт от 23 у сердца до 15 на конце), вдоль — короче половины
   грани (она ровно 28.35), чтобы у среза свет уже сошёл в ноль и шаг читался.
   Больше вдоль — пятна сливаются в сплошную полосу и грани пропадают. */
const POOL_ACROSS = 19;
const POOL_ALONG = 11;

/* Куда уезжает ядро и куда выходит грань — в единицах холста (0…600).
   Одна пара чисел на обе раскладки: холст квадратный, а поворот экрана
   раскладывает уже сам холст и список рядом с ним. */
const BACK_SCALE = 0.38;
const BACK_LIFT = -132;   // ядро уходит вверх, освобождая место грани
const FRONT_X = 300;
const FRONT_Y = 340;
const FRONT_SCALE = 3.4;

const uid = useId();

const slices = coreFacetSlices('full');
const box = slices.box;
const facets = slices.branches.flatMap((b) => b.facets);

const hue = computed(() => `rgb(${accentRgb(CORE_ID).join(' ')})`);

/* rest — покой · pick — выбор грани · open — грань вынесена вперёд. */
const state = ref('rest');
const sel = ref(null);
const flash = ref(null);   // розовое — только на миг нажатия
let flashTimer = null;

const branches = CRYSTALS[CORE_ID];
const byId = (id) => branches.find((b) => b.id === id);

const labelOf = (f) => {
  const b = byId(f.branchId);
  return `${b ? b.name : f.branchId} — ${b ? b.faces[f.id - 1].name : f.key}`;
};

const selFacet = computed(() => facets.find((f) => f.key === sel.value) || null);
const flashFacet = computed(() => facets.find((f) => f.key === flash.value) || null);
const branchName = computed(() => {
  const f = selFacet.value;
  const b = f && byId(f.branchId);
  return b ? b.name : '';
});
const facetName = computed(() => {
  const f = selFacet.value;
  const b = f && byId(f.branchId);
  return b ? b.faces[f.id - 1].name : '';
});
const crystals = computed(() => (sel.value ? crystalsOf(sel.value) : []));

const stepLabel = computed(() => (
  { rest: 'покой', pick: 'выбор грани', open: 'грань вынесена' }[state.value]
));
const hint = computed(() => (
  state.value === 'rest'
    ? 'Нажмите по ядру — грани станут выбираемыми.'
    : 'Выберите грань. Она выйдет вперёд, ядро уйдёт назад.'
));

/* ⚠️ ОБА КОНЦА ПЕРЕХОДА ЗАПИСАНЫ ОДИНАКОВО: translate · scale · translate.
   Покой — это НЕ 'none'. Браузер переходит между двумя записями по частям, и
   если в покое стоит 'none', каждая часть едет от своей единицы по отдельности:
   грань успевает вырасти раньше, чем доехать, и в середине перехода улетает
   за правый край экрана (поймано рендером). При одинаковой записи середина
   перехода — это ровно середина пути, и грань идёт по прямой. */
const hold = (x, y, k, ox, oy) =>
  `translate(${x}px, ${y}px) scale(${k}) translate(${-ox}px, ${-oy}px)`;

/* Ядро и невыбранные грани: уходят назад одним движением вокруг середины. */
const backStyle = computed(() => {
  const c = box / 2;
  return state.value === 'open'
    ? { transform: hold(c, c + BACK_LIFT, BACK_SCALE, c, c) }
    : { transform: hold(c, c, 1, c, c) };
});

/* Выбранная грань: выходит вперёд из СВОЕГО места — видно, откуда взялась. */
const frontStyle = (f) => ({
  transform: hold(FRONT_X, FRONT_Y, FRONT_SCALE, f.cx, f.cy),
});

function pulse(key) {
  flash.value = key;
  if (flashTimer) clearTimeout(flashTimer);
  flashTimer = setTimeout(() => { flash.value = null; }, 220);
}

function onCoreTap() {
  if (state.value === 'rest') { state.value = 'pick'; return; }
  if (state.value === 'open') toPick();
}
function onFacetTap(f) {
  if (state.value === 'rest') { state.value = 'pick'; pulse(f.key); return; }
  pulse(f.key);
  sel.value = f.key;
  state.value = 'open';
}
function onBackdrop() {
  if (state.value === 'open') toPick();
  else if (state.value === 'pick') toRest();
}
function toPick() { state.value = 'pick'; sel.value = null; }
function toRest() { state.value = 'rest'; sel.value = null; }

function onKey(e) {
  if (e.key !== 'Escape') return;
  if (state.value === 'open') toPick();
  else if (state.value === 'pick') toRest();
}

/* ── Страница закрыта от поисковиков ──────────────────────────────────
   Тегом, а не robots.txt: строка запрета в robots.txt публична и работает
   как указатель на скрытый адрес. */
let robotsTag = null;
let prevTitle = null;

onMounted(() => {
  prevTitle = document.title;
  document.title = 'Facets mockup';
  robotsTag = document.createElement('meta');
  robotsTag.setAttribute('name', 'robots');
  robotsTag.setAttribute('content', 'noindex, nofollow, noarchive');
  document.head.appendChild(robotsTag);
  window.addEventListener('keydown', onKey);
});
onBeforeUnmount(() => {
  if (prevTitle !== null) document.title = prevTitle;
  if (robotsTag) robotsTag.remove();
  if (flashTimer) clearTimeout(flashTimer);
  window.removeEventListener('keydown', onKey);
});
</script>

<style scoped>
/* Все значения — из src/styles/tokens.css. Своих чисел цвета здесь нет. */
/* ⚠️ Высота ЖЁСТКАЯ, а не минимальная. Макет — один экран: ядро, грань и
   кристаллы должны помещаться целиком, прокручивается только список.
   На min-height высота была неопределённой, доли (1fr, 100%) вниз по дереву
   не разрешались, и холст брал ширину колонки вместо высоты — страница
   вырастала выше экрана, кнопка возврата уезжала за край (замерено в
   горизонтали: высота .fx 655 при экране 390). */
.fx {
  height: 100vh;
  height: 100lvh;
  overflow: hidden;
  background: var(--void);
  color: var(--ink);
  font-family: var(--font-display);
  display: flex;
  flex-direction: column;

  /* Служебные адреса /dev/* показываются с общей шапкой приложения: она
     закреплена сверху и перекрывает всё, что стоит в нуле. */
  --fx-app-header: 70px;
  padding-top: var(--fx-app-header);
}

/* ── служебная полоса ─────────────────────────────────────────────── */
.fx-bar {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-2) var(--sp-4);
  background: var(--carbon);
  border-bottom: 1px solid var(--line);
  font-family: var(--font-mono);
  font-size: var(--t-micro);
  letter-spacing: var(--ls-meta);
  text-transform: uppercase;
}
.fx-bar__title { color: var(--ink-dim); }
.fx-bar__step { color: var(--ink-soft); margin-left: auto; }
.fx-chip {
  min-height: var(--h-btn-sm);
  padding: 0 var(--sp-3);
  border: 1px solid var(--line);
  background: var(--fill-1);
  color: var(--ink-soft);
  font: inherit;
  letter-spacing: inherit;
  cursor: pointer;
  transition: border-color var(--d-hover) var(--e-settle),
              color var(--d-hover) var(--e-settle);
}
.fx-chip:hover { border-color: var(--line-strong); color: var(--ink); }
.fx-chip:active { opacity: var(--o-dim); }

/* ── раскладка ────────────────────────────────────────────────────── */
.fx-page {
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  grid-template-rows: 1fr auto;
}

/* Горизонталь: холст слева, кристаллы справа — высоты мало, под фигуру
   список не влезает. */
@media (orientation: landscape) {
  .fx-page {
    grid-template-rows: 1fr;
    grid-template-columns: 1fr minmax(0, 20rem);
  }
}

.fx-stage {
  position: relative;
  min-height: 0;
  display: grid;
  place-items: center;
  overflow: hidden;
}

/* Затемнение вокруг ядра. Радиальное, во весь холст — краёв не видно. */
.fx-dim {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(
    circle at 50% 46%,
    transparent 0%,
    transparent 30%,
    color-mix(in srgb, var(--void) 70%, transparent) 72%,
    var(--void) 100%
  );
  opacity: .55;
  transition: opacity var(--d-panel) var(--e-settle);
}
.fx[data-state='pick'] .fx-dim,
.fx[data-state='open'] .fx-dim { opacity: 1; }

/* Холст квадратный и вписывается в МЕНЬШУЮ сторону сцены.
   ⚠️ Держится на том, что у .fx высота жёсткая: только тогда высота сцены
   определена и 100cqh разрешается. Вернёте .fx на min-height — здесь холст
   возьмёт ширину колонки, в горизонтали вылезет за экран и половина граней
   станет недоступной пальцу (поймано замером: холст 524 при экране 390).
   ⚠️ Пара height: auto + aspect-ratio обязательна. На height: 100% браузер
   разрешал высоту через ширину и давал 524×524 в горизонтали и 390×544 —
   даже не квадрат — в вертикали. */
.fx-svg {
  position: relative;
  display: block;
  width: min(100%, 100cqh);
  height: auto;
  max-width: 34rem;
  aspect-ratio: 1;
  overflow: visible;
}
.fx-stage { container-type: size; }

.fx-void { fill: transparent; }

/* Ядро и грани уходят назад / выходят вперёд одним свойством. Единицы px
   внутри transform равны единицам холста — это даёт transform-box. */
.fx-core,
.fx-facet {
  transform-box: view-box;
  transform-origin: 0 0;
  transition: transform var(--d-panel) var(--e-weight),
              opacity var(--d-panel) var(--e-settle);
}
.fx-core { cursor: pointer; }
.fx[data-state='open'] .fx-core { opacity: .3; }

/* Свет грани. В покое не горит вовсе: фигура остаётся собой. */
.fx-facet__lit {
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--d-panel) var(--e-settle);
}
.fx[data-state='pick'] .fx-facet__lit { opacity: .5; }
.fx[data-state='open'] .fx-facet__lit { opacity: .16; }
.fx[data-state='open'] .fx-facet.is-sel .fx-facet__lit { opacity: .95; }

/* Край вынесенной грани. Внутри фигуры не появляется никогда. */
.fx-facet__edge {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linejoin: round;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--d-panel) var(--e-settle);
}
.fx[data-state='open'] .fx-facet.is-sel .fx-facet__edge { opacity: .9; }

/* Зона нажатия. Своего рисунка нет — ни заливки, ни линии. */
.fx-facet__hit {
  fill: transparent;
  stroke: none;
  cursor: pointer;
  outline: none;
}
.fx[data-state='pick'] .fx-facet:hover .fx-facet__lit { opacity: .9; }
.fx-facet__hit:focus-visible + * { outline: none; }
.fx-facet:focus-within .fx-facet__lit { opacity: .9; }

/* Розовое — только на миг нажатия, дальше гаснет. */
.fx-flash { transform-box: view-box; transform-origin: 0 0; }
.fx-flash polygon {
  fill: var(--pink);
  opacity: .75;
  pointer-events: none;
}

.fx[data-state='open'] .fx-facet.is-sel { opacity: 1; }
.fx[data-state='open'] .fx-facet:not(.is-sel) { opacity: .3; }

/* ── подсказка и кристаллы ────────────────────────────────────────── */
.fx-side {
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: var(--sp-4);
  border-top: 1px solid var(--line);
}
@media (orientation: landscape) {
  .fx-side { border-top: 0; border-left: 1px solid var(--line); }
}

.fx-hint {
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--t-xs);
  letter-spacing: var(--ls-meta);
  color: var(--ink-soft);
  text-align: center;
}

/* ⚠️ flex: 1 1 auto + min-height: 0 обязательны оба. Без них колонка не
   сжимается под родителя, прокрутка достаётся не списку, а всему блоку — и
   кнопка возврата уезжает за нижний край (поймано рендером в горизонтали). */
.fx-list {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}
.fx-list__head { display: flex; flex-direction: column; gap: var(--sp-1); }
.fx-list__branch {
  font-family: var(--font-mono);
  font-size: var(--t-micro);
  letter-spacing: var(--ls-meta);
  color: var(--ink-off);
  text-transform: uppercase;
}
.fx-list__name {
  margin: 0;
  font-size: var(--t-lg);
  font-weight: 700;
  letter-spacing: var(--ls-title);
  text-transform: uppercase;
  color: var(--ink);
}

.fx-list__body {
  margin: 0;
  padding: 0;
  list-style: none;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}
.fx-cry { display: flex; gap: var(--sp-3); }
.fx-cry__mark {
  flex: 0 0 auto;
  width: var(--sp-2);
  height: var(--sp-2);
  margin-top: .45em;
  background: currentColor;
  color: v-bind(hue);
}
.fx-cry__text { min-width: 0; }
.fx-cry__name {
  margin: 0 0 var(--sp-1);
  font-size: var(--t-sm);
  font-weight: 700;
  letter-spacing: var(--ls-meta);
  text-transform: uppercase;
  color: var(--ink);
}
.fx-cry__desc {
  margin: 0;
  max-width: 46ch;
  font-family: var(--font-mono);
  font-size: var(--t-xs);
  line-height: 1.55;
  color: var(--ink-soft);
}

.fx-back {
  flex: 0 0 auto;
  align-self: flex-start;
  min-height: var(--h-btn-sm);
  padding: 0 var(--sp-3);
  border: 1px solid var(--line);
  background: var(--fill-1);
  color: var(--ink-soft);
  font-family: var(--font-mono);
  font-size: var(--t-micro);
  letter-spacing: var(--ls-meta);
  text-transform: uppercase;
  cursor: pointer;
  transition: border-color var(--d-hover) var(--e-settle),
              color var(--d-hover) var(--e-settle);
}
.fx-back:hover { border-color: var(--line-strong); color: var(--ink); }
.fx-back:active { opacity: var(--o-dim); }

/* «Уменьшить движение»: переходов нет, конечное состояние то же.
   Отклик на нажатие остаётся — он не украшение. */
@media (prefers-reduced-motion: reduce) {
  .fx-dim,
  .fx-core,
  .fx-facet,
  .fx-facet__lit,
  .fx-chip,
  .fx-back { transition: none !important; }
}
</style>
