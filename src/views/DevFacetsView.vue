<template>
  <!-- СКРЫТАЯ СТРАНИЦА-МАКЕТ ГРАНЕЙ И КРИСТАЛЛОВ (ТЗ 24.09.2026, правка пятая).
       Адрес /dev/facets, ниоткуда не линкуется, закрыта от поисковиков тегом
       robots (не через robots.txt — строка запрета там публична и работает как
       указатель). В игру ничего не встраивает: зал FORGE не трогается.

       ⚠️ СЛОВАРЬ ИСПРАВЛЕН. Грань — весь луч целиком, длинный клин от сердца
       до кромки; их ТРИ. Кристалл — один из пяти шагов внутри грани; их
       ПЯТНАДЦАТЬ. В правках 1–4 эти два слова стояли наоборот.

       ⚠️ ФИГУРА НЕ РИСУЕТСЯ ЗДЕСЬ. Ядро приходит компонентом HexCore — тем же,
       что стоит на лендинге, в деке и на экране входа. Грани, кристаллы и
       налив выведены из того же coreFigure() через coreFacets.js. Смена
       словаря не потребовала менять в общей фигуре ни одного числа. -->
  <div class="fx" :data-state="state">
    <header class="fx-bar">
      <span class="fx-bar__title">ГРАНИ И КРИСТАЛЛЫ · МАКЕТ</span>
      <span class="fx-bar__step">{{ stepLabel }}</span>
      <!-- Служебные органы макета. В игру не идут: там право даёт занятие. -->
      <button type="button" class="fx-chip" @click="rights += 1">выдать право</button>
      <button type="button" class="fx-chip" @click="resetAll">сбросить всё</button>
    </header>

    <main class="fx-page">
      <section class="fx-stage">
        <!-- Затемнение вокруг ядра. Радиальное и во весь холст: краёв у него
             нет, границей оно не читается. -->
        <div class="fx-dim" aria-hidden="true"></div>

        <svg
          class="fx-svg"
          :viewBox="`0 0 ${box} ${box}`"
          :style="{ color: hue }"
        >
          <defs>
            <!-- Налив грани. Растущий круг обрезает её горящую часть: сколько
                 кристаллов зажжено, до того шага и дошёл свет. Ступени даёт
                 кривая перехода, а не рисунок — делений внутри грани нет. -->
            <clipPath v-for="f in facets" :key="`cf${f.id}`" :id="id('flow-' + f.id)">
              <circle class="fx-flow-clip" cx="0" cy="0" r="1" :style="flowStyle(f)" />
            </clipPath>

            <!-- Свет внутри кристалла: от сердца к концу грани. -->
            <linearGradient
              v-for="c in crystals" :key="`cg${c.key}`"
              :id="id('lit-' + c.key)" gradientUnits="userSpaceOnUse"
              :x1="c.near[0]" :y1="c.near[1]" :x2="c.far[0]" :y2="c.far[1]"
            >
              <stop offset="0" stop-color="currentColor" stop-opacity=".9" />
              <stop offset="1" stop-color="currentColor" stop-opacity=".25" />
            </linearGradient>
          </defs>

          <!-- Пустое место. Отпустил здесь — не выбрано ничего и ничего не
               изменилось: возврат живёт на кнопке, Esc и на ушедшем назад
               предмете, а не на промахе. -->
          <rect class="fx-void" x="0" y="0" :width="box" :height="box" />

          <!-- ЯДРО: фигура, налив и пустое гнездо вынесенной грани. -->
          <g class="fx-core" :style="coreStyle">
            <!-- ⚠️ :fill выключен: своё бегущее заполнение ядра — бесконечная
                 петля, а здесь наливом управляет зажигание кристаллов.
                 Компонент при этом не правится: у него для этого есть своё
                 свойство. -->
            <HexCore mode="full" :hue="hue" :flicker="true" :fill="false" />

            <g v-for="f in facets" :key="`fl${f.id}`" :clip-path="`url(#${id('flow-' + f.id)})`">
              <polygon class="fx-flow" :points="f.strip" />
            </g>

            <!-- Пустое гнездо: пока грань вынесена, на ядре её нет. -->
            <polygon v-if="selFacet" class="fx-socket" :points="selFacet.points" />

            <!-- ⚠️ ВЕДЕНИЕ, А НЕ ТЫЧОК. Палец водит по ядру — под ним
                 подсвечивается ЦЕЛАЯ ГРАНЬ; отпустил — она и выбрана.
                 ⚠️ Слушаем pointerdown, а не только pointermove: на телефоне
                 при касании ведения не приходит вовсе (замерено). -->
            <polygon
              class="fx-pad" :points="plate"
              @pointerdown="onCoreDown" @pointermove="onCoreMove"
              @pointerup="onCoreUp" @pointercancel="clearGuide"
              @pointerleave="clearGuide"
            />
          </g>

          <!-- ТРИ ГРАНИ. На ядре у грани нет своего рисунка — только подсветка
               под пальцем. Огранка появляется у той одной, что вынесена. -->
          <g
            v-for="f in facets" :key="f.id"
            class="fx-facet"
            :class="{ 'is-sel': sel === f.id, 'is-guided': guideFacetId === f.id }"
            :style="sel === f.id ? facetStyle : coreStyle"
          >
            <!-- Подсветка под пальцем — вся грань целиком, от сердца до кромки.
                 НЕ цветом ядра: цветом ядра показан налив, и подсвеченная
                 незажжённая грань читалась бы зажжённой. И не розовая:
                 показ будущего выбора — ещё не действие. -->
            <polygon class="fx-facet__glow" :points="f.points" />

            <template v-if="sel === f.id">
              <!-- Вынесенная грань — ТОТ ЖЕ длинный клин, что был на ядре:
                   сужается к концу, узнаётся как та самая деталь. -->
              <polygon class="fx-shard__body" :points="f.points" />
              <polygon
                v-for="(bv, bi) in f.bevels" :key="`fb${bi}`"
                class="fx-bevel" :class="FACET_BEVEL[bi]" :points="bv"
              />
              <polygon class="fx-shard__face" :points="f.inner" />

              <!-- Тот же приём уровнем глубже: ведём по вынесенной грани —
                   подсвечивается один кристалл целиком. -->
              <polygon
                class="fx-cpad" :points="f.points"
                @pointerdown="onFacetDown" @pointermove="onFacetMove"
                @pointerup="onFacetUp" @pointercancel="clearGuide"
                @pointerleave="clearGuide"
              />
            </template>

            <polygon
              class="fx-facet__key" :points="f.points"
              role="button" tabindex="0" :aria-label="facetName(f)"
              @keydown.enter.prevent="chooseFacet(f)"
              @keydown.space.prevent="chooseFacet(f)"
              @focus="guide = { kind: 'facet', key: f.id }"
              @blur="clearGuide"
            />
          </g>

          <!-- ПЯТНАДЦАТЬ КРИСТАЛЛОВ. Видны только внутри вынесенной грани:
               пять гнёзд по её длине, в каждом один кристалл. -->
          <g
            v-for="c in selCrystals" :key="c.key"
            class="fx-cryst"
            :class="{
              'is-sel': cry === c.index,
              'is-guided': guideCryIndex === c.index,
              'is-lit': isLit(c),
              'is-spent': !isLit(c) && litCount >= CAP,
            }"
            :style="cry === c.index ? crystalStyle(c) : facetStyle"
          >
            <polygon class="fx-shard__body" :points="c.points" />
            <polygon
              v-for="(bv, bi) in c.bevels" :key="`cb${bi}`"
              class="fx-bevel" :class="CRY_BEVEL[bi]" :points="bv"
            />
            <polygon class="fx-shard__face" :points="c.inner" />
            <polygon
              v-if="isLit(c)" class="fx-shard__lit"
              :points="c.inner" :fill="`url(#${id('lit-' + c.key)})`"
            />
            <polygon class="fx-cryst__glow" :points="c.inner" />

            <!-- Подпись — своя у каждого кристалла, сбоку от его гнезда:
                 грань длинная и узкая, под гнездом места нет. -->
            <text
              v-if="cry !== c.index"
              class="fx-cryst__name"
              :x="c.labX" :y="c.labY"
              :transform="`rotate(${-facetTurn(selFacet)} ${c.labX} ${c.labY})`"
              :style="{ fontSize: `${c.labSize}px` }"
            >{{ crystalName(c) }}</text>

            <polygon
              class="fx-cryst__key" :points="c.points"
              role="button" tabindex="0" :aria-label="crystalName(c)"
              @keydown.enter.prevent="chooseCrystal(c)"
              @keydown.space.prevent="chooseCrystal(c)"
              @focus="guide = { kind: 'crystal', key: c.index }"
              @blur="clearGuide"
            />
          </g>

          <!-- Отклик на выбор. ⚠️ ОТДЕЛЬНЫМ СЛОЕМ И ПОСЛЕДНИМ В ПОРЯДКЕ.
               Отдельным — потому что предмет в этот момент уже летит вперёд, и
               розовое улетало вместе с ним. Последним — потому что летящий
               предмет стартует ровно с места вспышки и закрывал её собой.
               Вспышка остаётся ТАМ, ГДЕ ОТПУСТИЛИ, и живёт четверть секунды.
               Это единственное розовое на странице. -->
          <g v-if="flash" class="fx-flash" :style="flashStyle" aria-hidden="true">
            <polygon :points="flash.points" />
          </g>
        </svg>
      </section>

      <!-- ── ПАНЕЛЬ: подсказка · имя · описание ─────────────────────── -->
      <section class="fx-side">
        <p v-if="state === 'rest'" class="fx-hint">{{ hint }}</p>

        <div v-else class="fx-panel">
          <header class="fx-panel__head">
            <span class="fx-panel__kicker">{{ facetName(selFacet) }}</span>
            <h2 class="fx-panel__name">
              {{ state === 'crystal' ? crystalName(selCrystal) : facetName(selFacet) }}
            </h2>
          </header>

          <div class="fx-panel__body">
            <p v-if="state === 'facet'" class="fx-hint fx-hint--left">{{ facetHint }}</p>
            <p v-else class="fx-panel__desc">{{ cryText }}</p>
          </div>

          <div class="fx-panel__foot">
            <button
              v-if="state === 'crystal' && canLight"
              type="button" class="fx-light" @click="lightUp"
            >зажечь</button>
            <p v-else-if="state === 'crystal'" class="fx-why">{{ whyNot }}</p>
            <button type="button" class="fx-back" @click="goBack">{{ backLabel }}</button>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, useId } from 'vue';
