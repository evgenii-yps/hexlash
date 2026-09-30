<!-- ForgeCore — ЯДРО БОЙЦА КАК ИНТЕРФЕЙС ПРОКАЧКИ, в панели зала FORGE.
     Заменяет прежнюю плоскую карточку дерева (ForgeTree): ту же механику
     игрок теперь ведёт по самой фигуре «Печать», а не по схеме рядом с ней.

     ⚠️ СЛОВАРЬ. Здесь он верный, и другого в этом файле нет:
       ГРАНЬ    — весь луч «Печати» целиком, от кромки сердца до кромки
                  шестиугольника. Их ТРИ.
       КРИСТАЛЛ — один из пяти шагов внутри грани. Их ПЯТНАДЦАТЬ.
     В игровых данных и в хранилище эти две вещи до сих пор называются
     crystal и face соответственно. Переименовывать их — значит трогать счёт,
     а счёт не меняется (ТЗ §5), поэтому имена наружу уходят как были и
     переводятся на верный словарь ровно здесь, в двух местах: при чтении
     дерева и в событии toggle.

     ⚠️ СВОЕЙ ГЕОМЕТРИИ НЕТ НИ ОДНОЙ. Вся фигура приходит из coreFigure()
     через coreFacets.js — того же источника, что рисует ядро на лендинге, в
     деке и на экране входа. Второй отрисовки быть не должно.

     ⚠️ ЦИФР НА ЭКРАНЕ НЕТ. Сколько зажжено, показывает ряд маленьких шестиугольников
     под кнопкой (ТЗ 30.09.2026; прежний текст `LIT n OF m` снят — серое на тёмном
     рядом с розовой кнопкой не читалось и не объяснял себя). Ни процентов, ни цифр у
     граней. Единственное место со словами — строка «нет места», когда все заняты. В
     маленькой карточке (`preview`) ряда нет — там сколько зажжено видно по наливу.
     Потолок `m` — один на весь проект, RESOURCE в upgradeData.js; здесь своего числа
     нет, ряд строится ровно из него.

     ВЕДЕНИЕМ, А НЕ ТЫЧКОМ. Палец ведёт по ядру — под ним подсвечивается целая
     грань; отпустил внутри фигуры — она и выбрана, отпустил в пустоте — не
     изменилось ничего. Тот же приём уровнем глубже, по вынесенной грани.

     СЕРДЦЕ НЕ УЧАСТВУЕТ. Оно общее для всех трёх граней, не подсвечивается
     никогда и в выборе не участвует — ни подсветкой, ни зоной нажатия.

     ⚠️ Камеру зала это не трогает: панель — разметка ПОВЕРХ канваса, а камера
     слушает канвас. Палец, опущенный сюда, до неё не доходит вовсе (замерено:
     ноль смещения против 6 и 13.9 при ведении по залу).

     НИЧЕМ НЕ ВЛАДЕЕТ. Дерево, отказы и набор очков приходят свойствами, всякая
     перемена уходит событием. Чьё это дерево и где оно лежит — дело зала.

     ДВА РАЗМЕРА, ОДНА ЛОГИКА (ТЗ 29.09.2026, разворот ядра). Фигура стоит в двух
     местах: маленькой карточкой в панели зала и на весь экран в развороте
     (ForgeCoreOverlay). Это ОДИН и тот же компонент, а не копия: второй экземпляр
     получает те же свойства и шлёт то же событие toggle, поэтому правила
     зажигания живут ровно в одном месте.

     `expanded` — режим разворота на весь экран (правка 1 к ТЗ 29.09.2026): свои
     числа композиции уровней «грань» и «кристалл» (см. EXP ниже) и НИ ОДНОЙ
     внутренней кнопки «назад» — шаг назад делает единый BACK слоя через stepBack.
     У SPAR, который делит этот компонент, режим не включён: там всё как было.

     `preview` — режим маленькой карточки: работает ТОЛЬКО нажатие, оно шлёт
     expand и больше ничего. Ведения нет и грань не выбирается — два жеста на
     одном объекте на телефоне путаются. Зажигание живёт только в развороте. -->
