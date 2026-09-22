// buffStock.js — ЗАПАС БАФФОВ И НАБОР «В БОЙ».
//
// Две вещи, которые игрок носит МЕЖДУ боями:
//   · ЗАПАС — сколько штук каждого вида у него есть вообще;
//   · НАБОР — какие три (или меньше) он берёт в ближайший бой.
//
// ГДЕ ЛЕЖИТ. В том же слое прогресса, что ростер и тренировка
// (services/playerProgress.js), своим разделом `buffs`. Файл прогресса при этом
// не правится — он для того и сделан с именованными разделами.
//
// ⚠️ ПЕРЕЖИВАЕТ ОБНОВЛЕНИЕ СТРАНИЦЫ, УМИРАЕТ С ВКЛАДКОЙ. Это решение владельца
//    (22.09.2026), а не недоделка: прогресс гостя временный по договору, и
//    привязка к аккаунту — отдельная работа после демо. Строку ТЗ «переживает
//    закрытие игры» владелец разрешил читать как «переживает перезагрузку».
//
// ПОПОЛНЕНИЕ — ОДНИМ ВХОДОМ. Запас растёт в двух случаях: стартовый подарок и
// покупка в магазине. Оба идут через addToStock — списание монет при этом здесь
// НЕ живёт: про деньги знает services/lash.js, про штуки — этот файл, и мешать
// их в одном месте значит однажды списать монеты, не выдав предмет.
//
// Экспортирует: readStock, readKit, writeKit, spendFromStock, addToStock,
//               defaultKitFrom, ensureStarterStock.
//
// ⚠️ ВОЗВРАТА В ЗАПАС ЗДЕСЬ НЕТ, И ЭТО НЕ ПРОПУСК. Бафф списывается в момент
//    броска, а не перед боем, — значит неиспользованный и не списывался.
//    Возвращать нечего. Почему так, а не иначе, — в шапке buffStartFight
//    (services/buffs.js): списание перед боем теряло баффы на обновлении
//    страницы.
import { readSection, writeSection } from './playerProgress.js';
import { BUFF_IDS, BUFF_BALANCE } from '@/data/buffBalance.js';

const SECTION = 'buffs';

/** Пустой запас — нули по всем видам. Форма одна на все чтения. */
const emptyStock = () => Object.fromEntries(BUFF_IDS.map((id) => [id, 0]));

/**
 * Прочитать раздел целиком и привести к честной форме. Мусор и чужие ключи
 * отбрасываются молча: слой прогресса обещает «данные испорчены — начинаем с
 * чистого», и спорить с ним здесь нечем.
 */
function read() {
  const raw = readSection(SECTION);
  const stock = emptyStock();
  let kit = [];
  let gifted = false;
  if (raw) {
    if (raw.stock && typeof raw.stock === 'object') {
      for (const id of BUFF_IDS) {
        const n = raw.stock[id];
        stock[id] = Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
      }
    }
    if (Array.isArray(raw.kit)) {
      kit = raw.kit.slice(0, BUFF_BALANCE.kitSlots).map((x) => (BUFF_IDS.includes(x) ? x : null));
    }
    gifted = raw.gifted === true;
  }
  while (kit.length < BUFF_BALANCE.kitSlots) kit.push(null);
  return { stock, kit, gifted };
}

function write(next) {
  writeSection(SECTION, { stock: next.stock, kit: next.kit, gifted: next.gifted });
}

/**
 * СТАРТОВЫЙ ПОДАРОК — РОВНО ОДИН РАЗ. Отметка `gifted` нужна затем, что иначе
 * игрок, потративший всё до нуля, получал бы подарок заново на каждом заходе, и
 * баффы стали бы бесконечными. Проверять «запас пуст» нельзя по той же причине.
 */
export function ensureStarterStock() {
  const cur = read();
  if (cur.gifted) return cur.stock;
  const stock = { ...cur.stock };
  for (const id of BUFF_IDS) stock[id] += BUFF_BALANCE.starterStock[id] || 0;
  write({ stock, kit: cur.kit, gifted: true });
  return stock;
}

/**
 * Положить в запас. Единственный путь пополнения, кроме стартового подарка.
 *
 * ⚠️ МОНЕТЫ СПИСЫВАЕТ НЕ ЭТОТ ФАЙЛ. Магазин сперва списывает LASH и только на
 *    успехе зовёт сюда: так «списали, но не выдали» невозможно, а обратный
 *    порядок такую щель оставлял бы.
 *
 * @returns {number} сколько этого вида стало после пополнения
 */
export function addToStock(id, count = 1) {
  const n = Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
  const cur = read();
  if (!BUFF_IDS.includes(id) || n === 0) return cur.stock[id] || 0;
  const stock = { ...cur.stock, [id]: cur.stock[id] + n };
  write({ stock, kit: cur.kit, gifted: cur.gifted });
  return stock[id];
}

/** Сколько чего есть. Всегда полная форма, даже если раздела ещё нет. */
export function readStock() {
  return read().stock;
}

/** Что игрок берёт в бой: три ячейки, в каждой вид баффа или пусто. */
export function readKit() {
  return read().kit;
}

/** Запомнить набор. Лишнее обрезается, чужое становится пустой ячейкой. */
export function writeKit(kit) {
  const cur = read();
  const next = (Array.isArray(kit) ? kit : []).slice(0, BUFF_BALANCE.kitSlots)
    .map((x) => (BUFF_IDS.includes(x) ? x : null));
  while (next.length < BUFF_BALANCE.kitSlots) next.push(null);
  write({ stock: cur.stock, kit: next, gifted: cur.gifted });
  return next;
}

/**
 * Списать одну штуку. Возвращает false, если списывать нечего, — и тогда ничего
 * не пишет: «потратил то, чего нет» не должно оставлять следов.
 */
export function spendFromStock(id) {
  const cur = read();
  if (!BUFF_IDS.includes(id) || cur.stock[id] <= 0) return false;
  const stock = { ...cur.stock, [id]: cur.stock[id] - 1 };
  write({ stock, kit: cur.kit, gifted: cur.gifted });
  return true;
}

/**
 * НАБОР ПО УМОЛЧАНИЮ (правило ТЗ): по одному каждого вида, если есть; иначе —
 * чем есть. Пустой запас — три пустые ячейки, и это нормальный бой без баффов.
 *
 * @param {Record<string, number>} stock
 * @returns {(string|null)[]} ровно kitSlots ячеек
 */
export function defaultKitFrom(stock) {
  const left = { ...stock };
  const kit = [];
  // Первый проход — по одному каждого вида, в порядке предметов.
  for (const id of BUFF_IDS) {
    if (kit.length >= BUFF_BALANCE.kitSlots) break;
    if (left[id] > 0) { kit.push(id); left[id] -= 1; }
  }
  // Второй — добить чем осталось, не привередничая.
  for (const id of BUFF_IDS) {
    while (kit.length < BUFF_BALANCE.kitSlots && left[id] > 0) { kit.push(id); left[id] -= 1; }
  }
  while (kit.length < BUFF_BALANCE.kitSlots) kit.push(null);
  return kit;
}
