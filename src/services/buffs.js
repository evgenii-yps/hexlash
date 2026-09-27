// buffs.js — БАФФЫ В БОЮ. Правила, применение, бот и подача.
//
// ЗАЧЕМ ОТДЕЛЬНЫЙ ФАЙЛ. Про бафф знают трое: панель (она одна знает, как об
// этом сказать), арена (она одна знает, где стоят бойцы и куда тыкнул палец) и
// боец (у него одного есть рычаги). Держать правила внутри арены значило бы,
// что защищённая сцена обрастает продуктовой логикой; держать их в панели —
// что панель лезет в сцену. Поэтому правила здесь, посередине, и ни та ни
// другая сторона про вторую не знает.
//
// ЧТО ЭТОТ ФАЙЛ НЕ ДЕЛАЕТ:
//   · не заводит своих чисел — все в data/buffBalance.js;
//   · не считает урон, здоровье и моторику — это боец;
//   · не решает, кто чья цель, — это поле боя;
//   · не рисует панель и значок — это Vue-компоненты, они читают состояние ниже.
//
// ПРАВИЛА (ТЗ 22.09.2026, работа 2) — все восемь живут здесь:
//   1. до трёх баффов в бой, можно одинаковые;
//   2. на одном бойце одновременно один бафф; пока действует — карта не нажимается;
//   3. разным своим бойцам — одновременно можно;
//   4. сгорает сразу: из набора −1, из запаса −1;
//   5. неиспользованные после боя возвращаются в запас;
//   6. боец пал — остаток эффекта пропадает;
//   7. на павшего бросить нельзя;
//   8. бой кончился во время баффа — эффект просто прекращается;
//   9. после броска карточка в ОТКАТЕ несколько секунд и не нажимается. Откат
//      общий на сторону игрока, у каждого вида свой, запас он не возвращает.
//
// ⚠️ ПОРЯДОК ДЕЙСТВИЙ РАЗВЁРНУТ (ТЗ 26.09.2026). Было: тап по карточке →
//    подсветка своих → тап по бойцу. Стало: боец выбран заранее и всегда, тап по
//    карточке бросает бафф НЕМЕДЛЕННО. Поэтому отсюда ушло всё, что ждало
//    второго тапа: выбранная карточка, подсветка целей, подсказка под панелью,
//    ловля пальца и луч по телам. Палец теперь ловит один файл на всех —
//    services/fighterSelect.js, — и бафф только спрашивает у него, кто выбран.
//
// Экспортирует: buffFightState, hasBuffOn, bindBuffArena, unbindBuffArena, buffStartFight,
//               buffEndFight, buffTick, useBuffCard.
import { reactive, watch } from 'vue';
import * as THREE from 'three';
import { BUFF_IDS, BUFF_META, BUFF_BALANCE, rollDie } from '@/data/buffBalance.js';
import { selectState, selectedUnit } from './fighterSelect.js';
import { DEV_MODE } from './devMode.js';
import { buildTowel, buildBucket, buildDice, buildActionGlow } from '@/scene/buffItems.js';
import {
  armDiceCharge, clearDiceCharge, clearAllDiceCharges, diceChargeOf, watchDiceCharge,
} from './buffStrike.js';
import {
  readStock, readKit, defaultKitFrom, spendFromStock, ensureStarterStock, writeKit,
} from './buffStock.js';
// БОЙ-НАСТРОЙКА SPAR. Там баффы БЕСПЛАТНЫЕ И БЕСКОНЕЧНЫЕ обеим сторонам (решение
// владельца 24.09.2026): LASH не тратится, запас не убывает, предметы не кончаются.
// Иначе проверка была бы нечестной — а SPAR ровно для проверки и существует.
import { readSparBout } from './spar.js';

/**
 * ЧТО ВИДИТ ЭКРАН. Панель и значки читают отсюда и больше ниоткуда.
 *   active   — бой идёт, панель на экране
 *   cards    — карточки набора: { key, id, name, mono, left, state }
 *   badges   — значки над бойцами: { key, id, mono, own, face, ring, x, y }
 *   cool     — откат по каждому виду: { [id]: { left, frac } }, где left —
 *              секунды до конца (0 = свободен), frac — доля отката 1..0.
 *              Отдельно от карточек нарочно: откат меняется КАЖДЫЙ кадр, а
 *              карточки пересобираются только на смену состояния.
 *
 * Выбранной карточки здесь больше нет: карточка не выбирается, она бросается.
 */
