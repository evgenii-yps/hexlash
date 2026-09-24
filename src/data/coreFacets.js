/* HEXLASH — ТРИ ГРАНИ ЯДРА И ПЯТНАДЦАТЬ КРИСТАЛЛОВ В НИХ
   (ТЗ 24.09.2026, правки пятая — словарь, шестая — сердце).

   СЛОВАРЬ:
     ГРАНЬ    — весь луч целиком, длинный сужающийся клин от КРОМКИ СЕРДЦА
                до кромки шестиугольника. Их ТРИ.
     КРИСТАЛЛ — один из пяти шагов внутри грани. Их ПЯТНАДЦАТЬ.

   ⚠️ СЕРДЦЕ НЕ ПРИНАДЛЕЖИТ НИ ОДНОЙ ГРАНИ (правка шестая). Оно общее для
   всех трёх, в выборе не участвует и не подсвечивается никогда. Поэтому
   грань здесь — не весь клин из coreFigure, а клин МИНУС сердце: его
   основание срезано ровно по двум кромкам сердца, без заступа и без щели.

   ⚠️ СВОЕЙ ГЕОМЕТРИИ ЗДЕСЬ НЕТ НИ ОДНОЙ. Всё выведено из coreFigure() —
   единственного источника рисунка ядра. Форма кристалла тоже: это сердце
   в уменьшении, его вершины взяты из heart.frame и сведены к нужному
   размеру. Ни одного шестиугольника «на глаз».

   ⚠️ САМА ФИГУРА «ПЕЧАТЬ» НЕ ТРОНУТА. Ни правка пятая, ни шестая не
   потребовали менять в coreFigure.js ни одного числа. Фигура общая с
   лендингом, декой и экраном входа. */

import { coreFigure, FACETS as STEPS } from './coreFigure.js';

const fmtPts = (pts) => pts.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ');
const parsePts = (s) => s.trim().split(/\s+/).map((p) => p.split(',').map(Number));
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const norm = (v) => { const L = Math.hypot(v[0], v[1]) || 1; return [v[0] / L, v[1] / L]; };

/** Середина многоугольника — простое среднее вершин. */
function centre(q) {
  return [
    q.reduce((s, p) => s + p[0], 0) / q.length,
    q.reduce((s, p) => s + p[1], 0) / q.length,
  ];
}

