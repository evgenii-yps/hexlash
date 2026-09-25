<template>
  <div class="lp" ref="rootRef">
    <div class="app" :class="{ 'is-in': isIn }">
      <!-- fixed background (shared with the auth screen) -->
      <!-- ⚠️ ЦВЕТ СЮДА БОЛЬШЕ НЕ ПЕРЕДАЁТСЯ. Раньше стоял :accent="accent" —
           цвет переключался ступенькой на границе раздела. Теперь он ведётся
           глубиной и перетекает каждый кадр: правило .lp .lp-bg .lp-bg__ink в
           landing.css отдаёт фигуре готовое --journey-rgb.
           Проп не передаём намеренно: иначе в LandingBackground просыпается
           класс is-shifting, а это постоянный CSS-переход на наследуемом цвете
           — ровно то, что там измеряли и специально убрали (19.8 мс против
           16.6 мс на медленном телефоне). Плавность теперь даёт пересчёт. -->
      <LandingBackground
        :core="activeCore"
        :scanlines="config.scanlines"
        :grain="config.grain"
      />

      <!-- Слой затемнения между фоном и текстом. Сила — одним числом
           (--journey-dim в landing.css); сейчас 0, то есть слоя не видно.
           Заведён заранее, чтобы прижать фон под текстом одной правкой, если
           на каком-то разделе он начнёт мешать читать. -->
      <div class="lp-journey-dim" aria-hidden="true"></div>

      <LandingNav />

      <main class="page" ref="pageRef">
        <LandingHero @play="onPlay" />
        <LandingCode />
        <LandingGameplay />
        <LandingToken />
        <LandingRoadmap />
        <LandingStayUpdated />
        <LandingFooter />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useDocumentMeta } from '@/composables/useDocumentMeta';
import { coreAt, accentRgb } from '@/data/coreCycle.js';
import LandingBackground from '@/components/landing/LandingBackground.vue';
import LandingNav from '@/components/landing/LandingNav.vue';
import LandingHero from '@/components/landing/LandingHero.vue';
import LandingCode from '@/components/landing/LandingCode.vue';
import LandingGameplay from '@/components/landing/LandingGameplay.vue';
import LandingToken from '@/components/landing/LandingToken.vue';
import LandingRoadmap from '@/components/landing/LandingRoadmap.vue';
import LandingStayUpdated from '@/components/landing/LandingStayUpdated.vue';
import LandingFooter from '@/components/landing/LandingFooter.vue';
import '@/components/landing/landing.css';

const router = useRouter();
const rootRef = ref(null);
const pageRef = ref(null);

// Static config — ported from the reference TWEAK_DEFAULTS (app.jsx). The
// design tool's live Tweaks panel is intentionally NOT ported (per the brief).
// intensity + shape ушли вместе с холстом ромбов (20.09.2026): у волны нет
// ни силы узора, ни выбора фигуры — она задана геометрией в LandingBackground.
//
// ⚠️ Отсюда уехал акцент. Тут лежал литерал '#ff0069' и свой hexToRgb — то
// есть ВТОРОЕ объявление фирменного розового рядом с тем, что в файле
// токенов. Теперь цвет раздела приходит из src/data/coreCycle.js, а тот
// читает токены.
const config = {
  grain: true,
  scanlines: true,
};

/* Круг цветов: розовый → четыре ядра → снова розовый.
   Остановок столько же, сколько разделов (семь) — круг из пяти успевает
   замкнуться и пойти по второму разу, это и задумано. Раньше номер остановки
   выдавал наблюдатель границ; теперь его выдаёт ГЛУБИНА (см. flightTick). */
const activeIndex = ref(0);
const activeCore = computed(() => coreAt(activeIndex.value));

const isIn = ref(false);

let revealObserver = null;
let revealSafety = null;
let entranceTimer = null;

/* ======================= ПОЛЁТ ВГЛУБЬ ЯДРА ==============================
   Прокрутка ведёт ОДНУ величину — «насколько мы приблизились», от 0 в начале
   страницы до 1 в конце. Всё остальное — производные от неё, и считаются они
   в одном кадре: фон приближается, разделы проходят мимо камеры, цвет ядра
   перетекает. Второго обработчика прокрутки на странице нет.

   ⚠️ Числа глубины и выноса живут в landing.css (--journey-zoom,
   --journey-push, --journey-dim) — сюда их не переносить. Здесь только то,
   что считается на месте.                                                  */

/* Доля пути мимо камеры, на которой раздел читается в полную силу. Дальше он
   растворяется. Выше — текст дольше остаётся плотным, ниже — полёт заметнее.
   Живёт здесь, а не в стилях: прозрачность считается этим кадром. */
const TEXT_HOLD = 0.45;

/* Разделы, участвующие в полёте: первый экран и подвал не входят — у первого
   свой вход при загрузке, подвал обязан читаться в самом низу страницы. */
let flightSecs = [];
/* Цвета остановок круга. Считаются один раз: accentRgb читает значения из
   стилей документа, делать это каждый кадр незачем. */
let flightStops = [];
let flightQueued = false;

