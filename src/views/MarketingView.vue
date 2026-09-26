<template>
  <div class="lp" ref="rootRef">
    <div class="app" :class="{ 'is-in': isIn }">
      <!-- fixed background (shared with the auth screen) -->
      <!-- ⚠️ ЦВЕТ СЮДА БОЛЬШЕ НЕ ПЕРЕДАЁТСЯ. Раньше стоял :accent="accent" —
           цвет переключался ступенькой на границе раздела. Теперь он ведётся
           маршрутом полёта и перетекает каждый кадр: правило
           .lp .lp-bg .lp-bg__ink в landing.css отдаёт фигуре готовое
           --journey-rgb.
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
           на какой-то станции он начнёт мешать читать. -->
      <div class="lp-journey-dim" aria-hidden="true"></div>

      <LandingNav />

      <main class="page" ref="pageRef">
        <!-- Первый экран НЕ улетает (решение владельца 26.09.2026): он стоит
             обычным первым экраном, полёт начинается после него. -->
        <LandingHero @play="onPlay" />

        <!-- ПОЛЁТ. Высокий блок даёт прокрутку, внутри него прилипшее окно во
             весь экран, а в окне — мир: кольца, ядро и текстовые блоки в одних
             координатах. Камера ведёт их вместе одной трансформацией.
             ⚠️ Порядок блоков внутри мира — тот же, что был на странице. -->
        <div class="lp-flight" ref="flightRef">
          <div class="lp-flight-vp">
            <div class="lp-world" ref="worldRef">
              <div class="lp-station" data-station="1"><LandingCode /></div>
              <div class="lp-station" data-station="2"><LandingGameplay /></div>
              <div class="lp-station" data-station="3"><LandingToken /></div>
              <div class="lp-station" data-station="4"><LandingRoadmap /></div>
            </div>
          </div>
        </div>

        <!-- Пришли в середину — прилипание отпускается, дальше обычная
             страница и подвал. -->
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
import { STATIONS, fitZoom, zoomAt, legAt, stationU } from '@/components/landing/stations.js';
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
const flightRef = ref(null);
const worldRef = ref(null);

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

/* Круг цветов: розовый → ONSLAUGHT → RAIDER → BULWARK → AMBUSH, по цвету на
   станцию. Ступенчатой осталась только ЯРКОСТЬ фигуры — она берёт ближайшую
   станцию и заодно перезапускает налив веток. Сам цвет перетекает. */
const activeIndex = ref(0);
const activeCore = computed(() => coreAt(activeIndex.value));

const isIn = ref(false);

let revealObserver = null;
let revealSafety = null;
let entranceTimer = null;

/* ==================== КАМЕРА: ЛОМАНЫЙ МАРШРУТ ==========================
   Прокрутка внутри высокого блока .lp-flight даёт одну величину 0…1 — «как
   далеко мы по маршруту». Из неё в одном кадре выводится всё: положение и
   приближение камеры, цвет ядра, видимость станций. Второго обработчика
   прокрутки на странице нет.

   Камера — три числа (--cam-x, --cam-y, --cam-z), их читают ДВА элемента:
   мир с текстом (.lp-world) и фигура (.cv). Точка отсчёта у обоих одна —
   середина фигуры, — поэтому кольца, ядро и текст живут в одних координатах
   и едут вместе.

   ⚠️ Маршрут сюда не вписан: станции, доли площадок и предел приближения
   лежат в components/landing/stations.js, а тот выводит координаты из того же
   описания «Вихря», по которому кольца рисуются. Второго места с геометрией
   в проекте быть не должно.                                              */

const clamp01 = (v) => Math.min(1, Math.max(0, v));

let stationEls = [];
let stationStops = [];
let camQueued = false;
/* Геометрия фигуры, прочитанная у .cv. Меняется только от размера окна,
   поэтому считается в layout(), а не каждый кадр. */
let coreR = 0;
let coreCy = 0.48;
let fit = 1;
let availH = 0;
/* Насколько каждый блок выше свободной высоты экрана. Ноль — помещается. */
let stationOver = [];
/* Предел ужимания блока под высоту экрана. Ниже него блок не ужимается — его
   остаток камера проходит на площадке. Замер высот (см. отчёт): на телефоне
   самый высокий блок просит 0.74, на низком окне компьютера — 0.56. Предел
   взят чуть ниже худшего, чтобы проход оставался страховкой, а не обычным
   делом: ехать по блоку хуже, чем показать его целиком. */
const FIT_FLOOR = 0.55;
const reduceMotion = typeof window !== 'undefined'
  && window.matchMedia
  && window.matchMedia('(prefers-reduced-motion: reduce)');

