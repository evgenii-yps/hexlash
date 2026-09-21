// freeCam.js — СВОБОДНАЯ КАМЕРА БОЯ. Служебный режиссёрский полёт над плитой.
//
// ЗАЧЕМ. Камера боя привязана: в обычных режимах держит бойцов, в открытом поле
// следит за стороной игрока. Для показа нужно уметь оторвать её и пролететь над
// боем — подняться, увидеть всё поле разом, облететь сбоку, вернуться.
//
// ⚠️ ЭТО СЛУЖЕБНЫЙ ИНСТРУМЕНТ, А НЕ ФУНКЦИЯ ДЛЯ ИГРОКОВ. Игра мобильная, на
//    телефоне клавиатуры нет. Экранных кнопок и жестов здесь нет и не будет: без
//    признака в адресе модуль вообще не заводится, и ни один обработчик не
//    вешается.
//
// ⚠️ КАМЕРА ТОЛЬКО СМОТРИТ. Бой она не трогает: ни паузы, ни замедления, ни
//    влияния на выбор цели. Столкновений у неё тоже нет — проходит сквозь стены,
//    укрытия и тела. Столкновения камеры это источник застреваний, а не польза.
//
// КАК УСТРОЕН ЗАХВАТ И ВОЗВРАТ. Пока камера привязана, модуль молчит. Первое
// нажатие клавиши движения отцепляет её ТАМ ЖЕ, ГДЕ ОНА СТОИТ: ни рывка, ни
// скачка — мы просто перестаём её двигать чужой рукой и начинаем своей.
//
// Возврат по Esc идёт в ДВА такта, и это не усложнение, а необходимость.
// Орбита (OrbitControls) держит камеру в коридоре: угол от 0.25 до 1.45 радиан,
// удаление от минимального до максимального. Свободный полёт из этого коридора
// выходит — можно встать над полем почти отвесно. Включи орбиту обратно одним
// махом, и первый же её тик ВЫПРАВИТ камеру рывком. Поэтому сначала мы сами, за
// секунду, приводим камеру в ближайшую законную позу, и только потом отдаём
// орбите. Дальше сцена доводит кадр своим обычным ходом — тем самым, который у
// каждого режима свой.
//
// ⚠️ ИМЕННО ПОЭТОМУ МОДУЛЬ НЕ ЗНАЕТ, КУДА ВОЗВРАЩАТЬ. Он не считает «правильную»
//    позу и не хранит ту, с которой начал: у открытого поля это слежение за
//    стороной игрока, у прочих режимов — кадр по бойцам, и оба правила живут в
//    сцене. Модуль возвращает камеру лишь В ЗАКОННЫЙ КОРИДОР, а куда ехать
//    дальше, решает сцена. Так возврат сам собой попадает в правило того режима,
//    в котором идёт бой, и второго описания этих правил здесь не заводится.
//
// Экспортирует: FREE_CAM (настройки), createFreeCam.
import * as THREE from 'three';

