<!-- /play — ВЫБОР СОСТАВА. Кого игрок ведёт в бой.

     Заменил экран выбора ядра, стоявший здесь до 15.09.2026. Тот спрашивал, за
     какое ядро драться, — вопрос, на который в игре уже нет ответа: бойцы живут
     в списке и рождаются со своим ядром, выбирать его заново нечего. Выбор ядра
     разошёлся со связкой «выбрал → прокачал → повёл в бой» и уехал отсюда.
     Разбор — ТЗ v2, работа C.

     Экран собран ИЗ ТОГО ЖЕ оформления, а не написан заново: карточка уже умела
     нести ядро — его цвет, знак, ритм света и приглушение соседей, — а боец это
     имя плюс ядро. Поэтому от прежнего экрана осталось всё, кроме содержимого
     карточки: `data-core` теперь берётся у бойца, под именем стоит его позывной,
     а под ним — имя ядра либо отметка «в кузнице».

     Размер состава — одна величина SQUAD_SIZE в состоянии боя (сегодня 1).
     Кнопка загорается только когда состав набран целиком; пока нет — под ней
     словами сказано, сколько ещё выбрать.

     Состояние «на тренировке» нарисовано и живёт по полю `busy` у бойца. До
     демо оно всегда пустое: тренировки в игре ещё нет и ставить его некому.
     Посмотреть, как выглядит, можно в служебном режиме — см. `previewForge`. -->
<template>
  <div class="scene" :style="coreVars" data-screen-label="Squad Select">

    <!-- centered composition column -->
    <main class="stage">
      <div class="col">

        <!-- HEADLINE -->
        <header class="headline">
          <div class="ttl">
            <h1>CHOOSE YOUR <em>SQUAD.</em></h1>
          </div>
        </header>

        <!-- ПУСТОЙ СОСТАВ — честное состояние, а не пустая сетка.
             Встречается, только если игрок распустил всех: новому гостю тройка
             выдаётся при первом входе, но заново после роспуска не выдаётся. -->
        <div v-if="!fighters.length" class="empty">
          <p class="e-ttl">NO FIGHTERS LEFT.</p>
          <p class="e-note">Your roster is empty — there is nobody to send in. Recruit in the shop, then come back.</p>
        </div>

        <!-- GRID — карточки бойцов -->
        <div v-else class="grid" :class="{ 'has-sel': squad.length > 0 }">
          <button
            v-for="f in fighters"
            :key="f.id"
            type="button"
            class="f-card"
            :class="{ sel: inSquad(f.id), forge: busy(f) }"
            :data-core="f.core"
            :style="{ '--c': hueOf(f), '--c-sup': supOf(f) }"
            :disabled="busy(f)"
            :aria-pressed="inSquad(f.id)"
            :aria-label="`${f.callsign} · ${nameOf(f)}${busy(f) ? ' · in forge' : ''}`"
            @click="toggle(f)"
          >
            <span class="tick tl" aria-hidden="true"></span>
            <span class="tick tr" aria-hidden="true"></span>

            <div class="stage-i">
              <div class="halo" aria-hidden="true"></div>
              <div class="ring" aria-hidden="true"></div>
              <div class="icon" v-html="glyphs[f.core]"></div>
            </div>

            <div class="body">
              <div class="nm">{{ f.callsign }}</div>
              <div class="sub">{{ busy(f) ? 'IN FORGE' : nameOf(f) }}</div>
            </div>

            <span class="bar" aria-hidden="true"></span>
          </button>
        </div>

        <!-- FOOT — кнопка и причина, если она не горит -->
        <footer class="foot">
          <button
            class="cta"
            :class="{ 'is-ready': ready }"
            :disabled="!ready"
            aria-label="Proceed to the arena"
            @click="toArena"
          >
            <span>TO ARENA</span>
            <span class="arr" aria-hidden="true">→</span>
          </button>
          <!-- Кнопка не объясняет себя серым цветом: причина стоит словами. -->
          <p v-if="!ready" class="why">{{ why }}</p>
        </footer>

      </div>
    </main>

    <!-- ───────── общая полоса зала ─────────
         Магазин и кабинет должны открываться с ЛЮБОГО игрового экрана (решение
         владельца 12.09.2026) — иначе за ними приходится сначала выходить
         отсюда. Тот же .hs-strip, что на доме, экране режимов и в зале FORGE.
         Бренд-знак сюда НЕ добавляется, речь только о двух кнопках. BACK здесь
         нет: на этом экране его не было и раньше, полоса несёт один правый
         кластер. -->
    <div class="hs-strip">
      <div class="hs-cluster">
        <!-- SHOP — магазин живёт состоянием дома, поэтому ведём туда адресом -->
        <button type="button" class="hs-chrome hs-seg-shop" @click="goShop" :aria-label="t.home.shop">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M5 8h14l-1 11H6L5 8Z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></svg>
          <span class="n">{{ t.home.shop }}</span>
        </button>
        <!-- кабинет — хром-ромб, без ника и без шеврона (как везде) -->
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
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { CORES, getCore } from '@/data/upgradeData.js';
import { coreSVG } from '@/data/upgradeGeometry.js';
import { t } from '@/locales/index.js';
import { DEV_MODE } from '@/services/devMode.js';
import PlayerCabinet from '@/views-v2/PlayerCabinet.vue';
import '@/styles/home.css';     // общая полоса .hs-strip
import '@/styles/cabinet.css';  // выдвижная панель кабинета

