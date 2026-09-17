// collapseLayouts.js — ТРИ РАСКЛАДКИ ТУРНИРА COLLAPSE. Одна механика, меняется
// только размер стороны.
//
// ЧТО ТАКОЕ COLLAPSE. Турнир на выбывание. Шестнадцать участников, ваш — один из
// них, остальные боты. Стороны сходятся парами, проигравший выбывает,
// победитель проходит дальше: 16 → 8 → 4 → 2 → 1.
//
// ПОЧЕМУ QUAD, А НЕ SQUAD. Имя SQUAD уже занято режимом командного боя. Четвёрка
// турнира — это НЕ тот SQUAD: там команда против команды один раз, здесь она
// проходит сетку.
//
// ЧИСЛО ВОЛН НЕ ХРАНИТСЯ, А СЧИТАЕТСЯ. Волн ровно столько, сколько раз
// шестнадцать делится пополам до единицы. Записать его рядом со сторонами
// значило бы завести второе место, где живёт одно и то же, — и первое, которое
// разойдётся с таблицей.
//
// МЕСТО ТОЖЕ СЧИТАЕТСЯ, А НЕ ЛЕЖИТ ТАБЛИЦЕЙ. Проиграл в волне N — значит
// оказался в той половине, которая на этой волне выбыла: от S/2^N + 1 до
// S/2^(N-1). Для шестнадцати это 9–16 · 5–8 · 3–4 · 2, ровно как в ТЗ.
//
// Экспортирует: COLLAPSE_LAYOUTS, LAYOUT_IDS, DEFAULT_LAYOUT_ID, getLayout,
//               wavesOf, placeAfterLoss, parseLayoutId, collapseSpawnPos,
//               layoutByPerSide, layoutNameByPerSide.

/**
 * @typedef {object} CollapseLayout
 * @property {string} id      ключ; он же значение служебного признака ?collapse=
 * @property {string} name    подпись
 * @property {number} sides   сколько сторон сходится в турнире
 * @property {number} perSide сколько бойцов в стороне
 */

/** @type {CollapseLayout[]} */
export const COLLAPSE_LAYOUTS = [
  { id: 'solo', name: 'SOLO', sides: 16, perSide: 1 },
  { id: 'duo',  name: 'DUO',  sides: 8,  perSide: 2 },
  { id: 'quad', name: 'QUAD', sides: 4,  perSide: 4 },
];

export const LAYOUT_IDS = COLLAPSE_LAYOUTS.map((l) => l.id);
export const DEFAULT_LAYOUT_ID = 'solo';

/**
 * Раскладка по ключу. Незнакомый ключ — не ошибка: отдаём раскладку по
 * умолчанию, чтобы дорога в бой не обрывалась (то же правило, что у режимов).
 */
export function getLayout(id) {
  return COLLAPSE_LAYOUTS.find((l) => l.id === id)
    || COLLAPSE_LAYOUTS.find((l) => l.id === DEFAULT_LAYOUT_ID);
}

/**
 * Прочитать значение служебного признака. Пусто или незнакомое — SOLO, как
 * написано в ТЗ: `?collapse=1` тоже даёт SOLO.
 * @returns {string|null} ключ раскладки или null, если признака нет вовсе
 */
export function parseLayoutId(raw) {
  if (raw === undefined || raw === null || raw === '') return null;
  const v = String(raw).toLowerCase();
  return LAYOUT_IDS.includes(v) ? v : DEFAULT_LAYOUT_ID;
}

/**
 * Раскладка по размеру стороны. Нужна воротам: там игрок выбирает ЧИСЛО бойцов
 * тем же переключателем, что и в командном бою (1 / 2 / 4), и это число должно
 * превратиться в раскладку ровно одним способом.
 *
 * Обратного перевода в таблице режимов нет намеренно: список `sizes` у COLLAPSE
 * — это те же `perSide` отсюда. Второй таблицы соответствий не заводим, иначе
 * при добавлении раскладки их стало бы две и они разошлись бы.
 *
 * @param {number} n сколько бойцов в стороне
 * @returns {CollapseLayout} незнакомое число — раскладка по умолчанию
 */
export function layoutByPerSide(n) {
  return COLLAPSE_LAYOUTS.find((l) => l.perSide === n) || getLayout(DEFAULT_LAYOUT_ID);
}

/** Подпись раскладки по размеру стороны — её показывает переключатель в воротах. */
export function layoutNameByPerSide(n) {
  return layoutByPerSide(n).name;
}

/** Сколько волн в турнире: столько раз стороны делятся пополам до одной. */
export function wavesOf(id) {
  return Math.round(Math.log2(getLayout(id).sides));
}

/**
 * Какое место занял тот, кто проиграл в волне `wave` (нумерация с единицы).
 * Возвращает пару границ: у последней волны они совпадают (второе место).
 * @returns {{from:number,to:number,of:number}}
 */
export function placeAfterLoss(id, wave) {
  const of = getLayout(id).sides;
  const to = of / Math.pow(2, wave - 1);
  const from = of / Math.pow(2, wave) + 1;
  return { from, to, of };
}

// ─── ГДЕ СТОРОНЫ ВЫХОДЯТ НА ПЛИТУ ────────────────────────────────────────────
// Одно место на всю игру: и сцена, и мгновенный бой спрашивают точки здесь.
// Разъедься они — бой на экране пошёл бы не с тех позиций, что бой в расчёте, и
// замер «мгновенный совпадает со сценой» перестал бы что-либо значить.

/** Точки боя ОДИН НА ОДИН — исторические, те же, на которых стоит вся дуэль. */
const HISTORIC = { a: { x: 0.45, z: 1.3 }, b: { x: -0.65, z: -1.4 } };

// ШЕРЕНГИ, А НЕ ДУГИ. Общая расстановка ставит сторону по дуге радиуса 1.08
// (плита узкая по глубине). При ЧЕТЫРЁХ на сторону дуге нужно 183° — сторона
// обошла бы круг и вышла бы в чужую. Плита 6 на 4: по ширине места вдвое
// больше, и шеренги ложатся на неё свободно. Это ровно та же причина, по
// которой шеренгами выходит рейд.
const ROW_Z_A = 1.15;   // своя шеренга: перед швом со своей стороны
const ROW_Z_B = -1.25;  // чужая шеренга: зеркально, чуть дальше
const ROW_STEP = 1.2;   // шаг вдоль шеренги; заведомо шире рабочего просвета тел

/**
 * Точка выхода бойца.
 * @param {number} perSide сколько бойцов в стороне
 * @param {boolean} isSideA сторона игрока (ближняя половина плиты)
 * @param {number} k номер бойца в стороне
 */
export function collapseSpawnPos(perSide, isSideA, k) {
  if (perSide === 1) return isSideA ? { ...HISTORIC.a } : { ...HISTORIC.b };
  const x = (k - (perSide - 1) / 2) * ROW_STEP;
  return { x, z: isSideA ? ROW_Z_A : ROW_Z_B };
}
