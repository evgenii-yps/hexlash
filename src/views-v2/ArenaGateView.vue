<!-- ArenaGateView — /play/gate: ВОРОТА АРЕНЫ, пространство за дверью ARENA.

     Путь целиком, каким он станет: дом → FIGHT → острова режимов → дверь ARENA →
     пролёт камеры внутрь острова → чёрный кадр → экран загрузки → растемнение
     ВМЕСТЕ с подлётом камеры → острова выбора режима → острова выбора бойцов →
     объёмная кнопка старта → арена.

     ДВА ШАГА, ОДНО ПРОСТРАНСТВО. Сначала выбирают режим боя, потом бойцов. Это
     не два экрана и не две сцены: сцена одна, а острова на ней меняются. Между
     шагами — та же дорога, что между пространствами: камера летит внутрь
     выбранного острова, кадр чернеет, список подменяется на чёрном, и занавес
     уходит ОДНОВРЕМЕННО с подлётом камеры к новым островам.

     ПОЧЕМУ ЗАНАВЕС ЗДЕСЬ ДЕРЖИТ ВИД. Между шагами адрес не меняется, и роутер,
     который обычно снимает занавес, к этому переходу непричастен. Занавес умеет
     подниматься и сниматься по просьбе кого угодно — просит тот, кто владеет
     экраном. Здесь это вид.

     ПОДПИСИ — DOM-текст поверх настоящих островов в 3D, а не надписи в сцене:
     текст обязан оставаться чётким на любом экране, а место ему каждый кадр
     считает сама сцена (gatePlateTags).

     ОТКАЗ. Клик по запертому острову никуда не ведёт: остров коротко дрожит
     вместе со своей подписью. Дрогнувшая плита при неподвижном имени читалась бы
     как сбой отрисовки, а не как «нельзя».

     КНОПКА В БОЙ — ПРЕДМЕТ В СЦЕНЕ, а не наклейка поверх неё: объёмная кнопка
     стоит перед островами бойцов, горит розовым, когда состав собран, и камера
     подлетает к ней в лицо (gateFightButton.js). Плоская кнопка внизу экрана
     осталась запасным путём под ?flatstart=1 — пока объёмную не проверили на
     телефоне, дорога в бой не должна зависеть только от неё.

     ⚙️ ПЛОСКИЙ ЭКРАН СОСТАВА ЖИВ. Он остаётся рабочим по адресу /play и
     достижим отсюда через ?flat=1: выбор режима тогда уводит на него, а не на
     острова. Снимут его отдельной работой, когда острова проверят на телефоне.

     Хром: та же полоса .hs-strip (home.css), что в зале FORGE и в пространстве,
     без брендового блока — ← BACK слева, SHOP + кабинет справа. Свои значения ей
     не нужны: .hs-chrome читает глобальные токены. Прижать правый кластер всё же
     приходится здесь — полоса разносит края, а слева брендового блока нет. -->
