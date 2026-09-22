// openFieldCovers.js — РАСКЛАДКА УКРЫТИЙ ОТКРЫТОГО ПОЛЯ. Где стоят блоки и какие
// они. Одна раскладка, постоянная, случайных нет.
//
// ЧТО ТАКОЕ УКРЫТИЕ. Низкий толстый блок: 1.7 в толщину, 1.5 в высоту при росте
// бойца 1.85. Это не стена и не лабиринт — бетонный блок на боевом поле. Он
// дробит общую свалку на местные стычки: сквозь него не достают и его приходится
// обходить.
//
// ПОЧЕМУ ЭТО ОТДЕЛЬНЫЙ ФАЙЛ, А НЕ КОД СЦЕНЫ. Раскладка — данные, и их читают
// ТРОЕ: сцена (чтобы построить меши), обход (чтобы испечь сетку проходимости) и
// мгновенный бой (он считает те же двадцать тел без сцены). Живи она в сцене,
// мгновенный бой считал бы поле БЕЗ укрытий — то есть замер длины показывал бы
// не тот бой, который игрок видит глазами. Ровно эта ошибка уже разбиралась,
// когда обвязку боя выносили в boutCore.
//
// ⚠️ ЗДЕСЬ НЕТ НИ ОДНОГО ЧИСЛА. Все до единого живут в блоке `openField.cover`
//    файла чисел боя; здесь только правило, как из них складывается раскладка.
//    Иначе числа режима оказались бы в двух местах и разошлись бы.
//
// Экспортирует: buildCoverLayout, coverHalfSpan, pointInsideCover,
//               pushPointOutOfCovers, segmentHitsCovers.

import { COMBAT_BALANCE } from '@/data/combatBalance.js';
import { getOfLayout, spawnRingRadius } from '@/data/openFieldLayouts.js';

/**
 * @typedef {object} Cover
 * @property {number} x   середина блока по X
 * @property {number} z   середина блока по Z
 * @property {number} a   поворот вокруг Y, радианы (0 — длина вдоль X)
 * @property {number} hl  половина ДЛИНЫ (вдоль собственной оси блока)
 * @property {number} ht  половина ТОЛЩИНЫ (поперёк)
 * @property {number} h   высота
 */

/**
 * ДВА КОЛЬЦА ПО ДВАДЦАТЬ. Двадцать — не вкус, а симметрия: сторон на поле 20, 10
 * или 5, и все три делят двадцать, поэтому одна раскладка одинакова для КАЖДОГО
 * стартового места во всех трёх раскладках разом.
 *
 * Блоки стоят КАСАТЕЛЬНО к кольцу: длина вдоль дуги, толщина по радиусу. Так
 * просвет между соседями считается по дуге и выходит ровно `gap`, а идущий из
 * середины наружу упирается в толщину, а не в торец.
 *
 * Внутреннее кольцо повёрнуто на полшага: иначе через оба кольца шли бы прямые
 * радиальные коридоры, и укрытия не дробили бы свалку, а канализовали её.
 *
 * @returns {Cover[]}
 */
export function buildCoverLayout() {
  const C = COMBAT_BALANCE.openField.cover;
  const out = [];
  // ⚠️ РАДИУСЫ КОЛЕЦ — ДОЛИ ОТ КОЛЬЦА ВЫХОДА, А ДЛИНЫ БЛОКОВ СЧИТАЮТСЯ ИЗ
  //    ПРОСВЕТА. Сначала и радиусы, и длины стояли числами — и раскладка молча
  //    разошлась бы с полем при первой же правке просвета между сторонами: поле
  //    считается от кольца выхода, а укрытия стояли бы там, где стояли. При
  //    уменьшении поля внешнее кольцо оказалось бы прямо на точках выхода.
  //
  //    Требование — ПРОСВЕТ (его назвал владелец: не уже трёх). Значит просвет
  //    задан, а длина блока следует из него и из радиуса, а не наоборот.
  const R = spawnRingRadius(getOfLayout('solo'));
  const ring = (count, frac, phase) => {
    const radius = R * frac;
    const ht = C.thickness / 2;
    // Длина = шаг по дуге минус требуемый просвет. Короче собственной толщины
    // блок быть не может — тогда это просто квадратный столб.
    const length = Math.max(C.thickness, (Math.PI * 2 * radius) / count - C.gap);
    const hl = length / 2;
    for (let i = 0; i < count; i += 1) {
      const a = (i / count) * Math.PI * 2 + phase;
      out.push({
        x: Math.cos(a) * radius,
        z: Math.sin(a) * radius,
        // Блок стоит КАСАТЕЛЬНО: его длинная ось перпендикулярна радиусу.
        // Поворот вокруг Y отсчитывается так, что при a = 0 длина идёт вдоль Z.
        a: a + Math.PI / 2,
        hl,
        ht,
        h: C.height,
      });
    }
  };
  ring(C.outerCount, C.outerRadiusFrac, 0);
  ring(C.innerCount, C.innerRadiusFrac, C.innerPhaseHalfStep ? Math.PI / C.innerCount : 0);
  return out;
}

