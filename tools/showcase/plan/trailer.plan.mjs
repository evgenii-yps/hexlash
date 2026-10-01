// СЦЕНАРИЙ РОЛИКА — единственный файл, который правится ради тайминга и камеры.
// Вся шкала — кадры при 60 кадр/с (FPS). Логики здесь нет, только данные.
//
// План (plan) — один непрерывный кусок игры в одном браузере:
//   id, kind ('scene' | 'arena' | 'logo'), route, len (кадров), world (что лежит в сейфе),
//   hide (селекторы, которые не должны попасть в кадр), camera, actions, still.
// Действия — по кадрам боя b: move / down / up / click (настоящая мышь), clickEl (клик по
// элементу), mark. Для боёв (kind:'arena') seedBuild / fightSeed / offset берутся из
// plan/fights.lock.json (подбор зёрен: `cli.mjs fights`).
//
// Камера:
//   kind:'keys'    — абсолютные ключи: { f, pos, look, roll, fov, ease }
//   kind:'rel'     — ключи относительно позы сцены: { f, push, right, up, lright, lup, roll, fov }
//   kind:'dynamic' — планы, привязанные к бойцам: shots[{from, shot:'wide'|'frame'|'over', …}]
//   release:{at,blend} — с кадра at вернуть камеру сцене.
export const FPS = 60;

// Интерфейс, который вне кадра везде: служебная панель, DEV, метки свободной камеры.
const DEV_UI = ['.arena-panel-toggle', '.arena-actions', '.arena-readout', '.arena-freecam', '.arena-fps', '.perf-hud'];
// Закрытые кнопки главного острова прячем ЦЕЛИКОМ (решение архитектора 30.09): иначе
// ролик показывал бы их рабочими.
const HOME_UI = ['.hs-strip', '.edit-space', '.fighter-tag', '.perf-hud'];

const hero = { callsign: 'HAWK', core: 'natisk', lit: { a: [1, 2, 3], b: [1, 2] } };
const others = [
  { callsign: 'RAZOR',  core: 'nalet' },
  { callsign: 'CINDER', core: 'skala' },
  { callsign: 'ASH',    core: 'zasada' },
  { callsign: 'DRAKE',  core: 'natisk' },
];

// Постановка пятерых на главном острове (только для ролика): двое впереди, трое сзади, в центре
// заднего ряда — сквозной герой HAWK. Остальные четверо — по одному на каждое ядро:
// ASH (AMBUSH), CINDER (BULWARK), DRAKE (ONSLAUGHT), RAZOR (RAIDER). Лицом — на камеру финала.
const FACE = [-0.6, 7.4];
const STAGE_FIVE = [
  { id: 'f3', x: -1.95, z: -0.6 }, { id: 'f0', x: -0.65, z: -0.6 }, { id: 'f2', x: 0.65, z: -0.6 },   // задний ряд, герой — в центре
  { id: 'f4', x: -1.3, z: 0.7 },   { id: 'f1', x: 0.0, z: 0.7 },                                      // передний ряд
].map((q) => ({ ...q, face: FACE }));