<template>
  <div class="gate-root" :class="{ 'is-diving': diving }">
    <ArenaGateScene
      ref="sceneRef"
      :items="items"
      :bodies="bodies"
      :selected="squad"
      :dive-on-pick="stage === 'mode'"
      :show-fight="stage === 'squad' && !!fighters.length"
      :fight-armed="squadFull"
      @arrived="onArrived"
      @dive-start="onDiveStart"
      @pick="onPick"
      @refused="onRefused"
      @fight="toArena"
      @fight-refused="onRefused"
    />

    <!-- Подписи островов. Позицию каждый кадр пишет сцена; здесь только текст.
         aria-hidden: это ярлык предмета в сцене, а не отдельная кнопка — нажимают
         сам остров. -->
    <div
      v-for="it in items"
      :key="it.id"
      class="gate-cap"
      :class="{
        'is-lit': tags.hovered === it.id || squad.includes(it.id),
        'is-locked': it.locked,
        'is-refused': tags.refused === it.id,
      }"
      :style="{ transform: `translate3d(${tagOf(it.id).x}px, ${tagOf(it.id).y}px, 0)` }"
      aria-hidden="true"
    >
      <div class="gc-card" :class="{ 'is-shown': !diving && tagOf(it.id).visible }">
        <span class="gc-name">{{ it.name }}</span>
        <span class="gc-desc">{{ it.tagline }}</span>
        <span v-if="it.locked" class="gc-soon">{{ it.lockLabel }}</span>
      </div>
    </div>

    <!-- ⚠️ НАДПИСИ FIGHT ЗДЕСЬ БОЛЬШЕ НЕТ. Она была: крупное слово под кнопкой,
         приклеенное к ней каждым кадром. Слово переехало НА предмет — оно
         прорезано насквозь в табличке, которая стоит на плите кнопки, и свет
         кнопки идёт сквозь его буквы. Оставить слово и здесь значило бы
         написать его дважды; строку правил (ниже) это не касается — она про
         бой, а не про кнопку. -->

    <!-- ПУСТОЙ РОСТЕР — честное состояние, а не пустое поле. Встречается,
         только если игрок распустил всех: новому гостю тройка выдаётся при
         первом входе, но заново после роспуска не выдаётся. Поле под текстом
         остаётся видимым: игрок стоит в том же месте, просто ставить на острова
         некого. Слова те же, что на плоском экране состава. -->
    <div v-if="!diving && stage === 'squad' && !fighters.length" class="gate-empty">
      <p class="ge-ttl">{{ t.gate.emptyTitle }}</p>
      <p class="ge-note">{{ t.gate.emptyNote }}</p>
      <button type="button" class="gate-go ge-go" @click="goShop">{{ t.home.shop }}</button>
    </div>

    <!-- КОМАНДНЫЙ БОЙ: сколько бойцов с каждой стороны. Стоит только там, где
         выбор есть, — у дуэли его нет вовсе. Матовый, как весь хром: светятся
         острова, а не переключатель над ними. -->
    <div v-if="!diving && stage === 'squad' && sizes.length && fighters.length" class="gate-size" role="group">
      <button
        v-for="n in sizes"
        :key="n"
        type="button"
        class="gs-btn"
        :class="{ 'is-on': n === size }"
        :aria-pressed="n === size"
        @click="pickSize(n)"
      >{{ sizeLabel(n) }}</button>
    </div>

    <!-- БАФФЫ — три слота «В бой». Стоят там же, где выбор размера состава: это
         второе и последнее, что игрок решает перед выходом на плиту. Пока
         бойцов не набрано, ряд не показывается — решать нечего. -->
    <BuffKitSlots v-if="!diving && stage === 'squad' && fighters.length" :stacked="sizes.length > 0" />

    <!-- Строка у кнопки: ПРАВИЛА выбранного режима — чем этот бой отличается от
         прочих. Пока бойцов не хватает, на её месте стоит нехватка: просить
         прочитать правила боя, в который нельзя выйти, — значит говорить не о
         том. Матовая, без свечения — светится кнопка, а не текст про неё. -->
    <p v-if="!diving && stage === 'squad' && fighters.length" class="gate-hint">{{ hint }}</p>

    <!-- ⚠️ ПЛОСКАЯ КНОПКА — запасной путь, см. шапку файла. Игроку не видна. -->
    <button
      v-if="flatStart && !diving && stage === 'squad' && squadFull"
      type="button"
      class="gate-go"
      @click="toArena"
    >{{ t.gate.toArena }}</button>

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

    <!-- Брошенный забег (CHAIN): игрока приводит сюда арена, а сообщение
         показывает этот компонент — он же и снимает отметку. Островов не
         касается и кликов не ловит. -->
    <RunInterrupted />

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
import { ref, computed, nextTick, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import BuffKitSlots from '@/components/buff/BuffKitSlots.vue';
import store from '@/core/state/store.js';
import { t, interpolate } from '@/locales/index.js';
import { getCore } from '@/data/upgradeData.js';
import { ARENA_MODES, defaultSizeFor } from '@/data/arenaModes.js';
import { layoutNameByPerSide } from '@/data/collapseLayouts.js';
import { ofLayoutByPerSide, ofLayoutNameByPerSide } from '@/data/openFieldLayouts.js';
import ArenaGateScene from '@/scene/ArenaGateScene.vue';
import PlayerCabinet from '@/views-v2/PlayerCabinet.vue';
import RunInterrupted from '@/components/chain/RunInterrupted.vue';
import { gatePlateTags } from '@/scene/gatePlateTags.js';
import { DEV_MODE } from '@/services/devMode.js';
import { raiseCurtain, dropCurtain, LOADING } from '@/services/sceneLoading.js';
import '@/styles/home.css';
import '@/styles/cabinet.css';

const router = useRouter();
const route = useRoute();
const sceneRef = ref(null);

const cabinetOpen = ref(false);
const diving = ref(false);
const tags = gatePlateTags;

// Служебные ручки, не режимы игры:
//   ?stay=1      — выбор режима не меняет шаг: можно рассматривать пространство;
//   ?flat=1      — после выбора режима уводим на ПЛОСКИЙ экран состава (/play).
//                  Он остаётся рабочим, пока острова не проверены на телефоне;
//   ?flatstart=1 — вернуть плоскую кнопку «в бой» внизу экрана. Запасной путь,
//                  пока объёмную кнопку не проверили на телефоне: дорога в бой
//                  не должна зависеть только от неё;
//   ?step=squad  — войти сразу на выбор бойцов. Этим возвращаются с итоговых
//                  панелей боя: игрок уже выбрал режим, и показывать ему выбор
//                  режима заново значит просить сделать тот же шаг дважды.
const stay = route.query.stay === '1';
const flat = route.query.flat === '1';
const flatStart = route.query.flatstart === '1';

// Шаг, с которого открывают ворота. Обычный вход — с выбора режима; возврат с
// боя — сразу на выбор бойцов. Режим и состав при этом уже лежат в сейфе, так
// что второй шаг открывается ровно тем, чем игрок его оставил.
const stage = ref(route.query.step === 'squad' ? 'squad' : 'mode');   // 'mode' | 'squad'

// Отметку СЪЕДАЕМ СРАЗУ, как только прочитали: она говорит, с чего начать, и
// после старта врёт — игрок уже мог уйти кнопкой «назад» на первый шаг, а адрес
// продолжал бы обещать второй, и обновление страницы возвращало бы туда же.
//
// ⚠️ Чистим адрес НАПРЯМУЮ, а не через роутер. `router.replace` — это переход,
// даже когда меняется одна буква в запросе: он поднимает экран загрузки
// (beforeEach) и роняет занавес (afterEach). Именно это и сломалось при первой
// сборке — «назад» со второго шага переставало работать вовсе: занавес,
// поднятый для смены шага, гасился чужим переходом, и шаг не менялся. Здесь же
// не переход, а косметика адреса, и знать о ней никому не нужно.
if (typeof window !== 'undefined' && route.query.step) {
  const u = new URL(window.location.href);
  u.searchParams.delete('step');
  window.history.replaceState(window.history.state, '', u.pathname + u.search + u.hash);
}

const reduced = typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── что стоит на островах ────────────────────────────────────────────────
// Один список на оба шага. Остров ничего не знает о том, что на нём написано:
// он умеет имя, строку под ним, цвет ядра и признак «заперт».
const fighters = computed(() => store.getters['roster/fighters']);
const squad = computed(() => store.getters['prefight/squad']);
const squadFull = computed(() => store.getters['prefight/squadFull']);
const squadLeft = computed(() => store.getters['prefight/squadLeft']);
// Размер состава: из чего выбирать и что выбрано. У дуэли список пуст — тогда
// переключателя нет.
const sizes = computed(() => store.getters['prefight/squadSizes']);
const size = computed(() => store.getters['prefight/squadSize']);
// Выбранный режим — его правила показывает строка у кнопки, а у турнира он же
// решает, какими словами подписан переключатель размера.
const modeId = computed(() => store.getters['prefight/modeId']);
// Бойцов в ростере меньше, чем просит размер. Считаем по РОСТЕРУ, а не по
// составу: «не хватает» — это про то, кого вообще некем поставить.
const shortBy = computed(() => Math.max(0, size.value - fighters.value.length));

// ЦВЕТ ЯДРА РЕЖИМА. Розового здесь нет ни у кого: он принадлежит интерфейсу и
// деньгам, а на островах стоят предметы.
//
// DUEL и SQUAD держат те цвета, с которыми игрок их уже видел, — менять их
// значило бы переучивать без причины. Трём новым островам цвета взяты из
// палитры ядер (tokens.css, --core-*): своих заводить нельзя.
//
// ОРАНЖЕВЫЙ RAIDER (#FFA526) БЫЛ ОТЛОЖЕН, И ТЕПЕРЬ ВЗЯТ. 17.09.2026 его не брали
// потому, что он почти неотличим от золота SQUAD (#FFB21D), и два таких острова
// в одном кадре читались бы как один режим в двух экземплярах. Условие было
// «нигде не рядом» — и оно выполняется: на шести островах золото стоит в дальнем
// ряду (лёжа) или в первой паре (стоя), а маяк — в противоположном углу. Ни в
// одной из двух раскладок они не оказываются соседями ни по ряду, ни по столбцу.
// Это последний цвет палитры ядер; седьмому острову брать было бы нечего, и
// заводить новый цвет ради него нельзя — палитра закрыта.
//
// Порядок соседства проверен по обеим раскладкам: лёжа ряды «бирюза-золото-
// бирюза» и «красный-фиолетовый-оранжевый», стоя пары «бирюза-золото»,
// «бирюза-красный», «фиолетовый-оранжевый». Соседи нигде не совпадают и нигде не
// близки по тону.
const MODE_CORE = {
  duel:      '#4DD9FF',   // холодный — как стоял
  squad:     '#FFB21D',   // тёплый — как стоял
  chain:     '#2ED6B0',   // --core-skala   (BULWARK)
  raid:      '#FF3344',   // --core-natisk  (ONSLAUGHT)
  collapse:  '#9461FF',   // --core-zasada  (AMBUSH)
  openfield: '#FFA526',   // --core-nalet   (RAIDER)
};

const modeItems = computed(() => ARENA_MODES.map((m) => ({
  id: m.id, name: m.name, tagline: m.tagline, locked: m.locked,
  lockLabel: t.value.gate.soon,
  core: MODE_CORE[m.id] || undefined,
  // Вид эмблемы совпадает с идентификатором режима — у каждого режима своя, и
  // второго имени для той же вещи заводить незачем (см. gateEmblems).
  emblem: m.id,
})));

// Состояние «в кузнице» нарисовано, но до демо не встречается: тренировки в игре
// ещё нет и ставить бойца туда некому. Чтобы его всё же можно было увидеть, в
// служебном режиме (?dev=1) адрес принимает ?forge=N — столько первых островов
// показать занятыми. Это ТОЛЬКО показ: в данные ничего не пишется. Та же ручка
// и с тем же именем стоит на плоском экране состава.
const previewForge = (() => {
  if (!DEV_MODE) return 0;
  const n = parseInt(route.query.forge || '0', 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
})();

// Занятие могло кончиться, пока игрок шёл сюда. Спрашиваем часы, иначе карточка
// осталась бы запертой «IN THE FORGE» у бойца, который давно свободен.
onMounted(() => store.dispatch('roster/settleTraining'));

const fighterItems = computed(() => fighters.value.map((f, i) => {
  const core = getCore(f.core);
  const busy = f.busy === true || i < previewForge;
  return {
    id: f.id,
    name: f.callsign,
    tagline: busy ? t.value.gate.inForge : (core?.name || ''),
    locked: busy,
    lockLabel: t.value.gate.forge,
    core: core?.hue,
  };
}));

const items = computed(() => (stage.value === 'mode' ? modeItems.value : fighterItems.value));

// Кого сцене собрать заранее. Весь ростер, независимо от шага: тела строятся на
// входе в ворота, под экраном загрузки, и ждут своего шага уже собранными.
//
// Сцена читает этот список ОДИН РАЗ, при сборке. Считать его заново на каждое
// изменение ростера незачем — ростер правят не здесь, а новый боец появится в
// воротах со следующего входа (ТЗ выносит живое обновление за рамки).
const bodies = computed(() => fighters.value.map((f) => {
  const core = getCore(f.core);
  return { id: f.id, coreId: core?.id, hue: core?.hue };
}));

// Подпись читает своё место у сцены; у только что собранного острова его ещё
// нет — отдаём нули, чтобы не разваливать разметку на первом кадре.
const EMPTY_TAG = { x: 0, y: 0, visible: false };
function tagOf(id) { return tags.items[id] || EMPTY_TAG; }

// Подпись кнопки размера. У команды это «2 V 2», у турнира — имя раскладки
// (SOLO / DUO / QUAD). Имена берутся из таблицы раскладок, а не переписываются
// сюда: числа 1/2/4 в `sizes` режима — это её же `perSide`, и второй список
// имён разошёлся бы с сеткой турнира при первой правке.
function sizeLabel(n) {
  if (modeId.value === 'collapse') return layoutNameByPerSide(n);
  // У открытого поля имена те же — SOLO / DUO / QUAD, — но ТАБЛИЦА СВОЯ: чисел
  // сторон там другие (20 / 10 / 5 против 16 / 8 / 4). Спросить имя у турнира
  // значило бы связать два режима так, что правка одного молча поехала бы в
  // другой.
  if (modeId.value === 'openfield') return ofLayoutNameByPerSide(n);
  return interpolate(t.value.gate.sizeLabel, { n });
}

const hint = computed(() => {
  // Нехватка бойцов важнее правил: рассказывать про бой, в который нельзя
  // выйти, — значит говорить не о том. Строка та же, что и была.
  if (shortBy.value > 0) {
    return shortBy.value === 1
      ? t.value.gate.needOne
      : interpolate(t.value.gate.needMany, { n: shortBy.value });
  }
  // Состав ещё набирают — просим добрать. Когда добрали, на это место встают
  // правила режима: игрок дочитывает их ровно перед тем, как нажать.
  const n = squadLeft.value;
  if (n > 0) {
    return n === 1
      ? t.value.gate.pickOne
      : interpolate(t.value.gate.pickMore, { n });
  }
  return t.value.gate.rules?.[modeId.value] || t.value.gate.squadReady;
});

// ── дорога между шагами ──────────────────────────────────────────────────
function onArrived() { /* подлёт доехал — сцена сама включила выбор */ }

// Камера тронулась внутрь острова. Растворяем свой хром — по классу, чтобы он
// ушёл, а не пропал: пропажа в кадр читается как сбой, растворение — как уход.
function onDiveStart() { diving.value = true; }

function onPick(id) {
  if (stage.value === 'mode') return pickMode(id);
  return pickFighter(id);
}

// Режим выбран. Кладём его в сейф ДО перехода — размер состава спрашивают у него.
async function pickMode(id) {
  store.commit('prefight/SET_MODE', id);
  // РАЗМЕР ПО УМОЛЧАНИЮ. Ставится здесь, а не в состоянии: он зависит от того,
  // сколько у игрока бойцов, а состояние про ростер знать не должно. Какой
  // именно размер предложить, решает таблица режимов — у команды и у турнира
  // правила разные. Уже сделанный выбор не трогаем: игрок его помнит.
  if (store.getters['prefight/squadSizes'].length && !store.state.prefight.squadN) {
    store.commit('prefight/SET_SQUAD_SIZE', defaultSizeFor(id, fighters.value.length));
  }
  if (stay) { diving.value = false; return; }
  if (flat) { router.push('/play'); return; }

  // Шаг меняется под ЧЁРНЫМ кадром: подмена островов в видимом кадре читалась бы
  // как подмена декораций, а не как переход в другое место.
  const black = await raiseCurtain({
    ms: reduced ? LOADING.CURTAIN_REDUCED_MS : LOADING.CURTAIN_MS,
  });
  if (!black) return;             // занавес перебили — решать нечего

  stage.value = 'squad';
  diving.value = false;
  // Два кадра: первый отдаём Vue на пересборку островов, второй — браузеру на
  // отрисовку. Снять занавес раньше — показать пустоту между шагами.
  await nextTick();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    dropCurtain();
    sceneRef.value?.depart();     // растемнение и подлёт идут ВМЕСТЕ
  }));
}

