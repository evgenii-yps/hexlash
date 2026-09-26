// fighterSelect.js — КТО ВЫБРАН. Один боец на стороне игрока, всегда.
//
// ЗАЧЕМ ОТДЕЛЬНЫЙ ФАЙЛ. До этой работы порядок был обратный: сначала предмет,
// потом боец, — и ловить палец приходилось ДВАЖДЫ, в кличах и в баффах, одним и
// тем же кодом. Теперь боец выбирается сам по себе, раньше и независимо от
// рычагов, поэтому палец ловится ОДИН раз и здесь. Кличи и баффы спрашивают
// «кто выбран» и больше ничего про палец не знают.
//
// ГЛАВНОЕ ПРАВИЛО (ТЗ 26.09.2026). Выбранный боец есть ВСЕГДА — с первого кадра
// боя и до конца. Не «можно выбрать», а «всегда кто-то выбран». Отдельного
// поведения для боя один на один нет: там боец выбран сам собой, и игрок
// разницы не замечает. Одна механика вместо двух — чтобы не переучиваться при
// переходе из дуэли в отряд.
//
// ПРАВИЛА:
//   1. выбирается ЛЮБОЙ живой боец на стороне игрока — и свой, и союзный бот
//      (в рейде на стороне игрока трое союзников, отрезать их нельзя);
//   2. соперники, павшие и пустое место не выбираются — тап по ним не делает
//      ничего, прежний выбор остаётся;
//   3. стартовый выбор — СОБСТВЕННЫЙ боец игрока, не бот;
//   4. снять выбор нельзя ничем: без выбранного панель рычагов бесполезна;
//   5. выбранный пал — выбор сам перескакивает на следующего живого на стороне
//      игрока (панель не пустует посреди боя);
//   6. бой кончился — выбора нет, метка гаснет.
//
// ЧТО ЭТОТ ФАЙЛ НЕ ДЕЛАЕТ:
//   · не знает про кличи и баффы — они спрашивают его, не наоборот;
//   · ничего не кладёт в трёхмерный мир: метка плоская, поверх кадра;
//   · не заводит своих чисел — их у выбора нет вовсе;
//   · не рисует метку и панель — это Vue-компонент, он читает состояние ниже.
//
// ⚠️ НИГДЕ НЕ СОХРАНЯЕТСЯ. Обновление страницы = новый бой, выбран собственный
//    боец. Это ТЗ дословно.
//
// Экспортирует: selectState, bindSelectArena, unbindSelectArena,
//               selectStartFight, selectEndFight, selectTick, selectedUnit.
import { reactive } from 'vue';
import * as THREE from 'three';
import { getCore } from '@/data/upgradeData.js';

/**
 * ЧТО ВИДИТ ЭКРАН. Панель рычагов и метка читают отсюда и больше ниоткуда.
 *   active — бой идёт и кто-то выбран
 *   key    — номер выбора: меняется, когда сменился боец (панель по нему
 *            перерисовывает заголовок и цвет)
 *   name   — заголовок панели: ник бойца, а у союзного бота — имя его ядра
 *   coreId — ядро выбранного: им панель красится
 *   own    — собственный боец игрока (иначе союзный бот)
 *   mark   — плоская метка на его месте на экране: { x, y, on }
 *
 * ⚠️ САМОЙ ЗАПИСИ БОЙЦА ЗДЕСЬ НЕТ. Состояние реактивное: всё, что в него
 *    положено, Vue оборачивает своей обёрткой — вглубь, до тел Three.js.
 *    Обёртка не равна самому бойцу, и сравнение по ней промахивалось бы. Та же
 *    причина и то же решение, что у значков кличей и баффов.
 */
export const selectState = reactive({
  active: false,
  key: 0,
  name: '',
  coreId: '',
  own: false,
  mark: { x: -9999, y: -9999, on: false },
});

