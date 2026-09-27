// commandBrain.js — ДУМАЮЩИЙ МОЗГ ЛЕГЕНДЫ. Когда будить модель, что ей послать
// и что делать с ответом.
//
// ЗАЧЕМ ОТДЕЛЬНЫЙ ФАЙЛ, А НЕ ПРИСТРОЙКА К services/command.js. Там живут
// правила «что нажать», и они должны читаться целиком за один присест: четыре
// сравнения чисел. Мозг — другая работа и другой риск: сеть, сроки, деньги,
// выбрасывание негодных ответов. Смешать их значило бы, что человек, пришедший
// поправить порог спасения, продирается через обработку отказов сети.
//
// ⚠️ БОЙ НИКОГДА НЕ ЖДЁТ МОДЕЛЬ. Пока ответ летит, легенда живёт по табличке
//    порогов — ровно как до части B. Любой отказ (нет сети, нет ключа, таймаут,
//    мусор в ответе, рычаг не из списка) молча оставляет её на табличке. Это
//    нормальное, ожидаемое событие, а не происшествие: прод может вообще не
//    иметь ручки, и бой обязан идти.
//
// ⚠️ ОТВЕТ ПОТРЕБЛЯЕТСЯ ОДИН РАЗ. Пришёл — правила его забрали и он исчез.
//    Иначе один совет модели применялся бы снова и снова каждые три секунды,
//    пока не кончатся заряды: обстановка-то уже другая, а ответ всё тот же.
//
// ⚠️ ЭТОТ ФАЙЛ САМ В СЕТЬ НЕ ХОДИТ. Ни один файл в services/ не тянет ни Vuex,
//    ни apiClient — и заводить первый такой незачем. Функцию запроса подаёт
//    снаружи накладка, у которой доступ есть по праву, ровно тем же приёмом,
//    каким арена подаёт запрос бойцу. Не подали — мозга нет, и всё работает
//    как до части B.
//
// ЧЕГО ЭТОТ ФАЙЛ НЕ ДЕЛАЕТ:
//   · не заводит своих чисел — все в data/commandBalance.js;
//   · не решает сам, что нажать: он приносит СОВЕТ, а нажимает command.js;
//   · не проверяет реплику по существу — это делает бэк, у которого список
//     запретов и один потолок длины. Здесь только последний заслон по форме.
//
// Экспортирует: setBrainRequest, brainStartFight, brainTick, takeBrainAdvice,
//               brainStats.
import { COMMAND_BALANCE as C } from '@/data/commandBalance.js';

const B = C.brain;

/** Функция запроса. Подаёт накладка; null = мозга нет, живём по табличке. */
let request = null;
/** Ответ, который ещё никто не забрал: { lever, target, line, at }. */
let answer = null;
/** Летит ли запрос прямо сейчас. Двух разом не бывает. */
let pending = false;
/** До какого времени боя нельзя будить модель снова. */
let quietUntil = 0;
/** Сколько раз будили за этот бой (считаем ПОПЫТКИ — см. ниже). */
let asked = 0;
/**
 * Номер запроса. Растёт на каждый запрос И на каждый новый бой.
 *
 * ⚠️ БЕЗ НЕГО ОТВЕТ ИЗ ПРОШЛОГО БОЯ ПРИМЕНИЛСЯ БЫ В ЭТОМ. Запрос летит полторы
 *    секунды, а бой за это время может кончиться и начаться новый. Ответ с
 *    устаревшим номером выбрасывается молча.
 */
let seq = 0;
/** Жалоба на недоступный мозг — ровно один раз, а не каждый кадр. */
let warned = false;

/**
 * СЧЁТ ДЛЯ ОТЧЁТА. Приёмка просит доложить удачные ответы и откаты РАЗДЕЛЬНО,
 * а не одной цифрой «попытки» — это старый долг, он здесь и закрывается.
 *
 *   asked  — сколько раз будили модель (тратит потолок);
 *   got    — сколько ответов пришло и оказалось годным;
 *   failed — сколько раз откатились на табличку, с разбивкой по причине.
 */
const stats = { asked: 0, got: 0, failed: 0, why: Object.create(null) };

function note(why) {
  stats.failed += 1;
  stats.why[why] = (stats.why[why] || 0) + 1;
}

// ── Снаружи ──────────────────────────────────────────────────────────────

/**
 * Подать функцию запроса. Зовёт накладка.
 * @param {null|(payload:object)=>Promise<object>} fn
 */
export function setBrainRequest(fn) {
  request = typeof fn === 'function' ? fn : null;
}

/** Есть ли вообще мозг. Правила спрашивают, чтобы зря не собирать посылку. */
export function brainAlive() {
  return !!request;
}

/** НОВЫЙ БОЙ. Всё с нуля, включая потолок и счёт для отчёта. */
export function brainStartFight() {
  answer = null;
  pending = false;
  quietUntil = 0;
  asked = 0;
  seq += 1; // летящий сейчас ответ приземлится в прошлый бой и будет отброшен
  breaks.self = false;
  breaks.foe = false;
  breaks.started = false;
  breaks.outnumbered = false;
  stats.asked = 0;
  stats.got = 0;
  stats.failed = 0;
  stats.why = Object.create(null);
}

/** Числа прогона — для служебного вывода и отчёта приёмки. */
export function brainStats() {
  return { ...stats, why: { ...stats.why }, pending, left: Math.max(0, B.maxPerFight - asked) };
}

