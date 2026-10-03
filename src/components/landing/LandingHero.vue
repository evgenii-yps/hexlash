<template>
  <section class="hero" id="top">
    <!-- Фон первого экрана — петля. Играет по расписанию, а время кадра отдаёт
         наверх: по нему знак и слово делают удар (см. onFrame). -->
    <LandingHeroVideo :paused="bgPaused" @frame="onFrame" @reset="clearFx" />

    <!-- Голова: знак + заголовок в одной рамке. Знак стоит НАД словом и в покое
         невидим — он появляется только в тёмной паузе петли (по её времени),
         держится и улетает в знак шапки (см. paint ниже); при «уменьшить
         движение» стоит всегда (см. landing.css). -->
    <div ref="headRef" class="hero-head">
      <HexlashMark class="hero-mark" :size="240" sizes="240px" />

      <!-- Заголовок — само имя бренда, одной строкой, живым текстом.
           .glow — копия слова, которая несёт ТОЛЬКО ореол (буквы у неё
           прозрачные). Мерцает она, а буквы стоят неподвижно: гаснет свет
           вывески, а не сама вывеска. Для читалок экрана копия скрыта. -->
      <h1 class="headline">
        <span class="line reveal" data-d="3">
          <span class="word">HEXLASH</span>
          <span class="glow" aria-hidden="true">HEXLASH</span>
        </span>
      </h1>
    </div>

    <p class="lead reveal" data-d="5">{{ t.landing.hero.lead }}</p>
    <p class="lead-sub reveal" data-d="5">{{ t.landing.hero.leadSub }}</p>

    <div class="cta-row reveal" data-d="6">
      <a class="btn-play" href="#play" @click.prevent="$emit('play')">
        <span class="btn-play-bg"></span>
        <span class="btn-play-label">PLAY</span>
        <span class="btn-play-arrow"><ArrowIcon /></span>
      </a>
      <a class="btn-ghost" href="#discord">
        <DiscordIcon />
        <span>JOIN DISCORD</span>
      </a>
    </div>

    <a class="scrollcue reveal" data-d="7" href="#manifesto" aria-label="Scroll"><span></span></a>

    <!-- Слот нулевой высоты: кнопка встаёт под «мышку» (а на телефоне, где мышки
         нет, — под кнопки), но ничего из остального первого экрана не сдвигает. -->
    <div class="hero-watch-slot reveal" data-d="7">
      <button class="btn-ghost btn-watch" type="button" @click="$emit('watch')">
        <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1l9 5-9 5z" /></svg>
        <span>{{ t.landing.hero.watchTrailer }}</span>
      </button>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { DiscordIcon, ArrowIcon } from './icons.js';
import { HexlashMark } from '@/components/brand/hexlashMark.js';
import LandingHeroVideo from './LandingHeroVideo.vue';
import {
  loopFx, easeFromToken, FLIGHT_EASE_TOKEN, FLIGHT_ARC,
  ARRIVE_FLASH_MS, ARRIVE_FLASH_SCALE, ARRIVE_FLASH_BRIGHT,
} from '@/data/heroLoop.js';
import { t } from '@/locales/index.js';
// Кадры сбоя для слоя .glow. Их набор общий с объёмной вывеской в коридоре
// сцены, поэтому живёт одной таблицей в src/data/signFlicker.js, а не вторым
// блоком @keyframes в landing.css — см. комментарий на месте, где он стоял.
import { installFlickerKeyframes } from '@/data/signFlicker.js';
installFlickerKeyframes();

defineProps({
  /** Окно полного трейлера открыто — фон стоит на паузе. */
  bgPaused: { type: Boolean, default: false },
});
defineEmits(['play', 'watch']);

const headRef = ref(null);

/* Состояние ОДНОГО круга петли. Всё, что ниже, сбрасывается в clearFx() —
   то есть когда время кадра выходит за окно эффекта (шов петли, пауза вне
   экрана, смена файла). Накопленного состояния между кругами нет. */
