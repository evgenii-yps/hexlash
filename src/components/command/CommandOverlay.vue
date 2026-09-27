<!-- CommandOverlay — КОМАНДОВАНИЕ ПОВЕРХ БОЯ: тумблер, строка решений и перехват.

     ЖИВЁТ СНАРУЖИ СЦЕНЫ, рядом с рядами кличей, баффов и панелью рычагов:
     защищённая арена про командование не знает, командование про арену — тоже.
     Между ними один файл правил — services/command.js.

     ⚠️ ЭТА НАКЛАДКА И ЕСТЬ ВЫКЛЮЧАТЕЛЬ ВСЕГО КОМАНДОВАНИЯ. Правила подписываются
     на кадр боя в момент загрузки своего файла, а загружает его отсюда только эта
     строчка импорта. Нет накладки — нет ни тумблера, ни легенды в бою: ровно так,
     как и должно быть, потому что командование без своего тумблера бессмысленно.

     ⚠️ ТУМБЛЕРА НЕ СУЩЕСТВУЕТ, А НЕ «ОН СЕРЫЙ» (ТЗ). В бою один на один, в забеге
     и в любом одиночном составе его на экране нет вовсе. Условие считает
     services/command.js по числу бойцов на стороне игрока — режимы нигде не
     перечисляются, иначе список пришлось бы держать в третьем месте и он бы
     разошёлся с боем при первой правке.

     ⚠️ СТОИТ НАД ПАНЕЛЬЮ РЫЧАГОВ, И МЕСТО НЕ ЗАШИТО ЧИСЛОМ. Панель ездит: у
     правого края по середине высоты на широком экране, полосой над рядами карт в
     портрете, в одну строку на телефоне лёжа. Зашитый отступ разошёлся бы с ней
     при первой же правке, поэтому панель МЕРЯЕТСЯ на месте — тем же приёмом,
     каким ряд кличей меряет панель баффов. Не нашлась — встаём по запасному
     числу и всё равно ни на кого не ляжем.

     ⚠️ ДВА СОСТОЯНИЯ ТУМБЛЕРА РАЗЛИЧАЮТСЯ ФОРМОЙ И ЯРКОСТЬЮ, НЕ ЦВЕТОМ. Это та
     же дисциплина, что у плиток в самой панели рычагов, и та же причина: розовый
     в этой игре принадлежит главному действию и деньгам, а переключатель режима
     — ни то, ни другое. Свечения здесь нет вовсе: на арене светится один разлом.

     ⚠️ ПЕРЕХВАТ ПО КАРТАМ СДЕЛАН ОТДЕЛЬНЫМ СЛОЕМ, И БЕЗ НЕГО ОН НЕ РАБОТАЕТ.
     Карта без зарядов или в откате ОТКЛЮЧЕНА разметкой, а отключённая кнопка не
     пропускает тап вовсе — значит «тап по любой карте возвращает управление» на
     ней бы и провалился, причём именно тогда, когда игрок торопится. Поэтому пока
     ведёт легенда, поверх рядов карт лежит прозрачная накладка ровно по их месту:
     карты под ней видны и читаемы, как требует ТЗ, а палец ловится. Накладка узкая
     — ровно по рядам, — чтобы тап по бойцу рядом с картами шёл в сцену и выбирал
     бойца, а не глохнул здесь. -->