const store = useStore();
const router = useRouter();

const cabinetOpen = ref(false);

// ── Бойцы ──
// Список из хранилища, а не своя копия: боец живёт в одном месте, и его ядро,
// грани и занятость читаются оттуда же. Порядок — как в зале: по времени
// появления, чтобы он никогда не перетасовывался под рукой.
const fighters = computed(() => store.getters['roster/fighters']);

// Знак ядра — тот же, что на экране прокачки. Считается один раз на ядро, не на
// бойца: у четырёх бойцов одного ядра знак один и тот же.
const glyphs = Object.fromEntries(CORES.map((c) => [c.id, coreSVG(c.id, { seed: true })]));
const coreOf = (f) => getCore(f.core);
const hueOf = (f) => coreOf(f)?.hue;
const supOf = (f) => coreOf(f)?.sup;
const nameOf = (f) => coreOf(f)?.name || '';

// ── Состав ──
const squad = computed(() => store.getters['prefight/squad']);
const inSquad = (id) => store.getters['prefight/inSquad'](id);
const ready = computed(() => store.getters['prefight/squadFull']);
const left = computed(() => store.getters['prefight/squadLeft']);

// Причина, по которой кнопка не горит. Словами, а не серым цветом.
const why = computed(() => {
  if (!fighters.value.length) return 'No fighters to send.';
  const n = left.value;
  return n === 1 ? 'Pick one fighter to send in.' : `Pick ${n} more fighters to send in.`;
});