<template>
  <div class="fc" ref="rootEl" :data-level="level">

    <!-- КТО ОТКРЫТ. Одной строкой: имя и ядро. Прежде это говорила шапка панели
         в четыре строки, и она же съедала высоту, в которой должна жить сама
         фигура. Состояние и счёт боёв остались в блоке статов — там, где по ним
         принимают решение. -->
    <p class="fc-who"><span class="nm">{{ fighterName }}</span><span class="cr">{{ coreName }}</span></p>

    <!-- ── сцена ────────────────────────────────────────────────────────── -->
    <div
      class="fc-stage" :class="{ 'is-preview': preview }"
      :role="preview ? 'button' : undefined" :tabindex="preview ? 0 : undefined"
      :aria-label="preview ? t.forge.coreOpenHint : undefined"
      @keydown.enter.prevent="preview && expand()"
      @keydown.space.prevent="preview && expand()"
    >
      <svg class="fc-svg" :viewBox="`0 0 ${box} ${box}`">
        <defs>
          <!-- Налив грани. Растущий круг обрезает её горящую часть: сколько
               кристаллов зажжено, до того шага и дошёл свет. Делений внутри
               грани нет — ступень даёт остановка движения, а не линия. -->
          <clipPath v-for="f in facets" :key="`cf${f.id}`" :id="id('flow-' + f.id)">
            <circle class="fc-flow-clip" cx="0" cy="0" r="1" :style="flowStyle(f)" />
          </clipPath>
          <!-- Свет внутри кристалла: от сердца к концу грани. -->
          <linearGradient
            v-for="c in allCrystals" :key="`cg${c.key}`"
            :id="id('lit-' + c.key)" gradientUnits="userSpaceOnUse"
            :x1="c.near[0]" :y1="c.near[1]" :x2="c.far[0]" :y2="c.far[1]"
          >
            <stop offset="0" stop-color="currentColor" stop-opacity=".9" />
            <stop offset="1" stop-color="currentColor" stop-opacity=".25" />
          </linearGradient>
        </defs>

        <!-- Пустое место. Отпустил здесь — не выбрано ничего. -->
        <rect class="fc-void" x="0" y="0" :width="box" :height="box" />

        <!-- ЯДРО: фигура, налив и пустое гнездо вынесенной грани. -->
        <g class="fc-core" :style="coreStyle">
          <!-- ⚠️ :fill выключен: своё бегущее заполнение ядра — бесконечная
               петля, а здесь наливом управляет зажигание кристаллов. Сам
               компонент при этом не правится: у него для этого есть свойство. -->
          <HexCore mode="full" :hue="hue" :flicker="true" :fill="false" />

          <g v-for="f in facets" :key="`fl${f.id}`" :clip-path="`url(#${id('flow-' + f.id)})`">
            <polygon class="fc-flow" :points="f.points" />
          </g>

          <polygon v-if="selFacet" class="fc-socket" :points="selFacet.points" />

          <!-- ⚠️ Полотно ведения. Прозрачное и во весь шестиугольник: грань
               берётся по ближайшей середине, зазоров между зонами нет.
               Слушаем и pointerdown, а не только pointermove: на телефоне при
               касании ведения не приходит вовсе. -->
          <polygon class="fc-pad" :points="plate" v-on="padHandlers" />
        </g>

        <!-- ТРИ ГРАНИ. На ядре у грани нет своего рисунка — только подсветка
             под пальцем. Огранка появляется у той одной, что вынесена. -->
        <g
          v-for="f in facets" :key="f.id"
          class="fc-facet"
          :class="{ 'is-sel': sel === f.id, 'is-guided': guideFacetId === f.id }"
          :style="sel === f.id ? facetStyle : coreStyle"
        >
          <!-- ⚠️ Подсветка НЕЙТРАЛЬНАЯ, не цветом ядра: цветом ядра показан
               налив, и подсвеченная незажжённая грань читалась бы зажжённой.
               И не розовая: показ будущего выбора — ещё не действие. -->
          <polygon class="fc-facet__glow" :points="f.points" />

          <template v-if="sel === f.id">
            <polygon class="fc-shard__body" :points="f.points" />
            <polygon
              v-for="(bv, bi) in f.bevels" :key="`fb${bi}`"
              class="fc-bevel" :class="f.faces[bi]" :points="bv"
            />
            <polygon class="fc-shard__face" :points="f.inner" />

            <!-- Налив на самой вынесенной грани: тот же растущий круг, что и
                 на ядре позади. Одно состояние, показанное в двух местах. -->
            <g :clip-path="`url(#${id('flow-' + f.id)})`">
              <polygon class="fc-flow" :points="f.points" />
            </g>

            <polygon
              class="fc-cpad" :points="f.points"
              @pointerdown="onFacetDown" @pointermove="onFacetMove"
              @pointerup="onFacetUp" @pointercancel="clearGuide" @pointerleave="clearGuide"
            />
          </template>

          <polygon
            v-if="!preview"
            class="fc-facet__key" :points="f.points"
            role="button" tabindex="0" :aria-label="facetName(f)"
            @keydown.enter.prevent="chooseFacet(f)"
            @keydown.space.prevent="chooseFacet(f)"
            @focus="guide = { kind: 'facet', key: f.id }"
            @blur="clearGuide"
          />
        </g>

        <!-- ПЯТЬ КРИСТАЛЛОВ вынесенной грани: гнёзда по её длине, в каждом
             один, формой — маленькое сердце. -->
        <g
          v-for="c in selCrystals" :key="c.key"
          class="fc-cryst"
          :class="{
            'is-sel': cry === c.index,
            'is-guided': guideCryIndex === c.index,
            'is-lit': isLit(c),
            'is-spent': !isLit(c) && !canLightAny,
          }"
          :style="cry === c.index ? crystalStyle(c) : facetStyle"
        >
          <polygon class="fc-shard__body" :points="c.points" />
          <polygon
            v-for="(bv, bi) in c.bevels" :key="`cb${bi}`"
            class="fc-bevel" :class="c.faces[bi]" :points="bv"
          />
          <polygon class="fc-shard__face" :points="c.inner" />
          <polygon
            v-if="isLit(c)" class="fc-shard__lit"
            :points="c.inner" :fill="`url(#${id('lit-' + c.key)})`"
          />
          <polygon class="fc-cryst__glow" :points="c.inner" />

          <text
            v-if="cry !== c.index"
            class="fc-cryst__name"
            :x="c.labX" :y="c.labY"
            :transform="`rotate(${-facetTurn(selFacet)} ${c.labX} ${c.labY})`"
            :style="{ fontSize: `${labFont(c)}px` }"
          >{{ crystalName(c) }}</text>

          <polygon
            class="fc-cryst__key" :points="c.points"
            role="button" tabindex="0" :aria-label="crystalName(c)"
            @keydown.enter.prevent="chooseCrystal(c)"
            @keydown.space.prevent="chooseCrystal(c)"
            @focus="guide = { kind: 'crystal', key: c.index }"
            @blur="clearGuide"
          />
        </g>

        <!-- Отклик на выбор. ⚠️ Отдельным слоем и ПОСЛЕДНИМ в порядке: летящий
             предмет стартует ровно с места вспышки и закрывал её собой.
             Цвет — нейтральный (см. .fc-flash в forge.css), розового на сцене нет. -->
        <g v-if="flash" class="fc-flash" :style="flashStyle" aria-hidden="true">
          <polygon :points="flash.points" />
        </g>
      </svg>
    </div>

    <!-- ── что сейчас открыто ───────────────────────────────────────────── -->
    <div ref="readEl" class="fc-read" :class="{ 'is-more': moreBelow }" @scroll.passive="updateMore">
      <template v-if="level === 'core'">
        <p class="fc-hint">{{ preview ? t.forge.coreOpenHint : t.forge.coreHint }}</p>
      </template>

      <template v-else>
        <header class="fc-head">
          <span class="fc-kicker">{{ facetName(selFacet) }}</span>
          <h3 v-if="level === 'crystal'" class="fc-name">{{ crystalName(selCrystal) }}</h3>
        </header>

        <p v-if="level === 'facet'" class="fc-hint fc-hint--left">{{ t.forge.facetHint }}</p>

        <!-- ОПИСАНИЕ КРИСТАЛЛА — две вещи и ни одной цифры (ТЗ 24.09.2026):
             что он даёт бойцу в бою, и как он меняет его манеру. Подписи CHARACTER
             над второй строкой больше нет (ТЗ 30.09.2026, v3): строка и так
             читается как характер, а место нужно под размер.
             ⚠️ Предложения набраны своим регистром, а не капителью: капитель в
             системе отведена лейблам и ударным словам до трёх. -->
        <div v-else-if="cryText" class="fc-lines">
          <p class="fc-line fc-line--effect">{{ cryText.effect }}</p>
          <p class="fc-char">
            <span class="fc-char__text">{{ cryText.character }}</span>
          </p>
        </div>
      </template>
    </div>

    <!-- ── действие и возврат ───────────────────────────────────────────── -->
    <div class="fc-foot">
      <button
        v-if="level === 'crystal' && canLightSel"
        type="button" class="fc-light" @click="lightUp"
      >{{ t.forge.lightUp }}</button>
      <!-- Все места заняты, а этот кристалл не горит: кнопка на месте, но выключена.
           Убирать её нельзя — игрок не понял бы, куда она делась; текст и вид те же,
           меняется только состояние. -->
      <button
        v-else-if="level === 'crystal' && poolBlocksSel"
        type="button" class="fc-light" disabled
      >{{ t.forge.lightUp }}</button>
      <!-- ПОГАСИТЬ — бесплатно и без подтверждения (ТЗ 30.09.2026). Стоит на месте
           кнопки зажигания: кристалл либо горит, либо нет, и кнопка одна. -->
      <button
        v-else-if="level === 'crystal' && canQuenchSel"
        type="button" class="fc-out" @click="putOut"
      >{{ t.forge.putOut }}</button>
      <p v-else-if="level === 'crystal' && whySel" class="fc-why">{{ whySel }}</p>
      <!-- РЯД ЗАНЯТОГО. Отдельной строкой ПОД кнопкой, а не сбоку: рядом с яркой
           кнопкой он терялся. Столько шестиугольников, сколько разрешает потолок;
           заливаются слева направо цветом ядра — независимо от того, какие именно
           кристаллы зажжены. Для чтения с экрана — текстовая подпись. -->
      <div
        v-if="!preview" class="fc-pips" :style="{ '--core': hue }"
        role="img" :aria-label="litText"
      >
        <svg
          v-for="i in resource" :key="i" class="fc-pip"
          :class="{ 'is-lit': i <= spent, 'is-new': i - 1 === pipFlash }"
          :viewBox="pipBox" aria-hidden="true"
        >
          <polygon class="fc-pip__ring" :points="heart" />
          <polygon class="fc-pip__hex" :points="heart" />
        </svg>
      </div>
      <p v-if="!preview && spentFull" class="fc-noroom" role="status">{{ t.forge.noRoom }}</p>
      <button v-if="level !== 'core' && !expanded" type="button" class="fc-back" @click="goBack">
        {{ level === 'crystal' ? t.forge.backToFacet : t.forge.backToCore }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, useId } from 'vue';