/**
 * ЗАБРАТЬ СОВЕТ, если он есть и ещё не протух. Потребляется ОДИН раз.
 * @returns {null|{lever:string,target:number,line:string}}
 */
export function takeBrainAdvice(nowT) {
  if (!answer) return null;
  if (nowT - answer.at > B.answerTtlSec) { answer = null; note('stale'); return null; }
  const a = answer;
  answer = null;
  return a;
}

// ── Поводы разбудить ─────────────────────────────────────────────────────

/** Что уже случалось в этом бою: каждый повод срабатывает один раз. */
const breaks = { started: false, self: false, foe: false, outnumbered: false };

/**
 * ПЕРЕЛОМ — то, после чего обстановка изменилась качественно. Будим на них, а
 * не по таймеру: таймер жёг бы деньги в ровном бою и молчал бы в переломном.
 *
 * Порядок проверок — от общего к частному, до первого сработавшего.
 * @returns {string|null} повод словами, либо null
 */
function findBreak(own, foes) {
  if (!breaks.started) { breaks.started = true; return 'the bout has begun'; }
  if (!breaks.self && own.some((u) => u.hp01 < B.selfHurtHp01)) {
    breaks.self = true;
    return 'one of your fighters just dropped low';
  }
  if (!breaks.foe && foes.some((u) => u.hp01 < B.foeWeakHp01)) {
    breaks.foe = true;
    return 'one of theirs is about to fall';
  }
  if (!breaks.outnumbered && own.length < foes.length) {
    breaks.outnumbered = true;
    return 'you are outnumbered now';
  }
  return null;
}

// ── Кадр ─────────────────────────────────────────────────────────────────

/**
 * Кадр мозга. Зовут правила, ПОСЛЕ того как собрали обстановку.
 *
 * Всё тело завёрнуто: бросок ЛЮБЫЕ откуда на этом пути (сбор посылки, сам
 * запрос) не имеет права уронить кадр боя. Уронили — молча остались на табличке.
 *
 * @param {number} nowT  время боя
 * @param {()=>object} build  собрать посылку. Лениво: пока повода нет, не
 *                            собираем вовсе — это обход всех живых тел.
 * @param {Array} own   свои: [{ hp01 }]
 * @param {Array} foes  чужие: [{ hp01 }]
 */
export function brainTick(nowT, build, own, foes) {
  if (!request) return;
  try {
    const trigger = findBreak(own, foes);
    if (!trigger) return;
    if (pending) { note('busy'); return; }
    if (nowT < quietUntil) { note('too_soon'); return; }
    if (asked >= B.maxPerFight) { note('ceiling'); return; }
    fire(nowT, trigger, build);
  } catch (e) {
    warnOnce(e);
  }
}

/**
 * Отправить запрос.
 *
 * ⚠️ ФУНКЦИЯ ЗАПРОСА ЗОВЁТСЯ ВНУТРИ ЦЕПОЧКИ ОБЕЩАНИЙ. Тогда даже мгновенный
 *    бросок из неё превращается в отказ и уходит в .catch — а не наружу, в
 *    кадр боя. Тот же приём, что у мозга бойца, и по той же причине.
 */
function fire(nowT, trigger, build) {
  pending = true;
  asked += 1;
  stats.asked += 1;
  quietUntil = nowT + B.minGapSec;
  const mine = ++seq;
  let payload;
  try {
    payload = { ...build(), trigger };
  } catch (e) {
    pending = false;
    note('payload');
    warnOnce(e);
    return;
  }
  Promise.resolve()
    .then(() => request(payload))
    .then((res) => {
      pending = false;
      if (mine !== seq) { note('late'); return; } // бой уже другой — молча мимо
      const ok = accept(res);
      if (ok) { answer = { ...ok, at: nowT }; stats.got += 1; }
      else note('bad_shape');
    })
    .catch((e) => { pending = false; note('net'); warnOnce(e); });
}

/**
 * ПОСЛЕДНИЙ ЗАСЛОН ПО ФОРМЕ. По существу ответ уже проверил бэк — у него и
 * список запретов, и единственный потолок длины. Здесь сверяется только то, что
 * клиент обязан проверять сам, потому что доверять форме чужого ответа нельзя:
 * поля на месте и нужного вида.
 *
 * ⚠️ РЕПЛИКА И РЕШЕНИЕ РАЗВЕДЕНЫ, КАК И НА БЭКЕ. Негодная реплика не уносит
 *    решение: легенда тогда действует молча, и игрок видит служебную
 *    расшифровку — это ТЗ §3 дословно.
 */
function accept(res) {
  if (!res || typeof res !== 'object') return null;
  const lever = typeof res.lever === 'string' ? res.lever.trim().toLowerCase() : '';
  if (!lever) return null;
  const target = Number.isInteger(res.target) ? res.target : 0;
  if (lever !== 'none' && target < 1) return null; // рычаг адресный
  const line = typeof res.line === 'string' ? res.line.trim() : '';
  return { lever, target, line };
}

/**
 * ⚠️ ЖАЛОБА РОВНО ОДИН РАЗ ЗА ЗАГРУЗКУ СТРАНИЦЫ. Ручки может не быть вовсе —
 *    тогда отказ приходит на каждый повод, и жалоба по кругу завалила бы
 *    консоль. Тот же приём и та же причина, что у жалобы на недоступный мозг
 *    бойца.
 */
function warnOnce(e) {
  if (warned) return;
  warned = true;
  try { console.warn('[command] мозг легенды недоступен — остаёмся на табличке порогов', e); } catch (_) { /* noop */ }
}
