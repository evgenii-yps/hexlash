<!-- ForgePanel — the FORGE hall's panel: everything the player reads and touches
     beside the 3D hall, in one column.

     Six blocks, top to bottom:
       head    — who is selected: name, his core in the core's own colour, его
                 СОСТОЯНИЕ (свободен / занят / готов) и fights
       traits  — ОСИ БОЙЦА, именами и пустыми жёлобами (24.09.2026). Стоят только
                 в блоке статов (section="stats"), который открывает нажатие по
                 самому телу в зале
       train   — ЗАНЯТИЕ (18.09.2026): одна кнопка и одна строка причины. Стоит
                 НАД деревом — именно оно его открывает, — и в прокрутке, а не
                 в приколоченной шапке: стоя шапка и так тесная
       tree    — the existing upgrade mechanic (ForgeTree), unchanged
       style   — what he is built out of, in words
       roster  — the whole roster as a list, so picking never depends on hitting a
                 body in the 3D hall (that still works; it is no longer the only way)
       guest   — the honesty line, kept quiet

     ОТСЮДА БОЛЬШЕ НЕ УХОДЯТ В БОЙ (15.09.2026, работа D). Здесь стояла плита
     FIGHT — шестой блок и главное действие экрана. Пока она была, в игре жили
     два входа в бой, и этот минул выбор состава: он отправлял драться того, кто
     открыт в зале. Сегодня это незаметно, потому что боец всегда один, — но в
     тот день, когда состав потребует двоих, вход из зала молча увёл бы одного.
     Вход теперь один: дом → FIGHT → остров ARENA → выбор состава → арена. Зал
     остаётся мастерской: сюда приходят работать над бойцом и уходят полосой
     наверху (← BACK).

     WHAT SCROLLS. The head is pinned and so is the guest line; the tree, the
     style line and the roster share what is left and scroll.

     WHAT GLOWS. Одно: знак ядра в шапке несёт --glow-select. Вторым свечением
     была плита FIGHT, и она ушла вместе с работой D. У дерева когда-то было
     третье (размытый бесконечно дышащий ореол) — его нет, см. ForgeTree.vue.

     OWNS NOTHING. Roster, selection, spend and status all arrive as props; every
     change leaves as an event. Whose roster it is and where it is stored is the
     hall's business (PveView → the roster store). -->