import { t, interpolate } from '@/locales/index.js';
import HexCore from '@/components/core/HexCore.vue';
import { coreFacets } from '@/data/coreFacets.js';
import { getCore, RESOURCE } from '@/data/upgradeData.js';
import { facetTitle, crystalTitle, crystalText } from '@/data/crystalTexts.js';

const props = defineProps({
  coreId: { type: String, required: true },
  // ⚠️ ДЕРЕВО БОЙЦА КАК ОНО ЛЕЖИТ В ХРАНИЛИЩЕ: массив из трёх ветвей, у каждой
  // пять «faces». По верному словарю это ТРИ ГРАНИ по ПЯТЬ КРИСТАЛЛОВ. Имена
  // в данных не трогаем — они часть счёта, а счёт не меняется.
  tree: { type: Array, default: () => [] },
  // Сколько уже зажжено и сколько всего можно. Решают, можно ли ещё зажигать, и
  // рисуют ряд шестиугольников. Потолок по умолчанию — RESOURCE, а не своё число:
  // второго места, где он записан, быть не должно.
  spent: { type: Number, default: 0 },
  resource: { type: Number, default: RESOURCE },
  // Отказы приходят готовыми ключами сверху: { light, quench }. Свой счёт
  // правил здесь не заводится — две копии разошлись бы в первый же день.
  gates: { type: Object, default: () => ({}) },
  // Кто открыт — одной строкой над фигурой. Панель знает это и так; здесь
  // просто показывается, чтобы над ядром не стояла её четырёхстрочная шапка.
  fighterName: { type: String, default: '' },
  coreName: { type: String, default: '' },
  // Маленькая карточка: только нажатие, оно разворачивает ядро (см. шапку файла).
  preview: { type: Boolean, default: false },
  // Разворот на весь экран: композиция крупнее и по центру, «назад» снаружи.
  expanded: { type: Boolean, default: false },
});
const emit = defineEmits(['toggle', 'expand']);

