// klich.js — КЛИЧ В БОЮ. Правила, применение и подача.
//
// ЗАЧЕМ ОТДЕЛЬНЫЙ ФАЙЛ, И ПОЧЕМУ ОН ЗЕРКАЛО services/buffs.js. Про клич знают
// трое: ряд карт (он один знает, как об этом сказать), арена (она одна знает,
// где стоят бойцы и куда тыкнул палец) и боец (у него одного есть рычаг).
// Держать правила внутри арены значило бы, что защищённая сцена обрастает
// продуктовой логикой; держать их в панели — что панель лезет в сцену. Поэтому
// правила здесь, посередине, ровно как у баффов.
//
// ЧЕМ КЛИЧ ОТЛИЧАЕТСЯ ОТ БАФФА. Бафф двигает то, НАСКОЛЬКО боец силён. Клич
// двигает то, КАК он дерётся. Это два разных рычага, и они не дублируются: клич
// не лечит, не считает урон и не трогает скорость удара — он только кренит
// манеру в названную сторону на несколько секунд.
//
// ЧТО ЭТОТ ФАЙЛ НЕ ДЕЛАЕТ:
//   · не заводит своих чисел — все в data/klichBalance.js;
//   · не двигает оси сам — это делает боец, ему отдаётся готовый сдвиг;
//   · не решает, кто чья цель, — это поле боя;
//   · не рисует ряд и значок — это Vue-компоненты, они читают состояние ниже.
//
// ПРАВИЛА (ТЗ «Возвращение клича»):
//   1. три клича, доступны в любом бою;
//   2. три применения на КАЖДЫЙ клич за бой, по каждому отдельно;
//   3. запас не восстанавливается — это не перезарядка по времени;
//   4. новый клич на того же бойца ЗАМЕНЯЕТ предыдущий, а не складывается;
//   5. клич и бафф на одном бойце работают одновременно — это разные величины;
//   6. боты кличами не пользуются;
//   7. боец пал — сдвиг гаснет с ним, заряд НЕ возвращается;
//   8. бой кончился — ничего не переносится в следующий;
//   9. заряды кончились — карта гаснет и не нажимается (причина — счётчик ×0);
//  10. клич адресный: применяется одному бойцу, выбранному пальцем.
//
// ⚠️ НИГДЕ НЕ СОХРАНЯЕТСЯ. Обновление страницы = новый бой с полным запасом.
//    Это ТЗ дословно, а не недоделка: заряды живут ровно один бой.
//
// Экспортирует: klichFightState, bindKlichArena, unbindKlichArena,
//               klichStartFight, klichEndFight, klichTick,
//               armKlichCard, cancelKlichArm.
import { reactive, watch } from 'vue';
import * as THREE from 'three';
import { KLICH_IDS, KLICH_META, KLICH_BALANCE } from '@/data/klichBalance.js';
// Взаимное исключение с баффами — см. ниже, у watch.
import { buffFightState, cancelBuffArm } from './buffs.js';

/**
 * ЧТО ВИДИТ ЭКРАН. Ряд карт и значки читают отсюда и больше ниоткуда.
 *   active   — бой идёт, ряд на экране
 *   cards    — карты: { key, id, name, mono, glyph, left, state }
 *   armedKey — какая карта выбрана (ждёт тапа по бойцу) или null
 *   badges   — значки над бойцами: { key, id, glyph, ring, x, y, on }
 *   marks    — подсветка целей: места своих бойцов, которым можно крикнуть
 *   hint     — ключ подсказки под рядом ('tapFighter' | 'noTarget' | '')
 */
export const klichFightState = reactive({
  active: false,
  cards: [],
  armedKey: null,
  badges: [],
  marks: [],
  hint: '',
});

// ── Привязка к арене ─────────────────────────────────────────────────────
// Арена отдаёт три вещи и больше ничего: чем считать экранные координаты, по
// чему ловить палец и где брать живых бойцов. Сцена кличу не нужна вовсе — он
// ничего не кладёт в трёхмерный мир (у баффов там летящие предметы, у клича
// предметов нет).
let A = null; // { camera, canvas, field }

