<!-- /play/ascension — ПОСВЯЩЕНИЕ В ЛЕГЕНДУ.

     Игрок выбирает одного своего бойца и превращает его в легенду. Событие
     одноразовое и необратимое: боец уходит из ростера навсегда, а легенда
     начинает парить над залом FORGE. Легенда в игре ОДНА.

     ⚠️ УСЛОВИЙ НА ВОЗНЕСЕНИЕ НЕТ. Вознести можно любого бойца, хоть с пустым
     ядром (ТЗ §3.1). Поэтому карточки здесь ничем не запираются — даже
     занятым: занятие уходит вместе с бойцом.

     ⚠️ ЗАПИСЬ ДЕЛАЕТСЯ В САМОМ КОНЦЕ, после обряда, а не перед ним. Обновление
     страницы посреди обряда обязано вернуть игру в обычное состояние, и
     вознесение при этом не засчитывается (ТЗ §8) — это выходит само, если
     ничего не писать раньше времени.

     ⚠️ СТОРОЖ НА ВХОДЕ. Легенда уже есть — на этом экране делать нечего, и он
     молча возвращает в зал. Прийти сюда прямой ссылкой можно, остаться нельзя.

     Выбор бойца собран ИЗ ТОГО ЖЕ, что на входе в бой (SquadSelectView): та же
     карточка с ядром, тем же знаком угла, тем же позывным. Второй системы
     выбора не заводится (ТЗ §3.1). -->
