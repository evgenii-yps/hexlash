// gateApproach.js — подлёт камеры к островам нового пространства.
//
// Вторая половина одной поездки. Пролёт (islandDive.js) увозит камеру ВНУТРЬ
// острова и гасит кадр в чёрный; подлёт начинает с чёрного и привозит камеру к
// тому, что игрок должен увидеть. Поэтому числа берутся ТЕ ЖЕ, из DIVE, и кривая
// та же — новых не заводим: разъехавшиеся половины читались бы как склейка двух
// разных движений, а не как одна дорога.
//
// ЧЕМ ОТЛИЧАЕТСЯ ОТ ПРОЛЁТА. Пролёт начинается там, где игрок оставил камеру, и
// целится в предмет. Подлёт наоборот: конечная поза известна заранее (это поза
// покоя пространства), а начальную мы назначаем сами — отодвинутую и приподнятую
// по тому же лучу. Игроку в этот момент нечего было оставлять: он пришёл из
// чёрного.
//
// КОГДА ЕХАТЬ — РЕШАЕТ НЕ ЭТОТ ФАЙЛ. Он умеет только «поехали» и «приехал».
// Момент выбирает сцена: ровно тот кадр, в котором экран загрузки НАЧИНАЕТ
// растворяться. Если тронуться раньше — половина дороги проедет под непрозрачной
// заслонкой, и игрок увидит уже едущую камеру. Если позже — увидит стоячий кадр,
// а потом рывок. Требование ТЗ: растемнение и подлёт идут ВМЕСТЕ.
//
// ЧТО ЭТОТ ФАЙЛ НЕ ДЕЛАЕТ. Не трогает экран загрузки, не меняет адрес, не знает
// про занавес. Двигает камеру и сообщает, что доехал.
//
// Экспортирует: APPROACH (свои две настройки), createGateApproach.
import * as THREE from 'three';
import { DIVE, smoother } from './islandDive.js';

// ─────────────────────────────── Настройки ───────────────────────────────
// Здесь ТОЛЬКО то, чего нет у пролёта: откуда камера начинает. Длительность,
// горб, доводка взгляда и страховка берутся из DIVE и здесь не повторяются.
export const APPROACH = {
  // Во сколько раз начальная точка дальше конечной. Полтора — расстояние
  // читается как «подъезжаем», но не превращается в отдельное путешествие.
  backOff: 1.55,

  // На сколько выше конечной позы начинается дорога, в долях её высоты. Камера
  // снижается к месту — это читается как прибытие, а движение строго по прямой
  // на зрителя не читается вообще (меняется только масштаб).
  liftOff: 0.42,
};

const _pos = new THREE.Vector3();
const _look = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _side = new THREE.Vector3();

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * @param {object} deps
 * @param {THREE.PerspectiveCamera} deps.camera
 * @param {object} [deps.controls] OrbitControls — подлёт паркует их на время поездки
 */
export function createGateApproach({ camera, controls }) {
  let active = false;
  let el = 0;          // прошло секунд с начала поездки
  let startedAt = 0;   // часы, для страховки
  let onArrive = null;
  let arced = 0;       // высота горба в мировых единицах для этой поездки

  const startPos = new THREE.Vector3();
  const endPos = new THREE.Vector3();
  const look = new THREE.Vector3();

  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

  /**
   * Поставить камеру в НАЧАЛО дороги и не ехать.
   *
   * Зовётся до того, как сцена объявит себя готовой. Пока стоит экран загрузки,
   * кадры всё равно рисуются, и камера обязана уже стоять там, откуда поедет:
   * если поставить её в начальную позу первым кадром самой поездки, скачок
   * придётся ровно на миг, когда заслонка начинает уходить, и на медленном кадре
   * его видно. Приехать эта поза никуда не мешает — `play` берёт её же.
   *
   * @param {THREE.Vector3} to    конечная поза камеры — поза покоя пространства
   * @param {THREE.Vector3} lookAt куда камера смотрит
   */
  function park(to, lookAt) {
    endPos.copy(to);
    look.copy(lookAt);

    // Начальная точка: тот же луч от цели, только длиннее и выше. Считаем от
    // цели, а не от камеры, потому что осмысленной позы у камеры ещё нет.
    const off = _pos.copy(endPos).sub(look);
    const len = off.length() || 1;
    startPos.copy(look).addScaledVector(off.normalize(), len * APPROACH.backOff);
    startPos.y += Math.max(0, endPos.y - look.y) * APPROACH.liftOff;

    // Горб — тот же, что у пролёта, и в тех же долях расстояния. Он уводит
    // дорогу вбок от прямой, иначе подъезд по линейке читается как наезд
    // объектива, а не как движение в пространстве.
    arced = startPos.distanceTo(endPos) * DIVE.arc;

    camera.position.copy(startPos);
    camera.lookAt(look);
  }

  /**
   * Поехали. Дорогу считает `park`; сюда остаётся только тронуться.
   *
   * @param {object} o
   * @param {THREE.Vector3} o.to     конечная поза камеры — поза покоя пространства
   * @param {THREE.Vector3} o.look   куда камера смотрит всю дорогу (цель орбиты)
   * @param {Function} [o.onArrive]  позвать по прибытии
   */
  function play({ to, look: lookAt, onArrive: cb }) {
    park(to, lookAt);
    onArrive = cb || null;
    el = 0;
    startedAt = now();
    active = true;
    if (controls) controls.enabled = false;
  }

  /** Поставить камеру в конечную позу без поездки (выключенные анимации, обрыв). */
  function skip() {
    if (!active) return;
    active = false;
    camera.position.copy(endPos);
    camera.lookAt(look);
    if (controls) { controls.target.copy(look); controls.enabled = true; controls.update(); }
    const cb = onArrive; onArrive = null;
    if (cb) cb();
  }

  /** Оборвать без вызова onArrive — камера остаётся там, где её застали. */
  function cancel() {
    if (!active) return;
    active = false;
    onArrive = null;
    if (controls) controls.enabled = true;
  }

  /**
   * Кадр поездки. Звать из цикла сцены ДО renderer.render.
   * @returns {boolean} true — камера сейчас едет (сцена не трогает её сама)
   */
  function update(dt) {
    if (!active) return false;

    // Страховка по ЧАСАМ, а не по кадрам: на слабом телефоне кадры могут
    // просесть так, что поездка не успеет, и игрок застрянет в едущем кадре.
    if ((now() - startedAt) / 1000 > DIVE.safetySec) { skip(); return false; }

    el += dt;
    const k = clamp01(el / DIVE.duration);
    const s = smoother(k);

    _pos.copy(startPos).lerp(endPos, s);
    // Горб: поперёк дороги, а не вверх — вверх он спорил бы с самим снижением.
    _side.copy(endPos).sub(startPos).normalize().cross(_up);
    if (_side.lengthSq() < 1e-6) _side.set(1, 0, 0);
    _pos.addScaledVector(_side.normalize(), Math.sin(Math.PI * k) * arced);
    camera.position.copy(_pos);

    // Взгляд доводится той же долей, что у пролёта: сначала чуть в стороне,
    // к концу — ровно на цели.
    const lookK = clamp01(s / Math.max(1e-3, DIVE.lookEase));
    _look.copy(startPos).lerp(look, lookK);
    camera.lookAt(_look);

    if (k >= 1) skip();
    return true;
  }

  return {
    park,
    play,
    skip,
    cancel,
    update,
    get active() { return active; },
  };
}
