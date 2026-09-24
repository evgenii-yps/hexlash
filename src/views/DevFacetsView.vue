<template>
  <!-- СКРЫТАЯ СТРАНИЦА-МАКЕТ ГРАНЕЙ И КРИСТАЛЛОВ (ТЗ 24.09.2026, правка третья).
       Адрес /dev/facets, ниоткуда не линкуется, закрыта от поисковиков тегом
       robots (не через robots.txt — строка запрета там публична и работает как
       указатель). Ничего не встраивает в игру: зал FORGE не трогается.

       ⚠️ ФИГУРА НЕ РИСУЕТСЯ ЗДЕСЬ. Ядро приходит компонентом HexCore — тем же,
       что стоит на лендинге, в деке и на экране входа. Грани, кристаллы и
       налив выведены из того же coreFigure() через coreFacetSlices.js.

       СЛОВАРЬ: ветка — клин, грань — пятая часть клина, кристалл — то, чем
       грань зажигается. Три уровня глубины: ядро → грань → кристалл, и на
       каждом один и тот же приём: выбранное выходит вперёд, остальное уходит
       назад. -->
  <div class="fx" :data-state="state">
    <header class="fx-bar">
      <span class="fx-bar__title">ГРАНИ И КРИСТАЛЛЫ · МАКЕТ</span>
      <span class="fx-bar__step">{{ stepLabel }}</span>
      <!-- Служебные органы макета. В игру не идут: там право даёт занятие. -->
      <button type="button" class="fx-chip" @click="grantRight">выдать право</button>
      <button type="button" class="fx-chip" @click="resetAll">сбросить всё</button>
    </header>

    <main class="fx-page">
      <section class="fx-stage">
        <!-- Затемнение вокруг ядра. Радиальное и во весь холст: краёв у него
             нет, границей оно не читается. -->
        <div class="fx-dim" aria-hidden="true"></div>

        <svg
          ref="svgRef"
          class="fx-svg"
          :viewBox="`0 0 ${box} ${box}`"
          :style="{ color: hue }"
                  >
          <defs>
            <!-- Налив. У каждой ветки свой растущий круг: сколько граней в ней
                 зажжено, до того шага и дошёл свет. Ступени даёт кривая
                 перехода, а не рисунок — делений внутри ветки нет. -->
            <clipPath v-for="b in branches" :key="`cf${b.id}`" :id="id('flow-' + b.id)">
              <circle class="fx-flow-clip" cx="0" cy="0" r="1" :style="flowStyle(b)" />
            </clipPath>

            <!-- Свет внутри вынесенной грани: от сердца к концу ветки. -->
            <linearGradient
              v-if="selFacet" :id="id('shard')" gradientUnits="userSpaceOnUse"
              :x1="selFacet.near[0]" :y1="selFacet.near[1]"
              :x2="selFacet.far[0]" :y2="selFacet.far[1]"
            >
              <stop offset="0" stop-color="currentColor" stop-opacity=".85" />
              <stop offset="1" stop-color="currentColor" stop-opacity=".12" />
            </linearGradient>

            <!-- Свет внутри кристалла — тем же путём. -->
            <linearGradient
              v-for="c in slots" :key="`cg${c.i}`"
              :id="id('cry-' + c.i)" gradientUnits="userSpaceOnUse"
              :x1="c.near[0]" :y1="c.near[1]" :x2="c.far[0]" :y2="c.far[1]"
            >
              <stop offset="0" stop-color="currentColor" stop-opacity=".9" />
              <stop offset="1" stop-color="currentColor" stop-opacity=".2" />
            </linearGradient>
          </defs>

          <!-- Пустое место. Отпустил здесь — не выбрано ничего и ничего не
               изменилось: возврат живёт на кнопке, Esc и на ушедшем назад
               предмете, а не на промахе. -->
          <rect class="fx-void" x="0" y="0" :width="box" :height="box" />

          <!-- ФИГУРА: ядро, налив и пустое гнездо. Двигается одним куском. -->
          <g class="fx-figure" :style="figureStyle">
            <!-- ⚠️ :fill выключен: своё бегущее заполнение ядра — бесконечная
                 петля, а здесь наливом управляет зажигание граней. Компонент
                 при этом не правится — у него для этого есть своё свойство. -->
            <HexCore mode="full" :hue="hue" :flicker="true" :fill="false" />

            <g v-for="b in branches" :key="`fl${b.id}`" :clip-path="`url(#${id('flow-' + b.id)})`">
              <polygon class="fx-flow" :points="b.strip" />
            </g>

            <!-- Пустое гнездо: пока грань вынесена, на ядре её нет. -->
            <polygon v-if="selFacet" class="fx-socket" :points="selFacet.points" />

            <!-- ⚠️ ВЕДЕНИЕ, А НЕ ТЫЧОК. Палец лежит на фигуре и водит — под ним
                 подсвечивается ЦЕЛАЯ ГРАНЬ; отпустил — она и выбрана.
                 ⚠️ Слушаем pointerdown, а НЕ только pointermove: на телефоне
                 при касании ведения не приходит вовсе — приходят лишь нажал и
                 отпустил (замерено: на тап прилетают pointerdown, pointerup,
                 click и ни одного pointermove). На одном pointermove подсветка
                 на телефоне не загоралась никогда, и выбор шёл вслепую.
                 ⚠️ Зона — весь шестиугольник, а не пятнадцать плиток: грань
                 берётся по БЛИЖАЙШЕЙ середине, зазоров между зонами нет. -->
            <polygon
              class="fx-pad" :points="plate"
              @pointerdown="onFigDown" @pointermove="onFigMove"
              @pointerup="onFigUp" @pointercancel="clearGuide"
              @pointerleave="clearGuide"
            />
          </g>

          <!-- ГРАНИ. В покое у грани нет никакого рисунка — только подсветка
               под пальцем. Огранка появляется у той одной, что вынесена. -->
          <g
            v-for="f in facets" :key="f.key"
            class="fx-facet"
            :class="{ 'is-sel': sel === f.key, 'is-hover': hoverKey === f.key }"
            :style="sel === f.key ? facetStyle : figureStyle"
          >
            <!-- Подсветка под пальцем. Целая грань, и НЕ цветом ядра: цветом
                 ядра на клине показан налив, и подсвеченная незажжённая грань
                 читалась бы зажжённой. Показ будущего выбора — не действие,
                 поэтому и не розовый. -->
            <polygon class="fx-facet__glow" :points="f.points" />

            <template v-if="sel === f.key">
              <polygon class="fx-shard__body" :points="f.points" />
              <polygon
                v-for="(bv, bi) in f.bevels" :key="`bv${bi}`"
                class="fx-bevel" :class="BEVEL_FACE[bi]" :points="bv"
              />
              <polygon class="fx-shard__face" :points="f.inner" />
              <polygon
                v-if="facetLit(f)" class="fx-shard__lit"
                :points="f.inner" :fill="`url(#${id('shard')})`"
              />
              <!-- Тот же приём уровнем глубже: ведём по вынесенной грани —
                   подсвечивается целый кристалл, отпустили — он и выбран. -->
              <polygon
                class="fx-cpad" :points="f.points"
                @pointerdown="onFacetDown" @pointermove="onFacetMove"
                @pointerup="onFacetUp" @pointercancel="clearGuide"
                @pointerleave="clearGuide"
              />
            </template>

            <polygon
              class="fx-facet__key" :points="f.points"
              role="button" tabindex="0" :aria-label="labelOf(f)"
              @keydown.enter.prevent="chooseFacet(f)"
              @keydown.space.prevent="chooseFacet(f)"
              @focus="guide = { kind: 'facet', key: f.key }"
              @blur="clearGuide"
            />
          </g>

          <!-- КРИСТАЛЛЫ выбранной грани. Лежат на ней как предметы: пока грань
               впереди — едут вместе с ней; выбранный выходит вперёд тем же
               движением, каким грань выходила из ядра. -->
          <g
            v-for="c in slots" :key="`cr${c.i}`"
            class="fx-cryst"
            :class="{
              'is-sel': cry === c.i,
              'is-guided': hoverCry === c.i,
              'is-lit': litIndex === c.i,
              'is-spent': litIndex !== null && litIndex !== c.i,
            }"
                        :style="cry === c.i ? crystalStyle(c) : facetStyle"
          >
            <polygon class="fx-shard__body" :points="c.points" />
            <polygon
              v-for="(bv, bi) in c.bevels" :key="`cb${bi}`"
              class="fx-bevel" :class="BEVEL_FACE[bi]" :points="bv"
            />
            <polygon class="fx-shard__face" :points="c.inner" />
            <polygon
              v-if="litIndex === c.i" class="fx-shard__lit"
              :points="c.inner" :fill="`url(#${id('cry-' + c.i)})`"
            />
            <!-- Подсветка под пальцем — целый кристалл, нейтральная. -->
            <polygon class="fx-cryst__glow" :points="c.inner" />
            <!-- Клавиатурная цель. Пальцем по ней не попадают: выбор ведёт
                 пад грани по ближайшей середине кристалла. -->
            <polygon
              class="fx-cryst__hit" :points="c.points"
              role="button" tabindex="0" :aria-label="cryList[c.i]?.name"
              @keydown.enter.prevent="chooseCrystal(c)"
              @keydown.space.prevent="chooseCrystal(c)"
              @focus="guide = { kind: 'crystal', key: c.i }"
              @blur="clearGuide"
            />

            <!-- Название под предметом. Прячется у вынесенного: там имя стоит
                 в панели рядом с полным описанием. -->
            <!-- ⚠️ Подпись КОНТР-ПОВОРАЧИВАЕТСЯ. Предметы построены в осях
                 своей ветки, поэтому доворот группы ставит их ровно; текст же
                 набран в осях холста, и тот же доворот кладёт его набок. Без
                 этой строки названия на боковых ветках читались вертикально и
                 задом наперёд (поймано рендером). -->
            <text
              v-if="cry !== c.i"
              class="fx-cryst__name"
              :x="c.labX" :y="c.labY"
              :transform="`rotate(${-facetTurn(selFacet)} ${c.labX} ${c.labY})`"
              :style="{ fontSize: `${labSize(c)}px` }"
            >
              <tspan
                v-for="(ln, li) in nameLines(c.i, c.oneLine)" :key="li"
                :x="c.labX" :dy="li ? c.labStep : 0"
              >{{ ln }}</tspan>
            </text>
          </g>

          <!-- Отклик на выбор. ⚠️ ОТДЕЛЬНЫМ СЛОЕМ И ПОСЛЕДНИМ В ПОРЯДКЕ.
               Отдельным — потому что предмет в этот момент уже летит вперёд, и
               розовое улетало вместе с ним. Последним — потому что летящий
               предмет стартует ровно с места вспышки и закрывал её собой
               (поймано рендером). Вспышка остаётся ТАМ, ГДЕ ОТПУСТИЛИ, и живёт
               четверть секунды. Это единственное розовое на странице. -->
          <g v-if="flashShape" class="fx-flash" :style="flashStyle" aria-hidden="true">
            <polygon :points="flashShape" />
          </g>
        </svg>
      </section>

      <!-- ── ПАНЕЛЬ: подсказка · кристаллы · описание ──────────────── -->
      <section class="fx-side">
        <template v-if="state === 'rest' || state === 'pick'">
          <p class="fx-hint">{{ hint }}</p>
          <button
            v-if="state === 'pick'" type="button" class="fx-back fx-back--solo"
            @click="goBack"
          >← назад</button>
        </template>

        <div v-else class="fx-panel">
          <header class="fx-panel__head">
            <span class="fx-panel__kicker">{{ branchName }}</span>
            <h2 class="fx-panel__name">{{ state === 'crystal' ? cryName : facetName }}</h2>
          </header>

          <div class="fx-panel__body">
            <p v-if="state === 'open'" class="fx-hint fx-hint--left">{{ openHint }}</p>
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
import { coreFacetSlices, crystalSlots } from '@/data/coreFacetSlices.js';
import { accentRgb } from '@/data/coreCycle.js';
import { CRYSTALS } from '@/data/upgradeData.js';
import { crystalsOf } from '@/locales/facetCrystals.mockup.en.js';

