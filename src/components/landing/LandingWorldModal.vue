<template>
  <Teleport to="body">
    <Transition name="lw">
      <!-- Слой лора — во весь экран, карточки нет (ТЗ №2 от 11.09.2026 отменяет
           карточку из ТЗ №1). Слой --z-modal.
           ⚠️ Шапка лендинга (.lp .nav) стоит на том же --z-modal, а .lp своего
           контекста наложения не создаёт. Слой уходит в конец <body> через
           Teleport, то есть при равном уровне рисуется позже шапки и перекрывает
           её. Если у .lp когда-нибудь появится position/transform — проверить
           заново.
           ⚠️ Закрытия по нажатию на затемнение НЕТ намеренно: карточки не
           видно, и у человека нет способа понять, где «вне окна» — весь экран
           выглядит содержимым. Случайное закрытие посреди чтения хуже лишнего
           движения к крестику (решение владельца 11.09.2026). -->
      <div
        v-if="open"
        class="lw-layer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lw-title"
      >
        <!-- Полоса прочитанного. Прижата к самому верху ЭКРАНА, выше рамки-кадра.
             Единственный движущийся розовый элемент в слое. Ведётся прокруткой
             напрямую, без перехода: переход по такой величине отстаёт рывками на
             быстрой прокрутке, а под «уменьшить движение» его всё равно нет. -->
        <i
          class="lw-progress"
          aria-hidden="true"
          :style="{ transform: `scaleX(${progress})` }"
        ></i>

        <!-- Край кадра. Волосяная линия, тон линий лендинга, не розовый.
             Уголков-скобок нет: они уже есть на рамке видео, второй раз это шум. -->
        <span class="lw-frame" aria-hidden="true"></span>

        <!-- Шапка — СОСЕД прокручиваемой области, а не липкий элемент внутри
             неё: sticky в контейнерах этого проекта дрейфил два захода. -->
        <header class="lw-top">
          <h2 id="lw-title" class="lw-title">THE WORLD OF HEXLASH</h2>
          <button
            ref="closeRef"
            type="button"
            class="lw-close"
            aria-label="Close"
            @click="$emit('close')"
          >×</button>
        </header>

        <div class="lw-scrollwrap">
          <div ref="scrollRef" class="lw-scroll" @scroll.passive="onScroll">
            <div class="lw-col">
              <section class="lw-sec" data-reveal>
                <p class="lw-num">01 · ORDER</p>
                <h3 class="lw-h">The age of order</h3>
                <p class="lw-p">This is not a ruined world. War was not defeated and not outlawed — it was put in a frame. Any dispute that once took an army — territory, a resource, a contract, an old grudge — is now settled by one fight. You lose, you hand it over. Nobody argues with the result.</p>
              </section>

              <section class="lw-sec" data-reveal>
                <p class="lw-num">02 · DELEGATION</p>
                <h3 class="lw-h">Three things we handed over</h3>
                <p class="lw-p">First we gave war to a duel: one fight instead of armies. Then we gave the duel to fighters we made, because whoever steps into the cell is still someone alive. Then those fighters started to think — not by design. It turned out you cannot teach something to fight without teaching it to decide. And whatever decides eventually becomes someone.</p>
              </section>

              <section class="lw-sec" data-reveal>
                <p class="lw-num">03 · THE CELL</p>
                <h3 class="lw-h">One cell, two fighters, one minute</h3>
                <p class="lw-p">The cell is where a fight happens. Every cell is joined into one system — not a place, an institution. Like an exchange: physically everywhere, in practice a single thing. Inside this world the name HEXLASH is read literally: a strike inside the cell. The only violence this world allows itself.</p>
              </section>

              <section class="lw-sec" data-reveal>
                <p class="lw-num">04 · LOAD</p>
                <h3 class="lw-h">Made of different things</h3>
                <p class="lw-p">Fighters are made of metal, flesh, light, and things with no name. One reads as a machine, one as a beast, one as a person, one as nothing you recognize.</p>
                <p class="lw-p">What they share is not substance. It's load. Everything that exists behaves the same way under load: it holds, it bends, or it breaks. That is the only rule that turned out to be true for all of them — which is why the system measures what you hold, not what you're made of.</p>
                <p class="lw-p">Stepping in, every fighter takes the same shell. Not armour — a condition of entry. The silhouette stays its own. The surface is shared, and only one thing glows: the core. So the fight settles the question, not the origin.</p>
              </section>

              <section class="lw-sec" data-reveal>
                <p class="lw-num">05 · CHARACTER</p>
                <h3 class="lw-h">A fighter is born empty</h3>
                <p class="lw-p">The body was given. The core surfaced on its own — the way a fighter meets an opponent, four of them, and nobody gets to choose.</p>
                <p class="lw-p">Character is the only thing a fighter earns. It's what's left after load: wins make it bolder or calmer, losses make it careful or angry. It doesn't grow in a straight line and it never resets. A fighter with no losses isn't soft. It just hasn't been loaded yet.</p>
              </section>

              <section class="lw-sec" data-reveal>
                <p class="lw-num">06 · THE THRESHOLD</p>
                <h3 class="lw-h">Enough hits, and hitting stops teaching</h3>
                <p class="lw-p">There comes a fight that teaches nothing. No opponent can surprise it anymore, and in that second it stops being a fighter — not because anyone decided, but because there is nothing left to learn by being hit.</p>
                <p class="lw-p">A fighter that has been hit enough no longer needs hits. It starts to explain.</p>
                <p class="lw-p">From then on it trains your other fighters and leads them in the cell instead of you. It cannot step in itself: the cell only takes those who can still be surprised.</p>
              </section>

              <section class="lw-sec" data-reveal>
                <p class="lw-num">07 · THE RECORD</p>
                <h3 class="lw-h">History can't be bought</h3>
                <p class="lw-p">All of it holds together on one thing: a result cannot be faked, and a fighter's history is visible to everyone and owned by no one. Every fight, every loss, every load.</p>
                <p class="lw-p">You can buy a fighter a look. You cannot buy what it lived through.</p>
              </section>

              <p class="lw-close-line" data-reveal>The world took three steps down and stopped. The game asks the fourth and doesn't answer it: if you raised something that teaches better than you and commands better than you — what are you now?</p>
            </div>
          </div>

          <!-- Затухание у нижнего края прокручиваемой области: без него слой
               читается как оборванный. Цвет — тон затемнения, не карточки
               (карточки больше нет). -->
          <span class="lw-fade" aria-hidden="true"></span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, nextTick, onBeforeUnmount } from 'vue';

