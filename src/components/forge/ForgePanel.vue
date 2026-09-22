<!-- ForgePanel — the FORGE hall's panel: everything the player reads and touches
     beside the 3D hall, in one column.

     Six blocks, top to bottom:
       head    — who is selected: name, his core in the core's own colour, его
                 СОСТОЯНИЕ (свободен / занят / готов) и fights
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
  <aside class="fp" :class="{ 'is-guest': isGuest }" :style="coreVars">

    <!-- ── 1 · head — who is selected ───────────────────────────────────── -->
    <header class="fp-head">
      <p class="fp-kicker">{{ t.forge.selected }}</p>

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
        <p class="fp-fights">
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

      <!-- ── 2 · train — грань открывается занятием, а не нажатием ──────────
           ОДНА КНОПКА, и она меняет смысл: свободному — начать, занятому —
           отменить. Две кнопки рядом значили бы, что одна из них всегда мёртвая.

           НИ ПРОЦЕНТОВ, НИ ЦИФР, НИ ОСТАТКА ВРЕМЕНИ. Строка под кнопкой говорит
           словами, что происходит или почему нельзя; сам ход занятия показывает
           ТЕЛО В ЗАЛЕ, а не панель. -->
      <section v-if="picked" class="fp-train">
        <button
          type="button" class="fp-train-btn"
          :class="{ 'is-cancel': pickedState === 'busy' }"
          :disabled="trainDisabled"
          @click="onTrainTap"
        >{{ pickedState === 'busy' ? t.forge.trainCancel : t.forge.trainStart }}</button>
        <p v-if="trainNote" class="fp-train-note">{{ trainNote }}</p>
      </section>

      <!-- ── 3 · tree ───────────────────────────────────────────────────── -->
      <section class="fp-tree" :class="{ 'is-fresh': treeState === 'live' && !litNames.length }">
        <!-- the mechanic, untouched -->
        <ForgeTree
          v-if="treeState === 'live'"
          ref="treeRef"
          :core-id="picked.core"
          :tree="picked.upgrade || []"
          :spent="spent"
          :resource="resource"
          :gates="gates"
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

        <!-- One line under the tree, whichever applies. The second does NOT take
             the tree away — the pool is given back by quenching a facet, so the
             tree has to stay reachable exactly when it is full.

             ПРИЧИНА ОТКАЗА — ПЕРВОЙ (18.09.2026). Грани видны, но не
             зажигаются — и игрок обязан прочесть почему ДО нажатия, а не после.

             ⚠️ Причина живёт ИМЕННО ЗДЕСЬ, а не внизу камеры дерева, где она
                напрашивалась: та строка скрыта, пока у бойца ни одной зажжённой
                грани (.fp-tree.is-fresh .ft-foot в forge.css) — то есть ровно в том
                случае, в котором причина нужнее всего. Измерено: коробка 0×0. -->
        <p v-if="treeState === 'live' && lightWhy" class="fp-hint">{{ whyText(lightWhy) }}</p>
        <p v-else-if="treeState === 'live' && !litNames.length" class="fp-hint">{{ t.forge.treeHint }}</p>
        <p v-else-if="treeState === 'live' && spent >= resource" class="fp-hint">{{ t.forge.treeSpent }}</p>
      </section>

      <!-- ── 4 · style — what he is built out of ────────────────────────── -->
      <section class="fp-style">
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
      <section class="fp-roster">
        <p class="fp-label">
          {{ t.forge.rosterLabel }}
          <span v-if="fighters.length" class="c">{{ fighters.length }} / {{ rosterMax }}</span>
        </p>

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

    <!-- ── 6 · guest ─────────────────────────────────────────────────────
         Подвал существует, только когда в нём есть что сказать. Раньше в нём
         стояла плита FIGHT и он был всегда; без неё у зарегистрированного
         игрока остался бы пустой отчёркнутый поясок под списком — дыра ровно
         на месте снятой кнопки. Пустого подвала нет: место забирает список. -->
    <footer v-if="isGuest" class="fp-foot">
      <p class="fp-guest">{{ t.forge.guestLine }}</p>
    </footer>
  </aside>
</template>

<script setup>
import { computed, ref } from 'vue';
import { t, interpolate } from '@/locales/index.js';
import { getCore } from '@/data/upgradeData.js';
import ForgeTree from '@/components/forge/ForgeTree.vue';

const props = defineProps({
  fighters: { type: Array, default: () => [] },
  pickedId: { type: String, default: null },
  picked: { type: Object, default: null },
  spent: { type: Number, default: 0 },
  resource: { type: Number, required: true },
  rosterMax: { type: Number, required: true },
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

const emit = defineEmits(['pick', 'toggle', 'new-fighter', 'retry', 'train', 'cancel-train']);

const treeRef = ref(null);

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
const trainDisabled = computed(() => pickedState.value !== 'busy' && !!props.assignWhy);

// Строка под кнопкой. Занят или готов — говорит, что происходит; иначе — почему
// нельзя. Молчит только тогда, когда кнопка живая и объяснять нечего.
const trainNote = computed(() => {
  const st = pickedState.value;
  if (st === 'busy') return t.value.forge.trainingNote;
  if (st === 'ready') return t.value.forge.readyNote;
  return whyText(props.assignWhy);
});

// Ключ причины → слова. Одно место на оба отказа — и на занятие, и на грань.
function whyText(key) {
  const f = t.value.forge;
  if (key === 'busy') return f.whyBusy;
  if (key === 'ready') return f.whyReady;
  if (key === 'full') return f.whyFull;
  if (key === 'notReady') return f.whyUntrained;
  if (key === 'holds') return f.whyHolds;
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
const litNames = computed(() => {
  const out = [];
  (props.picked?.upgrade || []).forEach((cr) => cr.faces.forEach((f) => {
    if (f.state === 'lit') out.push(f.name);
  }));
  return out;
});

// Esc walks back up the tree before it leaves the work state — the hall asks.
function stepBack() { return treeRef.value?.stepBack?.() || false; }
defineExpose({ stepBack });
</script>
