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
        <div ref="scrollRef" class="lw-scroll" @scroll.passive="onScroll">
          <div class="lw-col">
            <!-- Подпись слоя УЕЗЖАЕТ вместе с текстом: она стоит первой в
                 колонке, а не в прибитой шапке (ТЗ №3 от 11.09.2026). Заодно из
                 слоя ушёл липкий элемент — в этом проекте он дрейфил дважды.
                 Ореол — единственное свечение в слое. -->
            <h2 id="lw-title" class="lw-title">THE WORLD OF HEXLASH</h2>
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

        <!-- Затухание у ВЕРХНЕГО края. Появилось вместе с уезжающей подписью:
             без него текст проезжал бы под крестиком. Только затухание — ни
             линий, ни цвета, ни полосы прогресса. -->
        <span class="lw-fade-top" aria-hidden="true"></span>

        <!-- Затухание у нижнего края: без него слой читается как оборванный. -->
        <span class="lw-fade" aria-hidden="true"></span>

        <!-- Крестик остаётся ПРИБИТЫМ к правому верхнему углу экрана и виден
             всегда. Стоит после затуханий, поэтому рисуется поверх них. -->
        <button
          ref="closeRef"
          type="button"
          class="lw-close"
          aria-label="Close"
          @click="$emit('close')"
        >×</button>
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

/* Обработчик прокрутки ведёт ТОЛЬКО появление разделов. Полоса прочитанного
   снята целиком (ТЗ №3 от 11.09.2026) — вместе с разметкой и оформлением. */
function onScroll() {
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
   --lw-dim     — плотность затемнения. ЕДИНСТВЕННОЕ место, где она задана:
     ниже её читают и фон слоя, и оба затухания. Правится одним значением.
   --lw-pad     — боковые поля колонки
   --lw-measure — ширина колонки. ⚠️ Задана В ТОЧКАХ, не в ch: 1ch у Saira
     Condensed — ширина НОЛЯ, а он заметно шире её строчных, и запись в ch даёт
     примерно на треть больше знаков, чем её число. 541 точка при кегле 22 —
     измеренные ~72 знака (потолок поднят с 68 до 72 в ТЗ №3). Пара
     «кегль ↔ ширина» правится вместе.
   --lw-lead    — воздух до подписи слоя: верх должен читаться титульным листом
   --lw-gap-p   — межабзацный воздух; воздух между разделами выведен от него же,
     вдвое крупнее (по --sp-5 сверху и снизу разделителя) */
.lw-layer {
  /* Размытия нет намеренно: на телефоне оно дорого, а выигрыша здесь не даёт.
     ⚠️ 99% подобрано замером: всё, что слой рисует сам, скрывалось, и по
     остатку считался разброс яркости просвечивающей витрины (при фоне 8 и
     своём тексте около 167). 92%→20 · 94%→15 · 96%→10 · 97%→8 · 98%→5 ·
     99%→3 · 99.5%→1 · 100%→0. На 98% заголовок витрины ещё ЧИТАЛСЯ позади
     текста, на 99.5% глубина пропадает, на 100% экран ровно чёрный. */
  --lw-dim: color-mix(in srgb, var(--void) 99%, transparent);
  --lw-pad: 24px;
  --lw-measure: 541px;
  --lw-body: 22px;
  --lw-lead: clamp(96px, 13vh, 168px);
  --lw-gap-p: var(--sp-5);
  /* Верхнее затухание и крестик выведены из ОДНОЙ величины — смещения крестика
     от верха экрана. Затухание держит полную плотность до СЕРЕДИНЫ крестика и
     только потом сходит на нет: иначе ровный градиент оказывается прозрачным
     ровно там, где стоит кнопка, и текст читается прямо под ней (замерено —
     метка раздела была видна насквозь на уровне крестика). */
  --lw-close-top: var(--sp-5);
  --lw-fade-top-h: 72px;
  --lw-fade-hold: calc(var(--lw-close-top) + var(--h-btn-square) / 2);
  position: fixed;
  inset: 0;
  height: 100dvh;
  z-index: var(--z-modal);
  background: var(--lw-dim);
}

/* ============ ПРОКРУЧИВАЕМАЯ ОБЛАСТЬ ============ */
/* Занимает весь слой: рамки по краю экрана больше нет, прибитой шапки тоже
   (ТЗ №3 — обе сняты целиком, а не спрятаны прозрачностью). */
.lw-scroll {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  /* Прокрутка не «протекает» на страницу, когда содержимое кончилось. */
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: 0 var(--lw-pad) calc(var(--sp-7) * 2);
}

.lw-col {
  max-width: var(--lw-measure);
  margin: 0 auto;
}

/* ============ ПОДПИСЬ СЛОЯ ============ */
/* Крупная, по центру колонки, со ровным ореолом и БЕЗ мерцания.
   ⚠️ Радиусы ореола заданы в em, а не в точках, и это обязательно: em считается
   от кегля самой подписи, поэтому ореол ведётся ТОЙ ЖЕ величиной, что и слово,
   и уменьшается вместе с ним на телефоне. В точках ореол остался бы прежним при
   уменьшенном слове — розовое пятно переросло бы буквы (урок 11.09.2026).
   Числа — те же доли, что у заголовка первого экрана витрины, поэтому
   соотношение ореола к букве у обоих одинаковое.
   Тень текста рисуется ПОЗАДИ букв, поэтому отдельный слой свечения (как в
   заголовке витрины) здесь не нужен: там он был заведён ради мерцания, а
   мерцания тут нет. */
.lw-title {
  margin: var(--lw-lead) 0 calc(var(--sp-7) * 1.5);
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 36px;
  line-height: 1.12;
  letter-spacing: var(--ls-title);
  text-transform: uppercase;
  text-align: center;
  color: var(--ink);
  text-shadow:
    0 0 .024em rgba(var(--pink-rgb), .55),
    0 0 .109em rgba(var(--pink-rgb), .55),
    0 0 .236em rgba(var(--pink-rgb), .45);
  /* Служебная подпись из выделения исключена. */
  user-select: none;
  -webkit-user-select: none;
}

/* ============ КРЕСТИК ============ */
/* Прибит к правому верхнему углу ЭКРАНА и виден всегда. */
.lw-close {
  position: fixed;
  top: var(--lw-close-top);
  right: var(--lw-close-top);
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
/* Обвод фокуса с клавиатуры. Размытия у него нет — это КОЛЬЦО, а не ореол,
   поэтому правило «одно свечение в слое» оно не нарушает. Без обвода у кнопки
   пропадало бы состояние «фокус с клавиатуры», обязательное по системе. */
.lw-close:focus-visible {
  color: var(--ink);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--pink) 55%, transparent);
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
  /* Метка раздела из выделения исключена. Розовый здесь МАТОВЫЙ — единственное
     свечение в слое носит подпись. */
  user-select: none;
  -webkit-user-select: none;
}