export const buffFightState = reactive({
  active: false,
  cards: [],
  badges: [],
  cool: {},
});

// ── Привязка к арене ─────────────────────────────────────────────────────
// Арена отдаёт четыре вещи и больше ничего: куда класть предметы, чем считать
// экранные координаты, по чему ловить палец и где брать живых бойцов.
let A = null; // { scene, camera, canvas, field, reduced }

/** Что игрок взял в бой: список видов, по одному на ячейку. Тратится по ходу. */
let kit = [];
/**
 * Каким набор был НА СТАРТЕ боя. Нужен панели: карточка потраченного баффа не
 * исчезает, а гаснет со счётчиком ×0 — иначе панель прыгала бы под пальцем и
 * игрок терял бы место, куда только что тыкал.
 */
let kitInitial = [];
/** Свой номер каждому значку. Записи бойцов своих номеров не имеют. */
let badgeSeq = 0;
/** Что взял бот: свой бесплатный набор, у игрока ничего не отнимает. */
let botKit = [];
let botLastThrowAt = -1e9;

/** Действующие эффекты: боец → что на нём висит. */
const effects = new Map();
/** Летящие предметы — их подача. Живут секунды и разбираются сами. */
const flying = [];
/** Время боя, которое отдаёт арена. Нужно эффектам и боту. */
let nowT = 0;

let unwatchDice = null;

/**
 * СЛУЖЕБНОЕ: выставить грань кубика вручную. Нужно ровно для одного — проверить
 * все шесть граней подряд, не бросая кубик сто раз.
 *
 * ⚠️ ТОЛЬКО ПОД ?dev=1 И ТОЛЬКО НА ВИД. Признак служебного режима подставит кто
 *    угодно из адресной строки, поэтому он не управляет ничем, что стоит денег,
 *    и не даёт преимущества: сейчас бои с ботом, наград нет. То же правило и та
 *    же причина, что у служебной панели арены (см. services/devMode.js). Как
 *    появятся бои с живыми людьми и награды — бросок уедет на сервер
 *    (Decisions Log 100), и эта дырка закроется вместе с ним.
 */
let devFace = null;
/** Снять наблюдателя за сменой выбранного бойца (ставится в bindBuffArena). */
let stopPickWatch = null;
/** Можно ли было бросить на прошлом кадре — см. причину в buffTick. */
let lastCanThrow = null;
/**
 * Когда каждый вид снова можно бросить — по часам боя (правило 9). Общий на
 * сторону игрока, как и набор. Ноль/прошлое = свободен.
 *
 * ⚠️ СВОИХ ЧАСОВ НЕ ЗАВОДИМ. Срок считается по тому же времени боя, что уже
 *    считает сроки самих баффов, — арена отдаёт его каждый кадр в buffTick.
 *
 * ⚠️ БОТА ОТКАТ НЕ КАСАЕТСЯ: у него свой набор и своя пауза между бросками
 *    (BUFF_BALANCE.bot.minGapSec). Откат — рычаг игрока, и он на стороне игрока.
 */
let coolUntil = {};
/** Кто был в откате на прошлом кадре — см. причину у lastCooling в klich.js. */
let lastCooling = '';
export function setDevDiceFace(n) {
  devFace = DEV_MODE && n >= 1 && n <= 6 ? Math.floor(n) : null;
}

// ── Привязка / отвязка ───────────────────────────────────────────────────

/**
 * Арена зовёт это один раз при сборке. Пока не позвали, баффов не существует
 * вовсе: панель не показывается, бот не бросает. Палец здесь больше не ловится:
 * его ловит выбор бойца.
 */
