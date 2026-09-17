// collapseRun.js — ТУРНИР COLLAPSE. Шестнадцать сторон, сетка на выбывание,
// одна из сторон — ваша. Проиграл — турнир кончился; выиграл финал — турнир взят.
//
// ЗАЧЕМ ОТДЕЛЬНЫЙ ФАЙЛ. Про турнир знают трое: арена (выводит бойцов и говорит,
// чем кончился бой игрока), панели (показывают, что происходит) и ворота (ловят
// брошенный турнир). Держать это в арене значило бы, что панели лезут внутрь
// защищённой сцены за номером волны.
//
// ЧТО ЭТОТ ФАЙЛ НЕ ДЕЛАЕТ. Он не знает ни Three.js, ни урона, ни намерений. Бои
// он не считает сам — он их ЗАКАЗЫВАЕТ мгновенному бою (scene/instantBout.js),
// который дерётся ровно теми же правилами, что и сцена.
//
// ДВА СЛОЯ, И ЭТО НАМЕРЕННО.
//   • `createTournament` — чистая сетка без Vue: стороны, пары, кто кого прошёл.
//     Её же крутит замерщик, когда прогоняет сотню турниров подряд.
//   • `collapseState` и функции под ним — один турнир, за которым следят панели.
//   Один слой на двоих был бы либо реактивным в замере (медленно и незачем),
//   либо нереактивным в игре (панели не обновились бы).
//
// ⚠️ ОТМЕТКА ВО ВКЛАДКЕ — ТОЛЬКО ФАКТ «ТУРНИР ИДЁТ», больше ничего. Ни волны, ни
// здоровья: восстанавливать турнир с середины мы не обещаем, а половина
// сохранённого турнира хуже, чем никакого — следующий читатель примет её за
// настоящий. Отметка своя, не забеговая: прерванный забег и прерванный турнир
// не должны выдавать себя один за другого.
//
// ⚠️ НАГРАД НЕТ. Системы наград в игре нет, тема отложена владельцем. Ставку не
// показываем, бойцу ничего не пишем, награду не придумываем.
//
// Экспортирует: collapseState, createTournament, buildBotSide, startCollapse,
//               winWave, loseWave, advanceWave, clearCollapseState, endCollapse,
//               hasStaleCollapse, takeStaleCollapse, simulateSidePair.
import { reactive } from 'vue';
import { COMBAT_BALANCE } from '@/data/combatBalance.js';
import { getLayout, wavesOf, placeAfterLoss, collapseSpawnPos } from '@/data/collapseLayouts.js';
import { composeFoe } from '@/data/foeCompose.js';
import { readSection, writeSection } from '@/services/playerProgress.js';
import { runInstantBout, runInstantBoutSliced } from '@/scene/instantBout.js';

const CO = COMBAT_BALANCE.collapse;
const SECTION = 'collapse';
const MAX_HP = COMBAT_BALANCE.maxHp;

// ─── Чистая сетка ────────────────────────────────────────────────────────────

/**
 * @typedef {object} CollapseSide
 * @property {string} id       ключ стороны на плите: 'player' у игрока, 'foeN' у ботов
 * @property {boolean} isPlayer
 * @property {object[]} roster бойцы стороны: { coreId, behavior, name }
 * @property {number[]} hp     текущее здоровье каждого, абсолютом
 * @property {boolean} alive   сторона ещё в турнире
 * @property {string[]} beat   кого эта сторона уже прошла — по порядку
 */

/**
 * Сторона ботов. Число граней тянется ОДНО на всю сторону — см. причину в
 * combatBalance.collapse.
 */