import HexCore from '@/components/core/HexCore.vue';
import { coreFacets } from '@/data/coreFacets.js';
import { accentRgb } from '@/data/coreCycle.js';
import { CRYSTALS } from '@/data/upgradeData.js';
import { crystalText } from '@/locales/crystals.mockup.en.js';

/* Макет показан на ядре ONSLAUGHT: у него в данных игры уже лежат имена трёх
   граней и пятнадцати кристаллов. Описания — заглушки, см. crystals.mockup. */
const CORE_ID = 'natisk';

/* Потолок: пять зажжённых КРИСТАЛЛОВ на бойца, как угодно разложенных по трём
   граням. Цифрой на экран не выходит ни разу — сколько осталось, видно по
   налитому ядру. */
const CAP = 5;

/* Три уровня глубины, один приём на всех: выбранное выходит вперёд, остальное
   уходит назад. Числа — в единицах холста (0…600), выверены так, чтобы ни
   предмет, ни подписи не выходили за край в обеих раскладках. */
const L = {
  /* грань вынесена: длинный клин стоит слева, подписи кристаллов — справа */
  facet: { x: 210, y: 332, k: 2.3, coreLift: -238, coreK: 0.18 },
  /* кристалл вынесен: грань отходит влево и мельчает, ядро уходит ещё дальше */
  crystal: { x: 372, y: 300, k: 11, facetX: 100, facetY: 322, facetK: 0.95, coreLift: -252, coreK: 0.14 },
};

