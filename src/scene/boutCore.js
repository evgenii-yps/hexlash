// boutCore.js — ОБВЯЗКА БОЯ. Три вещи, без которых бой не идёт, и которые НЕ
// принадлежат ни бойцу, ни полю боя: накал, ниточки от бойца к его цели и
// расталкивание тел.
//
// ЗАЧЕМ ОТДЕЛЬНЫЙ ФАЙЛ. Всё это жило внутри сцены арены, и пока бой шёл только
// на сцене, разницы не было. У турнира COLLAPSE бои чужих пар считаются БЕЗ
// сцены — мгновенно, без отрисовки и без реального времени. Если бы обвязка
// осталась в сцене, мгновенному бою пришлось бы написать её ЗАНОВО — то есть
// завести вторую запись тех же правил. Две такие записи расходятся: одну
// поправят, вторую забудут, и мгновенный бой начнёт считать не то, что игрок
// видит глазами. Поэтому запись одна, и обе стороны берут её отсюда.
//
// ЧТО ЭТОТ ФАЙЛ НЕ ДЕЛАЕТ. Он не знает ни про сцену, ни про камеру, ни про
// режимы. Урон, намерения и моторика остаются внутри бойца и здесь не тронуты:
// отсюда идут только ниточки «кто моя цель» и «насколько горячо».
//
// ⚠️ ПЕРЕНЕСЕНО ДОСЛОВНО из ArenaScene.vue (17.09.2026). Ни одно число, ни одно
//    условие не менялось: на этих правилах стоит принятая глазами длина боя
//    46–57 с, и правка «заодно» сломала бы её молча. Комментарии-причины
//    перенесены вместе с кодом — они и есть записанные решения.
//
// Экспортирует: createBoutClocks, boutHooks, separateBodies.

import * as THREE from 'three';
import { COMBAT_BALANCE } from '@/data/combatBalance.js';
// Заряд кубика. Файл нарочно крошечный и без тяжёлых ввозов — его тянет за собой
// мгновенный бой, считающий чужие пары без сцены. См. шапку buffStrike.js.
import { diceMulFor, noteDiceHit } from '@/services/buffStrike.js';

/**
 * НАКАЛ — ДВА СТОРОЖА, БЕРЁТСЯ БÓЛЬШИЙ. Они закрывают РАЗНЫЕ случаи, и снимать
 * один, починяя другой, нельзя — этим уже один раз сломали длину боя.
 *
 *  1. ЧАСЫ ТИШИНЫ (заведены 19.06.2026, правка 4b63c95d). Против вечной
 *     гляделки: двое терпеливых могли стоять друг против друга бесконечно, а
 *     прежний накал умножал урон — умножать было нечего. Считают время БЕЗ
 *     чистого размена и сбрасываются на каждом попадании.
 *
 *  2. ЧАСЫ ДЛИНЫ БОЯ (решение владельца 16.06.2026; сняты той же правкой 19.06,
 *     возвращены 16.09.2026). Гарантия вилки 45–50 с. Считают время С НАЧАЛА БОЯ
 *     и НЕ сбрасываются на попаданиях — иначе активный, но вязкий бой не
 *     кончается никогда: замер 16.09 показал 78–136 с по парам, а двое стойких
 *     не добились вовсе.
 *
 * Первый сторож не ловит второй случай (размены идут — тишины нет), второй не
 * ловит первый достаточно рано (гляделка длится дольше порога длины). Поэтому
 * оба, и берётся тот, что горячее.
 *
 * Часы длины отмеряются от начала боя, а начало ставится заново на каждый бой —
 * значит в череде боёв (раунды CHAIN, волны COLLAPSE) каждый бой получает свой
 * отсчёт.
 *
 * @param {object} o
 * @param {() => number} o.now      текущее время боя в секундах. Сцена отдаёт
 *                                  время своих часов, мгновенный бой — своё
 *                                  синтетическое: часам всё равно, откуда оно
 * @param {() => number} o.startSec порог часов ДЛИНЫ. Функция, а не число: у
 *                                  рейда свой порог, и он выбирается по режиму
 */