// ── «На тренировке» ──
// Признак берётся у самого бойца. Сегодня он всегда пуст: тренировки в игре ещё
// нет, писать его некому. Чтобы владелец увидел, КАК это выглядит, в служебном
// режиме (?dev=1) адрес принимает ?forge=N — столько первых карточек показать
// занятыми. Это ТОЛЬКО показ: в данные ничего не пишется, обновление страницы
// без этого адреса вернёт всё как было.
const previewForge = (() => {
  if (!DEV_MODE) return 0;
  try {
    const n = parseInt(new URLSearchParams(window.location.search).get('forge') || '0', 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch (_) { return 0; }
})();
const busy = (f) => f.busy === true || fighters.value.indexOf(f) < previewForge;

// Нажатие по карточке ставит бойца в состав или снимает оттуда. Занятый не
// нажимается вовсе — у кнопки стоит disabled, это второй заслон после вида.
function toggle(f) {
  if (busy(f)) return;
  store.dispatch('prefight/toggleSquad', f.id);
}

// Боец мог исчезнуть из списка, пока состав лежал в сейфе (распустили в зале, а
// потом вернулись сюда). Такой из состава молча вылетает — кнопка сама погаснет.
// Занятие могло кончиться, пока игрок шёл сюда. Спрашиваем часы, иначе карточка
// осталась бы запертой «IN THE FORGE» у бойца, который давно свободен.
onMounted(() => {
  store.dispatch('roster/settleTraining');
  store.dispatch('prefight/pruneSquad');
});

// Карточка кабинета — как в зале FORGE и на доме. Показывает ядро первого в
// составе; пока состав пуст — значения по умолчанию.
const firstCore = computed(() => {
  const f = fighters.value.find((x) => inSquad(x.id));
  return f ? coreOf(f) : null;
});
const coreName = computed(() => firstCore.value?.name || 'ONSLAUGHT');
const coreSig = computed(() => firstCore.value?.sig || 'PRESSURE');
const coreVars = computed(() =>
  firstCore.value ? { '--core': firstCore.value.hue, '--core-sup': firstCore.value.sup } : {},
);
const balance = '2,480';
// Магазин живёт состоянием дома, поэтому ведём туда адресом (см. setView в HomeView).
function goShop() { router.push({ path: '/play/home', query: { view: 'shop' } }); }

// Кнопка в бой. Состав уже в состоянии, сторож арены (requireSquad) пропустит.
// Короткая пауза — чтобы нажатие успело прочитаться.
let navigating = false;
function toArena() {
  if (!ready.value || navigating) return;
  navigating = true;
  setTimeout(() => router.push({ name: 'V2Arena' }), 180);
}
</script>

<style>
/* Fonts — shared resource: Saira Condensed (display) + JetBrains Mono (mono). */
/* Шрифты грузит index.html одним неблокирующим запросом — дублировать
   их @import'ом внутри компонента значит блокировать отрисовку (ТЗ-01 §7). */
</style>

<style scoped>
/* ============================================================
   HEXLASH — CORE SELECT · styles (port of select_handoff/styles.css, stripped of
   service chrome). Tokens on .scene (component root). SVG from v-html → :deep().
   ============================================================ */
/* ⚠️ Сброс держится на .stage, а НЕ на .scene. Он пришёл с перенесённым
   макетом выбора ядра, и вся эта разметка живёт внутри .stage. Пока он стоял на
   .scene, он дотягивался и до общей полосы зала, которую сюда добавили 12.09:
   у полосы обнулялись её собственные отступы, а у кнопок снимались рамка и
   стекло — кластер упирался в край экрана, а кнопки переставали выглядеть
   кнопками. Переписывать их значения здесь нельзя (хром одевается из home.css
   одним объявлением на все экраны), поэтому сброс просто сужен до той
   разметки, которой он принадлежит. */
.stage * { box-sizing: border-box; margin: 0; padding: 0; }
.stage button {
  font: inherit; color: inherit; background: none; border: 0; cursor: pointer;
  -webkit-appearance: none; appearance: none; -webkit-tap-highlight-color: transparent;
}
.scene ::selection { background: var(--pink); color: var(--ink); }

/* .hs-strip разносит детей по краям, а слева здесь никого нет — без этого
   кластер уезжает влево. Так же сделано в зале FORGE и в пространстве. */
.hs-cluster { margin-left: auto; }

/* ============================================================
   SCENE — fullscreen, faint pink-tinted void (neutral chrome).
   Tints subtly toward the picked core via --core-ghost.
   ============================================================ */
.scene {
  /* Локальный набор этого экрана убран: он был копией палитры под своими
     именами (--bg-void, --ink-bone, --lash…), а пакетный перевод оставил от
     него самоссылки вида `--void: var(--void)` — их можно просто удалить,
     значения приходят из src/styles/tokens.css.

     ⚠️ Там же вскрылась настоящая поломка: --core-dim (прозрачность 55%)
     при переименовании превратился в --core-sup и ЗАТЁР одноимённую
     переменную со вторым тоном ядра. Обе оказались без потребителей — второй
     тон на этом экране читается из --c-sup, который ставится на каждую
     карточку из скрипта. Мёртвые объявления сняты.

     Локально остаются только слоты выбранного ядра — они вычисляются от
     --core, который приходит из :style, а не дублируют токен. */
  --core: var(--pink);
  --core-faint: color-mix(in srgb, var(--core) 14%, transparent);
  --core-ghost: color-mix(in srgb, var(--core) 7%, transparent);
  --core-ink: color-mix(in srgb, var(--core) 62%, var(--ink));

  position: fixed; inset: 0;
  display: flex; flex-direction: column;
  /* layered void:
     · faint top wash in --core (subtle context, not loud)
     · brand-pink ember bottom wash (neutral baseline)
     · deep void radial */
  background:
    radial-gradient(110% 60% at 50% 0%,
      color-mix(in srgb, var(--core) 6%, transparent), transparent 60%),
    radial-gradient(110% 70% at 50% 100%,
      color-mix(in srgb, var(--pink) 5%, transparent), transparent 64%),
    radial-gradient(130% 80% at 50% 12%,
      var(--carbon) 0%, var(--carbon) 38%, var(--void) 78%);
  color: var(--ink);
  font-family: var(--font-display);
  line-height: 1.4;
  -webkit-font-smoothing: antialiased;
  overflow: hidden;
  transition: background .55s var(--e-weight);
  isolation: isolate;
}

/* faint discipline grid — viewport-wide, mask softens edges */
.scene::before {
  content: ""; position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background-image:
    linear-gradient(var(--line) 1px, transparent 1px),
    linear-gradient(90deg, var(--line) 1px, transparent 1px);
  background-size: 64px 64px;
  -webkit-mask-image: radial-gradient(120% 90% at 50% 50%, var(--void), transparent 78%);
  mask-image: radial-gradient(120% 90% at 50% 50%, var(--void), transparent 78%);
  opacity: .32;
}

/* ============================================================
   STAGE — centered composition column
   ============================================================ */
.scene .stage {
  position: relative; z-index: 5;
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  width: 100%;
  padding: clamp(56px, 7vh, 84px) 28px clamp(24px, 3.5vh, 40px);
  gap: clamp(14px, 2.2vh, 24px);
}
.col {
  width: 100%;
  max-width: min(760px, 100%);
  display: flex; flex-direction: column;
  gap: clamp(14px, 2vh, 22px);
}
@media (max-width: 1023px) {
  .scene .stage { padding: var(--sp-7) var(--sp-4) var(--sp-5); }
}

/* ============================================================
   HEADLINE BLOCK
   ============================================================ */
.headline {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: end;
  gap: var(--sp-4) var(--sp-5);
  padding-bottom: var(--sp-4);
  border-bottom: 1px solid var(--line);
}
.headline .ttl { display: flex; flex-direction: column; gap: var(--sp-3); min-width: 0; }

.headline h1 {
  font-family: var(--font-display); font-weight: 900;
  /* fluid scale: ~36px mobile → ~64px desktop */
  font-size: clamp(36px, 5.6vw, 64px);
  line-height: .88; letter-spacing: var(--ls-tight);
  text-transform: uppercase; color: var(--ink);
  text-wrap: balance;
  white-space: nowrap;          /* prevent stray YOUR/CORE break */
}
.headline h1 em { font-style: normal; color: var(--ink);
  text-shadow: 0 0 14px color-mix(in srgb, var(--pink) 30%, transparent); }

@media (max-width: 560px) {
  .headline { grid-template-columns: 1fr; gap: var(--sp-4); padding-bottom: var(--sp-4); }
  .headline h1 { font-size: clamp(34px, 10vw, 46px); white-space: normal; }
}

/* ============================================================
   GRID — ряд, который переносится и центрирует последнюю строку
   ------------------------------------------------------------
   Здесь была сетка 2×2 под ЧЕТЫРЕ ядра — ровно четыре, всегда четыре.
   Бойцов не четыре: сегодня трое, завтра сколько купит игрок. В жёсткой
   сетке троица ложилась как 2+1, и одинокая карточка прижималась влево, а
   справа зияла дыра ровно её размера — читалось как «одной карточки не
   хватает», хотя всё на месте.
   Перенос по строкам с центрированием решает это при ЛЮБОМ числе: неполная
   строка всегда стоит по центру. Ширина карточки считается от доли колонки,
   поэтому ряд выглядит той же сеткой, что и раньше, пока карточек чётное
   число.
   ============================================================ */
.grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--sp-4);
}
/* 0 — не растягиваться: карточка держит свою долю, а не заполняет строку. */
.grid > .f-card { flex: 0 1 calc((100% - var(--sp-4)) / 2); }

