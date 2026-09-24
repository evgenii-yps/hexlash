/* HEXLASH — ТРИ ГРАНИ ЯДРА И ПЯТНАДЦАТЬ КРИСТАЛЛОВ В НИХ
   (ТЗ 24.09.2026, правка пятая — исправление словаря).

   ⚠️ СЛОВАРЬ. В правках 1–4 он был перевёрнут, и это правится здесь:
     ГРАНЬ    — весь луч целиком, длинный сужающийся клин от сердца до кромки
                шестиугольника. Их ТРИ.
     КРИСТАЛЛ — один из пяти шагов ВНУТРИ грани. Их ПЯТНАДЦАТЬ.
   Прежнее «ветка» = грань, прежнее «грань» = кристалл. Ни одного старого
   значения в этом файле не осталось.

   ⚠️ СВОЕЙ ГЕОМЕТРИИ ЗДЕСЬ НЕТ НИ ОДНОЙ. Всё выведено из coreFigure() —
   единственного источника рисунка ядра. Второй отрисовки быть не должно:
   именно она когда-то развела знак в игре с иконкой вкладки.

   ⚠️ САМА ФИГУРА «ПЕЧАТЬ» НЕ ТРОНУТА. Смена словаря не потребовала менять
   ни одного числа в coreFigure.js: клин там уже был цельным, а пять шагов
   уже приходили радиусами остановок. Изменились только имена и то, что из
   этого собирается. Фигура общая с лендингом, декой и входом. */

import { coreFigure, FACETS as STEPS } from './coreFigure.js';

const fmtPts = (pts) => pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
const parsePts = (s) => s.trim().split(/\s+/).map((p) => p.split(',').map(Number));
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

/** Середина многоугольника — простое среднее вершин. */
function centre(q) {
  return [
    q.reduce((s, p) => s + p[0], 0) / q.length,
    q.reduce((s, p) => s + p[1], 0) / q.length,
  ];
}

/**
 * Огранка многоугольника: тело, поджатая плоскость и фаска между ними
 * отдельными плоскостями. Один приём на оба уровня — грань и кристалл
 * огранены одинаково, отличаются только размером.
 *
 * @returns {{ points, inner, bevels, cx, cy }} bevels[i] — плоскость фаски
 *          вдоль i-го ребра, в том же порядке, что вершины.
 */
export function bevelPoly(q, k = 0.82) {
  const [cx, cy] = centre(q);
  const inner = q.map((p) => [cx + (p[0] - cx) * k, cy + (p[1] - cy) * k]);
  return {
    points: fmtPts(q),
    inner: fmtPts(inner),
    bevels: q.map((_, e) => fmtPts([
      q[e], q[(e + 1) % q.length], inner[(e + 1) % q.length], inner[e],
    ])),
    cx: +cx.toFixed(2),
    cy: +cy.toFixed(2),
  };
}

/* Насколько поджат кристалл внутри своего гнезда: остаток — стенка гнезда. */
const NEST_INSET = 0.66;
/* Зазор от кромки грани до подписи кристалла, в единицах холста. */
const LABEL_GAP = 10;

/**
 * Три грани ядра с кристаллами внутри.
 *
 * @param {'full'|'muted'|'quiet'} mode режим яркости (нужен только чтобы взять
 *        ту же фигуру, что рисует HexCore — числа от режима не зависят)
 * @returns {{
 *   box:number, c:number, r:number, plate:string,
 *   facets: Array<{
 *     id:string, deg:number, stops:number[], strip:string,
 *     points:string, inner:string, bevels:string[], cx:number, cy:number,
 *     crystals: Array<{
 *       id:number, key:string, facetId:string, index:number,
 *       points:string, inner:string, bevels:string[], cx:number, cy:number,
 *       near:number[], far:number[], labX:number, labY:number, labSize:number,
 *     }>,
 *   }>,
 * }}
 *   plate — контур шестиугольника: по нему ловится ведение пальцем;
 *   deg   — наклон грани в градусах (по нему она доворачивается при выносе);
 *   stops — шесть радиусов: край сердца и конец каждого из пяти шагов;
 *   strip — горящая часть грани одной фигурой: по ней идёт налив;
 *   near, far — середины ближнего к сердцу и дальнего срезов кристалла: по ним
 *           свет внутри него идёт тем же путём, что налив на ядре.
 */