/** Сколько применений каждого клича осталось В ЭТОМ БОЮ. */
let charges = {};
/** Действующие сдвиги: боец → что на нём висит. */
const effects = new Map();
/** Свой номер каждому значку. Записи бойцов своих номеров не имеют. */
let badgeSeq = 0;
/** Время боя, которое отдаёт арена. */
let nowT = 0;
/**
 * Были ли цели на прошлом кадре.
 *
 * ⚠️ БЕЗ ЭТОГО КАРТЫ ЗАМИРАЮТ В «ЦЕЛЕЙ НЕТ». На старте боя плита ПУСТА: бойцов
 *    на неё ставят позже, уже в кадрах. Состояние карт считается один раз, в
 *    klichStartFight, и там целей честно ноль — а пересчитать потом было нечему,
 *    и весь бой карты стояли запертыми (поймано снимком экрана). Поэтому
 *    доступность целей проверяется каждый кадр, а карты пересобираются ТОЛЬКО
 *    когда она изменилась: пересобирать их шестьдесят раз в секунду незачем.
 */
let lastAnyTarget = null;
let stopBuffWatch = null;

// ── Привязка / отвязка ───────────────────────────────────────────────────

/**
 * Арена зовёт это один раз при сборке. Пока не позвали, клича не существует
 * вовсе: ряд не показывается, палец не ловится.
 */
export function bindKlichArena({ camera, canvas, field }) {
  A = { camera, canvas, field };
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointerup', onPointerUp);
  /**
   * ⚠️ ВЗАИМНОЕ ИСКЛЮЧЕНИЕ С БАФФАМИ, И ПОЧЕМУ ОНО ЦЕЛИКОМ ЗДЕСЬ. Оба слоя
   *    слушают один и тот же палец на одном и том же холсте. Если бы выбранными
   *    оказались разом карта баффа и карта клича, ОДИН тап по бойцу применил бы
   *    сразу оба — игрок потерял бы заряд, которого не тратил.
   *
   *    Обе стороны развязаны отсюда, из младшего слоя: выбор клича снимает выбор
   *    баффа (в armKlichCard), а выбор баффа снимает выбор клича (этот
   *    наблюдатель). В файл баффов при этом не добавлено ни строки — он про клич
   *    по-прежнему не знает.
   */
  stopBuffWatch = watch(() => buffFightState.armedKey, (k) => { if (k) cancelKlichArm(); });
  return unbindKlichArena;
}

/** Уход с арены. Всё снимается, чтобы следующий бой начался с чистого. */
export function unbindKlichArena() {
  if (!A) return;
  A.canvas.removeEventListener('pointerdown', onPointerDown);
  A.canvas.removeEventListener('pointerup', onPointerUp);
  if (stopBuffWatch) { stopBuffWatch(); stopBuffWatch = null; }
  klichEndFight();
  A = null;
}

// ── Начало и конец боя ───────────────────────────────────────────────────

/** НОВЫЙ БОЙ. Запас полный, по три на каждый клич (правило 2). */
export function klichStartFight() {
  if (!A) return;
  clearEffects();
  charges = {};
  // ⚠️ ПАМЯТЬ О ЦЕЛЯХ СБРАСЫВАЕТСЯ ИМЕННО ЗДЕСЬ. Бой начинается, когда плита ещё
  //    ПУСТА — бойцов на неё ставят позже, уже в кадрах, — а этот вызов может
  //    прийти и после того, как кадры уже шли. Без сброса память говорила бы
  //    «цели были», карты остались бы запертыми со старта и не отперлись бы
  //    никогда: пересчёт ждёт ИЗМЕНЕНИЯ, а изменения уже не будет. Поймано
  //    снимком экрана — весь бой ряд стоял серым.
  lastAnyTarget = null;
  for (const id of KLICH_IDS) charges[id] = KLICH_BALANCE.chargesPerKlich;
  klichFightState.active = true;
  klichFightState.armedKey = null;
  klichFightState.hint = '';
  syncCards();
}

/** БОЙ КОНЧИЛСЯ. Сдвиги прекращаются, ничего не переносится (правило 8). */
export function klichEndFight() {
  clearEffects();
  charges = {};
  lastAnyTarget = null;
  klichFightState.active = false;
  klichFightState.armedKey = null;
  klichFightState.cards = [];
  klichFightState.badges = [];
  klichFightState.marks = [];
  klichFightState.hint = '';
}

/** Снять все сдвиги, не трогая запас. */
function clearEffects() {
  for (const [unit] of effects) endEffect(unit);
  effects.clear();
}

/** Вернуть бойца к его собственной манере. */
function endEffect(unit) {
  const f = unit && unit.f;
  if (f && f.clearKlich) f.clearKlich();
}

// ── Карты ряда ───────────────────────────────────────────────────────────

