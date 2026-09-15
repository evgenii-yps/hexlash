// islandDive.js — пролёт камеры ВНУТРЬ выбранного острова.
//
// Отдельный режиссёр, а не ещё один маршрут в transitionFlight.js. Причина не в
// объёме файла, а в том, что это другая поездка. Перелёт дом⇄острова возит камеру
// между двумя ИЗВЕСТНЫМИ позами по поставленной дуге, дышит туманом и ставит в
// коридоре вывеску; он знает обе точки заранее и живёт весь сеанс. Пролёт внутрь
// острова начинается там, где игрок ОСТАВИЛ камеру (на экране режимов орбита
// принадлежит ему целиком), целится в предмет, а не в позу, и заканчивается тем,
// что сцену гасят. Сложить их в один файл — значит завести в нём два набора
// состояния, которые нельзя перепутать, ради экономии одного импорта.
//
// ЧТО ЭТОТ ФАЙЛ НЕ ДЕЛАЕТ. Он не гасит экран, не переключает адрес и не знает,
// куда игрок попадёт дальше. Он двигает камеру и сообщает, что доехал. Чёрный
// кадр и переход держит тот, кто владеет экраном (см. HomeView + sceneLoading).
// Так пролёт можно остановить на полпути, ничего не откатывая: камера просто
// стоит там, где её застали.
//
// ПРИЦЕЛ приходит готовым из modePlates.aimFor(id) — { point, by, half, fill }.
// Высоту гексарха и разлёт перчаток знает тот файл, который их строит; здесь эти
// числа не повторяются, чтобы им негде было разойтись.
//
// Экспортирует: DIVE (настройки), createIslandDive.
import * as THREE from 'three';

// ─────────────────────────────── Настройки ───────────────────────────────
// Все числа, которые владелец может захотеть пощупать на приёмке, — здесь.
export const DIVE = {
  // Пауза перед началом движения: интерфейс растворяется, камера ещё стоит.
  // ТЗ просит именно такой порядок. Поставить 0 — растворение и движение пойдут
  // вместе; выглядит слитнее, но это уже другое решение, и принимать его глазами.
  leadIn: 0.25,

  // Сам пролёт. Полоса ТЗ — 1.6…2.2 с.
  duration: 1.9,

  // Горб над серединой пути, в долях расстояния. Без него камера едет по линейке
  // и это читается как рывок механизма, а не как движение взгляда.
  arc: 0.10,

  // Куда камера смотрит по дороге. 0 — сразу на прицел (взгляд «прилипает» к цели
  // с первого кадра), 1 — доводит взгляд ровно к концу. Середина даёт то, что
  // нужно: сначала чуть уводит, потом успокаивается на предмете.
  lookEase: 0.65,

  // Границы наклона в конечной позе. Камера въезжает с того угла, с которого
  // игрок смотрел, — но если он загнал орбиту под самую плиту или на макушку,
  // конечный кадр окажется в полу или в потолке. Это не «правильный угол», это
  // забор от двух краёв.
  polarMin: 0.55,  // радианы от вертикали: выше — камера над островом
  polarMax: 1.45,  // ниже — камера у самой земли

  // Страховка. На слабом телефоне кадры могут просесть так, что пролёт не успеет;
  // дольше этого он не живёт ни при каких обстоятельствах — игрок не должен
  // застрять в едущем кадре. Считается по ЧАСАМ, а не по кадрам.
  safetySec: 4.0,
};

const _from = new THREE.Vector3();
const _to = new THREE.Vector3();
const _lookFrom = new THREE.Vector3();
const _off = new THREE.Vector3();
const _sph = new THREE.Spherical();
const _pos = new THREE.Vector3();
const _look = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

// Плавный разгон и торможение. Пятая степень, а не третья: у неё в концах равна
// нулю не только скорость, но и ускорение — то есть камера не только не дёргается
// на старте и финише, но и не «подламывается» за кадр до них. Перелёта за цель
// нет по построению, что для камеры обязательно: вылет за конечную позу и возврат
// читается как промах.
const smoother = (t) => t * t * t * (t * (t * 6 - 15) + 10);

/**
 * @param {object} deps
 * @param {THREE.PerspectiveCamera} deps.camera
 * @param {object} deps.controls  OrbitControls — пролёт паркует их на время поездки
 */
