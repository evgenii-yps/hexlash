/* HEXLASH — ГЕОМЕТРИЯ ЯДРА. Чистая математика фигуры, без Vue и без стилей.

   ⚠️ ЭТО ЕДИНСТВЕННЫЙ ИСТОЧНИК КООРДИНАТ ЯДРА. Его читают ДВОЕ:
     1. src/components/core/HexCore.vue — фигура в приложении (лендинг, вход,
        служебная страница /dev/core);
     2. scripts/sync-core-figure.mjs — рисует ту же фигуру в деку
        (public/deckinvestors/index.html), которая живёт статической страницей
        вне сборки и компонент подключить не может.

   Второй копии координат в проекте быть не должно. Именно копия координат
   когда-то развела знак в игре и иконку вкладки: месяцами в проде висели два
   разных логотипа, и никто их специально не правил. Если деку нужно обновить —
   `node scripts/sync-core-figure.mjs`, а не правка разметки руками.

   Каркас один на все варианты оформления: шестиугольник вершиной вверх, из
   центра к трём вершинам (вверх, вправо-вниз, влево-вниз) три ветки, на каждой
   пять граней. Всё, что варианты меняют, лежит в src/data/coreStyles.js. */

import { coreStyleCfg } from './coreStyles.js';

export const BOX = 200;   // бокс рисунка
export const C = 100;     // центр
export const R = 86;      // внешний радиус фигуры

const RAY_DEG = { a: -90, b: 30, c: 150 };   // вверх · вправо-вниз · влево-вниз
const HEX_DEG = [-90, -30, 30, 90, 150, 210];
/* Знаки манеры нарисованы для бокса 200×200 с внешним гексом r=78. */
export const SIGIL_SRC_R = 78;

const rad = (d) => (d * Math.PI) / 180;
const px = (v) => Math.round(v * 100) / 100;
const pt = (deg, r, cx = C, cy = C) => [cx + Math.cos(rad(deg)) * r, cy + Math.sin(rad(deg)) * r];
const poly = (pts) => pts.map((p) => `${px(p[0])},${px(p[1])}`).join(' ');
const hex = (r, cx = C, cy = C) => poly(HEX_DEG.map((d) => pt(d, r, cx, cy)));

/* Неровность огранки — стабильная, а не случайная: один и тот же кристалл
   обязан выглядеть одинаково между перерисовками и одинаково в приложении и
   на деке. */
function wobble(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;   // −1..1
}

/* Кратчайшая разница углов, в градусах, в (−180, 180]. */
function angDelta(a, b) {
  return ((b - a + 540) % 360) - 180;
}

/* Зона = кит между двумя соседними лучами: центр → вершина → промежуточная
   вершина шестиугольника → вершина. */
const ZONE_DEF = [
  { id: 'ab', from: 'a', to: 'b', mid: -30, shade: 'mid',  cdeg: -30 },  // верх-право
  { id: 'bc', from: 'b', to: 'c', mid: 90,  shade: 'low',  cdeg: 90 },   // низ
  { id: 'ca', from: 'c', to: 'a', mid: 210, shade: 'high', cdeg: 210 },  // верх-лево
];

export const BRANCH_IDS = ['a', 'b', 'c'];

/* Ступени яркости центра по числу ЗАДЕЙСТВОВАННЫХ веток (0/1/2/3). */
export const LUM = [0.1, 0.36, 0.64, 1];

/** Сколько граней горит в ветке, с защитой от мусора. */
function litOf(branches) {
  const g = (k) => Math.max(0, Math.min(5, Number(branches?.[k]) || 0));
  return { a: g('a'), b: g('b'), c: g('c') };
}

/**
 * Вся геометрия фигуры одним вызовом.
 * @param {Object} o
 * @param {string} o.styleId   вариант оформления (src/data/coreStyles.js)
 * @param {Object} o.branches  { a, b, c } — сколько граней горит в каждой ветке
 * @param {boolean} o.simple   упрощённая отрисовка (бокс меньше 48 точек)
 * @returns {Object} готовые строки точек и числа — рисовать и всё
 */