/** Самый дальний край раскладки от середины — служебная проверка, влезла ли она. */
export function coverHalfSpan(covers) {
  let m = 0;
  for (const c of covers) {
    const r = Math.hypot(c.x, c.z) + Math.hypot(c.hl, c.ht);
    if (r > m) m = r;
  }
  return m;
}

/**
 * Точка внутри укрытия, раздутого на `pad`.
 *
 * Считается в СОБСТВЕННОЙ системе блока: повернули разность на минус угол блока —
 * и дальше это обычный прямоугольник. Так работает любой поворот, и отдельной
 * ветки для «блок стоит вдоль осей» заводить не надо.
 */
export function pointInsideCover(c, x, z, pad = 0) {
  const ca = Math.cos(-c.a);
  const sa = Math.sin(-c.a);
  const dx = x - c.x;
  const dz = z - c.z;
  const lx = dx * ca - dz * sa;
  const lz = dx * sa + dz * ca;
  return Math.abs(lx) <= c.hl + pad && Math.abs(lz) <= c.ht + pad;
}

/**
 * ВЫТОЛКНУТЬ ТОЧКУ ИЗ УКРЫТИЙ — кратчайшим путём наружу.
 *
 * ЗАЧЕМ ЭТО ВООБЩЕ НУЖНО, ЕСЛИ ЕСТЬ ОБХОД. Обход отвечает за то, куда боец ИДЁТ,
 * и этого мало: его толкают в укрытие расталкивание тел и отшат от тяжёлого
 * удара — оба пишут позицию мимо навигации. Приёмка требует нуля тел внутри
 * укрытий, и держит этот ноль именно выталкивание, а не обход.
 *
 * Выход ищется по СОБСТВЕННЫМ осям блока: наружу вылезаем по той стороне, до
 * которой ближе. Это даёт скольжение вдоль укрытия вместо застревания в углу.
 *
 * @param {Cover[]} covers
 * @param {{x:number,z:number}} p точка, МЕНЯЕТСЯ НА МЕСТЕ
 * @param {number} pad радиус тела
 * @returns {boolean} пришлось ли двигать
 */
export function pushPointOutOfCovers(covers, p, pad) {
  let moved = false;
  for (const c of covers) {
    const ca = Math.cos(-c.a);
    const sa = Math.sin(-c.a);
    const dx = p.x - c.x;
    const dz = p.z - c.z;
    const lx = dx * ca - dz * sa;
    const lz = dx * sa + dz * ca;
    const ex = c.hl + pad;
    const ez = c.ht + pad;
    if (Math.abs(lx) > ex || Math.abs(lz) > ez) continue;   // снаружи — не трогаем
    // Насколько глубоко сидим по каждой оси; вылезаем по МЕНЬШЕЙ — это ближний край.
    const ox = ex - Math.abs(lx);
    const oz = ez - Math.abs(lz);
    let nx = lx;
    let nz = lz;
    if (ox <= oz) nx = lx >= 0 ? ex : -ex;
    else nz = lz >= 0 ? ez : -ez;
    // Обратно в мировые оси.
    const cb = Math.cos(c.a);
    const sb = Math.sin(c.a);
    p.x = c.x + nx * cb - nz * sb;
    p.z = c.z + nx * sb + nz * cb;
    moved = true;
  }
  return moved;
}

/**
 * Пересекает ли отрезок хоть одно укрытие. Нужен обходу, чтобы понять, видно ли
 * цель напрямую, и не считать путь, когда дорога и так свободна.
 *
 * Считается пересечение отрезка с прямоугольником в его собственных осях
 * (алгоритм «плит»): загоняем отрезок в локальные координаты блока и режем
 * параметр входа-выхода по каждой оси.
 */
export function segmentHitsCovers(covers, ax, az, bx, bz, pad = 0) {
  for (const c of covers) {
    const ca = Math.cos(-c.a);
    const sa = Math.sin(-c.a);
    const px = (ax - c.x) * ca - (az - c.z) * sa;
    const pz = (ax - c.x) * sa + (az - c.z) * ca;
    const qx = (bx - c.x) * ca - (bz - c.z) * sa;
    const qz = (bx - c.x) * sa + (bz - c.z) * ca;
    const dx = qx - px;
    const dz = qz - pz;
    const ex = c.hl + pad;
    const ez = c.ht + pad;
    let t0 = 0;
    let t1 = 1;
    let hit = true;
    for (const [p0, d0, e] of [[px, dx, ex], [pz, dz, ez]]) {
      if (Math.abs(d0) < 1e-9) {
        if (Math.abs(p0) > e) { hit = false; break; }   // параллельно и мимо
        continue;
      }
      const ta = (-e - p0) / d0;
      const tb = (e - p0) / d0;
      const lo = Math.min(ta, tb);
      const hi = Math.max(ta, tb);
      if (lo > t0) t0 = lo;
      if (hi < t1) t1 = hi;
      if (t0 > t1) { hit = false; break; }
    }
    if (hit) return true;
  }
  return false;
}