export function createBoutClocks({ now, startSec }) {
  // ⚠️ «БОЙ ИДЁТ» — ОТДЕЛЬНЫЙ ПРИЗНАК, А НЕ «ВРЕМЯ СТАРТА НЕ НОЛЬ».
  //
  //    В сцене этот вопрос решался проверкой самого времени: часы сцены идут от
  //    её сборки, к первому бою там уже накопились секунды, и ноль честно
  //    означал «боя нет». У мгновенного боя своё время, и оно начинается РОВНО С
  //    НУЛЯ — на такой проверке накал молча выключался на весь бой. Замер поймал
  //    это сразу: пара дралась 130 секунд вместо пятидесяти, потому что ни один
  //    из двух сторожей длины не включался.
  //
  //    Признак отвечает на вопрос «бой идёт» прямо, и время старта больше не
  //    обязано быть ненулевым. Для сцены ничего не меняется: до первого боя
  //    признак снят, после startBout — поднят.
  let running = false;
  let fightStartT = 0;   // время начала текущего боя
  let lastExchangeT = 0; // когда в последний раз прошёл чистый размен

  const escalation01 = () => {
    if (!running) return 0; // no bout running → no накал
    const t = now();
    // 1. тишина: время без чистого размена, сбрасывается попаданием
    const silence = t - lastExchangeT;
    const quietOver = silence - COMBAT_BALANCE.escalateSilenceSec;
    const bySilence = quietOver <= 0 ? 0 : Math.min(1, quietOver / COMBAT_BALANCE.escalateRampSec);
    // 2. длина: время с начала боя, не сбрасывается ничем.
    //    У РЕЙДА СВОЙ ПОРОГ: семеро на плите вязнут дольше пары, и на общем пороге
    //    затянувшийся рейд не добивался — замер держал 104-112 с при потолке 100.
    //    Число живёт в блоке raid файла чисел боя; общий порог не тронут, на нём
    //    стоят DUEL, SQUAD, забег и турнир.
    const lengthOver = (t - fightStartT) - startSec();
    const byLength = lengthOver <= 0 ? 0 : Math.min(1, lengthOver / COMBAT_BALANCE.escalateLengthRampSec);
    return Math.max(bySilence, byLength);
  };

  const escalationMult = () => 1 + escalation01() * (COMBAT_BALANCE.escalateMax - 1);
  // A clean exchange landed (real HP dealt, by either side) → reset the silence
  // clock so накал cools.
  const noteExchange = () => { if (running) lastExchangeT = now(); };
  /** Новый бой: оба отсчёта с нуля. Зовётся на КАЖДЫЙ бой, не на заход на арену. */
  const startBout = () => { running = true; fightStartT = now(); lastExchangeT = now(); };
  /** Время с начала боя — бойцу его отдают в контексте. */
  const elapsed = () => (running ? now() - fightStartT : 0);
  const armed = () => running;
  /** Тишина — время без чистого размена. Нужно только служебному показанию. */
  const silence = () => (running ? Math.max(0, now() - lastExchangeT) : 0);

  return { escalation01, escalationMult, noteExchange, startBout, elapsed, armed, silence };
}

/**
 * НИТОЧКИ ОТ БОЙЦА К ЕГО ЦЕЛИ. То, что боец спрашивает у мира: где враг, сколько
 * у него сил, что он сейчас делает, — и то, что боец миру сообщает: я ударил, я
 * промахнулся, я начал замах.
 *
 * Враг здесь не «тот, второй», а ТЕКУЩАЯ ЦЕЛЬ, которую выдаёт поле боя. В бою
 * один на один цель ровно одна — тот самый единственный второй, — поэтому пара
 * дерётся в точности как дралась: ни одна ниточка не меняет смысла, меняется
 * только способ узнать, к кому она ведёт.
 *
 * Расчёт урона не тронут: onImpact передаёт то же, что передавал.
 *
 * @param {object} o
 * @param {object} o.field  поле боя (createBattleField)
 * @param {object} o.unit   запись бойца в поле
 * @param {object} o.clocks часы накала (createBoutClocks)
 * @param {(unit, foe) => ({x,y,z}|null)} [o.steer] ОБХОД УКРЫТИЙ, см. ниже.
 *                          Откуда смотрит сам боец, обход берёт из записи `unit`:
 *                          передать это сюда нельзя — тело ещё не собрано, оно
 *                          как раз и собирается этими ниточками
 * @returns {object} набор обработчиков для buildFighter
 */