function syncCards() {
  const anyTarget = eligibleTargets().length > 0;
  klichFightState.cards = KLICH_IDS.map((id) => {
    const left = charges[id] || 0;
    let state = 'normal';
    if (left <= 0) state = 'empty';                       // правило 9
    else if (klichFightState.armedKey === id) state = 'selected';
    else if (!anyTarget) state = 'locked';                // кричать некому
    return { key: id, id, name: KLICH_META[id].name, mono: KLICH_META[id].mono, glyph: KLICH_META[id].glyph, left, state };
  });
  syncBadgesList();
}

/**
 * Свои живые бойцы. В отличие от баффов, боец УЖЕ ПОД КЛИЧЕМ остаётся целью:
 * новый клич заменяет предыдущий (правило 4), а не отбивается.
 */
function eligibleTargets() {
  if (!A || !klichFightState.active) return [];
  return A.field.living().filter((u) => u.sideId === 'player');
}

// ── Выбор карты и тап по бойцу ───────────────────────────────────────────

/** Тап по карте: выбрать или снять выбор (повторный тап — отмена). */
export function armKlichCard(key) {
  if (!klichFightState.active) return;
  const card = klichFightState.cards.find((c) => c.key === key);
  if (!card) return;
  // Правило 9: карта с нулём зарядов погашена и ОТКЛЮЧЕНА разметкой, поэтому
  // тап по ней сюда не доходит вовсе. Видимая причина — сам счётчик ×0 и
  // приглушение, как у баффов. Подсказки на этот случай нет намеренно: её
  // нельзя было бы вызвать, и она осталась бы мёртвым кодом.
  if (card.left <= 0) return;
  klichFightState.armedKey = klichFightState.armedKey === key ? null : key;
  if (klichFightState.armedKey) cancelBuffArm(); // см. шапку bindKlichArena
  syncCards();
  updateHint();
}

/** Снять выбор. Ничего не тратится. */
export function cancelKlichArm() {
  if (!klichFightState.armedKey) return;
  klichFightState.armedKey = null;
  syncCards();
  updateHint();
}

function updateHint() {
  if (!klichFightState.active) { klichFightState.hint = ''; return; }
  if (!klichFightState.armedKey) { klichFightState.hint = ''; return; }
  // Отдаём КЛЮЧ, а не готовую строку: слова живут в локали, а этот файл про
  // правила. Разбирает ключ ряд — он один умеет говорить.
  klichFightState.hint = eligibleTargets().length ? 'tapFighter' : 'noTarget';
}

// Палец: тап, а не протяжка. Порог тот же, каким арена отличает тап от
// вращения камеры, и тот же, что у баффов.
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
  if (!wasTap || !klichFightState.active || !klichFightState.armedKey) return;
  const unit = pickUnitAt(e.clientX, e.clientY);
  // Тап мимо бойца — отмена выбора, ничего не тратится (ТЗ).
  if (!unit || unit.sideId !== 'player') { cancelKlichArm(); return; }
  applyKlich(klichFightState.armedKey, unit);
  klichFightState.armedKey = null;
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

// ── Применение клича ─────────────────────────────────────────────────────

/**
 * Крикнуть бойцу. Заряд сгорает в момент броска — не раньше: обновление
 * страницы посреди боя не должно съедать запас (та же дыра, что ловили у
 * баффов; здесь она закрыта тем, что запас вообще живёт один бой).
 */
function applyKlich(id, unit) {
  if (!A || !unit || !unit.f || unit.dead) return false;
  if (!(charges[id] > 0)) return false;
  const f = unit.f;
  if (!f.applyKlich) return false; // боец без рычага — молча ничего
  charges[id] -= 1;
  // Правило 4: новый клич ЗАМЕНЯЕТ предыдущий. Рычаг бойца сам перезаписывает
  // сдвиг, поэтому снимать старый отдельно не нужно — довольно заменить запись.
  f.applyKlich(KLICH_BALANCE.axes[id], KLICH_BALANCE.holdSec, KLICH_BALANCE.fadeSec);
  const total = KLICH_BALANCE.holdSec + KLICH_BALANCE.fadeSec;
  effects.set(unit, { id, startedAt: nowT, until: nowT + total, key: `k${++badgeSeq}` });
  return true;
}

// ── Кадр ─────────────────────────────────────────────────────────────────

/**
 * Зовётся ареной каждый кадр: срок сдвигов и экранные места значков и меток.
 *
 * @param {number} dt секунд с прошлого кадра (не нужен, принимается для
 *                    единообразия с buffTick — обе обвязки зовутся рядом)
 * @param {number} t  время боя (часы арены)
 */
