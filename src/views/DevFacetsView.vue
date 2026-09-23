<template>
  <!-- СКРЫТАЯ СТРАНИЦА-МАКЕТ ГРАНЕЙ (ТЗ 24.09.2026, правка вторая).
       Адрес /dev/facets, ниоткуда не линкуется, закрыта от поисковиков тегом
       robots (не через robots.txt — строка запрета там публична и работает как
       указатель). Ничего не встраивает в игру: зал FORGE не трогается, ростер
       не заменяется.

       ⚠️ ФИГУРА НЕ РИСУЕТСЯ ЗДЕСЬ. Ядро приходит компонентом HexCore — тем же,
       что стоит на лендинге, в деке и на экране входа. Грани и налив выведены
       из того же coreFigure() через src/data/coreFacetSlices.js. Второй
       отрисовки ядра в проекте быть не должно.

       СЛОВАРЬ: ветка — клин, грань — пятая часть клина, кристалл — то, что
       грань даёт бойцу. Кристаллы на ядре НЕ показываются: они живут только в
       списке под вынесенной гранью. -->
  <div class="fx" :data-state="state">
    <header class="fx-bar">
      <span class="fx-bar__title">ГРАНИ И КРИСТАЛЛЫ · МАКЕТ</span>
      <span class="fx-bar__step">{{ stepLabel }}</span>
      <!-- Служебный орган макета: в игру не пойдёт, нужен чтобы посмотреть
           клин пустым, наполовину и полным. -->
      <button type="button" class="fx-chip" @click="cycleFill">
        налив: {{ fillLabel }}
      </button>
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
            <!-- Налив. ОДНА обрезка на все три ветки: печать симметрична,
                 свет расходится из сердца кругом. Радиус приходит разметкой,
                 шаги — переходом со ступенчатой кривой (см. стили). -->
            <clipPath :id="id('flow')">
              <circle class="fx-flow-clip" cx="0" cy="0" r="1" :style="flowStyle" />
            </clipPath>

            <!-- Отклик на палец: мягкое пятно под пальцем. Это НЕ отметка
                 грани — в покое его нет, оно живёт только пока палец на месте. -->
            <radialGradient
              v-for="f in facets" :key="`g${f.key}`"
              :id="id('pool-' + f.key)"
              gradientUnits="userSpaceOnUse"
              cx="0" cy="0" r="1"
              :gradientTransform="`translate(${f.cx} ${f.cy}) rotate(${f.deg + 90}) scale(${POOL_ACROSS} ${POOL_ALONG})`"
            >
              <stop offset="0" stop-color="currentColor" stop-opacity="1" />
              <stop offset=".55" stop-color="currentColor" stop-opacity=".4" />
              <stop offset="1" stop-color="currentColor" stop-opacity="0" />
            </radialGradient>

            <!-- Свет внутри вынесенной грани. Идёт ТЕМ ЖЕ ПУТЁМ, что налив на
                 ядре: от сердца к концу ветки. Никаких отдельных отметок. -->
            <linearGradient
              v-if="selFacet"
              :id="id('shard')"
              gradientUnits="userSpaceOnUse"
              :x1="selFacet.near[0]" :y1="selFacet.near[1]"
              :x2="selFacet.far[0]" :y2="selFacet.far[1]"
            >
              <stop offset="0" stop-color="currentColor" stop-opacity=".85" />
              <stop offset="1" stop-color="currentColor" stop-opacity=".12" />
            </linearGradient>
          </defs>

          <!-- Пустое место: нажатие по нему возвращает назад. -->
          <rect class="fx-void" x="0" y="0" :width="box" :height="box" @click="onBackdrop" />

          <!-- ФИГУРА: ядро, налив и пустое гнездо. Двигается одним куском. -->
          <g class="fx-figure" :style="figureStyle" @click="onCoreTap">
            <!-- ⚠️ :fill ВЫКЛЮЧЕН НАВСЕГДА. Своё бегущее заполнение ядра —
                 бесконечная петля, а на макете наливом управляет переключатель.
                 Компонент при этом не правится: у него для этого есть своё
                 свойство. -->
            <HexCore mode="full" :hue="hue" :flicker="true" :fill="false" />

            <!-- Налив клиньев. Одна сплошная полоса на ветку, обрезанная
                 растущим кругом. ⚠️ ДЕЛЕНИЙ ВНУТРИ ВЕТКИ НЕТ: ни линий, ни
                 точек, ни отметок кристаллов. Шаги показывает движение, а не
                 рисунок (решение 22.09.2026, подтверждено 24.09.2026). -->
            <g class="fx-flow" :clip-path="`url(#${id('flow')})`">
              <polygon v-for="b in branches" :key="`fl${b.id}`" :points="b.strip" />
            </g>

            <!-- Пустое гнездо. Пока грань вынесена вперёд, на ядре её НЕТ:
                 видно, откуда её вынули. Гнездо не подсвечивается. -->
            <polygon
              v-if="state === 'open' && selFacet"
              class="fx-socket"
              :points="selFacet.points"
            />
          </g>

          <!-- Отклик на нажатие. ⚠️ ОТДЕЛЬНЫМ СЛОЕМ, а не на самой грани:
               грань в этот момент уже летит вперёд, и розовое улетало вместе
               с ней — к краю экрана, где читалось случайной плашкой. Здесь
               вспышка остаётся ТАМ, ГДЕ НАЖАЛИ. Единственное розовое на
               странице, живёт четверть секунды. -->
          <g v-if="flashFacet" class="fx-flash" :style="figureStyle" aria-hidden="true">
            <polygon :points="flashFacet.points" />
          </g>

          <!-- Пятнадцать граней. В покое у грани нет НИКАКОГО рисунка: она
               только зона нажатия. Рисунок появляется у той одной, что
               вынесена вперёд. -->
          <g
            v-for="f in facets" :key="f.key"
            class="fx-facet"
            :class="{ 'is-sel': sel === f.key }"
            :style="sel === f.key ? frontStyle(f) : figureStyle"
          >
            <polygon
              class="fx-facet__pool"
              :points="f.points"
              :fill="`url(#${id('pool-' + f.key)})`"
            />

            <!-- ОСКОЛОК. Матовая огранка: тёмное ребро по краю, чуть светлее
                 плоскость, свет внутри по правилу налива. Рамки нет — ровно
                 как нет рамки вокруг самого ядра. -->
            <template v-if="sel === f.key">
              <!-- Тело осколка. -->
              <polygon class="fx-shard__body" :points="f.points" />
              <!-- Четыре плоскости фаски. Ближняя к сердцу ловит больше света,
                   дальняя — меньше: ребро читается сменой тона, а не линией.
                   Тон нейтральный: сам предмет матово-серый, цвет ядра живёт
                   светом ВНУТРИ него, а не краской по нему. -->
              <polygon
                v-for="(bv, bi) in f.bevels" :key="`bv${bi}`"
                class="fx-shard__bevel" :class="BEVEL_FACE[bi]" :points="bv"
              />
              <!-- Плоскость грани и свет на ней. -->
              <polygon class="fx-shard__face" :points="f.inner" />
              <polygon
                v-if="isLit(f)"
                class="fx-shard__lit"
                :points="f.inner"
                :fill="`url(#${id('shard')})`"
              />
            </template>

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