<template>
  <aside ref="rootEl" class="fp" :class="{ 'is-guest': isGuest, 'is-core': showTree, 'is-compact': compact }" :style="coreVars">

    <!-- ── 1 · head — who is selected ─────────────────────────────────────
         ШАПКА ГАСНЕТ, КОГДА РЯДОМ СТОИТ БЛОК СТАТОВ (24.09.2026). Лёжа нажатие
         по бойцу открывает обе стороны сразу: статы слева, ядро справа. Имя и
         ядро говорит левый блок, и второй раз их писать справа не нужно.

         И ГАСНЕТ НАД САМИМ ЯДРОМ (24.09.2026, перенос интерфейса ядра). Четыре
         строки шапки съедали ту высоту, в которой фигуре и жить: лёжа на
         телефоне панель всего 390 высотой, и ядру оставалось 180 — клин мельчал
         до нечитаемого, а описание и возврат уходили под нижний край (замерено).
         Имя бойца теперь несёт само ядро, одной строкой над фигурой. -->
    <!-- КАРТОЧКА — обёртка над шапкой и прокруткой (правка 2 к ТЗ 29.09.2026). Панель
         справа больше не колонка во всю высоту: карточка стоит ровно по своему
         содержимому, по центру экрана, а строка гостя остаётся прижатой к низу
         экрана вне её. Для блока статов слева обёртка невидима (display: contents),
         он устроен как раньше. -->
    <div class="fp-card">
    <!-- ── 0 · СВЁРНУТЫЙ СПИСОК — только вертикаль (30.09.2026) ─────────────
         Одна строка: выбранный боец и TRAIN. На 390×844 под рядом предметов остаётся
         48 точек экрана, а полосе списка нужно минимум 174 (шапка, TRAIN, строка):
         развёрнутая она закрывала TRAINING и SPAR (замер в отчёте). Нажатие по имени
         раскрывает полный список. TRAIN здесь та же кнопка, тот же обработчик. -->
    <div v-if="compact" class="fp-bar">
      <button
        type="button" class="fp-bar-main"
        :aria-label="t.forge.rosterLabel" aria-expanded="false"
        @click="$emit('expand')"
      >
        <span class="sw" aria-hidden="true"></span>
        <span class="nm">{{ picked ? picked.callsign : t.forge.headNoPick }}</span>
        <span v-if="picked && pickedState !== 'free'" class="st" :class="'is-' + pickedState">{{ stateWord(pickedState) }}</span>
      </button>
      <button
        type="button" class="fp-train-btn"
        :class="{ 'is-cancel': pickedState === 'busy' }"
        :disabled="trainDisabled"
        @click="onTrainTap"
      >{{ pickedState === 'busy' ? t.forge.trainCancel : t.forge.trainStart }}</button>
    </div>
    <template v-else>
    <header v-if="showHead && !showTree" class="fp-head">
      <!-- Развёрнутый список на вертикали сворачивается нажатием по этой строке. -->
      <button v-if="collapsible" type="button" class="fp-kicker fp-collapse" aria-expanded="true" @click="$emit('collapse')">
        <span>{{ t.forge.selected }}</span>
        <svg viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 4.5l4 4 4-4" /></svg>
      </button>
      <p v-else class="fp-kicker">{{ t.forge.selected }}</p>

      <!-- a fighter, and his data is here -->
      <template v-if="status === 'ready' && picked">
        <h2 class="fp-name" :title="picked.callsign">{{ picked.callsign }}</h2>
        <p class="fp-core">
          <span class="fp-sign" aria-hidden="true"></span>{{ pickedCore.name }}
        </p>
        <!-- ТРИ СЛОВА НА ТРИ СОСТОЯНИЯ. Ни цифр, ни остатка времени, ни полосы:
             занятие — событие, а не накопление, и его ход показывает тело в зале. -->
        <p class="fp-state" :class="'is-' + pickedState">
          <span class="k">{{ t.forge.stateLabel }}</span>
          <span class="v">{{ stateWord(pickedState) }}</span>
        </p>
        <!-- Счёт боёв — не часть блока статов: там перечислено ровно то, по чему
             принимают решение (кто, какое ядро, в каком состоянии, какие оси и что
             можно сделать). Лишняя строка там стоит места, которого лёжа нет. -->
        <p v-if="!showStats" class="fp-fights">
          <span class="k">{{ t.forge.fightsLabel }}</span>
          <span class="v">{{ fightsOf(picked) }}</span>
        </p>
      </template>

      <!-- the four honest alternatives -->
      <template v-else>
        <h2 class="fp-name fp-name--state">{{ headTitle }}</h2>
        <p v-if="headSub" class="fp-sub">{{ headSub }}</p>
      </template>
    </header>

    <!-- ── the scrolling middle: tree, style, roster ─────────────────────── -->
    <div class="fp-scroll">

      <!-- ── 1b · traits — ОСИ БОЙЦА ───────────────────────────────────────
           ⚠️ ЦИФР НЕТ, и это не заготовка на «потом дорисуем». Имена осей и
              ПУСТЫЕ ЖЁЛОБА: числа прокачки — отдельный заход, а жёлоб оставлен
              видимым, чтобы было понятно, где значение встанет.

           Имена приходят из САМОГО НАБОРА ОСЕЙ (data/behavior.js), а не списком
           руками: список, вписанный руками, уже однажды потерял одну ось. -->
      <section v-if="showStats && picked" class="fp-traits">
        <p class="fp-label">{{ t.forge.traitsLabel }}</p>
        <ul class="fp-axes">
          <li v-for="a in axisNames" :key="a" class="fp-axis">
            <span class="nm">{{ a }}</span>
            <span class="gt" aria-hidden="true"></span>
          </li>
        </ul>
      </section>

      <!-- ── 2 · train — грань открывается занятием, а не нажатием ──────────
           ОДНА КНОПКА, и она меняет смысл: свободному — начать, занятому —
           отменить. Две кнопки рядом значили бы, что одна из них всегда мёртвая.

           НИ ПРОЦЕНТОВ, НИ ЦИФР, НИ ОСТАТКА ВРЕМЕНИ. Строка под кнопкой говорит
           словами, что происходит или почему нельзя; сам ход занятия показывает
           ТЕЛО В ЗАЛЕ, а не панель. -->
      <!-- Кнопку держит тот блок, который сейчас на экране один: статы, если
           открыты они, иначе дерево (его открывает наковальня — и там кнопка
           стояла и стоит). Двух одинаковых кнопок на одном кадре быть не должно. -->
      <!-- Кнопку держит тот блок, который сейчас на экране: статы, если открыты
           они, иначе карточка ядра. Двух одинаковых кнопок на одном кадре быть
           не должно, а без кнопки в карточке ядра из зала не выйти на занятие
           лёжа — там карточку открывает наковальня, и статов рядом нет. -->
      <!-- ⚠️ TRAIN НА ЭКРАНЕ РОВНО ОДИН (правка 3 к ТЗ 29.09.2026). Карточка ядра
           показывает кнопку, только когда рядом НЕ стоит блок статов (showTrain):
           там, где видны обе панели, кнопка живёт в левой. Само действие,
           обработчик и отмена не менялись — меняется только где кнопка показана. -->
      <!-- И В ПОСТОЯННОМ СПИСКЕ (30.09.2026): пока меню бойца закрыто, кнопка стоит
           здесь — иначе на экране, где виден один только список, её не было бы
           вовсе. Открыто меню — зал гасит эту (showTrain), и кнопка одна. -->
      <!-- Никто не выбран (после Esc или нажатия мимо блока выбор снимается) — кнопка
           остаётся, но погашена: правило «на экране зала она одна» не зависит от
           того, выбран ли кто-то, а список и без выбора есть. -->
      <section v-if="showTrain && (picked ? (showStats || showTree || showRoster) : (showRoster && fighters.length > 0))" class="fp-train">
        <button
          type="button" class="fp-train-btn"
          :class="{ 'is-cancel': pickedState === 'busy' }"
          :disabled="trainDisabled"
          @click="onTrainTap"
        >{{ pickedState === 'busy' ? t.forge.trainCancel : t.forge.trainStart }}</button>
        <p v-if="trainNote" class="fp-train-note">{{ trainNote }}</p>
      </section>

      <!-- ВХОД В ГРАНИ — только стоя (24.09.2026). Лёжа дерево открывается
           тем же нажатием, что и статы, и вести в него отдельной строкой некуда.
           Стоя двух блоков рядом не поставить: ширины нет, поэтому шаг второй. -->
      <button
        v-if="showStats && picked && canOpenTree"
        type="button" class="fp-to-tree"
        @click="$emit('open-tree')"
      >{{ t.forge.openCore }}</button>

      <!-- ── 3 · ЯДРО БОЙЦА ──────────────────────────────────────────────
           Здесь стояла ПЛОСКАЯ КАРТОЧКА ДЕРЕВА (ForgeTree). Механика та же —
           те же пятнадцать единиц и потолок RESOURCE (upgradeData.js), — но ведёт её теперь
           игрок по самой фигуре «Печать»: ForgeCore, перенос принятого макета
           /dev/facets. Вместе с карточкой ушли две её беды: цифры в зале и
           перевёрнутый словарь, где лучом звали шаг, а шагом луч. -->
      <!-- КАРТОЧКА ЯДРА — ТОЛЬКО ПРЕВЬЮ (ТЗ 29.09.2026). Здесь по фигуре работает лишь
           нажатие: оно открывает разворот на весь экран, где и зажигают грани
           (ForgeCoreOverlay, его держит зал). Зажигание из карточки убрано, а не
           продублировано: два жеста на одном объекте на телефоне путаются. -->
      <section v-if="showTree" class="fp-tree">
        <ForgeCore
          v-if="treeState === 'live'"
          ref="treeRef"
          :core-id="picked.core"
          :tree="picked.upgrade || []"
          :spent="spent"
          :resource="resource"
          :gates="gates"
          :fighter-name="picked.callsign"
          :core-name="pickedCore ? pickedCore.name : ''"
          preview
          @expand="$emit('expand-core')"
          @toggle="$emit('toggle', $event)"
        />

        <!-- …and the four ways it can have nothing to show -->
        <div v-else class="fp-note" :class="{ 'is-error': treeState === 'error' }">
          <template v-if="treeState === 'loading'">
            <span class="sp" aria-hidden="true"></span>
            <p class="t">{{ treeLoadingText }}</p>
          </template>
          <template v-else-if="treeState === 'error'">
            <p class="t">{{ t.forge.treeErrorTitle }}</p>
            <p class="b">{{ t.forge.treeErrorBody }}</p>
            <button type="button" class="fp-retry" :disabled="retrying" @click="$emit('retry')">
              {{ t.forge.retry }}
            </button>
          </template>
          <template v-else>
            <p class="t">{{ t.forge.treeNoFighter }}</p>
          </template>
        </div>

        <!-- ⚠️ ТРЁХ СТРОК-ОБЪЯСНЕНИЙ ЗДЕСЬ БОЛЬШЕ НЕТ. Они писали под деревом,
             почему зажечь нельзя, потому что само дерево сказать этого не
             умело. Ядро умеет: причина стоит там, где игрок держит палец, — под
             вынесенным кристаллом, рядом с кнопкой, которой на него нет. Две
             копии одних и тех же слов разошлись бы при первой же правке. -->
      </section>

      <!-- ── 4 · style — what he is built out of ──────────────────────────
           НАД ЯДРОМ ЕЁ ТОЖЕ НЕТ (24.09.2026). Строка перечисляла зажжённое
           именами — ровно то, что теперь показывает сама фигура: горящие
           кристаллы в своих гнёздах и налив по граням. Две записи одной правды
           расходятся при первой же правке, и лишние строки здесь — это ещё и
           высота, отнятая у фигуры. Остаётся она там, где ядра нет: в списке. -->
      <section v-if="!showStats && !showTree" class="fp-style">
        <p class="fp-label">{{ t.forge.styleLabel }}</p>
        <p class="fp-style-v">
          <span v-if="!litNames.length" class="ph">{{ t.forge.buildEmpty }}</span>
          <template v-else><span v-for="(n, i) in litNames" :key="i" class="b">{{ n }}</span></template>
        </p>
      </section>

      <!-- ── 5 · roster ───────────────────────────────────────────────────
           A row carries only what tells one fighter from another: his core, his
           name — and, since 18.09.2026, его СОСТОЯНИЕ, когда оно не «свободен».

           ПОЧЕМУ СВОБОДНЫЕ МОЛЧАТ. Счёт боёв здесь уже стоял и был снят:
           десять строк с одним и тем же словом — шум ровно там, где делается выбор.
           «Свободен» — состояние по умолчанию, и тишина читается как оно; помечены два
           состояния, которые на выбор влияют. В шапке стоят все три слова — там
           это одна строка про одного бойца. -->
      <section v-if="showRoster" class="fp-roster">
        <!-- ⚠️ БЕЗ СЧЁТЧИКА. Здесь стояло «3 / 10» — сколько бойцов из скольких.
             Цифр в зале не остаётся ни одной (ТЗ §9.1): сколько их, видно по
             самому списку, а сколько влезет — по тому, что новых больше не
             берут. Счётчик прав и «0 / 5» ушли вместе с плоской карточкой. -->
        <p class="fp-label">{{ t.forge.rosterLabel }}</p>

        <ul v-if="fighters.length" class="fp-list">
          <li v-for="f in fighters" :key="f.id">
            <button
              type="button" class="fp-row"
              :class="{ on: f.id === pickedId }"
              :style="rowVars(f)"
              :aria-current="f.id === pickedId ? 'true' : 'false'"
              @click="$emit('pick', f.id)"
            >
              <span class="sw" aria-hidden="true"></span>
              <span class="nm">{{ f.callsign }}</span>
              <span v-if="stateOf(f.id) !== 'free'" class="st" :class="'is-' + stateOf(f.id)">
                {{ stateWord(stateOf(f.id)) }}
              </span>
            </button>
          </li>
        </ul>

        <div v-else class="fp-note">
          <p class="t">{{ t.forge.rosterEmptyTitle }}</p>
          <p class="b">{{ t.forge.rosterEmptyBody }}</p>
          <button type="button" class="fp-retry" @click="$emit('new-fighter')">{{ t.forge.newFighter }}</button>
        </div>
      </section>
    </div>
    </template>
    </div>

    <!-- ── 6 · guest ─────────────────────────────────────────────────────
         Подвал существует, только когда в нём есть что сказать. Раньше в нём
         стояла плита FIGHT и он был всегда; без неё у зарегистрированного
         игрока остался бы пустой отчёркнутый поясок под списком — дыра ровно
         на месте снятой кнопки. Пустого подвала нет: место забирает список. -->
    <!-- Строка гостя — один раз на экран: она стоит там, где происходит работа,
         которая пропадёт (дерево и список), а не в блоке статов рядом с ними. -->
    <footer v-if="isGuest && !showStats" class="fp-foot">
      <p class="fp-guest">{{ t.forge.guestLine }}</p>
    </footer>
  </aside>
