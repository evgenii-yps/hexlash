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

// Три варианта камеры кадра 05a (кинокадр, замечания владельца к шагу 3). Все: камера 3/4, ниже и ближе прежней, стоит на линии
// «середина плиты → середина боя» (az:'center'), чтобы легенда на платформе висела над серединой боя; сглаживание sm — без рывков;
// плавный наезд dr; со 150-го кадра плана (строка ELDER·PUSH → CINDER — на 174-м) — более близкий план, смешивание blend 70 кадров.
//   A — чуть правее линии (a0 +0,3), выше (h 3,6): самый «фронтальный», арена видна целиком;
//   B — 3/4 справа (a0 +0,55), h 3,2;
//   C — 3/4 слева (a0 −0,45), h 3,6: рекомендован — бой крупнее и по центру, арена читается диагональю.
const cam05aShot = (a0, r, k, h, ly, fov, rc, kc, hc, lyc, fovc) => [
  { from: 0, shot: 'frame', az: 'center', sm: 0.04, a0, r, k, h, ly, fov, dr: -0.002 },
  { from: 150, shot: 'frame', az: 'center', sm: 0.04, a0, r: rc, k: kc, h: hc, ly: lyc, fov: fovc, dr: -0.002 },
];
export const cam05aOptions = {
  A: cam05aShot(0.3, 4.4, 1.2, 3.6, 1.9, 42, 3.6, 1.1, 3.1, 1.7, 40),
  B: cam05aShot(0.55, 4.2, 1.2, 3.2, 1.7, 44, 3.4, 1.1, 2.7, 1.5, 42),
  C: cam05aShot(-0.45, 4.4, 1.2, 3.6, 1.9, 42, 3.6, 1.1, 3.1, 1.7, 40),
};

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
    still: 12,
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
    trim: { head: 6 },   // шкала: съём головы ради титра T1 на доле (см. титры); сам план и его кадры не меняются
    world: { roster: [hero, { callsign: 'CINDER', core: 'skala' }], squad: [0, 1], mode: 'squad', n: 2, legend: { callsign: 'ELDER', core: 'natisk' } },
    // Кинокадр (замечания владельца к шагу 3): в кадре — арена, бойцы, полоски здоровья, легенда над боем, её строка решений и тумблер.
    // Вне кадра: карточки кличей (.kfo) и баффов (.bfo; среди них TOWEL — читается как «сдаюсь»), панель COOLDOWN (.fso-panel),
    // служебные кольца-значки над ареной (они внутри .kfo / .bfo), накладки перехвата карт (.cmd-grab). Только в сборке ролика.
    hide: [...DEV_UI, '.arena-scrim', '.kfo', '.bfo', '.fso-panel', '.cmd-grab'],
    actions: [{ b: 12, type: 'clickEl', sel: '.cmd-toggle', mark: 'тумблер: ВЕДЁТ ЛЕГЕНДА' }],
    camera: {
      // drive: камера двигается НАСТОЯЩАЯ (до цикла игры), поэтому легенда над боем сама встаёт над серединой боя с честным
      // параллаксом; крен перехода T1 и рывок T2 (post) накладываются на отрисовке.
      kind: 'dynamic', drive: true, blend: 70,
      post: [
        { ch: 'roll', f0: 0, f1: 54, v0: 34, v1: 0, ease: 'smoother' },
        { ch: 'yaw', f0: 486, f1: 502, v0: 0, v1: 48, ease: 'smooth' },     // рывок ВЛЕВО; в зале вход продолжает то же движение
      ],
      shots: cam05aOptions.C,
    },
    marks: [
      { f: 0,   kind: 'transition', name: 'T1: проявление, крен раскручивается в ноль' },
      { f: 60,  kind: 'action', name: 'легенда над боем в кадре: тёмная фигура, золотое сердце' },
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
    trim: { head: 8, tail: 16 },   // шкала: съём головы (титр T2 на доле) и хвоста (титр T3 на доле)
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
      stage: { fighters: STAGE_FIVE, yawOff: 30, gesture: { f0: 456, dur: 24, reach: 1.5, torsoTurn: -12 } },
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
      { f: 456, kind: 'gesture', name: 'жест «рука-стрела»: все пятеро начинают в один кадр (на доле)' },
      { f: 480, kind: 'gesture', name: 'жест: все пятеро в позе в один кадр' },
      { f: 512, kind: 'bam', name: 'BAM, шаг 1: кадр стягивается к центру (8 кадров)' },
    ],
    still: 480,
  },
  // ── Титры в чёрном кадре переходов (шаг 1 правок v1), посажены на доли музыки (шаг 2). Тексты, тайминг и вид — только здесь. ──
  // Титр ≈1,0 с (hold 60 кадров; «щелчок» масштаба 92 → 100 % за 4 кадра), срез в чёрный. delay — чёрные кадры до титра:
  // титр появляется ровно на доле трека (19,25 / 28,85 / 39,07 с трека при задержке музыки 0,465 с), поэтому окна разной
  // длины (len); соседние сцены подрезаны в шкале на столько же (trim у s05a/s05b), так что все остальные события остались на местах.
  { id: 't1-title', title: 'T1 · титр', kind: 'title', len: 78, text: 'LEGEND TAKES COMMAND', delay: 12, hold: 60, snap: 4, from: 0.92, fadeIn: 0, fadeOut: 0, still: 30, world: { roster: [] },
    marks: [{ f: 12, kind: 'title', name: 'титр T1: LEGEND TAKES COMMAND (щелчок масштаба)' }, { f: 72, kind: 'title', name: 'титр T1: срез в чёрный' }] },
  { id: 't2-title', title: 'T2 · титр', kind: 'title', len: 80, text: 'TRAIN YOUR FIGHTERS', delay: 14, hold: 60, snap: 4, from: 0.92, fadeIn: 0, fadeOut: 0, still: 30, world: { roster: [] },
    marks: [{ f: 14, kind: 'title', name: 'титр T2: TRAIN YOUR FIGHTERS (щелчок масштаба)' }, { f: 74, kind: 'title', name: 'титр T2: срез в чёрный' }] },
  { id: 't3-title', title: 'T3 · титр', kind: 'title', len: 88, text: 'BUILD YOUR SQUAD', delay: 4, hold: 60, snap: 4, from: 0.92, fadeIn: 0, fadeOut: 0, still: 30, world: { roster: [] },
    marks: [{ f: 4, kind: 'title', name: 'титр T3: BUILD YOUR SQUAD (щелчок масштаба)' }, { f: 64, kind: 'title', name: 'титр T3: срез в чёрный (тишина перед возвратом темы)' }] },
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