/* Пятно отклика на палец. Поперёк клина — с запасом на его полуширину,
   вдоль — короче половины грани, чтобы свет не перетекал в соседнюю. */
const POOL_ACROSS = 19;
const POOL_ALONG = 11;

/* Насколько фигура вырастает на выборе, чтобы по грани можно было попасть
   пальцем. Ядро при этом НЕ ДВИГАЕТСЯ: рост идёт вокруг его середины.
   Числа разные, потому что кадр разный: в вертикали фигуру ограничивает
   ширина экрана, в горизонтали — высота. Выше этих значений фигура выходит
   за край кадра. */
const PICK_SCALE_PORTRAIT = 1.5;
const PICK_SCALE_LANDSCAPE = 1.33;

/* Куда уезжает ядро и куда выходит грань — в единицах холста (0…600).
   Грань вынесена — она главное на экране, поэтому крупная; ядро уходит мельче
   и выше, чтобы они не наезжали друг на друга. */
const BACK_SCALE = 0.34;
const BACK_LIFT = -150;
const FRONT_X = 300;
const FRONT_Y = 395;
const FRONT_SCALE = 6.6;

/* Плоскости фаски по порядку из coreFacetSlices: бок, дальний срез, бок,
   ближний к сердцу срез. Свет падает со стороны сердца. */