/** Лежит ли точка внутри многоугольника (луч вправо). */
export function inPoly(pt, q) {
  let inside = false;
  for (let i = 0, j = q.length - 1; i < q.length; j = i++) {
    const [xi, yi] = q[i]; const [xj, yj] = q[j];
    if ((yi > pt[1]) !== (yj > pt[1])
      && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Пересечение отрезков AB и CD, или null. */
function cross(A, B, C, D) {
  const r = sub(B, A); const s = sub(D, C);
  const den = r[0] * s[1] - r[1] * s[0];
  if (Math.abs(den) < 1e-9) return null;
  const q = sub(C, A);
  const t = (q[0] * s[1] - q[1] * s[0]) / den;
  const u = (q[0] * r[1] - q[1] * r[0]) / den;
  if (t < -1e-9 || t > 1 + 1e-9 || u < -1e-9 || u > 1 + 1e-9) return null;
  return { pt: [A[0] + r[0] * t, A[1] + r[1] * t], t };
}

/**
 * Вырезать выпуклую фигуру hole из многоугольника q.
 *
 * ⚠️ Нужно ровно для одного: отрезать сердце от клина. Клин входит в сердце
 * основанием и выходит наружу, то есть кромку сердца он пересекает ДВАЖДЫ —
 * на этом случай и держится. Общего булева вычитания здесь нет и не нужно:
 * лишний код на макете — лишнее место, где потом разойдётся.
 *
 * Внутренняя граница результата — сама кромка сердца, вершина в вершину:
 * ни заступа, ни зазора-щели остаться не может по построению.
 */
function cutOut(q, hole) {
  const marks = [];   // что обходим: вершины снаружи + точки пересечения
  for (let i = 0; i < q.length; i++) {
    const A = q[i]; const B = q[(i + 1) % q.length];
    if (!inPoly(A, hole)) marks.push({ kind: 'v', pt: A });
    let best = null;
    for (let k = 0; k < hole.length; k++) {
      const x = cross(A, B, hole[k], hole[(k + 1) % hole.length]);
      if (x && (!best || x.t < best.t)) best = { ...x, edge: k };
    }
    if (best) marks.push({ kind: 'x', pt: best.pt, edge: best.edge, out: !inPoly(B, hole) });
  }

  const xs = marks.filter((m) => m.kind === 'x');
  if (xs.length !== 2) return { points: q, cut: false };   // не наш случай — не трогаем

  /* Кусок кромки сердца между двумя пересечениями. Обходов два, берём
     короткий: длинный обогнул бы сердце с изнанки. */
  const from = xs.find((m) => !m.out);   // вошли внутрь сердца
  const to = xs.find((m) => m.out);      // вышли наружу
  const chainFrom = (j0, j1) => {
    const out = [];
    for (let k = 0; k < hole.length; k++) {
      const j = (j0 + k) % hole.length;
      if (j === j1) break;
      out.push(hole[(j + 1) % hole.length]);
    }
    return out;
  };
  const a = chainFrom(from.edge, to.edge);
  const b = chainFrom(to.edge, from.edge);
  const chain = a.length <= b.length ? a : b.slice().reverse();

  const ring = [];
  for (const m of marks) {
    if (m.kind === 'v') { ring.push(m.pt); continue; }
    ring.push(m.pt);
    if (m === from) ring.push(...chain);
  }
  return { points: ring, cut: true };
}

/**
 * Огранка многоугольника: тело, поджатая плоскость и фаска между ними
 * отдельными плоскостями. Один приём на оба уровня — грань и кристалл
 * огранены одинаково, отличаются только размером.
 *
 * @param {number[][]} q вершины
 * @param {number} k насколько поджата внутренняя плоскость
 * @param {number[]} axis направление наружу вдоль грани: по нему решается,
 *        какая фаска ловит свет со стороны сердца, а какая в тени
 * @returns {{ points, inner, bevels, faces, cx, cy }}
 */
export function bevelPoly(q, k = 0.82, axis = [0, -1]) {
  const [cx, cy] = centre(q);
  const inner = q.map((p) => [cx + (p[0] - cx) * k, cy + (p[1] - cy) * k]);

  /* ⚠️ Наклон фаски считается от САМОГО РЕБРА, а не от середины фигуры.
     Грань — длинный клин со срезанным основанием, её середина смещена, и по
     направлению «от середины» боковые плоскости получались то ближними, то
     дальними. Обход многоугольника даёт нормаль однозначно. */
  const area = q.reduce((s, p, i) => {
    const n = q[(i + 1) % q.length];
    return s + (p[0] * n[1] - n[0] * p[1]);
  }, 0);
  const sign = area > 0 ? 1 : -1;

  const bevels = [];
  const faces = [];
  for (let e = 0; e < q.length; e++) {
    const A = q[e]; const B = q[(e + 1) % q.length];
    bevels.push(fmtPts([A, B, inner[(e + 1) % q.length], inner[e]]));
    const d = sub(B, A);
    const n = norm([d[1] * sign, -d[0] * sign]);          // наружу
    const lit = dot(n, [-axis[0], -axis[1]]);             // к сердцу — светлее
    faces.push(lit > 0.42 ? 'is-near' : lit < -0.42 ? 'is-far' : 'is-side');
  }
  return { points: fmtPts(q), inner: fmtPts(inner), bevels, faces, cx: +cx.toFixed(2), cy: +cy.toFixed(2) };
}

/* Насколько кристалл мельче полуширины грани в своём месте. Число одно на
   все пять: сужается клин — сужаются и кристаллы вместе с ним. Подобрано
   так, чтобы самый крупный (у сердца) не доставал до соседнего гнезда. */
const CRYSTAL_K = 0.58;
/* Зазор от кромки грани до подписи кристалла, в единицах холста. */
const LABEL_GAP = 10;

/**
 * Три грани ядра с кристаллами внутри.
 *
 * @returns {{
 *   box, c, r, plate, heart,
 *   facets: Array<{
 *     id, deg, stops, strip,
 *     points, inner, bevels, faces, cx, cy,
 *     crystals: Array<{ id, key, facetId, index,
 *       points, inner, bevels, faces, cx, cy,
 *       near, far, labX, labY, labSize }>,
 *   }>,
 * }}
 *   plate — контур шестиугольника: по нему ловится ведение пальцем;
 *   heart — кромка сердца: по ней ведение отсекается, грань там не берётся;
 *   points — грань БЕЗ сердца: клин, срезанный по кромке сердца;
 *   strip  — горящая часть грани одной фигурой: по ней идёт налив;
 *   near, far — середины ближнего к сердцу и дальнего срезов кристалла.
 */
export function coreFacets(mode = 'full') {
  const fig = coreFigure(mode);
  const C = fig.c;
  const R = fig.r;

  /* Сердце как есть из общей фигуры: и форма, и разворот, и размер. Форма
     кристалла берётся отсюда же — он то же сердце в уменьшении. */
  const heart = parsePts(fig.heart.frame);
  const heartDirs = heart.map((v) => norm(sub(v, [C, C])));
  /* Радиус, с которого начинается налив: касание кромки сердца изнутри —
     апофема шестиугольника сердца. Круг этого радиуса задевает кромку и не
     показывает ни капли света, а первый же шаг заливает грань вплотную к
     сердцу, без тёмного клина у основания. Выведено из той же кромки. */
  const heartIn = Math.hypot(...mid(heart[0], heart[1]).map((v, i) => v - C));

  /* ⚠️ В общем coreFigure.js клинья до сих пор называются branches. Файл
     общий с лендингом, декой и входом — переименовывать его ради словаря
     макета нельзя, поэтому читаем как есть и даём правильное имя здесь. */
  const facets = fig.branches.map((b) => {
    const q = parsePts(b.points);

    /* Ось грани: середина дальнего среза клина лежит ровно на ней. */
    const far = mid(q[2], q[3]);
    const ax = norm(sub(far, [C, C]));    // вдоль грани, наружу
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

    /* Грань = клин минус сердце. Отсюда и подсветка, и вынесенный предмет,
       и пустое гнездо: что подсветилось, то и вышло вперёд. */
    const body = cutOut(q, heart).points;
    const facetShape = bevelPoly(body, 0.9, ax);

    /* Пять гнёзд по длине грани, в каждом ОДИН кристалл — маленькое сердце.
       Гнёзда идут по тем же остановкам, по которым идёт налив: зажёг
       кристалл — залился ровно его шаг. */
    const crystals = [];
    for (let i = 0; i < STEPS; i++) {
      const t0 = b.stops[i] / R;
      const t1 = b.stops[i + 1] / R;
      const tm = (t0 + t1) / 2;
      const c0 = [C + ax[0] * R * tm, C + ax[1] * R * tm];
      /* Размер следует ширине грани в этом месте: у сердца крупнее, к
         кромке мельче. Разворот — как у сердца, один на все пять. */
      const rad = halfAt(tm) * R * CRYSTAL_K;
      const gem = heartDirs.map((d) => [c0[0] + d[0] * rad, c0[1] + d[1] * rad]);
      const shape = bevelPoly(gem, 0.78, ax);

      /* Подпись стоит СБОКУ от своего гнезда, на его высоте: грань длинная и
         узкая, под гнездом места нет. */
      const off = (halfAt(tm) * R) + LABEL_GAP;
      crystals.push({
        id: i + 1,
        facetId: b.id,
        index: i,
        key: `${b.id}${i + 1}`,
        ...shape,
        near: [c0[0] - ax[0] * rad, c0[1] - ax[1] * rad].map((x) => +x.toFixed(2)),
        far: [c0[0] + ax[0] * rad, c0[1] + ax[1] * rad].map((x) => +x.toFixed(2)),
        labX: +(C + ax[0] * R * tm + nx[0] * off).toFixed(2),
        labY: +(C + ax[1] * R * tm + nx[1] * off).toFixed(2),
        labSize: +((b.stops[i + 1] - b.stops[i]) * 0.46).toFixed(2),
      });
    }

    /* Остановки налива отличаются от остановок гнёзд ровно первой: свет
       начинается от кромки сердца, а гнёзда — от его вершины. Иначе у
       основания грани оставался бы незалитый тёмный клин. */
    const fillStops = [+heartIn.toFixed(2), ...b.stops.slice(1)];

    return { id: b.id, deg, stops: b.stops.slice(), fillStops, strip: b.strip, ...facetShape, crystals };
  });

  return { box: fig.box, c: C, r: R, plate: fig.plate, heart: fmtPts(heart), facets };
}
