// buffStock.js — ЗАПАС БАФФОВ. ТОЛЬКО ДЛЯ МАГАЗИНА.
//
// ⚠️ БОЙ СЮДА БОЛЬШЕ НЕ ЗАГЛЯДЫВАЕТ (ТЗ 27.09.2026). У каждого игрока перед
//    любым боем полный набор — по одному TOWEL, BUCKET и DICE, — и собирает его
//    services/buffs.js константой, ничего не читая и ничего не списывая.
//    Решение 22.09 «баффы покупаются в домашнем магазине за LASH» отменено
//    владельцем до балансировки всех систем после демо 30.09.
//
//    Файл оставлен живым, потому что магазин (components/home/HomeShop.vue) его
//    ещё зовёт: магазин по отдельному указанию не трогали, он закрыт печатью
//    SOON и нажатий не принимает. То есть запас сейчас НИКТО НЕ ЧИТАЕТ, кроме
//    самого магазина, и ни на что в бою не влияет.
//
// ЧТО ОТСЮДА УДАЛЕНО И ПОЧЕМУ ЭТО ВАЖНО. Вместе с покупкой ушли readKit,
// writeKit, spendFromStock и defaultKitFrom — у всех четырёх не осталось ни
// одного вызова. Последняя из них и была ПРИЧИНОЙ дефекта «два полотенца и ни
// одного кубика»: собирая набор, она первым проходом брала по одному каждого
// вида, а вторым добивала пустые ячейки ЧЕМ ОСТАЛОСЬ. Стартовый подарок — по
// две штуки, один раз за всё время; кубик игрок бросает чаще прочего, и как
// только кубики кончались, в третью ячейку честно вставало ВТОРОЕ ПОЛОТЕНЦЕ —
// и так каждый следующий бой. Оставить её мёртвой значило оставить грабли.
//
// ГДЕ ЛЕЖИТ. В том же слое прогресса, что ростер и тренировка
// (services/playerProgress.js), своим разделом `buffs`.
//
// ⚠️ ФОРМА РАЗДЕЛА НЕ МЕНЯЛАСЬ. Поле `kit` в сохранённых данных больше никто не
//    читает, но и не стирается: переписывать чужие сохранения ради уборки
//    нельзя, а стоит оно ноль.
//
// Экспортирует: readStock, addToStock, ensureStarterStock.
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