/* Раскладка: размер и середина фигуры + предел приближения от высоты окна +
   постоянные величины станций (их место в мире и обратный масштаб). */
function layout() {
  const root = rootRef.value;
  const cv = root && root.querySelector('.cv');
  if (!root || !cv) return;

  /* ⚠️ --core-r НЕЛЬЗЯ прочитать как число. Объявлено оно выражением
     clamp(...), а getComputedStyle отдаёт у своих свойств не вычисленную
     длину, а сам текст объявления — parseFloat даст пустоту, и вся сцена
     схлопнется в точку. Поэтому размер берётся с настоящего элемента: ядро в
     фигуре имеет ширину ровно в два --core-r. offsetWidth, а не рамка на
     экране: он не зависит от того, как элемент повёрнут и растянут. */
  const core = cv.querySelector('.cv-core');
  coreR = core ? core.offsetWidth / 2 : 0;
  const cy = getComputedStyle(cv).getPropertyValue('--core-cy').trim();
  coreCy = cy.endsWith('%') ? parseFloat(cy) / 100 : 0.48;
  if (!coreR) return;

  root.style.setProperty('--cam-oy', `${(coreCy * 100).toFixed(3)}%`);

  /* Свободная высота — весь экран без небольшого поля по краям.
     ⚠️ Раньше отсюда вычиталась высота шапки: она прилипала и накрывала верх
     блока. Шапка больше не прилипает (решение владельца 26.09.2026 — во время
     полёта её нет вовсе), поэтому весь экран блокам и достаётся. */
  const vh = window.innerHeight || 1;
  availH = Math.max(120, vh - 32);

  /* ⚠️ ПОДГОНКА ПОД ЭКРАН — в два приёма, и порядок важен.
     Сперва по каждому блоку считаем, насколько он выше свободной высоты:
     ужим (не бесконечный — ниже предела текст на телефоне уже не читается) и
     остаток, который придётся пройти камерой на площадке. Ужим от предела
     приближения не зависит, поэтому его можно посчитать первым.
     И только потом — сам предел приближения, с запасом на этот проход: иначе
     на последней станции камера уедет по высокому блоку и срежет фигуру, а
     задание требует, чтобы в финале ядро осталось целым. */
  const shrinks = [];
  stationOver = [];
  stationEls.forEach((el, k) => {
    if (!el) { shrinks[k] = 1; stationOver[k] = 0; return; }
    const inner = el.firstElementChild;
    const h = inner ? inner.offsetHeight : 0;
    const shrink = h > availH ? Math.max(FIT_FLOOR, availH / h) : 1;
    shrinks[k] = shrink;
    stationOver[k] = Math.max(0, h * shrink - availH);
  });
  const lastOver = stationOver[STATIONS.length - 1] || 0;
  fit = fitZoom(coreR, vh, lastOver / 2);

  stationEls.forEach((el, k) => {
    if (!el) return; // станция 0 — общий план, своего блока у неё нет
    const p = STATIONS[k].at();
    /* Обратный масштаб: на своей станции он гасит масштаб камеры, и блок
       виден ровно в проектном размере — с обычной вёрсткой и переносами. */
    const z = zoomAt(STATIONS[k].zoom, fit);
    el.style.setProperty('--st-x', `${(p.x * coreR).toFixed(2)}px`);
    el.style.setProperty('--st-y', `${(p.y * coreR).toFixed(2)}px`);
    el.style.setProperty('--st-z', (z / shrinks[k]).toFixed(4));
  });
}

/* ДОГОН КАМЕРЫ.

   Камера идёт за прокруткой не мгновенно, а подтягивается к ней. Нужно это
   потому, что прокрутка приходит рывками: палец за кадр сдвигает страницу на
   разное число точек, а посередине перегона картинка движется примерно вдвое
   быстрее прокрутки (замер: 26 точек картинки на 10 точек пальца). Мелкая
   дрожь пальца попадала прямо в движение камеры — это и читалось как
   «дёргается».

   Постоянная — ВРЕМЯ, а не доля кадра: доля дала бы разную мягкость на разной
   частоте экрана. За CAM_LAG_MS камера съедает примерно две трети отставания.

   ⚠️ CAM_LAG_MAX — предел отставания, и он обязателен. Без него после
   быстрого броска камера ещё долго едет сама по себе, а это читается уже не
   как мягкость, а как «тормозит». С пределом бросок камера отрабатывает
   вровень, а фильтруется только мелочь. Мерить обе величины сдвигом картинки
   за кадр и запаздыванием после остановки, а не на глаз. */