</template>

<script setup>
import { computed, ref, watch, nextTick, onMounted } from 'vue';
import { t, interpolate } from '@/locales/index.js';
import { getCore } from '@/data/upgradeData.js';
import { AXIS_IDS } from '@/data/behavior.js';
import { crystalTitle } from '@/data/crystalTexts.js';
import ForgeCore from '@/components/forge/ForgeCore.vue';

const props = defineProps({
  // КАКИЕ БЛОКИ ПОКАЗЫВАТЬ. Зал держит три отдельных экземпляра панели:
  // постоянный список бойцов ('roster'), карточку граней ('tree') и блок статов
  // ('stats'). Предметы на плите их больше не открывают (30.09.2026). 'all'
  // оставлено значением по умолчанию, чтобы этот разбор ничего не менял там, где
  // панель показывают целиком.
  //   'stats' — блок бойца: кто выбран, его оси, его действие (24.09.2026)
  section: { type: String, default: 'all' },   // 'all' | 'roster' | 'tree' | 'stats'
  // Шапка. Гасится у дерева, когда рядом уже стоит блок статов, — см. шаблон.
  showHead: { type: Boolean, default: true },
  // Показывать ли строку-вход в грани: она нужна только стоя, где два блока
  // рядом не встают. Решает зал, а не панель: ориентацию знает он.
  canOpenTree: { type: Boolean, default: false },
  // СВЁРТКА СПИСКА НА ВЕРТИКАЛИ (30.09.2026): решает зал, панель только рисует.
  //   compact     — вместо списка одна строка «боец + TRAIN»
  //   collapsible — развёрнутый список показывает кнопку «свернуть»
  compact: { type: Boolean, default: false },
  collapsible: { type: Boolean, default: false },
  // Показывать ли кнопку занятия. Зал гасит её у карточки ядра, пока стоит блок
  // статов: он несёт ту же кнопку, а на экране должна быть ровно одна.
  showTrain: { type: Boolean, default: true },
  fighters: { type: Array, default: () => [] },
  pickedId: { type: String, default: null },
  picked: { type: Object, default: null },
  spent: { type: Number, default: 0 },
  resource: { type: Number, required: true },
  isGuest: { type: Boolean, default: false },
  // 'ready' | 'loading' | 'error' — what the HEAD knows about the picked fighter
  status: { type: String, default: 'ready' },
  // the same three for the TREE, which can fail on its own while the head is fine
  treeStatus: { type: String, default: 'ready' },
  // an honest step counter for the loading line, e.g. { n: 2, total: 3 }
  loadStep: { type: Object, default: null },
  retrying: { type: Boolean, default: false },
  // ТРЕНИРОВКА ПРИХОДИТ СНАРУЖИ, как и всё остальное: панель не владеет ничем
  // и не знает ни про часы, ни про хранилище.
  //   states     — { id: 'free'|'busy'|'ready' } на весь список
  //   assignWhy  — почему выбранному нельзя назначить занятие (ключ или null)
  //   lightWhy   — почему выбранному нельзя зажечь грань (ключ или null)
  states: { type: Object, default: () => ({}) },
  assignWhy: { type: String, default: null },
  //   грань: почему нельзя зажечь и почему нельзя погасить — две разные
  //   причины, поэтому два ключа, а не один на оба случая
  lightWhy: { type: String, default: null },
  quenchWhy: { type: String, default: null },
});