const uid = useId();
const id = (n) => `fc-${n}-${uid}`;

/* ── геометрия: вся из общей фигуры ────────────────────────────────────── */
const fig = coreFacets('full');
const box = fig.box;
const plate = fig.plate;
const heart = fig.heart;
const facets = fig.facets;
const allCrystals = facets.flatMap((f) => f.crystals);
const fillStops = facets[0].fillStops;

const hue = computed(() => getCore(props.coreId).hue);

/* Три уровня глубины, один приём на всех: выбранное выходит вперёд, остальное
   уходит назад. Числа — в единицах холста (0…600). */
const L = {
  facet: { x: 210, y: 332, k: 2.3, coreLift: -238, coreK: 0.18 },
  crystal: { x: 372, y: 300, k: 11, facetX: 100, facetY: 322, facetK: 0.95, coreLift: -252, coreK: 0.14 },
};
/* Сколько места остаётся подписи справа от грани, в единицах холста. */
const LABEL_ROOM = 290;
/* Доля ширины знака к кеглю у моноширинного шрифта. */
const GLYPH_W = 0.62;

/* ── где мы сейчас ─────────────────────────────────────────────────────── */
const sel = ref(null);   // ключ грани: a · b · c
const cry = ref(null);   // номер кристалла внутри неё: 0…4
const level = computed(() => (cry.value !== null ? 'crystal' : sel.value ? 'facet' : 'core'));

/* Что под пальцем. Подсвечена ВСЕГДА ОДНА единица: на ядре — целая грань
   (кристаллы на ядре не подсвечиваются и не выбираются никогда), на
   вынесенной грани — один кристалл. */
const guide = ref(null);
const clearGuide = () => { guide.value = null; };
const guideFacetId = computed(() => (guide.value?.kind === 'facet' ? guide.value.key : null));
const guideCryIndex = computed(() => (guide.value?.kind === 'crystal' ? guide.value.key : null));

/* Другой боец — другое дерево: возвращаемся к ядру и забываем выбор. */
watch(() => props.coreId, () => { sel.value = null; cry.value = null; clearGuide(); });
watch(() => props.tree, () => { clearGuide(); });

/* ── мост к игровым данным ─────────────────────────────────────────────── */
const branchOf = (f) => (f ? props.tree.find((b) => b.id === f.id) || null : null);
const faceOf = (c) => branchOf(facets.find((f) => f.id === c.facetId))?.faces?.[c.index] || null;
const isLit = (c) => faceOf(c)?.state === 'lit';
const facetLitCount = (f) => {
  const b = branchOf(f);
  return b ? b.faces.filter((x) => x.state === 'lit').length : 0;
};

/* ИМЕНА — ИЗ СЛОЯ ТЕКСТОВ, а не из игровых данных (ТЗ 24.09.2026 §4.3).
   В данных имя кристалла было и ключом содержания, и надписью на экране; теперь
   они разведены. Ключи (branch.id · face.id) не тронуты — они часть счёта.
   Запасной вариант — прежнее имя из данных: если слой текстов вдруг не знает
   этого места, гнездо покажет старую подпись, а не пустоту. */
