/* Подсветка ряда карточек сама переходит по очереди слева направо, по кругу.

   Подсветка — тот же вид, что при наведении (его рисует CSS по классу
   .is-lit); здесь только решается, какая карточка горит сейчас.

   Правила (ТЗ TZ_landing_cards_and_preview_v1):
   • одна карточка держит подсветку HOLD_MS (~3 с); мягкость перехода — в CSS
     (.is-cycling, 0.8 с);
   • цикл идёт, только пока ряд виден. «Виден» — это и попадание в экран, и то,
     что станция полёта не спрятана камерой (она прячется inline-visibility, а
     наблюдатель пересечений про это не знает);
   • мышь на карточке: горит её собственный :hover, цикл стоит; убрал — цикл
     продолжается со следующей;
   • касание: горит коснувшаяся карточка, цикл стоит, через HOLD_MS после
     отпускания продолжается со следующей;
   • «уменьшить движение»: цикла нет вообще, всё как при одном наведении.

   Никаких таймеров на карточку: один опрос раз в POLL_MS, и только пока ряд
   на экране. Опрос читает inline-стиль станции и время — раскладку не трогает. */
import { onMounted, onBeforeUnmount } from 'vue';

const HOLD_MS = 3000;
const POLL_MS = 200;
const LIT = 'is-lit';
const CYCLING = 'is-cycling';

export function useCardCycle(rowRef, cardSelector) {
  let row = null;
  let cards = [];
  let io = null;
  let poll = 0;
  let mq = null;
  let inView = false;
  let idx = -1;          // карточка, которая горит сейчас (или -1)
  let litAt = 0;
  let holdMouse = false; // мышь стоит на карточке
  let holdTouchUntil = 0;
  const unbinders = [];

  function stationShown() {
    const st = row.closest('.lp-station');
    if (!st) return true;
    if (st.style.visibility === 'hidden') return false;
    const o = parseFloat(st.style.getPropertyValue('--st-o'));
    return Number.isNaN(o) || o >= 0.6;
  }

  function setLit(i) {
    cards.forEach((c, k) => c.classList.toggle(LIT, k === i));
    idx = i;
    litAt = performance.now();
  }

  function clearLit() {
    cards.forEach((c) => c.classList.remove(LIT));
  }

  function tick() {
    if (holdMouse) return;
    const now = performance.now();
    if (now < holdTouchUntil) return;
    if (!inView || !stationShown() || document.hidden) {
      if (idx !== -1 || row.querySelector('.' + LIT)) { clearLit(); }
      // Запоминаем, где остановились: вернулся в кадр — идём дальше.
      litAt = 0;
      return;
    }
    if (litAt === 0 || now - litAt >= HOLD_MS) {
      setLit((idx + 1) % cards.length);
    }
  }

  function startPoll() {
    if (!poll) poll = window.setInterval(tick, POLL_MS);
  }
  function stopPoll() {
    if (poll) { window.clearInterval(poll); poll = 0; }
  }

  function on(el, type, fn, opts) {
    el.addEventListener(type, fn, opts);
    unbinders.push(() => el.removeEventListener(type, fn, opts));
  }

  function bindCards() {
    cards.forEach((card, k) => {
      on(card, 'pointerenter', (e) => {
        if (e.pointerType === 'touch') return;
        holdMouse = true;
        idx = k;
        clearLit(); // горит собственный :hover
      });
      on(card, 'pointerleave', (e) => {
        if (e.pointerType === 'touch') return;
        holdMouse = false;
        idx = k;
        litAt = 0; // следующая загорается сразу
        tick();
      });
      on(card, 'pointerdown', (e) => {
        if (e.pointerType !== 'touch') return;
        setLit(k);
        holdTouchUntil = Infinity;
      });
      const release = (e) => {
        if (e.pointerType !== 'touch') return;
        holdTouchUntil = performance.now() + HOLD_MS;
        litAt = performance.now();
      };
      on(card, 'pointerup', release);
      on(card, 'pointercancel', release);
    });
  }

  function enable() {
    row.classList.add(CYCLING);
    bindCards();
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver((entries) => {
        inView = entries[entries.length - 1].isIntersecting;
        if (inView) startPoll(); else { stopPoll(); clearLit(); litAt = 0; }
      }, { threshold: 0.25 });
      io.observe(row);
    }
  }

  function disable() {
    stopPoll();
    if (io) { io.disconnect(); io = null; }
    unbinders.splice(0).forEach((u) => u());
    holdMouse = false;
    holdTouchUntil = 0;
    inView = false;
    idx = -1;
    litAt = 0;
    if (row) { clearLit(); row.classList.remove(CYCLING); }
  }

  function onMotionChange() {
    if (mq.matches) disable(); else enable();
  }

  onMounted(() => {
    row = rowRef.value;
    if (!row) return;
    cards = Array.from(row.querySelectorAll(cardSelector));
    if (cards.length < 2) return;
    mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!mq.matches) enable();
    mq.addEventListener('change', onMotionChange);
  });

  onBeforeUnmount(() => {
    if (mq) mq.removeEventListener('change', onMotionChange);
    disable();
  });
}
