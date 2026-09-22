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
//   2. на одном бойце одновременно один бафф; пока действует — не подсвечивается;
//   3. разным своим бойцам — одновременно можно;
//   4. сгорает сразу: из набора −1, из запаса −1;
//   5. неиспользованные после боя возвращаются в запас;
//   6. боец пал — остаток эффекта пропадает;
//   7. на павшего бросить нельзя;
//   8. бой кончился во время баффа — эффект просто прекращается.
//
// Экспортирует: buffFightState, bindBuffArena, unbindBuffArena, buffStartFight,
//               buffEndFight, buffTick, armBuffCard, cancelBuffArm.
import { reactive } from 'vue';
import * as THREE from 'three';
import { BUFF_IDS, BUFF_META, BUFF_BALANCE, rollDie } from '@/data/buffBalance.js';
import { buildTowel, buildBucket, buildDice, buildActionGlow } from '@/scene/buffItems.js';
import {
  armDiceCharge, clearDiceCharge, clearAllDiceCharges, diceChargeOf, watchDiceCharge,
} from './buffStrike.js';
import {
  readStock, readKit, defaultKitFrom, spendFromStock, refundToStock,
  ensureStarterStock, writeKit,
} from './buffStock.js';

/**
 * ЧТО ВИДИТ ЭКРАН. Панель и значки читают отсюда и больше ниоткуда.
 *   active   — бой идёт, панель на экране
 *   cards    — карточки набора: { key, id, name, mono, left, state }
 *   armedKey — какая карточка выбрана (ждёт тапа по бойцу) или null
 *   badges   — значки над бойцами: { key, id, mono, own, face, ring, x, y }
 *   marks    — подсветка целей: места своих бойцов, на которых можно бросить
 *   hint     — короткая подсказка под панелью (что сейчас делать)
 */