export function bindBuffArena({ scene, camera, canvas, field, reduced = false }) {
  A = { scene, camera, canvas, field, reduced };
  // Заряд кубика меняется не по нашему кадру, а по попаданиям — значок должен
  // узнавать об этом сразу, иначе кольцо отстаёт на кадр.
  unwatchDice = watchDiceCharge(() => { syncCards(); });
  // СМЕНИЛСЯ ВЫБРАННЫЙ — ПЕРЕСОБРАТЬ КАРТОЧКИ. «Нельзя сейчас» у баффа зависит
  // от того, КТО выбран: на бойце под баффом второй не бросить (правило 2).
  // Значит при переходе выбора с забаффленного на свободного карточки должны
  // ожить в тот же миг, а не на следующем событии.
  stopPickWatch = watch(() => selectState.key, () => { syncCards(); });
  return unbindBuffArena;
}

/** Уход с арены. Всё снимается, чтобы следующий бой начался с чистого. */
export function unbindBuffArena() {
  if (!A) return;
  if (unwatchDice) { unwatchDice(); unwatchDice = null; }
  if (stopPickWatch) { stopPickWatch(); stopPickWatch = null; }
  buffEndFight(); // не брошенное ничего не стоило — возвращать нечего
  disposeFlying();
  A = null;
}

// ── Начало и конец боя ───────────────────────────────────────────────────

/**
 * НОВЫЙ БОЙ. Набор — это просто список того, что игрок взял с собой; из запаса
 * НИЧЕГО не списывается, пока бафф не брошен.
 *
 * ⚠️ СНАЧАЛА БЫЛО НАОБОРОТ: набор списывался на старте, а неиспользованное
 *    возвращалось в конце. Замер в браузере поймал дыру: игрок обновляет
 *    страницу посреди боя — вкладка умирает, вернуть некому, а новый бой
 *    списывает ещё один набор. Запас 1·1·1 превращался в 0·0·0 за одно нажатие
 *    F5. Списание в момент броска (правило 4 ТЗ дословно: «сгорает сразу после
 *    применения») чинит это само собой: не брошен — значит не потрачен, и
 *    возвращать нечего.
 */
export function buffStartFight() {
  if (!A) return;
  clearEffects();

  // ── БОЙ ИЗ SPAR ──
  // Набор берётся прямо со слотов экрана настройки, обеим сторонам, и запасом НЕ
  // ограничивается. Ни одной записи в прогресс: стартовый запас не выдаётся
  // (ensureStarterStock ПИШЕТ в сейф), из запаса ничего не списывается.
  //
  // ⚠️ ПУСТЫЕ СЛОТЫ ЗНАЧАТ «БЕЗ БАФФОВ», а не «собери за меня». На экране SPAR
  //    слоты видны и честно подписаны «ПУСТО» — игрок их либо заполнил, либо нет,
  //    и додумывать за него нельзя. Поэтому запасного набора здесь нет: правило
  //    defaultKitFrom существует для ворот, где слотов на экране может и не быть.
  const spar = readSparBout();
  if (spar) {
    kit = spar.myKit.filter(Boolean);
    kitInitial = [...kit];
    botKit = spar.foeKit.filter(Boolean);
    botLastThrowAt = -1e9;
    coolUntil = {};
    lastCooling = '';
    buffFightState.cool = {};
    buffFightState.active = true;
    syncCards();
    return;
  }

  ensureStarterStock();
  const stock = readStock();
  const saved = readKit();
  // Игрок мог не заходить в слоты вовсе — тогда набор собирается сам, по
  // правилу «по одному каждого вида, если есть; иначе чем есть».
  const wanted = saved.some((x) => x) ? saved : defaultKitFrom(stock);
  // Чего в запасе нет — в бой не идёт. Считаем по ходу, чтобы три одинаковых
  // при двух в запасе дали два, а не три.
  const left = { ...stock };
  kit = [];
  for (const id of wanted) {
    if (!id || !(left[id] > 0)) continue;
    left[id] -= 1;
    kit.push(id);
  }
  kitInitial = [...kit];
  botKit = rollBotKit();
  botLastThrowAt = -1e9;
  coolUntil = {};
  lastCooling = '';
  buffFightState.cool = {};
  buffFightState.active = true;
  // ⚠️ ЗДЕСЬ БРОСАТЬ ЕЩЁ НЕКОМУ, И ЭТО НОРМАЛЬНО. Бой начинается, когда плита
  //    ПУСТА — бойцов ставят позже, уже в кадрах, — значит и выбранного в этот
  //    миг нет, и карточки честно запираются. Отпираются они на смену выбранного
  //    (наблюдатель в bindBuffArena) и каждый кадр в buffTick. Ровно на этой
  //    ловушке ряд карт клича однажды замер серым на весь бой.
  syncCards();
}