// ───────────────────────────── Настройки ─────────────────────────────
export const FREE_CAM = {
  // Скорость полёта в мировых единицах в секунду. Подобрана так, чтобы поле
  // открытого боя (радиус кольца выхода около 30) пересекалось секунд за пять:
  // быстрее — не успеваешь целиться, медленнее — показ превращается в ожидание.
  speed: 12,
  boost: 2.0,        // множитель при зажатом Shift — «примерно вдвое» из ТЗ
  // Разгон и торможение. Мгновенная скорость даёт рывок на старте, а на показе
  // рывок читается как сбой. Число — доля, которую скорость добирает за секунду.
  ease: 12,

  // Поворот взгляда мышью. Радиан на пиксель.
  lookSpeed: 0.0042,
  // Наклон ограничен почти отвесом, но НЕ отвесом: ровно в зените и ровно в
  // надире направление взгляда вырождается и камера прокручивается вокруг себя.
  pitchLimit: Math.PI / 2 - 0.02,

  // Колесо — приближение вдоль взгляда. Шаг в мировых единицах на один щелчок.
  wheelStep: 1.6,

  // ТОЧКА ВЗГЛЯДА. Модуль держит её ТАМ, КУДА КАМЕРА СМОТРИТ НА ЗЕМЛЕ, а не на
  // постоянном вылете перед собой, и это не мелочь оформления.
  //
  // ⚠️ ПО РАССТОЯНИЮ ДО ЭТОЙ ТОЧКИ СЦЕНА СЧИТАЕТ ТУМАН. Держи её в восьми
  //    единицах перед камерой — и с высоты девяноста туман останется таким, как
  //    у самой земли: всё поле утонет в молоке. Так и вышло на первом снимке
  //    верхней точки — плита читалась чёрным квадратом, тел не было видно вовсе.
  //    Точка на земле даёт настоящую глубину взгляда, и туман едет за камерой
  //    сам, без единой правки в сцене.
  //
  // Смотрим вверх или вдоль горизонта — луч землю не встречает; тогда берём
  // вылет ниже. Он же ограничивает и дальний случай: у почти горизонтального
  // взгляда пересечение с землёй уходит за тысячу единиц, и туман бы исчез.
  targetAhead: 8,
  // ⚠️ ПРЕДЕЛ ВЫЛЕТА МЕРЯЕТСЯ ПОТОЛКОМ ВЫСОТЫ, А НЕ ШИРИНОЙ КОРОБКИ. Считали
  //    шириной — и в портрете поймали разрыв: потолок там 137 единиц (узкий кадр
  //    требует подняться выше), а предел по ширине давал 92. Отвесный взгляд с
  //    потолка до земли НЕ ДОСТАВАЛ, точка взгляда повисала в воздухе на полпути,
  //    и возврат по Esc вёл камеру к ней, а не к земле: она доезжала до 95 и
  //    только потом падала к 7 одним скачком. Потолок — верная мерка: отвесный
  //    луч не длиннее его по определению.
  targetMax: 1.6,    // предел вылета точки взгляда, доля от потолка высоты

  // Возврат по Esc.
  releaseSec: 1.0,

  // КОРОБКА, ЗА КОТОРУЮ НЕ ВЫПУСКАЕМ. Считается от габарита поля, а не числом:
  // у дуэли плита маленькая, у открытого поля — огромная, и одно число на обоих
  // означало бы либо клетку, либо пустоту.
  spanMul: 1.5,      // полторы ширины поля от середины — по горизонтали
  floorY: 0.4,       // ниже пола не опускаемся: под плитой смотреть не на что
  // ПОТОЛОК ВЫСОТЫ СЧИТАЕТСЯ, А НЕ ЗАДАН ЧИСЛОМ: это высота, с которой поле
  // целиком влезает в кадр, плюс запас. Пересчитывается каждый кадр, потому что
  // зависит от пропорций окна — поворот телефона меняет её вдвое.
  //
  // ⚠️ ЭТО НЕ ТО ЖЕ САМОЕ, ЧТО ДАЛЬНИЙ ПРЕДЕЛ ОРБИТЫ, ХОТЯ ФОРМУЛА ПОХОЖА.
  //    Орбита смотрит на поле ПОД УГЛОМ, и ей нужна диагональ плиты; свободная
  //    камера в верхней точке смотрит ОТВЕСНО, и ей хватает полуширины. Взяли
  //    сначала готовое число орбиты — и потолок вышел вдвое выше нужного: поле
  //    из верхней точки читалось тёмным квадратиком в треть кадра (замерено).
  ceilMul: 1.12,     // запас над той высотой, где поле ровно влезает
  ceilMin: 14,       // но не ниже этого: на маленькой плите доля дала бы низкий потолок
};