export const buffFightState = reactive({
  active: false,
  cards: [],
  armedKey: null,
  badges: [],
  marks: [],
  hint: '',
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

// ── Привязка / отвязка ───────────────────────────────────────────────────

/**
 * Арена зовёт это один раз при сборке. Пока не позвали, баффов не существует
 * вовсе: панель не показывается, палец не ловится, бот не бросает.
 */
export function bindBuffArena({ scene, camera, canvas, field, reduced = false }) {
  A = { scene, camera, canvas, field, reduced };
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointerup', onPointerUp);
  // Заряд кубика меняется не по нашему кадру, а по попаданиям — значок должен
  // узнавать об этом сразу, иначе кольцо отстаёт на кадр.
  unwatchDice = watchDiceCharge(() => { syncCards(); });
  return unbindBuffArena;
}

/** Уход с арены. Всё снимается, чтобы следующий бой начался с чистого. */
export function unbindBuffArena() {
  if (!A) return;
  A.canvas.removeEventListener('pointerdown', onPointerDown);
  A.canvas.removeEventListener('pointerup', onPointerUp);
  if (unwatchDice) { unwatchDice(); unwatchDice = null; }
  buffEndFight({ refund: false }); // уход с арены — не конец боя, возвращать нечего
  disposeFlying();
  A = null;
}

// ── Начало и конец боя ───────────────────────────────────────────────────

/**
 * НОВЫЙ БОЙ. Набор берётся из запаса и СРАЗУ списывается (правило 4 говорит
 * «сгорает при применении», но списать надо до боя — иначе два боя подряд
 * потратили бы один и тот же бафф дважды). Неиспользованное вернётся в конце.
 */
export function buffStartFight() {
  if (!A) return;
  clearEffects();
  ensureStarterStock();
  const stock = readStock();
  const saved = readKit();
  // Игрок мог не заходить в слоты вовсе — тогда набор собирается сам, по
  // правилу «по одному каждого вида, если есть; иначе чем есть».
  const wanted = saved.some((x) => x) ? saved : defaultKitFrom(stock);
  kit = [];
  for (const id of wanted) {
    if (!id) continue;
    if (spendFromStock(id)) kit.push(id); // чего нет в запасе — в бой не идёт
  }
  kitInitial = [...kit];
  botKit = rollBotKit();
  botLastThrowAt = -1e9;
  buffFightState.active = true;
  buffFightState.armedKey = null;
  syncCards();
}

/**
 * БОЙ КОНЧИЛСЯ. Эффекты просто прекращаются (правило 8), неиспользованные
 * баффы возвращаются в запас (правило 5).
 */
export function buffEndFight({ refund = true } = {}) {
  if (refund && kit.length) {
    const back = {};
    for (const id of kit) back[id] = (back[id] || 0) + 1;
    refundToStock(back);
  }
  kit = [];
  kitInitial = [];
  botKit = [];
  clearEffects();
  buffFightState.active = false;
  buffFightState.armedKey = null;
  buffFightState.cards = [];
  buffFightState.badges = [];
  buffFightState.marks = [];
  buffFightState.hint = '';
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
  const anyTarget = eligibleTargets().length > 0;
  buffFightState.cards = BUFF_IDS.filter((id) => counts.has(id)).map((id) => {
    const left = counts.get(id);
    let state = 'normal';
    if (left <= 0) state = 'empty';
    else if (buffFightState.armedKey === id) state = 'selected';
    else if (!anyTarget) state = 'locked'; // все свои уже под баффом — цели не будет
    return { key: id, id, name: BUFF_META[id].name, mono: BUFF_META[id].mono, left, state };
  });
  syncBadgesList();
}

/** Свои живые бойцы, на которых МОЖНО бросить (правила 2 и 7). */
function eligibleTargets() {
  if (!A || !buffFightState.active) return [];
  return A.field.living().filter((u) => u.sideId === 'player' && !effects.has(u));
}

// ── Выбор карточки и тап по бойцу ────────────────────────────────────────

/** Тап по карточке: выбрать или снять выбор (повторный тап — отмена). */
export function armBuffCard(key) {
  if (!buffFightState.active) return;
  const card = buffFightState.cards.find((c) => c.key === key);
  if (!card || card.left <= 0) return; // потраченная карточка не выбирается
  buffFightState.armedKey = buffFightState.armedKey === key ? null : key;
  syncCards();
  updateHint();
}

/** Снять выбор. Ничего не тратится. */
export function cancelBuffArm() {
  if (!buffFightState.armedKey) return;
  buffFightState.armedKey = null;
  syncCards();
  updateHint();
}

function updateHint() {
  if (!buffFightState.active) { buffFightState.hint = ''; return; }
  if (!buffFightState.armedKey) { buffFightState.hint = ''; return; }
  buffFightState.hint = eligibleTargets().length
    ? 'TAP YOUR FIGHTER'
    : 'NO TARGET — A BUFF IS ALREADY RUNNING';
}

// Палец: тап, а не протяжка. Порог тот же, каким арена отличает тап от
// вращения камеры, — иначе выбор срабатывал бы на каждом развороте.
const TAP_SLOP_PX = 5;
let downX = 0;
let downY = 0;
let downOn = false;
const _ray = new THREE.Raycaster();
const _ndc = new THREE.Vector2();

function onPointerDown(e) {
  downOn = true; downX = e.clientX; downY = e.clientY;
}

function onPointerUp(e) {
  const wasTap = downOn && Math.hypot(e.clientX - downX, e.clientY - downY) <= TAP_SLOP_PX;
  downOn = false;
  if (!wasTap || !buffFightState.active || !buffFightState.armedKey) return;
  const unit = pickUnitAt(e.clientX, e.clientY);
  // Тап мимо бойца — отмена выбора, ничего не тратится (правило ТЗ).
  if (!unit) { cancelBuffArm(); return; }
  if (unit.sideId !== 'player' || effects.has(unit)) { cancelBuffArm(); return; }
  applyBuff(buffFightState.armedKey, unit, true);
  buffFightState.armedKey = null;
  syncCards();
  updateHint();
}

/** Кого накрыл палец. Луч из камеры по телам своих живых бойцов. */
function pickUnitAt(clientX, clientY) {
  if (!A) return null;
  const r = A.canvas.getBoundingClientRect();
  _ndc.x = ((clientX - r.left) / r.width) * 2 - 1;
  _ndc.y = -((clientY - r.top) / r.height) * 2 + 1;
  _ray.setFromCamera(_ndc, A.camera);
  const live = A.field.living().filter((u) => u.sideId === 'player');
  let best = null;
  let bestD = Infinity;
  for (const u of live) {
    const hit = _ray.intersectObject(u.f.group, true);
    if (hit.length && hit[0].distance < bestD) { bestD = hit[0].distance; best = u; }
  }
  return best;
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
  if (own) {
    const i = kit.indexOf(id);
    if (i < 0) return false;
    kit.splice(i, 1);                                           // правило 4
  } else {
    const i = botKit.indexOf(id);
    if (i < 0) return false;
    botKit.splice(i, 1);
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
    const face = rollDie();                      // ЕДИНСТВЕННЫЙ бросок на всю игру
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
  syncBadges();
  syncMarks();
}

// ── Значки над бойцами ───────────────────────────────────────────────────

const _prj = new THREE.Vector3();
const _fwd = new THREE.Vector3();
const _off = new THREE.Vector3();

/** Состав списка меняется редко — отдельно от покадрового пересчёта мест. */
function syncBadgesList() {
  const want = [];
  for (const [unit, e] of effects) {
    want.push({ key: e.key, unit, id: e.id, mono: BUFF_META[e.id].mono, own: e.own, face: e.face, ring: 1, x: -9999, y: -9999, on: false });
  }
  buffFightState.badges = want;
}

function syncBadges() {
  if (buffFightState.badges.length !== effects.size) syncBadgesList();
  if (!buffFightState.badges.length) return;
  const r = A.canvas.getBoundingClientRect();
  A.camera.getWorldDirection(_fwd);
  for (const b of buffFightState.badges) {
    const e = effects.get(b.unit);
    if (!e) { b.on = false; continue; }
    const f = b.unit.f;
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
    _prj.copy(f.group.position); _prj.y += 2.15;
    if (_fwd.dot(_off.copy(_prj).sub(A.camera.position)) <= 0) { b.on = false; continue; }
    _prj.project(A.camera);
    b.x = r.left + (_prj.x * 0.5 + 0.5) * r.width;
    b.y = r.top + (-_prj.y * 0.5 + 0.5) * r.height;
    b.on = true;
  }
}

/**
 * ПОДСВЕТКА ЦЕЛЕЙ. Пока карточка выбрана, свои бойцы, на которых МОЖНО бросить,
 * получают метку — кружок на их месте на экране.
 *
 * ⚠️ МЕТКА ПЛОСКАЯ, А НЕ В СЦЕНЕ. Подсветить тело значило бы завести на арене
 *    второе свечение рядом с ядром бойца — ровно то, что запрещено. Метка
 *    принадлежит интерфейсу, живёт поверх кадра и гаснет вместе с выбором.
 */
function syncMarks() {
  if (!buffFightState.armedKey) {
    if (buffFightState.marks.length) buffFightState.marks = [];
    return;
  }
  const r = A.canvas.getBoundingClientRect();
  A.camera.getWorldDirection(_fwd);
  const out = [];
  for (const u of eligibleTargets()) {
    _prj.copy(u.f.group.position); _prj.y += 1.1;
    if (_fwd.dot(_off.copy(_prj).sub(A.camera.position)) <= 0) continue;
    _prj.project(A.camera);
    out.push({
      key: `m${out.length}`,
      x: r.left + (_prj.x * 0.5 + 0.5) * r.width,
      y: r.top + (-_prj.y * 0.5 + 0.5) * r.height,
    });
  }
  buffFightState.marks = out;
}

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