export function coreFacets(mode = 'full') {
  const fig = coreFigure(mode);
  const C = fig.c;
  const R = fig.r;

  /* ⚠️ В общем coreFigure.js клинья до сих пор называются branches. Файл
     общий с лендингом, декой и входом — переименовывать его ради словаря
     макета нельзя, поэтому читаем как есть и даём правильное имя здесь. */
  const facets = fig.branches.map((b) => {
    const q = parsePts(b.points);

    /* Ось грани: середина дальнего среза клина лежит ровно на ней. */
    const far = mid(q[2], q[3]);
    const v = sub(far, [C, C]);
    const L = Math.hypot(v[0], v[1]);
    const ax = [v[0] / L, v[1] / L];      // вдоль грани, наружу
    const nx = [-ax[1], ax[0]];           // поперёк

    /* Три опорные точки эталона: доля радиуса и полуширина в долях R. */
    const ref = [0, 1, 2].map((i) => {
      const d = sub(q[i], [C, C]);
      return { t: dot(d, ax) / R, w: Math.abs(dot(d, nx)) / R };
    });
    const halfAt = (t) => (t <= ref[1].t
      ? ref[0].w + (ref[1].w - ref[0].w) * (t - ref[0].t) / (ref[1].t - ref[0].t)
      : ref[1].w + (ref[2].w - ref[1].w) * (t - ref[1].t) / (ref[2].t - ref[1].t));
    const edge = (t, side) => {
      const w = halfAt(t);
      return [
        C + ax[0] * R * t + side * nx[0] * R * w,
        C + ax[1] * R * t + side * nx[1] * R * w,
      ];
    };

    const deg = +(Math.atan2(ax[1], ax[0]) * 180 / Math.PI).toFixed(2);
    const facetShape = bevelPoly(q, 0.88);

    /* Пять гнёзд по длине грани, в каждом один кристалл. Гнёзда идут по тем
       же остановкам, по которым идёт налив: зажёг кристалл — залился ровно
       его шаг. */
    const crystals = [];
    for (let i = 0; i < STEPS; i++) {
      const t0 = b.stops[i] / R;
      const t1 = b.stops[i + 1] / R;
      const nest = [edge(t0, +1), edge(t1, +1), edge(t1, -1), edge(t0, -1)];
      const shape = bevelPoly(nest.map((p) => {
        const [ncx, ncy] = centre(nest);
        return [ncx + (p[0] - ncx) * NEST_INSET, ncy + (p[1] - ncy) * NEST_INSET];
      }), 0.7);

      /* Подпись стоит СБОКУ от своего гнезда, на его высоте: грань длинная и
         узкая, под гнездом места нет. */
      const tm = (t0 + t1) / 2;
      const off = (halfAt(tm) * R) + LABEL_GAP;
      crystals.push({
        id: i + 1,
        facetId: b.id,
        index: i,
        key: `${b.id}${i + 1}`,
        ...shape,
        near: mid(nest[0], nest[3]).map((x) => +x.toFixed(2)),
        far: mid(nest[1], nest[2]).map((x) => +x.toFixed(2)),
        labX: +(C + ax[0] * R * tm + nx[0] * off).toFixed(2),
        labY: +(C + ax[1] * R * tm + nx[1] * off).toFixed(2),
        labSize: +((b.stops[i + 1] - b.stops[i]) * 0.46).toFixed(2),
      });
    }

    return { id: b.id, deg, stops: b.stops.slice(), strip: b.strip, ...facetShape, crystals };
  });

  return { box: fig.box, c: C, r: R, plate: fig.plate, facets };
}