const BEVEL_FACE = ['is-side', 'is-far', 'is-side', 'is-near'];

/* Степени налива: пусто, частично, полностью. Числом это на экран не выходит
   ни разу — только словом. */
const FILL_STEPS = [
  { lit: 0, name: 'пусто' },
  { lit: 3, name: 'частично' },
  { lit: 5, name: 'полностью' },
];

const uid = useId();
const id = (name) => `fx-${name}-${uid}`;

const slices = coreFacetSlices('full');
const box = slices.box;
const branches = slices.branches;
const facets = branches.flatMap((b) => b.facets);
/* Все три ветки размечены одинаково — остановки берём у первой. */
const stops = branches[0].stops;

const hue = computed(() => `rgb(${accentRgb(CORE_ID).join(' ')})`);

/* rest — покой · pick — выбор грани · open — грань вынесена вперёд. */
const state = ref('rest');
const sel = ref(null);
const flash = ref(null);   // розовое — только на миг нажатия
let flashTimer = null;

/* Налив: по умолчанию полный, как ядро выглядит на лендинге в конце цикла. */
const fillStep = ref(FILL_STEPS.length - 1);
const fillLit = computed(() => FILL_STEPS[fillStep.value].lit);
const fillLabel = computed(() => FILL_STEPS[fillStep.value].name);
const cycleFill = () => { fillStep.value = (fillStep.value + 1) % FILL_STEPS.length; };
const isLit = (f) => f.id <= fillLit.value;

/* Радиус обрезки налива. Ступени даёт кривая перехода в стилях. */
const flowStyle = computed(() => ({
  transform: `translate(${box / 2}px, ${box / 2}px) scale(${stops[fillLit.value]})`,
}));

const gameBranches = CRYSTALS[CORE_ID];
const byId = (bid) => gameBranches.find((b) => b.id === bid);

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

/* Раскладка кадра. Читается один раз и обновляется на поворот: от неё
   зависит, насколько фигура может вырасти, не выйдя за край. */
const portrait = ref(true);
let mq = null;
const syncOrientation = () => { portrait.value = window.innerHeight >= window.innerWidth; };

const pickScale = computed(() => (
  portrait.value ? PICK_SCALE_PORTRAIT : PICK_SCALE_LANDSCAPE
));

/* ⚠️ ОБА КОНЦА ПЕРЕХОДА ЗАПИСАНЫ ОДИНАКОВО: translate · scale · translate.
   Покой — это НЕ 'none'. Браузер переходит между двумя записями по частям, и
   если в покое стоит 'none', каждая часть едет от своей единицы по отдельности:
   грань успевает вырасти раньше, чем доехать, и в середине перехода улетает
   за правый край экрана (поймано рендером). При одинаковой записи середина
   перехода — это ровно середина пути, и грань идёт по прямой. */
const hold = (x, y, k, ox, oy) =>
  `translate(${x}px, ${y}px) scale(${k}) translate(${-ox}px, ${-oy}px)`;

/* Фигура целиком: в покое как есть, на выборе крупнее (вокруг СВОЕЙ середины —
   с места не двигается), при вынесенной грани уходит назад. */
const figureStyle = computed(() => {
  const c = box / 2;
  if (state.value === 'open') return { transform: hold(c, c + BACK_LIFT, BACK_SCALE, c, c) };
  if (state.value === 'pick') return { transform: hold(c, c, pickScale.value, c, c) };
  return { transform: hold(c, c, 1, c, c) };
});