export const plans = [
  {
    id: 's01-home', title: '01 · Главный остров, FIGHT', kind: 'scene', route: '/play/home', len: 180, align: 420,
    world: { roster: [hero, ...others].map((f) => ({ ...f, ready: true })), picked: 0 },
    hide: HOME_UI,
    actions: [
      { b: 60,  type: 'move', sel: '.fbtn', mark: 'FIGHT: рука наведена' },
      { b: 100, type: 'down', mark: 'FIGHT: нажатие' },
      { b: 108, type: 'up',   mark: 'FIGHT: отпускание, старт пролёта' },
    ],
    camera: {
      kind: 'keys', ease: 'smoother',
      release: { at: 108, blend: 24 },     // дальше камерой едет собственный пролёт игры
      keys: [
        { f: 0,   pos: [4.94, 5.2, 6.4], look: [0, 1.6, 1.0], roll: 0, fov: 42 },
        { f: 108, pos: [3.3, 3.5, 5.7], look: [-0.3, 1.5, 0.7], roll: 1.0, fov: 38 },
      ],
    },
    still: 100,
  },
  {
    // Ворота. Камера ПРИБЛИЖЕНА и ведётся настоящая (drive): подписи островов считает сама сцена по
    // своей камере, при подмене на отрисовке они остались бы стоять в углу. Освещение не трогаем.
    // С кадра 215 (нажатие FIGHT) камеру берёт собственный пролёт игры — с того места, где мы её оставили.
    id: 's02-gate', title: '02 · Ворота: выбор бойца', kind: 'scene', route: '/play/gate?step=squad', len: 336, align: 420,
    world: { roster: [hero, ...others], squad: [], mode: 'duel', n: 1 },
    hide: ['.hs-strip'],
    actions: [
      { b: 70,  type: 'move',  expr: "window.__gateTarget('plate','f0')", mark: 'наведение на остров героя' },
      { b: 110, type: 'click', expr: "window.__gateTarget('plate','f0')", mark: 'выбор бойца' },
      { b: 165, type: 'move',  expr: "window.__gateTarget('fight')", mark: 'наведение на FIGHT' },
      { b: 215, type: 'click', expr: "window.__gateTarget('fight')", mark: 'FIGHT: нажатие, подлёт в лицо кнопке' },
    ],
    camera: {
      kind: 'keys', drive: true, ease: 'smoother', release: { at: 215, blend: 1 },
      keys: [
        { f: 0,   pos: [0.0, 10.2, 18.5], look: [0.0, 0.0, 1.8],   roll: 0, fov: 38 },
        { f: 110, pos: [-1.2, 5.6, 4.2],  look: [-2.9, 1.2, -5.0], roll: 0, fov: 34 },
        { f: 165, pos: [0.0, 4.8, 21.5],  look: [0.0, 0.4, 12.5],  roll: 0, fov: 40 },
        { f: 215, pos: [0.0, 3.4, 19.2],  look: [0.0, 0.6, 13.25], roll: 0, fov: 38 },
      ],
    },
    still: 150,
  },
  {
    // Дуэль + хвост перехода T1 (54 кадра): крен нарастает до пика и уходит в чёрный.
    // Три плана кроме общего — «сбоку» (оба бойца в профиль и разведены на экране); плашки YOU/FOE
    // на средних и крупных планах скрыты, на общем — видны.
    id: 's03-duel', title: '03 · DUEL 1 на 1', kind: 'arena', route: '/play/arena', len: 654, win: 600, head: 0, tail: 54, offset: 0, fight: 'duel',
    fadeOut: 24,
    world: { roster: [hero], squad: [0], mode: 'duel', n: 1 },
    hide: [...DEV_UI, '.kfo', '.bfo', '.fso', '.cmd', '.arena-scrim'],
    camera: {
      kind: 'dynamic', blend: 40,
      platesOff: [[125, 654]],
      post: [{ ch: 'roll', f0: 600, f1: 654, v0: 0, v1: 34, ease: 'smooth' }],
      shots: [
        { from: 0,   shot: 'frame', a0: 1.35, da: -0.0008, r: 6.2, k: 1.4, h: 3.4, ly: 1.0, fov: 42 },
        { from: 150, shot: 'side',  r: 3.0, k: 1.0, h: 1.9, ly: 1.15, fov: 38 },
        { from: 300, shot: 'side',  flip: true, r: 2.3, k: 0.85, h: 1.5, ly: 1.2, fov: 34, dr: -0.0006 },
        { from: 450, shot: 'side',  r: 3.4, k: 1.0, h: 2.0, ly: 1.15, bias: 0.12, fov: 38 },
      ],
    },
    marks: [{ f: 600, kind: 'transition', name: 'T1: крен нарастает, уход в чёрный на пике' }],
    still: 330,
  },
  {
    // SQUAD с легендой: голова перехода T1 (54 кадра: крен раскручивается в ноль, проявление) и
    // хвост перехода T2 (28 кадров: рывок камеры вбок, чёрный).
    id: 's05a-squad', title: '05a · SQUAD 2 на 2, ведёт легенда', kind: 'arena', route: '/play/arena', len: 502, win: 420, head: 54, tail: 28, offset: 0, fight: 'squad',
    fadeIn: 24, fadeOut: 4,
    world: { roster: [hero, { callsign: 'CINDER', core: 'skala' }], squad: [0, 1], mode: 'squad', n: 2, legend: { callsign: 'ELDER', core: 'natisk' } },
    hide: [...DEV_UI, '.arena-scrim'],
    actions: [{ b: 12, type: 'clickEl', sel: '.cmd-toggle', mark: 'тумблер: ВЕДЁТ ЛЕГЕНДА' }],
    camera: {
      kind: 'dynamic', blend: 40,
      post: [
        { ch: 'roll', f0: 0, f1: 54, v0: 34, v1: 0, ease: 'smoother' },
        { ch: 'yaw', f0: 486, f1: 502, v0: 0, v1: 48, ease: 'smooth' },     // рывок ВЛЕВО; в зале вход продолжает то же движение
      ],
      shots: [{ from: 0, shot: 'frame', a0: 1.3, da: 0.0005, r: 4.6, k: 0.9, h: 3.4, ly: 0.35, fov: 42 }],
    },
    marks: [
      { f: 0,   kind: 'transition', name: 'T1: проявление, крен раскручивается в ноль' },
      { f: 474, kind: 'transition', name: 'T2: рывок камеры' },
    ],
    still: 200,
  },
  {
    // Зал FORGE: КАМЕРА СТРОИТСЯ ОТ ПОЗИЦИИ ЛЕГЕНДЫ (anchor:'legend'): легенда в кадре с первого
    // кадра, бойцы зала под ней. Голова — вход после рывка T2 (28 кадров, гашение рывка),
    // потом спуск к грушам, хвост — отъезд назад и вверх (T3, 60 кадров).
    id: 's05b-forge', title: '05b + 07 · Легенда над залом FORGE → груши', kind: 'scene', route: '/play/pve', len: 568, align: 420,
    fadeIn: 4, fadeOut: 30,
    world: {
      roster: [
        { ...hero, lesson: 55 }, { callsign: 'RAZOR', core: 'nalet', lesson: 55 },
        { callsign: 'CINDER', core: 'skala', lesson: 55 }, { callsign: 'ASH', core: 'zasada' },
      ],
      picked: 3, legend: { callsign: 'ELDER', core: 'natisk' },
    },
    hide: ['.forge-root > :not(:first-child)', '.hs-strip', '.perf-hud'],
    camera: {
      kind: 'keys', ease: 'smoother', anchor: 'legend',
      post: [{ ch: 'yaw', f0: 0, f1: 16, v0: -48, v1: 0, ease: 'smoother' }],   // вход справа (слева в кадр лезет SOON) — движение влево продолжается
      keys: [
        { f: 0,   off: [1.4, -3.0, 11.5], loff: [2.3, -1.45, 0], roll: 0, fov: 36 },
        { f: 198, off: [1.2, -2.6, 8.6], loff: [2.0, -1.4, 0],  roll: 0.6, fov: 36 },
        { f: 338, pos: [11.6, 2.7, 4.8], look: [9.3, 1.0, -0.4], roll: 0, fov: 40, ease: 'smooth' },
        { f: 508, pos: [11.0, 2.0, 3.6], look: [9.4, 1.0, -0.6], roll: -0.6, fov: 36 },
        { f: 568, pos: [13.6, 4.8, 8.6], look: [9.4, 1.2, -0.4], roll: 0, fov: 40 },
      ],
    },
    marks: [
      { f: 0,   kind: 'transition', name: 'T2: вход в зал, рывок гаснет' },
      { f: 28,  kind: 'action', name: 'легенда над залом, бойцы под ней' },
      { f: 366, kind: 'action', name: 'спуск к грушам: бойцы бьют груши' },
      { f: 508, kind: 'transition', name: 'T3: отъезд назад и вверх, затемнение' },
    ],
    still: 100,
  },
  {
    // Главный остров: пятеро стоят (постановка из камеры ролика), облёт, ЖЕСТ «рука-стрела» (все пятеро
    // в один кадр), пауза 0,6 с, BAM — кадр стягивается к центру в чёрный. Голова (40 кадров) — проявление
    // общего плана после T3.
    id: 's09-finale', title: '09–13 · Главный остров, пятеро стоят, жест', kind: 'scene', route: '/play/home', len: 520, align: 420,
    fadeIn: 24, fadeOut: 0,
    world: { roster: [hero, ...others].map((f) => ({ ...f, ready: true })), picked: 0 },
    hide: HOME_UI.concat(['.hs-dock']),
    camera: {
      kind: 'keys', ease: 'smooth',
      stage: { fighters: STAGE_FIVE, yawOff: 30, gesture: { f0: 452, dur: 24, reach: 1.5, torsoTurn: -12 } },
      keys: [
        { f: 0,   pos: [7.6, 5.4, 9.6],  look: [-0.65, 1.0, 0.0], roll: 0, fov: 40 },
        { f: 120, pos: [5.0, 3.6, 8.8],  look: [-0.65, 1.2, 0.0], roll: 0, fov: 38 },
        { f: 300, pos: [-0.2, 2.6, 7.4], look: [-0.65, 1.2, 0.0], roll: 0, fov: 36 },
        { f: 452, pos: [-0.5, 2.1, 6.0], look: [-0.65, 1.25, 0.0], roll: 0, fov: 34 },
        { f: 519, pos: [-0.55, 1.9, 5.4], look: [-0.65, 1.25, 0.0], roll: 0, fov: 32 },
      ],
    },
    fx: [{ kind: 'squeeze', f0: 512, f1: 520 }],
    marks: [
      { f: 0,   kind: 'transition', name: 'T3: проявление общего плана пятерых' },
      { f: 452, kind: 'gesture', name: 'жест «рука-стрела»: все пятеро начинают в один кадр' },
      { f: 476, kind: 'gesture', name: 'жест: все пятеро в позе в один кадр' },
      { f: 512, kind: 'bam', name: 'BAM, шаг 1: кадр стягивается к центру (8 кадров)' },
    ],
    still: 480,
  },
  {
    id: 's10-logo', title: '14–15 · BAM → логотип', kind: 'logo', len: 300, delay: 6, up: 6, down: 3, mark: 132, still: 200,
    fadeIn: 0,
    world: { roster: [] },
    marks: [
      { f: 6,  kind: 'bam', name: 'BAM, шаг 2: связка с ≈5 % к ≈108 %' },
      { f: 12, kind: 'bam', name: 'BAM, шаг 3: толчок кадра (3 кадра), связка оседает на 100 %' },
      { f: 15, kind: 'action', name: 'логотип: держится до конца' },
    ],
  },
];

