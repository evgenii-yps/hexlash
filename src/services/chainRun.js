// chainRun.js — ЗАБЕГ (CHAIN). Один боец проходит три боя подряд: между боями он
// почти не лечится, а соперники становятся сильнее. Дошёл до конца — забег
// пройден. Проиграл на любом раунде — забег сгорел целиком.
//
// ЗАЧЕМ ОТДЕЛЬНЫЙ ФАЙЛ. Про забег знают трое: арена (собирает раунды), панели
// забега (показывают, что происходит) и ворота (ловят брошенный забег). Держать
// это в арене значило бы, что панели лезут внутрь защищённой сцены за номером
// раунда. Здесь лежит ОДИН ход забега, а каждый читает то, что ему нужно.
//
// ЧТО ЭТОТ ФАЙЛ НЕ ДЕЛАЕТ. Он не знает ни Three.js, ни бойцов, ни урона, ни
// правил сборки соперника. Он считает раунды и здоровье между ними — не больше.
//
// ⚠️ ОТМЕТКА ВО ВКЛАДКЕ — ТОЛЬКО ФАКТ «ЗАБЕГ ИДЁТ», больше ничего. Ни номера
// раунда, ни здоровья: восстанавливать забег с середины мы не обещаем, а
// половина сохранённого забега хуже, чем никакого — следующий читатель примет
// её за настоящий забег. Обновил страницу — забег прерван, и это честно.
//
// Экспортирует: chainState, startRun, winRound, loseRound, advanceRound,
//               clearRunState, endRun, hasStaleRun, takeStaleRun, stakeOf.
import { reactive } from 'vue';
import { COMBAT_BALANCE } from '@/data/combatBalance.js';
import { readSection, writeSection } from '@/services/playerProgress.js';

const CH = COMBAT_BALANCE.chain;
const SECTION = 'chain';

/** Сколько раундов в забеге. Число живёт в таблице поправок — второго нет. */
export const ROUNDS = CH.roundBonus.length;

/**
 * Ход забега — то, что видят панели.
 *   active   — забег идёт (между стартом и любым итогом)
 *   round    — какой раунд дерётся прямо сейчас, 1..ROUNDS
 *   phase    — 'fight' дерутся · 'between' панель между раундами · 'done' итог
 *   outcome  — null пока идёт · 'complete' пройден · 'broken' сгорел
 *   hpBefore / hpAfter — здоровье бойца до и после восстановления (для панели)
 *   nextName — позывной следующего соперника (его показывает панель)
 */
export const chainState = reactive({
  active: false,
  round: 1,
  phase: 'fight',
  outcome: null,
  hpBefore: 0,
  hpAfter: 0,
  nextName: '',
});

// ─── Отметка во вкладке ──────────────────────────────────────────────────────
// Пишется на старте, снимается на любом итоге. Найдена при следующем открытии —
// значит, забег бросили на середине.

function mark(on) {
  writeSection(SECTION, on ? { run: true } : null);
}

/**
 * Брошен ли забег. `skip` — признак деки: она живёт в ТОЙ ЖЕ вкладке и в той же
 * памяти, поэтому без этой оговорки инвестору выпало бы «RUN INTERRUPTED» от
 * чужого забега. Тот же урок, что с признаком показа (15.09).
 */
export function hasStaleRun(skip = false) {
  if (skip) return false;
  const saved = readSection(SECTION);
  return !!(saved && saved.run);
}

/** Забрать факт брошенного забега и стереть отметку. Второй раз вернёт false. */
export function takeStaleRun(skip = false) {
  if (!hasStaleRun(skip)) return false;
  mark(false);
  return true;
}

// ─── Ход забега ──────────────────────────────────────────────────────────────

/** Начать забег. Первый раунд дерётся сразу — панели перед ним нет. */
export function startRun() {
  chainState.active = true;
  chainState.round = 1;
  chainState.phase = 'fight';
  chainState.outcome = null;
  chainState.hpBefore = 0;
  chainState.hpAfter = 0;
  chainState.nextName = '';
  mark(true);
}

/**
 * Раунд выигран. `hpLeft01` — доля здоровья, с которой боец вышел из боя.
 * Последний раунд закрывает забег; остальные уводят на панель.
 * @returns {boolean} true — забег продолжается, false — забег пройден
 */
export function winRound(hpLeft01, next = {}) {
  if (!chainState.active) return false;
  if (chainState.round >= ROUNDS) {
    chainState.phase = 'done';
    chainState.outcome = 'complete';
    mark(false);
    return false;
  }
  // Здоровье в следующий раунд: остаток плюс добавка, но не выше полного.
  const before = clamp01(hpLeft01);
  chainState.hpBefore = pct(before);
  chainState.hpAfter = pct(Math.min(1, before + CH.healBetweenRounds));
  chainState.nextName = next.name || '';
  chainState.phase = 'between';
  return true;
}

/** Раунд проигран — забег сгорел целиком, на каком бы раунде это ни случилось. */
export function loseRound() {
  if (!chainState.active) return;
  chainState.phase = 'done';
  chainState.outcome = 'broken';
  mark(false);
}

/**
 * Игрок нажал NEXT. Переводит забег на следующий раунд и отдаёт стартовое
 * здоровье бойца долей от максимума.
 *
 * ⚠️ Двойное нажатие: переводит ТОЛЬКО из состояния «между раундами». Второе
 * нажатие приходит уже в 'fight' и возвращает null — раунд не запускается дважды.
 * @returns {number|null} стартовое здоровье (доля 0..1) или null, если не время
 */
export function advanceRound() {
  if (!chainState.active || chainState.phase !== 'between') return null;
  chainState.round += 1;
  chainState.phase = 'fight';
  return chainState.hpAfter / 100;
}

/**
 * Погасить ход забега, НЕ ТРОГАЯ ОТМЕТКУ. Нужно обычному бою: состояние живёт в
 * памяти страницы и переживает уход с арены, поэтому заход в DUEL после
 * брошенного забега нашёл бы здесь чужой раунд. Отметку при этом стирать нельзя
 * — по ней ворота и узнают, что забег бросили.
 */
export function clearRunState() {
  chainState.active = false;
  chainState.round = 1;
  chainState.phase = 'fight';
  chainState.outcome = null;
  chainState.nextName = '';
}

/** Забег кончился и игрок ушёл — гасим всё, отметку в том числе. */
export function endRun() {
  clearRunState();
  mark(false);
}

/** Ставка раунда — множитель без валюты: системы наград в игре нет. */
export const stakeOf = (round) => round;

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const pct = (v) => Math.round(v * 100);
