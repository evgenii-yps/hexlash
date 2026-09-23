<!-- ForgeMockScene — ЗАЛ FORGE В НОВОМ ВИДЕ, макет. Часть скрытой страницы
     /dev/forge (ТЗ 23.09.2026, правка v3). НИЧЕГО НЕ ВСТРАИВАЕТ: настоящий зал —
     это PveScene.vue + ForgePanel.vue, и они здесь не правятся и не читаются.

     Своя сцена, своими копиями, по рецепту hexlash-3d. Строительные кирпичи
     ВЫЗЫВАЮТСЯ, а не правятся: плита (forgeSlab), лампы (hallLamps), купол
     (hallBackdrop), тела (buildFighter), режиссёр прогулок (homeWander), облако
     легенды (legendPresence).

     ЧТО ПРИНЕСЛА ПРАВКА v3:
       · КАМЕРА СВОБОДНАЯ — домашняя. Тот же OrbitControls, тот же стартовый
         угол, те же ограничители (под плиту не заглянуть, приближение в
         коридоре), плюс возврат в стартовую позу после простоя.
       · БОЙЦЫ БРОДЯТ. Разметка мест из v2 удалена: она вводилась, чтобы разнести
         слипшихся, а слипание было ошибкой макета и уже исправлено.
       · ВТОРОЙ ОСТРОВ — тренировочный. Боец, которому назначено занятие, уходит
         туда СВОИМИ НОГАМИ, встаёт к своей груше и бьёт её; кончил — возвращается.

     ⚠️ ОДИН РЕЖИССЁР — ОДНО ТЕЛО. createHomeWanderDirector держит ровно одного
        бойца (`attach(f, cam)`, одна переменная `fighter`, `foePos()` без номера).
        Поэтому здесь заводится ПО ЭКЗЕМПЛЯРУ НА БОЙЦА — это переиспользование
        домашнего режиссёра, а не второй режиссёр: ни строчки его правил тут не
        переписано. Друг о друге они узнают через `setObstacles`, которому каждый
        кадр отдаются живые места соседей.

     Дисциплина: тёмная комната; одно тёплое облако легенды; ядро выбранного
     бойца; розовое — только в момент нажатия. Груши не светятся. Ни одной цифры.
     Уважает prefers-reduced-motion и паузу вкладки. -->
<template>
  <div ref="wrap" class="fm-wrap">
    <canvas ref="canvasEl" class="fm-canvas" />
    <div class="fm-vignette" />
    <div v-if="fps !== null" class="fm-fps">{{ fps }} fps</div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildBackdrop } from './hallBackdrop.js';
import { LAMPS as HALL_LAMPS, buildLamps } from './hallLamps.js';
import { buildForgeSlab } from './forgeSlab.js';
import { buildFighter } from './buildFighter.js';
import { resolveBehavior } from '@/data/behavior.js';
import { createHomeWanderDirector } from './homeWander.js';
import { createLegendPresence } from './legendPresence.js';
import {
  buildRoster, buildUpgrade, buildPunchBag,
  buildStatsFloor, buildLegendAnchor, buildBuffShelf,
} from './forgeProps.js';
import { CORE_HUE, AMBER, LIGHTING, FOG_COLOR, FOG, FOV, CAMERA, BACKDROP } from '@/data/sceneTokens.js';

const props = defineProps({
  /** Сколько МЕСТ держит ступень плиты — 4 / 7 / 10. Столько же и груш. */
  seats: { type: Number, default: 4 },
  /** Сколько бойцов сейчас ЗАНИМАЮТСЯ (стоят у груш). Остальные бродят. */
  training: { type: Number, default: 0 },
  /** Выбранный боец стоит смирно лицом к игроку (состояние READY). */
  ready: { type: Boolean, default: false },
  legend: { type: Boolean, default: false },
  statsOpen: { type: Boolean, default: false },
  pressed: { type: String, default: null },   // 'roster' | 'upgrade' | null
  /** Куда смотрит камера в покое: 'hall' | 'training'. Это ПОМОЩЬ СТРАНИЦЫ, а
   *  не кнопка игры: в игре игрок доворачивает камеру сам. Здесь она нужна,
   *  чтобы владелец мог разглядеть соседний остров с телефона одним нажатием. */
  focus: { type: String, default: 'hall' },
  showFps: { type: Boolean, default: false },
});
const emit = defineEmits(['press', 'pick-fighter']);

// ───────────────────────────── НАСТРОЙКИ ─────────────────────────────
const SLAB = { steps: [4, 7, 10], aspect: 1.5, edge: 0.8, height: 1.0 };
const ARC = { step: 1.4, radius: 16 };
const BODY = { halfW: 0.40, height: 1.95 };
const MARK = { ahead: 2.9 };
const LAMP = { intensity: 30, distance: 26, hangLift: 1.2, trainLift: 1.7, trainPower: 0.85 };

// ТРЕНИРОВОЧНЫЙ ОСТРОВ. Стоит рядом с главным, своей плитой.
//
// ⚠️ ЗАЗОР МЕЖДУ ОСТРОВАМИ — 0.35, и это не случайное число. Боец уходит на
//    занятие СВОИМИ НОГАМИ, а не переносится: ноги идут по плите, и над щелью
//    тело неизбежно оказывается в воздухе. При 0.35 это один шаг за треть
//    секунды — читается как перешагнул, а не как прошёл по пустоте. Развести
//    острова дальше значит либо показать шагающего по воздуху, либо завести
//    перенос, которого в этом мире нет.
const TRAIN = {
  gap: 0.35,
  rowMax: 5,          // груш в одном ряду; дальше — второй ряд
  bagStep: 1.25,      // расстояние между грушами вдоль ряда
  rowGap: 2.10,       // между рядами груш
  standAhead: 0.86,   // на сколько боец стоит ПЕРЕД грушей (в сторону камеры)
  edge: 0.9,          // бортик плиты вокруг груш
  hitEvery: [0.55, 1.15],   // пауза между ударами, секунд
};