// Боец выбран или снят. Пролёта внутрь острова здесь нет намеренно: состав это
// не переход, а отметка — камера остаётся на месте, чтобы игрок видел весь
// состав целиком, а не один остров в лицо.
function pickFighter(id) {
  diving.value = false;
  store.dispatch('prefight/toggleSquad', id);
}

// Размер состава выбран. Состав подрезается той же записью — см. SET_SQUAD_SIZE.
function pickSize(n) {
  store.commit('prefight/SET_SQUAD_SIZE', n);
}

function onRefused() {}

// ДОРОГА В БОЙ. Одна на все режимы — `/play/arena`; что за бой, арена читает из
// сейфа, куда ворота положили режим и размер состава.
//
// ⚠️ У ОТКРЫТОГО ПОЛЯ РАСКЛАДКА ЕДЕТ ОТДЕЛЬНО, В АДРЕСЕ. Арена умеет читать её
// оттуда с самого появления режима (`?openfield=solo|duo|quad`), и этого хватает:
// состав игрока она и так берёт из сейфа, как у всех. Причина ровно одна —
// `src/scene/ArenaScene.vue` в списке защищённых файлов, и выбор из ворот там
// пришлось бы прописывать внутри. Правило проекта в таком случае — управлять
// снаружи, а не править внутри; признак в адресе и есть эта ручка снаружи.
//
// Числа не переписываются: раскладку выбирает тот же размер состава (1 / 2 / 4),
// что лежит в сейфе, и превращает его в ключ та же таблица, что строит поле.
//
// Если владелец разрешит вскрыть арену, здесь останется голый `/play/arena`, а
// там появятся четыре строки по образцу турнира (`gateMode === 'collapse'`).
function toArena() {
  if (modeId.value === 'openfield') {
    router.push({ path: '/play/arena', query: { openfield: ofLayoutByPerSide(size.value).id } });
    return;
  }
  router.push('/play/arena');
}