const facetName = (f) => (f ? (facetTitle(f.id) || branchOf(f)?.name || f.id.toUpperCase()) : '');
const crystalName = (c) => (c ? (crystalTitle(c.facetId, c.index) || faceOf(c)?.name || '') : '');

const selFacet = computed(() => facets.find((f) => f.id === sel.value) || null);
const selCrystals = computed(() => selFacet.value?.crystals || []);
const selCrystal = computed(() => (cry.value === null ? null : selCrystals.value[cry.value] || null));

/* ОПИСАНИЕ — настоящий текст кристалла: что он даёт в бою и как меняет манеру
   (ТЗ 24.09.2026). Прежде здесь шёл перечень фраз эффектов из игровых данных —
   прозы у кристаллов не было вовсе. Теперь она есть, и лежит отдельно от счёта.
   ⚠️ НИ ОДНОЙ ЦИФРЫ: ни процентов, ни остатка прав. Их отдельный проход позже. */
const cryText = computed(() => (selCrystal.value
  ? crystalText(selCrystal.value.facetId, selCrystal.value.index)
  : null));

/* ── можно ли зажигать ─────────────────────────────────────────────────── */
const canLightAny = computed(() => !props.gates.light && props.spent < props.resource);
const canLightSel = computed(() => {
  const c = selCrystal.value;
  const f = selFacet.value;
  const b = branchOf(f);
  if (!c || !b) return false;
  return faceOf(c)?.state === 'open'
    && canLightAny.value
    && facetLitCount(f) < b.limit;
});
/* Зажжённый гасится — бесплатно, в любой момент (ТЗ 30.09.2026). Условий нет. */
const canQuenchSel = computed(() => faceOf(selCrystal.value)?.state === 'lit');
/* Почему открытый кристалл не зажечь: грань заполнена. Второй случай — потолок
   бойца — показывается не строкой причины, а выключенной кнопкой и строкой «нет
   места» под рядом (poolBlocksSel, spentFull). Занятие среди причин больше не
   стоит (facetGate). */
const whySel = computed(() => {
  const c = selCrystal.value;
  const f = selFacet.value;
  const b = branchOf(f);
  const g = t.value.forge;
  if (!c || !b || isLit(c)) return '';
  if (facetLitCount(f) >= b.limit) return g.whyFacetFull;
  return '';
});
/* Все места заняты. Решает и выключенную кнопку, и строку «нет места». */
const spentFull = computed(() => props.spent >= props.resource);
/* Этот кристалл не горит, а места нет: кнопка зажигания показывается выключенной.
   ⚠️ Если заодно полна и его грань — всё равно она: чинится обоими способами одним и
   тем же действием (погасить любой), и две причины подряд игроку ни к чему. */
const poolBlocksSel = computed(() => spentFull.value && faceOf(selCrystal.value)?.state === 'open');
/* Подпись ряда для чтения с экрана: `3 OF 7 CRYSTALS LIT`. Число считает хранилище. */
const litText = computed(() => interpolate(t.value.forge.litCount, { n: props.spent, max: props.resource }));

/* ── ряд шестиугольников ───────────────────────────────────────────────── */
/* ⚠️ ФОРМА — СЕРДЦЕ ЯДРА, та же, что у кристалла и у ядра на лендинге, входе и деке
   (`heart` из coreFacets). Своей геометрии ряд не рисует: берётся её обводка и
   рамка вида подгоняется под неё с полем на толщину линии. */
const heartPts = heart.split(' ').map((p) => p.split(',').map(Number));
const pipBox = (() => {
  const xs = heartPts.map((p) => p[0]);
  const ys = heartPts.map((p) => p[1]);
  const pad = 2;
  const x0 = Math.min(...xs) - pad;
  const y0 = Math.min(...ys) - pad;
  return `${x0.toFixed(2)} ${y0.toFixed(2)} ${(Math.max(...xs) + pad - x0).toFixed(2)} ${(Math.max(...ys) + pad - y0).toFixed(2)}`;
})();

/* ВСПЫШКА при зажигании: только что заполненный шестиугольник. Только когда
   зажжён РОВНО один кристалл — смена бойца или «Зеркало» меняют счёт скачком, и
   вспыхивать тогда нечему. Длина — в CSS (.fc-pip.is-new), здесь только срок, после
   которого метка снимается. */
const PIP_FLASH_MS = 520;
const pipFlash = ref(null);
let pipTimer = 0;
watch(() => props.spent, (n, o) => {
  clearTimeout(pipTimer);
  pipFlash.value = null;
  if (n !== o + 1) return;
  pipFlash.value = n - 1;
  pipTimer = setTimeout(() => { pipFlash.value = null; }, PIP_FLASH_MS);
});
onBeforeUnmount(() => clearTimeout(pipTimer));