// Камера — ДОМАШНЯЯ. Числа взяты у HomeScene: те же, чтобы зал и дом
// управлялись одинаково и игрок не переучивался.
const CAM = {
  // УГОЛ домашний — это направление взгляда, и оно берётся у дома как есть.
  // ДЛИНА домашней не берётся: дома плита 6×4, здесь — вдвое больше и с соседним
  // островом, и с домашних 9.7 единиц камера утыкается носом в пол. Поэтому от
  // дома взято направление, а удаление подбирается под то, что реально стоит на
  // главном острове (fitStartDistance) — ровно так же, как в зале до этой правки.
  base: new THREE.Vector3(4.6, 5.2, 6.7),   // домашнее смещение: отсюда берём УГОЛ
  homeSlabW: 6,                             // ширина домашней плиты — мера масштаба
  minDist: 3.5, maxDist: 12,                // домашний коридор; масштабируется тем же числом
  polarMin: 0.3, polarMax: 1.4,             // под плиту не заглянуть
  damping: 0.08,
  targetLift: 1.1,                          // точка вращения — на уровне груди
  returnDelay: 4.0,                         // простой до возврата в стартовую позу
  returnLerp: 1.6,
};

const LEGEND = { height: 4.7, driftSpeed: 0.5, driftRadius: 0.7, bobAmplitude: 0.18, hazeDensity: 90 };
const CORE_LIGHT = { rest: 0.05, lerp: 7.0 };
const CORE_PALETTE = [
  { id: 'natisk', hue: CORE_HUE.natisk },
  { id: 'nalet', hue: CORE_HUE.nalet },
  { id: 'skala', hue: CORE_HUE.skala },
  { id: 'zasada', hue: CORE_HUE.zasada },
];
// Имена осей для статов — СЛОВА, не числа.
const AXIS_NAMES = ['DISTANCE', 'TEMPO', 'WEIGHT', 'SLIP', 'COUNTER', 'INITIATIVE', 'RESILIENCE'];
// Репертуар у груши — существующие боевые движения, а не новая анимация.
const BAG_MOVES = ['punch', 'double', 'hook', 'uppercut', 'bodyShot', 'combo', 'frontKick', 'teep', 'knee'];

const wrap = ref(null);
const canvasEl = ref(null);
const fps = ref(null);

let renderer, scene, camera, clock, controls;
let slab = null, trainSlab = null, backdrop = null, lamps = null, trainLamps = null;
let legendBody = null, legendPresence = null, legendAnchor = null;
let statsFloor = null;
let propList = [];       // { key, obj }
let bags = [];           // { group, hit, tick, dispose, hitY, x, z }
let roster = [];         // боец: тело, режиссёр, состояние
let compose = null, mark = { x: 0, z: 0 };
let trainHalfW = 0, trainNearZ = 0;   // край соседнего острова — для стартовой позы
let reduced = false, mm = null, onMM = null;
let resizeObserver = null, onVisibility = null;
let raycaster = null, pointerNdc = null, onPointerDown = null;
let fpsAcc = 0, fpsFrames = 0;
let currentIdx = 0;
let elapsed = 0;
let homePose = null;      // стартовая поза камеры
let idleSince = null, returning = false;

// ─────────────────── Геометрия главного острова ───────────────────
const halfAngle = (n) => (n <= 1 ? 0 : (ARC.step * (n - 1)) / 2 / ARC.radius);
const arcHalfWidth = (n) => ARC.radius * Math.sin(halfAngle(n));
const arcBow = (n) => ARC.radius * (1 - Math.cos(halfAngle(n)));
const stepFor = (n) => SLAB.steps.find((s) => n <= s) ?? SLAB.steps[SLAB.steps.length - 1];

// Плита по-прежнему растёт тремя ступенями. Мест на ней больше не размечают, но
// РАЗМЕР её считается всё так же: по тому, сколько бойцов она должна носить.
function composeFor(count) {
  const max = stepFor(count);
  const needW = 2 * (arcHalfWidth(max) + BODY.halfW + 0.15 + SLAB.edge);
  const depth = (0.70 + arcBow(max)) + MARK.ahead + 0.70 + 2 * SLAB.edge + 0.72;
  const width = Math.max(needW, depth * SLAB.aspect);
  const slabDepth = width / SLAB.aspect;
  const arcZ = -slabDepth / 2 + SLAB.edge + 0.70 + arcBow(max);
  return { slab: { width, depth: slabDepth }, arcZ, markZ: arcZ + MARK.ahead, max };
}

// Раскладка груш: рядами не длиннее rowMax, ряды уходят в глубину. Так остров
// остаётся компактным и на десяти грушах — длинная шеренга увела бы камеру.
function bagLayout(n) {
  const rows = Math.ceil(n / TRAIN.rowMax);
  const per = Math.ceil(n / rows);
  const out = [];
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / per);
    const inRow = Math.min(per, n - r * per);
    const k = i - r * per;
    out.push({
      x: (k - (inRow - 1) / 2) * TRAIN.bagStep,
      z: (r - (rows - 1) / 2) * TRAIN.rowGap,
    });
  }
  const width = (per - 1) * TRAIN.bagStep + 2 * (TRAIN.edge + 0.4);
  const depth = (rows - 1) * TRAIN.rowGap + 2 * (TRAIN.edge + TRAIN.standAhead + 0.4);
  return { spots: out, width, depth };
}

// ─────────────────── Ядро бойца: яркость пишется СНАРУЖИ ───────────────────
function coreParts(f) {
  let gem = null, halo = null;
  f.group.traverse((o) => {
    if (!o.isMesh || !o.material) return;
    if (!gem && o.material.emissive !== undefined && o.material.emissiveIntensity > 0.8) gem = o;
    if (!halo && o.material.blending === THREE.AdditiveBlending && o.material.transparent) halo = o;
  });
  return { gem, halo, gemBase: gem ? gem.material.color.clone() : null, haloBase: halo ? halo.material.opacity : 0 };
}
function applyLight(r) {
  const k = CORE_LIGHT.rest + (1 - CORE_LIGHT.rest) * r.lit;
  if (r.parts.gem && r.parts.gemBase) r.parts.gem.material.color.copy(r.parts.gemBase).multiplyScalar(k);
  if (r.parts.halo) r.parts.halo.material.opacity = r.parts.haloBase * k;
}