/* ============================================================
   CORE CARD — weighty container, three distinguishable states
   ============================================================ */
.f-card {
  --c: var(--ink-dim);
  --c-sup: color-mix(in srgb, var(--c) 55%, transparent);
  --c-faint: color-mix(in srgb, var(--c) 12%, transparent);
  --c-ghost: color-mix(in srgb, var(--c) 6%, transparent);
  --c-ink: color-mix(in srgb, var(--c) 62%, var(--ink));

  position: relative; display: flex; flex-direction: column; align-items: stretch;
  text-align: left;
  /* fight-card chevron (Brand Book primary motif) */
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 16px),
                    calc(100% - 16px) 100%, 0 100%);
  background:
    linear-gradient(180deg,
      var(--fill-1) 0%,
      var(--fill-1) 100%),
    var(--carbon);
  border: 1px solid var(--line);
  padding: var(--sp-4) var(--sp-4) 0;
  min-height: clamp(184px, 25vh, 230px);
  cursor: pointer; overflow: hidden;
  transition:
    background .35s var(--e-weight),
    border-color .3s var(--e-weight),
    opacity .35s var(--e-weight),
    transform .15s var(--e-weight);
}
.f-card:hover { border-color: var(--line-strong); background:
  linear-gradient(180deg, var(--fill-2), var(--fill-1)), var(--carbon); }
.f-card:active { transform: scale(.985); }
.f-card:focus-visible { outline: 1px solid var(--c-sup); outline-offset: 3px; }

/* corner ticks — subtle "tap target" hints */
.f-card .tick { position: absolute; width: 10px; height: 10px; pointer-events: none;
  border: 1px solid var(--ink-off); transition: border-color .3s var(--e-weight); }
