/* HEXLASH — ПЯТНАДЦАТЬ ГРАНЕЙ ЯДРА «ПЕЧАТЬ», КАЖДАЯ ОТДЕЛЬНОЙ ФИГУРОЙ
   (ТЗ 24.09.2026, макет /dev/facets).

   ⚠️ СВОЕЙ ГЕОМЕТРИИ ЗДЕСЬ НЕТ НИ ОДНОЙ. Всё выведено из coreFigure() —
   единственного источника рисунка ядра. Второй отрисовки быть не должно:
   именно она когда-то развела знак в игре с иконкой вкладки.

   ЗАЧЕМ. На экране ветка — один цельный клин: делений в нём нет и быть не
   должно (правило 22.09.2026, остаётся в силе). Но чтобы по грани можно было
   ПОПАСТЬ пальцем и вынести её вперёд, каждая пятая часть клина нужна
   отдельной фигурой. Эти фигуры невидимы в покое — они только зона нажатия
   и заготовка для выноса. Перегородок они не рисуют.

   КАК ВЫВЕДЕНО. coreFigure().branches[i] отдаёт:
     points — контур клина шестью точками эталона: левый край на t0, t1, t2,
              затем правый край на t2, t1, t0 (доли R вдоль оси ветки);
     stops  — шесть радиусов в точках: край сердца и конец каждой из пяти
              частей.
   Отсюда восстанавливается ось ветки и её полуширина в трёх опорных точках,
   а полуширина на произвольном радиусе берётся той же ломаной, что в эталоне.
   Расходится с эталоном — прав эталон, правится coreFigure.js. */

import { coreFigure, FACETS } from './coreFigure.js';

/** "x,y x,y …" → [[x, y], …] */
function parsePts(s) {
  return s.trim().split(/\s+/).map((p) => p.split(',').map(Number));
}

const fmtPts = (pts) => pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const len = (a) => Math.hypot(a[0], a[1]);

/**
 * Пятнадцать граней ядра отдельными фигурами.
 *
 * @param {'full'|'muted'|'quiet'} mode режим яркости (нужен только чтобы взять
 *        ту же фигуру, что рисует HexCore — числа граней от режима не зависят)
 * @returns {{ box:number, c:number, r:number, branches:Array }}
 *   plate  — контур шестиугольника: по нему ловится нажатие (зона грани —
 *            не её плитка, а часть фигуры, ближайшая к середине грани);
 *   branches[k] = { id, strip, stops, facets: [...] }
 *   strip  — вся горящая часть клина одной фигурой (из coreFigure), по ней
 *            идёт налив: клин заполняется светом от сердца к концу, шагами;
 *   stops  — шесть радиусов, где налив коротко встаёт (край сердца и конец
 *            каждой из пяти частей);
 *   facets[i] = { id, key, branchId, index, points, inner, cx, cy, deg, near, far }
 *   points — контур грани строкой для <polygon>;
 *   cx, cy — середина грани в том же холсте (по ней грань выносится вперёд);
 *   inner  — тот же контур, поджатый внутрь: плоскость грани;
 *   bevels — четыре плоскости фаски между inner и points, В ПОРЯДКЕ:
 *            [0] бок, [1] дальний срез, [2] бок, [3] ближний к сердцу срез.
 *            Каждая — своя плоскость, со своим тоном: так осколок читается
 *            огранённым, как прочие предметы игры, а не пятном со свечением;
 *   deg    — наклон ветки в градусах;
 *   near, far — середины ближнего к сердцу и дальнего срезов грани. По ним
 *            свет внутри вынесенной грани идёт тем же путём, что налив на
 *            ядре: от сердца к концу;
 *   ax, nx — единичные оси грани: вдоль ветки (наружу) и поперёк;
 *   halfW, lenU — полуширина и длина грани в своих осях. По ним на грани
 *            раскладываются кристаллы (crystalSlots ниже).
 */