/**
 * БОЙ КОНЧИЛСЯ. Эффекты просто прекращаются (правило 8). Неиспользованные баффы
 * возвращать не нужно: они и не списывались (правило 5 выполняется само собой —
 * см. пояснение у buffStartFight).
 */
export function buffEndFight() {
  kit = [];
  kitInitial = [];
  botKit = [];
  clearEffects();
  coolUntil = {};
  lastCooling = '';
  buffFightState.active = false;
  buffFightState.cards = [];
  buffFightState.badges = [];
  buffFightState.cool = {};
}

/** Снять все эффекты, не трогая запас. */
function clearEffects() {
  for (const [unit, e] of effects) endEffect(unit, e);
  effects.clear();
  clearAllDiceCharges();
}

// ── Карточки панели ──────────────────────────────────────────────────────

/**
 * Одинаковые баффы складываются в одну карточку со счётчиком — так «сколько
 * осталось» читается с одного взгляда, а три одинаковых не занимают три места.
 */
function syncCards() {
  const counts = new Map();
  for (const id of kitInitial) counts.set(id, 0);
  for (const id of kit) counts.set(id, (counts.get(id) || 0) + 1);
  const canThrow = !!targetUnit();
  // БОЙ ИЗ SPAR: предметы не кончаются, значит и остатка у них нет. Отдаём
  // бесконечность, и карточка ПРОСТО НЕ РИСУЕТ счётчик — застывшее число
  // читалось бы как сломанный счёт («бросил, а не убыло»), да и правило самого
  // SPAR цифр на экране не держит.
  const endless = !!readSparBout();
  buffFightState.cards = BUFF_IDS.filter((id) => counts.has(id)).map((id) => {
    const left = endless ? Infinity : counts.get(id);
    let state = 'normal';
    if (left <= 0) state = 'empty';
    // «НЕЛЬЗЯ СЕЙЧАС». Три причины, состояние одно, и четвёртого заводить
    // нельзя (ТЗ): идёт откат (правило 9), выбранный уже под баффом
    // (правило 2), или выбирать ещё некого. Все три читаются одинаково —
    // «сейчас нельзя, но предмет цел». Чем именно нельзя, говорит панель
    // справа: при откате она ведёт отсчёт.
    else if (!canThrow || isCooling(id)) state = 'locked';
    return { key: id, id, name: BUFF_META[id].name, mono: BUFF_META[id].mono, left, state };
  });
  syncBadgesList();
}

/**
 * Кому бросаем — ВЫБРАННЫЙ боец, если на него МОЖНО (правила 2 и 7). Своего
 * списка целей у баффа больше нет: цель одна, её держит выбор.
 */
/** Идёт ли откат у этого вида прямо сейчас. */
function isCooling(id) {
  return (coolUntil[id] || 0) > nowT;
}

function targetUnit() {
  if (!A || !buffFightState.active) return null;
  const u = selectedUnit();
  if (!u || effects.has(u)) return null;
  return u;
}

// ── Тап по карточке ──────────────────────────────────────────────────────

/**
 * Тап по карточке: бросить ВЫБРАННОМУ бойцу, немедленно. Второго шага нет,
 * отменять нечего — поэтому и повторный тап больше не отмена.
 *
 * ⚠️ ВОЗВРАЩАЕТ «ПОЛУЧИЛОСЬ ИЛИ НЕТ» — по той же причине, что и клич: в эту же
 *    дверь входит легенда, и строка решений не имеет права объявить бросок,
 *    которого не было. Карточке ответ не нужен, она его не читает.
 *
 * @returns {boolean} true — бафф брошен и предмет списан
 */
export function useBuffCard(key) {
  if (!buffFightState.active) return false;
  const card = buffFightState.cards.find((c) => c.key === key);
  if (!card || card.left <= 0) return false; // потраченная карточка не бросается
  if (isCooling(key)) return false;          // откат: карточка погашена разметкой
  const unit = targetUnit();
  if (!unit) return false;                   // уже под баффом или выбирать некого
  const ok = applyBuff(key, unit, true);
  syncCards();
  return ok;
}