async function goBack() {
  // Назад с выбора бойцов — к выбору режима, а не сразу из ворот: игрок сделал
  // здесь два шага, и отменять их надо по одному.
  //
  // И назад идут ТОЙ ЖЕ ДОРОГОЙ, что вперёд: кадр чернеет, острова меняются на
  // чёрном, занавес уходит вместе с подлётом камеры. Без этого шаг назад менял
  // бы декорации в видимом кадре — то самое «переключение экрана», от которого
  // это пространство и уходит. Пролёта внутрь острова здесь нет: возвращаются не
  // «в предмет», а на шаг раньше, и лететь некуда. Числа те же.
  if (stage.value !== 'squad') { router.push('/play/mode'); return; }

  const black = await raiseCurtain({
    ms: reduced ? LOADING.CURTAIN_REDUCED_MS : LOADING.CURTAIN_MS,
  });
  if (!black) return;             // занавес перебили — решать нечего

  stage.value = 'mode';
  diving.value = false;
  await nextTick();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    dropCurtain();
    sceneRef.value?.depart();     // растемнение и подлёт идут ВМЕСТЕ
  }));
}
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

/* Запертый читается приглушением, а не перечёркиванием: остров не сломан — он
   просто ещё не открыт (режим) или занят (боец на тренировке). Метка матовая,
   своего свечения у неё нет. */
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