.f-card .tick.tl { top: 9px; left: 9px; border-right: 0; border-bottom: 0; }
.f-card .tick.tr { top: 9px; right: 9px; border-left: 0; border-bottom: 0; }

/* ICON STAGE — backplate gives the icon a defined zone */
.f-card .stage-i {
  position: relative;
  flex: 1; display: grid; place-items: center;
  margin: var(--sp-2) 0 var(--sp-2);
  min-height: 96px;
}
/* subtle backplate hex behind icon, almost invisible by default */
.f-card .stage-i::before {
  content: ""; position: absolute;
  width: 118px; height: 104px;
  background:
    radial-gradient(60% 60% at 50% 50%,
      color-mix(in srgb, var(--c) 8%, transparent), transparent 70%);
  opacity: .7; transition: opacity .35s var(--e-weight);
}
.f-card .halo {
  position: absolute; inset: -12%; border-radius: var(--r-round); z-index: 1; pointer-events: none;
  opacity: 0; transition: opacity .35s var(--e-weight);
  background:
    radial-gradient(circle at 50% 50%,
      color-mix(in srgb, var(--c) 48%, transparent) 0%,
      color-mix(in srgb, var(--c) 18%, transparent) 32%,
      transparent 62%),
    radial-gradient(circle at 38% 66%,
      color-mix(in srgb, var(--c-sup, var(--c)) 30%, transparent) 0%, transparent 50%);
  filter: blur(18px);
  mix-blend-mode: screen;
}
.f-card .ring {
  position: absolute; width: 128px; height: 128px; border: 1px solid var(--c-sup);
  border-radius: var(--r-round); z-index: 1; opacity: 0;
}
.f-card .icon { width: 96px; height: 96px; position: relative; z-index: 2;
  transition: transform .4s var(--e-settle); }
.f-card .icon :deep(svg) { width: 100%; height: 100%; overflow: visible; }

/* FLAT-state strokes — muted, with a hint of hue so silhouettes
   stay distinguishable without lighting up */
.f-card .icon :deep(.hex-line) {
  stroke: color-mix(in srgb, var(--c) 30%, var(--ink-off));
  fill: none; stroke-width: 1.6; transition: stroke .35s var(--e-weight);
}
.f-card .icon :deep(.facet) {
  stroke: color-mix(in srgb, var(--c) 20%, var(--ink-off));
  fill: none; stroke-width: 1.1; transition: stroke .35s var(--e-weight);
}
.f-card .icon :deep(.seed) {
  fill: color-mix(in srgb, var(--c) 46%, var(--ink-off));
  transition: fill .35s var(--e-weight);
}

/* NAME */
.f-card .body {
  display: flex; flex-direction: column; align-items: flex-start; gap: var(--sp-1);
  position: relative; z-index: 3; padding-bottom: var(--sp-3);
}
.f-card .nm {
  font-family: var(--font-display); font-weight: 800;
  font-size: clamp(20px, 2.4vw, 26px);
  letter-spacing: var(--ls-tight); text-transform: uppercase; line-height: 1;
  color: var(--ink); transition: color .35s var(--e-weight);
}

/* Подпись под именем: ядро бойца, либо отметка «в кузнице». Мелкая моноширинная
   строка — она поясняет имя, а не спорит с ним. */
.f-card .sub {
  font-family: var(--font-mono);
  font-size: var(--t-xs); letter-spacing: var(--ls-meta);
  text-transform: uppercase; line-height: 1;
  color: var(--ink-off); transition: color .35s var(--e-weight);
}
.f-card.sel .sub { color: var(--ink-dim); }

/* НА ТРЕНИРОВКЕ — карточка тусклая и не отвечает: ни наведения, ни нажатия.
   Отдельного цвета у состояния нет и не надо: «недоступно» в системе читается
   приглушением, а что именно происходит — сказано словом в подписи. */
.f-card.forge {
  opacity: .38;
  cursor: default;
  filter: grayscale(.7);
}
.f-card.forge:hover { border-color: var(--line); background: var(--fill-1); }
.f-card.forge:active { transform: none; }
.f-card.forge .sub { color: var(--ink-off); }
/* приглушение соседей не должно делать занятую карточку ещё тусклее */
.grid.has-sel .f-card.forge:not(.sel) { opacity: .38; }

/* ACCENT BAR — anchors the card visually */
.f-card .bar {
  position: absolute; left: 0; right: 18px; bottom: 0; height: 3px;
  background: var(--ink-off);
  transform-origin: left center;
  transition: background .35s var(--e-weight), transform .35s var(--e-weight);
}

