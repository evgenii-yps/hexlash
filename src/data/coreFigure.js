/* HEXLASH — ЯДРО «ПЕЧАТЬ» И РАСКЛАДКА «ВИХРЬ» (22.09.2026).

   ⚠️ ЕДИНСТВЕННЫЙ ИСТОЧНИК РИСУНКА ЯДРА В ПРОЕКТЕ. Отсюда его берут:
     • приложение — src/components/core/HexCore.vue (фон лендинга и входа);
     • дека — scripts/sync-core-figure.mjs пишет разметку в статическую
       страницу public/deckinvestors/index.html.
   Второй отрисовки быть не должно. Самостоятельная отрисовка по переписанным
   координатам когда-то развела знак в игре с иконкой вкладки — в проде
   месяцами висели два разных логотипа.

   Эталон: docs/design-handoff/core_seal/references/design-source/
     Core.dc.html   — фигура (вариант «C · Печать»);
     Vortex.dc.html — кольца вокруг неё.
   Числа ниже перенесены оттуда один в один. Расходится — прав эталон.

   ⚠️ БЕЗ РАЗМЫТИЯ. Свечение контура собрано из двух обводок — широкой
   полупрозрачной и чёткой. Фильтр размытия давал бы то же самое, но браузер
   пересчитывал бы его на каждом кадре мерцания; на медленном телефоне это
   уже стоило кадров (21.09 ловили 22.3 мс при норме 16.7).

   ⚠️ БЕЛОГО В ФИГУРЕ НЕТ. Светлое — это цвет раздела; тёмное — серо-лиловый.

   Фигура: шестиугольник вершиной вверх, три ветки-клина к вершинам 0, 2, 4
   (вверх, вправо-вниз, влево-вниз), крупное сердце в середине. */

/** Сторона квадратного холста фигуры. */
export const BOX = 600;
/** Середина холста. */
export const C = BOX / 2;
/** Радиус контура: от середины до вершины шестиугольника. */
export const R = 225;

/* Режимы яркости. Один набор прозрачностей на всю фигуру.
     full  — цветные разделы (ONSLAUGHT, RAIDER, BULWARK, AMBUSH);
     muted — дека, все разделы;
     quiet — розовые разделы лендинга и экран входа. */
export const MODES = {
  full:  { contour: 0.95, branch: 0.55, zone: 0.30, glow: 0.26, heart: 0.95, facet: 0.90 },
  muted: { contour: 0.55, branch: 0.26, zone: 0.12, glow: 0.14, heart: 0.80, facet: 0.50 },
  quiet: { contour: 0.18, branch: 0.09, zone: 0,    glow: 0.08, heart: 1,    facet: 0 },
};
export const MODE_IDS = ['full', 'muted', 'quiet'];

/* Вариант «C · Печать». Полуширина ветки у центра / в середине / на конце —
   в долях R; сердце — тоже в долях R. cw и gw — толщина чёткой и широкой
   линий контура. */
const VAR = {
  w0: 0.115, w1: 0.085, w2: 0.058,
  t0: 0.04,  t1: 0.52,  t2: 0.875,
  heart: 0.245,
  cw: 4.0, gw: 13,
  innerR: 0.93,
};

/* ---- грани ---------------------------------------------------------------
   Каждая ветка поделена по длине на пять граней — как в игре (3 ветки × 5).
   Грань это часть самого клина, а не значок внутри: ромбиков и узоров внутри
   веток нет. Считаются грани ОТ КРАЯ СЕРДЦА к вершине — то, что ближе к
   середине, закрыто самим сердцем и гранью быть не может.

   ⚠️ Разрез между гранями рисуется цветом #0d0b11 — это дальний край
   градиента пластины, то есть «сквозь разрез видно пластину». Новый цвет ради
   разреза не заводится. */
export const FACETS = 5;
/* Разрез между гранями, в долях радиуса контура. 0.012 → 2.7 единицы холста,
   на телефоне 390 это ~0.9 точки.
   ⚠️ Подобрано глазами: на 0.02 и линии 4.5 ветка рассыпалась на цепочку
   отдельных плиток и переставала читаться цельным клином. */