<template>
  <div v-if="c.active" class="cmd">
    <!-- Тумблер и строка решений — одним блоком над панелью рычагов. -->
    <div class="cmd-block" :style="blockStyle">
      <!-- СТРОКА РЕШЕНИЙ. Появляется в момент действия легенды и гаснет сама.
           Место под неё НЕ держится: пустая строка занимала бы место постоянно и
           тумблер прыгал бы на каждое решение. -->
      <p v-if="c.line" class="cmd-line">
        <span class="cmd-line-who">{{ t.command.legend }}</span>
        <span class="cmd-line-dot">·</span>
        <span class="cmd-line-act">{{ c.line }}</span>
      </p>

      <button
        type="button"
        class="cmd-toggle"
        :class="{ 'is-legend': c.legendLeads }"
        :aria-pressed="c.legendLeads ? 'true' : 'false'"
        @click="toggleCommand()"
      >{{ c.legendLeads ? t.command.legendLeads : t.command.iLead }}</button>
    </div>

    <!-- Перехват по картам: только пока ведёт легенда, и только по их месту. -->
    <div
      v-for="s in strips" :key="s.key"
      class="cmd-grab"
      :style="s.style"
      @pointerdown.stop.prevent="takeOver()"
    />
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useStore } from 'vuex';
import { t } from '@/locales/index.js';
import { commandState as c, toggleCommand, takeOver, setLegendPresent } from '@/services/command.js';

const store = useStore();

/**
 * ЕСТЬ ЛИ ЛЕГЕНДА — единственное, что эта накладка приносит правилам. Ни один
 * файл в services/ не тянет Vuex, и заводить первый такой незачем: у накладки
 * доступ к хранилищу есть по праву, а правилам нужен один-единственный факт.
 */
const hasLegend = computed(() => !!store.getters['roster/hasLegend']);
watch(hasLegend, (v) => setLegendPresent(v), { immediate: true });

// ── Место блока: над панелью рычагов ─────────────────────────────────────

/** Панель не нашлась — встаём по запасному числу, никого не накрыв. */
const FALLBACK = { right: 8, bottom: 260 };
/** Просвет между блоком и панелью. Тот же шаг, что у прочих накладок боя. */
const GAP_PX = 8;

const box = ref({ ...FALLBACK });
const blockStyle = computed(() => ({
  right: `${box.value.right}px`,
  bottom: `${box.value.bottom}px`,
}));

/** Прозрачные накладки по месту рядов карт. Пусто, пока ведёт игрок. */
const strips = ref([]);

let ro = null;
/** Что наблюдаем прямо сейчас — чтобы не переподписываться зря. */
let watched = [];
/** Сколько кадров ещё ждать, пока панель обретёт размер. */
let settleLeft = 0;

/**
 * ⚠️ ЭЛЕМЕНТЫ ИЩУТСЯ ЗАНОВО НА КАЖДЫЙ ЗАМЕР, А НЕ ЗАПОМИНАЮТСЯ ОДИН РАЗ. Ровно
 *    на этом замер и сломался в первый раз (поймано прогоном scripts/command-e2e.mjs,
 *    а не глазами): панель рычагов показывается по условию «есть кого выбрать», а
 *    оно наступает лишь через несколько секунд после начала боя, когда бойцов
 *    расставят по плите. Vue при этом создаёт панель ЗАНОВО — и ссылка,
 *    запомненная раньше, указывает на выброшенный узел. У выброшенного узла все
 *    размеры нули, наблюдатель за ним молчит навсегда, и тумблер уезжал за край
 *    экрана (bottom считался от нулевого верха). Поиск заново стоит два обращения
 *    к разметке и от всего этого класса ошибок избавляет.
 */
function findPanel() { return document.querySelector('.fso-panel'); }
function findCards() {
  return [document.querySelector('.kfo-cards'), document.querySelector('.bfo-cards')].filter(Boolean);
}

/** Есть ли у элемента настоящий размер. Ноль = ещё не разложен или выброшен. */
const laidOut = (el) => {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
};

/**
 * Замер. Блок встаёт НАД панелью рычагов и по её правому краю; накладки
 * перехвата ложатся ровно по рядам карт.
 *
 * ⚠️ СЧИТАЕТСЯ ОТ НИЗА И ПРАВОГО КРАЯ ОКНА, а не от верха: и панель, и ряды карт
 *    прижаты к низу, и при смене высоты окна отсчёт от верха уехал бы.
 */
