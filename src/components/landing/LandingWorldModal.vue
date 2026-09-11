<template>
  <Teleport to="body">
    <Transition name="lw">
      <!-- Затемнение + окно живут на одном слое --z-modal: карточка вложена в
           затемнение, а не лежит рядом с ним, поэтому собственный уровень ей не
           нужен — хватает position:relative. Второе число не заводим.
           ⚠️ Шапка лендинга (.lp .nav) стоит на том же --z-modal, а .lp своего
           контекста наложения не создаёт. Окно уходит в конец <body> через
           Teleport, то есть при равном уровне рисуется позже шапки и перекрывает
           её. Если у .lp когда-нибудь появится position/transform — проверить
           заново. -->
      <div
        v-if="open"
        class="lw-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lw-title"
        @click.self="$emit('close')"
      >
        <div class="lw-card">
          <!-- Шапка — СОСЕД прокручиваемой области, а не липкий элемент внутри
               неё: sticky в контейнерах этого проекта дрейфил, раскладка
               «шапка соседом» держится надёжно. -->
          <header class="lw-head">
            <h2 id="lw-title" class="lw-title">THE WORLD OF HEXLASH</h2>
            <button
              ref="closeRef"
              type="button"
              class="lw-close"
              aria-label="Close"
              @click="$emit('close')"
            >×</button>
          </header>

          <div class="lw-body">
            <section class="lw-sec">
              <p class="lw-num">01 · ORDER</p>
              <h3 class="lw-h">The age of order</h3>
              <p class="lw-p">This is not a ruined world. War was not defeated and not outlawed — it was put in a frame. Any dispute that once took an army — territory, a resource, a contract, an old grudge — is now settled by one fight. You lose, you hand it over. Nobody argues with the result.</p>
            </section>

            <section class="lw-sec">
              <p class="lw-num">02 · DELEGATION</p>
              <h3 class="lw-h">Three things we handed over</h3>
              <p class="lw-p">First we gave war to a duel: one fight instead of armies. Then we gave the duel to fighters we made, because whoever steps into the cell is still someone alive. Then those fighters started to think — not by design. It turned out you cannot teach something to fight without teaching it to decide. And whatever decides eventually becomes someone.</p>
            </section>

            <section class="lw-sec">
              <p class="lw-num">03 · THE CELL</p>
              <h3 class="lw-h">One cell, two fighters, one minute</h3>
              <p class="lw-p">The cell is where a fight happens. Every cell is joined into one system — not a place, an institution. Like an exchange: physically everywhere, in practice a single thing. Inside this world the name HEXLASH is read literally: a strike inside the cell. The only violence this world allows itself.</p>
            </section>

            <section class="lw-sec">
              <p class="lw-num">04 · LOAD</p>
              <h3 class="lw-h">Made of different things</h3>
              <p class="lw-p">Fighters are made of metal, flesh, light, and things with no name. One reads as a machine, one as a beast, one as a person, one as nothing you recognize.</p>
              <p class="lw-p">What they share is not substance. It's load. Everything that exists behaves the same way under load: it holds, it bends, or it breaks. That is the only rule that turned out to be true for all of them — which is why the system measures what you hold, not what you're made of.</p>
              <p class="lw-p">Stepping in, every fighter takes the same shell. Not armour — a condition of entry. The silhouette stays its own. The surface is shared, and only one thing glows: the core. So the fight settles the question, not the origin.</p>
            </section>

            <section class="lw-sec">
              <p class="lw-num">05 · CHARACTER</p>
              <h3 class="lw-h">A fighter is born empty</h3>
              <p class="lw-p">The body was given. The core surfaced on its own — the way a fighter meets an opponent, four of them, and nobody gets to choose.</p>
              <p class="lw-p">Character is the only thing a fighter earns. It's what's left after load: wins make it bolder or calmer, losses make it careful or angry. It doesn't grow in a straight line and it never resets. A fighter with no losses isn't soft. It just hasn't been loaded yet.</p>
            </section>

            <section class="lw-sec">
              <p class="lw-num">06 · THE THRESHOLD</p>
              <h3 class="lw-h">Enough hits, and hitting stops teaching</h3>
              <p class="lw-p">There comes a fight that teaches nothing. No opponent can surprise it anymore, and in that second it stops being a fighter — not because anyone decided, but because there is nothing left to learn by being hit.</p>
              <p class="lw-p">A fighter that has been hit enough no longer needs hits. It starts to explain.</p>
              <p class="lw-p">From then on it trains your other fighters and leads them in the cell instead of you. It cannot step in itself: the cell only takes those who can still be surprised.</p>
            </section>

            <section class="lw-sec">
              <p class="lw-num">07 · THE RECORD</p>
              <h3 class="lw-h">History can't be bought</h3>
              <p class="lw-p">All of it holds together on one thing: a result cannot be faked, and a fighter's history is visible to everyone and owned by no one. Every fight, every loss, every load.</p>
              <p class="lw-p">You can buy a fighter a look. You cannot buy what it lived through.</p>
            </section>

            <p class="lw-close-line">The world took three steps down and stopped. The game asks the fourth and doesn't answer it: if you raised something that teaches better than you and commands better than you — what are you now?</p>
          </div>

          <!-- Затухание содержимого у нижнего края: без него на телефоне окно
               читается как оборванное. -->
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

