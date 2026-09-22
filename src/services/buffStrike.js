// buffStrike.js — ЗАРЯД КУБИКА НА УДАРАХ. Крошечный отдельный файл.
//
// ЗАЧЕМ ОТДЕЛЬНО, А НЕ ВНУТРИ services/buffs.js. Читает его обвязка боя
// (scene/boutCore.js), а её тянет за собой МГНОВЕННЫЙ бой — тот, которым
// считаются чужие пары в турнире, без сцены и без отрисовки. Если бы заряд жил
// в общем файле баффов, мгновенный бой тащил бы за собой трёхмерные предметы,
// панель и всё остальное. Здесь нет ни одного тяжёлого ввоза, и не должно быть.
//
// ЧЕГО ЗДЕСЬ НЕТ. Ни чисел (они в data/buffBalance.js), ни правил применения
// (они в services/buffs.js). Только «у этого бойца заряжено столько ударов с
// таким множителем» и «удар случился».
//
// Экспортирует: armDiceCharge, clearDiceCharge, diceMulFor, diceChargeOf, noteDiceHit.

/**
 * Ключ — САМ БОЕЦ (объект из buildFighter), а не его имя или номер: боец живёт
 * ровно один бой, а на поле их бывает двадцать. Map, а не WeakMap, чтобы заряд
 * можно было перечислить и погасить по концу боя.
 */
const charges = new Map();

/** Слушатель «заряд изменился» — им панель и значок узнают про остаток. */
let onChange = null;

/** Кто хочет знать про изменения. Вернуть — отписаться. */
export function watchDiceCharge(fn) {
  onChange = typeof fn === 'function' ? fn : null;
  return () => { if (onChange === fn) onChange = null; };
}

/**
 * Зарядить бойцу кубик.
 * @param {object} f боец (buildFighter)
 * @param {number} mul множитель урона
 * @param {number} hits сколько ПОПАВШИХ ударов он действует
 */
export function armDiceCharge(f, mul, hits) {
  if (!f || !(hits > 0)) return;
  charges.set(f, { mul, hitsLeft: hits, hitsTotal: hits });
  if (onChange) onChange(f);
}

/** Снять заряд (боец пал, бой кончился). */
export function clearDiceCharge(f) {
  if (charges.delete(f) && onChange) onChange(f);
}

/** Погасить всё — конец боя. */
export function clearAllDiceCharges() {
  if (!charges.size) return;
  const all = [...charges.keys()];
  charges.clear();
  if (onChange) for (const f of all) onChange(f);
}

/**
 * Множитель урона бойца прямо сейчас.
 *
 * ⚠️ БЕЗ ЗАРЯДА ВОЗВРАЩАЕТ РОВНО ЕДИНИЦУ. На этом стоит обещание «пока бафф не
 *    брошен, урон считается как считался»: умножение на единицу в IEEE754
 *    точное, и обвязка боя даёт то же число, что давала.
 */
export function diceMulFor(f) {
  const c = charges.get(f);
  return c ? c.mul : 1;
}

/** Остаток — для значка над бойцом: { mul, hitsLeft, hitsTotal } или null. */
export function diceChargeOf(f) {
  return charges.get(f) || null;
}

/**
 * УДАР СЛУЧИЛСЯ. Заряд тратит ТОЛЬКО ПОПАВШИЙ удар: промах и уклон дают ноль
 * снятого здоровья, заблокированный помечен отдельно (ТЗ).
 *
 * @param {object} f      бьющий
 * @param {number} dealt  сколько здоровья реально снято (0 = промах или уклон)
 * @param {boolean} blocked ушёл ли удар в блок
 */
export function noteDiceHit(f, dealt, blocked) {
  const c = charges.get(f);
  if (!c) return;
  if (!(dealt > 0) || blocked) return; // не попал или приняли на блок — заряд цел
  c.hitsLeft -= 1;
  if (c.hitsLeft <= 0) charges.delete(f);
  if (onChange) onChange(f);
}
