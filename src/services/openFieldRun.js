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
// ДОСМОТР ПОСЛЕ ГИБЕЛИ. Раньше матч обрывался в тот миг, когда пала сторона
// игрока: место уже известно, дальше считать нечего. Цена оказалась выше выгоды —
// примерно в половине заходов игрок видел одну дуэль и вылетал, так и не увидев
// поля из двадцати бойцов, ради которого режим и делается. Теперь между «свои
// пали» и «поле доиграло» стоит своя фаза: место ЗАМОРОЖЕНО и больше не меняется,
// а поле живёт, и игрок волен смотреть или уйти.
//
// ⚠️ МЕСТО СЧИТАЕТСЯ ОДИН РАЗ. Оно берётся в миг гибели своей стороны и дальше
//    не пересчитывается ничем: чужие стороны, доигрывая между собой, все и так
//    выше нас, и второй расчёт мог бы дать другое число там, где число обязано
//    быть одним. Единственное исключение — победа: там своя сторона не падала
//    вовсе, замораживать было нечего, и место считается на общих основаниях.
//
// ОТКУДА БЕРЁТСЯ МЕСТО. Правило живёт в data/openFieldLayouts.js
// (placeOnElimination), потому что оно про раскладку, а не про ход боя. Здесь
// только момент, когда его надо применить.
//
// КАМЕРА ТОЖЕ ЖИВЁТ ЗДЕСЬ — ОДНОЙ КНОПКОЙ. Камерой владеет сцена, кнопку
// «показать своих» рисует надпись поверх боя. Это ровно тот же шов, что у кнопки
// «драться снова» (services/fightResult.js): сцена отдаёт способ что-то сделать,
// надпись его зовёт. Иначе кнопке пришлось бы лезть внутрь защищённой сцены за
// камерой.
//
// ⚠️ ПРИЗНАКА «КАМЕРА В РУКАХ» ЗДЕСЬ БОЛЬШЕ НЕТ. Он был нужен, пока камера умела
//    следить сама: кнопка возврата имела смысл только тогда, когда было что
//    возвращать. Слежение отменено — камера в руках игрока ВСЕГДА, признак стал
//    вечно поднятым, а кнопка стоит весь бой. Вечный признак — это не состояние,
//    а лишнее место, где однажды заведётся расхождение.
//
// Экспортирует: openFieldState, startOpenField, shortOfFighters, noteSidesLeft,
//               noteClosingIn, noteLeader, outOfOpenField, finishOpenField, endOpenField,
//               bindCameraReturn, cameraReturnNow, bindSpectateLeave,
//               spectateLeaveNow.

import { reactive } from 'vue';
import { getOfLayout, placeOnElimination } from '@/data/openFieldLayouts.js';

/**
 * Что показывают надписи поверх боя.
 *   active   — режим идёт (иначе поверх боя не рисуется ничего)
 *   phase    — 'fight' дерёмся · 'spectate' свои пали, поле живёт, игрок смотрит
 *              · 'done' всё кончилось · 'short' бойцов не хватает
 *   sides    — сколько сторон вышло на поле (это и есть M в «PLACE N OF M»)
 *   sidesLeft— сколько сторон ещё живо. Счётчик наверху показывает именно это
 *   place    — какое место занял игрок; null, пока бой для него идёт. С фазы
 *              'spectate' ЗАМОРОЖЕНО: дальше не меняется, что бы ни было на поле
 *   outcome  — 'victory' сторона игрока осталась одна · 'out' пала
 *   shortBy  — скольких бойцов не хватило, чтобы вообще выйти на поле
 *   winnerName — позывной победившей стороны; ставится только когда поле
 *              ДОИГРАЛО до одной стороны. Ушёл по LEAVE — победителя ещё нет, и
 *              строки нет: врать про него нельзя
 *
 * СУЖЕНИЕ ПОЛЯ — обратный отсчёт перед тем, как граница тронется с места.
 *   closingIn — сколько секунд осталось (целое, 10..1); null — показывать нечего.
 *               Показывается только в окно перед началом: до него сужения ещё
 *               нет, после — граница уже идёт и считать нечего.
 *
 * ЛИДЕР — магнит поля: одна сторона объявляется сильнейшей, и все идут на неё.
 *   leaderName — позывной стороны-лидера; null, пока короны нет
 *   leaderMine — корона на стороне игрока (тогда вместо позывного другая строка)
 *   leaderEdge — где уголок, когда лидер за кадром: { x, y } в процентах экрана и
 *                `angle` в градусах. null — лидер в кадре либо короны нет
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
  winnerName: null,
  leaderName: null,
  leaderMine: false,
  leaderEdge: null,
  closingIn: null,
});

// Кто умеет навести камеру на своих. Ставит сцена (только она владеет камерой),
// зовёт кнопка. Снимается при уходе с арены, иначе кнопка дёрнула бы разобранную
// сцену.
let cameraAim = null;

/** Сцена отдаёт способ навести кадр на свою сторону. Вернуть — снять. */
export function bindCameraReturn(fn) {
  cameraAim = typeof fn === 'function' ? fn : null;
  return () => { if (cameraAim === fn) cameraAim = null; };
}