/* Замок прокрутки страницы. overflow на <body> при видимом overflow у <html>
   переносится на область просмотра — страница перестаёт ехать, а положение
   прокрутки сохраняется, поэтому при закрытии её не подбрасывает.
   Полоса прокрутки исчезает вместе с прокруткой: её ширина возвращается
   отступом справа, иначе содержимое дёргается вбок на настольном экране.
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
      // Кто открыл окно — тому и вернём фокус после закрытия.
      prevFocus = document.activeElement;
      lock();
      document.addEventListener('keydown', onKeydown);
      await nextTick();
      closeRef.value?.focus();
    } else {
      document.removeEventListener('keydown', onKeydown);
      unlock();
      if (prevFocus && typeof prevFocus.focus === 'function') prevFocus.focus();
      prevFocus = null;
    }
  }
);

// Уход со страницы при открытом окне не должен оставить <body> запертым.
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown);
  unlock();
});
</script>

<style scoped>
/* Затемнение. Размытия нет намеренно: на телефоне оно дорого, а выигрыша здесь
   не даёт (решение владельца 11.09.2026). */
.lw-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--sp-4);
  background: color-mix(in srgb, var(--void) 85%, transparent);
}

.lw-card {
  position: relative;
  display: flex;
  flex-direction: column;
  /* Нижняя граница вилки ТЗ (560–640): при верхней столбец текста, ограниченный
     по числу знаков, оставлял справа почти 200 точек пустоты. */
  width: min(560px, 100%);
  /* Второе объявление в dvh переживает панели браузера на телефоне; первое —
     запас для движков без dvh. */
  max-height: 85vh;
  max-height: 85dvh;
  overflow: hidden;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--r-modal);
}

/* ── Шапка окна ────────────────────────────────────────────────────────── */
.lw-head {
  flex: 0 0 auto;
  display: flex;
  align-items: flex-start;
  gap: var(--sp-3);
  padding: var(--sp-5) var(--sp-5) var(--sp-4);
  border-bottom: 1px solid var(--line);
}

.lw-title {
  flex: 1 1 auto;
  min-width: 0;
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
  width: var(--h-btn-square);
  height: var(--h-btn-square);
  margin: calc(var(--sp-2) * -1) calc(var(--sp-3) * -1) 0 0;
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
}
.lw-close:hover { color: var(--ink); }
.lw-close:focus-visible {
  color: var(--ink);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--pink) 55%, transparent);
  border-radius: var(--r-modal);
}

/* ── Прокручиваемое содержимое ─────────────────────────────────────────── */
.lw-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  /* Прокрутка не «протекает» на страницу, когда содержимое кончилось. */
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: var(--sp-5) var(--sp-5) var(--sp-7);
}

.lw-sec + .lw-sec { margin-top: var(--sp-6); }