/* ── текстовая часть карточки прокручивается, кнопка и ряд — нет ────────────
   В развороте высоты может не хватать (телефон стоя с крупным текстом, лёжа тем
   более): тогда прокручивается ТОЛЬКО .fc-read, а .fc-foot остаётся прижатым к
   низу. Полосы прокрутки нет (см. forge.css); что ниже есть ещё — говорит мягкое
   затемнение нижней кромки, класс is-more. Он снимается, когда дошли до конца или
   когда всё помещается. */
const readEl = ref(null);
const moreBelow = ref(false);
function updateMore() {
  const el = readEl.value;
  moreBelow.value = !!el && el.scrollHeight - el.clientHeight - el.scrollTop > 2;
}
let readRo = null;
onMounted(() => {
  if (typeof ResizeObserver === 'undefined' || !readEl.value) return;
  readRo = new ResizeObserver(updateMore);
  readRo.observe(readEl.value);
  updateMore();
});
onBeforeUnmount(() => { if (readRo) readRo.disconnect(); });
/* Другой уровень или другой кристалл — текст другой: читать с начала. */
watch([level, () => sel.value, () => cry.value], () => {
  requestAnimationFrame(() => {
    if (readEl.value) readEl.value.scrollTop = 0;
    updateMore();
  });
});

/* ── налив ─────────────────────────────────────────────────────────────── */
const flowStyle = (f) => ({
  transform: `translate(${box / 2}px, ${box / 2}px) scale(${fillStops[facetLitCount(f)]})`,
});

/* ── подписи кристаллов ────────────────────────────────────────────────── */
const labFont = (c) => {
  if (props.expanded) return c.labSize;    // в развороте место считает EXP, а не LABEL_ROOM
  const n = crystalName(c).length || 1;
  return +Math.min(c.labSize, (LABEL_ROOM / L.facet.k) / (GLYPH_W * n)).toFixed(3);
};

/* ── движение между уровнями ───────────────────────────────────────────── */
/* ⚠️ ВСЕ КОНЦЫ ПЕРЕХОДА ЗАПИСАНЫ ОДИНАКОВО: translate · rotate · scale ·
   translate. Покой — это НЕ 'none'. Браузер переходит между двумя записями по
   частям, и если в покое стоит 'none', предмет успевает вырасти раньше, чем
   доехать, и в середине перехода улетает за край. */
const hold = (x, y, rot, k, ox, oy) =>
  `translate(${x}px, ${y}px) rotate(${rot}deg) scale(${k}) translate(${-ox}px, ${-oy}px)`;

/* Вынесенная грань доворачивается так, как стоит верхняя: клин встаёт ровно,
   сердцем вниз, и подписи читаются, а не стоят боком. */
const facetTurn = (f) => (f ? -(f.deg + 90) : 0);

const coreStyle = computed(() => {
  const c = box / 2;
  if (level.value === 'crystal') return { transform: hold(c, c + L.crystal.coreLift, 0, L.crystal.coreK, c, c) };
  if (level.value === 'facet') return { transform: hold(c, c + L.facet.coreLift, 0, L.facet.coreK, c, c) };
  return { transform: hold(c, c, 0, 1, c, c) };
});
/* ── композиция РАЗВОРОТА (expanded) ───────────────────────────────────
   Правка 1 к ТЗ 29.09.2026. Раньше на уровне грани связка «грань + столбец
   кристаллов» стояла мелкой и не по центру, а подпись уровня жила отдельно внизу
   слева. Теперь блок считается ПО ГЕОМЕТРИИ, а не числами на глаз: берём границы
   поставленной ровно грани и её подписей и вписываем блок в экран по высоте, а
   центрируем по его настоящей ширине (у BODY / MIND / WILL подписи разной длины,
   и один общий x сдвигал бы блок то влево, то вправо).

   Числа — в единицах холста (0…600), крутить здесь:
     blockH    — какой высоты блок «грань + подписи» на уровне грани
     blockMaxW — сколько по ширине ему можно, если подписи вдруг длиннее
     centerY   — высота центра блока (над ним остаётся место под ядро-метку)
     colK      — масштаб столбца на уровне кристалла
     cryK      — масштаб выбранного кристалла
     gap       — зазор между столбцом с подписями и большим кристаллом */
const EXP = { blockH: 430, blockMaxW: 540, centerY: 335, colK: 2.0, cryK: 12, gap: 22 };
/* Точка холста после поворота на deg вокруг (ox, oy) — как её ставит transform. */
const rotAbout = (p, ox, oy, deg) => {
  const a = (deg * Math.PI) / 180;
  const dx = p[0] - ox; const dy = p[1] - oy;
  return [dx * Math.cos(a) - dy * Math.sin(a), dx * Math.sin(a) + dy * Math.cos(a)];
};
const ptsOf = (str) => str.trim().split(/\s+/).map((q) => q.split(',').map(Number));
/* Границы поставленной ровно грани вместе с подписями кристаллов, относительно её
   центра. Ширина подписи — по знаку моноширинного шрифта плюс разрядка. */
