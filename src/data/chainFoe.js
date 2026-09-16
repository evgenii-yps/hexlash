// chainFoe.js — СОПЕРНИК ЗАБЕГА. Кто выходит драться в раунде N.
//
// ЗАЧЕМ ОТДЕЛЬНЫЙ ФАЙЛ. Сборка соперника — правило игры, а не часть сцены. Живя
// внутри арены, оно лежало бы в защищённом файле, где живёт бой: туда лишнего не
// носят, и проверить его там можно только глазами через целый бой. Здесь это
// обычная функция — её видно, её можно посчитать, и арена только зовёт её.
//
// ПУТЬ ТОТ ЖЕ, ЧТО У БОЙЦА ИГРОКА. Дерево ядра собирает buildTree, характер
// разрешает resolveBehavior — ровно те же две ступени, по которым идёт боец
// игрока. Своего пути у забега нет, и в этом смысл: соперник не «другая порода»,
// а такой же боец, просто собранный игрой, а не игроком.
//
// Экспортирует: composeChainFoe, randomLitIds.
import { CORES, CRYSTALS } from './upgradeData.js';
import { buildTree, countLit } from './upgradeTree.js';
import { resolveBehavior } from './behavior.js';
import { pickCallsign } from './callsigns.js';
import { COMBAT_BALANCE } from './combatBalance.js';

/**
 * N случайных граней дерева ядра в той форме, которую понимает buildTree
 * ({ ветка: [номера граней] }).
 *
 * Перемешиваем весь список и берём первые N. Оба потолка — запас очков и предел
 * ветки — накладывает сам buildTree, поэтому перебрать здесь нельзя даже ошибкой.
 */
export function randomLitIds(coreId, n, rnd = Math.random) {
  if (!(n > 0)) return null;
  const all = [];
  for (const cr of CRYSTALS[coreId] || []) {
    for (const f of cr.faces || []) if (f.state === 'open') all.push({ cr: cr.id, f: f.id });
  }
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  const out = {};
  for (const pick of all.slice(0, n)) (out[pick.cr] = out[pick.cr] || []).push(pick.f);
  return out;
}

/**
 * Собрать соперника раунда.
 *
 * @param {object} o
 * @param {number} o.round      номер раунда, 1-based — от него поправка силы
 * @param {number} o.litCount   сколько граней у бойца игрока — столько же у соперника
 * @param {string|null} o.lastCoreId  ядро прошлого раунда — подряд не повторяем
 * @returns {{ coreId, tree, behavior, name, litCount, bonus }}
 */
export function composeChainFoe({ round = 1, litCount = 0, lastCoreId = null, rnd = Math.random } = {}) {
  // Ядро случайное, но не то же, что в прошлом раунде. С ядром игрока совпасть
  // может — это разрешено.
  const pool = CORES.filter((c) => c.id !== lastCoreId);
  const src = pool.length ? pool : CORES;
  const coreId = src[Math.floor(rnd() * src.length)].id;

  const tree = buildTree(coreId, randomLitIds(coreId, litCount, rnd)) || CRYSTALS[coreId];
  const lit = [];
  for (const cr of tree || []) for (const f of cr.faces || []) if (f.state === 'lit') lit.push(f);
  const behavior = resolveBehavior(coreId, lit);

  // ПОПРАВКА РАУНДА — в тот же лист характеристик, куда идут грани, и той же
  // долей. Знак отрицательный: первые раунды соперник СЛАБЕЕ игрока. Он выходит
  // свежим, а боец игрока — с остатком прошлого боя; равный соперник в каждом
  // раунде делает забег почти непроходимым.
  const bonus = COMBAT_BALANCE.chain.roundBonus[round - 1] || 0;
  behavior.statBonuses.strikePower += bonus;
  behavior.statBonuses.toughness += bonus;

  return { coreId, tree, behavior, name: pickCallsign([]), litCount: countLit(tree), bonus };
}
