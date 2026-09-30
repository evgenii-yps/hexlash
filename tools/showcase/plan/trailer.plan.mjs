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
      kind: 'rel', D: 9, ease: 'smoother', release: { at: 215, blend: 10 },
      keys: [{ f: 0, push: 0, roll: 0 }, { f: 215, push: 0.55, right: 0.3, up: -0.3, roll: 1.0 }],
    },
    still: 150,
  },
  {
    id: 's03-duel', title: '03 · DUEL 1 на 1', kind: 'arena', route: '/play/arena', len: 600, offset: 0, fight: 'duel',
    world: { roster: [hero], squad: [0], mode: 'duel', n: 1 },
    hide: [...DEV_UI, '.kfo', '.bfo', '.fso', '.cmd', '.arena-scrim'],
    camera: {
      kind: 'dynamic', blend: 40,
      shots: [
        { from: 0,   shot: 'frame', a0: 1.35, da: -0.0008, r: 6.2, k: 1.4, h: 3.4, ly: 1.0, fov: 42 },
        { from: 150, shot: 'frame', a0: 1.0,  da: 0.0009, r: 3.9, k: 1.3, h: 2.3, ly: 1.2, fov: 40 },
        { from: 300, shot: 'over',  who: 'hero', back: 2.4, side: 1.5, h: 1.6, ly: 1.2, fov: 40 },
        { from: 450, shot: 'over',  who: 'foe',  back: 2.3, side: -1.5, h: 1.5, ly: 1.2, fov: 40 },
      ],
    },
    still: 330,
  },
  {
    id: 's05a-squad', title: '05a · SQUAD 2 на 2, ведёт легенда', kind: 'arena', route: '/play/arena', len: 420, offset: 0, fight: 'squad',
    world: { roster: [hero, { callsign: 'CINDER', core: 'skala' }], squad: [0, 1], mode: 'squad', n: 2, legend: { callsign: 'ELDER', core: 'natisk' } },
    hide: [...DEV_UI, '.arena-scrim'],
    actions: [{ b: 12, type: 'clickEl', sel: '.cmd-toggle', mark: 'тумблер: ВЕДЁТ ЛЕГЕНДА' }],
    camera: {
      kind: 'dynamic', blend: 40,
      shots: [{ from: 0, shot: 'frame', a0: 1.3, da: 0.0005, r: 4.6, k: 0.9, h: 3.4, ly: 0.35, fov: 42 }],
    },
    still: 200,
  },
  {
    id: 's05b-forge', title: '05b + 07 · Легенда над залом FORGE → груши', kind: 'scene', route: '/play/pve', len: 480, align: 420,
    world: {
      roster: [
        { ...hero, lesson: 55 }, { callsign: 'RAZOR', core: 'nalet', lesson: 55 },
        { callsign: 'CINDER', core: 'skala', lesson: 55 }, { callsign: 'ASH', core: 'zasada' },
      ],
      picked: 3, legend: { callsign: 'ELDER', core: 'natisk' },
    },
    hide: ['.forge-root > :not(:first-child)', '.hs-strip', '.perf-hud'],
    camera: {
      kind: 'keys', ease: 'smoother',
      keys: [
        { f: 0,   pos: [6.6, 2.4, 7.0],  look: [1.9, 3.4, 0.6],  roll: 0, fov: 40 },
        { f: 170, pos: [5.6, 3.0, 6.4],  look: [1.9, 3.9, 0.6],  roll: 0.6, fov: 37 },
        { f: 310, pos: [11.6, 2.7, 4.8], look: [9.3, 1.0, -0.4], roll: 0, fov: 40, ease: 'smooth' },
        { f: 480, pos: [11.0, 2.0, 3.6], look: [9.4, 1.0, -0.6], roll: -0.6, fov: 36 },
      ],
    },
    still: 350,
  },
  {
    id: 's09-finale', title: '09–13 · Главный остров, пятеро стоят', kind: 'scene', route: '/play/home', len: 480, align: 420,
    world: { roster: [hero, ...others].map((f) => ({ ...f, ready: true })), picked: 0 },
    hide: HOME_UI.concat(['.hs-dock']),
    camera: {
      kind: 'keys', ease: 'smooth',
      keys: [
        { f: 0,   pos: [5.6, 3.2, 6.2],  look: [-0.6, 1.1, 0.2], roll: 0, fov: 38 },
        { f: 240, pos: [0.4, 3.0, 7.6],  look: [-0.6, 1.2, 0.2], roll: 0, fov: 36 },
        { f: 480, pos: [-5.0, 3.0, 6.4], look: [-0.6, 1.1, 0.2], roll: 0, fov: 38 },
      ],
    },
    still: 300,
  },
  {
    id: 's10-logo', title: '14–15 · Пауза и логотип', kind: 'logo', len: 300, delay: 36, grow: 12, mark: 132, still: 200,
    world: { roster: [] },
  },
];

// Порядок на шкале. gap — чёрные кадры между кусками (простые затемнения; на этапе 3
// здесь встанут переходы T1–T3). Длины совпадают с §5 ТЗ: итого 52 с.
export const timeline = [
  { plan: 's01-home' },
  { plan: 's02-gate' },
  { plan: 's03-duel' },
  { gap: 120, label: 'T1' },
  { plan: 's05a-squad' },
  { gap: 60, label: 'T2' },
  { plan: 's05b-forge' },
  { gap: 120, label: 'T3' },
  { plan: 's09-finale' },
  { plan: 's10-logo' },
];
export const FADE = 12;   // кадров затемнения на стыках кусков