/* Макет показан на ядре ONSLAUGHT: у него в данных игры уже есть имена веток
   и граней. Кристаллы — заглушки, см. facetCrystals.mockup.en.js. */
const CORE_ID = 'natisk';

/* Потолок: пять зажжённых граней на бойца. Цифрой на экран не выходит ни
   разу — сколько осталось, игрок видит по налитому ядру. */
const CAP = 5;

/* Рост фигуры на выборе. Ядро НЕ ДВИГАЕТСЯ: рост идёт вокруг его середины.
   Числа разные, потому что кадр разный: в вертикали фигуру держит ширина
   экрана, в горизонтали — высота. Выше — фигура выходит за край. */
const PICK_PORTRAIT = 1.5;
const PICK_LANDSCAPE = 1.33;

/* Три уровня глубины, один приём на всех: выбранное выходит вперёд, остальное
   уходит назад. Числа — в единицах холста (0…600). */
const L = {
  /* грань вынесена */
  facet: { y: 395, k: 7.4, coreLift: -150, coreK: 0.34 },
  /* кристалл вынесен: грань отходит назад, ядро ещё дальше */
  crystal: { y: 400, k: 18, facetY: 215, facetK: 2.0, coreLift: -205, coreK: 0.2 },
};

/* Плоскости фаски по порядку из coreFacetSlices. Свет со стороны сердца. */
const BEVEL_FACE = ['is-side', 'is-far', 'is-side', 'is-near'];

