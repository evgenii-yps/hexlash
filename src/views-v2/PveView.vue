<!-- PveView — the FORGE hall (/play/pve): the 3D hall (PveScene) under its 2D layer.

     ONE panel, always there (ForgePanel): who is selected, his tree, what he is
     built out of, and the whole roster as a list. It replaces what used to float
     over the scene — a card in one corner and the tree pinned to the other edge.

     The scene owns the 3D (camera framings, hover light, who stands where); the
     roster owns WHO IS SELECTED (it is saved — see rosterState); this view owns
     the panel, and the cases in between: applying a selection on entry, and the
     open fighter being dismissed from somewhere else.

     ОТСЮДА НЕ УХОДЯТ В БОЙ (15.09.2026, работа D). Здесь была кнопка FIGHT: она
     отправляла драться открытого в зале бойца и уводила прямо на арену, минуя
     выбор состава. Это был второй вход в бой, и он ломался бы ровно в тот день,
     когда состав потребует больше одного. Зал — мастерская: сюда приходят
     работать над бойцом, уходят полосой наверху (← BACK), а дерутся через
     дом → FIGHT → остров ARENA → выбор состава.

     Chrome: the shared .hs-strip (home.css) without the brand block — BACK left,
     SHOP + cabinet right. Its tokens are mirrored on the root so the strip is
     portable here without editing home.css. -->
<template>
  <div class="pve-root forge-root" :style="coreVars">
    <PveScene ref="sceneRef" @hover="onHover" @pick="onPick" @exit="onExit" @press="onPress" />

    <!-- hovered fighter's callsign — matte, no glow, follows the body -->
    <div class="fg-tag" :class="{ 'is-on': !!tag }" :style="tagStyle">{{ tag?.callsign }}</div>

    <!-- THE PANEL — always there, in every layout. It used to be two things
         floating over the hall (a card in one corner, the tree pinned to the
         other edge) and it had no way out of the room at all. -->
    <!-- ПАНЕЛЬ БОЛЬШЕ НЕ СТОИТ В ЭКРАНЕ ВСЕГДА (встраивание v1, решение владельца
         23.09.2026). Её начинку открывают ПРЕДМЕТЫ на плите: планшет зовёт список
         бойцов, наковальня — дерево граней. Сама панель не переписана: те же блоки,
         та же механика, просто показываются по требованию и по одному — за это
         отвечает `section`. -->
    <!-- БЛОК СТАТОВ — левая половина того, что открывает нажатие по бойцу.
         Кто выбран, его оси (именами, без цифр) и его действие. Лёжа стоит
         одновременно с карточкой граней справа; стоя — один, и ведёт в грани
         строкой (см. @open-tree). -->
    <Transition name="fp-fade" appear>
      <ForgePanel
        v-if="statsOpen && picked"
        class="fp--stats"
        section="stats"
        :can-open-tree="portrait"
        :fighters="fighters"
        :picked-id="pickedId"
        :picked="picked"
        :spent="spent"
        :resource="resource"
        :is-guest="isGuest"
        :status="status"
        :tree-status="treeStatus"
        :load-step="loadStep"
        :retrying="retrying"
        :states="states"
        :assign-why="assignWhy"
        :light-why="lightWhy"
        :quench-why="quenchWhy"
        @train="onTrain"
        @cancel-train="onCancelTrain"
        @open-tree="openTree"
      />
    </Transition>

    <Transition v-if="openSection" name="fp-fade" appear>
      <ForgePanel
        ref="panelRef"
        :section="openSection"
        :show-head="!statsOpen"
        :fighters="fighters"
        :picked-id="pickedId"
        :picked="picked"
        :spent="spent"
        :resource="resource"
        :is-guest="isGuest"
        :status="status"
        :tree-status="treeStatus"
        :load-step="loadStep"
        :retrying="retrying"
        :states="states"
        :assign-why="assignWhy"
        :light-why="lightWhy"
        :quench-why="quenchWhy"
        @pick="onPick"
        @toggle="onToggle"
        @new-fighter="onNewFighter"
        @retry="onRetry"
        @train="onTrain"
        @cancel-train="onCancelTrain"
      />
    </Transition>

    <!-- shared chrome (brand removed on PVE): ← BACK left, SHOP + cabinet right -->
    <div class="hs-strip">
      <!-- BACK (left) — matte-chrome family member, arrow glyph + label → /play/mode -->
      <button type="button" class="hs-chrome pve-back" @click="goMode" :aria-label="t.home.back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
        <span class="n">{{ t.home.back }}</span>
      </button>
      <div class="hs-cluster">
        <!-- SHOP — bag glyph + single label; ведёт в магазин (→ /play/home?view=shop) -->
        <button type="button" class="hs-chrome hs-seg-shop" @click="goShop" :aria-label="t.home.shop">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M5 8h14l-1 11H6L5 8Z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></svg>
          <span class="n">{{ t.home.shop }}</span>
        </button>
        <!-- cabinet — chrome diamond avatar only (no handle/role text, no chevron) -->
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
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import store from '@/core/state/store.js';
import { t } from '@/locales/index.js';
import { getCore } from '@/data/upgradeData.js';
import { stateOf, facetGate, anyLesson, startClock, stopClock } from '@/services/training.js';
import PveScene from '@/scene/PveScene.vue';
import PlayerCabinet from '@/views-v2/PlayerCabinet.vue';
import ForgePanel from '@/components/forge/ForgePanel.vue';