const KEYS_FWD   = ['KeyW', 'ArrowUp'];
const KEYS_BACK  = ['KeyS', 'ArrowDown'];
const KEYS_LEFT  = ['KeyA', 'ArrowLeft'];
const KEYS_RIGHT = ['KeyD', 'ArrowRight'];
const KEYS_UP    = ['Space'];
const KEYS_DOWN  = ['KeyQ'];
// УСКОРИТЕЛЬ — SHIFT, И ЭТО НЕ КЛАВИША ДВИЖЕНИЯ: сам по себе полёт он не
// начинает, только умножает скорость, пока зажат.
//
// ⚠️ CTRL УБРАН ИЗ УПРАВЛЕНИЯ НАСОВСЕМ (решение владельца 21.09.2026), и
//    возвращать его нельзя. Сочетания Ctrl с буквами перехватывает сам браузер
//    раньше страницы и отменить их страница не может: Ctrl+W закрывал бы
//    вкладку прямо посреди боя, Ctrl+S предлагал сохранить страницу, Ctrl+D —
//    добавить в закладки. Пока камера была служебной, на это натыкался один
//    человек; теперь она у всех.
// ⚠️ ВНИЗ — Q, А НЕ C: C занята служебной клавишей боя (заряд).
const KEYS_BOOST = ['ShiftLeft', 'ShiftRight'];
// Все клавиши движения одним списком — по нему и узнаётся «игрок тронул камеру».
// Ускорителя здесь нет намеренно: он движением не является.
const KEYS_MOVE = [...KEYS_FWD, ...KEYS_BACK, ...KEYS_LEFT, ...KEYS_RIGHT, ...KEYS_UP, ...KEYS_DOWN];

// ЗАПАСНОЙ ПУТЬ ПО БУКВЕ — на случай, когда браузер не назвал физическую клавишу.
//
// ⚠️ ОСНОВНОЙ ПУТЬ — ИМЕННО ФИЗИЧЕСКАЯ КЛАВИША (`e.code`), и трогать его нельзя.
//    Она одна и та же на любой раскладке: на русской клавиша W даёт букву «ц», и
//    сверка по букве сломала бы движение ровно там, где им пользуются. Этот
//    список — НЕ замена, а добавка на редкий случай, когда `e.code` приходит
//    пустым (некоторые экранные клавиатуры, удалённый рабочий стол, часть
//    способов ввода). Тогда узнать клавишу больше не по чему, и мы смотрим на
//    букву — сразу в обеих раскладках, чтобы добавка не оказалась англоязычной.
const LETTER_TO_CODE = {
  w: 'KeyW', ц: 'KeyW',
  s: 'KeyS', ы: 'KeyS',
  a: 'KeyA', ф: 'KeyA',
  d: 'KeyD', в: 'KeyD',
  q: 'KeyQ', й: 'KeyQ',
};

/** Физическая клавиша события. Пусто — пробуем узнать её по букве. */
function codeOf(e) {
  if (e.code) return e.code;
  const k = typeof e.key === 'string' ? e.key.toLowerCase() : '';
  if (k === ' ' || k === 'spacebar') return 'Space';
  if (k === 'shift') return 'ShiftLeft';
  if (k.startsWith('arrow')) return 'Arrow' + k.slice(5, 6).toUpperCase() + k.slice(6);
  return LETTER_TO_CODE[k] || '';
}

/** Печатает ли игрок в поле ввода. Тогда клавиши движения камеру не двигают. */
function typing(target) {
  if (!target || !target.tagName) return false;
  const tag = target.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable === true;
}

const _fwd = new THREE.Vector3();
const _right = new THREE.Vector3();
const _move = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _sph = new THREE.Spherical();
const _off = new THREE.Vector3();
const _tmp = new THREE.Vector3();

/**
 * Завести свободную камеру.
 *
 * ⚠️ ЗОВЁТСЯ ТОЛЬКО ПРИ ВЗВЕДЁННОМ ПРИЗНАКЕ. Без него сцена не должна вызывать
 *    эту функцию вовсе: тогда в игре нет ни одного лишнего обработчика.
 *
 * @param {THREE.PerspectiveCamera} camera
 * @param {object} controls  OrbitControls сцены — их мы глушим на время полёта
 * @param {HTMLElement} dom  холст: на нём ловим мышь и колесо
 * @param {object} opts
 *   span  — половина ширины поля в мировых единицах (для коробки и потолка)
 *   rest  — РАБОЧЕЕ удаление камеры в этом режиме: то, с которого сцена обычно
 *           и смотрит бой. Нужно только возврату — см. release().
 * @returns {{active:boolean, releasing:boolean, tick(dt):boolean, release():void, dispose():void}}
 */