const props = defineProps({ open: { type: Boolean, default: false } });
const emit = defineEmits(['close']);

const closeRef = ref(null);
const scrollRef = ref(null);
const progress = ref(0);

/* ── Полоса прочитанного ────────────────────────────────────────────────
   Считается прямо в обработчике прокрутки и зажимается в 0…1, поэтому за
   100% не выходит и на быстрой прокрутке не отстаёт. */
function onScroll() {
  const el = scrollRef.value;
  if (!el) return;
  const span = el.scrollHeight - el.clientHeight;
  progress.value = span > 0 ? Math.min(1, Math.max(0, el.scrollTop / span)) : 1;
  syncReveal();
}

/* ── Появление разделов при прокрутке ───────────────────────────────────
   Приём на лендинге уже есть (data-reveal → data-inview, один раз, без
   обратного гашения), но переиспользовать его напрямую нельзя по двум
   причинам: наблюдатель собирает элементы один раз при монтировании витрины
   и только внутри её корня, а слой монтируется позже и уходит в <body>;
   и его правила объявлены под .lp, куда слой не попадает. Поэтому здесь
   свой наблюдатель по тому же договору и со своими числами (12 точек,
   без размытия — ТЗ №2).
   Разделы, которые видны сразу при открытии, помечаются мгновенными: иначе
   они поднимались бы дважды — со всем слоем и сами по себе. */
/* Раздел считается «вошедшим», когда его верх поднялся выше нижнего края
   прокручиваемой области на этот запас. Раньше — рано, текст ещё за кадром. */
const REVEAL_LEAD = 48;

let revealItems = [];

function reveal(el, instant) {
  el.setAttribute('data-inview', '1');
  if (instant) el.setAttribute('data-instant', '1');
}

function stopReveal() {
  revealItems = [];
}

