// foeCompose.js — КТО ВЫХОДИТ ДРАТЬСЯ ПРОТИВ ИГРОКА. Сборка соперника-бота.
//
// ЗАЧЕМ ОТДЕЛЬНЫЙ ФАЙЛ. Сборка соперника — правило игры, а не часть сцены. Живя
// внутри арены, оно лежало бы в защищённом файле, где живёт бой: туда лишнего не
// носят, и проверить его там можно только глазами через целый бой. Здесь это
// обычная функция — её видно, её можно посчитать, и арена только зовёт её.
//
// ПУТЬ ТОТ ЖЕ, ЧТО У БОЙЦА ИГРОКА. Дерево ядра собирает buildTree, характер
// разрешает resolveBehavior — ровно те же две ступени, по которым идёт боец
// игрока. Своего пути у ботов нет, и в этом смысл: соперник не «другая порода»,
// а такой же боец, просто собранный игрой, а не игроком.
//
// ОДИН ПРИМИТИВ, ДВЕ ОБЁРТКИ. `composeFoe` собирает одного бойца. Забег и
// команда просят у него разное — забегу нужна поправка раунда и запрет повторить
// прошлое ядро, команде ни того, ни другого, — но собирается боец одинаково.
// Файл назывался chainFoe.js, пока просящий был один.
//
// Экспортирует: composeFoe, composeChainFoe, composeSquadFoes, randomLitIds.
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
 * Собрать одного соперника.
 *
 * @param {object} o
 * @param {number}  o.litCount   сколько граней зажечь — столько же, сколько у игрока
 * @param {string?} o.avoidCore  это ядро не брать (забегу — чтобы не повторить прошлый раунд)
 * @param {number}  o.bonus      доля к силе удара И прочности, в тот же лист характеристик,
 *                               куда идут грани. Отрицательная — соперник слабее игрока
 * @param {string[]} o.takenNames позывные, уже занятые на этой стороне
 * @returns {{ coreId, tree, behavior, name, litCount, bonus }}
 */
export function composeFoe({ litCount = 0, avoidCore = null, bonus = 0, takenNames = [], rnd = Math.random } = {}) {
  const pool = CORES.filter((c) => c.id !== avoidCore);
  const src = pool.length ? pool : CORES;
  const coreId = src[Math.floor(rnd() * src.length)].id;

  const tree = buildTree(coreId, randomLitIds(coreId, litCount, rnd)) || CRYSTALS[coreId];
  const lit = [];
  for (const cr of tree || []) for (const f of cr.faces || []) if (f.state === 'lit') lit.push(f);
  const behavior = resolveBehavior(coreId, lit);

  if (bonus) {
    behavior.statBonuses.strikePower += bonus;
    behavior.statBonuses.toughness += bonus;
  }

  return { coreId, tree, behavior, name: pickCallsign(takenNames), litCount: countLit(tree), bonus };
}

/**
 * Соперник раунда ЗАБЕГА.
 *
 * ПОПРАВКА РАУНДА — в тот же лист характеристик, куда идут грани, и той же долей.
 * Знак отрицательный: соперник СЛАБЕЕ игрока. Он выходит свежим, а боец игрока —
 * с остатком прошлого боя; равный соперник в каждом раунде делает забег почти
 * непроходимым (замерено: 0 прохождений из 20).
 *
 * Ядро не повторяет прошлый раунд. С ядром игрока совпасть может — это разрешено.
 */
export function composeChainFoe({ round = 1, litCount = 0, lastCoreId = null, rnd = Math.random } = {}) {
  return composeFoe({
    litCount,
    avoidCore: lastCoreId,
    bonus: COMBAT_BALANCE.chain.roundBonus[round - 1] || 0,
    rnd,
  });
}

/**
 * Чужая сторона для КОМАНДНОГО боя — столько бойцов, сколько у игрока.
 *
 * Отличия от забега, оба намеренные:
 *   • ядра могут повторяться — это разные бойцы одной команды, а не череда
 *     соперников, и две «Скалы» в команде читаются как выбор соперника, не как
 *     сбой;
 *   • поправки нет: команда против команды идёт на равных, а разница берётся из
 *     граней.
 *
 * Граней у каждого — СРЕДНЕЕ по составу игрока, вниз. Не сумма и не максимум:
 * сторона должна быть равной стороне, а не сильнейшему в ней.
 *
 * @param {number} count      сколько бойцов
 * @param {number[]} playerLit сколько граней у каждого бойца игрока
 */
export function composeSquadFoes(count, playerLit = [], rnd = Math.random) {
  const avg = playerLit.length
    ? Math.floor(playerLit.reduce((a, b) => a + b, 0) / playerLit.length)
    : 0;
  const out = [];
  const taken = [];
  for (let i = 0; i < count; i++) {
    const foe = composeFoe({ litCount: avg, takenNames: taken, rnd });
    taken.push(foe.name);
    out.push(foe);
  }
  return out;
}