/**
 * Игрок нажал «показать своих».
 *
 * ⚠️ Двойное нажатие безвредно: второе начинает наводку заново с того места, где
 *    её застало первое, — то же самое, что делает прикосновение к экрану.
 */
export function cameraReturnNow() {
  if (!cameraAim) return false;
  cameraAim();
  return true;
}

// Кто умеет остановить поле и показать итог. Ставит сцена (только она владеет
// боем), зовёт кнопка «уйти» на полосе досмотра. Тот же шов, что у камеры выше, и
// по той же причине: кнопке нельзя лезть внутрь защищённой сцены за боем.
let spectateLeave = null;

/** Сцена отдаёт способ прекратить досмотр. Вернуть — снять. */
export function bindSpectateLeave(fn) {
  spectateLeave = typeof fn === 'function' ? fn : null;
  return () => { if (spectateLeave === fn) spectateLeave = null; };
}

/**
 * Игрок нажал «уйти» на полосе досмотра. Поле останавливается В ЭТОТ ЖЕ МИГ —
 * ни одного шага боя после нажатия, — и сразу выходит панель итога.
 *
 * ⚠️ Двойное нажатие безвредно: сцена сама проверяет, что досмотр ещё идёт, и
 *    второе нажатие приходит уже к остановленному полю.
 */
export function spectateLeaveNow() {
  if (!spectateLeave) return false;
  spectateLeave();
  return true;
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
  openFieldState.winnerName = null;
  // Корона — за бой, а не за заход на арену: «драться снова» выводит новые
  // стороны, и корона прошлого боя на них не переносится.
  clearLeader();
  // Отсчёт — тоже за бой: у нового боя свои часы с нуля.
  openFieldState.closingIn = null;
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
  openFieldState.winnerName = null;
  clearLeader();
  openFieldState.closingIn = null;
}

/** Короны нет: ни имени, ни уголка. */
function clearLeader() {
  openFieldState.leaderName = null;
  openFieldState.leaderMine = false;
  openFieldState.leaderEdge = null;
}

/** Сколько сторон ещё дерётся. Сцена зовёт это, когда число изменилось. */
export function noteSidesLeft(n) {
  openFieldState.sidesLeft = Math.max(0, n | 0);
}

/**
 * СКОЛЬКО ДО НАЧАЛА СУЖЕНИЯ. Зовётся сценой каждый кадр — часы боя знает она.
 *
 * ⚠️ ПИШЕМ ТОЛЬКО ПРИ ИЗМЕНЕНИИ, по той же причине, что у лидера: это реактивное
 *    состояние, и одно и то же значение шестьдесят раз в секунду пересчитывало бы
 *    надписи ни за чем.
 *
 * @param {number|null} n целые секунды до начала; null — показывать нечего
 */
export function noteClosingIn(n) {
  const v = n === null || n === undefined ? null : Math.max(0, n | 0);
  if (openFieldState.closingIn !== v) openFieldState.closingIn = v;
}