/* Название раздела — примерно вдвое крупнее текста: это и даёт ощущение
   «крупно и читаемо». Соотношение 52/22 на широком экране и 30/18 на телефоне.
   ⚠️ Кегли заданы ступенями по тому же перелому, что и текст, а НЕ текучим
   clamp. Сначала стояло clamp: заголовок ехал плавно, а текст менялся ступенью
   на 680 точках, и между 680 и 1156 соотношение проваливалось — замер на 768
   давал 34.6 против 22, то есть 1.57 вместо двух. Одна ступень на оба кегля
   держит соотношение на любой ширине. Витринная шкала через clamp остаётся у
   больших заголовков страницы (.big-title / .code-title / .hex-word), где
   разброс кегля в разы, а не в полтора. */
.lw-h {
  margin-top: var(--sp-3);
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 52px;
  line-height: 1.06;
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
  font-size: 30px;
  line-height: 1.3;
  text-align: center;
  color: var(--ink);
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

/* ============ ЗАТУХАНИЯ ============ */
/* Верхнее — чтобы текст гас до того, как дойдёт до крестика. Нижнее — чтобы
   слой не читался оборванным. Оба берут ТОТ ЖЕ --lw-dim, что и фон слоя. */
.lw-fade-top {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: var(--lw-fade-top-h);
  pointer-events: none;
  background: linear-gradient(
    to bottom,
    var(--lw-dim) 0,
    var(--lw-dim) var(--lw-fade-hold),
    transparent var(--lw-fade-top-h)
  );
}

.lw-fade {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 56px;
  pointer-events: none;
  background: linear-gradient(to top, var(--lw-dim), transparent);
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
    --lw-pad: 22px;
    /* Пара «кегль ↔ ширина» правится вместе: 442 точки при кегле 18 — те же
       измеренные ~72 знака. На телефоне колонку всё равно ограничивают боковые
       поля, число работает от планшета и шире. */
    --lw-measure: 442px;
    --lw-body: 18px;
  }
  .lw-title { font-size: 26px; }
  .lw-h { font-size: 30px; }
  .lw-close-line { font-size: 23px; }
  .lw-layer { --lw-close-top: var(--sp-4); }
}

/* ============ ОЧЕНЬ НИЗКИЙ ЭКРАН ============ */
/* Телефон горизонтально. Воздух до подписи поджимается: на 360 точках высоты
   титульный воздух съедал бы половину первого экрана и текста почти не было бы
   видно. Замер на 740×360: до правки раздел 01 начинался на 178 точках, теперь
   на 128 — текста видно около 230 точек из 360.
   ⚠️ Воздух выведен ОТ ВЫСОТЫ ЗАТУХАНИЯ, а не задан своим числом: иначе подпись
   рождается под затуханием и её верх приглушён. Замерено: при воздухе 32 и
   затухании 48 верхние 16 точек букв гасли примерно на треть. Пара
   «затухание ↔ воздух» правится вместе.
   На высотах выше 420 точек нижняя граница clamp (96) уже перекрывает
   затухание 72 с запасом, поэтому связывать их там не нужно. */
@media (max-height: 420px) {
  .lw-layer {
    --lw-close-top: var(--sp-3);
    --lw-fade-top-h: 48px;
    --lw-lead: calc(var(--lw-fade-top-h) + var(--sp-4));
  }
  .lw-title { margin-bottom: var(--sp-5); }
  .lw-close-line { margin-top: var(--sp-7); }
}

/* ============ ПОЯВЛЕНИЕ И УХОД СЛОЯ ============ */
/* Кадры одноразовые, петель нет. При «уменьшить движение» общее правило
   tokens.css сжимает длительность до 0.01мс и ставит анимацию в конечный
   кадр — слой появляется и исчезает МГНОВЕННО, а не «быстрее». Ореол при этом
   остаётся: он не движение.
   Уход быстрее появления: --d-fast против --d-hover. */
@keyframes lwk-dim { from { opacity: 0; } to { opacity: 1; } }
@keyframes lwk-rise { from { transform: translateY(16px); } to { transform: none; } }

.lw-enter-active { animation: lwk-dim var(--d-hover) var(--e-settle); }
.lw-leave-active { animation: lwk-dim var(--d-fast) var(--e-settle) reverse; }
.lw-enter-active .lw-scroll { animation: lwk-rise var(--d-hover) var(--e-settle); }
.lw-leave-active .lw-scroll { animation: lwk-rise var(--d-fast) var(--e-settle) reverse; }
</style>