/* ── переключатель размера состава ───────────────────────────────────────────
   Матовый, как весь хром: розовым здесь ничего не зовут — зовут острова. Выбранный
   отличается рамкой и цветом текста, а не заливкой: заливка читалась бы как
   кнопка действия. */
.gate-size {
  position: fixed; left: 50%; transform: translateX(-50%);
  top: calc(var(--sp-6) + 44px);
  z-index: 10; display: flex; gap: var(--sp-2);
  pointer-events: auto;
}
.gs-btn {
  padding: var(--sp-2) var(--sp-4);
  font-family: var(--font-mono); font-size: var(--t-xs);
  letter-spacing: var(--ls-meta); text-transform: uppercase;
  color: var(--ink-off); cursor: pointer;
  background: color-mix(in srgb, var(--panel) 80%, transparent);
  border: 1px solid var(--line);
  transition: color var(--d-hover) var(--e-weight), border-color var(--d-hover) var(--e-weight);
}
.gs-btn:hover { color: var(--ink-dim); border-color: var(--line-strong); }
.gs-btn.is-on { color: var(--ink); border-color: var(--ink-dim); }
.gs-btn:focus-visible { outline: 1px solid var(--ink); outline-offset: 3px; }

/* ── строка шага ─────────────────────────────────────────────────────────── */
.gate-hint {
  position: fixed; left: 50%; transform: translateX(-50%);
  bottom: calc(var(--sp-6) + 56px);
  z-index: 10; margin: 0; pointer-events: none;
  font-family: var(--font-mono); font-size: var(--t-micro);
  letter-spacing: var(--ls-title); text-transform: uppercase;
  color: var(--ink-off); text-align: center;
}