/**
 * КТО ЛИДЕР И ГДЕ ОН. Зовётся сценой каждый кадр — она одна знает и корону, и
 * камеру.
 *
 * ⚠️ ПИШЕМ ТОЛЬКО ПРИ ИЗМЕНЕНИИ. Это реактивное состояние: положи в него то же
 *    самое шестьдесят раз в секунду — и надписи будут пересчитываться шестьдесят
 *    раз в секунду ни за чем. Уголок сравнивается по значениям, а не по ссылке:
 *    объект сцена собирает заново на каждый кадр.
 *
 * @param {string|null} name позывной стороны-лидера (null — короны нет)
 * @param {boolean} mine     корона на стороне игрока
 * @param {{x:number,y:number,angle:number}|null} edge где уголок, если за кадром
 */
export function noteLeader(name, mine, edge) {
  if (openFieldState.leaderName !== name) openFieldState.leaderName = name;
  if (openFieldState.leaderMine !== mine) openFieldState.leaderMine = mine;
  const cur = openFieldState.leaderEdge;
  if (!edge) { if (cur) openFieldState.leaderEdge = null; return; }
  if (!cur || cur.x !== edge.x || cur.y !== edge.y || cur.angle !== edge.angle) {
    openFieldState.leaderEdge = edge;
  }
}

/**
 * СВОЯ СТОРОНА ПАЛА, А ПОЛЕ ЖИВЁТ. Место берётся здесь и с этого мига НЕ
 * МЕНЯЕТСЯ: чужие стороны доигрывают между собой, но все они и так выше нас, и
 * подвинуть наше место не может ничто.
 *
 * ⚠️ ЭТО НЕ КОНЕЦ. Панели итога тут нет намеренно: поверх боя встаёт узкая
 *    полоса с местом и дверью, а полная панель ждёт либо конца поля, либо того,
 *    что игрок сам нажмёт «уйти». Показать итог сейчас значило бы сказать «всё
 *    кончилось» над полем, которое ещё дерётся.
 *
 * `livingSides` — сколько ЧУЖИХ сторон живо в этот момент (см. finishOpenField).
 */
export function outOfOpenField(livingSides) {
  openFieldState.phase = 'spectate';
  openFieldState.outcome = 'out';
  openFieldState.place = { n: placeOnElimination(livingSides), of: openFieldState.sides };
}

/**
 * ВСЁ КОНЧИЛОСЬ. Либо сторона игрока осталась одна (победа), либо поле доиграло
 * до одной стороны, пока игрок смотрел, либо он ушёл сам.
 *
 * `livingSides` — сколько сторон живо В ЭТОТ МОМЕНТ, НЕ СЧИТАЯ сторону игрока.
 * Победителю их ноль, и правило само даёт первое место.
 *
 * ⚠️ ЗАМОРОЖЕННОЕ МЕСТО НЕ ПЕРЕСЧИТЫВАЕТСЯ. Пришли сюда из досмотра — место уже
 *    взято в миг гибели своей стороны, и второй расчёт мог бы дать другое число
 *    там, где оно обязано быть одним (полоса поверх боя показала его игроку
 *    минуту назад). Победа — единственное исключение: своя сторона не падала
 *    вовсе, замораживать было нечего.
 *
 * @param {boolean} won выстояла ли сторона игрока
 * @param {number} livingSides сколько чужих сторон живо
 * @param {string|null} [winnerName] позывной победителя — только когда поле
 *        ДОИГРАЛО. Ушёл по «уйти» — победителя ещё нет, и сюда идёт null.
 */
export function finishOpenField(won, livingSides, winnerName = null) {
  openFieldState.phase = 'done';
  openFieldState.outcome = won ? 'victory' : 'out';
  if (won || !openFieldState.place) {
    openFieldState.place = { n: placeOnElimination(livingSides), of: openFieldState.sides };
  }
  openFieldState.winnerName = winnerName || null;
}

/** Уйти из режима — гасит надписи. Зовётся при уходе с арены. */
export function endOpenField() {
  openFieldState.active = false;
  openFieldState.phase = 'fight';
  openFieldState.place = null;
  openFieldState.outcome = null;
  openFieldState.shortBy = 0;
  openFieldState.winnerName = null;
  clearLeader();
  openFieldState.closingIn = null;
}