const uid = useId();
const id = (n) => `fx-${n}-${uid}`;

const slices = coreFacetSlices('full');
const box = slices.box;
const branches = slices.branches;
const facets = branches.flatMap((b) => b.facets);
const plate = branches.length ? slices.plate : '';
const stops = branches[0].stops;

const hue = computed(() => `rgb(${accentRgb(CORE_ID).join(' ')})`);

/* rest · pick · open (грань вынесена) · crystal (кристалл вынесен) */
const state = ref('rest');
const sel = ref(null);      // ключ грани
const cry = ref(null);      // номер кристалла на этой грани
/* Что сейчас под пальцем. Подсвечена ВСЕГДА ОДНА единица: на ядре — грань,
   на вынесенной грани — кристалл. { kind: 'facet'|'crystal', key }. */
const guide = ref(null);
const clearGuide = () => { guide.value = null; };
const hoverKey = computed(() => (guide.value?.kind === 'facet' ? guide.value.key : null));
const hoverCry = computed(() => (guide.value?.kind === 'crystal' ? guide.value.key : null));
const svgRef = ref(null);

/* Зажжённое. Ключ грани → номер кристалла, которым её зажгли. */
const lit = ref({});
const rights = ref(0);
const litCount = computed(() => Object.keys(lit.value).length);
const facetLit = (f) => lit.value[f.key] !== undefined;
const litIndex = computed(() => (sel.value ? lit.value[sel.value] ?? null : null));