// Порядок на шкале. gap — чёрные кадры между кусками (сейчас не используется: чёрные кадры переходов
// заняты титрами). Переходы T1–T3 живут в хвостах и головах соседних планов (крен, рывок, отъезд),
// а чёрный между ними — титр (окна 78 / 80 / 88 кадров; соседние сцены подрезаны в шкале через trim, чтобы события не уехали).
// Итого 3276 кадров = 54,6 с.
export const timeline = [
  { plan: 's01-home' },
  { plan: 's02-gate' },
  { plan: 's03-duel' },
  { plan: 't1-title' },
  { plan: 's05a-squad' },
  { plan: 't2-title' },
  { plan: 's05b-forge' },
  { plan: 't3-title' },
  { plan: 's09-finale' },
  { plan: 's10-logo' },
];
export const FADE = 12;   // кадров затемнения на стыках кусков по умолчанию

// Отрывки для просмотра в 1080p (команда `cli.mjs excerpts`): переходы T1–T3 и финал. Каждая часть —
// кусок плана [from, to) в кадрах плана или чёрная пауза (gap). Совпадает со шкалой выше.
export const excerpts = [
  { id: 'T1', title: 'T1 · дуэль → SQUAD: крен нарастает, чёрный, крен раскручивается', parts: [{ plan: 's03-duel', from: 560, to: 654 }, { plan: 't1-title', from: 0, to: 72 }, { plan: 's05a-squad', from: 0, to: 100 }] },
  { id: 'T2', title: 'T2 · SQUAD → зал FORGE: рывок, чёрный, вход и спуск к легенде', parts: [{ plan: 's05a-squad', from: 440, to: 502 }, { plan: 't2-title', from: 0, to: 72 }, { plan: 's05b-forge', from: 0, to: 120 }] },
  { id: 'T3', title: 'T3 · зал FORGE → главный остров: отъезд, затемнение, проявление пятерых', parts: [{ plan: 's05b-forge', from: 480, to: 568 }, { plan: 't3-title', from: 0, to: 72 }, { plan: 's09-finale', from: 0, to: 100 }] },
  { id: 'FIN', title: 'Финал · жест, пауза, BAM, логотип', parts: [{ plan: 's09-finale', from: 400, to: 520 }, { plan: 's10-logo', from: 0, to: 150 }] },
];

// Музыка (шаг 2 правок v1). Трек — Bertsz «Vintage montage music» (Pixabay), выбор владельца; карта долей и ударов —
// audio/beatmap.json (`python3 audio/analyze.py`). Данные, не логика:
//   anchors — момент трека (с) ↔ кадр шкалы {plan, f: кадр плана};
//   cut     — кадр шкалы, где музыка обрывается (начало стягивания кадра, BAM шаг 1); после обрыва — провал,
//             потом полнозвучный вход трека на кадре bam. Для этого берётся кусок трека с 74,18 с (тихая часть
//             перед кодой), а не затухающий хвост громкой части. Всё — из самого трека, ничего не добавлено.
export const music = {
  file: 'audio/bertsz-vintage-montage-music-188528.mp3',
  anchors: {
    theme: { track: 40.468, at: { plan: 's09-finale', f: 0 } },   // возврат темы после затухания = первый кадр финала (проявление пятерых)
    bam:   { track: 74.41,  at: { plan: 's10-logo', f: 6 } },     // полнозвучный вход после провала = первый кадр логотипа
  },
  cut: { plan: 's09-finale', f: 512 },
  boost: { db: 8, sec: 2.5 },   // подъём уровня входа на BAM (дБ на ударе → 0 за sec): вход в треке тише громкой части
  fadeIn: 1.0,      // с: плавный вход (отсчёт от начала музыки)
  fadeOut: 3.0,     // с: затухание под удержанием логотипа, заканчивается за 0,1 с до конца
  lufs: -14, tp: -1.5, bitrate: '192k',
};

// Варианты музыки на одном видео (замечания владельца к шагу 3): A — основной (`music` выше, со склейкой на BAM);
// B — сплошной кусок трека без склейки, BAM на естественном возврате всей фактуры после провала (74,41 с трека);
// C — сплошной кусок, который начинается в энергичной части (основной ритм) и заканчивается BAM на самой сильной доле
// такого куска (64,26 с трека; сила 6,0 — выше в хвосте трека только 70,26 и 72,67, а сильнее всех — щелчок 73,83 с).
export const musicVariants = {
  A: { title: 'A — текущий: склейка', kind: 'splice' },
  B: { title: 'B — без склейки: естественный возврат после провала', kind: 'continuous', trackAtBam: 74.41, boost: { db: 8, sec: 2.5 } },
  C: { title: 'C — энергичный отрезок, BAM на самую сильную долю', kind: 'continuous', trackAtBam: 64.26, boost: { db: 8, sec: 2.5 } },
};