/* ⚠️ временная кнопка в бой — матовая, как весь хром. Своего свечения у неё нет
   намеренно: героем этого экрана должен стать объёмный предмет из работы 4, и
   плоская кнопка не должна занять его место в глазах. */
.gate-go {
  position: fixed; left: 50%; transform: translateX(-50%);
  bottom: var(--sp-6); z-index: 10;
  padding: var(--sp-3) var(--sp-6);
  font-family: var(--font-display); font-weight: 900; font-size: var(--t-md);
  letter-spacing: var(--ls-title); text-transform: uppercase;
  color: var(--ink); cursor: pointer;
  background: color-mix(in srgb, var(--panel) 80%, transparent);
  border: 1px solid var(--line-strong);
  transition: border-color var(--d-hover) var(--e-weight), color var(--d-hover) var(--e-weight);
}
.gate-go:hover { border-color: var(--ink-dim); }
.gate-go:focus-visible { outline: 1px solid var(--ink); outline-offset: 3px; }

/* ── пустой ростер ──────────────────────────────────────────────────────────
   Стоит там, где стояли бы острова: сообщение занимает место предмета, а не
   висит подписью внизу. Матовое — светиться тут нечему. */
.gate-empty {
  position: fixed; left: 50%; top: 50%;
  transform: translate(-50%, -50%);
  z-index: 10; width: min(520px, calc(100vw - 2 * var(--sp-6)));
  display: flex; flex-direction: column; align-items: center; gap: var(--sp-3);
  text-align: center;
}
.ge-ttl {
  margin: 0;
  font-family: var(--font-display); font-weight: 900; font-size: var(--t-2xl);
  line-height: 0.95; letter-spacing: var(--ls-tight); text-transform: uppercase;
  color: var(--ink-off);
}
.ge-note {
  margin: 0; max-width: 42ch;
  font-family: var(--font-mono); font-size: var(--t-xs);
  letter-spacing: var(--ls-meta); line-height: 1.6;
  color: var(--ink-dim);
}
/* Кнопка та же, что «в бой», но стоит внутри блока, а не приклеена к низу:
   это выход из тупика, а не главное действие экрана. */