const CAM_LAG_MS = 70;
const CAM_LAG_MAX = 0.0025;

let uCam = 0;
let camPrimed = false;
let camLast = 0;

/** Доля маршрута, на которой стоит ПРОКРУТКА (без догона). */
function readU() {
  const flight = flightRef.value;
  if (!flight) return 0;
  const vh = window.innerHeight || 1;
  const r = flight.getBoundingClientRect();
  const travel = Math.max(1, r.height - vh);
  return clamp01(-r.top / travel);
}

function camTick(now) {
  camQueued = false;
  const root = rootRef.value;
  const flight = flightRef.value;
  if (!root || !flight || !coreR || stationStops.length < 2) return;

  const vh = window.innerHeight || 1;

  /* Где мы по маршруту. До полёта — 0, после — 1. */
  const target = readU();
  const t = typeof now === 'number' ? now : 0;
  /* Шаг времени ограничен сверху: после паузы (вкладка в фоне, первый кадр
     после остановки) он был бы огромным и догон схлопнулся бы в прыжок. */
  const dt = camLast ? Math.min(64, Math.max(1, t - camLast)) : 16.7;
  camLast = t;

  if (!camPrimed) {
    uCam = target;
    camPrimed = true;
  } else {
    /* Чем больше отставание, тем быстрее догон: на мелкой дрожи камера мягкая,
       на броске — жёсткая и идёт вровень. Переход плавный, без скачка: резкое
       «подтянуть до предела» само даёт толчок на кадре, где сработало (замер:
       максимум за кадр рос с 215 до 269 точек). */
    const gap = Math.abs(target - uCam);
    const tau = CAM_LAG_MS / (1 + gap / CAM_LAG_MAX);
    uCam += (target - uCam) * (1 - Math.exp(-dt / tau));
    /* Доводим вплотную, иначе кадры продолжают идти на неразличимой разнице. */
    if (Math.abs(target - uCam) < 1e-5) uCam = target;
  }
  const u = uCam;
  /* Пока отставание не съедено, следующий кадр нужен и без новой прокрутки —
     иначе камера замрёт, не доехав. Назад работает ровно так же: догон
     симметричен, знака не различает. */
  if (uCam !== target && !camQueued) {
    camQueued = true;
    requestAnimationFrame(camTick);
  }

  /* ⚠️ ДВЕ РАЗНЫЕ ДОЛИ. Камера сначала ДОЕЗЖАЕТ до станции (tp), и только
     потом доприближается (tz). Если делать то и другое разом, блок всю дорогу
     виден сбоку и обрезан краем, а вырастает едва-едва. Разведённые, они дают
     то, что просит задание: блок встаёт по центру мелким и растёт
     приближением камеры. */
  const { i, j, tr, tp, tz, dw } = legAt(u);
  const a = STATIONS[i];
  const b = STATIONS[j];
  const pa = a.at();
  const pb = b.at();

  const mixP = (x, y) => x + (y - x) * tp;
  const px = mixP(pa.x, pb.x) * coreR;
  const py = mixP(pa.y, pb.y) * coreR;
  const z = zoomAt(a.zoom + (b.zoom - a.zoom) * tz, fit);

  /* Довод по вертикали. У станции 0 он нулевой — камера стоит там же, где
     фигура стоит на первом экране, и переход в полёт не заметен. У остальных
     станций блок встаёт по середине экрана, а не по точке ядра. */
  const originY = coreCy * vh;
  const aim = mixP(i === 0 ? 0 : 1, j === 0 ? 0 : 1);
  /* Блок встаёт по середине экрана. */
  const lift = aim * (vh / 2 - originY);

  /* Проход по высокому блоку: на площадке камера медленно идёт от его верха к
     низу. Блок, который помещается в экран, стоит неподвижно. */
  const over = (k, d) => (stationOver[k] ? (stationOver[k] / 2) * (1 - 2 * d) : 0);
  const pan = tp === 0 ? over(i, dw) : over(i, 1) + (over(j, 0) - over(i, 1)) * tp;

  const camX = -z * px;
  const camY = -z * py + lift + pan;

  root.style.setProperty('--cam-x', `${camX.toFixed(2)}px`);
  root.style.setProperty('--cam-y', `${camY.toFixed(2)}px`);
  root.style.setProperty('--cam-z', z.toFixed(4));

  /* Цвет перетекает тем же сглаживанием, что и движение. */
  const ca = stationStops[i];
  const cb = stationStops[j];
  const ch = (k) => Math.round(ca[k] + (cb[k] - ca[k]) * tz);
  root.style.setProperty('--journey-rgb', `${ch(0)}, ${ch(1)}, ${ch(2)}`);
  const near = tz < 0.5 ? i : j;
  if (near !== activeIndex.value) activeIndex.value = near;

  /* Видимость станций. На экране только два блока — тот, с которого улетаем,
     и тот, к которому летим. Остальные не рисуются вовсе: масштабировать
     текст, которого в кадре нет, незачем, и это главная экономия кадра.

     ⚠️ Прозрачность тут — именно «помощь на самом краю кадра» из задания, а
     не способ показать текст. Блок, мимо которого камера уже прошла,
     раздувается во весь экран и лезет обрывками букв по краям — его надо
     убрать рано. Блок, к которому летим, наоборот открывается сразу и растёт
     ПРИБЛИЖЕНИЕМ: к трети перегона он уже виден целиком, дальше работает
     только камера. */
  for (let k = 1; k < stationEls.length; k += 1) {
    const el = stationEls[k];
    if (!el) continue;
    let o = 0;
    if (k === i && k === j) o = 1;                                  // стоим
    else if (k === i) o = clamp01(1 - (tr - 0.05) / 0.3);           // улетаем
    else if (k === j) o = clamp01((tr - 0.25) / 0.25);              // подлетаем
    if (o <= 0.001) {
      if (el.style.visibility !== 'hidden') el.style.visibility = 'hidden';
      continue;
    }
    if (el.style.visibility) el.style.visibility = '';
    el.style.setProperty('--st-o', o.toFixed(3));
  }
}