/* Появление разделов при прокрутке.
   ⚠️ Приём на витрине есть (data-reveal → data-inview, один раз, без обратного
   гашения), но переиспользовать его напрямую нельзя: наблюдатель собирает
   элементы один раз при монтировании витрины и только внутри её корня, а слой
   монтируется позже и уходит в <body>; его правила к тому же объявлены под .lp,
   куда слой не попадает. Договор об атрибутах и «показался — больше не гаснет»
   взяты оттуда, числа свои (12 точек, без размытия).
   ⚠️ И сделано НЕ через IntersectionObserver, хотя витрина использует его.
   Наблюдатель сообщает только о том, что попадает в экран СЕЙЧАС: при резком
   флике или программном прыжке к концу раздел пролетает мимо между кадрами,
   события не получает и остаётся невидимым НАВСЕГДА — текст молча пропадает.
   Замерено дважды: прыжок в конец оставлял скрытыми то разделы 4 и 5, то
   раздел 6 (тот, что вставал ровно на верхнюю кромку). Здесь один проход по
   геометрии на каждое событие прокрутки — семь элементов, дешёво, и пропустить
   раздел он не может по построению. Обработчик прокрутки уже есть: он ведёт
   полосу прочитанного. */
function syncReveal(instant = false) {
  const root = scrollRef.value;
  if (!root || !revealItems.length) return;
  const edge = root.getBoundingClientRect().bottom - REVEAL_LEAD;
  revealItems.forEach((el) => {
    if (el.hasAttribute('data-inview')) return;
    if (el.getBoundingClientRect().top < edge) reveal(el, instant);
  });
}

function startReveal() {
  const root = scrollRef.value;
  if (!root) return;
  revealItems = Array.from(root.querySelectorAll('[data-reveal]'));

  // «Уменьшить движение»: разделы видны сразу все.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    revealItems.forEach((el) => reveal(el, true));
    return;
  }

  // Видимые сразу при открытии поднимаются вместе со всем слоем и второй раз
  // не двигаются, поэтому помечаются мгновенными.
  syncReveal(true);
}

/* ── Замок прокрутки страницы ───────────────────────────────────────────
   overflow на <body> при видимом overflow у <html> переносится на область
   просмотра — страница перестаёт ехать, а положение прокрутки сохраняется,
   поэтому при закрытии её не подбрасывает. Полоса прокрутки исчезает вместе
   с прокруткой: её ширина возвращается отступом справа, иначе содержимое
   дёргается вбок на настольном экране.
   ⚠️ Постоянного body { overflow: hidden } в проекте нет и быть не должно
   (05.09.2026 он ломал прокрутку лендинга) — замок только на время показа. */
let prevOverflow = '';
let prevPadRight = '';
let prevFocus = null;
let locked = false;

function lock() {
  if (locked) return;
  locked = true;
  const gap = window.innerWidth - document.documentElement.clientWidth;
  prevOverflow = document.body.style.overflow;
  prevPadRight = document.body.style.paddingRight;
  document.body.style.overflow = 'hidden';
  if (gap > 0) document.body.style.paddingRight = `${gap}px`;
}

function unlock() {
  if (!locked) return;
  locked = false;
  document.body.style.overflow = prevOverflow;
  document.body.style.paddingRight = prevPadRight;
}

function onKeydown(e) {
  if (e.key === 'Escape') emit('close');
}

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      // Кто открыл слой — тому и вернём фокус после закрытия.
      prevFocus = document.activeElement;
      progress.value = 0;
      lock();
      document.addEventListener('keydown', onKeydown);
      await nextTick();
      closeRef.value?.focus();
      startReveal();
      onScroll();
    } else {
      stopReveal();
      document.removeEventListener('keydown', onKeydown);
      unlock();
      if (prevFocus && typeof prevFocus.focus === 'function') prevFocus.focus();
      prevFocus = null;
    }
  }
);

// Уход со страницы при открытом слое не должен оставить <body> запертым.
onBeforeUnmount(() => {
  stopReveal();
  document.removeEventListener('keydown', onKeydown);
  unlock();
});
</script>

<style scoped>
/* ============ СЛОЙ ============ */
/* Все настройки слоя — здесь, одним блоком.
   --lw-inset  — отступ края кадра от края экрана
   --lw-pad    — боковые поля колонки на узком экране
   --lw-measure — ширина колонки. ⚠️ Задана В ТОЧКАХ, не в ch: 1ch у Saira
     Condensed — ширина НОЛЯ, а он заметно шире её строчных, и 66ch давали
     87–88 знаков в строке вместо 66 (замерено). 418 точек при кегле 18 — это
     измеренные ~68 знаков. Пара «кегль ↔ ширина» правится вместе. */