/* Плоскости фаски по порядку рёбер из coreFacets. Свет со стороны сердца.
   У грани рёбер шесть (клин), у кристалла четыре (гнездо). */
const FACET_BEVEL = ['is-side', 'is-side', 'is-far', 'is-side', 'is-side', 'is-near'];
const CRY_BEVEL = ['is-side', 'is-far', 'is-side', 'is-near'];

/* Сколько места остаётся подписи справа от грани, в единицах холста. */
const LABEL_ROOM = 290;
/* Доля ширины знака к кеглю у моноширинного шрифта. */
const GLYPH_W = 0.62;

const uid = useId();
const id = (n) => `fx-${n}-${uid}`;

const fig = coreFacets('full');
const box = fig.box;
const plate = fig.plate;
const facets = fig.facets;
const crystals = facets.flatMap((f) => f.crystals);
const stops = facets[0].stops;

const hue = computed(() => `rgb(${accentRgb(CORE_ID).join(' ')})`);

/* rest · facet (грань вынесена) · crystal (кристалл вынесен) */
const state = ref('rest');
const sel = ref(null);      // ключ грани: a · b · c
const cry = ref(null);      // номер кристалла внутри неё: 0…4

/* Что сейчас под пальцем. Подсвечена ВСЕГДА ОДНА единица: на ядре — ЦЕЛАЯ
   ГРАНЬ (кристаллы на ядре не подсвечиваются и не выбираются никогда), на
   вынесенной грани — один кристалл. { kind: 'facet'|'crystal', key }. */
