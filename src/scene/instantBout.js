// instantBout.js — БОЙ БЕЗ СЦЕНЫ. Тот же бой, что игрок видит глазами, только
// посчитанный быстрым шагом: без отрисовки, без камеры и без реального времени.
//
// ЗАЧЕМ. В турнире COLLAPSE шестнадцать сторон, а игрок дерётся в одной паре.
// Остальные пары должны сойтись по тем же правилам — иначе поле вокруг игрока
// живёт по другой игре, и «я прошёл сквозь поле» превращается в лотерею.
//
// ⚠️ ЭТО НЕ ФОРМУЛА И НЕ УПРОЩЁННАЯ КОПИЯ. Здесь нет ни одного своего правила
//    боя. Боец — тот же buildFighter, выбор цели — то же battleField, обвязка и
//    накал — тот же boutCore, числа — тот же combatBalance. Заводить здесь свою
//    арифметику («у кого больше сила — тот и выиграл») НЕЛЬЗЯ: тогда мгновенный
//    бой начнёт расходиться с тем, что игрок видит, и разойдётся молча.
//
// ЧЕМ ОТЛИЧАЕТСЯ ОТ СЦЕНЫ — ровно тремя вещами, и все три ничего не решают:
//   1. Время синтетическое: шаг ровно 1/60 секунды, а не то, что успел браузер.
//      1/60 — шаг настольной сцены (на телефоне сцена идёт 30 кадров/с, и бой
//      там уже считается вдвое реже; значит бой к шагу не привязан).
//   2. Камера — пустышка. Настоящая нужна бойцу только чтобы развернуть к ней
//      плашку здоровья и искру удара; обе молчат, если камеры нет.
//   3. Ничего не рисуется и не добавляется в сцену — тела живут в памяти и
//      разбираются в конце.
//
// ⚠️ МОЗГ ВСЕГДА СПИННОЙ. Мгновенный бой к думающей модели не обращается ни при
//    каких признаках: правило раздачи модели — «в паре у обоих, на большом поле
//    ни у кого», а пятнадцать мгновенных боёв за турнир сожгли бы потолок
//    обращений и деньги. Признак из адресной строки сюда не доходит вовсе.
//
// Экспортирует: runInstantBout, runInstantBoutSliced, INSTANT_DT.

import * as THREE from 'three';
import { buildFighter } from './buildFighter.js';
import { createBattleField } from './battleField.js';
import { createBoutClocks, boutHooks, separateBodies, BODY_GAP } from './boutCore.js';
import { PLATFORM } from './buildArena.js';
import { COMBAT_BALANCE } from '@/data/combatBalance.js';

/** Шаг времени — кадр настольной сцены. См. причину в шапке. */
export const INSTANT_DT = 1 / 60;

/**
 * Потолок длины боя. Часы длины добивают любой бой задолго до этого (потолок
 * урона ×6 с 45-й секунды), поэтому сюда мы не приходим никогда. Это страховка
 * от зависшего цикла, а не правило игры: досюда дошли — бой отдаётся тому, у
 * кого больше здоровья, и это видно в отчёте по полю `capped`.
 */
const MAX_SEC = 240;

/**
 * Границы плиты — те же, что считает сцена: половина плиты минус запас, чтобы
 * ступни не съезжали с края. Читаются из размеров арены, а не пишутся числом:
 * поменяется плита — мгновенный бой поедет за ней, а не разойдётся с ней.
 */
const NAV_MARGIN = 0.5;
export const INSTANT_BOUNDS = {
  x: PLATFORM.width / 2 - NAV_MARGIN,
  z: PLATFORM.outerZ - NAV_MARGIN,
};

// Камера-пустышка. Настоящая нужна бойцу дважды, и оба раза — чтобы что-то
// развернуть к зрителю: плашка здоровья (она сама отказывается работать без
// перспективной камеры) и искра удара (ей нужен только поворот). Обычный
// Object3D даёт поворот и не выдаёт себя за перспективную — значит плашка
// молчит, искра разворачивается в никуда, а бой идёт как шёл.
const STUB_CAM = new THREE.Object3D();

const gapOf = (a, b) => ((a.isBoss || b.isBoss) ? COMBAT_BALANCE.raid.bossBodyGap : BODY_GAP);

/**
 * @typedef {object} InstantSpec
 * @property {string} sideId  за какую сторону дерётся
 * @property {string} coreId  ядро — оно задаёт правило выбора цели
 * @property {object} behavior разрешённый характер (resolveBehavior / composeFoe)
 * @property {{x:number,z:number}} pos точка выхода на плиту
 * @property {number} [startHp] с каким здоровьем выходит; нет — полное
 * @property {string} [side] 'player' | 'opponent' — сторона плиты (влияет на
 *                    разворот тела при сборке, не на бой)
 */

/**
 * Собрать бой и вернуть шагомер. Внутренность общая у мгновенного прогона и у
 * прогона по кусочкам — второй только шагает не всё сразу.
 */