export function coreFigure({ styleId = 'origin', branches = {}, simple = false } = {}) {
  const k = coreStyleCfg(styleId);
  const lit = litOf(branches);
  const engaged = BRANCH_IDS.filter((b) => lit[b] > 0).length;

  const shapes = BRANCH_IDS.map((id, bi) => {
    const deg = RAY_DEG[id];
    const dx = Math.cos(rad(deg));
    const dy = Math.sin(rad(deg));
    const nx = -dy;   // перпендикуляр
    const ny = dx;
    const n = lit[id];

    const tipR = R * k.tipFrac;
    const at = (t, w) => [C + dx * t + nx * w, C + dy * t + ny * w];

    /* Тело ветки: сужающийся кристалл (полуширина от chanW0 к chanW1). */
    const shard = poly([
      at(0, k.chanW0), at(tipR, k.chanW1), at(tipR, -k.chanW1), at(0, -k.chanW0),
    ]);
    /* Жила внутри кристалла — уже тела, той же формы. */
    const vw0 = Math.min(k.chanW0, k.flowW * 0.5 + 1.5);
    const vw1 = Math.min(k.chanW1, k.flowW * 0.28 + 0.6);
    const vein = poly([
      at(0, vw0), at(tipR, vw1), at(tipR, -vw1), at(0, -vw0),
    ]);

    const wallOff = k.chanW0;
    const wall = (sign) => ({
      x1: px(C + dx * 15 + nx * wallOff * sign),
      y1: px(C + dy * 15 + ny * wallOff * sign),
      x2: px(C + dx * R * 0.9 + nx * wallOff * sign),
      y2: px(C + dy * R * 0.9 + ny * wallOff * sign),
    });
    /* Освещена та стенка, что смотрит вверх-влево: свет в зале один и сверху. */
    const up = ny < 0 || (ny === 0 && nx < 0);

    const nodes = k.nodeT.map((t, i) => {
      const isTip = i === k.nodeT.length - 1;
      const r = isTip && simple ? k.tipRsimple : k.nodeR[i];
      const cx = C + dx * t * R;
      const cy = C + dy * t * R;
      const along = r * k.nodeLong;
      const across = r * 0.88;
      /* Четыре угла ромба; при nodeRough > 0 каждый угол чуть сбит — огранка
         перестаёт быть правильной, кристалл выглядит выращенным. */
      const w = (corner, amp) => 1 + wobble(bi * 17 + i * 5 + corner) * k.nodeRough * amp;
      const gem = (kx) => poly([
        [cx + dx * along * kx * w(0, 0.5), cy + dy * along * kx * w(0, 0.5)],
        [cx + nx * across * kx * w(1, 0.8), cy + ny * across * kx * w(1, 0.8)],
        [cx - dx * along * kx * w(2, 0.3), cy - dy * along * kx * w(2, 0.3)],
        [cx - nx * across * kx * w(3, 0.8), cy - ny * across * kx * w(3, 0.8)],
      ]);
      return { i: i + 1, lit: i < n, points: gem(1), inner: gem(0.46) };
    });

    return {
      id,
      lit: n,
      /* Свет доходит до последней горящей грани и обнимает её. */
      litR: n > 0 ? px(R * k.nodeT[n - 1] + k.nodeR[n - 1] * 0.9) : 0,
      tipX: px(C + dx * tipR), tipY: px(C + dy * tipR),
      shard, vein,
      hi: wall(up ? 1 : -1),
      lo: wall(up ? -1 : 1),
      nodes,
    };
  });

  const zones = ZONE_DEF.map((z) => {
    const [cxp, cyp] = pt(z.cdeg, R * 0.32);
    const aFrom = RAY_DEG[z.from];
    const aTo = RAY_DEG[z.to];
    const corners = [[C, C], pt(aFrom, R), pt(z.mid, R), pt(aTo, R)];

    /* Пластина (вариант «без рамки»). Внешний край ОСТАЁТСЯ на R — силуэт
       складывают сами пластины. Щели открываются вдоль лучей и у ступицы. */
    const inset = k.plateInset;
    const da = inset > 0 ? (Math.atan2(inset, R) * 180) / Math.PI : 0;
    const pFrom = pt(aFrom + Math.sign(angDelta(aFrom, z.mid)) * da, R);
    const pTo = pt(aTo + Math.sign(angDelta(aTo, z.mid)) * da, R);
    const plate = poly([pt(z.mid, inset * 1.9), pFrom, pt(z.mid, R), pTo]);

    return {
      id: z.id,
      shade: z.shade,
      strength: Math.min(lit[z.from], lit[z.to]),
      points: poly(corners),
      plate,
      /* Наклон пластины: блик идёт поперёк, от одного луча к другому. */
      tx1: px(pFrom[0]), ty1: px(pFrom[1]), tx2: px(pTo[0]), ty2: px(pTo[1]),
      cx: px(cxp), cy: px(cyp), r: px(R * 0.82),
    };
  });

  /* Огранка сердцевины. Мелкому камню хватает трёх рёбер к вершинам; крупному
     нужна площадка — иначе три ребра продолжают ветки и камень читается
     кубиком внутри внешнего шестиугольника. */
  const hr = k.heartR;
  const cuts = k.heartFacets === 'table'
    ? HEX_DEG.map((d) => {
      const [x1, y1] = pt(d, hr * 0.52);
      const [x2, y2] = pt(d, hr);
      return [px(x1), px(y1), px(x2), px(y2)];
    })
    : [-90, 30, 150].map((d) => {
      const [x, y] = pt(d, hr);
      return [px(x), px(y), C, C];
    });

  const sigilScale = px(hr / SIGIL_SRC_R);

  return {
    box: BOX, c: C, r: R,
    cfg: k,
    lit, engaged,
    lum: LUM[engaged],
    branches: shapes,
    zones,
    heart: {
      outer: hex(hr),
      seed: k.heartSeed > 0 ? hex(k.heartSeed) : null,
      table: k.heartFacets === 'table' ? hex(hr * 0.52) : null,
      cuts,
      glowR: k.heartGlow,
    },
    rim: hex(R),
    /* Знак манеры вписывается в сердце: рисунок задан для гекса r=78. */
    sigilTransform: `translate(${px(C - C * sigilScale)} ${px(C - C * sigilScale)}) scale(${sigilScale})`,
  };
}

/* Ступени блика по пластинам: свет в зале один и сверху, поэтому верхняя
   левая пластина ловит его сильнее, нижняя почти не ловит. Внутренний ramp
   рисунка, палитру не расширяет. */
export const TILT = {
  high: [0.14, 0.07, 0.025],
  mid: [0.03, 0.085, 0.05],
  low: [0.02, 0.045, 0.012],
};