/* ---------- SELECTED ---------- */
.f-card.sel {
  border-color: var(--c-sup);
  /* Свечение выбора — тот же токен, что у метки BEST VALUE (Правка 1.3 §3).
     Он собран на currentColor, поэтому цвет задаётся здесь: у имени ядра
     ниже свой color, так что на текст это не влияет. */
  color: var(--c);
  box-shadow: var(--glow-select);
  background:
    linear-gradient(180deg,
      color-mix(in srgb, var(--c) 8%, transparent) 0%,
      color-mix(in srgb, var(--c) 2%, transparent) 100%),
    var(--carbon);
}
.f-card.sel .tick.tl, .f-card.sel .tick.tr { border-color: var(--c-sup); }
.f-card.sel .stage-i::before { opacity: 1; }
.f-card.sel .halo { opacity: .9; }
.f-card.sel .icon { transform: scale(1.06); }
/* selected strokes lift to near-white tinted with hue — stays crisp
   on top of the halo bloom instead of dissolving into it */
.f-card.sel .icon :deep(.hex-line) {
  stroke: color-mix(in srgb, var(--c) 18%, var(--ink));
  stroke-width: 1.9;
}
.f-card.sel .icon :deep(.facet) {
  stroke: color-mix(in srgb, var(--c) 30%, var(--ink));
  stroke-width: 1.4;
}
.f-card.sel .icon :deep(.seed) { fill: var(--ink);
  filter: drop-shadow(0 0 6px color-mix(in srgb, var(--c) 80%, transparent)); }
.f-card.sel .nm { color: var(--ink);
  text-shadow: 0 0 12px color-mix(in srgb, var(--c) 55%, transparent); }
.f-card.sel .bar { background: var(--c);
  box-shadow: 0 0 14px color-mix(in srgb, var(--c) 55%, transparent); }

/* ---------- DIMMED (siblings of selection) ---------- */
.grid.has-sel .f-card:not(.sel) { opacity: .5; }
.grid.has-sel .f-card:not(.sel):hover { opacity: .82; }

/* ============================================================
   RHYTHMS OF LIGHT — each picked core breathes with character.
   Active only on .sel — flat cards are silent.
   ============================================================ */
/* ============================================================
   PHONE ON ITS SIDE — ряд бойцов поперёк, до четырёх в строке
   ------------------------------------------------------------
   The grid is two columns at every width, and the card carries a
   `min-height: clamp(184px, 25vh, 230px)`. On a short screen the clamp's
   FLOOR wins — 184px, whatever the viewport is — so two rows of cards plus
   the headline could not fit a 320px-tall window: two cores were off the
   bottom and the TO ARENA button with them. Choosing a core is a comparison,
   and you cannot compare what you have to scroll to.
   Sideways there is width to spare and no height, so the row runs across
   instead of stacking, and everything inside the card is sized off the
   viewport HEIGHT rather than off a fixed pixel floor.
   Bounded by max-height so a tablet or a desktop — landscape but tall — keeps
   the 2x2 it is designed for. Portrait never sees any of this.
   ============================================================ */
@media (orientation: landscape) and (max-height: 560px) {
  .scene .stage { padding: var(--sp-6) var(--sp-4) var(--sp-3); gap: var(--sp-2); }
  .col { max-width: min(1040px, 100%); gap: var(--sp-2); }

  .headline { padding-bottom: var(--sp-2); gap: var(--sp-2) var(--sp-4); }
  .headline h1 { font-size: clamp(20px, 3.2vw, 30px); white-space: nowrap; }

  .grid { gap: var(--sp-3); }
  .grid > .f-card { flex-basis: calc((100% - 3 * var(--sp-3)) / 4); }

  .f-card { min-height: 0; padding: var(--sp-3) var(--sp-3) 0;
    clip-path: polygon(0 0, 100% 0, 100% calc(100% - 11px), calc(100% - 11px) 100%, 0 100%); }
  .f-card .tick { width: 8px; height: 8px; top: 7px; }
  .f-card .tick.tl { left: 7px; }
  .f-card .tick.tr { right: 7px; }

  .f-card .stage-i { min-height: 0; margin: var(--sp-1) 0 var(--sp-1); }
  .f-card .stage-i::before { width: 82px; height: 72px; }
  .f-card .icon { width: clamp(44px, 17vh, 78px); height: clamp(44px, 17vh, 78px); }
  .f-card .ring { width: clamp(60px, 23vh, 104px); height: clamp(60px, 23vh, 104px); }

  .f-card .body { padding-bottom: var(--sp-2); gap: var(--sp-1); }
  .f-card .nm { font-size: clamp(13px, 1.9vw, 18px); }
  .f-card .bar { right: 11px; }

  .foot { gap: var(--sp-2); }
  .cta { padding: var(--sp-3) var(--sp-4); font-size: clamp(14px, 1.8vw, 19px); gap: var(--sp-4); }
  .cta::after { clip-path: polygon(12px 0, 100% 0, 100% calc(100% - 12px),
                                   calc(100% - 12px) 100%, 0 100%, 0 12px); }
  .cta .arr { font-size: var(--t-md); }
}