function measure() {
  const H = window.innerHeight;
  const W = window.innerWidth;
  const panel = findPanel();

  if (laidOut(panel)) {
    const r = panel.getBoundingClientRect();
    box.value = {
      right: Math.max(0, Math.round(W - r.right)),
      bottom: Math.max(0, Math.round(H - r.top + GAP_PX)),
    };
  } else {
    // Панели ещё нет или она без размера — стоим по запасному числу и пробуем
    // снова следующим кадром, пока не устанет счётчик.
    box.value = { ...FALLBACK };
  }

  // Накладки перехвата нужны только пока ведёт легенда — иначе они лишний слой
  // поверх карт, которые игрок как раз и нажимает.
  if (!c.legendLeads) { strips.value = []; return; }
  strips.value = findCards()
    .filter(laidOut)
    .map((el, i) => {
      const r = el.getBoundingClientRect();
      return {
        key: `s${i}`,
        style: {
          left: `${Math.round(r.left)}px`,
          top: `${Math.round(r.top)}px`,
          width: `${Math.round(r.width)}px`,
          height: `${Math.round(r.height)}px`,
        },
      };
    });
}

/**
 * Пересобрать наблюдение и померить. Наблюдатель переподписывается только когда
 * набор элементов ПРАВДА сменился: панель и ряды карт живут по своим условиям и
 * пересоздаются, а лишняя переподписка каждый кадр стоила бы дороже самого замера.
 */
function sync() {
  const now = [findPanel(), ...findCards()].filter(Boolean);
  const same = now.length === watched.length && now.every((el, i) => el === watched[i]);
  if (!same) {
    if (ro) ro.disconnect();
    ro = new ResizeObserver(measure);
    for (const el of now) ro.observe(el);
    watched = now;
  }
  measure();
}

/**
 * ДОЖДАТЬСЯ РАЗМЕРА. Панель рычагов появляется не сразу и не в один кадр, а
 * наблюдатель за ещё не существующим элементом подписан быть не может. Поэтому
 * несколько кадров подряд просто пробуем снова — это дешевле и надёжнее, чем
 * угадывать нужный момент.
 */
const SETTLE_FRAMES = 120; // ~2 секунды при 60 кадрах: с запасом на выход бойцов
function settle() {
  sync();
  if (laidOut(findPanel()) || settleLeft <= 0) { settleLeft = 0; return; }
  settleLeft -= 1;
  requestAnimationFrame(settle);
}
function restartSettle() {
  const wasIdle = settleLeft === 0;
  settleLeft = SETTLE_FRAMES;
  if (wasIdle) requestAnimationFrame(settle);
}

// Накладки перехвата появляются и исчезают вместе с позицией тумблера, поэтому
// на неё же и пересчитываемся: сама по себе она размеров ничего не меняет, и
// наблюдатель о ней не узнал бы.
watch(() => c.legendLeads, () => sync());
// Тумблер стал возможен — панель рычагов вот-вот появится (или уже появилась).
watch(() => c.active, (on) => { if (on) restartSettle(); });

onMounted(() => {
  window.addEventListener('resize', measure);
  restartSettle();
});
onBeforeUnmount(() => {
  settleLeft = 0;
  if (ro) { ro.disconnect(); ro = null; }
  watched = [];
  window.removeEventListener('resize', measure);
  // Легенды для правил больше нет: накладка ушла, командовать некому.
  setLegendPresent(false);
});
</script>

<style scoped>
.cmd {
  position: fixed;
  inset: 0;
  z-index: 41;          /* на волос выше карт и панели: тумблер обязан ловить палец */
  pointer-events: none; /* слой сквозной: палец идёт в сцену, к бойцам */
}

/* --- Блок: строка решений и тумблер, прижаты к правому краю над панелью --- */
.cmd-block {
  position: fixed;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--sp-1);
}

/* --- СТРОКА РЕШЕНИЙ. Служебная и прямая (ТЗ): кто и что сделал. Голос ядра и
       человеческая формулировка — часть B, выдумывать её здесь нельзя. --- */