let fxOn = false;
let flight = null;      // измерено в момент отрыва: куда лететь
let noFly = false;      // лететь некуда (шапки не видно) — знак гаснет на месте
let aborted = false;    // сорвано прокруткой/размером — знак убран до следующего круга
let flashed = false;    // вспышка шапки на этом круге уже была
let inFlight = false;   // летит прямо сейчас (держит rAF)
let flashAnim = null;

/* Сглаживание. Время даёт ВИДЕО — по кадру, ~30 раз в секунду, а экран
   перерисовывается чаще. Полёт между кадрами видео дорисовывается по
   часам, но не дальше, чем на один кадр, и только пока видео живо: встало
   (вкладка, трейлер, пауза вне экрана) — полёт замирает вместе с ним. */
const STALE_MS = 120;
const EXTRAPOLATE_MS = 40;
let lastT = 0;
let lastStamp = 0;
let lastRate = 1;
let lastPaintT = -1;
let raf = 0;

const markEl = () => (headRef.value ? headRef.value.querySelector('.hero-mark') : null);
const navMarkEl = () => {
  const root = headRef.value && headRef.value.closest('.lp');
  return root ? root.querySelector('.nav-logo .logo-mark') : null;
};
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Куда лететь. Меряется в момент отрыва, а не зашито числом: размер и место
   знака шапки зависят от ширины окна (140 / 92 точки) и от прокрутки. Знак в
   центре и знак в шапке — одна и та же картинка, поэтому совпавшие рамки дают
   совпавший рисунок. Центр рамки знака в покое = центр её отпечатка (масштаб
   идёт от центра, сдвига ещё нет). null — лететь некуда. */
function measureFlight(mark) {
  const nav = navMarkEl();
  if (!nav) return null;
  const a = mark.getBoundingClientRect();
  const b = nav.getBoundingClientRect();
  // Ширина отпечатка, а не offsetWidth: тот округляется до целого, и знак на
  // прилёте был бы шире знака шапки на долю точки. Масштаб в этот момент — 1.
  if (!a.width || !b.width) return null;
  // Шапка должна быть целиком в окне: страница прокручена вниз — полёта нет.
  if (b.top < 0 || b.left < 0 || b.right > window.innerWidth || b.bottom > window.innerHeight) return null;
  return {
    dx: (b.left + b.width / 2) - (a.left + a.width / 2),
    dy: (b.top + b.height / 2) - (a.top + a.height / 2),
    s1: b.width / a.width,
    ease: easeFromToken(FLIGHT_EASE_TOKEN, document.documentElement),
  };
}

function setMark(mark, a, x, y, s) {
  const st = mark.style;
  st.setProperty('--mark-a', a.toFixed(3));
  st.setProperty('--mark-s', s.toFixed(4));
  st.setProperty('--mark-x', `${x.toFixed(2)}px`);
  st.setProperty('--mark-y', `${y.toFixed(2)}px`);
}

/* Вспышка знака шапки на прилёте: яркость и масштаб на 0.3 с. Ни тени, ни
   ореола — знак остаётся матовым. */
function flash() {
  const nav = navMarkEl();
  if (!nav || !nav.animate || reducedMotion()) return;
  if (flashAnim) flashAnim.cancel();
  const easing = getComputedStyle(document.documentElement).getPropertyValue('--e-spring').trim() || 'ease-out';
  flashAnim = nav.animate([
    { transform: 'scale(1)', filter: 'brightness(1)' },
    { transform: `scale(${ARRIVE_FLASH_SCALE})`, filter: `brightness(${ARRIVE_FLASH_BRIGHT})`, offset: 0.4 },
    { transform: 'scale(1)', filter: 'brightness(1)' },
  ], { duration: ARRIVE_FLASH_MS, easing });
}

/* Один кадр эффектов для момента петли `time`. Слово бьёт как раньше; знак —
   проявляется, держится, отрывается и летит в шапку. */