.lw-num {
  font-family: var(--font-mono);
  font-weight: 500;
  font-size: var(--t-xs);
  letter-spacing: var(--ls-meta);
  text-transform: uppercase;
  color: var(--pink);
}

.lw-h {
  margin-top: var(--sp-2);
  font-family: var(--font-display);
  font-weight: 800;
  font-size: var(--t-xl);
  line-height: 1.12;
  letter-spacing: var(--ls-tight);
  text-transform: uppercase;
  color: var(--ink);
}

/* Ширина строки задана в ch, поэтому пересчитывается вместе с кеглем.
   Кегль, шрифт и цвет — те же, что у нижнего уровня первого экрана
   (.lp .lead-sub): это уже принятая на витрине ступень основного текста. */
.lw-p {
  /* ⚠️ 1ch у Saira Condensed — это ширина НОЛЯ, а он заметно шире её строчных
     букв: замер на 1920 показал, что 66ch дают 87–88 знаков в строке, а не 66.
     46ch — это ИЗМЕРЕННЫЕ ~65 знаков, то есть середина вилки 60–68 из ТЗ.
     Число в ch, поэтому пересчитывается вместе с кеглем автоматически. */
  max-width: 46ch;
  margin-top: var(--sp-3);
  font-family: var(--font-display);
  font-weight: 400;
  font-size: var(--t-lg);
  line-height: 1.6;
  color: var(--ink-dim);
}

/* Закрывающая строка — без номера и названия, крупнее текста разделов.
   ⚠️ Начертание 700, а не 600: 600 на витрине не встречается больше нигде, и
   окно тянуло бы за собой ЕЩЁ ОДИН файл шрифта в момент открытия (замерено).
   Окно обязано строиться из уже загруженной страницы — see ТЗ 11.09.2026. */
.lw-close-line {
  max-width: 46ch;
  margin-top: var(--sp-7);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: var(--t-xl);
  line-height: 1.35;
  color: var(--ink);
}

/* Затухание у нижнего края: без него на телефоне окно читается как оборванное.
   Рамка карточки — 1 точка, поэтому слой отступает от края на неё. */
.lw-fade {
  position: absolute;
  left: 1px;
  right: 1px;
  bottom: 1px;
  height: 40px;
  pointer-events: none;
  background: linear-gradient(to top, var(--panel), transparent);
}

/* ── Узкий экран: окно почти во весь экран ─────────────────────────────── */
@media (max-width: 680px) {
  .lw-card {
    max-height: 92vh;
    max-height: 92dvh;
  }
  .lw-head { padding: var(--sp-4) var(--sp-4) var(--sp-3); }
  .lw-body { padding: var(--sp-4) var(--sp-4) var(--sp-6); }
  .lw-title { font-size: var(--t-md); }
  .lw-h { font-size: var(--t-lg); }
  .lw-p { font-size: var(--t-md); line-height: 1.7; }
  .lw-close-line { font-size: var(--t-lg); }
}

/* ── Появление и уход ──────────────────────────────────────────────────── */
/* Кадры одноразовые, петель здесь нет. При «уменьшить движение» общее правило
   tokens.css сжимает длительность до 0.01мс и ставит анимацию в конечный кадр —
   окно появляется и исчезает МГНОВЕННО, а не «быстрее». Своего правила не
   нужно. Правило .lp * из landing.css сюда не достаёт: окно вынесено в <body>
   и лежит вне .lp. */
@keyframes lwk-dim { from { opacity: 0; } to { opacity: 1; } }
@keyframes lwk-rise { from { transform: translateY(12px); } to { transform: none; } }

.lw-enter-active { animation: lwk-dim var(--d-hover) var(--e-settle); }
.lw-leave-active { animation: lwk-dim var(--d-hover) var(--e-settle) reverse; }
.lw-enter-active .lw-card { animation: lwk-rise var(--d-hover) var(--e-settle); }
.lw-leave-active .lw-card { animation: lwk-rise var(--d-hover) var(--e-settle) reverse; }
</style>