/* Налив ветки: сколько её граней зажжено, столько шагов и налито — светом от
   сердца, без делений. */
const branchLit = (b) => b.facets.filter((f) => facetLit(f)).length;
const flowStyle = (b) => ({
  transform: `translate(${box / 2}px, ${box / 2}px) scale(${stops[branchLit(b)]})`,
});

const gameBranches = CRYSTALS[CORE_ID];
const byId = (bid) => gameBranches.find((b) => b.id === bid);
const labelOf = (f) => {
  const b = byId(f.branchId);
  return `${b ? b.name : f.branchId} — ${b ? b.faces[f.id - 1].name : f.key}`;
};

const selFacet = computed(() => facets.find((f) => f.key === sel.value) || null);
const cryList = computed(() => (sel.value ? crystalsOf(sel.value) : []));
const slots = computed(() => (selFacet.value
  ? crystalSlots(selFacet.value, cryList.value.length)
  : []));

/* Название кристалла под предметом — в две строки. Ломаем по пробелу,
   БЛИЖАЙШЕМУ К СЕРЕДИНЕ слова: по первому пробелу вторая строка выходила
   длиннее места под предметом и залезала на соседа. */
const nameLines = (i, oneLine = false) => {
  const n = (cryList.value[i]?.name || '').toUpperCase();
  if (oneLine) return [n];
  let best = -1;
  for (let k = 0; k < n.length; k++) {
    if (n[k] !== ' ') continue;
    if (best < 0 || Math.abs(k - n.length / 2) < Math.abs(best - n.length / 2)) best = k;
  }
  return best < 0 ? [n] : [n.slice(0, best), n.slice(best + 1)];
};

/* Кегль подписи ужимается под место, если название длинное: иначе подписи
   соседних кристаллов смыкаются (поймано рендером на паре ROOTED / DEAF TO
   NOISE). 0.62 — доля ширины знака к кеглю у моноширинного шрифта. */