function makeBout(specs, {
  endRule = null,
  // ГРАНИЦЫ ПЛИТЫ — необязательны. Не переданы (турнир и всё, что было до
  // открытого поля) — берутся границы боевой плиты, ровно как брались.
  //
  // ⚠️ ДО ЭТОЙ ПРАВКИ ГРАНИЦЫ БЫЛИ ЗАШИТЫ. Открытому полю нужны свои: его плита
  //    в разы больше боевой, и на маленьких границах двадцать тел сошлись бы в
  //    середину, а замер длины мерил бы не тот бой, который игрок видит.
  bounds = INSTANT_BOUNDS,
  // Радиус внимания — правило ОДНОГО режима (см. battleField). Не передан —
  // выбор цели идёт прежним путём, и турнир считается ровно как считался.
  attentionRadius = null,
  // Порог часов ДЛИНЫ боя. Не передан — общий, на котором стоит турнир.
  escalateStartSec = COMBAT_BALANCE.escalateStartSec,
  // ОКОШКО ДЛЯ ЗАМЕРА: зовётся после каждого шага с текущим временем и живыми
  // телами. Не передан — не зовётся, и шаг остаётся ровно таким, каким был.
  //
  // ЗАЧЕМ. Итог боя отвечает только «кто выиграл и за сколько». Приёмка режима
  // спрашивает другое: когда прошёл первый удар, какое место занял игрок, не
  // завис ли кто-то на месте. Всё это видно ТОЛЬКО по ходу боя. Без окошка замер
  // пришлось бы собрать из тех же деталей отдельно — то есть завести вторую
  // запись правил боя, а это ровно то, чего этот файл не допускает.
  onStep = null,
} = {}) {
  const field = createBattleField({ attentionRadius });
  if (endRule) field.setEndRule(endRule);
  let now = 0;
  const clocks = createBoutClocks({
    now: () => now,
    // Порог часов длины. Общий у турнира; свой — у рейда и у открытого поля, и
    // тогда он приходит сюда числом.
    startSec: () => escalateStartSec,
  });

  const units = [];
  for (const spec of specs) {
    const unit = field.add({ sideId: spec.sideId, isBot: true, coreId: spec.coreId });
    unit.isBoss = !!spec.isBoss;
    unit.f = buildFighter(spec.color || '#FF0069', {
      side: spec.side || 'player',
      coreId: spec.coreId,
      behavior: spec.behavior,
      startHp: spec.startHp,
      bounds,
      ...boutHooks({ field, unit, clocks }),
      brain: 'spinal',       // см. шапку: модель сюда не ходит никогда
      portrait: [],
      requestModelIntention: null,
      onEliminated: () => { field.kill(unit); },
    });
    unit.f.group.position.set(spec.pos.x, 0, spec.pos.z);
    unit.f.setAI(true);
    units.push(unit);
  }
  clocks.startBout();

  /** Шагнуть n раз. Возвращает true, когда бой кончился. */
  const step = (n) => {
    for (let i = 0; i < n; i++) {
      now += INSTANT_DT;
      const alive = field.living();
      for (const u of alive) u.f.update(now, STUB_CAM);
      // Расталкивание — как на сцене, и с тем же условием: при двух телах не
      // зовётся вовсе, иначе бой один на один считался бы иначе.
      if (alive.length > 2) separateBodies(alive, bounds, gapOf);
      if (onStep) onStep(now, alive, field);
      if (field.isOver() || now >= MAX_SEC) return true;
    }
    return false;
  };

  const finish = () => {
    const capped = now >= MAX_SEC;
    let winner = field.winnerSide();
    if (capped) {
      // Страховка (сюда не приходим): отдаём тому, у кого больше здоровья.
      let best = null;
      for (const u of field.living()) if (!best || u.f.getHp() > best.f.getHp()) best = u;
      winner = best ? best.sideId : winner;
    }
    const out = {
      winner,
      sec: now,
      capped,
      units: units.map((u) => ({
        sideId: u.sideId,
        dead: !!u.dead,
        hp: u.dead ? 0 : Math.max(0, u.f.getHp()),
        maxHp: u.f.maxHp,
      })),
    };
    for (const u of units) { try { u.f.dispose(); } catch (_) { /* тело уже разобрано */ } }
    field.reset();
    return out;
  };

  return { step, finish };
}

/**
 * Посчитать бой целиком, здесь и сейчас.
 *
 * ⚠️ Занимает время: пара ≈ 85 мс, восьмеро ≈ 210 мс. Из живого экрана зови
 *    runInstantBoutSliced — этот прогон подвесит кадр.
 *
 * @param {InstantSpec[]} specs
 * @returns {{winner:string|null, sec:number, capped:boolean, units:object[]}}
 */
export function runInstantBout(specs, opts = {}) {
  const bout = makeBout(specs, opts);
  const maxSteps = Math.ceil(MAX_SEC / INSTANT_DT) + 1;
  for (let i = 0; i < maxSteps; i++) if (bout.step(1)) break;
  return bout.finish();
}

/**
 * То же самое, но ПО КУСОЧКАМ — чтобы экран не замирал.
 *
 * Шагает порциями под часами: пока порция укладывается в отведённые ей
 * миллисекунды, шаги идут; кончился бюджет — отпускаем поток до следующего
 * раза. Ждать нечего: в игре это считается, пока игрок смотрит свой бой, а он
 * длится минуту.
 *
 * @param {InstantSpec[]} specs
 * @param {object} o
 * @param {number} [o.budgetMs] сколько миллисекунд на порцию
 * @returns {{promise: Promise<object>, cancel: () => void}}
 */
export function runInstantBoutSliced(specs, { budgetMs = 4, ...opts } = {}) {
  const bout = makeBout(specs, opts);
  let cancelled = false;
  let timer = null;
  const promise = new Promise((resolve) => {
    const chunk = () => {
      timer = null;
      if (cancelled) { resolve(bout.finish()); return; }
      const until = performance.now() + budgetMs;
      let done = false;
      // Шагаем пачками по 8: спрашивать часы на каждый шаг дороже самого шага.
      while (performance.now() < until) { if (bout.step(8)) { done = true; break; } }
      if (done) { resolve(bout.finish()); return; }
      timer = setTimeout(chunk, 0);
    };
    timer = setTimeout(chunk, 0);
  });
  return {
    promise,
    cancel: () => { cancelled = true; if (timer) { clearTimeout(timer); timer = null; } },
  };
}