/**
 * ЕСТЬ ЛИ НА ЭТОМ БОЙЦЕ БАФФ ПРЯМО СЕЙЧАС.
 *
 * ⚠️ СПРАШИВАЕТ КОМАНДОВАНИЕ, И ТОЛЬКО ОНО (services/command.js). Бросить
 *    второй бафф на того, кто уже под баффом, нельзя (правило 2), и карточка
 *    игрока об этом честно гаснет сама. У легенды карточки нет — она решает до
 *    броска, и без этого вопроса она раз в три секунды упиралась бы в отказ,
 *    ничего не тратя, но и никого не спасая: правило 1 не пошло бы дальше и
 *    израненный боец остался бы без помощи, которая была под рукой.
 */
export function hasBuffOn(unit) {
  return !!unit && effects.has(unit);
}

// ── Применение баффа ─────────────────────────────────────────────────────

/**
 * Бросить бафф на бойца. Один вход и для игрока, и для бота — правила у них
 * одни и те же (ТЗ), различается только, откуда списывается штука.
 *
 * @param {string} id  вид баффа
 * @param {object} unit запись бойца в поле боя
 * @param {boolean} own бафф игрока (иначе — бота)
 */
function applyBuff(id, unit, own) {
  if (!A || !unit || !unit.f || unit.dead) return false;       // правило 7
  if (effects.has(unit)) return false;                          // правило 2
  // БОЙ ИЗ SPAR: бросок ничего не тратит — ни монет, ни запаса, ни самой карточки.
  // ОТКАТ ПРИ ЭТОМ ОСТАЁТСЯ, и это не мелочь: без него бесконечные баффы можно
  // было бы сыпать каждый кадр, и бой перестал бы быть похож на бой.
  const freeBuffs = !!readSparBout();
  if (own) {
    const i = kit.indexOf(id);
    if (i < 0) return false;
    // СПИСАНИЕ РОВНО ЗДЕСЬ — в момент броска (правило 4). Запас мог опустеть
    // между воротами и боем (вторая вкладка, сброс прогресса): тогда бросок
    // просто не состоится, и карточка останется на месте.
    if (!freeBuffs) {
      if (!spendFromStock(id)) return false;
      kit.splice(i, 1);
    }
    // ОТКАТ ставится в тот же миг, что списывается предмет (правило 9). Только
    // у игрока: у бота своя пауза между бросками, и она уже есть.
    coolUntil[id] = nowT + BUFF_BALANCE.cooldownSec;
  } else {
    const i = botKit.indexOf(id);
    if (i < 0) return false;
    if (!freeBuffs) botKit.splice(i, 1);
  }

  const f = unit.f;
  const e = { id, own, startedAt: nowT, face: null, staggerHandled: false, key: `b${++badgeSeq}` };

  if (id === 'towel') {
    const o = BUFF_BALANCE.towel;
    e.until = nowT + o.durationSec;
    e.healRate = o.healFracOfMax / o.durationSec; // ровно, за всё время
    // Если боец сбит ПРЯМО СЕЙЧАС — укоротить этот сбив сразу.
    if (f.isStaggered && f.isStaggered()) { f.shortenStagger(o.staggerRecoverMul); e.staggerHandled = true; }
  } else if (id === 'bucket') {
    const o = BUFF_BALANCE.bucket;
    e.until = nowT + o.durationSec;
    f.setBuffPace(o.paceMul);
  } else if (id === 'dice') {
    // Служебная грань — только под ?dev=1; у игрока здесь всегда честный бросок.
    const face = (DEV_MODE && devFace) || rollDie(); // ЕДИНСТВЕННЫЙ бросок на всю игру
    const row = BUFF_BALANCE.dice.faces[face];
    e.face = face;
    e.until = Infinity;                          // у кубика не время, а заряженные удары
    armDiceCharge(f, row.mul, row.hits);
  }

  effects.set(unit, e);
  throwItem(id, unit, e.face);
  syncCards();
  return true;
}

/** Снять эффект с бойца — вернуть всё, что бафф крутил. */
function endEffect(unit, e) {
  const f = unit && unit.f;
  if (!f) return;
  if (e.id === 'bucket') f.setBuffPace(1);
  if (e.id === 'dice') clearDiceCharge(f);
}