const emit = defineEmits(['pick', 'toggle', 'new-fighter', 'retry', 'train', 'cancel-train', 'open-tree', 'expand-core', 'expand', 'collapse']);

const treeRef = ref(null);
const rootEl = ref(null);

// ВЫБРАННЫЙ БОЕЦ ВИДЕН В СПИСКЕ БЕЗ ПРОКРУТКИ (30.09.2026): при показе списка и при
// смене выбранного строку подводим в поле зрения. scroll-padding в forge.css оставляет
// место под приколотую кнопку TRAIN.
function revealPicked() {
  if (props.section !== 'roster' || props.compact) return;
  nextTick(() => rootEl.value?.querySelector('.fp-row.on')?.scrollIntoView({ block: 'nearest' }));
}
watch(() => [props.pickedId, props.compact], revealPicked);
onMounted(revealPicked);

// Что из блоков сейчас на экране. Голова видна почти всегда: без неё не понять,
// о ком речь, — гаснет она ровно в одном случае, когда рядом уже стоит блок
// статов и то же самое говорит он (showHead, см. шаблон).
const showTree = computed(() => props.section === 'all' || props.section === 'tree');
const showStats = computed(() => props.section === 'stats');
// Имена осей — из набора осей, заглавными. Своего списка здесь нет намеренно.
const axisNames = AXIS_IDS.map((a) => a.toUpperCase());
const showRoster = computed(() => props.section === 'all' || props.section === 'roster');