.lw-layer {
  --lw-inset: 28px;
  --lw-pad: 24px;
  --lw-measure: 418px;
  --lw-body: 18px;
  /* Межабзацный воздух. Воздух между разделами выведен от него же —
     вдвое крупнее (по --sp-5 сверху и снизу разделителя). */
  --lw-gap-p: var(--sp-5);
  position: fixed;
  inset: 0;
  height: 100dvh;
  z-index: var(--z-modal);
  display: flex;
  flex-direction: column;
  padding-bottom: var(--lw-inset);
  /* Размытия нет намеренно: на телефоне оно дорого, а выигрыша здесь не даёт.
     ⚠️ 99%, а не 94% из первой прикидки. Замерено так: всё, что слой рисует
     сам, скрыто — на экране остаётся только просвечивающая витрина, и по ней
     считается разброс яркости (0–255, при фоне 8). 92%→20 · 94%→15 · 96%→10 ·
     97%→8 · 98%→5 · 99%→3 · 99.5%→1 · 100%→0. Свой текст слоя держит около 167.
     Остановился на 99% по стоп-условию ТЗ: на 98% заголовок витрины и её абзац
     ещё ЧИТАЮТСЯ позади текста (проверено глазами на увеличенном снимке), на
     99% они гаснут до тени, а глубина остаётся — разброс 3 против 1 на 99.5%
     и 0 на 100%, где экран становится ровно чёрным. */
  background: color-mix(in srgb, var(--void) 99%, transparent);
}

.lw-progress {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  transform: scaleX(0);
  transform-origin: left center;
  background: var(--pink);
  pointer-events: none;
}

.lw-frame {
  position: absolute;
  inset: var(--lw-inset);
  border: 1px solid var(--line);
  pointer-events: none;
}

/* ============ ШАПКА ============ */
.lw-top {
  position: relative;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  /* Подпись и крестик выровнены по краю кадра, с воздухом внутрь. */
  padding: calc(var(--lw-inset) + var(--sp-5)) calc(var(--lw-inset) + var(--sp-5)) var(--sp-5);
  /* Служебная строка из выделения исключена. */
  user-select: none;
  -webkit-user-select: none;
}

.lw-title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: var(--t-lg);
  line-height: 1.15;
  letter-spacing: var(--ls-title);
  text-transform: uppercase;
  color: var(--ink);
}

.lw-close {
  flex: 0 0 auto;
  margin-left: auto;
  width: var(--h-btn-square);
  height: var(--h-btn-square);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 0;
  color: var(--ink-dim);
  font-family: var(--font-display);
  font-size: var(--t-xl);
  line-height: 1;
  cursor: pointer;
  transition: color var(--d-fast);
  user-select: none;
  -webkit-user-select: none;
}
.lw-close:hover { color: var(--ink); }
.lw-close:focus-visible {
  color: var(--ink);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--pink) 55%, transparent);
}

/* ============ ПРОКРУЧИВАЕМАЯ ОБЛАСТЬ ============ */
.lw-scrollwrap {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
}

.lw-scroll {
  height: 100%;
  overflow-y: auto;
  /* Прокрутка не «протекает» на страницу, когда содержимое кончилось. */
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: var(--sp-2) var(--lw-pad) calc(var(--sp-7) * 2);
}

.lw-col {
  max-width: var(--lw-measure);
  margin: 0 auto;
}

/* Выделение включено точечно — только на самих текстовых узлах лора. Общее
   правило проекта (снятое выделение) не тронуто.
   ⚠️ Ставить `user-select: text` на колонку НЕДОСТАТОЧНО: общее правило
   объявлено на `*`, то есть попадает в каждый элемент НАПРЯМУЮ и перебивает
   наследование от родителя. Замерено: у .lw-p вычислялось `none`, хотя у
   колонки стояло `text`. Поэтому значение стоит на каждом узле.
   Крестик, подпись слоя и метки разделов из выделения исключены. */
.lw-h,
.lw-p,
.lw-close-line {
  user-select: text;
  -webkit-user-select: text;
}

/* ============ РАЗДЕЛ ============ */
/* Разделитель — короткая черта по центру, тон линий витрины. Не рамка и не
   линия через всю колонку. Воздух вокруг вдвое крупнее межабзацного. */
.lw-sec + .lw-sec::before {
  content: "";
  display: block;
  width: 56px;
  height: 1px;
  margin: var(--lw-gap-p) auto;
  background: var(--line);
}

.lw-num {
  font-family: var(--font-mono);
  font-weight: 500;
  font-size: var(--t-xs);
  letter-spacing: var(--ls-meta);
  text-transform: uppercase;
  color: var(--pink);
  /* Метка раздела из выделения исключена. */
  user-select: none;
  -webkit-user-select: none;
}

