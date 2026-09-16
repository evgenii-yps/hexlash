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
// Экспортирует: composeFoe, composeChainFoe, composeSquadFoes, composeRaid, randomLitIds.
import { CORES, CRYSTALS } from './upgradeData.js';
import { buildTree, countLit } from './upgradeTree.js';
import { resolveBehavior } from './behavior.js';
import { pickCallsign } from './callsigns.js';
import { COMBAT_BALANCE, toughnessBonusFor } from './combatBalance.js';

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
 * @param {number}  o.bonus      доля к силе удара И прочности СРАЗУ, в тот же лист
 *                               характеристик, куда идут грани. Отрицательная — соперник
 *                               слабее игрока. Так работает поправка раунда забега
 * @param {number}  o.powerBonus доля ТОЛЬКО к силе удара, поверх `bonus`
 * @param {number}  o.toughBonus доля ТОЛЬКО к прочности, поверх `bonus`
 * @param {string[]} o.takenNames позывные, уже занятые на этой стороне
 * @returns {{ coreId, tree, behavior, name, litCount, bonus }}
 *
 * ⚠️ РАЗДЕЛЬНЫЕ НАДБАВКИ ЗАВЕДЕНЫ ДЛЯ БОССА РЕЙДА. Забегу нужна одна поправка сразу
 *    на обе характеристики — соперник просто слабее целиком; боссу нужна большая
 *    броня при обычном ударе. Одним числом это не выражается, поэтому рядом с `bonus`
 *    стоят две отдельные доли. Ноль по умолчанию — забег ничего не заметил.
 */
export function composeFoe({ litCount = 0, avoidCore = null, bonus = 0, powerBonus = 0, toughBonus = 0, takenNames = [], rnd = Math.random } = {}) {
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
  if (powerBonus) behavior.statBonuses.strikePower += powerBonus;
  if (toughBonus) behavior.statBonuses.toughness += toughBonus;

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

/**
 * СОСТАВ РЕЙДА целиком — и союзники игрока, и сторона босса. Одним вызовом, а не
 * тремя: позывные не должны повторяться НИ У КОГО на плите, а для этого занятые
 * имена надо вести одним списком. Разбей это на три вызова — и список придётся
 * тащить между ними руками, то есть завести то же самое, но снаружи и хрупко.
 *
 * ГРАНИ У ВСЕХ — КАК У БОЙЦА ИГРОКА. В рейде сторона игрока не «команда против
 * команды», а один игрок с тремя помощниками: помощники равны ему, охрана равна
 * ему, и босс тоже — босс отличается бронёй и размером, а не набором граней.
 * Среднего по составу, как в SQUAD, здесь считать не из чего: боец игрока один.
 *
 * БОСС — ОБЫЧНЫЙ БОЕЦ С БОЛЬШОЙ БРОНЁЙ. Ядро случайное, дерево по тем же
 * правилам, тот же сборщик. Живучесть и урон идут В ЛИСТ ХАРАКТЕРИСТИК, туда же,
 * куда грани, — отдельного скрытого правила у него нет (решение владельца).
 *
 * @param {number} litCount сколько граней зажжено у бойца игрока
 * @returns {{ allies: object[], boss: object, guards: object[] }}
 */
export function composeRaid({ litCount = 0, rnd = Math.random } = {}) {
  const R = COMBAT_BALANCE.raid;
  const taken = [];
  const one = (extra = {}) => {
    const f = composeFoe({ litCount, takenNames: taken, rnd, ...extra });
    taken.push(f.name);
    return f;
  };

  const allies = [];
  for (let i = 0; i < R.allies; i++) allies.push(one());

  // Босс собирается ПЕРВЫМ на своей стороне — и в этом списке, и на плите.
  // Причина в выборе цели: ONSLAUGHT берёт самого слабого по здоровью, BULWARK —
  // самого сильного по удару, а в первом кадре все чужие целы и (при нулевой
  // надбавке урона) равны. Оба правила упираются в ничью и берут ПЕРВОГО в
  // списке врагов, а выбранная цель дальше держится до её гибели. Значит тот,
  // кто вышел первым, и есть тот, кого команда будет бить весь бой.
  const boss = one({
    toughBonus: toughnessBonusFor(R.bossDurability),
    powerBonus: R.bossPowerBonus,
  });
  boss.isBoss = true;

  const guards = [];
  for (let i = 0; i < R.guards; i++) guards.push(one());

  return { allies, boss, guards };
}