// Что сейчас открыто предметом: null — ничего, в экране только зал.
// 'roster' — планшет, 'tree' — наковальня.
const openSection = ref(null);
// СТАТЫ ВЫБРАННОГО БОЙЦА — блок слева. Открывается нажатием ПО САМОМУ ТЕЛУ в
// зале (и только им: строка в списке на планшете их не открывает, иначе список
// и статы дрались бы за один и тот же угол). До 24.09.2026 это была надпись на
// поверхности плиты перед бойцом — её закрывало его же тело и открытая панель.
const statsOpen = ref(false);

// СТОЯ ДВА БЛОКА РЯДОМ НЕ ВСТАЮТ: ширины на них нет. Поэтому стоя нажатие по
// бойцу открывает только статы, а грани — вторым шагом, строкой в них.
// Ориентация читается с ЭКРАНА, а не с устройства: телефон, положенный набок, —
// это широкий экран, и больше знать ничего не нужно (то же правило в PveScene).
const portrait = ref(false);
let mq = null;
function readOrientation(e) { portrait.value = e.matches; }
onMounted(() => {
  mq = window.matchMedia('(orientation: portrait)');
  portrait.value = mq.matches;
  mq.addEventListener('change', readOrientation);
});
onBeforeUnmount(() => mq?.removeEventListener('change', readOrientation));