// ─────────────────── Сборка ───────────────────
function buildIslands() {
  compose = composeFor(props.seats);
  mark = { x: 0, z: compose.markZ };

  slab = buildForgeSlab({ width: compose.slab.width, depth: compose.slab.depth, height: SLAB.height });
  suppressRift(slab);
  scene.add(slab.group);

  const lay = bagLayout(props.seats);
  trainSlab = buildForgeSlab({ width: lay.width, depth: lay.depth, height: SLAB.height });
  suppressRift(trainSlab);
  // Остров стоит справа от главного — там, куда смотрит стартовая поза камеры,
  // поэтому в покое он виден краем кадра, а не за спиной.
  const cx = compose.slab.width / 2 + TRAIN.gap + lay.width / 2;
  trainSlab.group.position.x = cx;
  scene.add(trainSlab.group);

  const topY = slab.refs.topY;
  for (const sp of lay.spots) {
    const bag = buildPunchBag();
    bag.group.position.set(cx + sp.x, topY, sp.z);
    scene.add(bag.group);
    bags.push({ ...bag, x: cx + sp.x, z: sp.z });
  }
  trainHalfW = lay.width / 2;
  trainNearZ = lay.depth / 2;
  return { cx, lay };
}

/** Разлом плиты в зале подавлен СНАРУЖИ — тот же приём, что у дома: зал не бой. */
function suppressRift(s) {
  s.group.traverse((o) => {
    if (o.isLine) o.visible = false;
    if (o.isMesh && o.material && o.material.blending === THREE.AdditiveBlending) o.material.opacity = 0;
  });
}

function buildRosterBodies(world) {
  const topY = slab.refs.topY;
  const n = props.seats;
  // ПОЛЕ ПРОГУЛКИ. Одно на всех оно быть не может: домашний режиссёр ведёт бойца
  // от края к краю («уйти в противоположную половину»), и десять бойцов с общим
  // полем вытаптывают один и тот же коридор — на снимке это ровно та куча, от
  // которой уходили. Поэтому каждому достаётся СВОЯ ПОЛОСА: она занимает всю
  // глубину плиты и больше половины её ширины, полосы сильно перекрываются, и
  // соседи всё время заходят друг к другу. Это НЕ закреплённое место из прошлой
  // правки: ничего не размечено, границы не видны, боец ходит по всему залу —
  // просто держится своей стороны чаще, чем чужой.
  const halfW = compose.slab.width / 2 - 1.2;
  const halfD = compose.slab.depth / 2 - 1.0;
  const lane = (i) => {
    const n = Math.max(1, props.seats);
    const centre = n === 1 ? 0 : (-1 + (2 * i) / (n - 1)) * halfW * 0.55;
    const reach = halfW * 0.62;
    return {
      xMin: Math.max(-halfW, centre - reach), xMax: Math.min(halfW, centre + reach),
      zMin: -halfD, zMax: halfD,
    };
  };
  for (let i = 0; i < n; i++) {
    const core = CORE_PALETTE[i % CORE_PALETTE.length];
    // СВОЙ экземпляр домашнего режиссёра на каждое тело — см. шапку файла.
    // obstacleR у режиссёра сравнивается с КВАДРАТОМ расстояния, поэтому 1.6 —
    // это круг радиусом 1.26: шире тела, так что цель прогулки не назначается
    // под ноги соседу.
    const dir = createHomeWanderDirector({ zone: lane(i), obstacleR: 1.6 });
    const r = {
      id: `f${i}`, core, dir,
      fighter: null, parts: null, lit: i === currentIdx ? 1 : 0,
      mode: 'wander',        // 'wander' | 'toBag' | 'atBag' | 'home' | 'still'
      bag: null, nextHit: 0, held: false, loco: null,
      lure: new THREE.Vector3(), lureOn: false,
    };
    const fighter = buildFighter(core.hue, {
      side: 'player', coreId: core.id, behavior: resolveBehavior(core.id, []),
      // ⚠️ bounds — ХОЛСТ ОБОИХ ОСТРОВОВ, а не личная зона. Это жёсткий рельс
      // движка «не уйти с плиты»; по самой плите тело водит режиссёр. В v1 сюда
      // передавался размер зоны — и все тела зажимало в коробку у центра.
      bounds: { x: world.cx + world.lay.width / 2, z: Math.max(compose.slab.depth, world.lay.depth) / 2 },
      // Приманка: пока боец бродит — от его режиссёра; пока идёт на занятие или
      // возвращается — наша собственная точка. Одно и то же тело, одни и те же ноги.
      getFoePos: () => (r.lureOn ? r.lure : (r.held ? null : r.dir.foePos())),
    });
    fighter.setReducedMotion(reduced);
    fighter.setAI?.(false);
    fighter.group.children.forEach((o) => { if (o.isSprite) o.visible = false; });  // без плашки HP
    // Стартовое место — вразнобой по плите, чтобы зал не начинался с шеренги.
    const a = (i / Math.max(1, n)) * Math.PI * 2;
    fighter.group.position.set(
      Math.cos(a) * compose.slab.width * 0.22,
      topY,
      Math.sin(a) * compose.slab.depth * 0.22,
    );
    scene.add(fighter.group);
    r.fighter = fighter;
    r.parts = coreParts(fighter);
    addPickProxy(r);
    r.dir.attach(fighter, camera, { reduced });
    roster.push(r);
  }
}

/**
 * ЦЕЛЬ ДЛЯ ПАЛЬЦА. Боец теперь движется, и попадать по силуэту на телефоне
 * трудно. Поэтому к телу добавляется невидимая коробка шире силуэта — по ней и
 * ловится нажатие. Она НИЧЕГО не рисует (colorWrite/depthWrite выключены), но
 * остаётся видимой для луча: невидимые объекты луч пропускает.
 */
function addPickProxy(r) {
  const geo = new THREE.BoxGeometry(1.15, BODY.height + 0.25, 1.15);
  const mat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, transparent: true, opacity: 0 });
  const box = new THREE.Mesh(geo, mat);
  box.position.y = (BODY.height + 0.25) / 2;
  box.renderOrder = -20;
  r.fighter.group.add(box);
  r.pick = box;
  r.pickOwn = () => { geo.dispose(); mat.dispose(); };
}