<template>
  <div class="asc">

    <!-- Сцена во весь экран; всё остальное лежит поверх неё. -->
    <AscensionScene ref="sceneRef" class="asc-scene" @done="onRiteDone" />

    <!-- ── ШАПКА. Гаснет на время обряда: уйти посреди него нельзя. ──────── -->
    <header v-if="stage === 'pick'" class="asc-bar">
      <button type="button" class="asc-bar__back" @click="toHall">{{ t.ascension.back }}</button>
      <span class="asc-bar__title">{{ t.ascension.title }}</span>
    </header>

    <!-- ── ВЫБОР ────────────────────────────────────────────────────────── -->
    <section v-if="stage === 'pick'" class="asc-pick">

      <!-- ПУСТО. Честное состояние с работающим возвратом, а не пустой экран. -->
      <div v-if="!fighters.length" class="asc-hole">
        <p class="asc-hole__t">{{ t.ascension.empty }}</p>
        <p class="asc-hole__b">{{ t.ascension.emptyBody }}</p>
        <button type="button" class="asc-hole__btn" @click="toHall">{{ t.ascension.emptyBtn }}</button>
      </div>

      <template v-else>
        <p class="asc-lead">{{ t.ascension.lead }}</p>
        <p class="asc-note">{{ t.ascension.note }}</p>

        <p class="asc-label">{{ t.ascension.pickLabel }}</p>
        <div class="asc-grid">
          <button
            v-for="f in fighters" :key="f.id"
            type="button" class="asc-card"
            :class="{ sel: f.id === pickedId }"
            :data-core="f.core"
            :style="{ '--c': hueOf(f), '--c-sup': supOf(f) }"
            :aria-pressed="f.id === pickedId"
            @click="pick(f.id)"
          >
            <span class="tick tl" aria-hidden="true"></span>
            <span class="tick tr" aria-hidden="true"></span>
            <span class="nm">{{ f.callsign }}</span>
            <span class="cr">{{ nameOf(f) }}</span>
          </button>
        </div>

        <button
          type="button" class="asc-go"
          :disabled="!picked" @click="confirm = true"
        >{{ t.ascension.go }}</button>
        <p v-if="!picked" class="asc-why">{{ t.ascension.pickFirst }}</p>
      </template>
    </section>

    <!-- ── ХОД ОБРЯДА. Одно слово: смотреть надо на фигуру, а не на текст. ── -->
    <p v-if="stage === 'rite'" class="asc-rising">{{ t.ascension.rising }}</p>

    <!-- ── ПОДТВЕРЖДЕНИЕ ────────────────────────────────────────────────────
         Единственное место в проекте, где система разрешает скругление, — и
         оно взято: это окно должно читаться как окно, а не как ещё одна панель.
         Второй раз не спросят, поэтому сказано прямо и без смягчений. -->
    <div
      v-if="confirm" class="asc-modal" role="dialog" aria-modal="true"
      :aria-label="confirmTitle" @click.self="confirm = false"
    >
      <div class="asc-modal__box">
        <p class="asc-modal__t">{{ confirmTitle }}</p>
        <p class="asc-modal__b">{{ confirmBody }}</p>
        <div class="asc-modal__row">
          <button type="button" class="asc-modal__no" @click="confirm = false">{{ t.ascension.confirmNo }}</button>
          <button type="button" class="asc-modal__yes" @click="runRite">{{ t.ascension.confirmYes }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import store from '@/core/state/store.js';
import AscensionScene from '@/scene/AscensionScene.vue';
import { getCore } from '@/data/upgradeData.js';
import { buildTree } from '@/data/upgradeTree.js';
import { t, interpolate } from '@/locales/index.js';

const router = useRouter();
const sceneRef = ref(null);

const stage = ref('pick');     // 'pick' → 'rite'
const confirm = ref(false);
const pickedId = ref(null);
/* ⚠️ ЗАСОВ. Как только обряд начался, сцену больше НИКТО не пересобирает.
   Пересборка тела сбрасывает ход обряда на ноль, а поводов для неё в конце
   хватает: вознесение убирает бойца из ростера, выбранный становится пустотой,
   и наблюдатель ниже честно попросил бы снять фигуру со сцены — посреди
   поклона. Засов снимается только уходом с экрана. */
const locked = ref(false);

/* Ростер читается геттером. Выбор ЗДЕСЬ, а не через roster/pick: тот пишется
   в сейф и увёл бы за собой выбор в зале — а игрок сюда мог прийти вознести
   совсем не того, над кем работает. */
const fighters = computed(() => store.getters['roster/fighters']);
const picked = computed(() => fighters.value.find((f) => f.id === pickedId.value) || null);

const coreOf = (f) => getCore(f.core);
const hueOf = (f) => coreOf(f)?.hue;
const supOf = (f) => coreOf(f)?.sup;
const nameOf = (f) => coreOf(f)?.name || '';

const confirmTitle = computed(() => interpolate(t.value.ascension.confirmTitle, { name: picked.value?.callsign || '' }));
const confirmBody = computed(() => interpolate(t.value.ascension.confirmBody, { name: picked.value?.callsign || '' }));

/* Дерево бойца на ЧТЕНИЕ. У нетронутого его в хранилище нет, но достраивать
   отсюда нельзя — ensureTree пишет в сейф. Берётся своя копия, как на SPAR. */
const pickedTree = computed(() => {
  const f = picked.value;
  if (!f) return null;
  return f.upgrade || buildTree(f.core, null);
});

function pick(id) {
  if (stage.value !== 'pick') return;
  pickedId.value = id;
}

/* Сцена показывает того, кого выбрали: игрок видит, кого именно поднимает,
   ещё до окна подтверждения. */
watch([picked, pickedTree], () => {
  if (locked.value) return;
  sceneRef.value?.setFighter(picked.value
    ? { coreId: picked.value.core, tree: pickedTree.value }
    : { coreId: null });
});

function toHall() { router.push('/play/pve'); }

/* ⚠️ ESC ОБЯЗАТЕЛЕН: окно закрывается крестиком, нажатием мимо и клавишей — и
   крестика здесь нет намеренно (две кнопки внизу и так говорят «да» и «нет»),
   так что клавиша остаётся третьим способом, а не вторым.
   Во время самого обряда клавиша не делает ничего: уйти посреди него нельзя. */
function onKey(e) {
  if (e.key !== 'Escape') return;
  if (confirm.value) { confirm.value = false; return; }
  if (stage.value === 'pick') toHall();
}

/** Подтвердили — окно закрывается, обряд идёт. Уйти с экрана уже нельзя. */
function runRite() {
  if (!picked.value || locked.value) return;
  confirm.value = false;
  locked.value = true;
  stage.value = 'rite';
  nextTick(() => sceneRef.value?.beginRite());
}

/** Обряд кончился — ТОЛЬКО ТЕПЕРЬ запись, и сразу возврат в зал. */
function onRiteDone() {
  if (stage.value !== 'rite') return;
  const id = pickedId.value;
  stage.value = 'done';           // повторное событие ничего не повторит
  if (id) store.dispatch('roster/ascend', id);
  router.replace('/play/pve');
}

/* ── СТОРОЖ. Легенда одна: когда она есть, этому экрану нечего делать. ──
   Проверяем и на входе, и на каждое изменение — вкладка могла остаться
   открытой с прошлого раза. */
function guard() {
  if (store.getters['roster/hasLegend']) router.replace('/play/pve');
}
let stopGuard = null;
onMounted(() => {
  guard();
  window.addEventListener('keydown', onKey);
  stopGuard = watch(() => store.getters['roster/hasLegend'], (on) => { if (on && !locked.value) guard(); });
  // Первым выбранным встаёт тот, над кем игрок работает в зале, — а если
  // никто, то первый по списку. Просто чтобы в сцене сразу кто-то стоял.
  const inHall = store.getters['roster/pickedId'];
  const list = fighters.value;
  if (list.length) pickedId.value = list.some((f) => f.id === inHall) ? inHall : list[0].id;
  // Сцена монтируется вместе с нами; первую постановку делаем следующим тиком.
  nextTick(() => {
    sceneRef.value?.setFighter(picked.value
      ? { coreId: picked.value.core, tree: pickedTree.value }
      : { coreId: null });
  });
});
onBeforeUnmount(() => { stopGuard?.(); window.removeEventListener('keydown', onKey); });
</script>

<style scoped>
/* ⚠️ ВСЕ ЗНАЧЕНИЯ — ИЗ tokens.css. Своих цветов, кеглей и отступов здесь нет.
   ⚠️ ПОВЕРХ ОБОЛОЧКИ ПРИЛОЖЕНИЯ, как SPAR: App.vue держит свою шапку со знаком
   на всех адресах, кроме /play/* и витрины. */
.asc {
  position: fixed; inset: 0; z-index: var(--z-panel);
  background: var(--void); color: var(--ink);
  font-family: var(--font-display);
  overflow: hidden;
}
.asc-scene { position: absolute; inset: 0; }

/* ── шапка ─────────────────────────────────────────────────────────── */
.asc-bar {
  position: absolute; top: 0; left: 0; right: 0; z-index: var(--z-topbar);
  display: flex; align-items: center; gap: var(--sp-3);
  padding: var(--sp-2) var(--sp-3);
  pointer-events: none;
}
.asc-bar__back {
  pointer-events: auto; cursor: pointer; min-height: var(--h-btn-sm);
  font-family: var(--font-mono); font-size: var(--t-micro);
  letter-spacing: var(--ls-meta); color: var(--ink-dim);
  background: color-mix(in srgb, var(--void) 70%, transparent);
  border: 1px solid var(--line); padding: 0 var(--sp-3);
  transition: color var(--d-fast), border-color var(--d-fast);
}
.asc-bar__back:hover { color: var(--ink); border-color: var(--line-strong); }
.asc-bar__back:active { opacity: .7; }
.asc-bar__back:focus-visible { outline: 1px solid var(--ink); outline-offset: 2px; }
.asc-bar__title {
  font-family: var(--font-mono); font-size: var(--t-micro);
  letter-spacing: var(--ls-meta); text-transform: uppercase; color: var(--ink-off);
}

/* ── выбор. Стоит НИЗОМ экрана: середину занимает фигура, и загораживать её
      тем, ради чего игрок сюда пришёл смотреть, нельзя. ─────────────── */
.asc-pick {
  position: absolute; left: 0; right: 0; bottom: 0; z-index: var(--z-topbar);
  display: flex; flex-direction: column; gap: var(--sp-2);
  padding: var(--sp-3);
  max-height: 48%; overflow-y: auto;
  background: linear-gradient(to top,
    var(--void) 55%,
    color-mix(in srgb, var(--void) 80%, transparent) 82%,
    transparent 100%);
}
.asc-lead {
  font-size: var(--t-lg); letter-spacing: var(--ls-title); text-transform: uppercase;
}
.asc-note {
  font-family: var(--font-mono); font-size: var(--t-micro);
  letter-spacing: var(--ls-meta); color: var(--ink-dim); max-width: 46ch;
}
.asc-label {
  margin-top: var(--sp-2);
  font-family: var(--font-mono); font-size: var(--t-micro);
  letter-spacing: var(--ls-meta); text-transform: uppercase; color: var(--ink-off);
}

/* ── карточка бойца. Тот же язык, что на входе в бой: ядро несёт цвет
      ободком и знаком угла, а не заливкой тела. ────────────────────── */
.asc-grid { display: flex; flex-wrap: wrap; gap: var(--sp-2); }
.asc-card {
  position: relative; flex: 0 1 calc((100% - var(--sp-2)) / 2);
  display: flex; flex-direction: column; gap: 2px; align-items: flex-start;
  min-height: var(--h-btn-sm); cursor: pointer; text-align: left;
  padding: var(--sp-3) var(--sp-3) var(--sp-2);
  color: var(--ink); background: var(--panel);
  border: 1px solid var(--line);
  /* Нажатие быстрее наведения — отклик на палец мгновенный, украшение может
     быть медленным (дисциплина движения). */
  transition: border-color var(--d-hover), background var(--d-hover), transform var(--d-press);
}
.asc-card:hover { border-color: var(--line-strong); }
.asc-card:active { transform: scale(.985); }
.asc-card:focus-visible { outline: 1px solid var(--c-sup, var(--ink)); outline-offset: 3px; }
/* ВЫБРАННАЯ КАРТОЧКА — та же обработка, что на входе в бой: рамка и уголки
   вторым тоном ядра, лёгкий налив ядра сверху вниз. Числа взяты оттуда же
   (SquadSelectView, .f-card.sel), своих здесь не выдумано.
   ⚠️ БЕЗ --glow-select, который там стоит: на этом экране геройское свечение
      одно — сердце фигуры, и второе встало бы с ним в спор. */
.asc-card.sel {
  border-color: var(--c-sup);
  background:
    linear-gradient(180deg,
      color-mix(in srgb, var(--c) 8%, transparent) 0%,
      color-mix(in srgb, var(--c) 2%, transparent) 100%),
    var(--carbon);
}
.asc-card.sel .tick { border-color: var(--c-sup); opacity: 1; }
.asc-card .tick {
  position: absolute; width: 10px; height: 10px; pointer-events: none;
  border: 1px solid var(--c); opacity: .55;
}
.asc-card .tick.tl { top: 7px; left: 7px; border-right: 0; border-bottom: 0; }
.asc-card .tick.tr { top: 7px; right: 7px; border-left: 0; border-bottom: 0; }
.asc-card .nm {
  font-size: var(--t-md); letter-spacing: var(--ls-title); text-transform: uppercase;
}
.asc-card .cr {
  font-family: var(--font-mono); font-size: var(--t-micro);
  letter-spacing: var(--ls-meta); color: var(--c);
}

/* ── главное действие. Розовое и МАТОВОЕ: геройское свечение на этом экране
      уже есть и оно одно — сердце фигуры. ─────────────────────────── */
.asc-go {
  margin-top: var(--sp-2); min-height: 52px; cursor: pointer;
  font-family: var(--font-display); font-size: var(--t-md);
  letter-spacing: var(--ls-title); text-transform: uppercase; color: var(--ink);
  background: var(--pink); border: none;
  transition: filter var(--d-fast);
}
.asc-go:hover { filter: brightness(1.12); }
.asc-go:active { filter: brightness(.94); }
.asc-go:focus-visible { outline: 1px solid var(--ink); outline-offset: 3px; }
.asc-go:disabled { cursor: default; background: var(--panel); color: var(--ink-off); border: 1px solid var(--line); }
.asc-why {
  font-family: var(--font-mono); font-size: var(--t-micro);
  letter-spacing: var(--ls-meta); color: var(--ink-off);
}

/* ── пусто ─────────────────────────────────────────────────────────── */
.asc-hole { display: flex; flex-direction: column; gap: var(--sp-2); align-items: flex-start; }
.asc-hole__t { font-size: var(--t-lg); letter-spacing: var(--ls-title); text-transform: uppercase; }
.asc-hole__b { font-family: var(--font-mono); font-size: var(--t-micro); letter-spacing: var(--ls-meta); color: var(--ink-dim); max-width: 44ch; }
.asc-hole__btn {
  min-height: var(--h-btn-sm); cursor: pointer; padding: 0 var(--sp-3);
  font-family: var(--font-mono); font-size: var(--t-xs);
  letter-spacing: var(--ls-title); color: var(--ink);
  background: none; border: 1px solid var(--line-strong);
}
.asc-hole__btn:focus-visible { outline: 1px solid var(--ink); outline-offset: 2px; }

/* ── ход обряда ────────────────────────────────────────────────────── */
.asc-rising {
  position: absolute; left: 0; right: 0; bottom: var(--sp-6); z-index: var(--z-topbar);
  text-align: center;
  font-family: var(--font-mono); font-size: var(--t-micro);
  letter-spacing: var(--ls-meta); text-transform: uppercase; color: var(--ink-dim);
  pointer-events: none;
}

/* ── окно подтверждения ────────────────────────────────────────────── */
.asc-modal {
  position: absolute; inset: 0; z-index: var(--z-modal);
  display: grid; place-items: center; padding: var(--sp-4);
  background: color-mix(in srgb, var(--void) 88%, transparent);
}
.asc-modal__box {
  width: min(100%, 460px);
  display: flex; flex-direction: column; gap: var(--sp-3);
  padding: var(--sp-4); background: var(--panel);
  border: 1px solid var(--line-strong); border-radius: var(--r-modal);
}
.asc-modal__t { font-size: var(--t-lg); letter-spacing: var(--ls-title); text-transform: uppercase; }
.asc-modal__b { font-family: var(--font-mono); font-size: var(--t-micro); letter-spacing: var(--ls-meta); color: var(--ink-dim); }
.asc-modal__row { display: flex; gap: var(--sp-2); }
.asc-modal__no, .asc-modal__yes {
  flex: 1 1 0; min-height: 48px; cursor: pointer;
  font-family: var(--font-display); font-size: var(--t-sm);
  letter-spacing: var(--ls-title); text-transform: uppercase;
}
.asc-modal__no { color: var(--ink); background: none; border: 1px solid var(--line-strong); }
.asc-modal__no:hover { border-color: var(--ink-dim); }
.asc-modal__yes { color: var(--ink); background: var(--pink); border: none; }
.asc-modal__yes:hover { filter: brightness(1.12); }
.asc-modal__no:active, .asc-modal__yes:active { transform: scale(.985); }
.asc-modal__no:focus-visible, .asc-modal__yes:focus-visible { outline: 1px solid var(--ink); outline-offset: 2px; }

/* ── широко: выбор колонкой слева, сцена остаётся главной по площади ── */
/* ⚠️ КОЛОНКА НАЧИНАЕТСЯ РАНЬШЕ, ЧЕМ У SPAR (720, а не 900). Причина — телефон
   лёжа: 844×390 при нижнем выборе оставлял фигуре пятую часть высоты, и обряд
   было не разглядеть. Колонкой слева фигура получает всю высоту кадра. */
@media (min-width: 720px) {
  .asc-pick {
    right: auto; top: 0; bottom: 0;
    width: min(var(--w-cabinet), 34vw); max-height: none;
    justify-content: center;
    padding: var(--sp-5) var(--sp-4);
    background: linear-gradient(to right,
      var(--void) 62%, color-mix(in srgb, var(--void) 70%, transparent) 100%);
  }
  .asc-bar { left: min(var(--w-cabinet), 34vw); }
  .asc-card { flex: 1 1 calc((100% - var(--sp-2)) / 2); }
}
@media (min-width: 900px) { .asc-card { flex: 1 1 100%; } }

/* ── лёжа на телефоне: выбор ужимается, чтобы фигура осталась видна ── */
/* Лёжа на телефоне колонка уже включена (перелом 720), и ужимается в ней
   только текст: место под карточки нужно, а объяснять обряд второй раз — нет. */
@media (max-height: 460px) {
  .asc-pick { padding: var(--sp-2) var(--sp-3); justify-content: flex-start; }
  .asc-lead { font-size: var(--t-md); }
  .asc-note { display: none; }
}

/* ── движения меньше: переходы гасим, отклик на нажатие остаётся ──── */
@media (prefers-reduced-motion: reduce) {
  .asc-card, .asc-go, .asc-bar__back { transition: none; }
  .asc-card:active, .asc-modal__no:active, .asc-modal__yes:active { transform: none; opacity: .8; }
}
</style>