export function buildBotSide(index, perSide, taken, rnd = Math.random) {
  const span = CO.botFacetsMax - CO.botFacetsMin + 1;
  const lit = CO.botFacetsMin + Math.floor(rnd() * span);
  const roster = [];
  for (let k = 0; k < perSide; k++) {
    const f = composeFoe({ litCount: lit, takenNames: taken, rnd });
    taken.push(f.name);
    // `facets` — сколько граней зажжено у этого бойца. Игроку не показывается:
    // это данные сборки стороны, по которым замер отбирает нужные ему пары.
    roster.push({ coreId: f.coreId, behavior: f.behavior, name: f.name, facets: lit });
  }
  return {
    id: `foe${index}`,
    isPlayer: false,
    roster,
    hp: roster.map(() => MAX_HP),
    alive: true,
    beat: [],
    facets: lit,          // видно замеру; игроку не показывается
  };
}

/** Перемешать на месте (посев случайный, сетка потом не меняется). */
function shuffle(arr, rnd) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Сетка турнира. Без Vue и без сцены — её крутит и игра, и замерщик.
 *
 * @param {object} o
 * @param {string} o.layoutId
 * @param {object[]} o.playerRoster бойцы игрока: { coreId, behavior, name }
 * @param {function} [o.rnd]
 */
export function createTournament({ layoutId, playerRoster, rnd = Math.random }) {
  const L = getLayout(layoutId);
  const waves = wavesOf(layoutId);
  const taken = playerRoster.map((f) => f.name).filter(Boolean);

  /** @type {CollapseSide} */
  const player = {
    id: 'player',
    isPlayer: true,
    roster: playerRoster,
    hp: playerRoster.map(() => MAX_HP),
    alive: true,
    beat: [],
    facets: null,
  };

  const sides = [player];
  for (let i = 1; i < L.sides; i++) sides.push(buildBotSide(i, L.perSide, taken, rnd));

  // ПОСЕВ СЛУЧАЙНЫЙ, СЕТКА ФИКСИРОВАНА. Порядок в `bracket` и есть сетка:
  // соседи сходятся парой, победители соседних пар сходятся на следующей волне.
  let bracket = shuffle([...sides], rnd);
  let wave = 1;

  /** Пары текущей волны: [[A,B],[C,D],…]. */
  const pairs = () => {
    const out = [];
    for (let i = 0; i < bracket.length; i += 2) out.push([bracket[i], bracket[i + 1]]);
    return out;
  };
  const playerPair = () => pairs().find((p) => p[0].isPlayer || p[1].isPlayer) || null;
  const foeOfPlayer = () => {
    const p = playerPair();
    if (!p) return null;
    return p[0].isPlayer ? p[1] : p[0];
  };

  /**
   * Записать исход пары. Проигравший выбывает; победитель забирает здоровье и
   * имя побеждённого в свой список пройденных.
   * @param {CollapseSide} winner
   * @param {CollapseSide} loser
   * @param {number[]} hpLeft остаток здоровья бойцов ПОБЕДИТЕЛЯ, по порядку
   */
  const applyResult = (winner, loser, hpLeft) => {
    loser.alive = false;
    winner.hp = winner.hp.map((_, i) => {
      // Остаток прошлого боя плюс добавка, не выше полного. Павший в выигранном
      // бою возвращается с одной добавкой — это не особое правило, а то же
      // «остаток + добавка» при остатке ноль.
      const left = Math.max(0, hpLeft[i] != null ? hpLeft[i] : 0);
      return Math.min(MAX_HP, left + CO.healBetweenWaves * MAX_HP);
    });
    winner.beat.push(nameOf(loser));
  };

  /** Свести победителей в следующую волну. */
  const advance = () => {
    bracket = bracket.filter((s) => s.alive);
    wave += 1;
  };

  return {
    layoutId, perSide: L.perSide, sides,
    waves,
    player,
    wave: () => wave,
    bracket: () => bracket,
    pairs, playerPair, foeOfPlayer,
    applyResult, advance,
    sidesLeft: () => bracket.length,
    isFinal: () => wave >= waves,
  };
}

/** Имя стороны так, как её называет панель. */
export function nameOf(side) {
  if (!side || !side.roster.length) return '—';
  const first = side.roster[0].name || '—';
  return side.roster.length > 1 ? `${first} TEAM` : first;
}

// ─── Как считается одна пара ─────────────────────────────────────────────────