const guide = ref(null);
const clearGuide = () => { guide.value = null; };
const guideFacetId = computed(() => (guide.value?.kind === 'facet' ? guide.value.key : null));
const guideCryIndex = computed(() => (guide.value?.kind === 'crystal' ? guide.value.key : null));

/* Зажжённое: множество ключей кристаллов (a1 … c5). */
const lit = ref({});
const rights = ref(0);
const litCount = computed(() => Object.keys(lit.value).length);
const isLit = (c) => !!lit.value[c.key];

/* Налив грани. Зажёгся кристалл — прибавился ОДИН шаг света, и свет идёт
   непрерывно от сердца: делений внутри грани нет, ступени даёт кривая
   перехода. Считаем зажжённые в этой грани, а не номер последнего: иначе
   между зажжёнными остались бы тёмные провалы, а налив должен быть сплошным. */
const facetLitCount = (f) => f.crystals.filter((c) => isLit(c)).length;
const flowStyle = (f) => ({
  transform: `translate(${box / 2}px, ${box / 2}px) scale(${stops[facetLitCount(f)]})`,
});

const gameFacets = CRYSTALS[CORE_ID];
const gameFacet = (fid) => gameFacets.find((b) => b.id === fid) || null;
const facetName = (f) => (f ? (gameFacet(f.id)?.name || f.id) : '');
const crystalName = (c) => (c ? (gameFacet(c.facetId)?.faces[c.index]?.name || c.key) : '');

const selFacet = computed(() => facets.find((f) => f.id === sel.value) || null);
const selCrystals = computed(() => selFacet.value?.crystals || []);
const selCrystal = computed(() => (cry.value === null ? null : selCrystals.value[cry.value] || null));
const cryText = computed(() => (selCrystal.value ? crystalText(selCrystal.value.key) : ''));

/* Кегль подписи ужимается под место справа от грани, если имя длинное:
   иначе «BUILDING MOMENTUM» уезжает за край холста. */
const labFont = (c) => {
  const n = crystalName(c).length || 1;
  return +Math.min(c.labSize, (LABEL_ROOM / L.facet.k) / (GLYPH_W * n)).toFixed(3);
};

const stepLabel = computed(() => ({
  rest: 'покой', facet: 'грань вынесена', crystal: 'кристалл вынесен',
}[state.value]));
const hint = 'Ведите пальцем по ядру — под пальцем подсветится грань. Отпустите — она выйдет вперёд.';
const facetHint = computed(() => (litCount.value >= CAP
  ? 'Больше кристаллов боец не удержит.'
  : 'Ведите по грани — подсветится кристалл. Отпустите — он выйдет вперёд.'));
const backLabel = computed(() => (state.value === 'crystal' ? '← назад к грани' : '← назад к ядру'));