// ── Привязка к арене ─────────────────────────────────────────────────────
// Арена отдаёт три вещи и больше ничего: чем считать экранные координаты, по
// чему ловить палец и где брать живых бойцов. Сцена выбору не нужна вовсе — он
// ничего в трёхмерный мир не кладёт.
let A = null; // { camera, canvas, field }

/** Выбранный боец — ВНЕ реактивного состояния, см. предупреждение выше. */
let selected = null;
/** Свой номер каждой смене выбора. */
let seq = 0;

/**
 * Арена зовёт это один раз при сборке. Пока не позвали, выбора не существует:
 * палец не ловится, метки нет.
 */
export function bindSelectArena({ camera, canvas, field }) {
  A = { camera, canvas, field };
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointerup', onPointerUp);
  return unbindSelectArena;
}

/** Уход с арены. Всё снимается, чтобы следующий бой начался с чистого. */
export function unbindSelectArena() {
  if (!A) return;
  A.canvas.removeEventListener('pointerdown', onPointerDown);
  A.canvas.removeEventListener('pointerup', onPointerUp);
  selectEndFight();
  A = null;
}

// ── Начало и конец боя ───────────────────────────────────────────────────

/**
 * НОВЫЙ БОЙ. Выбор сбрасывается, и первым будет собственный боец игрока.
 *
 * ⚠️ ЗДЕСЬ ВЫБРАТЬ ЕЩЁ НЕКОГО, И ЭТО НОРМАЛЬНО. Бой начинается, когда плита
 *    ПУСТА — бойцов на неё ставят позже, уже в кадрах. Поэтому выбор не
 *    назначается тут, а ДОБИРАЕТСЯ каждый кадр, пока не найдётся кого выбрать
 *    (см. selectTick). Ровно на этой ловушке ряд карт клича однажды замер в
 *    «целей нет» на весь бой: состояние считалось один раз, на пустой плите.
 */
export function selectStartFight() {
  if (!A) return;
  selected = null;
  selectState.active = false;
  selectState.mark.on = false;
  publish();
}

/** БОЙ КОНЧИЛСЯ. Выбора нет, метка гаснет. */
export function selectEndFight() {
  selected = null;
  selectState.active = false;
  selectState.key = 0;
  selectState.name = '';
  selectState.coreId = '';
  selectState.own = false;
  selectState.mark.on = false;
}

// ── Кто выбран ───────────────────────────────────────────────────────────

/**
 * Запись выбранного бойца, или null. Спрашивают кличи и баффы — им нужен сам
 * боец, а не его описание для экрана.
 */
export function selectedUnit() {
  return isPickable(selected) ? selected : null;
}

/** Живые на стороне игрока. И свои, и союзные боты (правило 1). */
function ourSide() {
  if (!A) return [];
  return A.field.living().filter((u) => u.sideId === 'player');
}

/** Годен ли боец в выбранные прямо сейчас. */
function isPickable(u) {
  if (!u || u.dead || !u.f) return false;
  if (u.sideId !== 'player') return false;          // правило 2
  return u.f.getHp() > 0;
}

/**
 * Назначить выбранного. Публикует заголовок и цвет только если боец правда
 * сменился: панель меняется заметно, и дёргать её каждый кадр незачем.
 */
function setSelected(u) {
  if (selected === u) return;
  selected = u;
  seq += 1;
  publish();
}

/** Переписать описание выбранного в состояние экрана. */
function publish() {
  if (!isPickable(selected)) {
    selectState.active = false;
    selectState.mark.on = false;
    return;
  }
  const spec = selected.spec || {};
  const core = getCore(spec.coreId);
  // ЗАГОЛОВОК. Ник, а у союзного бота ника нет — тогда имя его ядра. Пустого
  // заголовка быть не должно: панель без него выглядит сломанной (ТЗ).
  selectState.name = spec.name || (core ? core.name : '');
  selectState.coreId = spec.coreId || '';
  selectState.own = !spec.isBot;
  selectState.key = seq;
  selectState.active = true;
}