export function boutHooks({ field, unit, clocks, steer = null }) {
  // Цель прямо сейчас. Спрашивается на каждое обращение, поэтому смена цели
  // доходит до тела в тот же кадр.
  const foe = () => { const tu = field.targetFor(unit); return tu ? tu.f : null; };
  return {
    // ГДЕ БОЕЦ ВИДИТ ЦЕЛЬ.
    //
    // ⚠️ ОБХОД УКРЫТИЙ ВМЕШИВАЕТСЯ ИМЕННО СЮДА, и это единственное место, где он
    //    вообще касается боя. Пока между бойцом и целью стоит укрытие и идти
    //    далеко, ему называют цель В СТОРОНЕ ОБХОДА — но НА ТОМ ЖЕ РАССТОЯНИИ.
    //    Курс и разворот идут по обходу, а все пороги дальности («дотянулся»,
    //    «шагнуть под удар», «отойти») видят настоящее число. Подробности и
    //    причины — в scene/coverNav.js.
    //
    //    Без `steer` (все режимы, кроме открытого поля) здесь ровно то, что было:
    //    одно обращение к позиции цели.
    getFoePos: () => {
      const x = foe();
      if (!x) return null;
      const p = x.group.position;
      if (!steer) return p;
      return steer(unit, p) || p;
    },
    // attacker's strike damage × накал; foe softens by toughness / block.
    // Real HP dealt → clean exchange → накал resets.
    //
    // КУБИК (баффы, 22.09.2026) ложится СЮДА ЖЕ, рядом с накалом, и по той же
    // причине: это единственное место, где урон бьющего умножается на что-то
    // внешнее. Без заряда diceMulFor возвращает РОВНО ЕДИНИЦУ, и число уходит в
    // takeDamage в точности то же, что уходило.
    //
    // ЗАРЯД ТРАТИТ ТОЛЬКО ПОПАВШИЙ УДАР. Промах и уклон дают ноль снятого
    // здоровья; заблокированный удар здоровье снимает (блок режет примерно
    // вдвое, но не в ноль) — его отличает отметка на самом бойце.
    onImpact: (raw, pen, intr, pt, w) => {
      const x = foe();
      if (!x) return;
      const diceMul = diceMulFor(unit.f);
      const dealt = x.takeDamage(raw * clocks.escalationMult() * diceMul, pen, intr, pt, w);
      if (dealt > 0) clocks.noteExchange();
      if (diceMul !== 1) noteDiceHit(unit.f, dealt, !!(x.wasLastHitBlocked && x.wasLastHitBlocked()));
    },
    // замах: ЗАСАДА рядом разворачивается на него, цель поднимает блок
    onAttackStart: () => { field.noteWindup(unit); foe()?.noteIncomingAttack?.(); },
    // our strike went wide → the foe's КАПКАН counter window
    onMiss: () => foe()?.noteFoeMissed?.(),
    // foe took the bait? (feint payoff)
    getFoeReacting: () => { const x = foe(); return !!(x && (x.isBlocking?.() || x.isDodging?.())); },
    getFightContext: () => ({
      escalation: clocks.escalationMult(),
      escalation01: clocks.escalation01(),
      elapsed: clocks.elapsed(),
    }),
    getFoeStamina: () => { const x = foe(); return x ? x.getStamina01() : null; }, // foe wind (break detector + word memory)
    getFoeHp01: () => { const x = foe(); return x ? x.getHp() / x.maxHp : null; }, // foe health (break detector)
    getFoePhase: () => { const x = foe(); return x && x.getActionPhase ? x.getActionPhase() : 'neutral'; }, // foe action phase → the read subsystem (сбив / контра)
  };
}

/**
 * РАСТАЛКИВАНИЕ ТЕЛ. Боец сам держит дистанцию только от СВОЕЙ цели, поэтому на
 * плите с шестью телами остальные прошли бы друг сквозь друга. Этот проход
 * разводит любые две пересёкшиеся пары.
 *
 * Симметрично: каждого сдвигаем на половину нехватки, чтобы никто не имел
 * преимущества в пересчёте.
 *
 * ⚠️ ПРИ ДВУХ ТЕЛАХ ЗВАТЬ НЕ НАДО ВОВСЕ: пару и так держит врозь сам боец, и
 *    лишний проход означал бы, что бой один на один стал считаться иначе.
 *    Проверку числа тел делает тот, кто зовёт.
 *
 * @param {object[]} list   живые бойцы поля (записи с .f)
 * @param {object} bounds   границы плиты { x, z }
 * @param {(a,b)=>number} gapOf просвет для пары. Пара с боссом расходится шире —
 *                        он крупнее обычного тела и на общем просвете входил бы
 *                        в соседей; общий просвет при этом не тронут, на нём
 *                        стоит бой один на один
 */
export function separateBodies(list, bounds, gapOf) {
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i].f.group.position;
      const b = list[j].f.group.position;
      const gap = gapOf(list[i], list[j]);
      let dx = a.x - b.x, dz = a.z - b.z;
      let d = Math.hypot(dx, dz);
      if (d >= gap - 1e-4) continue;          // уже врозь — не трогаем
      if (d < 1e-4) { dx = (i % 2 ? 1 : -1) * 1e-3; dz = 1e-3; d = Math.hypot(dx, dz); } // совпали точка в точку
      const push = (gap - d) / 2;
      const ux = dx / d, uz = dz / d;
      a.x = THREE.MathUtils.clamp(a.x + ux * push, -bounds.x, bounds.x);
      a.z = THREE.MathUtils.clamp(a.z + uz * push, -bounds.z, bounds.z);
      b.x = THREE.MathUtils.clamp(b.x - ux * push, -bounds.x, bounds.x);
      b.z = THREE.MathUtils.clamp(b.z - uz * push, -bounds.z, bounds.z);
    }
  }
}

/** Общий просвет тел — тот, на котором стоит бой один на один. */
export const BODY_GAP = COMBAT_BALANCE.field.bodyGap;