function facetBlock(f) {
  const turn = facetTurn(f);
  const q = ptsOf(f.points).map((p) => rotAbout(p, f.cx, f.cy, turn));
  let x0 = Math.min(...q.map((p) => p[0])); let x1 = Math.max(...q.map((p) => p[0]));
  let y0 = Math.min(...q.map((p) => p[1])); let y1 = Math.max(...q.map((p) => p[1]));
  for (const c of f.crystals) {
    const lp = rotAbout([c.labX, c.labY], f.cx, f.cy, turn);
    const w = c.labSize * (GLYPH_W + 0.16) * (crystalName(c).length || 1);
    x1 = Math.max(x1, lp[0] + w);
    y0 = Math.min(y0, lp[1] - c.labSize / 2); y1 = Math.max(y1, lp[1] + c.labSize / 2);
  }
  return { x0, x1, y0, y1 };
}
/* Выбранный кристалл поставленной грани: его ширина по x (для центровки связки). */
function crystalWidth(c, f) {
  const q = ptsOf(c.points).map((p) => rotAbout(p, c.cx, c.cy, facetTurn(f)));
  return Math.max(...q.map((p) => p[0])) - Math.min(...q.map((p) => p[0]));
}
/* Поза грани в развороте на уровне «грань»: блок по центру. */
function expFacetPose(f) {
  const b = facetBlock(f);
  const k = Math.min(EXP.blockH / (b.y1 - b.y0), EXP.blockMaxW / (b.x1 - b.x0));
  return { x: box / 2 - k * (b.x0 + b.x1) / 2, y: EXP.centerY - k * (b.y0 + b.y1) / 2, k };
}
/* На уровне «кристалл»: столбец с подписями слева и большой кристалл справа —
   вместе, по центру экрана. */
function expCrystalPose(f, c) {
  const b = facetBlock(f);
  const kc = EXP.colK;
  const colW = (b.x1 - b.x0) * kc;
  const cryW = crystalWidth(c, f) * EXP.cryK;
  const left = (box - (colW + EXP.gap + cryW)) / 2;
  return {
    facet: { x: left - b.x0 * kc, y: box / 2 - kc * (b.y0 + b.y1) / 2, k: kc },
    cryX: left + colW + EXP.gap + cryW / 2,
  };
}

const facetStyle = computed(() => {
  const f = selFacet.value;
  const c = box / 2;
  if (!f) return coreStyle.value;
  const turn = facetTurn(f);
  if (props.expanded) {
    const P = level.value === 'crystal' && selCrystal.value
      ? expCrystalPose(f, selCrystal.value).facet
      : expFacetPose(f);
    return { transform: hold(P.x, P.y, turn, P.k, f.cx, f.cy) };
  }
  return level.value === 'crystal'
    ? { transform: hold(L.crystal.facetX, L.crystal.facetY, turn, L.crystal.facetK, f.cx, f.cy) }
    : { transform: hold(L.facet.x, L.facet.y, turn, L.facet.k, f.cx, f.cy) };
});
const crystalStyle = (c) => (props.expanded
  ? { transform: hold(expCrystalPose(selFacet.value, c).cryX, box / 2, facetTurn(selFacet.value), EXP.cryK, c.cx, c.cy) }
  : { transform: hold(L.crystal.x, L.crystal.y, facetTurn(selFacet.value), L.crystal.k, c.cx, c.cy) });

/* Отклик на выбор — на миг, там, где отпустили. НЕЙТРАЛЬНЫЙ, не розовый: при выборе
   ничего не срабатывает (розовое свечение принадлежит срабатыванию предмета), а цвет
   ядра показывает налив, и вспышка им читалась бы зажжённой (ТЗ 30.09.2026, работа 3). */
const flash = ref(null);
let flashTimer = null;
const flashStyle = computed(() => (flash.value?.level === 'crystal' ? facetStyle.value : coreStyle.value));
function pulse(points, lvl) {
  flash.value = { points, level: lvl };
  if (flashTimer) clearTimeout(flashTimer);
  flashTimer = setTimeout(() => { flash.value = null; }, 220);
}

/* ── попадание пальцем ─────────────────────────────────────────────────
   Зоны не рисуются плиткой: разбор идёт по БЛИЖАЙШЕЙ середине. Зазоров нет,
   зоны не налезают — палец между двумя, выигрывает та, чья середина ближе.
   Сердце вырезано из зоны самой своей кромкой, а не кругом на глаз. */
function toCanvas(e) {
  const m = e.currentTarget.getScreenCTM();
  if (!m) return null;
  const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
  return [p.x, p.y];
}
function inPoly(pt, points) {
  const q = points.trim().split(/\s+/).map((s) => s.split(',').map(Number));
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
  /* ⚠️ Проверка «внутри ли фигуры» обязательна, хотя полотно и есть сам
     шестиугольник: палец захвачен, и события приходят даже когда он ушёл за
     край. Без неё подсветка не гасла, а отпускание в пустоте выбирало грань. */
  if (!pt || !inPoly(pt, plate) || inPoly(pt, heart)) return null;
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
   фигуры не доходит до полотна, и подсветка залипает. */
function grab(e) { try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* не критично */ } }