function placeProps() {
  const topY = slab.refs.topY;
  const builders = { roster: buildRoster, upgrade: buildUpgrade, shelf: buildBuffShelf };
  // Предметы стоят у ближней кромки главного острова, слева и по центру: справа
  // проход на тренировочный остров, и загораживать его нечем.
  const z = compose.slab.depth / 2 - 0.9;
  // Домашний угол смотрит с передне-правой четверти, поэтому предметы стоят в
  // середине ближней кромки, а не у левого края: у края они уходят из кадра.
  // Предметы стоят НА ПОЛУ ЗАЛА, а не по кромке. У кромки домашний угол
  // укладывает их в самый низ кадра, боком и мелко; сдвинутые внутрь, они
  // попадают в ту же часть картинки, что и бойцы, и читаются вместе с ними.
  const spots = [
    { key: 'roster', x: -compose.slab.width * 0.05, z: z - 0.7 },
    { key: 'upgrade', x: compose.slab.width * 0.19, z: z - 1.6 },
    { key: 'shelf', x: -compose.slab.width * 0.28, z: z - 2.0 },
  ];
  for (const sp of spots) {
    const obj = builders[sp.key]();
    obj.group.position.set(sp.x, topY, sp.z);
    scene.add(obj.group);
    propList.push({ key: sp.key, obj });
  }
}

function buildLegend() {
  const topY = slab.refs.topY;
  legendAnchor = buildLegendAnchor();
  legendAnchor.group.position.set(0, topY + LEGEND.height, 0);
  scene.add(legendAnchor.group);

  legendBody = buildFighter(AMBER, {
    side: 'player', coreId: null, behavior: resolveBehavior(null, []),
    bounds: { x: 1, z: 1 }, getFoePos: () => null,
  });
  legendBody.setReducedMotion(reduced);
  legendBody.group.children.forEach((o) => { if (o.isSprite) o.visible = false; });
  scene.add(legendBody.group);
  legendPresence = createLegendPresence({
    baseX: 0, baseZ: 0, floorY: topY,
    driftSpeed: LEGEND.driftSpeed, driftRadius: LEGEND.driftRadius,
    bobAmplitude: LEGEND.bobAmplitude, hazeDensity: LEGEND.hazeDensity,
    ORBIT: { highAboveTop: LEGEND.height }, reduced,
  });
  legendBody.group.position.copy(legendPresence.position);
  scene.add(legendPresence.group);
  scene.add(legendPresence.trail);
}

function buildAll() {
  const world = buildIslands();
  const topY = slab.refs.topY;

  // Четыре лампы — не больше (правило зала). Плита растёт ступенями, поэтому те
  // же четыре разносятся шире и светят дальше: сила по квадрату роста плиты,
  // радиус — по самому росту. Две из них сдвинуты к тренировочному острову,
  // иначе груши стоят в темноте.
  const base = composeFor(SLAB.steps[0]).slab.width;
  const k = Math.max(1, compose.slab.width / base);
  // ⚠️ ЛАМП ШЕСТЬ, А НЕ ЧЕТЫРЕ — названное отступление. Правило зала «четыре
  //    лампы, новых источников не заводить» писалось на ОДИН остров. Островов
  //    стало два, и четырьмя их не накрыть: разнесённые на оба, они оставляют
  //    тёмным и зал, и груши (проверено на кадрах). Поэтому главный остров
  //    получает свои четыре — ровно те, что у зала, — а тренировочный ещё две.
  //    Теней по-прежнему нет ни одной, так что телефон платит только за две
  //    точки света.
  lamps = buildLamps({
    ...HALL_LAMPS, hangLift: LAMP.hangLift,
    light: { ...HALL_LAMPS.light, intensity: LAMP.intensity * k * k, distance: LAMP.distance * k },
    positions: [
      { x: -compose.slab.width * 0.26, z: compose.slab.depth * -0.16, drop: 0.0 },
      { x: compose.slab.width * 0.24, z: compose.slab.depth * -0.14, drop: 0.7 },
      { x: -compose.slab.width * 0.10, z: compose.slab.depth * 0.20, drop: 0.3 },
      { x: compose.slab.width * 0.16, z: compose.slab.depth * 0.22, drop: 1.0 },
    ],
  }, reduced);
  scene.add(lamps.group);

  // Тренировочный остров ниже и теснее главного, и груша висит высоко — на
  // равной высоте подвеса лампа целовала бы её сверху, груша выбеливалась в
  // пятно и читалась раньше бойца рядом. Поэтому здесь лампы подняты выше
  // (hangLift + LAMP.trainLift): свет ложится на остров ровно, груша остаётся
  // матовой, а первым по-прежнему читается тело.
  const kt = Math.max(1, world.lay.width / base);
  trainLamps = buildLamps({
    ...HALL_LAMPS, hangLift: LAMP.hangLift + LAMP.trainLift,
    light: { ...HALL_LAMPS.light, intensity: LAMP.intensity * kt * kt * LAMP.trainPower, distance: LAMP.distance * kt },
    positions: [
      { x: world.cx - world.lay.width * 0.20, z: -world.lay.depth * 0.12, drop: 0.2 },
      { x: world.cx + world.lay.width * 0.20, z: world.lay.depth * 0.14, drop: 0.8 },
    ],
  }, reduced);
  scene.add(trainLamps.group);

  backdrop = buildBackdrop({ radius: BACKDROP.radius.forge, centerY: BACKDROP.centerY });
  scene.add(backdrop.mesh);

  buildRosterBodies(world);
  placeProps();
  buildLegend();

  statsFloor = buildStatsFloor(AXIS_NAMES);
  scene.add(statsFloor.group);

  applyAssignments();
  applyHomePose(true);
}

// ─────────────────── Камера ───────────────────
// Ровно домашний рецепт: орбита с демпфированием, коридор приближения, пол по
// углу (под плиту не заглянуть), полная свобода по кругу — и возврат в стартовую
// позу после простоя, как это уже сделано на сцене режимов.
// Насколько этот зал крупнее дома. Одним числом тянутся и удаление, и коридор:
// иначе игрок, привыкший к домашнему щипку, здесь либо не приблизится, либо
// улетит.
function scaleVsHome() { return Math.max(1, compose.slab.width / CAM.homeSlabW); }