function labSize(c) {
  const longest = Math.max(1, ...nameLines(c.i, c.oneLine).map((l) => l.length));
  return +Math.min(c.labSize, c.slotW / (0.62 * longest)).toFixed(3);
}

const branchName = computed(() => byId(selFacet.value?.branchId)?.name || '');
const facetName = computed(() => {
  const f = selFacet.value;
  const b = f && byId(f.branchId);
  return b ? b.faces[f.id - 1].name : '';
});
const cryName = computed(() => cryList.value[cry.value]?.name || '');
const cryText = computed(() => cryList.value[cry.value]?.text || '');

const stepLabel = computed(() => ({
  rest: 'покой', pick: 'выбор грани',
  open: 'грань вынесена', crystal: 'кристалл вынесен',
}[state.value]));
const hint = computed(() => (state.value === 'rest'
  ? 'Нажмите по ядру — грани станут выбираемыми.'
  : 'Выберите грань. Она выйдет вперёд, ядро уйдёт назад.'));
const openHint = computed(() => (litIndex.value !== null
  ? 'Грань уже зажжена выбранным кристаллом.'
  : 'Выберите кристалл — он выйдет вперёд.'));
const backLabel = computed(() => (state.value === 'crystal' ? '← назад к грани' : '← назад к ядру'));

/* Зажечь можно, пока грань не зажжена, есть право и потолок не выбран. */
const canLight = computed(() => (
  state.value === 'crystal'
  && litIndex.value === null
  && rights.value > 0
  && litCount.value < CAP
));
const whyNot = computed(() => {
  if (litIndex.value !== null) {
    return litIndex.value === cry.value
      ? 'Этот кристалл горит.'
      : 'Грань уже зажжена другим кристаллом.';
  }
  if (litCount.value >= CAP) return 'Больше граней боец не удержит.';
  return 'Право зажечь грань боец получает за занятие.';
});

/* Раскладка кадра: от неё зависит, насколько фигура может вырасти, не выйдя
   за край. Обновляется на поворот телефона. */
const portrait = ref(true);
const syncOrientation = () => { portrait.value = window.innerHeight >= window.innerWidth; };
const pickScale = computed(() => (portrait.value ? PICK_PORTRAIT : PICK_LANDSCAPE));

/* ⚠️ ВСЕ КОНЦЫ ПЕРЕХОДА ЗАПИСАНЫ ОДИНАКОВО: translate · rotate · scale ·
   translate. Покой — это НЕ 'none'. Браузер переходит между двумя записями по
   частям, и если в покое стоит 'none', каждая часть едет от своей единицы по
   отдельности: предмет успевает вырасти раньше, чем доехать, и в середине
   перехода улетает за край экрана (поймано рендером). При одинаковой записи
   середина перехода — ровно середина пути. */
const hold = (x, y, rot, k, ox, oy) =>
  `translate(${x}px, ${y}px) rotate(${rot}deg) scale(${k}) translate(${-ox}px, ${-oy}px)`;

/* Вынесенная грань доворачивается так, как стоит верхняя ветка: предмет
   ложится ровно, и кристаллы с подписями читаются, а не стоят боком.
   У верхней ветки доворот нулевой — её вид не меняется вовсе. */
const facetTurn = (f) => -(f.deg + 90);

const figureStyle = computed(() => {
  const c = box / 2;
  if (state.value === 'crystal') return { transform: hold(c, c + L.crystal.coreLift, 0, L.crystal.coreK, c, c) };
  if (state.value === 'open') return { transform: hold(c, c + L.facet.coreLift, 0, L.facet.coreK, c, c) };
  if (state.value === 'pick') return { transform: hold(c, c, 0, pickScale.value, c, c) };
  return { transform: hold(c, c, 0, 1, c, c) };
});

/* Где стоит вынесенная грань: впереди — пока выбирают кристалл; отходит
   назад — когда кристалл вынесен. */
const facetStyle = computed(() => {
  const f = selFacet.value;
  const c = box / 2;
  if (!f) return { transform: hold(c, c, 0, 1, c, c) };
  const t = facetTurn(f);
  return state.value === 'crystal'
    ? { transform: hold(box / 2, L.crystal.facetY, t, L.crystal.facetK, f.cx, f.cy) }
    : { transform: hold(box / 2, L.facet.y, t, L.facet.k, f.cx, f.cy) };
});