const FACET_GAP = 0.012;
export const CUT_COLOR = '#0d0b11';
export const CUT_WIDTH = 2.6;

/* Мерцание контура. Мерцает ТОЛЬКО группа каждой из шести сторон (широкая и
   чёткая линии вместе), анимируется одна прозрачность. Остальная фигура и
   кольца неподвижны. */
export const FLICK_NAME = 'hxCoreFlick';
export const FLICK_DUR = [4.2, 5.1, 3.7, 6.3, 4.8, 5.6];
export const FLICK_DEL = [0, 1.3, 2.1, 0.6, 3.4, 1.9];

/* ⚠️ САМИ СТОП-КАДРЫ МЕРЦАНИЯ ЛЕЖАТ В src/styles/core-flicker.css — одним
   файлом на приложение и деку. Приложение подключает его сборкой, деку
   заполняет scripts/sync-core-figure.mjs, переписывая оттуда же. Второй копии
   стоп-кадров в проекте нет. Имя анимации — FLICK_NAME выше. */

/* ---- геометрия ---------------------------------------------------------- */

const rad = (deg) => (deg * Math.PI) / 180;

/** Вершина i шестиугольника радиуса r (0 — вверх), с поворотом rot градусов. */
function corner(r, i, rot = 0) {
  const a = rad(-90 + 60 * i + rot);
  return [C + r * Math.cos(a), C + r * Math.sin(a)];
}

/** Шесть вершин как строка points. */
function hexPoints(r, rot = 0) {
  return fmt([0, 1, 2, 3, 4, 5].map((i) => corner(r, i, rot)));
}

function fmt(pts) {
  return pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
}

/**
 * Разложенная фигура ядра для отрисовки.
 * @param {'full'|'muted'|'quiet'} mode режим яркости
 */
export function coreFigure(mode = 'full') {
  const m = MODES[mode] || MODES.full;
  const verts = [0, 1, 2, 3, 4, 5].map((i) => corner(R, i));

  /* Зоны между ветками: середина плюс три соседние вершины. */
  const zones = [[0, 1, 2], [2, 3, 4], [4, 5, 0]].map((t, k) => ({
    id: ['a', 'b', 'c'][k],
    points: fmt([[C, C], verts[t[0]], verts[t[1]], verts[t[2]]]),
  }));

  /* Три ветки-клина: сужаются от середины к вершине, без шипов и кристаллов. */
  const branches = [0, 2, 4].map((vi, k) => {
    const [tx, ty] = verts[vi];
    const dx = (tx - C) / R;
    const dy = (ty - C) / R;
    const px = -dy;
    const py = dx;
    const at = (t, w) => [
      [C + dx * R * t + px * R * w, C + dy * R * t + py * R * w],
      [C + dx * R * t - px * R * w, C + dy * R * t - py * R * w],
    ];
    const a0 = at(VAR.t0, VAR.w0);
    const a1 = at(VAR.t1, VAR.w1);
    const a2 = at(VAR.t2, VAR.w2);

    /* Полуширина клина в точке t: ломаная через три опорные точки эталона. */
    const halfAt = (t) => (t <= VAR.t1
      ? VAR.w0 + (VAR.w1 - VAR.w0) * (t - VAR.t0) / (VAR.t1 - VAR.t0)
      : VAR.w1 + (VAR.w2 - VAR.w1) * (t - VAR.t1) / (VAR.t2 - VAR.t1));

    /* Пять граней от края сердца до вершины. */
    const span = (VAR.t2 - VAR.heart) / FACETS;
    const facets = [];
    const cuts = [];
    for (let i = 0; i < FACETS; i++) {
      const ta = VAR.heart + span * i + FACET_GAP / 2;
      const tb = VAR.heart + span * (i + 1) - FACET_GAP / 2;
      const pa = at(ta, halfAt(ta));
      const pb = at(tb, halfAt(tb));
      facets.push({
        i,
        points: fmt([pa[0], pb[0], pb[1], pa[1]]),
        /* Радиусы начала и конца грани — по ним растёт круг-заполнитель. */
        r0: +(ta * R).toFixed(2),
        r1: +(tb * R).toFixed(2),
      });
      /* Разрез рисуется после каждой грани, кроме последней. */
      if (i < FACETS - 1) {
        const tc = VAR.heart + span * (i + 1);
        const pc = at(tc, halfAt(tc) * 1.04);
        cuts.push({
          x1: pc[0][0].toFixed(1), y1: pc[0][1].toFixed(1),
          x2: pc[1][0].toFixed(1), y2: pc[1][1].toFixed(1),
        });
      }
    }

    return {
      id: ['a', 'b', 'c'][k],
      points: fmt([a0[0], a1[0], a2[0], a2[1], a1[1], a0[1]]),
      facets,
      cuts,
      /* Откуда стартует заполнение: край сердца. */
      flowStart: +(VAR.heart * R).toFixed(2),
      /* Докуда доходит, если загорится n граней. */
      flowEnd: (n) => +((VAR.heart + span * n) * R).toFixed(2),
    };
  });

  /* Контур — шесть сторон по отдельности: каждая мерцает своим ритмом. */
  const sides = [0, 1, 2, 3, 4, 5].map((i) => {
    const a = verts[i];
    const b = verts[(i + 1) % 6];
    return {
      x1: a[0].toFixed(1), y1: a[1].toFixed(1),
      x2: b[0].toFixed(1), y2: b[1].toFixed(1),
      dur: FLICK_DUR[i], del: FLICK_DEL[i],
    };
  });

  const hr = R * VAR.heart;

  return {
    box: BOX, c: C, r: R, mode, m,
    /* Ореол вокруг всей фигуры. */
    haloR: (R * 1.18).toFixed(1),
    plate: fmt(verts),
    zones,
    branches,
    sides,
    /* Внутренний контур. Не мерцает. */
    inner: hexPoints(R * VAR.innerR),
    heart: {
      glowR: (hr * 1.9).toFixed(1),
      frame: hexPoints(hr),
      ring: hexPoints(hr * 0.84),
      gem: hexPoints(hr * 0.52),
      frameW: (VAR.cw * 1.15).toFixed(2),
    },
    cw: VAR.cw,
    gw: VAR.gw,
  };
}