/**
 * Стартовое удаление. Направление — домашнее; длина подбирается так, чтобы на
 * ТЕКУЩЕМ кадре читалось то, ради чего сюда приходят: боец на главном острове,
 * планшет и наковальня. Тренировочный остров в подгонку НЕ входит — он и должен
 * оставаться краем кадра (решение ТЗ: свобода камеры важнее, чем «всё в кадре»).
 */
/**
 * Что обязано читаться в СТАРТОВОЙ позе: боец, планшет и наковальня (требование
 * ТЗ). Плита в подгонку НЕ входит намеренно — вписать её целиком значит отогнать
 * камеру, и тогда мелкими станут ровно те трое, ради которых поза и подбиралась.
 * Камера свободная: кому нужен весь остров — довернёт и отъедет сам.
 */
function framePts() {
  const topY = slab.refs.topY;
  const pts = [];
  // Боец — коробкой в середине рабочей части зала (тела бродят, привязываться к
  // живому месту нельзя: поза начала бы дышать вместе с ними).
  const bx = -compose.slab.width * 0.02, bz = -compose.slab.depth * 0.06;
  pts.push([bx - 0.9, topY, bz + 0.9], [bx + 0.9, topY + BODY.height + 0.45, bz - 0.9]);
  for (const pr of propList) {
    if (pr.key === 'shelf') continue;        // задел, в стартовую позу не просится
    const g = pr.obj.group.position;
    pts.push([g.x - 0.85, topY, g.z + 0.75], [g.x + 0.85, topY + 1.5, g.z - 0.75]);
  }
  // Ближний угол тренировочного острова — ОДНОЙ точкой. Не чтобы вписать его, а
  // чтобы он гарантированно задевал край кадра: игрок должен видеть, что рядом
  // есть ещё один остров и там кто-то занимается. Вписывать его целиком нельзя —
  // камера отъедет, и всё измельчает (это и записано в ТЗ как принятая цена).
  return pts;
}
/** Та же композиция плюс ближний угол соседнего острова. */
function framePtsWithNeighbour() {
  const pts = framePts();
  if (trainSlab) pts.push([trainSlab.group.position.x - trainHalfW, slab.refs.topY, trainNearZ]);
  return pts;
}

function fitStartDistance(target, dir, pts) {
  const rect = { x0: 0.05, x1: 0.95, y0: 0.08, y1: 0.95 };
  const cam = camera.clone();
  let dist = CAM.base.length() * scaleVsHome();
  const _p = new THREE.Vector3();
  for (let pass = 0; pass < 18; pass++) {
    cam.position.copy(target).addScaledVector(dir, dist);
    cam.lookAt(target);
    cam.updateMatrixWorld(true);
    cam.updateProjectionMatrix();
    let l = Infinity, r = -Infinity, b = Infinity, t = -Infinity;
    for (const q of pts) {
      _p.set(q[0], q[1], q[2]).project(cam);
      const sx = (_p.x + 1) / 2, sy = 1 - (_p.y + 1) / 2;
      l = Math.min(l, sx); r = Math.max(r, sx); b = Math.min(b, sy); t = Math.max(t, sy);
    }
    const k = Math.max((r - l) / (rect.x1 - rect.x0), (t - b) / (rect.y1 - rect.y0));
    if (Math.abs(k - 1) < 0.005) break;
    dist *= k;
  }
  return dist;
}

/** Поза, в которой тренировочный остров и его груши видно целиком. */
function trainingFraming() {
  const topY = slab.refs.topY;
  const target = new THREE.Vector3(trainSlab.group.position.x, topY + CAM.targetLift, 0);
  const dir = CAM.base.clone().normalize();
  const pts = [];
  for (const b of bags) {
    pts.push([b.x - 0.5, topY, b.z + TRAIN.standAhead + 0.6], [b.x + 0.5, topY + BODY.height + 0.5, b.z - 0.6]);
  }
  const dist = fitStartDistance(target, dir, pts);
  return { position: target.clone().addScaledVector(dir, dist), target, dist };
}