const crystalStyle = (c) => ({
  transform: hold(box / 2, L.crystal.y, facetTurn(selFacet.value), L.crystal.k, c.cx, c.cy),
});

/* Розовое — только на миг нажатия, там, где нажали. */
const flash = ref(null);   // { points, level }
let flashTimer = null;
const flashShape = computed(() => flash.value?.points || null);
const flashStyle = computed(() => (flash.value?.level === 'crystal' ? facetStyle.value : figureStyle.value));
function pulse(points, level) {
  flash.value = { points, level };
  if (flashTimer) clearTimeout(flashTimer);
  flashTimer = setTimeout(() => { flash.value = null; }, 220);
}

/* ── попадание пальцем ──────────────────────────────────────────────────
   Зона грани не рисуется плиткой: весь шестиугольник поделён по БЛИЖАЙШЕЙ
   середине грани. Зазоров нет, зоны не налезают, промаха «мимо всех» внутри
   фигуры не бывает. */
const HEART_R = 58;   // ближе к середине — это ядро, а не грань

function toCanvas(e) {
  const el = e.currentTarget;
  const m = el.getScreenCTM();
  if (!m) return null;
  const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
  return [p.x, p.y];
}
function nearestFacet(e) {
  const pt = toCanvas(e);
  if (!pt) return null;
  /* ⚠️ Проверка «внутри ли фигуры» обязательна, хотя полотно и есть сам
     шестиугольник: палец захвачен, и события приходят на полотно даже когда
     он ушёл далеко за край. Без неё подсветка не гасла за фигурой, а
     отпускание в пустоте выбирало ближайшую грань (поймано зондом). */
  if (!inPoly(pt, plate)) return null;
  const c = box / 2;
  if (Math.hypot(pt[0] - c, pt[1] - c) < HEART_R) return null;
  let best = null;
  let bd = Infinity;
  for (const f of facets) {
    const d = (f.cx - pt[0]) ** 2 + (f.cy - pt[1]) ** 2;
    if (d < bd) { bd = d; best = f; }
  }
  return best;
}
const facetOpenable = (f) => facetLit(f) || litCount.value < CAP;

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

/* ── ведение по ядру: единица — ГРАНЬ ──────────────────────────────────
   ⚠️ Палец захватывается на pointerdown. Без захвата отпускание за краем
   фигуры не доходит до пада, подсветка залипает и гаснет только со следующим
   касанием. */
function grab(e) { try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* не критично */ } }

function guideFacet(e) {
  if (state.value !== 'pick') { clearGuide(); return null; }
  const f = nearestFacet(e);
  const ok = f && facetOpenable(f);
  guide.value = ok ? { kind: 'facet', key: f.key } : null;
  return ok ? f : null;
}
function onFigDown(e) { grab(e); guideFacet(e); }
function onFigMove(e) { guideFacet(e); }
function onFigUp(e) {
  if (state.value === 'rest') { clearGuide(); state.value = 'pick'; return; }
  if (state.value === 'pick') {
    const f = guideFacet(e);
    clearGuide();
    if (f) chooseFacet(f);
    return;
  }
  /* Отпустил на ушедшем назад ядре — шаг вверх. */
  clearGuide();
  goBack();
}

/* ── ведение по вынесенной грани: единица — КРИСТАЛЛ ───────────────── */
function nearestCrystal(e) {
  const pt = toCanvas(e);
  const f = selFacet.value;
  if (!pt || !f || !inPoly(pt, f.points)) return null;
  let best = null; let bd = Infinity;
  for (const c of slots.value) {
    if (litIndex.value !== null && litIndex.value !== c.i) continue;  // погасшие не берутся
    const d = (c.cx - pt[0]) ** 2 + (c.cy - pt[1]) ** 2;
    if (d < bd) { bd = d; best = c; }
  }
  return best;
}
function guideCrystal(e) {
  if (state.value !== 'open') { clearGuide(); return null; }
  const c = nearestCrystal(e);
  guide.value = c ? { kind: 'crystal', key: c.i } : null;
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
  if (state.value === 'rest') { state.value = 'pick'; return; }
  if (state.value !== 'pick' || !facetOpenable(f)) return;
  pulse(f.points, 'facet');   // одна розовая вспышка там, где отпустили
  sel.value = f.key;
  cry.value = null;
  state.value = 'open';
}
function chooseCrystal(c) {
  if (state.value !== 'open') return;
  if (litIndex.value !== null && litIndex.value !== c.i) return;   // погасший не берётся
  pulse(c.points, 'crystal');
  cry.value = c.i;
  state.value = 'crystal';
}
function lightUp() {
  if (!canLight.value) return;
  lit.value = { ...lit.value, [sel.value]: cry.value };
  rights.value -= 1;
}
function goBack() {
  clearGuide();
  if (state.value === 'crystal') { state.value = 'open'; cry.value = null; return; }
  if (state.value === 'open') { state.value = 'pick'; sel.value = null; return; }
  if (state.value === 'pick') state.value = 'rest';
}
function onKey(e) { if (e.key === 'Escape') goBack(); }