// ── Бот ──────────────────────────────────────────────────────────────────

/** Свой бесплатный набор на каждый бой: три случайных из трёх видов. */
function rollBotKit() {
  const out = [];
  for (let i = 0; i < BUFF_BALANCE.bot.kitSize; i++) {
    out.push(BUFF_IDS[Math.floor(Math.random() * BUFF_IDS.length)]);
  }
  return out;
}

/**
 * КОГДА БОТ БРОСАЕТ. Простые правила из ТЗ, без думающей модели: полотенце на
 * низком здоровье, ведро при сближении, кубик по слабому противнику или просто
 * поздно в бою. Пауза между бросками — чтобы он не выстреливал всё разом.
 */
function tickBot() {
  if (!A || !botKit.length) return;
  const B = BUFF_BALANCE.bot;
  if (nowT - botLastThrowAt < B.minGapSec) return;
  for (const u of A.field.living()) {
    if (u.sideId === 'player' || effects.has(u)) continue;
    const f = u.f;
    const hp01 = f.getHp() / f.maxHp;
    const target = A.field.targetFor(u);
    const foe = target && target.f;
    const gap = foe ? f.group.position.distanceTo(foe.group.position) : Infinity;
    const foeHp01 = foe ? foe.getHp() / foe.maxHp : 1;

    let pick = null;
    if (botKit.includes('towel') && hp01 < B.towelHpBelow) pick = 'towel';
    else if (botKit.includes('bucket') && gap < B.bucketNearDist) pick = 'bucket';
    else if (botKit.includes('dice') && (foeHp01 < B.diceFoeHpBelow || nowT >= B.diceLateSec)) pick = 'dice';
    if (!pick) continue;

    if (applyBuff(pick, u, false)) { botLastThrowAt = nowT; return; } // не больше одного за проход
  }
}

// ── Кадр ─────────────────────────────────────────────────────────────────

/**
 * Зовётся ареной каждый кадр. Здесь: срок эффектов, лечение, сбив, бот,
 * подача брошенных предметов и экранные места значков.
 *
 * @param {number} dt секунд с прошлого кадра
 * @param {number} t  время боя (часы арены)
 */
export function buffTick(dt, t) {
  nowT = t;
  if (!A) return;
  tickFlying(dt);
  if (!buffFightState.active) return;

  for (const [unit, e] of [...effects]) {
    const f = unit.f;
    // Боец пал или выбыл — остаток пропадает (правило 6).
    if (!f || unit.dead || f.getHp() <= 0) { endEffect(unit, e); effects.delete(unit); continue; }

    if (e.id === 'towel') {
      f.heal(e.healRate * dt);
      // Сбив, случившийся ПОКА полотенце действует, тоже укорачивается — но
      // ровно один раз на сбив: каждый кадр замок таял бы до нуля.
      const st = f.isStaggered && f.isStaggered();
      if (st && !e.staggerHandled) { f.shortenStagger(BUFF_BALANCE.towel.staggerRecoverMul); e.staggerHandled = true; }
      if (!st && e.staggerHandled) e.staggerHandled = false;
    }
    if (e.id === 'dice' && !diceChargeOf(f)) { endEffect(unit, e); effects.delete(unit); continue; }
    if (t >= e.until) { endEffect(unit, e); effects.delete(unit); }
  }

  tickBot();
  // МОЖНО ЛИ БРОСИТЬ — ПРОВЕРЯЕТСЯ КАЖДЫЙ КАДР. Оно меняется само по себе, без
  // всякого события: бафф на выбранном бойце истёк — карточки ожили; выбранный
  // пал и выбор перескочил на свободного — тоже. Пересобираем ТОЛЬКО когда
  // изменилось: шестьдесят пересборок в секунду незачем.
  const canThrow = !!targetUnit();
  syncCool();
  // Карточки пересобираются на ИЗМЕНЕНИЕ: можно/нельзя бросить или кончился
  // чей-то откат. Строка «кто сейчас в откате» — самый дешёвый способ поймать
  // второе, не сравнивая по одному.
  const cooling = BUFF_IDS.filter(isCooling).join(',');
  if (canThrow !== lastCanThrow || cooling !== lastCooling) {
    lastCanThrow = canThrow; lastCooling = cooling; syncCards();
  }
  syncBadges();
}