function homeFraming() {
  const topY = slab ? slab.refs.topY : 0;
  // Точка взгляда смещена к правому краю главного острова: так в стартовой позе
  // боец, планшет и наковальня читаются вместе, а тренировочный остров входит в
  // кадр краем — ровно как просит ТЗ.
  const target = new THREE.Vector3(compose.slab.width * 0.16, topY + CAM.targetLift, 0);
  const dir = CAM.base.clone().normalize();
  // Два замера: по самой композиции и по ней же вместе с краем соседнего
  // острова. Берём второй, но не дальше чем в NEIGHBOUR_CAP раза от первого —
  // иначе на десяти грушах сосед утаскивает камеру так далеко, что мелким
  // становится всё сразу (снято и проверено). Дальше сосед просто обрезается
  // краем кадра, а он и должен быть краем.
  const NEIGHBOUR_CAP = 1.15;
  const dBase = fitStartDistance(target, dir, framePts());
  let dist = Math.min(fitStartDistance(target, dir, framePtsWithNeighbour()), dBase * NEIGHBOUR_CAP);
  // Довести по высоте. Остров шире, чем высок, а вертикальный кадр — наоборот:
  // подгонка упирается в ширину и оставляет запас по высоте. Без доводки этот
  // запас целиком уходит в чёрный верх; с ней композиция садится в нижние две
  // трети, а верх достаётся залу — лампам и месту легенды.
  const cam = camera.clone();
  const _p = new THREE.Vector3(), _up = new THREE.Vector3(), _x = new THREE.Vector3(), _z = new THREE.Vector3();
  const pts = framePts();
  const wantY = camera.aspect < 1 ? 0.62 : 0.52;
  for (let pass = 0; pass < 12; pass++) {
    cam.position.copy(target).addScaledVector(dir, dist);
    cam.lookAt(target);
    cam.updateMatrixWorld(true);
    cam.updateProjectionMatrix();
    let b = Infinity, t = -Infinity;
    for (const q of pts) {
      _p.set(q[0], q[1], q[2]).project(cam);
      const sy = 1 - (_p.y + 1) / 2;
      b = Math.min(b, sy); t = Math.max(t, sy);
    }
    const cy = (b + t) / 2;
    if (Math.abs(cy - wantY) < 0.004) break;
    const halfH = dist * Math.tan((cam.fov * Math.PI) / 360);
    cam.matrixWorld.extractBasis(_x, _up, _z);
    target.addScaledVector(_up, -(cy - wantY) * 2 * halfH);
  }
  const position = target.clone().addScaledVector(dir, dist);
  return { position, target, dist };
}
function applyHomePose(snap) {
  homePose = (props.focus === 'training' && trainSlab && bags.length) ? trainingFraming() : homeFraming();
  controls.target.copy(homePose.target);
  // Коридор приближения — ДОЛЯ от стартового удаления, а не число, растянутое по
  // ширине плиты. Дома эти два способа совпадали: там стартовая поза и была
  // CAM.base. Здесь поза подбирается под композицию, и в вертикальном кадре она
  // уезжает дальше, чем CAM.maxDist * sc, — controls.update() тут же подтягивал
  // камеру обратно к потолку коридора, и планшет вылетал за левый край. Берём
  // домашние ПРОПОРЦИИ коридора (во сколько раз дома можно подъехать и отъехать
  // от стартовой точки) и прикладываем их к своему старту.
  const base = CAM.base.length();
  controls.minDistance = homePose.dist * (CAM.minDist / base);
  controls.maxDistance = homePose.dist * (CAM.maxDist / base);
  controls.minPolarAngle = CAM.polarMin;
  controls.maxPolarAngle = CAM.polarMax;
  controls.minAzimuthAngle = -Infinity;
  controls.maxAzimuthAngle = Infinity;
  if (snap) {
    camera.position.copy(homePose.position);
    controls.update();
  }
}
const _retPos = new THREE.Vector3(), _retTgt = new THREE.Vector3();
function idleReturn(dt) {
  if (!homePose || idleSince === null) return;
  if (!returning && (elapsed - idleSince) >= CAM.returnDelay) returning = true;
  if (!returning) return;
  const k = 1 - Math.exp(-CAM.returnLerp * dt);
  _retPos.copy(camera.position).lerp(homePose.position, k);
  _retTgt.copy(controls.target).lerp(homePose.target, k);
  camera.position.copy(_retPos);
  controls.target.copy(_retTgt);
  if (_retPos.distanceTo(homePose.position) < 0.02) { returning = false; idleSince = null; }
}

// ─────────────────── Кто бродит, кто у груши ───────────────────
function applyAssignments() {
  const n = roster.length;
  const want = Math.max(0, Math.min(props.training, n));
  for (let i = 0; i < n; i++) {
    const r = roster[i];
    const shouldTrain = i < want;
    if (shouldTrain && r.mode !== 'toBag' && r.mode !== 'atBag') sendToBag(r, i);
    if (!shouldTrain && (r.mode === 'toBag' || r.mode === 'atBag')) sendHome(r);
    // READY — выбранный стоит смирно лицом к игроку. Это не занятие: он просто
    // не ходит. Тело то же, режиссёр тот же, у него лишь снята приманка.
    if (!shouldTrain) r.mode = (props.ready && i === currentIdx) ? 'still' : (r.mode === 'home' ? 'home' : 'wander');
  }
}
/**
 * Походка на время перехода. Дорога между островами длинная — прогулочным шагом
 * боец идёт до груши полтора десятка секунд, и половину показа зал стоит пустым.
 * Поэтому на переход включается СУЩЕСТВУЮЩАЯ быстрая походка движка, а на месте
 * гасится. Переключатель у движка — триггер, поэтому состояние ведём сами:
 * дважды включить «быстро» значит выключить его.
 */
function setLoco(r, want) {
  if (r.loco === want) return;
  if (r.loco === 'fast') r.fighter.fast?.();
  if (want === 'fast') r.fighter.fast?.();
  r.loco = want;
}
function sendToBag(r, i) {
  const bag = bags[i % Math.max(1, bags.length)];
  if (!bag) return;
  r.bag = bag;
  r.mode = 'toBag';
  r.lureOn = true;
  r.lure.set(bag.x, slab.refs.topY, bag.z + TRAIN.standAhead);
  r.nextHit = elapsed + 0.6;
  setLoco(r, 'fast');
}
function sendHome(r) {
  r.mode = 'home';
  r.bag = null;
  r.lureOn = true;
  // Домой — в середину главного острова; дойдя, тело снова отдаётся режиссёру.
  r.lure.set(0, slab.refs.topY, 0);
  setLoco(r, 'fast');
}

// Один кадр жизни бойца: дойти, бить, вернуться, бродить.
function tickFighter(r, i, dt) {
  const g = r.fighter.group;
  if (r.mode === 'toBag' && r.bag) {
    const d = Math.hypot(g.position.x - r.lure.x, g.position.z - r.lure.z);
    if (d < 0.45) { r.mode = 'atBag'; r.lureOn = false; setLoco(r, null); }
  } else if (r.mode === 'atBag' && r.bag) {
    faceTo(g, r.bag.x, r.bag.z, dt);
    if (elapsed >= r.nextHit) {
      const mv = BAG_MOVES[(Math.random() * BAG_MOVES.length) | 0];
      r.fighter[mv]?.();
      // Груша получает толчок от бойца — наружу, по направлению удара.
      r.bag.hit(r.bag.x - g.position.x, r.bag.z - g.position.z, reduced);
      const [lo, hi] = TRAIN.hitEvery;
      r.nextHit = elapsed + lo + Math.random() * (hi - lo);
    }
  } else if (r.mode === 'home') {
    const d = Math.hypot(g.position.x - r.lure.x, g.position.z - r.lure.z);
    if (d < 1.2) { r.mode = 'wander'; r.lureOn = false; setLoco(r, null); }
  } else if (r.mode === 'still' || r.held) {
    faceTo(g, camera.position.x, camera.position.z, dt);
  }
  // Бродит — работает его собственный режиссёр (он же и доворачивает к камере).
  if (r.mode === 'wander' && !r.held) r.dir.update(elapsed, dt);
}