/** Состав пары для мгновенного боя: две стороны по своим шеренгам. */
function specsFor(a, b, perSide) {
  const specs = [];
  const put = (side, isSideA) => {
    side.roster.forEach((f, k) => {
      specs.push({
        sideId: side.id,
        coreId: f.coreId,
        behavior: f.behavior,
        side: isSideA ? 'player' : 'opponent',
        pos: collapseSpawnPos(perSide, isSideA, k),
        // Здоровье несётся между волнами: сторона выходит с тем, с чем вышла из
        // прошлого боя. Первая волна — у всех полное.
        startHp: side.hp[k],
      });
    });
  };
  put(a, true);
  put(b, false);
  return specs;
}

/** Разложить исход боя обратно по сторонам: кто выиграл и с каким здоровьем. */
function readResult(res, a, b) {
  const winner = res.winner === a.id ? a : b;
  const loser = winner === a ? b : a;
  const hpLeft = res.units.filter((u) => u.sideId === winner.id).map((u) => u.hp);
  return { winner, loser, hpLeft, sec: res.sec };
}

/** Посчитать пару целиком, здесь и сейчас. Для замера — не для живого экрана. */
export function simulateSidePair(a, b, perSide) {
  return readResult(runInstantBout(specsFor(a, b, perSide)), a, b);
}

/** То же по кусочкам — так это считается в игре, пока игрок смотрит свой бой. */
function simulateSidePairSliced(a, b, perSide) {
  const run = runInstantBoutSliced(specsFor(a, b, perSide));
  return { promise: run.promise.then((res) => readResult(res, a, b)), cancel: run.cancel };
}

// ─── Ход турнира — то, за чем следят панели ──────────────────────────────────

/**
 * Ход турнира.
 *   active    — турнир идёт (между стартом и любым итогом)
 *   layoutId  — раскладка
 *   wave      — какая волна дерётся прямо сейчас, 1..waves
 *   nextWave  — какая будет следующей. Панель между волнами рассказывает про НЕЁ
 *   waves     — сколько всего
 *   phase     — 'fight' дерутся · 'between' панель между волнами · 'done' итог
 *               · 'short' бойцов не хватает, турнир не начался
 *   outcome   — null пока идёт · 'won' турнир взят · 'out' выбыли
 *   sidesLeft — сколько сторон осталось ПОСЛЕ прошедшей волны
 *   hpRows    — что стало со здоровьем бойцов игрока: [{ name, before, after }]
 *   foeName   — как зовут следующего соперника
 *   beat      — кого сторона игрока уже прошла
 *   place     — место, когда турнир кончился: { from, to, of }
 *   shortBy   — скольких бойцов не хватает (при phase === 'short')
 */
export const collapseState = reactive({
  active: false,
  layoutId: 'solo',
  wave: 1,
  nextWave: 2,
  waves: 4,
  phase: 'fight',
  outcome: null,
  sidesLeft: 0,
  hpRows: [],
  foeName: '',
  beat: [],
  place: null,
  shortBy: 0,
});

// Живой турнир и незавершённые расчёты чужих пар. Держим снаружи состояния:
// панелям они не нужны, а реактивность на них стоила бы зря.
let T = null;
let pending = [];        // { cancel }
let waveReady = null;    // обещание: чужие пары этой волны посчитаны

// ─── Отметка во вкладке ──────────────────────────────────────────────────────

function mark(on) {
  writeSection(SECTION, on ? { run: true } : null);
}

/**
 * Брошен ли турнир. `skip` — признак деки: она живёт в ТОЙ ЖЕ вкладке и в той же
 * памяти, поэтому без этой оговорки инвестору выпало бы сообщение от чужого
 * турнира (тот же урок, что с забегом).
 */
export function hasStaleCollapse(skip = false) {
  if (skip) return false;
  const saved = readSection(SECTION);
  return !!(saved && saved.run);
}

/** Забрать факт брошенного турнира и стереть отметку. Второй раз вернёт false. */
export function takeStaleCollapse(skip = false) {
  if (!hasStaleCollapse(skip)) return false;
  mark(false);
  return true;
}