/**
 * ОСТАТОК ОТКАТА — для панели рычагов. Считается каждый кадр: панель ведёт
 * отсчёт, и он обязан идти плавно, а не прыгать вместе с пересборкой карточек.
 * Пишем ровно три числа, поэтому дёшево.
 */
function syncCool() {
  const total = BUFF_BALANCE.cooldownSec;
  for (const id of BUFF_IDS) {
    const left = Math.max(0, (coolUntil[id] || 0) - nowT);
    const cur = buffFightState.cool[id];
    const frac = total > 0 ? left / total : 0;
    if (!cur) buffFightState.cool[id] = { left, frac };
    else { cur.left = left; cur.frac = frac; }
  }
}

// ── Значки над бойцами ───────────────────────────────────────────────────

/**
 * ГДЕ СТОИТ ЗНАЧОК.
 *
 * ⚠️ НЕ НАД ГОЛОВОЙ. Над головой уже живёт плашка здоровья (scene/hpIndicator.js,
 *    её основание — на высоте 2.05), и первая версия ставила значок ровно туда:
 *    на снимке экрана он налез на чужую полоску здоровья. ТЗ этого прямо не
 *    разрешает — «панель не должна перекрывать бойцов и полоски здоровья», и к
 *    значку это относится ровно так же.
 *
 *    Поэтому значок стоит НА УРОВНЕ ГРУДИ и сдвинут вбок на экране: читается как
 *    «на этом бойце», но в полосу плашки не заходит никогда, на любом отдалении
 *    камеры. Сдвиг в точках экрана, а не в мире, — иначе на отдалении он
 *    схлопывался бы обратно к телу.
 */
const BADGE_BODY_Y = 1.30;   // высота на теле — грудь, ниже плашки здоровья
const BADGE_SIDE_PX = 40;    // сдвиг вбок на экране, точек

const _prj = new THREE.Vector3();
const _fwd = new THREE.Vector3();
const _off = new THREE.Vector3();

/**
 * Состав списка меняется редко — отдельно от покадрового пересчёта мест.
 *
 * ⚠️ ЗАПИСЬ БОЙЦА В СОСТОЯНИЕ ЭКРАНА НЕ КЛАДЁТСЯ, И ЭТО НЕ ПРИДИРКА. Состояние
 *    реактивное: всё, что в него положено, Vue оборачивает своей обёрткой — в том
 *    числе вглубь, до тел Three.js. Обёртка не равна самому бойцу, и поиск
 *    effects.get(обёртка) промахивался бы мимо: значок молча не показывался
 *    вовсе (поймано снимком экрана — над бойцом было пусто). Плюс заворачивать
 *    трёхмерные тела в слежение — дорого без всякой нужды.
 *
 *    Поэтому наружу уходят только простые значения, а сами бойцы лежат рядом, в
 *    обычной памяти, и сходятся с состоянием по ключу.
 */
const badgeUnits = new Map(); // ключ значка → запись бойца (вне реактивности)

function syncBadgesList() {
  badgeUnits.clear();
  const want = [];
  for (const [unit, e] of effects) {
    badgeUnits.set(e.key, unit);
    want.push({ key: e.key, id: e.id, mono: BUFF_META[e.id].mono, own: e.own, face: e.face, ring: 1, x: -9999, y: -9999, on: false });
  }
  buffFightState.badges = want;
}

