// openFieldRun.js — ХОД ОТКРЫТОГО ПОЛЯ. Сколько сторон ещё дерётся, чем всё
// кончилось для игрока и какое он занял место.
//
// ЗАЧЕМ ОТДЕЛЬНЫЙ ФАЙЛ — ТА ЖЕ ПРИЧИНА, ЧТО У ТУРНИРА (services/collapseRun.js).
// Про ход боя знают двое: арена (она одна видит, кто пал) и надписи поверх неё
// (они одни знают, как об этом сказать). Арена — защищённый файл, и пускать в неё
// разметку нельзя; а надписям незачем знать про сцену. Между ними — это
// состояние: сцена пишет, надписи читают, ни одна сторона не лезет в другую.
//
// ЧЕГО ЗДЕСЬ НЕТ. Ни сетки, ни волн, ни переноса здоровья — у открытого поля
// всего этого нет по правилам: один бой от начала до конца. Поэтому файл
// заметно короче турнирного, и раздувать его «на будущее» не надо.
//
// ОТКУДА БЕРЁТСЯ МЕСТО. Правило живёт в data/openFieldLayouts.js
// (placeOnElimination), потому что оно про раскладку, а не про ход боя. Здесь
// только момент, когда его надо применить.
//
// КАМЕРА ТОЖЕ ЖИВЁТ ЗДЕСЬ — ОДНИМ ПРИЗНАКОМ И ОДНОЙ КНОПКОЙ. Про то, что игрок
// взял камеру в руки, знает сцена; кнопку «вернуть слежение» рисует надпись
// поверх боя. Это ровно тот же шов, что у кнопки «драться снова»
// (services/fightResult.js): сцена отдаёт способ что-то сделать, надпись его
// зовёт. Иначе кнопке пришлось бы лезть внутрь защищённой сцены за камерой.
//
// Экспортирует: openFieldState, startOpenField, shortOfFighters, noteSidesLeft,
//               finishOpenField, endOpenField, bindCameraReturn, cameraReturnNow,
//               noteCameraFree.

import { reactive } from 'vue';
import { getOfLayout, placeOnElimination } from '@/data/openFieldLayouts.js';

/**
 * Что показывают надписи поверх боя.
 *   active   — режим идёт (иначе поверх боя не рисуется ничего)
 *   phase    — 'fight' дерёмся · 'done' для игрока всё · 'short' бойцов не хватает
 *   sides    — сколько сторон вышло на поле (это и есть M в «PLACE N OF M»)
 *   sidesLeft— сколько сторон ещё живо. Счётчик наверху показывает именно это
 *   place    — какое место занял игрок; null, пока бой для него идёт
 *   outcome  — 'victory' сторона игрока осталась одна · 'out' пала
 *   shortBy  — скольких бойцов не хватило, чтобы вообще выйти на поле
 *   cameraFree — камера в руках игрока: слежение выключено, и само обратно оно
 *              не включится. Пока признак поднят, поверх боя стоит кнопка возврата
 */
export const openFieldState = reactive({
  active: false,
  phase: 'fight',
  layoutId: null,
  sides: 0,
  sidesLeft: 0,
  place: null,
  outcome: null,
  shortBy: 0,
  cameraFree: false,
});

// Кто умеет вернуть слежение. Ставит сцена (только она владеет камерой), зовёт
// кнопка. Снимается при уходе с арены, иначе кнопка дёрнула бы разобранную сцену.
let cameraReturn = null;

/** Сцена отдаёт способ вернуть слежение. Вернуть — снять. */
export function bindCameraReturn(fn) {
  cameraReturn = typeof fn === 'function' ? fn : null;
  return () => { if (cameraReturn === fn) cameraReturn = null; };
}

/** Игрок нажал возврат. Двойное нажатие безвредно: признак уже снят. */
export function cameraReturnNow() {
  if (!openFieldState.cameraFree) return false;
  if (cameraReturn) cameraReturn();
  return true;
}

/** Сцена сообщает, в чьих руках камера. */
export function noteCameraFree(on) {
  openFieldState.cameraFree = !!on;
}

/** Бой начался. Зовётся на КАЖДЫЙ бой, включая «драться снова». */
export function startOpenField(layoutId) {
  const L = getOfLayout(layoutId);
  openFieldState.active = true;
  openFieldState.phase = 'fight';
  openFieldState.layoutId = L.id;
  openFieldState.sides = L.sides;
  openFieldState.sidesLeft = L.sides;
  openFieldState.place = null;
  openFieldState.outcome = null;
  openFieldState.shortBy = 0;
  // ⚠️ КАЖДЫЙ БОЙ НАЧИНАЕТСЯ СО СЛЕЖЕНИЯ. Ручное положение камеры между боями не
  //    переносится и между заходами не сохраняется — так решено в ТЗ.
  openFieldState.cameraFree = false;
}

/**
 * Бойцов в ростере меньше, чем просит раскладка. На поле не выходит никто —
 * то же честное состояние, что у турнира, и по той же причине: половина стороны
 * означала бы бой, которого нет.
 */
export function shortOfFighters(layoutId, have) {
  const L = getOfLayout(layoutId);
  openFieldState.active = true;
  openFieldState.phase = 'short';
  openFieldState.layoutId = L.id;
  openFieldState.sides = L.sides;
  openFieldState.sidesLeft = 0;
  openFieldState.place = null;
  openFieldState.outcome = null;
  openFieldState.shortBy = Math.max(0, L.perSide - have);
}

/** Сколько сторон ещё дерётся. Сцена зовёт это, когда число изменилось. */
export function noteSidesLeft(n) {
  openFieldState.sidesLeft = Math.max(0, n | 0);
}

/**
 * ДЛЯ ИГРОКА ВСЁ. Либо его сторона осталась одна (победа), либо пала (место).
 *
 * `livingSides` — сколько сторон живо В ЭТОТ МОМЕНТ, НЕ СЧИТАЯ сторону игрока.
 * Победителю их ноль, и правило само даёт первое место.
 *
 * ⚠️ ОСТАТОК МАТЧА НЕ ДОСЧИТЫВАЕТСЯ. Так решено в ТЗ: сторона игрока выбыла —
 *    матч для него кончился, и дальнейшая возня чужих сторон на его место уже не
 *    влияет (все они и так выше). Считать их значило бы жечь кадры ради числа,
 *    которое уже известно.
 */
export function finishOpenField(won, livingSides) {
  openFieldState.phase = 'done';
  openFieldState.outcome = won ? 'victory' : 'out';
  openFieldState.place = { n: placeOnElimination(livingSides), of: openFieldState.sides };
}

/** Уйти из режима — гасит надписи. Зовётся при уходе с арены. */
export function endOpenField() {
  openFieldState.active = false;
  openFieldState.phase = 'fight';
  openFieldState.place = null;
  openFieldState.outcome = null;
  openFieldState.shortBy = 0;
  openFieldState.cameraFree = false;
}