/* ---- раскладка «Вихрь» -------------------------------------------------- */

/* Кольца вокруг ядра. Каждое следующее больше в 1.34 раза, повёрнуто ещё на
   5° и тусклее в 0.76 раза — кольца закручиваются вокруг фигуры.
   ⚠️ Первое кольцо стоит на 1.5 coreR, то есть ВДВОЕ дальше контура ядра
   (контур = 0.75 coreR). Прежнее правило «контур ядра = первое кольцо»
   отменено 22.09.2026. */
export const VORTEX = {
  /* coreR — половина стороны квадрата, в который вписано ядро.
     Радиус контура = CONTOUR × coreR. */
  CONTOUR: 0.75,
  first: 1.5,
  scale: 1.34,
  step: 5,
  falloff: 0.76,
  base: { full: 0.28, muted: 0.18, quiet: 0.12 },
  /* Сторона коробки колец в долях coreR. Крайнее из семи колец —
     1.5 × 1.34⁶ ≈ 8.7 coreR, помещается с запасом. */
  span: 20,
  count: { phone: 6, desktop: 7 },
};

/**
 * Кольца «Вихря» в единицах coreR, середина в точке (0, 0).
 * Рисуются от внешнего к внутреннему — как в эталоне.
 * @param {number} count сколько колец
 * @param {'full'|'muted'|'quiet'} mode режим яркости
 */
export function vortexRings(count = VORTEX.count.desktop, mode = 'full') {
  const base = VORTEX.base[mode] ?? VORTEX.base.full;
  const out = [];
  for (let k = count - 1; k >= 0; k--) {
    const r = VORTEX.first * Math.pow(VORTEX.scale, k);
    const rot = VORTEX.step * (k + 1);
    const points = [0, 1, 2, 3, 4, 5].map((i) => {
      const a = rad(-90 + 60 * i + rot);
      return `${(r * Math.cos(a)).toFixed(4)},${(r * Math.sin(a)).toFixed(4)}`;
    }).join(' ');
    out.push({ k, points, opacity: +(base * Math.pow(VORTEX.falloff, k)).toFixed(4) });
  }
  return out;
}