export function coreFacetSlices(mode = 'full') {
  const fig = coreFigure(mode);
  const C = fig.c;
  const R = fig.r;

  const branches = fig.branches.map((b, bi) => {
    const p = parsePts(b.points);
    /* Ось ветки: середина дальней стороны клина лежит ровно на ней. */
    const far = [(p[2][0] + p[3][0]) / 2, (p[2][1] + p[3][1]) / 2];
    const v = sub(far, [C, C]);
    const L = len(v);
    const ax = [v[0] / L, v[1] / L];       // вдоль ветки
    const nx = [-ax[1], ax[0]];            // поперёк

    /* Три опорные точки эталона: доля радиуса t и полуширина w (в долях R). */
    const ref = [0, 1, 2].map((i) => {
      const d = sub(p[i], [C, C]);
      return { t: dot(d, ax) / R, w: Math.abs(dot(d, nx)) / R };
    });

    /* Полуширина на доле радиуса t — та же ломаная, что в эталоне. */
    const halfAt = (t) => (t <= ref[1].t
      ? ref[0].w + (ref[1].w - ref[0].w) * (t - ref[0].t) / (ref[1].t - ref[0].t)
      : ref[1].w + (ref[2].w - ref[1].w) * (t - ref[1].t) / (ref[2].t - ref[1].t));

    /* Точка на краю клина: доля радиуса t, знак стороны side. */
    const edge = (t, side) => {
      const w = halfAt(t);
      return [
        C + ax[0] * R * t + side * nx[0] * R * w,
        C + ax[1] * R * t + side * nx[1] * R * w,
      ];
    };

    /* Наклон ветки в градусах — для разворота светового пятна. */
    const deg = +(Math.atan2(ax[1], ax[0]) * 180 / Math.PI).toFixed(2);

    /* Насколько поджат внутренний контур. Разница между ним и внешним и есть
       фаска: у вынесенной грани видно огранённое ребро, а не размытый край. */
    const BEVEL = 0.82;

    const facets = [];
    for (let i = 0; i < FACETS; i++) {
      /* stops приходят в точках — в доли радиуса переводим делением на R. */
      const t0 = b.stops[i] / R;
      const t1 = b.stops[i + 1] / R;
      const q = [edge(t0, +1), edge(t1, +1), edge(t1, -1), edge(t0, -1)];
      const cx = q.reduce((s, x) => s + x[0], 0) / 4;
      const cy = q.reduce((s, x) => s + x[1], 0) / 4;
      const inner = q.map((x) => [cx + (x[0] - cx) * BEVEL, cy + (x[1] - cy) * BEVEL]);
      const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      facets.push({
        id: i + 1,
        branchId: b.id,
        index: bi * FACETS + i,
        key: `${b.id}${i + 1}`,
        points: fmtPts(q),
        inner: fmtPts(inner),
        bevels: [0, 1, 2, 3].map((e) => fmtPts([
          q[e], q[(e + 1) % 4], inner[(e + 1) % 4], inner[e],
        ])),
        near: mid(q[0], q[3]).map((v) => +v.toFixed(2)),
        far: mid(q[1], q[2]).map((v) => +v.toFixed(2)),
        ax: [+ax[0].toFixed(5), +ax[1].toFixed(5)],
        nx: [+nx[0].toFixed(5), +nx[1].toFixed(5)],
        halfW: +(halfAt((t0 + t1) / 2) * R).toFixed(3),
        lenU: +((t1 - t0) * R).toFixed(3),
        cx: +cx.toFixed(2),
        cy: +cy.toFixed(2),
        deg,
      });
    }
    return { id: b.id, strip: b.strip, stops: b.stops.slice(), facets };
  });

  return { box: fig.box, c: C, r: R, plate: fig.plate, branches };
}

/** Все пятнадцать граней одним списком, в порядке веток. */
export function allFacets(mode = 'full') {
  return coreFacetSlices(mode).branches.flatMap((b) => b.facets);
}

/* ---- огранка ------------------------------------------------------------
   Четырёхугольник → тело, поджатая плоскость и четыре плоскости фаски между
   ними. Один приём на все уровни: осколок грани и кристалл на ней огранены
   одинаково, отличаются только размером. */

/** Порядок плоскостей: [0] бок, [1] дальний срез, [2] бок, [3] ближний срез. */
export function bevelQuad(q, k = 0.82) {
  const cx = q.reduce((s, p) => s + p[0], 0) / 4;
  const cy = q.reduce((s, p) => s + p[1], 0) / 4;
  const inner = q.map((p) => [cx + (p[0] - cx) * k, cy + (p[1] - cy) * k]);
  return {
    points: fmtPts(q),
    inner: fmtPts(inner),
    bevels: [0, 1, 2, 3].map((e) => fmtPts([
      q[e], q[(e + 1) % 4], inner[(e + 1) % 4], inner[e],
    ])),
    cx: +cx.toFixed(2),
    cy: +cy.toFixed(2),
  };
}

/**
 * Места кристаллов НА грани. Кристаллы лежат в ряд поперёк ветки, подписи —
 * под ними, ближе к сердцу. Всё в тех же единицах холста, что и сама грань:
 * когда грань выходит вперёд, кристаллы едут вместе с ней одним движением.
 *
 * @param {object} f грань из coreFacetSlices
 * @param {number} n сколько кристаллов на этой грани
 */
export function crystalSlots(f, n) {
  if (!n) return [];
  const [ax, ay] = f.ax;
  const [nxx, nxy] = f.nx;
  /* Ряд занимает ширину грани; кристалл — две трети своего места, остальное
     зазор. По длине грань делится надвое: предмет ближе к концу ветки,
     подпись — ближе к сердцу. */
  const stepV = (2 * f.halfW) / n;
  const halfV = stepV * 0.33;
  const halfU = f.lenU * 0.17;
  const outU = f.lenU * 0.18;    // предмет
  const labU = -f.lenU * 0.28;   // подпись

  const at = (u, v) => [
    f.cx + ax * u + nxx * v,
    f.cy + ay * u + nxy * v,
  ];

  const out = [];
  for (let i = 0; i < n; i++) {
    const v = (i - (n - 1) / 2) * stepV;
    const q = [
      at(outU + halfU, v - halfV),
      at(outU + halfU, v + halfV),
      at(outU - halfU, v + halfV),
      at(outU - halfU, v - halfV),
    ];
    const lab = at(labU, v);
    out.push({
      i,
      ...bevelQuad(q, 0.74),
      /* Свет внутри кристалла идёт тем же путём, что налив: от сердца наружу. */
      near: at(outU - halfU, v).map((x) => +x.toFixed(2)),
      far: at(outU + halfU, v).map((x) => +x.toFixed(2)),
      labX: +lab[0].toFixed(2),
      labY: +lab[1].toFixed(2),
      /* Кегль подписи в единицах холста: он едет вместе с гранью, поэтому
         задаётся в её масштабе, а не в точках экрана. */
      labSize: +(f.lenU * 0.125).toFixed(3),
      labStep: +(f.lenU * 0.145).toFixed(3),
    });
  }
  return out;
}