function syncBadges() {
  if (buffFightState.badges.length !== effects.size) syncBadgesList();
  if (!buffFightState.badges.length) return;
  const r = A.canvas.getBoundingClientRect();
  A.camera.getWorldDirection(_fwd);
  for (const b of buffFightState.badges) {
    const unit = badgeUnits.get(b.key);
    const e = unit && effects.get(unit);
    if (!e) { b.on = false; continue; }
    const f = unit.f;
    // Остаток: у полотенца и ведра — время, у кубика — заряженные удары.
    if (e.id === 'dice') {
      const c = diceChargeOf(f);
      b.ring = c ? c.hitsLeft / c.hitsTotal : 0;
    } else {
      const dur = e.until - e.startedAt;
      b.ring = dur > 0 ? Math.max(0, (e.until - nowT) / dur) : 0;
    }
    // Место на экране — над головой. За спиной у камеры проекция
    // переворачивается и дала бы значок не с той стороны, поэтому такой кадр
    // просто прячется.
    _prj.copy(f.group.position); _prj.y += BADGE_BODY_Y;
    if (_fwd.dot(_off.copy(_prj).sub(A.camera.position)) <= 0) { b.on = false; continue; }
    _prj.project(A.camera);
    // Свой — справа от бойца, чужой — слева: если тела сошлись вплотную, два
    // значка всё равно не лягут друг на друга.
    b.x = r.left + (_prj.x * 0.5 + 0.5) * r.width + (b.own ? BADGE_SIDE_PX : -BADGE_SIDE_PX);
    b.y = r.top + (-_prj.y * 0.5 + 0.5) * r.height;
    b.on = true;
  }
}

/* ПОДСВЕТКА ЦЕЛЕЙ СНЯТА (ТЗ 26.09.2026). Она показывала, на КОГО можно бросить,
   пока карточка выбрана, — а выбирать карточку больше не нужно, и цель всегда
   одна: выбранный боец. Её место и её приём (плоская метка поверх кадра, без
   свечения) заняла метка выбранного в services/fighterSelect.js. */

// ── Подача: брошенный предмет ────────────────────────────────────────────

/**
 * ОДНА АНИМАЦИЯ НА ИГРОКА И НА БОТА (ТЗ). Предметы — те самые, что владелец
 * принял на странице-макете (scene/buffItems.js): своей копии здесь нет.
 *
 * ⚠️ РОЗОВОЕ СВЕЧЕНИЕ — ТОЛЬКО НА ВРЕМЯ БРОСКА. Под ногами бойца загорается та
 *    же лужица, что под постаментом на макете, и гаснет вместе с анимацией. В
 *    покое на арене светится один разлом, как и светился.
 */
function throwItem(id, unit, face) {
  if (!A) return;
  const p = unit.f.group.position;
  const reduced = A.reduced;
  const life = reduced ? BUFF_BALANCE.throwLifeReducedSec : BUFF_BALANCE.throwLifeSec;

  const glow = buildActionGlow();
  glow.mesh.position.set(p.x, p.y + 0.02, p.z);
  glow.setLevel(0);
  A.scene.add(glow.mesh);

  let item = null;
  if (id === 'towel') {
    item = buildTowel();
    item.place(p.y + 1.55, { x: p.x, z: p.z });        // падает сверху на плечи
    item.activate({ x: p.x, y: p.y + 1.55, z: p.z }, reduced);
  } else if (id === 'bucket') {
    item = buildBucket();
    item.group.position.set(p.x, p.y + 1.75, p.z + 0.45); // наклоняется над головой
    item.activate(null, reduced, null);
  } else {
    item = buildDice();
    item.place(p.y, { x: p.x, z: p.z + 1.05 });         // катится к ногам бойца
    item.activate(face, A.camera, reduced, null);
  }
  A.scene.add(item.group);

  flying.push({ item, glow, t: 0, life, hold: life * 0.45 });
}

function tickFlying(dt) {
  for (let i = flying.length - 1; i >= 0; i--) {
    const fl = flying[i];
    fl.t += dt;
    fl.item.tick(dt, fl.t, A ? A.reduced : true);
    fl.glow.setActive(fl.t < fl.hold, dt); // горит на срабатывании, потом гаснет
    if (fl.t >= fl.life) {
      if (A) { A.scene.remove(fl.item.group); A.scene.remove(fl.glow.mesh); }
      fl.item.dispose(); fl.glow.dispose();
      flying.splice(i, 1);
    }
  }
}

function disposeFlying() {
  for (const fl of flying) {
    if (A) { A.scene.remove(fl.item.group); A.scene.remove(fl.glow.mesh); }
    fl.item.dispose(); fl.glow.dispose();
  }
  flying.length = 0;
}

/** Слоты перед боем читают и пишут набор через этот же файл — один вход. */
export { readStock, readKit, writeKit, defaultKitFrom, ensureStarterStock };
