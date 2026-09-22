// lash.js — СЧЁТ LASH. Сколько у игрока монет, и как они прибывают и убывают.
//
// ГДЕ ЛЕЖИТ. В том же слое прогресса, что ростер, тренировка и запас баффов
// (services/playerProgress.js), своим разделом `lash`. Файл прогресса при этом
// не правится — он для того и сделан с именованными разделами.
//
// ⚠️ ПЕРЕЖИВАЕТ ОБНОВЛЕНИЕ СТРАНИЦЫ, УМИРАЕТ С ВКЛАДКОЙ. Это решение владельца
//    (22.09.2026), а не недоделка: прогресс гостя временный по договору, и
//    привязка к аккаунту — отдельная работа после демо. Строку ТЗ «переживает
//    закрытие игры» владелец разрешил читать так же, как её читает запас баффов.
//
// ⚠️ СЧЁТ НЕ УХОДИТ В МИНУС. Ни списание, ни испорченные данные не могут дать
//    отрицательное число: всё, что приходит извне, приводится к целому ≥ 0.
//
// ⚠️ $HEX ЗДЕСЬ НЕТ И НЕ БУДЕТ. Обмена между валютами не существует: $HEX платит
//    за внешний вид, LASH — за баффы, а баффы трогают бой. Причина — в шапке
//    data/lashBalance.js.
//
// Экспортирует: ensureStarterLash, readLash, addLash, spendLash.
import { readSection, writeSection } from './playerProgress.js';
import { LASH } from '@/data/lashBalance.js';

const SECTION = 'lash';

/** Целое ≥ 0 из чего угодно. Мусор — это ноль, а не поломка. */
const sane = (n) => (Number.isFinite(n) && n > 0 ? Math.floor(n) : 0);

function read() {
  const raw = readSection(SECTION);
  return {
    balance: raw ? sane(raw.balance) : 0,
    granted: raw ? raw.granted === true : false,
  };
}

function write(next) {
  writeSection(SECTION, { balance: sane(next.balance), granted: next.granted === true });
}

/**
 * СТАРТОВЫЕ МОНЕТЫ — РОВНО ОДИН РАЗ. Отметка `granted` нужна затем, что иначе
 * игрок, потративший всё до нуля, получал бы подарок заново на каждом заходе, и
 * монеты стали бы бесконечными. Проверять «счёт пуст» нельзя по той же причине.
 * Та же отметка, по той же причине, стоит у стартового запаса баффов.
 */
export function ensureStarterLash() {
  const cur = read();
  if (cur.granted) return cur.balance;
  const balance = cur.balance + LASH.starterBalance;
  write({ balance, granted: true });
  return balance;
}

/** Сколько монет сейчас. */
export function readLash() {
  return read().balance;
}

/**
 * Начислить. Отрицательное и мусор молча ничего не делают — убавлять счёт умеет
 * только spendLash, и делать это двумя способами нельзя.
 * @returns {number} счёт после начисления
 */
export function addLash(amount) {
  const add = sane(amount);
  const cur = read();
  if (add === 0) return cur.balance;
  const balance = cur.balance + add;
  write({ balance, granted: cur.granted });
  return balance;
}

/**
 * Списать. Возвращает false, если не хватает, — и тогда НИЧЕГО не пишет:
 * «потратил то, чего нет» не должно оставлять следов. Тот же уговор, что у
 * spendFromStock в buffStock.js.
 */
export function spendLash(amount) {
  const cost = sane(amount);
  const cur = read();
  if (cost === 0 || cur.balance < cost) return false;
  write({ balance: cur.balance - cost, granted: cur.granted });
  return true;
}