// The picked fighter's core. Colour is NOT declared here: getCore reads the one
// declaration in tokens.css (via coreHue). With nobody picked there is no colour
// to show at all — a stand-in value would be a second declaration of it.
const pickedCore = computed(() => (props.picked ? getCore(props.picked.core) : null));
const coreVars = computed(() => (pickedCore.value
  ? { '--core': pickedCore.value.hue, '--core-sup': pickedCore.value.sup }
  : {}));
// Each roster row wears its OWN core, read the same way.
function rowVars(f) { const c = getCore(f.core); return { '--core': c.hue }; }

// Fights are not recorded yet (roster stores `record: null` and nothing writes
// it). So the count is not invented — the honest "none yet" is shown instead.
function fightsOf(f) { return f && f.record ? f.record.fights : t.value.forge.noFights; }

// ── тренировка ─────────────────────────────────────────────────
// Состояние приходит готовым картой снаружи: считать его здесь значило бы
// завести вторую копию правил, которая разошлась бы с той, по которой
// список бойцов отказывает.
function stateOf(id) { return props.states[id] || 'free'; }
function stateWord(st) {
  if (st === 'busy') return t.value.forge.stTraining;
  if (st === 'ready') return t.value.forge.stReady;
  return t.value.forge.stFree;
}
const pickedState = computed(() => (props.picked ? stateOf(props.picked.id) : 'free'));