// ПРЕДМЕТ ГЛАВНЕЕ БОЙЦА: планшет и наковальня забирают экран себе, статы уходят.
function onPress(key) {
  // ПЕРЕХОД МЕЖДУ ОСТРОВАМИ. Камеру двигает сам зал — он ею и владеет; странице
  // остаётся убрать со стекла то, что загородило бы новый кадр.
  if (key === 'toTrain' || key === 'toHall') {
    statsOpen.value = false;
    openSection.value = null;
    return;
  }
  // SPAR — единственный предмет зала, который УВОДИТ с экрана. Переход тот же,
  // каким зал уходит на любой другой экран: обычная смена адреса, а тяжёлый
  // вход прикрывает общий экран загрузки (meta.scene3d на маршруте). Своего
  // вида перехода здесь не заводится.
  //
  // Открытые блоки закрываем перед уходом: вернёмся — зал должен встретить
  // чистым, а не с панелью, открытой позапрошлым нажатием.
  if (key === 'spar') {
    statsOpen.value = false;
    openSection.value = null;
    router.push('/play/spar');
    return;
  }
  // ASCENSION — второй предмет зала, который уводит с экрана. Уходим тем же
  // обычным переходом, что и SPAR; тяжёлый вход прикрывает общий экран
  // загрузки (meta.scene3d на маршруте).
  //
  // ⚠️ ЛЕГЕНДА УЖЕ ЕСТЬ — НАЖАТИЕ НЕ ДЕЛАЕТ НИЧЕГО (ТЗ §2). Предмет в этот
  //    момент стоит погашенным и с подписью SOON, то есть честно показывает,
  //    что он не кнопка. Заслон стоит и здесь, и на самом экране: второго
  //    вознесения в этой версии нет.
  if (key === 'ascension') {
    if (store.getters['roster/hasLegend']) return;
    statsOpen.value = false;
    openSection.value = null;
    router.push('/play/ascension');
    return;
  }
  const want = key === 'roster' ? 'roster' : key === 'upgrade' ? 'tree' : null;
  if (!want) return;
  statsOpen.value = false;
  openSection.value = openSection.value === want ? null : want;   // повторное нажатие закрывает
}
// Стоя: из статов в грани. Карточка граней — ТА ЖЕ, что открывает наковальня,
// второй её формы не заводится; статы под ней убираются, места на двоих нет.
function openTree() {
  openSection.value = 'tree';
  statsOpen.value = false;
}
// Нажатие по пустому месту. Открыты статы — значит открыт боец: закрываем всё и
// отпускаем его бродить. Открыто только предметом — закрываем это, и всё: иначе
// панель нечем закрыть, ведь предмет, который её открыл, она сама загораживает.
function onExit() {
  if (statsOpen.value) { statsOpen.value = false; openSection.value = null; exitWork(); return; }
  if (openSection.value) { openSection.value = null; return; }
  exitWork();
}

import '@/styles/home.css';     // the shared .hs-strip chrome
import '@/styles/cabinet.css';  // the PlayerCabinet drawer
import '@/styles/forge.css';    // the hall's own layer

const router = useRouter();
const cabinetOpen = ref(false);
const sceneRef = ref(null);
const panelRef = ref(null);

// ── the roster, and who is being worked on ────────────────────────────────
const fighters = computed(() => store.getters['roster/fighters']);
// WHO IS SELECTED is saved, not component state (15.09.2026). It used to be a
// plain ref here, so a refresh — or a trip to the arena and back — dropped the
// choice and the hall silently re-picked the oldest fighter. It now lives in the
// roster's own section of the per-tab save (rosterState), which also means the
// hall and anything else reading the selection can never disagree.
const pickedId = computed(() => store.getters['roster/pickedId']);
const picked = computed(() => store.getters['roster/picked']);
// No stand-in core when nobody is picked: getCore falls back to one of the four,
// and a stand-in colour is a second declaration of a colour that is declared
// once, in tokens.css. With nobody picked the hall simply carries no tint.
const pickedCore = computed(() => (picked.value ? getCore(picked.value.core) : null));
const spent = computed(() => (picked.value ? store.getters['roster/spentOf'](picked.value.id) : 0));
const resource = computed(() => store.getters['roster/resource']);
// The hall is tinted by the picked fighter's own core (and by nothing at rest).
const coreVars = computed(() => (picked.value
  ? { '--core': pickedCore.value.hue, '--core-sup': pickedCore.value.sup }
  : {}));

// ── ТРЕНИРОВКА ──────────────────────────────────────────────
// Зал — единственный экран, где занятие назначают и отменяют. Он же держит
// часы — но только пока открыт и только пока кто-то занимается.
//
// ⚠️ ЧАСЫ — НЕ ХРАНИЛИЩЕ ВРЕМЕНИ. Занятие держит срок окончания, поэтому
//    занятие, кончившееся пока игрок был на арене или обновлял страницу,
//    оказывается кончившимся в тот момент, когда на него посмотрели (ТЗ §6.1–§6.2).
//    Часы нужны ровно для того, чтобы подпись в ОТКРЫТОМ зале сменилась сама.
const trainingTick = ref(0);   // дёргается часами — по нему пересчитываются состояния