function flightTick() {
  flightQueued = false;
  const root = rootRef.value;
  if (!root || flightStops.length < 2) return;

  const vh = window.innerHeight || 1;
  const span = Math.max(1, document.documentElement.scrollHeight - vh);
  const depth = Math.min(1, Math.max(0, window.scrollY / span));

  /* Сначала ЧИТАЕМ всё, потом ПИШЕМ всё: иначе браузер пересчитывает
     раскладку по разу на каждый раздел. */
  const rects = flightSecs.map((el) => el.getBoundingClientRect());

  root.style.setProperty('--journey', depth.toFixed(4));

  /* Цвет: круг разложен по глубине и перетекает между соседними остановками.
     Ступенчатой осталась только ЯРКОСТЬ фигуры (проп core) — она берёт
     ближайшую остановку, как и раньше, и заодно перезапускает налив веток. */
  const last = flightStops.length - 1;
  const t = depth * last;
  const i = Math.min(last - 1, Math.floor(t));
  const f = t - i;
  const a = flightStops[i];
  const b = flightStops[i + 1];
  const mix = (k) => Math.round(a[k] + (b[k] - a[k]) * f);
  root.style.setProperty('--journey-rgb', `${mix(0)}, ${mix(1)}, ${mix(2)}`);
  const stop = Math.round(t);
  if (stop !== activeIndex.value) activeIndex.value = stop;

  /* Разделы. --pass: −1 раздел ещё впереди, 0 — ровно посередине экрана,
     +1 — камера его прошла. Делим на полусумму высот, а не на высоту экрана:
     раздел бывает выше экрана, и тогда ±1 приходится ровно на момент, когда
     он с экрана ушёл — растворяться раньше ему незачем. */
  for (let k = 0; k < flightSecs.length; k += 1) {
    const r = rects[k];
    const reach = (vh + r.height) / 2;
    const pass = Math.max(-1, Math.min(1, (vh / 2 - (r.top + r.height / 2)) / reach));
    const away = Math.abs(pass);
    const near = away <= TEXT_HOLD ? 1 : 1 - (away - TEXT_HOLD) / (1 - TEXT_HOLD);
    const st = flightSecs[k].style;
    st.setProperty('--pass', pass.toFixed(4));
    st.setProperty('--near', near.toFixed(4));
  }
}

function onFlightScroll() {
  if (flightQueued) return;
  flightQueued = true;
  requestAnimationFrame(flightTick);
}

// PLAY → into the game. Anonymous visitors enter via signup (authed users are
// redirected to /play by the route's beforeEnter, so they never see this CTA).
function onPlay() {
  router.push('/auth/signup');
}

// Delegated in-page anchor scrolling — reproduces native `href="#id"` smooth
// scroll without a global `html { scroll-padding-top }` rule. The nav is a
// normal-flow element that scrolls away, so sections land at their own top (no
// fixed-header offset). Unknown/placeholder hashes (#play, #discord, #x, social
// links) are swallowed so the page never jumps to top.
function onAnchorClick(e) {
  const a = e.target.closest('a[href^="#"]');
  if (!a || !rootRef.value || !rootRef.value.contains(a)) return;
  const href = a.getAttribute('href');
  if (!href || href === '#') {
    e.preventDefault();
    return;
  }
  e.preventDefault();
  const id = href.slice(1);
  if (id === 'top') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  const el = document.getElementById(id);
  if (!el) return; // placeholder hash (social/play) — no-op
  const top = el.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top, behavior: 'smooth' });
}

useDocumentMeta({
  // Tab/share title is the bare domain on every route (incl. the landing).
  // og:title / twitter:title derive from this; description + og:image (marketing)
  // are intentionally left untouched.
  title: 'hexlash.com',
  description: 'Pick your fighter, build your loadout, take the belt. A Web3 turn-based fighter on Base. Train. Fight. Rise.',
  ogImage: 'https://hexlash.com/og-image.png',
});

onMounted(() => {
  // hero load entrance (reference: setTimeout 90ms → .is-in)
  entranceTimer = setTimeout(() => { isIn.value = true; }, 90);

  /* ПОЛЁТ. Раньше здесь стоял наблюдатель границ, переключавший цвет на
     границе раздела — цвет менялся ступенькой и был привязан к НОМЕРУ экрана.
     Теперь и цвет, и приближение фона, и проход разделов ведёт одна величина
     глубины, и считается она одним кадром. */
  const sections = pageRef.value ? Array.from(pageRef.value.children) : [];
  /* Остановок цвета столько же, сколько разделов — прежний круг сохранён. */
  flightStops = sections.map((_, i) => accentRgb(coreAt(i)));
  /* В полёте — только разделы .sec: первый экран и подвал не участвуют. */
  flightSecs = sections.filter((el) => el.classList.contains('sec'));

  window.addEventListener('scroll', onFlightScroll, { passive: true });
  window.addEventListener('resize', onFlightScroll);
  flightTick();

  // in-page anchor smooth-scroll (delegated)
  rootRef.value.addEventListener('click', onAnchorClick);

  // scroll-reveal for [data-reveal] sections (reference app.jsx)
  const els = Array.from(rootRef.value.querySelectorAll('[data-reveal]'));
  if (!('IntersectionObserver' in window)) {
    els.forEach((el) => el.setAttribute('data-inview', '1'));
  } else {
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute('data-inview', '1');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: '0px 0px -8% 0px' }
    );
    els.forEach((el) => revealObserver.observe(el));
    // safety net: reveal anything still hidden after a beat (throttled observers)
    revealSafety = setTimeout(
      () => els.forEach((el) => el.setAttribute('data-inview', '1')),
      2600
    );
  }
});

onBeforeUnmount(() => {
  if (entranceTimer) clearTimeout(entranceTimer);
  if (revealSafety) clearTimeout(revealSafety);
  if (revealObserver) revealObserver.disconnect();
  window.removeEventListener('scroll', onFlightScroll);
  window.removeEventListener('resize', onFlightScroll);
  flightSecs = [];
  flightStops = [];
  if (rootRef.value) rootRef.value.removeEventListener('click', onAnchorClick);
});
</script>