// Дерево получает только КЛЮЧИ отказов — гасить грань и подписывать её
// состояние. СЛОВА говорит панель: словарь причин один (whyText ниже),
// и второй его копии внутри дерева быть не должно.
const gates = computed(() => ({
  light: props.lightWhy || null,
  quench: props.quenchWhy || null,
}));

// ОДНА КНОПКА, ДВА СМЫСЛА. Занятому она отменяет занятие — и в этом состоянии
// она ВСЕГДА живая (отмена разрешена всегда, ТЗ §6.3). В остальных она
// назначает занятие и гаснет ровно тогда, когда список бойцов отказал бы.
const trainDisabled = computed(() => !props.picked || (pickedState.value !== 'busy' && !!props.assignWhy));

// Строка под кнопкой. Занят или готов — говорит, что происходит; иначе — почему
// нельзя. Молчит только тогда, когда кнопка живая и объяснять нечего.
const trainNote = computed(() => {
  const st = pickedState.value;
  if (st === 'busy') return t.value.forge.trainingNote;
  if (st === 'ready') return t.value.forge.readyNote;
  return whyText(props.assignWhy);
});

// Ключ причины → слова. Только для занятия: зажечь и погасить кристалл от него
// с 30.09.2026 не зависит (facetGate), и слов на «сначала тренируй» больше нет.
function whyText(key) {
  const f = t.value.forge;
  if (key === 'busy') return f.whyBusy;
  if (key === 'ready') return f.whyReady;
  if (key === 'full') return f.whyFull;
  return '';
}