// Порядок на шкале. gap — чёрные кадры между кусками. Переходы T1–T3 живут в хвостах и головах
// соседних планов (крен, рывок, отъезд), а чёрный между ними — только пик: T1 54+36+54, T2 28+4+28,
// T3 60+20+40 кадров. Итого 3120 кадров = 52,0 с.
export const timeline = [
  { plan: 's01-home' },
  { plan: 's02-gate' },
  { plan: 's03-duel' },
  { gap: 36, label: 'T1' },
  { plan: 's05a-squad' },
  { gap: 4, label: 'T2' },
  { plan: 's05b-forge' },
  { gap: 20, label: 'T3' },
  { plan: 's09-finale' },
  { plan: 's10-logo' },
];
export const FADE = 12;   // кадров затемнения на стыках кусков по умолчанию

// Отрывки для просмотра в 1080p (команда `cli.mjs excerpts`): переходы T1–T3 и финал. Каждая часть —
// кусок плана [from, to) в кадрах плана или чёрная пауза (gap). Совпадает со шкалой выше.
export const excerpts = [
  { id: 'T1', title: 'T1 · дуэль → SQUAD: крен нарастает, чёрный, крен раскручивается', parts: [{ plan: 's03-duel', from: 560, to: 654 }, { gap: 36 }, { plan: 's05a-squad', from: 0, to: 100 }] },
  { id: 'T2', title: 'T2 · SQUAD → зал FORGE: рывок, чёрный, вход и спуск к легенде', parts: [{ plan: 's05a-squad', from: 440, to: 502 }, { gap: 4 }, { plan: 's05b-forge', from: 0, to: 120 }] },
  { id: 'T3', title: 'T3 · зал FORGE → главный остров: отъезд, затемнение, проявление пятерых', parts: [{ plan: 's05b-forge', from: 480, to: 568 }, { gap: 20 }, { plan: 's09-finale', from: 0, to: 100 }] },
  { id: 'FIN', title: 'Финал · жест, пауза, BAM, логотип', parts: [{ plan: 's09-finale', from: 400, to: 520 }, { plan: 's10-logo', from: 0, to: 150 }] },
];