.cmd-line {
  margin: 0;
  max-width: 62vw;
  padding: 3px var(--sp-1);
  font-family: var(--font-mono);
  font-size: var(--t-micro);
  letter-spacing: var(--ls-meta);
  line-height: 1.2;
  text-align: right;
  border: 1px solid var(--chrome-line);
  background: var(--chrome-glass);
  -webkit-backdrop-filter: blur(var(--blur-glass));
  backdrop-filter: blur(var(--blur-glass));
  color: var(--ink-soft);
}
/* Кто сказал — тише того, что сказано: важен рычаг и боец, а не подпись. */
.cmd-line-who { color: var(--ink-dim); }
.cmd-line-dot { color: var(--ink-off); margin: 0 3px; }
.cmd-line-act { color: var(--ink); }

/* --- ТУМБЛЕР. Две позиции различаются формой и яркостью, не цветом (см. шапку).
       «ВЕДУ Я» — обычная матовая плитка; «ВЕДЁТ ЛЕГЕНДА» — залита и обведена
       ярче, так что режим читается с одного взгляда, не отнимая у разлома
       единственное свечение на экране. --- */
.cmd-toggle {
  pointer-events: auto; /* тумблер — единственное, что здесь ловит палец, кроме накладок перехвата */
  /* ТАЧ-ЗОНА ПОРОГОМ ИЗ ТОКЕНА, А НЕ СВОИМ ЧИСЛОМ. Здесь стояло 32 точки, и это
     ровно та ошибка, от которой предостерегает карта клича: у переключателя
     составов она уже допущена однажды (31 точка). Третий раз не повторяем. */
  min-height: var(--h-btn-sm);
  padding: var(--sp-1) var(--sp-2);
  font-family: var(--font-mono);
  font-size: var(--t-micro);
  letter-spacing: var(--ls-meta);
  color: var(--ink-dim);
  border: 1px solid var(--line-strong);
  background: var(--chrome-glass);
  -webkit-backdrop-filter: blur(var(--blur-glass));
  backdrop-filter: blur(var(--blur-glass));
  cursor: pointer;
}
/* Наведение есть только там, где есть мышь: на телефоне его нет вовсе, поэтому
   за ним ничего не спрятано — оно лишь чуть поднимает яркость. */
.cmd-toggle:hover { border-color: var(--chrome-line); color: var(--ink-soft); }
/* Клавиатура: рамка видимая и БЕЗ свечения — единственное свечение на арене
   принадлежит разлому. Тот же приём и та же толщина, что у прочих мелких кнопок. */
.cmd-toggle:focus-visible { outline: 1px solid var(--ink-dim); outline-offset: 2px; }
/* Отклик на палец: наведения на телефоне нет, поэтому нажатие обязано отвечать.
   Та же доля, что у карт рычагов, — они стоят на одном экране. */
.cmd-toggle:active { transform: scale(0.96); }
/* ВЕДЁТ ЛЕГЕНДА: залит плотнее и обведён ярче. Разница читается формой и
   яркостью, не цветом, — см. шапку. */
.cmd-toggle.is-legend {
  color: var(--ink);
  border-color: var(--chrome-rim);
  background: var(--chrome-glass-hot);
}

/* --- Накладки перехвата. Прозрачны и ловят палец. Ничего не рисуют нарочно:
       карты под ними обязаны читаться, а вторая рамка поверх карты читалась бы
       как «карта изменилась», чего не произошло. --- */
.cmd-grab {
  position: fixed;
  pointer-events: auto;
  cursor: pointer;
  background: transparent;
}

/* «Уменьшить движение»: тумблер перестаёт плавно переключаться и приседать.
   Смысла он при этом не теряет — состояние несут яркость и рамка, а не движение. */
@media (prefers-reduced-motion: reduce) {
  /* Движение выключаем, ОТКЛИК — нет: он не украшение. Точь-в-точь как у карт. */
  .cmd-toggle:active { transform: none; opacity: var(--o-dim); }
}
</style>
