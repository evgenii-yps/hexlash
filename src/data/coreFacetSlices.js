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

const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const len = (a) => Math.hypot(a[0], a[1]);

/**
 * Пятнадцать граней ядра отдельными фигурами.
 *
 * @param {'full'|'muted'|'quiet'} mode режим яркости (нужен только чтобы взять
 *        ту же фигуру, что рисует HexCore — числа граней от режима не зависят)
 * @returns {{ box:number, c:number, r:number, branches:Array }}
 *   branches[k] = { id, facets: [{ id, key, branchId, index, points, cx, cy, deg }] }
 *   points — контур грани строкой для <polygon>;
 *   cx, cy — середина грани в том же холсте (по ней грань выносится вперёд);
 *   deg    — наклон ветки в градусах: по нему световое пятно грани вытягивается
 *            ПОПЕРЁК клина, а вдоль сходит в ноль до среза соседней грани.
 *            Без этого пятно круглое: поперёк не достаёт до стенок, вдоль
 *            перетекает в соседнюю — и шаги перестают читаться.
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

    const facets = [];
    for (let i = 0; i < FACETS; i++) {
      /* stops приходят в точках — в доли радиуса переводим делением на R. */
      const t0 = b.stops[i] / R;
      const t1 = b.stops[i + 1] / R;
      const q = [edge(t0, +1), edge(t1, +1), edge(t1, -1), edge(t0, -1)];
      const cx = q.reduce((s, x) => s + x[0], 0) / 4;
      const cy = q.reduce((s, x) => s + x[1], 0) / 4;
      facets.push({
        id: i + 1,
        branchId: b.id,
        index: bi * FACETS + i,
        key: `${b.id}${i + 1}`,
        points: q.map((x) => `${x[0].toFixed(1)},${x[1].toFixed(1)}`).join(' '),
        cx: +cx.toFixed(2),
        cy: +cy.toFixed(2),
        deg,
      });
    }
    return { id: b.id, facets };
  });

  return { box: fig.box, c: C, r: R, branches };
}

/** Все пятнадцать граней одним списком, в порядке веток. */
export function allFacets(mode = 'full') {
  return coreFacetSlices(mode).branches.flatMap((b) => b.facets);
}