function paint(time) {
  const el = headRef.value;
  const mark = markEl();
  if (!el || !mark) return;
  let fx = loopFx(time, { fly: !noFly });
  if (!fx.active) {
    if (fxOn) clearFx();
    return;
  }
  fxOn = true;
  lastPaintT = time;
  el.style.setProperty('--word-s', fx.word.toFixed(4));

  if (aborted) {
    setMark(mark, 0, 0, 0, 1);
    inFlight = false;
    return;
  }

  // Отрыв: меряем, куда лететь. Не вышло — гасим на месте, как до полёта.
  if (fx.flying && !flight && !noFly) {
    flight = measureFlight(mark);
    if (!flight) {
      noFly = true;
      fx = loopFx(time, { fly: false });
    }
  }

  if (flight && (fx.flying || fx.arrived)) {
    const e = flight.ease(fx.flight);
    // Дуга: боковое отклонение от прямой, максимальное на середине пути.
    const bow = FLIGHT_ARC * Math.sin(Math.PI * e);
    const x = flight.dx * e - flight.dy * bow;
    const y = flight.dy * e + flight.dx * bow;
    setMark(mark, fx.arrived ? 0 : 1, x, y, 1 + (flight.s1 - 1) * e);
    inFlight = fx.flying;
    if (fx.arrived && !flashed) {
      flashed = true;
      flash();
    }
  } else {
    setMark(mark, fx.alpha, 0, 0, fx.mark);
    inFlight = false;
  }
}

/* Удар. Переменные читают стили (.hero-mark, .headline в landing.css); тут
   только их значения по времени петли. Снаружи окна эффекта страница лежит в
   покое без единой записи в DOM. */
function onFrame(time, rate = 1) {
  lastT = time;
  lastStamp = performance.now();
  lastRate = rate || 1;
  // Дорисованное по часам уже могло уйти чуть вперёд кадра — назад не пятимся.
  if (!(inFlight && time < lastPaintT && lastPaintT - time < 0.1)) paint(time);
  if (inFlight && !raf) raf = requestAnimationFrame(tick);
}

function tick() {
  raf = 0;
  if (!inFlight) return;
  const age = performance.now() - lastStamp;
  if (age > STALE_MS) return;            // видео встало — держим последний кадр
  paint(lastT + (Math.min(age, EXTRAPOLATE_MS) * lastRate) / 1000);
  if (inFlight) raf = requestAnimationFrame(tick);
}

/* Прокрутка, поворот или смена размера во время полёта: путь измерен под
   прежнюю раскладку, поэтому летящий знак мгновенно исчезает (шапка и так на
   месте), вспышки нет. До следующего круга. */
function abortFlight() {
  if (!inFlight) return;
  aborted = true;
  inFlight = false;
  const mark = markEl();
  if (mark) setMark(mark, 0, 0, 0, 1);
}

function clearFx() {
  const el = headRef.value;
  fxOn = false;
  flight = null;
  noFly = false;
  aborted = false;
  flashed = false;
  inFlight = false;
  lastPaintT = -1;
  cancelAnimationFrame(raf);
  raf = 0;
  if (!el) return;
  el.style.removeProperty('--word-s');
  const mark = markEl();
  if (!mark) return;
  ['--mark-a', '--mark-s', '--mark-x', '--mark-y'].forEach((n) => mark.style.removeProperty(n));
}

onMounted(() => {
  const opt = { passive: true };
  window.addEventListener('scroll', abortFlight, opt);
  window.addEventListener('resize', abortFlight, opt);
  window.addEventListener('orientationchange', abortFlight, opt);
});
onBeforeUnmount(() => {
  window.removeEventListener('scroll', abortFlight);
  window.removeEventListener('resize', abortFlight);
  window.removeEventListener('orientationchange', abortFlight);
  cancelAnimationFrame(raf);
  if (flashAnim) flashAnim.cancel();
});
</script>