/* Название раздела — примерно вдвое крупнее текста: это и даёт ощущение
   «крупно и читаемо». Шкала заголовков у витрины своя, текучая через clamp —
   тот же приём, которым набраны .big-title / .code-title / .hex-word. */
.lw-h {
  margin-top: var(--sp-3);
  font-family: var(--font-display);
  font-weight: 800;
  font-size: clamp(24px, 4.5vw, 40px);
  line-height: 1.08;
  letter-spacing: var(--ls-tight);
  text-transform: uppercase;
  color: var(--ink);
}

.lw-p {
  margin-top: var(--lw-gap-p);
  font-family: var(--font-display);
  font-weight: 400;
  font-size: var(--lw-body);
  line-height: 1.6;
  color: var(--ink-dim);
}

/* Закрывающая строка — без номера и названия, отбита воздухом крупнее, чем
   между разделами.
   ⚠️ Начертание 700, а не 600: 600 на витрине не встречается больше нигде, и
   слой тянул бы за собой ЕЩЁ ОДИН файл шрифта в момент открытия (замерено). */
.lw-close-line {
  margin-top: calc(var(--sp-7) * 1.5);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(20px, 3vw, 28px);
  line-height: 1.3;
  text-align: center;
  color: var(--ink);
}

.lw-fade {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 56px;
  pointer-events: none;
  background: linear-gradient(
    to top,
    color-mix(in srgb, var(--void) 99%, transparent),
    transparent
  );
}

/* ============ ПОЯВЛЕНИЕ РАЗДЕЛОВ ============ */
/* Договор тот же, что на витрине: data-reveal — исходное состояние,
   data-inview — появился и больше не гаснет. Числа свои (12 точек, без
   размытия). data-instant — раздел был виден сразу при открытии, он
   поднимается вместе со всем слоем и второй раз не двигается. */
[data-reveal] { opacity: 0; transform: translateY(12px); }
[data-reveal][data-inview] { animation: lwk-sec var(--d-panel) var(--e-settle) both; }
[data-reveal][data-instant] { opacity: 1; transform: none; animation: none; }
@keyframes lwk-sec {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: none; }
}

/* ============ УЗКИЙ ЭКРАН ============ */
@media (max-width: 680px) {
  .lw-layer {
    --lw-inset: 16px;
    --lw-pad: 22px;
    /* Пара «кегль ↔ ширина» правится вместе: 371 точка при кегле 16 — те же
       измеренные ~68 знаков. */
    --lw-measure: 371px;
    --lw-body: 16px;
  }
  .lw-top { padding: calc(var(--lw-inset) + var(--sp-4)) calc(var(--lw-inset) + var(--sp-4)) var(--sp-4); }
  .lw-title { font-size: var(--t-md); }
}

/* ============ ОЧЕНЬ НИЗКИЙ ЭКРАН ============ */
/* Телефон горизонтально. Край кадра не снимается — он декоративный и поля не
   съедает (колонка центрируется независимо) — но отступ уменьшается, иначе
   рамка лезет на подпись. Воздух вокруг шапки тоже поджимается. */
@media (max-height: 420px) {
  .lw-layer { --lw-inset: 8px; }
  .lw-top { padding: calc(var(--lw-inset) + var(--sp-3)) calc(var(--lw-inset) + var(--sp-3)) var(--sp-3); }
  .lw-close-line { margin-top: var(--sp-7); }
}

/* ============ ПОЯВЛЕНИЕ И УХОД СЛОЯ ============ */
/* Кадры одноразовые, петель нет. При «уменьшить движение» общее правило
   tokens.css сжимает длительность до 0.01мс и ставит анимацию в конечный
   кадр — слой появляется и исчезает МГНОВЕННО, а не «быстрее».
   Уход быстрее появления: --d-fast против --d-hover. */
@keyframes lwk-dim { from { opacity: 0; } to { opacity: 1; } }
@keyframes lwk-rise { from { transform: translateY(16px); } to { transform: none; } }

.lw-enter-active { animation: lwk-dim var(--d-hover) var(--e-settle); }
.lw-leave-active { animation: lwk-dim var(--d-fast) var(--e-settle) reverse; }
.lw-enter-active .lw-scrollwrap,
.lw-enter-active .lw-top { animation: lwk-rise var(--d-hover) var(--e-settle); }
.lw-leave-active .lw-scrollwrap,
.lw-leave-active .lw-top { animation: lwk-rise var(--d-fast) var(--e-settle) reverse; }
</style>