/* Служебные органы макета. */
function grantRight() { rights.value += 1; }
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
let mq = null;

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
     описание под фигурой прокручивается своим блоком и сюда не входит. */
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
.fx-figure,
.fx-facet,
.fx-cryst,
.fx-flash {
  transform-box: view-box;
  transform-origin: 0 0;
  transition: transform var(--d-panel) var(--e-weight),
              opacity var(--d-panel) var(--e-settle);
}
.fx[data-state='open'] .fx-figure,
.fx[data-state='crystal'] .fx-figure { opacity: .3; }

/* Налив клина: одна сплошная полоса, обрезанная растущим кругом.
   ⚠️ ДЕЛЕНИЙ ВНУТРИ ВЕТКИ НЕТ: ни линий, ни точек, ни бусин. Шаги показывает
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
   грань берётся по ближайшей середине, а не по своей плитке.
   ⚠️ Запрет на браузерный жест стоит НЕ ЗДЕСЬ, а на корне холста (.fx-svg):
   touch-action внутри SVG браузер не читает. Поставленный здесь, он не
   срабатывал: на втором же движении пальца прилетал pointercancel, ведение
   обрывалось и подсветка гасла (поймано журналом событий). */
.fx-pad, .fx-cpad {
  fill: transparent;
  cursor: pointer;
}
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
   Цветом ядра на клине показан налив: подсвеченная им незажжённая грань
   читалась бы зажжённой. Розовое принадлежит действию, а подсветка — это ещё
   не действие, а показ того, что будет выбрано, если отпустить.
   В покое ноль: внутри клина нет никаких отметок. */
.fx-facet__glow {
  fill: var(--ink);
  fill-opacity: .3;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--d-fast) var(--e-settle);
}
.fx[data-state='pick'] .fx-facet.is-hover .fx-facet__glow { opacity: 1; }

/* Клавиатурная цель. Пальцем по ней не попадают — попадание ведёт .fx-pad. */
.fx-facet__key { fill: none; pointer-events: none; outline: none; }

.fx[data-state='open'] .fx-facet:not(.is-sel),
.fx[data-state='crystal'] .fx-facet:not(.is-sel) { opacity: 0; }

/* Кристалл: пока грань впереди — предмет на ней; зажжённый горит, остальные
   в этой грани гаснут — грань уже зажжена выбранным. */
.fx-cryst { cursor: pointer; }
.fx-cryst__hit { fill: none; pointer-events: none; outline: none; }
/* Подсветка кристалла под пальцем — тем же нейтральным светом, что у грани. */
.fx-cryst__glow {
  fill: var(--ink);
  fill-opacity: .3;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--d-fast) var(--e-settle);
}
.fx[data-state='open'] .fx-cryst.is-guided .fx-cryst__glow { opacity: 1; }
.fx-cryst.is-spent { opacity: .35; cursor: default; }
.fx-cryst__name {
  fill: var(--ink-dim);
  font-family: var(--font-mono);
  letter-spacing: var(--ls-meta);
  text-anchor: middle;
  pointer-events: none;
}
.fx[data-state='crystal'] .fx-cryst:not(.is-sel) { opacity: .18; }

/* Розовое — только на миг нажатия. */
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

.fx-back--solo { align-self: center; margin-top: var(--sp-3); }
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
   Отклик на нажатие остаётся — он не украшение. */
@media (prefers-reduced-motion: reduce) {
  .fx-dim,
  .fx-figure,
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