/* Выбранная грань: выходит вперёд из СВОЕГО места — видно, откуда взялась. */
const frontStyle = (f) => ({ transform: hold(FRONT_X, FRONT_Y, FRONT_SCALE, f.cx, f.cy) });

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
  if (state.value === 'open' && sel.value === f.key) { toPick(); return; }
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
  syncOrientation();
  mq = window.matchMedia('(orientation: portrait)');
  mq.addEventListener('change', syncOrientation);
  window.addEventListener('resize', syncOrientation);
});
onBeforeUnmount(() => {
  if (prevTitle !== null) document.title = prevTitle;
  if (robotsTag) robotsTag.remove();
  if (flashTimer) clearTimeout(flashTimer);
  window.removeEventListener('keydown', onKey);
  if (mq) mq.removeEventListener('change', syncOrientation);
  window.removeEventListener('resize', syncOrientation);
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
  container-type: size;
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

.fx-void { fill: transparent; }

/* Фигура и грани ездят одним свойством. Единицы px внутри transform равны
   единицам холста — это даёт transform-box. */
.fx-figure,
.fx-facet,
.fx-flash {
  transform-box: view-box;
  transform-origin: 0 0;
  transition: transform var(--d-panel) var(--e-weight),
              opacity var(--d-panel) var(--e-settle);
}
.fx-figure { cursor: pointer; }
.fx[data-state='open'] .fx-figure { opacity: .3; }

/* ── налив клина ──────────────────────────────────────────────────── */
.fx-flow polygon { fill: currentColor; fill-opacity: .9; }

/* ⚠️ Ступени даёт КРИВАЯ ПЕРЕХОДА, а не рисунок. Свет доходит до границы
   очередной пятой части, коротко встаёт и идёт дальше — как полоса загрузки,
   которая движется рывками. Делений на самой ветке нет и быть не должно
   (решение 22.09.2026, подтверждено 24.09.2026). */
.fx-flow-clip {
  transform-box: view-box;
  transform-origin: 0 0;
  transition: transform 1.3s steps(5, end);
}

/* Пустое гнездо: там, где грань вынута. Не подсвечивается, внимания не тянет. */
.fx-socket { fill: var(--void); pointer-events: none; }

/* ── грань ────────────────────────────────────────────────────────── */
/* Отклик на палец. В покое ноль: внутри клина нет никаких отметок. */
.fx-facet__pool {
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--d-hover) var(--e-settle);
}
.fx[data-state='pick'] .fx-facet:hover .fx-facet__pool,
.fx[data-state='pick'] .fx-facet:focus-within .fx-facet__pool { opacity: .75; }

/* Зона нажатия. Своего рисунка нет — ни заливки, ни линии. */
.fx-facet__hit {
  fill: transparent;
  stroke: none;
  cursor: pointer;
  outline: none;
}

/* Осколок. Матовая огранка: тёмное ребро по краю, чуть светлее плоскость.
   ⚠️ РАМКИ НЕТ — ровно как нет рамки вокруг самого ядра. Свечения и размытия
   тоже нет: фаска даётся двумя плоскостями, как у прочих предметов игры. */
.fx-shard__body { fill: var(--void); pointer-events: none; }
.fx-shard__face { fill: var(--panel); pointer-events: none; }
.fx-shard__lit { pointer-events: none; }
.fx-shard__bevel { pointer-events: none; }
/* Тона фаски — одним цветом разной силы, как свет на огранке. */
.fx-shard__bevel.is-near { fill: color-mix(in srgb, var(--ink) 13%, var(--panel)); }
.fx-shard__bevel.is-side { fill: color-mix(in srgb, var(--ink) 6%, var(--panel)); }
.fx-shard__bevel.is-far  { fill: color-mix(in srgb, var(--void) 55%, var(--panel)); }

.fx[data-state='open'] .fx-facet.is-sel { opacity: 1; }
.fx[data-state='open'] .fx-facet:not(.is-sel) { opacity: .3; }

/* Розовое — только на миг нажатия, дальше гаснет. */
.fx-flash polygon {
  fill: var(--pink);
  opacity: .75;
  pointer-events: none;
}

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
  .fx-figure,
  .fx-facet,
  .fx-flash,
  .fx-flow-clip,
  .fx-facet__pool,
  .fx-chip,
  .fx-back { transition: none !important; }
}
</style>