/**
 * Добрать выбор, если выбирать некого или выбранный пал (правила 3 и 5).
 * Сначала СОБСТВЕННЫЙ боец игрока, и только если своих не осталось — союзный
 * бот: стартовый выбор обязан быть своим, а перескок после смерти — любым живым
 * на стороне игрока.
 */
function ensureSelection() {
  if (isPickable(selected)) return;
  const live = ourSide();
  const own = live.find((u) => !(u.spec && u.spec.isBot));
  setSelected(own || live[0] || null);
}

// ── Палец ────────────────────────────────────────────────────────────────
// Тап, а не протяжка. Порог тот же, каким арена отличает тап от вращения
// камеры, и тот же, что был у кличей и баффов, — иначе выбор срабатывал бы на
// каждом развороте.
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
  if (!wasTap || !selectState.active) return;
  const unit = pickUnitAt(e.clientX, e.clientY);
  // Мимо бойца, по сопернику или по павшему — НИЧЕГО. Прежний выбор остаётся:
  // снять выбор нельзя ничем (правила 2 и 4).
  if (!isPickable(unit)) return;
  setSelected(unit);
}

/** Кого накрыл палец. Луч из камеры по телам живых на стороне игрока. */
function pickUnitAt(clientX, clientY) {
  if (!A) return null;
  const r = A.canvas.getBoundingClientRect();
  _ndc.x = ((clientX - r.left) / r.width) * 2 - 1;
  _ndc.y = -((clientY - r.top) / r.height) * 2 + 1;
  _ray.setFromCamera(_ndc, A.camera);
  let best = null;
  let bestD = Infinity;
  for (const u of ourSide()) {
    const hit = _ray.intersectObject(u.f.group, true);
    if (hit.length && hit[0].distance < bestD) { bestD = hit[0].distance; best = u; }
  }
  return best;
}

// ── Кадр ─────────────────────────────────────────────────────────────────

/**
 * Зовётся ареной каждый кадр: держит выбор живым и считает место метки.
 *
 * @param {number} dt секунд с прошлого кадра (не нужен, принимается для
 *                    единообразия с buffTick и klichTick — все три зовутся рядом)
 * @param {number} t  время боя (часы арены; выбору не нужно, см. выше)
 */
export function selectTick(dt, t) { // eslint-disable-line no-unused-vars
  if (!A) return;
  ensureSelection();
  syncMark();
}

/**
 * МЕТКА ВЫБРАННОГО — на его месте на экране, на уровне груди.
 *
 * ⚠️ МЕТКА ПЛОСКАЯ, А НЕ В СЦЕНЕ. Подсветить тело значило бы завести на арене
 *    второе свечение рядом с ядром бойца — ровно то, что запрещено. Метка
 *    принадлежит интерфейсу, живёт поверх кадра и гаснет вместе с боем. Тот же
 *    приём и та же высота, что у снятой подсветки целей, — её место она и
 *    занимает.
 */
const MARK_BODY_Y = 1.1;
const _prj = new THREE.Vector3();
const _fwd = new THREE.Vector3();
const _off = new THREE.Vector3();

function syncMark() {
  const m = selectState.mark;
  if (!isPickable(selected)) { m.on = false; return; }
  const r = A.canvas.getBoundingClientRect();
  A.camera.getWorldDirection(_fwd);
  _prj.copy(selected.f.group.position); _prj.y += MARK_BODY_Y;
  // За спиной у камеры проекция переворачивается и дала бы метку не там —
  // такой кадр просто прячется.
  if (_fwd.dot(_off.copy(_prj).sub(A.camera.position)) <= 0) { m.on = false; return; }
  _prj.project(A.camera);
  m.x = r.left + (_prj.x * 0.5 + 0.5) * r.width;
  m.y = r.top + (-_prj.y * 0.5 + 0.5) * r.height;
  m.on = true;
}