.gate-go.ge-go { position: static; transform: none; margin-top: var(--sp-2); }

@media (max-width: 560px) {
  .ge-ttl { font-size: var(--t-xl); }
  .gc-name { font-size: var(--t-xl); }
  .gc-desc { font-size: var(--t-micro); letter-spacing: var(--ls-title); }
}

/* ⚠️ СТРОКА ШАГА ВНИЗУ КАДРА — НА ВСЕХ НИЗКИХ ЛЕЖАЧИХ КАДРАХ.
   У неё СВОЙ перелом, и он ВЫШЕ перелома кегля подписей ниже. Это не
   небрежность: два правила лечат разные болезни и кончаются на разной высоте.

   Болезнь, из-за которой правило завелось: строка стоит от НИЖНЕЙ кромки окна
   (88 px), а под кнопкой висела подпись FIGHT, приклеенная к ней В СЦЕНЕ. Когда
   камера поднялась под стоящих бойцов, подпись уехала вниз и легла ровно на
   строку — перекрытие 11 px на полосе примерно от 460 до 590 по высоте.

   ⚠️ ПОДПИСИ БОЛЬШЕ НЕТ — слово прорезано на табличке кнопки, — А ПРАВИЛО
   ОСТАЁТСЯ, и это решение, а не забытый код. Снять его значило бы поднять
   строку с 8 px обратно на 88 px на всей полосе низких кадров, то есть
   ДВИНУТЬ её. Двигать нельзя по двум причинам: принятые глазами кадры не
   должны ехать от правки про другое, а на 88 px строка теперь пришлась бы не
   под подпись, а под саму табличку — та стоит на плите и поднимается над ней
   выше, чем стояла подпись.

   Наверх строку уводить по-прежнему нельзя — там головы бойцов (на 844×390
   строка стояла 120…131 против макушек со 113), а при выбранном размере состава
   верхнюю полосу занимает ещё и переключатель.

   600, а не 590: перелом — не место для впритык. */
@media (max-height: 600px) and (orientation: landscape) {
  .gate-hint { top: auto; bottom: var(--sp-2); }
}

/* НИЗКИЙ КАДР (телефон лёжа) — КЕГЛЬ ПОДПИСЕЙ. Острова в низком кадре стоят
   теснее, и подписи полного размера читались одной фразой — «THORN NETTLE»
   вместо двух имён.

   Порог тут свой, 460, и поднимать его вместе с порогом строки нельзя: имена
   мельчают ради тесноты островов, а тесно им становится ощутимо ниже, чем
   строке — тесно от подписи кнопки. Один порог на два правила означал бы, что
   имена мельчают на кадрах, где места им хватает. */
@media (max-height: 460px) and (orientation: landscape) {
  .gc-name { font-size: var(--t-xl); }
  .gc-desc { font-size: var(--t-micro); letter-spacing: var(--ls-title); }
}
</style>