export function createIslandDive({ camera, controls }) {
  let active = false;
  let el = 0;          // прошло секунд с начала (включая паузу leadIn)
  let dur = DIVE.duration;
  let lead = DIVE.leadIn;
  let onArrive = null;
  let startedAt = 0;   // часы, для страховки
  let arced = 0;       // высота горба в мировых единицах для этой поездки

  const startPos = new THREE.Vector3();
  const startLook = new THREE.Vector3();
  const endPos = new THREE.Vector3();
  const endLook = new THREE.Vector3();

  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

  /**
   * Конечная поза по прицелу.
   *
   * Направление берётся ТО, С КОТОРОГО ИГРОК СМОТРИТ: на экране режимов орбита
   * принадлежит ему, и въезжать в остров всегда с одной канонической стороны
   * значит отменять его собственный поворот рывком. Меняется только расстояние —
   * камера идёт внутрь по своему же лучу.
   *
   * Расстояние — такое, чтобы предмет ВПИСАЛСЯ, заняв свою долю кадра. Считаем
   * по обеим сторонам и берём БОЛЬШЕЕ из двух: меньшее вписало бы предмет по
   * одной стороне и обрезало по другой. Это же само собой разбирается с
   * портретом, где кадр узкий и решает высота, а не ширина.
   *
   * И в самом конце — забор `minDist`. Без него достаточно смелая доля ставит
   * камеру внутрь предмета: изнанка граней не рисуется, вокруг туман и пустота,
   * и на экране получается ровный чёрный кадр. Проверено на ARENA — так и было.
   */
  function poseFor(aim) {
    const tanV = Math.max(1e-4, Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    const fill = Math.max(1e-3, aim.fill);
    const byH = (aim.halfH / fill) / tanV;
    const byW = (aim.halfW / fill) / Math.max(1e-4, camera.aspect * tanV);
    const dist = Math.max(byH, byW, aim.minDist || 0);

    // Луч «от прицела к камере», с зажатым наклоном.
    _off.copy(camera.position).sub(aim.point);
    if (_off.lengthSq() < 1e-6) _off.set(0, 0.4, 1); // камера в самой точке — берём что-то осмысленное
    _sph.setFromVector3(_off);
    _sph.phi = THREE.MathUtils.clamp(_sph.phi, DIVE.polarMin, DIVE.polarMax);
    _sph.radius = dist;
    _off.setFromSpherical(_sph);

    endPos.copy(aim.point).add(_off);
    endLook.copy(aim.point);
  }

  /**
   * Поехали.
   * @param {object} aim   результат modePlates.aimFor(id)
   * @param {object} [opts] { onArrive }
   * @returns {boolean} false — прицела нет, поездка не началась
   */
  function play(aim, opts = {}) {
    if (!aim || !aim.point) return false;
    startPos.copy(camera.position);
    startLook.copy(controls ? controls.target : _look.set(0, 0, 0));
    poseFor(aim);

    // Горб — доля пройденного расстояния, а не постоянная величина: короткий
    // подъезд не должен взлетать так же, как длинный.
    arced = startPos.distanceTo(endPos) * DIVE.arc;

    el = 0;
    dur = Math.max(0.01, DIVE.duration);
    lead = Math.max(0, DIVE.leadIn);
    onArrive = typeof opts.onArrive === 'function' ? opts.onArrive : null;
    startedAt = now();
    active = true;
    if (controls) controls.enabled = false;
    return true;
  }

  /** Довести до конечной позы прямо сейчас и сообщить о прибытии. */
  function skip() {
    if (!active) return;
    el = lead + dur;
    step(0);
  }

  /**
   * Бросить поездку там, где она есть. Камера остаётся где стояла, о прибытии
   * никто не узнаёт. Это выход для «назад» и для размонтирования — именно потому
   * пролёт ничего не гасил сам: откатывать нечего.
   */
  function cancel() {
    if (!active) return;
    active = false;
    onArrive = null;
  }

  function step(dt) {
    el += dt;

    // Страховка по часам, а не по кадрам: во вкладке в фоне кадры не идут вовсе,
    // и счётчик кадров тут ничего не сторожит.
    const overdue = (now() - startedAt) / 1000 > DIVE.safetySec;
    const raw = overdue ? 1 : clamp01((el - lead) / dur);
    const k = smoother(raw);

    _from.copy(startPos);
    _to.copy(endPos);
    _pos.lerpVectors(_from, _to, k);
    // Горб: синус по доле пути — ноль в обоих концах, максимум в середине.
    if (arced > 0) _pos.addScaledVector(_up, Math.sin(Math.PI * k) * arced);
    camera.position.copy(_pos);

    _lookFrom.copy(startLook);
    const lk = smoother(clamp01(raw / Math.max(1e-4, DIVE.lookEase)));
    _look.lerpVectors(_lookFrom, endLook, lk);
    if (controls) controls.target.copy(_look);
    camera.lookAt(_look);

    if (raw >= 1) {
      active = false;
      const cb = onArrive;
      onArrive = null;
      if (cb) cb();
    }
  }

  /**
   * Кадр поездки. Возвращает true, пока пролёт владеет камерой, — вызывающий по
   * этому признаку паркует орбиту и всё остальное, что тоже хочет камеру.
   */
  function update(dt) {
    if (!active) return false;
    step(Math.min(Math.max(dt, 0), 0.1)); // длинный кадр не должен телепортировать
    return active;
  }

  return {
    play, skip, cancel, update,
    get active() { return active; },
  };
}