// ─── Ход ─────────────────────────────────────────────────────────────────────

/** Посчитать ВСЕ пары текущей волны, кроме пары игрока. Кусочками, не разом. */
function computeOtherPairs() {
  cancelPending();
  const perSide = T.perSide;
  const others = T.pairs().filter((p) => !p[0].isPlayer && !p[1].isPlayer);
  const runs = others.map(([a, b]) => simulateSidePairSliced(a, b, perSide));
  pending = runs;
  waveReady = Promise.all(runs.map((r) => r.promise)).then((results) => {
    for (const r of results) T.applyResult(r.winner, r.loser, r.hpLeft);
    pending = [];
  });
  return waveReady;
}

function cancelPending() {
  for (const r of pending) { try { r.cancel(); } catch (_) { /* уже кончился */ } }
  pending = [];
}

/**
 * Строки «что стало со здоровьем» для панели, в процентах.
 *
 * ⚠️ `left` — ОСТАТОК ПОСЛЕ БОЯ, а не здоровье, с которым боец в этот бой вышел.
 *    Панель рассказывает, что бой сделал и что вернула волна: «62 → 87». Павший
 *    в выигранном бою даёт «0 → 25» — не особое правило, а то же «остаток плюс
 *    добавка» при остатке ноль. Подставь сюда здоровье НА ВХОДЕ — и панель
 *    начнёт врать тем сильнее, чем тяжелее дался бой.
 */
function hpRowsOf(left) {
  return T.player.roster.map((f, i) => ({
    name: f.name || '—',
    before: Math.round((Math.max(0, left[i] || 0) / MAX_HP) * 100),
    after: Math.round((T.player.hp[i] / MAX_HP) * 100),
  }));
}

/**
 * Обновить то, что видно панелям, по живой сетке.
 *
 * ⚠️ НОМЕР ТЕКУЩЕЙ ВОЛНЫ ЗДЕСЬ НЕ ТРОГАЕТСЯ. Он и есть тот рычаг, по которому
 *    сцена выводит бойцов: она следит за `wave` и на каждую смену начинает бой.
 *    Двинь его здесь — и следующая волна начнётся ПОД панелью между волнами,
 *    прямо пока игрок её читает. Номер двигает только advanceWave, то есть
 *    нажатие NEXT. Сетка при этом уже ушла вперёд — про неё рассказывает
 *    `nextWave`.
 */
function syncState() {
  collapseState.nextWave = T.wave();
  collapseState.waves = T.waves;
  collapseState.sidesLeft = T.sidesLeft();
  collapseState.foeName = nameOf(T.foeOfPlayer());
  collapseState.beat = [...T.player.beat];
}

/**
 * Начать турнир. Первая волна дерётся сразу — панели перед ней нет.
 * @param {string} layoutId
 * @param {object[]} playerRoster бойцы игрока: { coreId, behavior, name }
 */
export function startCollapse(layoutId, playerRoster) {
  T = createTournament({ layoutId, playerRoster });
  collapseState.active = true;
  collapseState.layoutId = layoutId;
  collapseState.phase = 'fight';
  collapseState.outcome = null;
  collapseState.hpRows = [];
  collapseState.place = null;
  collapseState.shortBy = 0;
  collapseState.wave = 1;
  syncState();
  // На старте сетка ещё на первой волне, и «следующая» совпала бы с текущей.
  // Панели между волнами перед первой волной нет, так что показывать это некому.
  mark(true);
  computeOtherPairs();
  return T;
}

/** Бойцов в ростере меньше, чем просит раскладка. Турнир не начинается. */
export function shortOfFighters(layoutId, have) {
  const L = getLayout(layoutId);
  collapseState.active = true;
  collapseState.layoutId = layoutId;
  collapseState.phase = 'short';
  collapseState.outcome = null;
  collapseState.shortBy = Math.max(0, L.perSide - have);
  // Отметку НЕ ставим: турнир не начался, бросать нечего.
}