function guideFacet(e) {
  if (level.value !== 'core') { clearGuide(); return null; }
  const f = nearestFacet(e);
  guide.value = f ? { kind: 'facet', key: f.id } : null;
  return f;
}
/* В превью у полотна один обработчик — нажатие. Ведения, захвата пальца и подсветки
   нет: грань здесь не выбирается никогда. Остальные — прежние, без изменений. */
function expand() { emit('expand'); }
/* Нажатие, а не ведение: если палец (или мышь) ушёл дальше нескольких точек между
   опусканием и отпусканием, это была попытка прокрутить панель или провести по
   ядру, и разворачивать ничего не нужно. Открываем по click, а не по pointerup:
   отпускание, которое открыло бы слой, не должно потом сработать как касание по
   самому слою. */
const TAP_SLOP = 10;
let padDown = null;
function padPress(e) { padDown = [e.clientX, e.clientY]; }
function padClick(e) {
  const d = padDown;
  padDown = null;
  if (d && Math.hypot(e.clientX - d[0], e.clientY - d[1]) > TAP_SLOP) return;
  expand();
}
function onCoreDown(e) { grab(e); guideFacet(e); }
function onCoreMove(e) { guideFacet(e); }
function onCoreUp(e) {
  if (level.value !== 'core') { clearGuide(); goBack(); return; }
  const f = guideFacet(e);
  clearGuide();
  if (f) chooseFacet(f);
}

const padHandlers = computed(() => (props.preview
  ? { pointerdown: padPress, click: padClick }
  : {
    pointerdown: onCoreDown, pointermove: onCoreMove, pointerup: onCoreUp,
    pointercancel: clearGuide, pointerleave: clearGuide,
  }));

function guideCrystal(e) {
  if (level.value !== 'facet') { clearGuide(); return null; }
  const c = nearestCrystal(e);
  guide.value = c ? { kind: 'crystal', key: c.index } : null;
  return c;
}
function onFacetDown(e) { grab(e); guideCrystal(e); }
function onFacetMove(e) { guideCrystal(e); }
function onFacetUp(e) {
  if (level.value === 'crystal') { clearGuide(); goBack(); return; }
  const c = guideCrystal(e);
  clearGuide();
  if (c) chooseCrystal(c);
}

/* ── переходы ──────────────────────────────────────────────────────────── */
function chooseFacet(f) {
  if (level.value !== 'core') return;
  pulse(f.points, 'facet');
  sel.value = f.id;
  cry.value = null;
}
function chooseCrystal(c) {
  if (level.value !== 'facet') return;
  pulse(c.points, 'crystal');
  cry.value = c.index;
}
/* ⚠️ Наружу уходят СТАРЫЕ ИМЕНА: crystalId — это грань, faceId — кристалл.
   Так их зовёт хранилище, и переименование здесь тронуло бы счёт. */
function lightUp() {
  if (!canLightSel.value) return;
  emit('toggle', { crystalId: selFacet.value.id, faceId: faceOf(selCrystal.value).id });
}
/* Погасить — то же событие toggle: хранилище само различает «горит» и «нет». */
function putOut() {
  if (!canQuenchSel.value) return;
  emit('toggle', { crystalId: selFacet.value.id, faceId: faceOf(selCrystal.value).id });
}
function goBack() {
  clearGuide();
  if (level.value === 'crystal') { cry.value = null; return; }
  if (level.value === 'facet') sel.value = null;
}
/* ⚠️ КАРТОЧКА ПОКАЗЫВАЕТ ТО, РАДИ ЧЕГО ОТКРЫТА. Панель прокручивается, и над
   ядром стоит кнопка занятия, а под ним — описание и возврат; вместе они выше,
   чем панель в самой низкой раскладке (лёжа на телефоне у неё всего 390).
   Замерено: без этого сперва ядро целиком уходило под нижний край, а после
   правки высоты — уходил возврат, и с кристалла было не выйти кнопкой.

   Правило простое и на оба случая одно: на ядре карточку ставим ВЕРХОМ (главное
   здесь — сама фигура), глубже — НИЗОМ (главное — описание и кнопки под ним;
   верх фигуры при этом подрезается, и это меньшая потеря, чем недоступная
   кнопка). Порядок блоков не трогаем: занятие стоит над ядром потому, что
   именно оно его и открывает. */
const rootEl = ref(null);
function scrollBox() {
  let box = rootEl.value?.parentElement;
  while (box && box.scrollHeight <= box.clientHeight + 1) box = box.parentElement;
  return box || null;
}
function showCard() {
  /* Через кадр, а не сразу: на самом монтировании и в момент смены уровня
     панель ещё не разложена, прокрутки у неё ещё нет и искать нечего. */
  requestAnimationFrame(() => {
    const el = rootEl.value;
    const box = scrollBox();
    if (!el || !box) return;
    const top = el.offsetTop - box.offsetTop;
    box.scrollTop = level.value === 'core'
      ? top
      : Math.max(top, top + el.offsetHeight - box.clientHeight);
  });
}
onMounted(showCard);
watch(level, showCard);

/* Esc идёт вверх по уровням, прежде чем зал выйдет из работы с бойцом. */
function stepBack() {
  if (level.value === 'core') return false;
  goBack();
  return true;
}
defineExpose({ stepBack });
</script>
