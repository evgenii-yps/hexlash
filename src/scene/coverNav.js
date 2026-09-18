// coverNav.js — ОБХОД УКРЫТИЙ. Как боец попадает к цели, если между ними блок.
//
// ПОЧЕМУ ВООБЩЕ НУЖЕН ОТДЕЛЬНЫЙ МЕХАНИЗМ. Боец идёт к цели прямым курсом: одна
// функция берёт разность «я → враг», нормирует её и просит шаг в эту сторону.
// Препятствий движок не знает вовсе — единственное, что его останавливает, это
// край плиты и чужое тело. Поставь укрытие на прямой — и боец упрётся в него и
// будет стоять, пока не кончится бой.
//
// ГДЕ ШОВ. Боец узнаёт, где враг, ровно одним способом — спрашивает `getFoePos`,
// а даёт его ниточка из boutCore. Значит обход делается СНАРУЖИ БОЙЦА: пока идти
// далеко и дорога перекрыта, бойцу называют врага НЕ ТАМ, ГДЕ ОН ЕСТЬ, а в
// стороне обхода. Боец честно идёт и поворачивается туда; защищённый файл бойца
// не вскрывается вовсе.
//
// ⚠️ ГЛАВНОЕ ПРАВИЛО ПОДМЕНЫ: РАССТОЯНИЕ НЕ ТРОГАЕМ, ТОЛЬКО НАПРАВЛЕНИЕ.
//
//    Та же точка `getFoePos` кормит ВСЕ проверки дальности: «дотянулся ли»,
//    «стоит ли шагнуть под удар», «не пора ли отойти». Назови врага ближе, чем он
//    есть, — и боец ударит в пустое место; дальше — и он не ударит стоящего
//    вплотную. Поэтому подменённая точка всегда лежит на ТОМ ЖЕ расстоянии, что и
//    настоящая, просто в другую сторону: все пороги дальности видят настоящее
//    число, а курс и разворот идут по обходу.
//
//    Вторая защита — расстояние `steerMinDist` (4.0). Ближе него обход молчит
//    вовсе, и это с запасом больше самой длинной дотяжки в игре (2.15). То есть
//    в досягаемости боец ВСЕГДА видит настоящую цель.
//
// ЧТО СЧИТАЕТСЯ. Сетка проходимости печётся один раз при сборке поля: клетки,
// накрытые укрытием, раздутым на радиус тела, помечены занятыми. Путь ищется по
// ней восьминаправленным A*, не чаще раза в секунду на бойца и только когда
// прямая дорога перекрыта. Дальше путь ПРОТЯГИВАЕТСЯ: берётся самая дальняя его
// точка, которую видно напрямую, — так боец идёт по прямой, а не по ступенькам
// сетки.
//
// Экспортирует: createCoverNav.

import { COMBAT_BALANCE } from '@/data/combatBalance.js';
import { segmentHitsCovers, pushPointOutOfCovers } from '@/data/openFieldCovers.js';

/**
 * @param {object} o
 * @param {object[]} o.covers раскладка укрытий (buildCoverLayout)
 * @param {{x:number,z:number}} o.bounds полуразмеры поля
 * @param {() => number} o.now время в секундах (сцена — своё, мгновенный бой — своё)
 */