/** С каким здоровьем бойцы игрока выходят в текущую волну — абсолютом. */
export function playerStartHp() {
  return T ? [...T.player.hp] : [];
}

/** Состав чужой стороны текущей волны — её сцена и выводит на плиту. */
export function currentFoeRoster() {
  const foe = T && T.foeOfPlayer();
  return foe ? foe.roster : [];
}

/**
 * Волна выиграна. `hpLeft` — остаток здоровья бойцов игрока, абсолютом и по
 * порядку; у павшего ноль.
 *
 * Ждём, пока досчитаются чужие пары: без них неизвестно, кто выйдет следующим, а
 * панель именно про это и рассказывает. Ждать почти не приходится — расчёт идёт
 * с начала волны, пока игрок смотрит свой бой.
 *
 * @returns {Promise<boolean>} true — турнир продолжается, false — турнир взят
 */
export async function winWave(hpLeft) {
  if (!collapseState.active || collapseState.phase !== 'fight') return false;
  await (waveReady || Promise.resolve());
  if (!collapseState.active) return false;      // ушли, пока считалось
  const pair = T.playerPair();
  if (!pair) return false;
  const foe = T.foeOfPlayer();
  T.applyResult(T.player, foe, hpLeft);
  // Здоровье уже перенесено — показываем «остаток → стало» на тех же числах,
  // которыми боец выйдет в следующую волну. Второго счёта нет.
  const rows = hpRowsOf(hpLeft);

  if (T.isFinal()) {
    collapseState.phase = 'done';
    collapseState.outcome = 'won';
    collapseState.place = { from: 1, to: 1, of: getLayout(T.layoutId).sides };
    collapseState.hpRows = rows;
    collapseState.beat = [...T.player.beat];
    mark(false);
    return false;
  }

  T.advance();
  syncState();
  collapseState.hpRows = rows;
  collapseState.phase = 'between';
  computeOtherPairs();   // чужие пары следующей волны — пока игрок читает панель
  return true;
}

/** Волна проиграна — турнир кончился, оставшуюся сетку дальше не считаем. */
export function loseWave() {
  if (!collapseState.active || collapseState.phase !== 'fight') return;
  cancelPending();
  waveReady = null;
  collapseState.phase = 'done';
  collapseState.outcome = 'out';
  collapseState.place = placeAfterLoss(T.layoutId, T.wave());
  collapseState.beat = T ? [...T.player.beat] : [];
  mark(false);
}

/**
 * Игрок нажал NEXT. Переводит турнир на следующую волну.
 *
 * ⚠️ Двойное нажатие: переводит ТОЛЬКО из состояния «между волнами». Второе
 *    нажатие приходит уже в 'fight' и не делает ничего — волна не запускается
 *    дважды.
 * @returns {boolean} перевели или нет
 */
export function advanceWave() {
  if (!collapseState.active || collapseState.phase !== 'between') return false;
  collapseState.phase = 'fight';
  // Вот теперь номер волны двигается — и сцена по нему выводит бойцов.
  collapseState.wave = collapseState.nextWave;
  return true;
}

/**
 * Погасить ход турнира, НЕ ТРОГАЯ ОТМЕТКУ. Нужно обычному бою: состояние живёт
 * в памяти страницы и переживает уход с арены, поэтому заход в DUEL после
 * брошенного турнира нашёл бы здесь чужую волну. Отметку при этом стирать
 * нельзя — по ней ворота и узнают, что турнир бросили.
 */
export function clearCollapseState() {
  cancelPending();
  waveReady = null;
  T = null;
  collapseState.active = false;
  collapseState.wave = 1;
  collapseState.nextWave = 2;
  collapseState.phase = 'fight';
  collapseState.outcome = null;
  collapseState.hpRows = [];
  collapseState.foeName = '';
  collapseState.beat = [];
  collapseState.place = null;
  collapseState.shortBy = 0;
}

/** Турнир кончился и игрок ушёл — гасим всё, отметку в том числе. */
export function endCollapse() {
  clearCollapseState();
  mark(false);
}