/* Зажечь можно, пока кристалл не горит, есть право и потолок не выбран. */
const canLight = computed(() => (
  state.value === 'crystal'
  && selCrystal.value
  && !isLit(selCrystal.value)
  && rights.value > 0
  && litCount.value < CAP
));
const whyNot = computed(() => {
  if (selCrystal.value && isLit(selCrystal.value)) return 'Этот кристалл горит.';
  if (litCount.value >= CAP) return 'Больше кристаллов боец не удержит.';
  return 'Право зажечь кристалл боец получает за занятие.';
});

/* ⚠️ ВСЕ КОНЦЫ ПЕРЕХОДА ЗАПИСАНЫ ОДИНАКОВО: translate · rotate · scale ·
   translate. Покой — это НЕ 'none'. Браузер переходит между двумя записями по
   частям, и если в покое стоит 'none', каждая часть едет от своей единицы по
   отдельности: предмет успевает вырасти раньше, чем доехать, и в середине
   перехода улетает за край экрана (поймано рендером). */
const hold = (x, y, rot, k, ox, oy) =>
  `translate(${x}px, ${y}px) rotate(${rot}deg) scale(${k}) translate(${-ox}px, ${-oy}px)`;

/* Вынесенная грань доворачивается так, как стоит верхняя: клин встаёт ровно,
   сердцем вниз, и подписи читаются, а не стоят боком. У верхней грани доворот
   нулевой — её вид не меняется вовсе. */
const facetTurn = (f) => (f ? -(f.deg + 90) : 0);

const coreStyle = computed(() => {
  const c = box / 2;
  if (state.value === 'crystal') return { transform: hold(c, c + L.crystal.coreLift, 0, L.crystal.coreK, c, c) };
  if (state.value === 'facet') return { transform: hold(c, c + L.facet.coreLift, 0, L.facet.coreK, c, c) };
  return { transform: hold(c, c, 0, 1, c, c) };
});

/* Где стоит вынесенная грань: впереди — пока выбирают кристалл; отходит
   назад и мельчает — когда кристалл вынесен. */
const facetStyle = computed(() => {
  const f = selFacet.value;
  const c = box / 2;
  if (!f) return coreStyle.value;
  const t = facetTurn(f);
  return state.value === 'crystal'
    ? { transform: hold(L.crystal.facetX, L.crystal.facetY, t, L.crystal.facetK, f.cx, f.cy) }
    : { transform: hold(L.facet.x, L.facet.y, t, L.facet.k, f.cx, f.cy) };
});

const crystalStyle = (c) => ({
  transform: hold(L.crystal.x, L.crystal.y, facetTurn(selFacet.value), L.crystal.k, c.cx, c.cy),
});

/* Розовое — только на миг выбора, там, где отпустили. Единственное на странице. */
const flash = ref(null);   // { points, level }
let flashTimer = null;
const flashStyle = computed(() => (flash.value?.level === 'crystal' ? facetStyle.value : coreStyle.value));
function pulse(points, level) {
  flash.value = { points, level };
  if (flashTimer) clearTimeout(flashTimer);
  flashTimer = setTimeout(() => { flash.value = null; }, 220);
}

/* ── попадание пальцем ──────────────────────────────────────────────────
   Зоны не рисуются плиткой: разбор идёт по БЛИЖАЙШЕЙ середине. Зазоров нет,
   зоны не налезают — палец между двумя, выигрывает та, чья середина ближе. */
const HEART_R = 58;   // ближе к середине — это сердце, а не грань

function toCanvas(e) {
  const m = e.currentTarget.getScreenCTM();
  if (!m) return null;
  const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
  return [p.x, p.y];
}