function onCamScroll() {
  if (camQueued || (reduceMotion && reduceMotion.matches)) return;
  camQueued = true;
  requestAnimationFrame(camTick);
}

function onCamResize() {
  layout();
  /* Перестроение — не движение: догон тут не нужен, камера встаёт сразу. */
  camPrimed = false;
  onCamScroll();
}

// PLAY → into the game. Anonymous visitors enter via signup (authed users are
// redirected to /play by the route's beforeEnter, so they never see this CTA).
function onPlay() {
  router.push('/auth/signup');
}

/* Ссылки меню. Разделы теперь живут внутри сцены, и прыгать к их элементу
   нельзя — у элемента в мире нет осмысленного места на странице. Ссылка ведёт
   к положению прокрутки, на котором камера стоит на нужной станции. */
function stationScrollTop(k) {
  const flight = flightRef.value;
  if (!flight) return 0;
  const top = flight.getBoundingClientRect().top + window.scrollY;
  const travel = Math.max(1, flight.offsetHeight - window.innerHeight);
  return top + stationU(k) * travel;
}

// Delegated in-page anchor scrolling. Unknown/placeholder hashes (#play,
// #discord, #x, social links) are swallowed so the page never jumps to top.
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
  const k = STATIONS.findIndex((s) => s.block === id);
  if (k > 0 && !(reduceMotion && reduceMotion.matches)) {
    window.scrollTo({ top: stationScrollTop(k), behavior: 'smooth' });
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

  /* Станция 0 — общий план, своего блока у неё нет, поэтому в списке
     элементов её место занимает пустышка: так номер станции и номер элемента
     совпадают и нигде не приходится вычитать единицу. */
  const world = worldRef.value;
  stationEls = [null].concat(
    world ? Array.from(world.querySelectorAll('.lp-station')) : [],
  );
  stationStops = STATIONS.map((_, k) => accentRgb(coreAt(k)));

  layout();
  window.addEventListener('scroll', onCamScroll, { passive: true });
  window.addEventListener('resize', onCamResize);
  camTick();
  /* Ещё раз через кадр: размер фигуры зависит от ширины окна, и на первом
     проходе раскладка может быть ещё не устоявшейся. */
  requestAnimationFrame(() => { layout(); camTick(); });

  // in-page anchor smooth-scroll (delegated)
  rootRef.value.addEventListener('click', onAnchorClick);

  /* Проявление [data-reveal]. Внутри сцены оно больше не нужно — там текст
     выводит камера, — поэтому блоки мира открываются сразу, а наблюдатель
     остаётся только на обычной части страницы. */
  if (world) {
    world.querySelectorAll('[data-reveal]').forEach((el) => el.setAttribute('data-inview', '1'));
  }
  const els = Array.from(rootRef.value.querySelectorAll('[data-reveal]:not([data-inview])'));
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
  window.removeEventListener('scroll', onCamScroll);
  window.removeEventListener('resize', onCamResize);
  stationEls = [];
  stationStops = [];
  if (rootRef.value) rootRef.value.removeEventListener('click', onAnchorClick);
});
</script>