export function klichTick(dt, t) {
  nowT = t;
  if (!A || !klichFightState.active) return;

  const anyTarget = eligibleTargets().length > 0;
  if (anyTarget !== lastAnyTarget) { lastAnyTarget = anyTarget; syncCards(); }

  for (const [unit, e] of [...effects]) {
    const f = unit.f;
    // Боец пал — сдвиг гаснет с ним, заряд не возвращается (правило 7).
    if (!f || unit.dead || f.getHp() <= 0) { endEffect(unit); effects.delete(unit); continue; }
    if (t >= e.until) { endEffect(unit); effects.delete(unit); }
  }

  syncBadges();
  syncMarks();
}

// ── Значки над бойцами ───────────────────────────────────────────────────

/**
 * ГДЕ СТОИТ ЗНАЧОК. На уровне груди и сдвинут вбок — та же высота и тот же
 * приём, что у баффов: над головой живёт плашка здоровья, и залезать на неё
 * нельзя.
 *
 * ⚠️ СВОЙ БОК, А НЕ ЧУЖОЙ. Значок баффа у своего бойца стоит СПРАВА. Клич
 *    бывает только у своих, значит правая сторона у своего бойца уже занята —
 *    поэтому клич встаёт СЛЕВА. Так на одном бойце помещаются оба значка
 *    (правило 5: клич и бафф работают одновременно), и они не лягут друг на
 *    друга ни на каком отдалении камеры.
 */
const BADGE_BODY_Y = 1.30;
const BADGE_SIDE_PX = -40;

const _prj = new THREE.Vector3();
const _fwd = new THREE.Vector3();
const _off = new THREE.Vector3();

/**
 * ⚠️ ЗАПИСЬ БОЙЦА В СОСТОЯНИЕ ЭКРАНА НЕ КЛАДЁТСЯ. Состояние реактивное: всё, что
 *    в него положено, Vue оборачивает своей обёрткой — вглубь, до тел Three.js.
 *    Обёртка не равна самому бойцу, и поиск по ней промахивался бы. Та же
 *    причина и то же решение, что у баффов.
 */
const badgeUnits = new Map(); // ключ значка → запись бойца (вне реактивности)

function syncBadgesList() {
  badgeUnits.clear();
  const want = [];
  for (const [unit, e] of effects) {
    badgeUnits.set(e.key, unit);
    want.push({ key: e.key, id: e.id, glyph: KLICH_META[e.id].glyph, mono: KLICH_META[e.id].mono, ring: 1, x: -9999, y: -9999, on: false });
  }
  klichFightState.badges = want;
}

function syncBadges() {
  if (klichFightState.badges.length !== effects.size) syncBadgesList();
  if (!klichFightState.badges.length) return;
  const r = A.canvas.getBoundingClientRect();
  A.camera.getWorldDirection(_fwd);
  for (const b of klichFightState.badges) {
    const unit = badgeUnits.get(b.key);
    const e = unit && effects.get(unit);
    if (!e) { b.on = false; continue; }
    const dur = e.until - e.startedAt;
    b.ring = dur > 0 ? Math.max(0, (e.until - nowT) / dur) : 0;
    _prj.copy(unit.f.group.position); _prj.y += BADGE_BODY_Y;
    // За спиной у камеры проекция переворачивается и дала бы значок не с той
    // стороны — такой кадр просто прячется.
    if (_fwd.dot(_off.copy(_prj).sub(A.camera.position)) <= 0) { b.on = false; continue; }
    _prj.project(A.camera);
    b.x = r.left + (_prj.x * 0.5 + 0.5) * r.width + BADGE_SIDE_PX;
    b.y = r.top + (-_prj.y * 0.5 + 0.5) * r.height;
    b.on = true;
  }
}

/**
 * ПОДСВЕТКА ЦЕЛЕЙ. Пока карта выбрана, свои бойцы получают метку — кружок на их
 * месте на экране.
 *
 * ⚠️ МЕТКА ПЛОСКАЯ, А НЕ В СЦЕНЕ. Подсветить тело значило бы завести на арене
 *    второе свечение рядом с ядром бойца — ровно то, что запрещено. Метка
 *    принадлежит интерфейсу, живёт поверх кадра и гаснет вместе с выбором.
 */
function syncMarks() {
  if (!klichFightState.armedKey) {
    if (klichFightState.marks.length) klichFightState.marks = [];
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
  klichFightState.marks = out;
}