// Состояние КАЖДОГО бойца, одной картой: её читают и панель (слова), и сцена
// (тело). Две разные карты разошлись бы в первом же кадре после конца занятия.
const states = computed(() => {
  trainingTick.value;                       // зависимость от часов — без неё не пересчитается
  const out = {};
  for (const f of fighters.value) out[f.id] = stateOf(f);
  return out;
});

// Почему выбранному нельзя: три отказа, все из одного набора правил.
const assignWhy = computed(() => {
  trainingTick.value;
  return picked.value ? store.getters['roster/assignBlock'](picked.value.id) : 'none';
});
const lightWhy = computed(() => {
  trainingTick.value;
  return picked.value ? facetGate(picked.value, true) : 'none';
});
const quenchWhy = computed(() => {
  trainingTick.value;
  return picked.value ? facetGate(picked.value, false) : 'none';
});

function settle() {
  store.dispatch('roster/settleTraining');
  trainingTick.value += 1;
}
// Часы заводятся только когда есть что ждать, и встают, когда ждать нечего.
function armClock() {
  if (!anyLesson(fighters.value)) { stopClock(); return; }
  startClock(() => {
    settle();
    return anyLesson(fighters.value);       // false → часы встают сами
  });
}
function onTrain(id) {
  store.dispatch('roster/assignLesson', id);
  // УШЁЛ ЗАНИМАТЬСЯ — ВЫШЁЛ ИЗ СОСТАВА.
  //
  // Состав боя лежит в сейфе и переживает уход с экрана, а экраны состава
  // давно умеют показывать занятого запертой карточкой «IN THE FORGE». До
  // тренировки это было недостижимо (занятых не бывало); теперь — достижимо, и
  // боец, оставшийся в составе, попал бы в ловушку: карточка заперта, а значит
  // и снять его с состава нельзя — той же самой запертостью.
  //
  // Убираем его ЗДЕСЬ, а не правилом внутри состава: решение принял игрок
  // именно здесь, и только здесь понятно, почему боец из состава вышел. Экран
  // состава неполный состав и так отрабатывает — он просит добрать словами.
  //
  // Снимаем ТОЛЬКО если занятие правда началось: отказ (потолок, уже готов)
  // не должен трогать состав вообще.
  if (store.getters['roster/trainingState'](id) === 'busy'
      && store.getters['prefight/inSquad'](id)) {
    store.dispatch('prefight/toggleSquad', id);
  }
  trainingTick.value += 1;
  armClock();
  // УШЁЛ ЗАНИМАТЬСЯ — БЛОКИ ЗАКРЫВАЮТСЯ. Закрываем только то, что открывал сам
  // боец: карточку, открытую наковальней, занятие не касается.
  if (statsOpen.value && id === pickedId.value) { statsOpen.value = false; openSection.value = null; }
}
function onCancelTrain(id) {
  store.dispatch('roster/cancelLesson', id);
  trainingTick.value += 1;
  armClock();
}
// Занятие могло кончиться, пока зала не было на экране: спрашиваем при входе.
onMounted(() => { settle(); armClock(); });
onBeforeUnmount(stopClock);

// The guest honesty line moved here with the tree — this is where the work that
// would be lost now happens.
const isGuest = computed(() => !store.getters['master/getLoginState']?.isAuthenticated);

// ── hover tag ──────────────────────────────────────────────────────────────
const tag = ref(null);
const tagStyle = computed(() => (tag.value ? { left: tag.value.x + 'px', top: (tag.value.y - 34) + 'px' } : {}));
function onHover(payload) { tag.value = payload; }