export function createCoverNav({ covers, bounds, now }) {
  const C = COMBAT_BALANCE.openField.cover;
  const cell = C.cellSize;
  const pad = C.bodyRadius;

  // --- СЕТКА. Начало в углу (-bounds.x, -bounds.z), клетка `cell`.
  const nx = Math.max(1, Math.ceil((bounds.x * 2) / cell));
  const nz = Math.max(1, Math.ceil((bounds.z * 2) / cell));
  const blocked = new Uint8Array(nx * nz);
  const ix = (x) => Math.min(nx - 1, Math.max(0, Math.floor((x + bounds.x) / cell)));
  const iz = (z) => Math.min(nz - 1, Math.max(0, Math.floor((z + bounds.z) / cell)));
  const cx = (i) => -bounds.x + (i + 0.5) * cell;
  const cz = (j) => -bounds.z + (j + 0.5) * cell;

  // Печём один раз. Клетка занята, если её середина попала в укрытие, раздутое на
  // радиус тела: боец — не точка, и путь впритирку к блоку он не пройдёт.
  //
  // ⚠️ РАЗДУВАЕМ РОВНО НА РАДИУС ТЕЛА, НИ НА ПОЛКЛЕТКИ БОЛЬШЕ. Сначала здесь
  //    стоял запас в полклетки — «чтобы путь не ложился вплотную». Просвет между
  //    укрытиями 3.0, и такой запас съедал его до 1.27, то есть до ОДНОЙ клетки:
  //    проход держался на том, попала ли в него середина клетки, и от сдвига
  //    раскладки на полметра мог закрыться совсем. На чистом радиусе тела остаётся
  //    2.27 — две клетки, и проход есть при любой фазе сетки.
  //
  //    За то, чтобы боец не скрёб по блоку боком, отвечает не сетка, а протяжка
  //    пути: она проверяет НАСТОЯЩИЙ отрезок с тем же радиусом тела.
  {
    const grow = pad;
    for (let j = 0; j < nz; j += 1) {
      for (let i = 0; i < nx; i += 1) {
        const x = cx(i);
        const z = cz(j);
        let hit = false;
        for (const c of covers) {
          const ca = Math.cos(-c.a);
          const sa = Math.sin(-c.a);
          const dx = x - c.x;
          const dz = z - c.z;
          const lx = dx * ca - dz * sa;
          const lz = dx * sa + dz * ca;
          if (Math.abs(lx) <= c.hl + grow && Math.abs(lz) <= c.ht + grow) { hit = true; break; }
        }
        if (hit) blocked[j * nx + i] = 1;
      }
    }
  }

  const free = (i, j) => i >= 0 && j >= 0 && i < nx && j < nz && !blocked[j * nx + i];

  // --- A*. Буферы заведены ОДИН РАЗ и переиспользуются: поиск идёт двадцать раз в
  //     секунду, и заводить на каждый по три массива на четыре тысячи клеток —
  //     это мусор, который потом собирают рывком посреди боя.
  const N = nx * nz;
  const gScore = new Float32Array(N);
  const fScore = new Float32Array(N);
  const cameFrom = new Int32Array(N);
  const stamp = new Int32Array(N);      // «в каком поиске эта клетка трогалась»
  const closed = new Uint8Array(N);
  let epoch = 0;
  // Куча на типизированном массиве — та же причина.
  const heap = new Int32Array(N);
  let heapLen = 0;

  const heapPush = (node) => {
    let i = heapLen++;
    heap[i] = node;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (fScore[heap[p]] <= fScore[heap[i]]) break;
      const t = heap[p]; heap[p] = heap[i]; heap[i] = t;
      i = p;
    }
  };
  const heapPop = () => {
    const top = heap[0];
    heapLen -= 1;
    if (heapLen > 0) {
      heap[0] = heap[heapLen];
      let i = 0;
      for (;;) {
        const l = i * 2 + 1;
        const r = l + 1;
        let m = i;
        if (l < heapLen && fScore[heap[l]] < fScore[heap[m]]) m = l;
        if (r < heapLen && fScore[heap[r]] < fScore[heap[m]]) m = r;
        if (m === i) break;
        const t = heap[m]; heap[m] = heap[i]; heap[i] = t;
        i = m;
      }
    }
    return top;
  };

  const DIAG = Math.SQRT2;
  // Октильная оценка — точная нижняя граница для восьми направлений. Она и делает
  // поиск дешёвым: на открытом поле A* идёт почти по прямой.
  const hEst = (i, j, ti, tj) => {
    const dx = Math.abs(i - ti);
    const dz = Math.abs(j - tj);
    return (dx > dz ? dx - dz : dz - dx) + DIAG * Math.min(dx, dz);
  };

  /**
   * Ближайшая свободная клетка к заданной — на случай, когда боец оказался внутри
   * раздутого укрытия (его туда могли втолкнуть тела). Ищем по расширяющемуся
   * кольцу; без этого A* не смог бы даже стартовать.
   */
  const nearestFree = (i, j) => {
    if (free(i, j)) return j * nx + i;
    for (let r = 1; r <= 6; r += 1) {
      for (let dj = -r; dj <= r; dj += 1) {
        for (let di = -r; di <= r; di += 1) {
          if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
          if (free(i + di, j + dj)) return (j + dj) * nx + (i + di);
        }
      }
    }
    return -1;
  };

  const pathBuf = [];   // переиспользуемый список узлов пути, от цели к старту
  // СЛУЖЕБНЫЙ СЧЁТ ЦЕНЫ. Владелец просил цену кадра отдельной строкой: поиск пути
  // против остального. Копится здесь, показывается служебной строкой сцены.
  let costMs = 0;
  let searches = 0;
  // ⚠️ СТОРОЖ ГЛАВНОГО ПРАВИЛА ПОДМЕНЫ. Подмена обязана молчать, пока цель в
  //    досягаемости, иначе боец ударит в пустое место. Условие держится кодом, но
  //    правило слишком дорогое, чтобы верить ему на слово: сторож считает, сколько
  //    раз оно было бы нарушено. Ноль — значит ударов в пустое место быть не может.
  let nearLies = 0;

  /**
   * Путь по сетке. Возвращает число узлов в pathBuf (0 — пути нет).
   * Узлы лежат в порядке ОТ ЦЕЛИ К СТАРТУ.
   */
  const findPath = (sx, sz, tx, tz) => {
    const t0 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : 0;
    searches += 1;
    const s = nearestFree(ix(sx), iz(sz));
    const t = nearestFree(ix(tx), iz(tz));
    pathBuf.length = 0;
    if (s < 0 || t < 0 || s === t) return 0;
    epoch += 1;
    heapLen = 0;
    const ti = t % nx;
    const tj = (t / nx) | 0;
    gScore[s] = 0;
    fScore[s] = hEst(s % nx, (s / nx) | 0, ti, tj);
    cameFrom[s] = -1;
    stamp[s] = epoch;
    closed[s] = 0;
    heapPush(s);
    let found = false;
    // Потолок раскрытий — страховка, а не механизм: без неё дурная раскладка
    // (цель замурована) съедала бы кадр целиком.
    let expanded = 0;
    const cap = N;
    while (heapLen > 0 && expanded < cap) {
      const cur = heapPop();
      if (stamp[cur] === epoch && closed[cur]) continue;
      if (cur === t) { found = true; break; }
      closed[cur] = 1;
      expanded += 1;
      const ci = cur % nx;
      const cj = (cur / nx) | 0;
      for (let dj = -1; dj <= 1; dj += 1) {
        for (let di = -1; di <= 1; di += 1) {
          if (di === 0 && dj === 0) continue;
          const ni = ci + di;
          const nj = cj + dj;
          if (!free(ni, nj)) continue;
          // По диагонали — только если оба соседних ортогональных свободны, иначе
          // путь режет угол укрытия и боец идёт сквозь него.
          if (di !== 0 && dj !== 0 && (!free(ci + di, cj) || !free(ci, cj + dj))) continue;
          const nn = nj * nx + ni;
          if (stamp[nn] === epoch && closed[nn]) continue;
          const step = (di !== 0 && dj !== 0) ? DIAG : 1;
          const g = gScore[cur] + step;
          if (stamp[nn] === epoch && g >= gScore[nn]) continue;
          stamp[nn] = epoch;
          closed[nn] = 0;
          gScore[nn] = g;
          fScore[nn] = g + hEst(ni, nj, ti, tj);
          cameFrom[nn] = cur;
          heapPush(nn);
        }
      }
    }
    if (t0) costMs += performance.now() - t0;
    if (!found) return 0;
    for (let n = t; n >= 0; n = cameFrom[n]) pathBuf.push(n);
    return pathBuf.length;
  };

  // --- Состояние на бойца. Ключ — сама запись бойца в поле.
  const state = new Map();
  const stateOf = (unit) => {
    let s = state.get(unit);
    if (!s) {
      // Точка подмены заводится ОДНА на бойца и переписывается на месте: её
      // спрашивают по два десятка раз за кадр, и новый объект на каждый запрос —
      // это мусор в самом горячем месте.
      s = { nextAt: 0, seed: Math.random(), way: null, out: { x: 0, y: 0, z: 0 }, active: false };
      state.set(unit, s);
    }
    return s;
  };

  /**
   * ГДЕ БОЕЦ ВИДИТ ВРАГА. Возвращает подменённую точку или null — «смотри правду».
   *
   * @param {object} unit запись бойца
   * @param {{x:number,y:number,z:number}} foe настоящее место цели
   */
  const steer = (unit, foe) => {
    // Откуда смотрит сам боец — берём из его же записи. Передать это параметром
    // нельзя: ниточки собираются РАНЬШЕ тела, и на момент сборки его ещё нет.
    const me = unit.f && unit.f.group ? unit.f.group.position : null;
    if (!me) return null;
    const dx = foe.x - me.x;
    const dz = foe.z - me.z;
    const dist = Math.hypot(dx, dz);
    // Близко — правда без разговоров. Здесь живут все удары, и подмене тут не место.
    if (dist <= C.steerMinDist) { const s = stateOf(unit); s.active = false; s.way = null; return null; }
    // Дорога свободна — тоже правда. Это же и есть самый частый случай, и он стоит
    // одной проверки отрезка вместо поиска пути.
    if (!segmentHitsCovers(covers, me.x, me.z, foe.x, foe.z, pad)) {
      const s = stateOf(unit);
      s.active = false; s.way = null;
      return null;
    }
    const s = stateOf(unit);
    const t = now();
    if (!s.way || t >= s.nextAt) {
      // Заходы разведены по бойцу: иначе все двадцать пересчитали бы путь в одном
      // кадре и он стал бы заметно дороже соседних.
      s.nextAt = t + C.repathSec * (0.85 + s.seed * 0.3);
      const n = findPath(me.x, me.z, foe.x, foe.z);
      if (!n) { s.way = null; s.active = false; return null; }   // пути нет — идём как шли
      // ПРОТЯГИВАЕМ ПУТЬ. pathBuf идёт ОТ ЦЕЛИ к старту, значит первая же его
      // точка, которую видно напрямую, — самая дальняя видимая. Идём сразу туда, а
      // не по ступенькам сетки.
      let wi = n - 1;
      for (let k = 0; k < n; k += 1) {
        const node = pathBuf[k];
        const wx = cx(node % nx);
        const wz = cz((node / nx) | 0);
        if (!segmentHitsCovers(covers, me.x, me.z, wx, wz, pad)) { wi = k; break; }
      }
      const node = pathBuf[wi];
      s.way = { x: cx(node % nx), z: cz((node / nx) | 0) };
    }
    // Дошли до колена — на следующем кадре пересчитаем, а пока идём к цели напрямик.
    const wdx = s.way.x - me.x;
    const wdz = s.way.z - me.z;
    const wd = Math.hypot(wdx, wdz);
    if (wd < cell * 0.75) { s.nextAt = 0; }
    if (wd < 1e-3) { s.active = false; return null; }
    // ⚠️ РАССТОЯНИЕ НАСТОЯЩЕЕ, НАПРАВЛЕНИЕ — ОБХОДА. См. шапку файла.
    s.out.x = me.x + (wdx / wd) * dist;
    s.out.z = me.z + (wdz / wd) * dist;
    s.out.y = foe.y;
    s.active = true;
    // Сторож: подмена не имеет права случиться в досягаемости. См. объявление.
    if (dist <= C.steerMinDist) nearLies += 1;
    return s.out;
  };

  /** Забыть бойца — зовётся, когда он выбыл. */
  const forget = (unit) => { state.delete(unit); };

  /**
   * ВЫТОЛКНУТЬ ТЕЛА ИЗ УКРЫТИЙ. Обход отвечает за то, КУДА боец идёт, и этого
   * мало: в укрытие его вталкивают расталкивание тел и отшат от тяжёлого удара —
   * оба пишут позицию мимо навигации.
   */
  const pushOut = (list) => {
    for (const u of list) pushPointOutOfCovers(covers, u.f.group.position, pad);
  };

  /**
   * Цена поиска пути с прошлого опроса, в миллисекундах, и сколько поисков её
   * составило. Счётчики обнуляются опросом — строку показывают два раза в секунду.
   */
  const takeCost = () => { const r = { ms: costMs, n: searches, lies: nearLies }; costMs = 0; searches = 0; return r; };

  /** Сколько бойцов прямо сейчас идёт в обход — для служебной строки. */
  const steeringCount = () => {
    let n = 0;
    state.forEach((s) => { if (s.active) n += 1; });
    return n;
  };

  return { steer, forget, pushOut, steeringCount, takeCost, grid: { nx, nz, blocked, cell } };
}