/* Лежит ли точка внутри многоугольника (луч вправо). */
function inPoly(pt, points) {
  const q = points.trim().split(/\s+/).map((t) => t.split(',').map(Number));
  let inside = false;
  for (let i = 0, j = q.length - 1; i < q.length; j = i++) {
    const [xi, yi] = q[i]; const [xj, yj] = q[j];
    if ((yi > pt[1]) !== (yj > pt[1])
      && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function nearestFacet(e) {
  const pt = toCanvas(e);
  if (!pt) return null;
  /* ⚠️ Проверка «внутри ли фигуры» обязательна, хотя полотно и есть сам
     шестиугольник: палец захвачен, и события приходят даже когда он ушёл
     далеко за край. Без неё подсветка не гасла за фигурой, а отпускание в
     пустоте выбирало ближайшую грань (поймано зондом). */
  if (!inPoly(pt, plate)) return null;
  const c = box / 2;
  if (Math.hypot(pt[0] - c, pt[1] - c) < HEART_R) return null;
  let best = null; let bd = Infinity;
  for (const f of facets) {
    const d = (f.cx - pt[0]) ** 2 + (f.cy - pt[1]) ** 2;
    if (d < bd) { bd = d; best = f; }
  }
  return best;
}

function nearestCrystal(e) {
  const pt = toCanvas(e);
  const f = selFacet.value;
  if (!pt || !f || !inPoly(pt, f.points)) return null;
  let best = null; let bd = Infinity;
  for (const c of f.crystals) {
    const d = (c.cx - pt[0]) ** 2 + (c.cy - pt[1]) ** 2;
    if (d < bd) { bd = d; best = c; }
  }
  return best;
}

/* ⚠️ Палец захватывается на pointerdown. Без захвата отпускание за краем
   фигуры не доходит до пада, подсветка залипает и гаснет только со следующим
   касанием. */
function grab(e) { try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* не критично */ } }

/* ── ведение по ядру: единица — ГРАНЬ ────────────────────────────────── */
function guideFacet(e) {
  if (state.value !== 'rest') { clearGuide(); return null; }
  const f = nearestFacet(e);
  guide.value = f ? { kind: 'facet', key: f.id } : null;
  return f;
}
function onCoreDown(e) { grab(e); guideFacet(e); }
function onCoreMove(e) { guideFacet(e); }
function onCoreUp(e) {
  if (state.value !== 'rest') { clearGuide(); goBack(); return; }
  const f = guideFacet(e);
  clearGuide();
  /* Отпустил вне фигуры — не выбрано ничего и ничего не изменилось. */
  if (f) chooseFacet(f);
}

/* ── ведение по вынесенной грани: единица — КРИСТАЛЛ ─────────────────── */
function guideCrystal(e) {
  if (state.value !== 'facet') { clearGuide(); return null; }
  const c = nearestCrystal(e);
  guide.value = c ? { kind: 'crystal', key: c.index } : null;
  return c;
}
function onFacetDown(e) { grab(e); guideCrystal(e); }
function onFacetMove(e) { guideCrystal(e); }
function onFacetUp(e) {
  if (state.value === 'crystal') { clearGuide(); goBack(); return; }
  const c = guideCrystal(e);
  clearGuide();
  if (c) chooseCrystal(c);
}

/* ── переходы ─────────────────────────────────────────────────────────── */
function chooseFacet(f) {
  if (state.value !== 'rest') return;
  pulse(f.points, 'facet');   // одна розовая вспышка там, где отпустили
  sel.value = f.id;
  cry.value = null;
  state.value = 'facet';
}
function chooseCrystal(c) {
  if (state.value !== 'facet') return;
  pulse(c.points, 'crystal');
  cry.value = c.index;
  state.value = 'crystal';
}
function lightUp() {
  if (!canLight.value) return;
  lit.value = { ...lit.value, [selCrystal.value.key]: true };
  rights.value -= 1;
}
function goBack() {
  clearGuide();
  if (state.value === 'crystal') { state.value = 'facet'; cry.value = null; return; }
  if (state.value === 'facet') { state.value = 'rest'; sel.value = null; }
}
function onKey(e) { if (e.key === 'Escape') goBack(); }

/* Служебный орган макета. В игру не идёт: там право даёт занятие. */
function resetAll() {
  lit.value = {};
  rights.value = 0;
  sel.value = null;
  cry.value = null;
  guide.value = null;
  state.value = 'rest';
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

/* ⚠️ Высота ЖЁСТКАЯ, а не минимальная. Макет — один экран: ядро, предмет и
   описание помещаются целиком, прокручивается только описание. На min-height
   высота была неопределённой, доли (1fr, 100%) вниз по дереву не разрешались,
   и холст брал ширину колонки вместо высоты — страница вырастала выше экрана,
   кнопка возврата уезжала за край (замерено: высота .fx 655 при экране 390). */
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
.fx:not([data-state='rest']) .fx-dim { opacity: 1; }

/* Холст квадратный и вписывается в МЕНЬШУЮ сторону сцены.
   ⚠️ Держится на том, что у .fx высота жёсткая: только тогда высота сцены
   определена и 100cqh разрешается. Вернёте .fx на min-height — холст возьмёт
   ширину колонки, в горизонтали вылезет за экран и половина граней станет
   недоступной пальцу (замерено: холст 524 при экране 390).
   ⚠️ Пара height: auto + aspect-ratio обязательна. На height: 100% браузер
   разрешал высоту через ширину и давал 524×524 в горизонтали и 390×544 —
   даже не квадрат — в вертикали. */
.fx-svg {
  position: relative;
  display: block;
  /* ⚠️ Ведение пальцем по фигуре — наш жест, не браузерный. Страница не
     прокручивается вовсе (у .fx жёсткая высота), отнимать у неё нечего;
     описание сбоку прокручивается своим блоком и сюда не входит.
     ⚠️ Стоять это должно ИМЕННО НА КОРНЕ холста: внутри SVG браузер
     touch-action не читает — на втором движении пальца прилетал
     pointercancel и ведение обрывалось (поймано журналом событий). */
  touch-action: none;
  width: min(100%, 100cqh);
  height: auto;
  max-width: 34rem;
  aspect-ratio: 1;
  overflow: visible;
}
.fx-void { fill: transparent; }

/* Всё, что ездит между уровнями, ездит одним свойством. Единицы px внутри
   transform равны единицам холста — это даёт transform-box. */
.fx-core,
.fx-facet,
.fx-cryst,
.fx-flash {
  transform-box: view-box;
  transform-origin: 0 0;
  transition: transform var(--d-panel) var(--e-weight),
              opacity var(--d-panel) var(--e-settle);
}
.fx[data-state='facet'] .fx-core,
.fx[data-state='crystal'] .fx-core { opacity: .3; }

/* Налив грани: одна сплошная полоса, обрезанная растущим кругом.
   ⚠️ ДЕЛЕНИЙ ВНУТРИ ГРАНИ НЕТ: ни линий, ни точек, ни бусин. Шаги показывает
   движение, а не рисунок (решение 22.09.2026, подтверждено дважды). */
.fx-flow { fill: currentColor; fill-opacity: .9; }
.fx-flow-clip {
  transform-box: view-box;
  transform-origin: 0 0;
  transition: transform 1.3s steps(5, end);
}

/* Пустое гнездо там, где грань вынута. Не подсвечивается. */
.fx-socket { fill: var(--void); pointer-events: none; }

/* ⚠️ Полотно, по которому водят пальцем. Прозрачное и во весь шестиугольник:
   грань берётся по ближайшей середине, а не по своей плитке — зазоров между
   зонами нет и они не налезают друг на друга. */
.fx-pad, .fx-cpad { fill: transparent; cursor: pointer; }
.fx[data-state='crystal'] .fx-cpad { cursor: default; }

/* ── предметы: грань и кристалл огранены одинаково ────────────────── */
.fx-shard__body { fill: var(--void); pointer-events: none; }
.fx-shard__face { fill: var(--panel); pointer-events: none; }
.fx-shard__lit { pointer-events: none; }
.fx-bevel { pointer-events: none; }
/* Тона фаски — одним цветом разной силы, как свет на огранке. */
.fx-bevel.is-near { fill: color-mix(in srgb, var(--ink) 13%, var(--panel)); }
.fx-bevel.is-side { fill: color-mix(in srgb, var(--ink) 6%, var(--panel)); }
.fx-bevel.is-far  { fill: color-mix(in srgb, var(--void) 55%, var(--panel)); }

/* ⚠️ Подсветка под пальцем — НЕЙТРАЛЬНАЯ, не цветом ядра и не розовая.
   Цветом ядра показан налив: подсвеченная им незажжённая грань читалась бы
   зажжённой. Розовое принадлежит действию, а подсветка — ещё не действие, а
   показ того, что будет выбрано, если отпустить.
   ⚠️ На ядре подсвечивается ТОЛЬКО ЦЕЛАЯ ГРАНЬ. Кристаллы на ядре не
   подсвечиваются и не выбираются никогда — их там и не рисуют. */
.fx-facet__glow {
  fill: var(--ink);
  fill-opacity: .3;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--d-fast) var(--e-settle);
}
.fx[data-state='rest'] .fx-facet.is-guided .fx-facet__glow { opacity: 1; }

/* Клавиатурная цель. Пальцем по ней не попадают — попадание ведёт полотно. */
.fx-facet__key, .fx-cryst__key { fill: none; pointer-events: none; outline: none; }

.fx[data-state='facet'] .fx-facet:not(.is-sel),
.fx[data-state='crystal'] .fx-facet:not(.is-sel) { opacity: 0; }

/* Кристалл: пять гнёзд по длине вынесенной грани, в каждом один. */
.fx-cryst__glow {
  fill: var(--ink);
  fill-opacity: .3;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--d-fast) var(--e-settle);
}
.fx[data-state='facet'] .fx-cryst.is-guided .fx-cryst__glow { opacity: 1; }
/* Потолок выбран — незажжённые гаснут: зажечь их уже нечем. */
.fx-cryst.is-spent { opacity: .35; }
.fx-cryst__name {
  fill: var(--ink-dim);
  font-family: var(--font-mono);
  letter-spacing: var(--ls-meta);
  text-anchor: start;
  dominant-baseline: middle;
  pointer-events: none;
}
.fx-cryst.is-lit .fx-cryst__name { fill: var(--ink); }
.fx[data-state='crystal'] .fx-cryst:not(.is-sel) { opacity: .18; }

/* Розовое — только на миг выбора. Оно тут одно на весь холст. */
.fx-flash polygon { fill: var(--pink); opacity: .75; pointer-events: none; }

/* ── панель ───────────────────────────────────────────────────────── */
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
.fx-hint--left { text-align: left; }

/* ⚠️ flex: 1 1 auto + min-height: 0 обязательны оба. Без них колонка не
   сжимается под родителя, прокрутка достаётся не описанию, а всему блоку — и
   кнопка возврата уезжает за нижний край (поймано рендером в горизонтали). */
.fx-panel {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}
.fx-panel__head { display: flex; flex-direction: column; gap: var(--sp-1); }
.fx-panel__kicker {
  font-family: var(--font-mono);
  font-size: var(--t-micro);
  letter-spacing: var(--ls-meta);
  color: var(--ink-off);
  text-transform: uppercase;
}
.fx-panel__name {
  margin: 0;
  font-size: var(--t-lg);
  font-weight: 700;
  letter-spacing: var(--ls-title);
  text-transform: uppercase;
  color: var(--ink);
}
.fx-panel__body { flex: 1 1 auto; min-height: 0; overflow-y: auto; }
.fx-panel__desc {
  margin: 0;
  max-width: 46ch;
  font-family: var(--font-mono);
  font-size: var(--t-xs);
  line-height: 1.55;
  color: var(--ink-soft);
}
.fx-panel__foot {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  flex-wrap: wrap;
}
.fx-why {
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--t-micro);
  letter-spacing: var(--ls-meta);
  color: var(--ink-off);
  text-transform: uppercase;
}

/* Зажечь — главное действие на экране, потому розовое. Оно тут одно. */
.fx-light {
  min-height: var(--h-btn-md);
  padding: 0 var(--sp-4);
  border: 0;
  background: var(--pink);
  color: var(--ink);
  font-family: var(--font-display);
  font-size: var(--t-sm);
  font-weight: 700;
  letter-spacing: var(--ls-title);
  text-transform: uppercase;
  cursor: pointer;
  transition: opacity var(--d-hover) var(--e-settle);
}
.fx-light:active { opacity: var(--o-dim); }

.fx-back {
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

/* «Уменьшить движение»: переходов нет, конечные состояния те же.
   Отклик на выбор остаётся — он не украшение. */
@media (prefers-reduced-motion: reduce) {
  .fx-dim,
  .fx-core,
  .fx-facet,
  .fx-cryst,
  .fx-flash,
  .fx-flow-clip,
  .fx-facet__glow,
  .fx-cryst__glow,
  .fx-chip,
  .fx-light,
  .fx-back { transition: none !important; }
}
</style>