// ── picking ────────────────────────────────────────────────────────────────
// Picking now comes from two places — a tap on a body in the hall, and a tap on
// a row in the panel's list. Both land here, so the two never disagree.
// `fromBody` — нажали по телу в зале, а не по строке в списке. Только тело
// открывает статы: см. statsOpen выше.
function onPick(id, fromBody = false) {
  store.dispatch('roster/pick', id);
  tag.value = null;
  buildTreeFor(id);
  sceneRef.value?.select(id);
  if (!fromBody) return;
  // ЗАНИМАЮЩЕГОСЯ НЕ РАЗБИРАЮТ. Нажатие по нему уводит камеру к грушам на
  // соседний остров (это делает сама сцена) — и это всё, что происходит:
  // статы по нему не открываются, работать с ним сейчас нельзя.
  if (states.value[id] === 'busy') { statsOpen.value = false; openSection.value = null; return; }
  statsOpen.value = true;
  openSection.value = portrait.value ? null : 'tree';
}

// Building his tree is the one step that can fail, so it is the one step with a
// status. Today it is synchronous and always succeeds; the status exists because
// the panel has to be able to SAY it failed, and because the moment the roster
// stops being a per-tab save this is where the wait will appear.
function buildTreeFor(id) {
  treeStatus.value = 'ready';
  try {
    store.dispatch('roster/ensureTree', id);
    const f = fighters.value.find((x) => x.id === id);
    if (!f || !f.upgrade) throw new Error('tree missing after build');
  } catch (_) {
    treeStatus.value = 'error';
  }
}

// RETRY — one in flight at a time: a second tap while the first is still working
// does nothing (there is nothing to race today, and there will be).
function onRetry() {
  if (retrying.value || !pickedId.value) return;
  retrying.value = true;
  try { buildTreeFor(pickedId.value); } finally { retrying.value = false; }
}
function exitWork() {
  statsOpen.value = false;
  store.dispatch('roster/pick', null);
  tag.value = null;
  sceneRef.value?.exitWork();
}
function onToggle({ crystalId, faceId }) {
  if (!picked.value) return;
  store.dispatch('roster/toggleFacet', { id: picked.value.id, crystalId, faceId });
  // Зажжённая грань ТРАТИТ право, и слово состояния в статах обязано сменить-
  // ся тут же (READY → FREE). Карточка при этом остаётся открытой.
  trainingTick.value += 1;
}

// ── what the panel is allowed to say ──────────────────────────────────────
// Three statuses, two seams. `status` is what the HEAD knows about the picked
// fighter; `treeStatus` is what the TREE knows, separately, so a tree that fails
// leaves the rest of the panel working (the hall asks for exactly that).
//
// ⚠️ Today neither can be anything but 'ready' by itself: the roster restores
// from the tab's own storage and the tree is built in the same tick, so there is
// nothing to wait for and nothing that can be half-done. The states are wired
// through, not faked — the day the roster comes off a server, this is the seam
// that carries the wait and the failure.
const status = ref('ready');
const treeStatus = ref('ready');
const loadStep = ref(null);      // { n, total } for the honest loading line
const retrying = ref(false);

// The roster is empty and the player is standing in an empty hall: give them the
// one move that opens it. Same call the DEV console makes.
function onNewFighter() {
  const f = store.dispatch('roster/recruit', null);
  Promise.resolve(f).then((made) => { if (made && made.id) onPick(made.id); });
}

// Dismissed from somewhere else (the shop's roster list) while he is open →
// fall back to the overview instead of showing a card for nobody.
//
// It watches the RESOLVED fighter, not the id: the roster clears the selection in
// the same write that removes him (rosterState REMOVE), so by the time this runs
// the id is already null and comparing ids would never fire. What the store
// cannot do is put the hall's 3D back into the overview — that is this job.
watch(picked, (now, was) => {
  if (was && !now) { tag.value = null; statsOpen.value = false; sceneRef.value?.exitWork(); }
});