const _v2 = new THREE.Vector3();
function faceTo(g, x, z, dt) {
  const want = Math.atan2(x - g.position.x, z - g.position.z) + Math.PI;
  let d = ((want - g.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  g.rotation.y += d * (reduced ? 1 : 1 - Math.exp(-3.0 * dt));
}

/**
 * ЧТОБЫ НЕ ХОДИЛИ СКВОЗЬ ДРУГ ДРУГА. Режиссёры знают о соседях по `setObstacles`
 * — но это влияет только на ВЫБОР цели, а не на дорогу к ней. Поэтому здесь
 * короткий внешний расталкиватель: два тела ближе положенного — обоих чуть
 * разводит в стороны. Движок не правится, толкаем снаружи, как и всё прочее.
 */
const SEP = { dist: 1.05, push: 3.2 };
function separateBodies(dt) {
  for (let i = 0; i < roster.length; i++) {
    const a = roster[i].fighter; if (!a) continue;
    for (let j = i + 1; j < roster.length; j++) {
      const b = roster[j].fighter; if (!b) continue;
      const dx = b.group.position.x - a.group.position.x;
      const dz = b.group.position.z - a.group.position.z;
      const d = Math.hypot(dx, dz);
      if (d >= SEP.dist || d < 1e-4) continue;
      const push = (SEP.dist - d) * SEP.push * dt * 0.5;
      const nx = dx / d, nz = dz / d;
      a.group.position.x -= nx * push; a.group.position.z -= nz * push;
      b.group.position.x += nx * push; b.group.position.z += nz * push;
    }
  }
}

// ─────────────────── Нажатия ───────────────────
function pickAt(ev) {
  const el = wrap.value;
  const rect = el.getBoundingClientRect();
  pointerNdc.set(((ev.clientX - rect.left) / rect.width) * 2 - 1, -((ev.clientY - rect.top) / rect.height) * 2 + 1);
  raycaster.setFromCamera(pointerNdc, camera);
  for (const p of propList) {
    if (p.obj.hit.length && raycaster.intersectObjects(p.obj.hit, true).length) return { kind: 'prop', key: p.key };
  }
  // Сперва по широкой коробке — по ней палец попадает по движущемуся телу.
  const boxes = roster.filter((r) => r.pick).map((r) => r.pick);
  const hit = raycaster.intersectObjects(boxes, false)[0];
  if (hit) return { kind: 'fighter', index: roster.findIndex((r) => r.pick === hit.object) };
  return null;
}

// ─────────────────── Жизненный цикл ───────────────────
onMounted(() => {
  const el = wrap.value;
  const w = el.clientWidth || 390;
  const h = el.clientHeight || 700;

  mm = window.matchMedia('(prefers-reduced-motion: reduce)');
  reduced = mm.matches;
  onMM = () => { reduced = mm.matches; };
  mm.addEventListener ? mm.addEventListener('change', onMM) : mm.addListener(onMM);

  renderer = new THREE.WebGLRenderer({ canvas: canvasEl.value, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(FOG_COLOR, FOG.forge.density);
  camera = new THREE.PerspectiveCamera(FOV.forge, w / h, CAMERA.near, CAMERA.far.forge);

  const key = new THREE.DirectionalLight(LIGHTING.key.color, LIGHTING.key.intensity);
  key.position.set(...LIGHTING.key.position);
  scene.add(key);
  scene.add(new THREE.AmbientLight(LIGHTING.amb.color, LIGHTING.amb.intensity));
  scene.add(new THREE.HemisphereLight(LIGHTING.hemi.sky, LIGHTING.hemi.ground, LIGHTING.hemi.intensity));

  controls = new OrbitControls(camera, canvasEl.value);
  controls.enableDamping = true;
  controls.dampingFactor = CAM.damping;
  controls.enablePan = false;
  controls.addEventListener('start', () => { idleSince = null; returning = false; });
  controls.addEventListener('end', () => { idleSince = elapsed; });

  raycaster = new THREE.Raycaster();
  pointerNdc = new THREE.Vector2();
  let downAt = null;
  const onDown = (ev) => { downAt = { x: ev.clientX, y: ev.clientY }; };
  onPointerDown = (ev) => {
    // Тап, а не вращение: палец сдвинулся меньше, чем на 6 точек.
    if (!downAt || Math.hypot(ev.clientX - downAt.x, ev.clientY - downAt.y) > 6) { downAt = null; return; }
    downAt = null;
    const got = pickAt(ev);
    if (!got) return;
    if (got.kind === 'prop') emit('press', got.key);
    else if (got.index >= 0) {
      currentIdx = got.index;
      // Нажали по бойцу — он ОСТАНАВЛИВАЕТСЯ. Пока открыты статы, он стоит.
      roster.forEach((r, i) => { r.held = (i === got.index); });
      emit('pick-fighter', got.index);
    }
  };
  canvasEl.value.addEventListener('pointerdown', onDown);
  canvasEl.value.addEventListener('pointerup', onPointerDown);

  buildAll();

  clock = new THREE.Clock();
  const loop = () => {
    const dt = Math.min(0.05, clock.getDelta());
    elapsed += dt;

    idleReturn(dt);
    controls.update();
    lamps?.tick?.(elapsed);
    trainLamps?.tick?.(elapsed);

    // Соседи как препятствия — чтобы цели прогулок не назначались друг на друга.
    for (let i = 0; i < roster.length; i++) {
      const obs = [];
      for (let j = 0; j < roster.length; j++) {
        if (j === i || !roster[j].fighter) continue;
        const p = roster[j].fighter.group.position;
        obs.push({ x: p.x, z: p.z });
      }
      roster[i].dir.setObstacles(obs);
    }

    const glowK = reduced ? 1 : 1 - Math.exp(-CORE_LIGHT.lerp * dt);
    for (let i = 0; i < roster.length; i++) {
      const r = roster[i];
      if (!r.fighter) continue;
      tickFighter(r, i, dt);
      r.fighter.update(elapsed, camera);
      r.lit += ((i === currentIdx ? 1 : 0) - r.lit) * glowK;
      applyLight(r);
    }
    if (!reduced) separateBodies(dt);
    for (const b of bags) b.tick(dt, reduced);

    if (legendBody) {
      legendBody.group.visible = props.legend;
      if (props.legend) {
        legendBody.update(elapsed, camera);
        legendPresence?.tick(elapsed, dt);
        if (legendPresence) legendBody.group.position.copy(legendPresence.position);
      }
      if (legendPresence) {
        legendPresence.group.visible = props.legend;
        legendPresence.trail.visible = props.legend;
      }
    }
    legendAnchor?.setPresent(props.legend);
    legendAnchor?.tick(dt, elapsed);

    for (const p of propList) { p.obj.setPressed(props.pressed === p.key); p.obj.tick(dt); }

    // Статы лежат на плите ПОД остановленным бойцом и перед ним — поэтому едут
    // вместе с ним: он останавливается там, где его нажали.
    if (statsFloor) {
      const cur = roster[currentIdx];
      if (cur?.fighter) {
        const g = cur.fighter.group.position;
        const dx = camera.position.x - g.x, dz = camera.position.z - g.z;
        const L = Math.max(1e-3, Math.hypot(dx, dz));
        statsFloor.group.position.set(g.x + (dx / L) * 1.0, slab.refs.topY, g.z + (dz / L) * 1.0);
        statsFloor.group.rotation.y = Math.atan2(dx, dz);
      }
      statsFloor.setOpen(props.statsOpen);
      statsFloor.tick(dt, reduced);
    }

    renderer.render(scene, camera);
    if (props.showFps) {
      fpsAcc += dt; fpsFrames++;
      if (fpsAcc >= 0.5) { fps.value = Math.round(fpsFrames / fpsAcc); fpsAcc = 0; fpsFrames = 0; }
    }
  };
  renderer.setAnimationLoop(loop);

  onVisibility = () => {
    if (document.hidden) renderer.setAnimationLoop(null);
    else { clock.getDelta(); renderer.setAnimationLoop(loop); }
  };
  document.addEventListener('visibilitychange', onVisibility);

  resizeObserver = new ResizeObserver(() => {
    const cw = el.clientWidth, ch = el.clientHeight;
    if (!cw || !ch) return;
    camera.aspect = cw / ch;
    camera.updateProjectionMatrix();
    renderer.setSize(cw, ch, false);
    // Кадр сменил форму — поза пересчитывается. Угол обзора вертикальный: одна и
    // та же высота мира ложится то в 844 точки, то в 390, и без пересчёта после
    // поворота телефона зал становится вдвое мельче на ровном месте.
    if (slab) { applyHomePose(false); idleSince = elapsed - CAM.returnDelay; returning = true; }
  });
  resizeObserver.observe(el);

  onBeforeUnmount(() => {
    canvasEl.value?.removeEventListener('pointerdown', onDown);
  });
});

function teardown() {
  roster.forEach((r) => {
    r.dir?.dispose?.();
    r.pickOwn?.();
    if (r.fighter) { scene.remove(r.fighter.group); r.fighter.dispose(); }
  });
  roster = [];
  bags.forEach((b) => { scene.remove(b.group); b.dispose(); });
  bags = [];
  propList.forEach((p) => { scene.remove(p.obj.group); p.obj.dispose(); });
  propList = [];
  if (statsFloor) { scene.remove(statsFloor.group); statsFloor.dispose(); statsFloor = null; }
  if (legendAnchor) { scene.remove(legendAnchor.group); legendAnchor.dispose(); legendAnchor = null; }
  if (legendBody) { scene.remove(legendBody.group); legendBody.dispose(); legendBody = null; }
  if (legendPresence) { scene.remove(legendPresence.group); scene.remove(legendPresence.trail); legendPresence.dispose(); legendPresence = null; }
  if (lamps) { scene.remove(lamps.group); lamps.dispose(); lamps = null; }
  if (trainLamps) { scene.remove(trainLamps.group); trainLamps.dispose(); trainLamps = null; }
  if (slab) { scene.remove(slab.group); slab.dispose(); slab = null; }
  if (trainSlab) { scene.remove(trainSlab.group); trainSlab.dispose(); trainSlab = null; }
  if (backdrop) { scene.remove(backdrop.mesh); backdrop.dispose(); backdrop = null; }
}

watch(() => props.seats, () => { if (!scene) return; currentIdx = 0; teardown(); buildAll(); });
// Смена точки интереса — не рывок: камера едет туда тем же возвратом, каким
// возвращается после простоя.
watch(() => props.focus, () => { if (!scene || !slab) return; applyHomePose(false); idleSince = elapsed - CAM.returnDelay; returning = true; });
watch(() => [props.training, props.ready].join('|'), () => applyAssignments());
// Пока статы открыты — боец СТОИТ, закрыли — идёт дальше. Правило одно и то же
// и для нажатия по телу, и для переключателя страницы: иначе подпись ехала бы
// за уходящим бойцом.
watch(() => props.statsOpen, (on) => {
  roster.forEach((r, i) => { r.held = on && i === currentIdx; });
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  if (onVisibility) document.removeEventListener('visibilitychange', onVisibility);
  if (onPointerDown && canvasEl.value) canvasEl.value.removeEventListener('pointerup', onPointerDown);
  if (mm && onMM) (mm.removeEventListener ? mm.removeEventListener('change', onMM) : mm.removeListener(onMM));
  renderer?.setAnimationLoop(null);
  controls?.dispose();
  teardown();
  renderer?.dispose();
});
</script>

<style scoped>
.fm-wrap { position: relative; width: 100%; height: 100%; background: var(--void); overflow: hidden; touch-action: none; }
.fm-canvas { display: block; width: 100%; height: 100%; }
.fm-vignette { position: absolute; inset: 0; pointer-events: none; background: var(--scene-vignette); }
.fm-fps {
  position: absolute; right: var(--sp-2); top: var(--sp-2);
  font-family: var(--font-mono); font-size: var(--t-xs); color: var(--ink-dim);
  background: rgba(0, 0, 0, 0.4); padding: 2px 6px;
}
</style>