export function createFreeCam(camera, controls, dom, opts = {}) {
  const O = FREE_CAM;
  const half = Math.max(4, opts.span || 10);   // полуширина поля
  const span = half * O.spanMul;
  const rest = Math.max(1, opts.rest || 12);
  /** Высота, с которой поле влезает в кадр целиком. Зависит от пропорций окна. */
  const ceilOf = () => {
    const fov = THREE.MathUtils.degToRad(camera.fov) / 2;
    const need = Math.max(half / Math.tan(fov), half / (Math.tan(fov) * camera.aspect));
    return Math.max(O.ceilMin, need * O.ceilMul);
  };

  const held = new Set();
  let active = false;          // камера отцеплена и слушается клавиш
  let releaseT = -1;           // >= 0 — идёт возврат, счёт секунд
  let yaw = 0, pitch = 0;      // текущее направление взгляда
  let vx = 0, vy = 0, vz = 0;  // сглаженная скорость
  let dragging = false;
  let lastX = 0, lastY = 0;
  // Поза, из которой начинается возврат, и законная поза, в которую он идёт.
  const relFrom = { pos: new THREE.Vector3(), tgt: new THREE.Vector3() };
  const relTo = { pos: new THREE.Vector3(), tgt: new THREE.Vector3() };

  /** Снять направление взгляда с камеры — чтобы захват прошёл без скачка. */
  function adoptLook() {
    camera.getWorldDirection(_fwd);
    yaw = Math.atan2(-_fwd.x, -_fwd.z);
    pitch = Math.asin(THREE.MathUtils.clamp(_fwd.y, -1, 1));
  }

  /** Взять управление. Камера остаётся ровно там, где стоит. */
  function grab() {
    if (active) return;
    active = true;
    releaseT = -1;
    vx = vy = vz = 0;
    adoptLook();
    // Орбиту глушим, иначе она продолжит выправлять камеру под свой коридор.
    controls.enabled = false;
  }

  /**
   * Отпустить: за секунду привести камеру в ближайшую ЗАКОННУЮ для орбиты позу и
   * отдать управление сцене. Мгновенная отдача дала бы рывок — см. шапку файла.
   */
  function release() {
    if (!active || releaseT >= 0) return;
    relFrom.pos.copy(camera.position);
    relFrom.tgt.copy(controls.target);

    // ⚠️ СНАЧАЛА ОПУСКАЕМ ЦЕЛЬ НА ЗЕМЛЮ, И ЭТО ГЛАВНОЕ В ВОЗВРАТЕ. Пока камера
    //    летит, цель висит в восьми единицах перед ней — то есть, если смотреть
    //    отвесно вниз с высоты, ГДЕ-ТО В НЕБЕ. Выправить позу вокруг такой цели
    //    значит получить законную орбиту вокруг точки в воздухе: камера остаётся
    //    под облаками, а сцена потом дёргает её вниз одним скачком. Замер это и
    //    показал: в портрете камера стояла на 136 и прыгала на 6.7.
    //
    //    Поэтому цель — точка, КУДА КАМЕРА СМОТРИТ НА ЗЕМЛЕ. Смотрит вверх или
    //    вдоль горизонта (луч землю не встречает) — берём точку перед камерой,
    //    опущенную на землю: возврат всё равно получит опору.
    camera.getWorldDirection(_fwd);
    if (_fwd.y < -1e-3) relTo.tgt.copy(camera.position).addScaledVector(_fwd, lookDistance());
    else {
      relTo.tgt.copy(camera.position).addScaledVector(_tmp.set(_fwd.x, 0, _fwd.z).normalize(), O.targetAhead);
      relTo.tgt.y = GROUND_Y;
    }

    // Теперь поза вокруг этой цели: наклон — внутрь коридора орбиты, удаление —
    // к РАБОЧЕМУ, с которого сцена и смотрит бой. Клапан орбиты (её дальний
    // предел) для этого не годится: на открытом поле он больше сотни единиц, и
    // «законная» поза осталась бы высоко над боем.
    _off.copy(camera.position).sub(relTo.tgt);
    _sph.setFromVector3(_off);
    _sph.radius = THREE.MathUtils.clamp(_sph.radius, controls.minDistance, rest);
    _sph.phi = THREE.MathUtils.clamp(_sph.phi, controls.minPolarAngle, controls.maxPolarAngle);
    relTo.pos.copy(relTo.tgt).add(_tmp.setFromSpherical(_sph));
    releaseT = 0;
  }

  /** Держать камеру в коробке. Не столкновения — просто не даём улететь в пустоту. */
  function clampBox() {
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -span, span);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -span, span);
    camera.position.y = THREE.MathUtils.clamp(camera.position.y, O.floorY, ceilOf());
  }

  /**
   * Направление взгляда из yaw/pitch и точка взгляда на земле.
   * Зачем именно на земле — см. `targetAhead` в настройках: по расстоянию до
   * этой точки сцена считает туман.
   */
  const GROUND_Y = 0.2;      // та же высота цели, с которой живёт орбита сцены
  function lookDistance() {
    if (_fwd.y >= -1e-3) return O.targetAhead;       // смотрим вверх — земли впереди нет
    const d = (GROUND_Y - camera.position.y) / _fwd.y;
    return THREE.MathUtils.clamp(d, O.targetAhead, ceilOf() * O.targetMax);
  }
  function applyLook() {
    _fwd.set(
      -Math.sin(yaw) * Math.cos(pitch),
      Math.sin(pitch),
      -Math.cos(yaw) * Math.cos(pitch),
    ).normalize();
    camera.lookAt(_tmp.copy(camera.position).addScaledVector(_fwd, lookDistance()));
    controls.target.copy(_tmp);
  }

  // ── ввод ──────────────────────────────────────────────────────────────────
  const onKeyDown = (e) => {
    if (typing(e.target)) return;
    if (e.code === 'Escape' || e.key === 'Escape') { if (active) release(); return; }
    const code = codeOf(e);
    // ⚠️ УСКОРИТЕЛЬ ЗАПОМИНАЕМ ДО ПРОВЕРКИ НА КЛАВИШУ ДВИЖЕНИЯ. Shift движением
    //    не является, и ранний выход ниже не дал бы ему попасть в набор зажатых —
    //    ускорение не срабатывало бы вовсе. Сам по себе он полёт не начинает:
    //    отцепляет камеру только клавиша движения. Отменять «родное» действие
    //    тоже не надо: Shift сам по себе в браузере ничего не делает.
    if (KEYS_BOOST.includes(code)) { held.add(code); return; }
    if (!KEYS_MOVE.includes(code)) return;
    // Пробел листает страницу, стрелки её прокручивают — на время полёта это
    // чужое поведение нам мешает.
    e.preventDefault();
    held.add(code);
    if (!active) grab();
  };
  // Отпускание узнаём тем же способом, что и нажатие: иначе клавиша, добавленная
  // в набор по букве, осталась бы в нём навсегда и камера ехала бы сама.
  const onKeyUp = (e) => { held.delete(codeOf(e)); };
  // ⚠️ ОТПУСКАНИЕ ЛОВИМ И ПРИ ПОТЕРЕ ФОКУСА. Переключили вкладку с зажатым W —
  //    события «отпустил» не будет, и камера уехала бы сама.
  const onBlur = () => { held.clear(); };

  const onDown = (e) => { if (e.button === 0 && active) { dragging = true; lastX = e.clientX; lastY = e.clientY; } };
  const onMove = (e) => {
    if (!dragging || !active) return;
    yaw -= (e.clientX - lastX) * O.lookSpeed;
    pitch = THREE.MathUtils.clamp(pitch - (e.clientY - lastY) * O.lookSpeed, -O.pitchLimit, O.pitchLimit);
    lastX = e.clientX; lastY = e.clientY;
  };
  const onUp = () => { dragging = false; };
  const onWheel = (e) => {
    if (!active) return;
    e.preventDefault();
    camera.getWorldDirection(_fwd);
    camera.position.addScaledVector(_fwd, -Math.sign(e.deltaY) * O.wheelStep);
    clampBox();
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  dom.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  dom.addEventListener('wheel', onWheel, { passive: false });

  /**
   * Кадр. Возвращает true, пока камера НЕ привязана к сцене, — по этому признаку
   * сцена пропускает своё слежение и не спорит с полётом.
   */
  function tick(dt) {
    if (!active) return false;

    // ── возврат ──
    if (releaseT >= 0) {
      releaseT += dt;
      const p = Math.min(1, releaseT / O.releaseSec);
      // Плавно на обоих концах: тронулся мягко, встал мягко.
      const e = p * p * (3 - 2 * p);
      camera.position.lerpVectors(relFrom.pos, relTo.pos, e);
      controls.target.lerpVectors(relFrom.tgt, relTo.tgt, e);
      camera.lookAt(controls.target);
      if (p >= 1) {
        active = false;
        releaseT = -1;
        held.clear();
        dragging = false;
        controls.enabled = true;
        // Дальше камеру ведёт сцена — тем правилом, которое у её режима своё.
        return false;
      }
      return true;
    }

    // ── полёт ──
    // Движение считается ОТ ВЗГЛЯДА и по горизонтали: «вперёд» — туда, куда
    // смотрит камера, а не на север плиты. Вертикаль отдельно, Space/Q.
    _fwd.set(-Math.sin(yaw), 0, -Math.cos(yaw)).normalize();
    // ⚠️ ЗНАК «ВБОК» ПРОВЕРЯЕТСЯ ТАК, И ПЕРЕВОРАЧИВАТЬ ЕГО НЕЛЬЗЯ. В осях сцены
    //    «вперёд» — это -Z, «вверх» — +Y, «вправо» — +X. Произведение вперёд×вверх
    //    при взгляде вдоль -Z даёт ровно +X, то есть УЖЕ вправо для зрителя.
    //    Здесь стояло ещё и обращение знака в конце — оно и меняло вбок местами:
    //    A и ← везли камеру вправо, D и → влево (замерено на всех поворотах
    //    взгляда, 16 клеток из 40 в таблице приёмки).
    _right.copy(_fwd).cross(_up).normalize();

    _move.set(0, 0, 0);
    if (KEYS_FWD.some((k) => held.has(k))) _move.add(_fwd);
    if (KEYS_BACK.some((k) => held.has(k))) _move.sub(_fwd);
    if (KEYS_RIGHT.some((k) => held.has(k))) _move.add(_right);
    if (KEYS_LEFT.some((k) => held.has(k))) _move.sub(_right);
    let upDown = 0;
    if (KEYS_UP.some((k) => held.has(k))) upDown += 1;
    if (KEYS_DOWN.some((k) => held.has(k))) upDown -= 1;

    if (_move.lengthSq() > 0) _move.normalize();
    const boost = KEYS_BOOST.some((k) => held.has(k)) ? O.boost : 1;
    const want = O.speed * boost;

    // Разгон и торможение — иначе старт и остановка читаются рывком.
    const k = 1 - Math.exp(-O.ease * dt);
    vx += (_move.x * want - vx) * k;
    vz += (_move.z * want - vz) * k;
    vy += (upDown * want - vy) * k;

    camera.position.x += vx * dt;
    camera.position.y += vy * dt;
    camera.position.z += vz * dt;
    clampBox();
    applyLook();
    return true;
  }

  function dispose() {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('blur', onBlur);
    dom.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    dom.removeEventListener('wheel', onWheel);
    held.clear();
    // Орбиту возвращаем как нашли: уход с экрана боя не должен оставить её
    // заглушенной — следующий бой открылся бы с мёртвой камерой.
    controls.enabled = true;
  }

  return {
    get active() { return active; },
    get releasing() { return releaseT >= 0; },
    tick, release, dispose,
  };
}