// Esc walks back: first up the tree, then out of the work state.
function onKeydown(e) {
  if (e.key !== 'Escape' || !pickedId.value) return;
  e.preventDefault();
  if (panelRef.value?.stepBack()) return;
  exitWork();
}
// ── the hall opens with somebody already selected ─────────────────────────
// Walking in used to give a dark room with nothing lit: both of the screen's
// glows belong to a selection, and there was no selection, so the first thing
// the player saw said nothing about where to press.
//
// TWO cases, and both end with a selection that is fully APPLIED — his tree
// built and the hall framed on him:
//   • a saved choice (refresh, or back from the arena) → re-apply THAT one. The
//     save carries the id only; the tree and the camera live in this visit and
//     have to be re-established, which is why this re-runs onPick instead of
//     returning early. Writing the same id back is a no-op for the save.
//   • nothing selected (first visit, or the player deselected on purpose, or the
//     saved fighter has since been dismissed) → the oldest fighter, first in the
//     same order the panel lists them.
// Either way this is a selection and nothing else: no resource is spent, no
// facet is lit, nothing is written that picking by hand would not write.
function openWithSelection() {
  const id = pickedId.value || fighters.value[0]?.id;
  if (!id) return;                         // empty roster: the panel says so, the hall stays empty
  onPick(id);
}
onMounted(openWithSelection);

onMounted(() => document.addEventListener('keydown', onKeydown));
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown));

// Cabinet card data (mirrors HomeView / Mode Select): default until a core is picked.
const coreId = computed(() => store.getters['prefight/selectedCoreId'] || null);
const core = computed(() => (coreId.value ? getCore(coreId.value) : null));
const coreName = computed(() => core.value?.name || 'ONSLAUGHT');
const coreSig = computed(() => core.value?.sig || 'PRESSURE');
const balance = '2,480';

function goHome() { router.push('/play/home'); }
// Кнопка SHOP в полосе зала вела на /play/home — то есть просто домой, мимо
// магазина, хотя подписана «SHOP». Магазин живёт состоянием дома, поэтому
// ведём туда адресом (см. setView в HomeView).
function goShop() { router.push({ path: '/play/home', query: { view: 'shop' } }); }
function goMode() { router.push('/play/mode'); }
</script>

<style scoped>
/* Раньше здесь лежала КОПИЯ палитры home.css: полоса .hs-strip была написана
   под локальные имена .home-root, и чтобы она работала на этом маршруте, имена
   приходилось повторять. Теперь .hs-chrome читает глобальные токены напрямую,
   и копия не нужна — осталась только геометрия экрана. */
.pve-root {
  position: absolute; inset: 0; overflow: hidden;
  background: var(--void); color: var(--ink);
  font-family: var(--font-display);
}

/* brand removed on PVE → the strip carries BACK (left) + the SHOP/cabinet cluster
   (right). .hs-strip is justify-content:space-between; pin the cluster to the right
   edge here (scoped to PVE — home.css stays shared/untouched). BACK + SHOP + cabinet
   are all .hs-chrome family members (see template), so they need no styling here. */
.hs-cluster { margin-left: auto; }

/* ⚠️ Полоса обязана заканчиваться там, где начинается панель бойца. Лёжа панель
   стоит справа во всю высоту и на слое --z-panel (30), то есть ВЫШЕ полосы
   (--z-topbar, 20) — и до 12.09.2026 она просто ложилась поверх правого
   кластера: SHOP и чип кабинета были на экране видны, но не нажимались, потому
   что клик забирала панель. Ширина берётся из --fp-w (forge.css) — там же, где
   её берёт сама панель, поэтому разъехаться они не могут. Стоя панель уходит
   полосой вниз и --fp-w = 0. */
.pve-root .hs-strip { right: var(--fp-w); }
</style>