@media (prefers-reduced-motion: no-preference) {
  /* Темп ядра — это его характер, а не оформление (принцип П9, Правка 1.2).
     Числа приходят из токенов: соответствие темпа ядру задаётся в tokens.css
     и больше нигде.

     ⚠️ Скала и засада стояли НАОБОРОТ: скала шла 4.6с, засада 5.6с, то есть
     самым неподвижным ядром оказывалась засада, а не стойкость. Исправлено
     по таблице Правки 1.2 §2. Порядок теперь по возрастанию — натиск, налёт,
     засада, скала: от рваного к неподвижному. */

  /* Натиск — частый ровный пульс, давление не отпускает */
  .f-card.sel[data-core="natisk"] .halo { animation: rhythm-onslaught var(--d-pulse-natisk) ease-in-out infinite; }
  .f-card.sel[data-core="natisk"] .ring { animation: ring-onslaught var(--d-pulse-natisk) ease-out infinite; }

  /* Налёт — рваные всплески: удар, отход, удар */
  .f-card.sel[data-core="nalet"] .halo { animation: rhythm-raider var(--d-pulse-nalet) linear infinite; }
  .f-card.sel[data-core="nalet"] .ring { animation: ring-raider var(--d-pulse-nalet) linear infinite; }

  /* Засада — долгая тишина, один удар */
  .f-card.sel[data-core="zasada"] .halo { animation: rhythm-ambush var(--d-pulse-zasada) cubic-bezier(.7, 0, .2, 1) infinite; }
  .f-card.sel[data-core="zasada"] .ring { animation: ring-ambush var(--d-pulse-zasada) cubic-bezier(.7, 0, .2, 1) infinite; }

  /* Скала — медленный вдох, самое неподвижное из четырёх */
  .f-card.sel[data-core="skala"] .halo { animation: rhythm-bulwark var(--d-pulse-skala) ease-in-out infinite; }
  .f-card.sel[data-core="skala"] .ring { animation: ring-bulwark var(--d-pulse-skala) ease-out infinite; }
}

@keyframes rhythm-onslaught {
  0%, 100% { opacity: .8; transform: scale(.96); }
  50% { opacity: 1; transform: scale(1.06); }
}
@keyframes ring-onslaught {
  0% { transform: scale(.78); opacity: .5; }
  70%, 100% { transform: scale(1.25); opacity: 0; }
}
@keyframes rhythm-raider {
  0% { opacity: .48; transform: scale(.96); }
  8% { opacity: 1; transform: scale(1.07); }
  18% { opacity: .55; transform: scale(.99); }
  24% { opacity: .95; transform: scale(1.04); }
  32% { opacity: .42; transform: scale(.95); }
  100% { opacity: .42; transform: scale(.95); }
}
@keyframes ring-raider {
  0% { transform: scale(.74); opacity: .55; }
  18%, 100% { transform: scale(1.25); opacity: 0; }
}
@keyframes rhythm-bulwark {
  0%, 100% { opacity: .58; transform: scale(.97); }
  50% { opacity: 1; transform: scale(1.07); }
}
@keyframes ring-bulwark {
  0% { transform: scale(.85); opacity: .4; }
  90%, 100% { transform: scale(1.18); opacity: 0; }
}
@keyframes rhythm-ambush {
  0%, 68% { opacity: .34; transform: scale(.95); }
  78% { opacity: 1; transform: scale(1.1); }
  88% { opacity: .7; transform: scale(1.02); }
  100% { opacity: .34; transform: scale(.95); }
}
@keyframes ring-ambush {
  0%, 70% { transform: scale(.8); opacity: 0; }
  78% { transform: scale(.9); opacity: .55; }
  100% { transform: scale(1.3); opacity: 0; }
}

/* ============================================================
   FOOT — primary CTA (bold, big, notched)
   ============================================================ */
.foot {
  display: flex; flex-direction: column;
  gap: var(--sp-4);
}

/* Причина, по которой кнопка не горит. Стоит под ней, тем же моношрифтом, что
   и прочие пояснения в игре. Своего цвета у причины нет — это не тревога. */
.why {
  margin: 0; text-align: center;
  font-family: var(--font-mono);
  font-size: var(--t-xs); letter-spacing: var(--ls-meta);
  text-transform: uppercase; color: var(--ink-off);
}