// Двойное нажатие: само занятие начинается один раз — второе нажатие приходит
// к уже занятому бойцу, и хранилище его отклоняет (ТЗ §6.7). Здесь только
// развилка «начать или отменить».
function onTrainTap() {
  if (!props.picked) return;
  if (pickedState.value === 'busy') emit('cancel-train', props.picked.id);
  else emit('train', props.picked.id);
}

// ── the head's five states ────────────────────────────────────────────────
const headTitle = computed(() => {
  if (props.status === 'loading') return t.value.forge.headLoading;
  if (props.status === 'error') return props.picked ? props.picked.callsign : t.value.forge.headError;
  if (!props.fighters.length) return t.value.forge.headEmpty;
  return t.value.forge.headNoPick;
});
const headSub = computed(() => {
  if (props.status === 'error') return t.value.forge.headError;
  if (props.status === 'loading' || !props.fighters.length) return '';
  return props.picked ? '' : t.value.forge.headNoPickSub;
});

// ── the tree's six states ─────────────────────────────────────────────────
// 'live' means the mechanic renders. Being fully spent is NOT one of the silent
// states: the only way to free a point is to quench a facet in the tree, so
// taking the tree away at exactly that moment would lock the build.
const treeState = computed(() => {
  if (props.treeStatus === 'loading') return 'loading';
  if (props.treeStatus === 'error') return 'error';
  if (!props.picked) return 'nofighter';
  return 'live';
});
const treeLoadingText = computed(() => interpolate(t.value.forge.treeLoading, {
  n: props.loadStep?.n ?? 1, total: props.loadStep?.total ?? 3,
}));

// What he is built out of — the same read the tree's footer used to do, one
// level up, because it is a block of the panel now rather than part of the tree.
// ⚠️ ИМЯ БЕРЁТСЯ ИЗ СЛОЯ ТЕКСТОВ, как и на самом ядре (ТЗ 24.09.2026 §4.3):
// в игровых данных `face.name` — ключ содержания, а не надпись для игрока. Две
// надписи для одного кристалла разошлись бы в первый же день. Запасной
// вариант — прежнее имя из данных.
const litNames = computed(() => {
  const out = [];
  (props.picked?.upgrade || []).forEach((cr) => cr.faces.forEach((f, i) => {
    if (f.state === 'lit') out.push(crystalTitle(props.picked?.core, cr.id, i) || f.name);
  }));
  return out;
});

// Esc walks back up the tree before it leaves the work state — the hall asks.
function stepBack() { return treeRef.value?.stepBack?.() || false; }
defineExpose({ stepBack });
</script>