/* ПУСТОЙ СОСТАВ. Встречается только после роспуска всех бойцов, поэтому экран не
   извиняется и не кричит — говорит, что случилось и куда идти. */
.empty {
  display: flex; flex-direction: column; align-items: center; gap: var(--sp-3);
  padding: clamp(32px, 8vh, 72px) var(--sp-4);
  text-align: center;
}
.e-ttl {
  margin: 0;
  font-family: var(--font-display); font-weight: 800;
  font-size: clamp(20px, 2.6vw, 28px);
  letter-spacing: var(--ls-tight); text-transform: uppercase;
  color: var(--ink);
}
.e-note {
  margin: 0; max-width: 46ch;
  font-family: var(--font-mono);
  font-size: var(--t-sm); line-height: 1.5; color: var(--ink-dim);
}

/* CTA — notched primary, fight-card chevron. Disabled = ghost
   (dashed thin outline, muted). Ready = filled in core hue. */
.cta {
  position: relative; width: 100%;
  font-family: var(--font-display); font-weight: 800;
  font-size: clamp(19px, 2vw, 23px);
  letter-spacing: var(--ls-meta); text-transform: uppercase;
  padding: var(--sp-4) var(--sp-5);
  display: flex; align-items: center; justify-content: center; gap: var(--sp-5);
  background: transparent; color: var(--ink-dim);
  cursor: not-allowed; opacity: .82;
  overflow: hidden;
  transition: filter .2s, transform .12s, opacity .2s, color .2s;
}
.cta::after {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  border: 1px dashed var(--line-strong);
  clip-path: polygon(18px 0, 100% 0, 100% calc(100% - 18px),
                    calc(100% - 18px) 100%, 0 100%, 0 18px);
}
.cta .arr {
  font-family: var(--font-mono); font-weight: 700; font-size: var(--t-lg);
  letter-spacing: var(--ls-tight);
  transition: transform .3s var(--e-weight); /* glides on hover (PLAY-style feel) */
}
.cta span { position: relative; z-index: 2; }

/* Ready — FLAT fill, notched, in core hue. No gloss/bevel, NO surrounding glow
   (one light on screen = the core). A narrow sheen sweeps ACROSS the fill like
   the landing PLAY button — a highlight ON the button, not a halo around it. */
.cta.is-ready {
  cursor: pointer; opacity: 1; color: var(--void);
  background: var(--core);
  clip-path: polygon(18px 0, 100% 0, 100% calc(100% - 18px),
                    calc(100% - 18px) 100%, 0 100%, 0 18px);
}
.cta.is-ready::after { display: none; }
/* Пробегающий блик по кнопке снят (Правка 1.2 §2): он не попадал ни в одну из
   трёх групп петель — не пульсация геройского свечения, не ритм ядра, не
   служебная. На этом экране уже идут четыре ритма ядер, и блик поверх них был
   движением без смысла. Кнопку выделяет заливка цветом выбранного ядра. */
.cta.is-ready:hover { filter: brightness(1.08); }
.cta.is-ready:active { transform: scale(.99); }
/* arrow glides right on hover — pointer devices only (static on touch). */
@media (hover: hover) {
  .cta.is-ready:hover .arr { transform: translateX(5px); }
}
@media (prefers-reduced-motion: reduce) {
  .cta .arr { transition: none; }                 /* no glide */
  .cta.is-ready:hover .arr { transform: none; }    /* arrow stays put */
}

/* ============================================================
   DESKTOP TUNING — give the grid more presence at >900px
   ============================================================ */
@media (min-width: 1024px) and (min-height: 820px) {
  .col { max-width: 840px; }
  .f-card { min-height: 218px; padding: var(--sp-5) var(--sp-5) 0; }
  .f-card .icon { width: 108px; height: 108px; }
  .f-card .stage-i { min-height: 114px; }
  .f-card .stage-i::before { width: 132px; height: 118px; }
}
@media (min-width: 1024px) and (min-height: 920px) {
  .col { max-width: 900px; }
  .f-card { min-height: 240px; }
}

/* Short viewports: collapse to ultra-tight */
@media (max-height: 720px) {
  .f-card { min-height: 168px; padding: var(--sp-4) var(--sp-4) 0; }
  .f-card .icon { width: 84px; height: 84px; }
  .f-card .stage-i { min-height: 86px; margin: var(--sp-1) 0 var(--sp-2); }
  .f-card .body { padding-bottom: var(--sp-3); }
  .headline h1 { font-size: clamp(32px, 5vw, 52px); }
}
</style>
