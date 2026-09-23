<!-- ForgeMockScene — ЗАЛ FORGE В НОВОМ ВИДЕ, макет. Часть скрытой страницы
     /dev/forge (ТЗ 23.09.2026). НИЧЕГО НЕ ВСТРАИВАЕТ: настоящий зал — это
     PveScene.vue + ForgePanel.vue, и они здесь не правятся и не читаются.

     Своя сцена, своими копиями, по рецепту hexlash-3d: свой рендер, своя
     камера, свой свет. Строительные кирпичи зала ВЫЗЫВАЮТСЯ, а не правятся:
     плита (forgeSlab), лампы (hallLamps), купол (hallBackdrop), тела
     (buildFighter), режиссёр прогулок и занятий (forgeWander), облако легенды
     (legendPresence) — ровно те же, что несёт настоящий зал, поэтому макет
     показывает зал, а не его похожий макет.

     ЧТО ЗДЕСЬ НОВОГО. Панелей нет. Ростер, объект прокачки, SHOP и кабинет,
     полка баффов и место легенды — ПРЕДМЕТЫ на плите (forgeProps.js). Статы
     бойца — табло, поднимающееся перед ним по нажатию на само тело.

     ТЕСНОТА ВЕРТИКАЛЬНОГО КАДРА (ответ на §4 ТЗ). В портрете зал держит одно
     тело — так устроен и настоящий зал, и это не обходится: десять тел на
     телефоне не тянет. Предметы поэтому встают НА ПЕРЕДНИЙ ПЛАН, к ближней
     кромке плиты, низкой полосой под бойцом; боец стоит за ними и выше по
     кадру. Ровно ту полосу экрана сегодня занимает панель — предметы её и
     занимают, только в объёме. Камера в портрете кадрирует эту пару
     (боец + полоса предметов) целиком, а не одного бойца.

     Дисциплина: тёмная комната; одно тёплое облако легенды; ядро выбранного
     бойца; розовое — только в момент нажатия на предмет. Ни одной цифры.
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
import { buildBackdrop } from './hallBackdrop.js';
import { LAMPS as HALL_LAMPS, buildLamps } from './hallLamps.js';
import { buildForgeSlab } from './forgeSlab.js';
import { buildFighter } from './buildFighter.js';
import { resolveBehavior } from '@/data/behavior.js';
import { createForgeWanderDirector } from './forgeWander.js';
import { createLegendPresence } from './legendPresence.js';
import {
  FORGE_PROPS, buildRoster, buildUpgrade, buildZoneMark,
  buildStatsFloor, buildLegendAnchor, buildBuffShelf,
} from './forgeProps.js';
import { CORE_HUE, AMBER, LIGHTING, FOG_COLOR, FOG, FOV, CAMERA, BACKDROP } from '@/data/sceneTokens.js';

const props = defineProps({
  /** Сколько МЕСТ на плите — 4 / 7 / 10 (три её ступени). Разметка зон рисуется
   *  на все места, занятые они или нет. */
  seats: { type: Number, default: 4 },
  /** Сколько мест реально занято бойцами (≤ seats) — чтобы было видно пустые. */
  count: { type: Number, default: 4 },
  /** Раскладка макета: 'portrait' | 'landscape'. Задаётся страницей, а не окном. */
  layout: { type: String, default: 'portrait' },
  /** Состояния показа. */
  legend: { type: Boolean, default: false },
  statsOpen: { type: Boolean, default: false },
  pressed: { type: String, default: null },   // 'roster' | 'upgrade' | null
  showFps: { type: Boolean, default: false },
  /** Состояние тренировки выбранного бойца: 'free' | 'busy' | 'ready'. */
  trainState: { type: String, default: 'free' },
});
const emit = defineEmits(['press', 'pick-fighter']);

// ───────────────────────────── НАСТРОЙКИ ─────────────────────────────
// Всё, что подбирается глазами. Цветов здесь нет — только геометрия и время.
const SLAB = { steps: [4, 7, 10], aspect: 1.5, edge: 0.8, height: 1.0 };
const ARC = { step: 1.4, radius: 16 };
// ЗОНА БОЙЦА — участок, по которому он ходит И который теперь размечен на полу
// (правка v2). Поперёк дуги зона расширена с 0.15 до 0.28: щель 0.30 шириной
// разметкой не читается. Предел здесь жёсткий и считается, а не подбирается:
// соседние тела не должны налезать друг на друга, то есть
// ARC.step − 2·halfX должно оставаться шире тела (0.80). При 0.28 остаётся
// 0.84 — тело проходит, и запас нулевой. Шире 0.28 делать нельзя.
const ZONE = { halfX: 0.28, halfZ: 0.70 };
const BODY = { halfW: 0.40, height: 1.95 };
const MARK = { ahead: 2.9 };
// Досягаемость четырёх ламп — для САМОЙ МАЛЕНЬКОЙ плиты; на больших те же
// четыре светят дальше (см. сборку ламп ниже).
const LAMP = { intensity: 30, distance: 26, hangLift: 1.2 };

// ПОЛОСА ПРЕДМЕТОВ. Предметы стоят ОДНОЙ линией у ближней кромки плиты, перед
// всем остальным. В ширину они раскладываются равномерно, в глубину — на одной
// линии: полоса должна читаться полосой, а не россыпью.
const RAIL = {
  // Предметов осталось ТРИ (правка v2: SHOP и кабинет вернулись в плоские
  // кнопки). Освободившееся место отдано бойцу и разметке зон, а не растянуто
  // между оставшимися: растянуть их значило бы снова отогнать камеру.
  inset: 0.85,
  spanLandscape: 0.56,          // доля ширины плиты, на которую расходится полоса

  // ПОРТРЕТ. Два предмета, к которым ходят, стоят перед бойцом; полка баффов —
  // задел, к ней не ходят — уходит за него. Пролёт переднего ряда стал уже
  // (было 3.2 на три предмета), поэтому камера подошла ближе и боец крупнее.
  portraitSpan: 2.05,           // разнос переднего ряда, единиц мира
  portraitAhead: 1.95,          // на сколько передний ряд стоит ПЕРЕД меткой бойца
  portraitBackZ: 1.45,          // насколько полка ГЛУБЖЕ метки бойца
  portraitBackOut: 1.5,         // и насколько она уведена вбок от центра
};

// Камера. Фронтальная и фиксированная, как в настоящем зале: это мастерская.
const CAM = {
  dir: [0, 3.5, 9.0],
  rect: {
    // В портрете композиция — боец И полоса предметов под ним. Кадр отдан ей
    // почти целиком: в комнате больше ничего нет.
    // Вертикальный кадр НАМЕРЕННО смещён вниз. Композиция (боец + полоса
    // предметов) шире, чем высока, а кадр телефона — наоборот, и подгонка по
    // ширине оставляет вертикальный запас. Прижав композицию к низу, мы отдаём
    // этот запас потолку зала: лампы, воздух и место легенды над плитой. Иначе
    // столько же пустоты оставалось бы ПОД плитой, где нет ничего.
    portrait: { x0: 0.07, x1: 0.93, y0: 0.34, y1: 0.98 },
    landscape: { x0: 0.05, x1: 0.95, y0: 0.10, y1: 0.92 },
  },
  minDist: 4.5,
  maxDist: 90,
};

const LEGEND = { height: 4.7, driftSpeed: 0.5, driftRadius: 0.7, bobAmplitude: 0.18, hazeDensity: 90 };
const CORE_LIGHT = { rest: 0.05, lerp: 7.0 };
// Где проступают статы: НА ПОЛУ, перед бойцом, на продолжении его места.
// Ни высоты, ни наклона здесь нет — это надпись на плите (правка v2).
const STATS = { ahead: 1.02 };
const CORE_PALETTE = [
  { id: 'natisk', hue: CORE_HUE.natisk },
  { id: 'nalet', hue: CORE_HUE.nalet },
  { id: 'skala', hue: CORE_HUE.skala },
  { id: 'zasada', hue: CORE_HUE.zasada },
];
// Имена осей для табло статов — СЛОВА, не числа (ТЗ §3.4).
const AXIS_NAMES = ['DISTANCE', 'TEMPO', 'WEIGHT', 'SLIP', 'COUNTER', 'INITIATIVE', 'RESILIENCE'];

const wrap = ref(null);
const canvasEl = ref(null);
const fps = ref(null);

let renderer, scene, camera, clock;
let slab = null, backdrop = null, lamps = null;
let director = null;
let legendBody = null, legendPresence = null, legendAnchor = null;
let statsFloor = null;
let zoneList = [];          // разметка мест на плите
let markZone = null;        // рабочее место перед строем
let propList = [];            // { key, obj }
let roster = [];              // { id, core, home, fighter, glow, parts, skin, lit }
let compose = null, mark = { x: 0, z: 0 };
let reduced = false, mm = null, onMM = null;
let resizeObserver = null, onVisibility = null;
let raycaster = null, pointerNdc = null, onPointerDown = null;
let fpsAcc = 0, fpsFrames = 0;
let currentIdx = 0;
let elapsed = 0;

// ─────────────────── Геометрия зала (тот же вывод, что в настоящем) ───────────────────
const halfAngle = (n) => (n <= 1 ? 0 : (ARC.step * (n - 1)) / 2 / ARC.radius);
const arcHalfWidth = (n) => ARC.radius * Math.sin(halfAngle(n));
const arcBow = (n) => ARC.radius * (1 - Math.cos(halfAngle(n)));
const stepFor = (n) => SLAB.steps.find((s) => n <= s) ?? SLAB.steps[SLAB.steps.length - 1];

function composeFor(count) {
  const max = stepFor(count);
  const needW = 2 * (arcHalfWidth(max) + BODY.halfW + ZONE.halfX + SLAB.edge);
  const depth = (ZONE.halfZ + arcBow(max)) + MARK.ahead + ZONE.halfZ + 2 * SLAB.edge + RAIL.inset;
  const width = Math.max(needW, depth * SLAB.aspect);
  const slabDepth = width / SLAB.aspect;
  // Композиция стоит так, чтобы за рядом и перед полосой оставалось поровну.
  const arcZ = -slabDepth / 2 + SLAB.edge + ZONE.halfZ + arcBow(max);
  const markZ = arcZ + MARK.ahead;
  return { slab: { width, depth: slabDepth }, arcZ, markZ, max };
}

function spotFor(i, n, c) {
  if (n <= 1) return { x: 0, z: c.arcZ };
  const a = -halfAngle(n) + (ARC.step * i) / ARC.radius;
  return { x: ARC.radius * Math.sin(a), z: c.arcZ - ARC.radius * (1 - Math.cos(a)) };
}

// ─────────────────── Камера: подогнать под то, что на полу ───────────────────
const _fitDir = new THREE.Vector3();
const _v = new THREE.Vector3();
const _right = new THREE.Vector3();
const _up = new THREE.Vector3();
function fitCamera() {
  if (!camera || !slab) return;
  const portrait = props.layout === 'portrait';
  const r = portrait ? CAM.rect.portrait : CAM.rect.landscape;
  const topY = slab.refs.topY;

  // Что обязано попасть в кадр. Меряем по СТОЯНКАМ и предметам, а не по тому,
  // где тела оказались в этом кадре: все всё время куда-то едут, и кадр,
  // измеренный по живым позициям, дышал бы вместе с ними.
  const pts = [];
  const body = (x, z, padX, padZ) => {
    pts.push([x - BODY.halfW - padX, topY, z + padZ], [x + BODY.halfW + padX, topY + BODY.height, z - padZ]);
  };
  if (portrait) {
    body(mark.x, mark.z, 0.32, 0.25);
  } else {
    // Все места ступени, занятые и пустые: разметка — часть композиции, и
    // пустое место обязано попадать в кадр так же, как занятое.
    for (let i = 0; i < props.seats; i++) {
      const at = spotFor(i, props.seats, compose);
      body(at.x, at.z, ZONE.halfX, ZONE.halfZ);
    }
    body(mark.x, mark.z, 0.25, 0.25);
    if (props.legend) {
      const feet = topY + LEGEND.height;
      pts.push([-LEGEND.driftRadius - 0.9, feet - 0.6, 0], [LEGEND.driftRadius + 0.9, feet + 2.2, 0]);
    }
  }
  // Полоса предметов — часть композиции в обеих раскладках.
  // Предметы берутся с запасом: у наковальни рог уходит вбок за её же коробку,
  // и без запаса она упиралась в кромку кадра.
  for (const p of propList) {
    const g = p.obj.group.position;
    pts.push([g.x - 0.95, topY, g.z + 0.70], [g.x + 0.95, topY + 1.85, g.z - 0.70]);
  }

  _fitDir.set(CAM.dir[0], CAM.dir[1], CAM.dir[2]).normalize();
  // Точка прицела — середина того, что надо показать. Начинаем с неё, дальше
  // только уточняем: так подгонка сходится, а не блуждает.
  const bb = new THREE.Box3();
  for (const p of pts) bb.expandByPoint(_v.set(p[0], p[1], p[2]));
  const look = bb.getCenter(new THREE.Vector3());
  let dist = Math.max(CAM.minDist, bb.getSize(_v).length() * 0.9);

  const place = () => {
    camera.position.copy(look).addScaledVector(_fitDir, dist);
    camera.lookAt(look);
    camera.updateMatrixWorld(true);
    camera.updateProjectionMatrix();
  };
  const measure = () => {
    let l = Infinity, rr = -Infinity, b = Infinity, tp = -Infinity;
    for (const p of pts) {
      _v.set(p[0], p[1], p[2]).project(camera);
      const sx = (_v.x + 1) / 2, sy = 1 - (_v.y + 1) / 2;
      l = Math.min(l, sx); rr = Math.max(rr, sx);
      b = Math.min(b, sy); tp = Math.max(tp, sy);
    }
    return { l, r: rr, b, t: tp };
  };

  // Два дела по очереди: масштаб (отъехать/подъехать) и центровка (сдвинуть
  // точку прицела вбок и по высоте). Центровка считается через настоящие оси
  // камеры, а не через угаданный коэффициент, — иначе она не сходится.
  for (let pass = 0; pass < 20; pass++) {
    place();
    const m = measure();
    const k = Math.max((m.r - m.l) / (r.x1 - r.x0), (m.t - m.b) / (r.y1 - r.y0));
    dist = Math.min(CAM.maxDist, Math.max(CAM.minDist, dist * k));
    place();
    const m2 = measure();
    const cx = (m2.l + m2.r) / 2, cy = (m2.b + m2.t) / 2;
    const wantX = (r.x0 + r.x1) / 2, wantY = (r.y0 + r.y1) / 2;
    const halfH = dist * Math.tan((camera.fov * Math.PI) / 360);
    const halfW = halfH * camera.aspect;
    camera.matrixWorld.extractBasis(_right, _up, _v);
    look.addScaledVector(_right, (cx - wantX) * 2 * halfW);
    look.addScaledVector(_up, -(cy - wantY) * 2 * halfH);
    if (Math.abs(k - 1) < 0.004 && Math.abs(cx - wantX) < 0.004 && Math.abs(cy - wantY) < 0.004) break;
  }
  place();
}

// ─────────────────── Ядро бойца: яркость пишется СНАРУЖИ ───────────────────
function coreParts(f) {
  let gem = null, halo = null;
  f.group.traverse((o) => {
    if (!o.isMesh || !o.material) return;
    if (!gem && o.material.emissive !== undefined && o.material.emissiveIntensity > 0.8) gem = o;
    if (!halo && o.material.blending === THREE.AdditiveBlending && o.material.transparent) halo = o;
  });
  return {
    gem, halo,
    gemBase: gem ? gem.material.color.clone() : null,
    haloBase: halo ? halo.material.opacity : 0,
  };
}
function applyLight(r) {
  const k = CORE_LIGHT.rest + (1 - CORE_LIGHT.rest) * r.lit;
  if (r.parts.gem && r.parts.gemBase) r.parts.gem.material.color.copy(r.parts.gemBase).multiplyScalar(k);
  if (r.parts.halo) r.parts.halo.material.opacity = r.parts.haloBase * k;
}

// ─────────────────── Сборка ───────────────────
function buildRosterBodies() {
  const portrait = props.layout === 'portrait';
  const topY = slab.refs.topY;
  // Места считаются по СТУПЕНИ, а тела ставятся только на занятые: так пустое
  // место остаётся на своём месте в строю, а не схлопывается.
  const n = props.seats;
  for (let i = 0; i < Math.min(props.count, n); i++) {
    const core = CORE_PALETTE[i % CORE_PALETTE.length];
    const home = spotFor(i, n, compose);
    // В ПОРТРЕТЕ СТРОИТСЯ ОДНО ТЕЛО. Это не упрощение макета — так устроен и
    // настоящий зал: десять тел на телефоне не тянет (см. шапку).
    const wanted = !portrait || i === currentIdx;
    let fighter = null, parts = null, skin = null, glow = null;
    const r = { id: `f${i}`, seat: i, core, home, fighter: null, parts: null, skin: null, glow: null, agent: -1, mode: 'wander', lit: i === currentIdx ? 1 : 0 };
    if (wanted) {
      fighter = buildFighter(core.hue, {
        side: 'player', coreId: core.id, behavior: resolveBehavior(core.id, []),
        // ⚠️ bounds — это ПЛИТА, а не личная зона. Тело держат на плите, чтобы
        // оно не ушло за кромку; по зоне его водит режиссёр. В v1 сюда были
        // переданы размеры зоны — и все тела зажало в коробку у центра плиты.
        // Ровно это владелец и увидел как «бойцы просто стоят в куче»: они не
        // слипались перспективой, их физически сводило в одну точку.
        bounds: { x: compose.slab.width / 2, z: compose.slab.depth / 2 },
        // Приманка режиссёра. Ходит тело САМО, своими ногами: режиссёр двигает
        // только точку, за которой оно идёт (тот же приём, что в настоящем зале
        // — ни одной правки в защищённых файлах). Режиссёр собирается ПОЗЖЕ
        // этих тел, поэтому читается он здесь лениво, каждый кадр.
        getFoePos: () => (director && r.agent >= 0 ? director.foePos(r.agent) : null),
      });
      fighter.setReducedMotion(reduced);
      fighter.group.children.forEach((o) => { if (o.isSprite) o.visible = false; });  // без плашки HP
      const at = (portrait || i === currentIdx) ? mark : home;
      fighter.group.position.set(at.x, topY, at.z);
      scene.add(fighter.group);
      parts = coreParts(fighter);
      skin = fighter;
    }
    // agent — номер тела У РЕЖИССЁРА. В портрете тело всего одно, и его номер
    // в ростере не совпадает с номером у режиссёра; без этой пары переключатель
    // состояний двигал бы не того (в портрете — никого).
    Object.assign(r, { fighter, parts, skin, glow });
    roster.push(r);
  }
}

function placeProps() {
  const portrait = props.layout === 'portrait';
  const topY = slab.refs.topY;
  const builders = {
    roster: () => buildRoster(),
    upgrade: () => buildUpgrade(),
    shelf: () => buildBuffShelf(),
  };

  // Раскладка полосы — единственное, чем две ориентации отличаются.
  let spots;
  if (portrait) {
    const S = RAIL.portraitSpan;
    const zNear = Math.min(compose.slab.depth / 2 - 0.35, mark.z + RAIL.portraitAhead);
    spots = [
      { key: 'roster', x: -S / 2, z: zNear },
      { key: 'upgrade', x: S / 2, z: zNear },
      // Полка баффов — задел, к ней не ходят: уводится за бойца и вбок.
      { key: 'shelf', x: -RAIL.portraitBackOut, z: mark.z - RAIL.portraitBackZ },
    ];
  } else {
    const span = compose.slab.width * RAIL.spanLandscape;
    const z = compose.slab.depth / 2 - RAIL.inset;
    // Середина пролёта пустая — это окно на ряд бойцов.
    spots = [
      { key: 'roster', x: -span * 0.50, z },
      { key: 'shelf', x: -span * 0.18, z },
      { key: 'upgrade', x: span * 0.50, z },
    ];
  }

  for (const sp of spots) {
    const obj = builders[sp.key]();
    obj.group.position.set(sp.x, topY, sp.z);
    scene.add(obj.group);
    propList.push({ key: sp.key, obj });
  }
}

/**
 * РАЗМЕТКА МЕСТ. Рисуется на ВСЕ места ступени, а не только на занятые: пустое
 * место обязано читаться местом, иначе разметка превращается в подсветку тех,
 * кто и так виден. Плюс отдельная ячейка на метке — рабочее место того, кого
 * сейчас открыли; на неё же ложатся статы.
 */
function placeZones() {
  const topY = slab.refs.topY;
  const n = props.seats;
  for (let i = 0; i < n; i++) {
    const at = spotFor(i, n, compose);
    const z = buildZoneMark(ZONE.halfX, ZONE.halfZ);
    z.group.position.set(at.x, topY, at.z);
    scene.add(z.group);
    zoneList.push({ seat: i, mark: z });
  }
  // Рабочее место перед строем. Чуть шире зоны в строю — на нём работают, а не
  // ждут, и статы разворачиваются именно отсюда.
  markZone = buildZoneMark(ZONE.halfX * 1.5, ZONE.halfZ * 0.8);
  markZone.group.position.set(mark.x, topY, mark.z);
  scene.add(markZone.group);
}

function buildLegend() {
  const topY = slab.refs.topY;
  legendAnchor = buildLegendAnchor();
  // Якорь стоит РОВНО там, где висела бы легенда, — это её место, а не метка
  // над ним. Когда она есть, якорь не показывается вовсе (setPresent).
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
    ORBIT: { highAboveTop: LEGEND.height },
    reduced,
  });
  legendBody.group.position.copy(legendPresence.position);
  scene.add(legendPresence.group);
  scene.add(legendPresence.trail);   // след снижения — мировые частицы, отдельной группой
}

function buildAll() {
  compose = composeFor(props.seats);
  mark = { x: 0, z: compose.markZ };

  slab = buildForgeSlab({ width: compose.slab.width, depth: compose.slab.depth, height: SLAB.height });
  // Разлом плиты в зале ПОДАВЛЕН снаружи — тот же приём, что у дома: зал не бой.
  slab.group.traverse((o) => {
    if (o.isLine) o.visible = false;
    if (o.isMesh && o.material && o.material.blending === THREE.AdditiveBlending) o.material.opacity = 0;
  });
  scene.add(slab.group);

  const topY = slab.refs.topY;
  // Четыре лампы — не больше (правило зала). Плита растёт ступенями, поэтому
  // те же четыре РАЗНОСЯТСЯ к концам дуги и к метке и светят дальше: сила по
  // квадрату роста плиты, радиус — по самому росту, что ровно и стоит удержать
  // одну яркость пола при затухании 1/r². Числа и приём — из настоящего зала.
  const base = composeFor(SLAB.steps[0]).slab.width;
  const k = Math.max(1, compose.slab.width / base);
  // Две лампы строя стоят над КОНЦАМИ дуги, а не в 0.8 от них. Разница видна
  // только на десяти местах — и там она решает: при 0.8 крайние бойцы стоят
  // ЗА последней лампой, и на снимке от них остаётся силуэт темнее пола.
  // Ламп по-прежнему четыре: их разносят, а не добавляют.
  const endX = arcHalfWidth(compose.max);
  lamps = buildLamps({
    ...HALL_LAMPS, hangLift: LAMP.hangLift,
    light: { ...HALL_LAMPS.light, intensity: LAMP.intensity * k * k, distance: LAMP.distance * k },
    positions: [
      { x: -endX, z: compose.arcZ - 0.4, drop: 0.0 },
      { x: endX, z: compose.arcZ - 0.4, drop: 0.7 },
      { x: -ARC.step * 1.2, z: mark.z, drop: 0.3 },
      { x: ARC.step * 1.35, z: mark.z, drop: 1.0 },
    ],
  }, reduced);
  scene.add(lamps.group);

  backdrop = buildBackdrop({ radius: BACKDROP.radius.forge, centerY: BACKDROP.centerY });
  scene.add(backdrop.mesh);

  buildRosterBodies();
  placeZones();
  placeProps();
  buildLegend();

  statsFloor = buildStatsFloor(AXIS_NAMES);
  scene.add(statsFloor.group);
  positionStats();

  // Режиссёр есть В ОБЕИХ раскладках. Он и есть то, чем видно состояние бойца:
  // свободен — строллит, занят — гоняет движения на месте, готов — стоит смирно.
  // Раньше его не было в портрете, и переключатель состояний на телефоне не
  // делал ничего — а принимают макет именно на телефоне.
  director = createForgeWanderDirector();
  const bodies = [];
  for (const r of roster) {
    if (!r.fighter) continue;
    r.agent = bodies.length;
    // В портрете тело стоит на метке, и его зона — вокруг метки: гулять по
    // чужому месту в пустой комнате оно не должно.
    const c = props.layout === 'portrait' ? mark : r.home;
    bodies.push({
      fighter: r.fighter,
      zone: { xMin: c.x - ZONE.halfX, xMax: c.x + ZONE.halfX, zMin: c.z - ZONE.halfZ, zMax: c.z + ZONE.halfZ },
    });
  }
  director.attach(bodies, { reduced });
  applyTraining();
  // Выбранный выходит на метку — ногами, как в настоящем зале.
  const cur = roster[currentIdx];
  if (!reduced && props.layout !== 'portrait' && cur && cur.agent >= 0) director.sendTo(cur.agent, mark.x, mark.z);
  fitCamera();
}

function positionStats() {
  if (!statsFloor || !slab) return;
  // На полу, перед бойцом, на продолжении его рабочего места. Ни высоты, ни
  // наклона: это надпись на плите. Поднятое табло отъедало высоту кадра —
  // самое дефицитное, что есть в вертикальном телефоне.
  statsFloor.group.position.set(mark.x, slab.refs.topY, mark.z + STATS.ahead);
}

function applyTraining() {
  if (!director) return;
  roster.forEach((r, i) => {
    if (!r.fighter || r.agent < 0) return;
    // Показываем три состояния сразу: выбранный несёт то, что выставлено
    // переключателем, соседи живут своей жизнью — так их видно рядом.
    const mode = i === currentIdx
      ? (props.trainState === 'busy' ? 'drill' : props.trainState === 'ready' ? 'still' : 'wander')
      : (i % 3 === 1 ? 'drill' : i % 3 === 2 ? 'still' : 'wander');
    r.mode = mode;                 // разметка зоны смотрит сюда же
    director.setMode(r.agent, mode);
  });
}

function teardown() {
  director?.dispose?.();
  director = null;
  roster.forEach((r) => { r.fighter?.dispose(); if (r.fighter) scene.remove(r.fighter.group); });
  roster = [];
  propList.forEach((p) => { scene.remove(p.obj.group); p.obj.dispose(); });
  propList = [];
  if (statsFloor) { scene.remove(statsFloor.group); statsFloor.dispose(); statsFloor = null; }
  zoneList.forEach((z) => { scene.remove(z.mark.group); z.mark.dispose(); });
  zoneList = [];
  if (markZone) { scene.remove(markZone.group); markZone.dispose(); markZone = null; }
  if (legendAnchor) { scene.remove(legendAnchor.group); legendAnchor.dispose(); legendAnchor = null; }
  if (legendBody) { scene.remove(legendBody.group); legendBody.dispose(); legendBody = null; }
  if (legendPresence) { scene.remove(legendPresence.group); scene.remove(legendPresence.trail); legendPresence.dispose(); legendPresence = null; }
  if (lamps) { scene.remove(lamps.group); lamps.dispose(); lamps = null; }
  if (slab) { scene.remove(slab.group); slab.dispose(); slab = null; }
  if (backdrop) { scene.remove(backdrop.mesh); backdrop.dispose(); backdrop = null; }
}

function rebuild() {
  if (!scene) return;
  currentIdx = Math.min(currentIdx, Math.max(0, props.count - 1));
  teardown();
  buildAll();
}

// ─────────────────── Нажатия по предметам и по бойцу ───────────────────
function pickAt(ev) {
  const el = wrap.value;
  const rect = el.getBoundingClientRect();
  pointerNdc.set(((ev.clientX - rect.left) / rect.width) * 2 - 1, -((ev.clientY - rect.top) / rect.height) * 2 + 1);
  raycaster.setFromCamera(pointerNdc, camera);
  for (const p of propList) {
    if (p.obj.hit.length && raycaster.intersectObjects(p.obj.hit, true).length) return { kind: 'prop', key: p.key };
  }
  for (let i = 0; i < roster.length; i++) {
    const f = roster[i].fighter;
    if (f && raycaster.intersectObject(f.group, true).length) return { kind: 'fighter', index: i };
  }
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

  scene.add(new THREE.DirectionalLight(LIGHTING.key.color, LIGHTING.key.intensity)
    .translateX(LIGHTING.key.position[0]).translateY(LIGHTING.key.position[1]).translateZ(LIGHTING.key.position[2]));
  scene.add(new THREE.AmbientLight(LIGHTING.amb.color, LIGHTING.amb.intensity));
  scene.add(new THREE.HemisphereLight(LIGHTING.hemi.sky, LIGHTING.hemi.ground, LIGHTING.hemi.intensity));

  raycaster = new THREE.Raycaster();
  pointerNdc = new THREE.Vector2();
  onPointerDown = (ev) => {
    const got = pickAt(ev);
    if (!got) return;
    if (got.kind === 'prop') emit('press', got.key);
    else { currentIdx = got.index; emit('pick-fighter', got.index); applyTraining(); }
  };
  canvasEl.value.addEventListener('pointerdown', onPointerDown);

  buildAll();

  clock = new THREE.Clock();
  const loop = () => {
    const dt = Math.min(0.05, clock.getDelta());
    elapsed += dt;

    if (!reduced) director?.update(elapsed, dt);   // двигает приманки; ходят тела сами
    lamps?.tick?.(elapsed);

    const glowK = reduced ? 1 : 1 - Math.exp(-CORE_LIGHT.lerp * dt);
    for (let i = 0; i < roster.length; i++) {
      const r = roster[i];
      if (!r.fighter) continue;
      r.fighter.update(elapsed, camera);
      // Стоящее тело развёрнуто к игроку — зал фронтальный.
      if (!director || r.agent < 0 || director.isStill(r.agent)) {
        const g = r.fighter.group;
        const want = Math.atan2(camera.position.x - g.position.x, camera.position.z - g.position.z) + Math.PI;
        let d = ((want - g.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        g.rotation.y += d * (reduced ? 1 : 1 - Math.exp(-2.2 * dt));
      }
      r.lit += ((i === currentIdx ? 1 : 0) - r.lit) * glowK;
      applyLight(r);
    }

    // Легенда — тело едет на дрейфе облака; когда её нет, и тела нет.
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
    statsFloor?.setOpen(props.statsOpen);
    statsFloor?.tick(dt, reduced);

    // Черта зоны заметнее, пока в ней ЗАНИМАЮТСЯ — ровно то, что происходит в
    // игре: занятие идёт внутри своей зоны. Свечения тут нет и быть не может.
    for (const z of zoneList) {
      const r = roster.find((x) => x.seat === z.seat);
      // Место в строю: черта заметнее, пока в нём занимаются. Выбранный боец
      // стоит не в строю, а на рабочем месте впереди — его зона ниже.
      z.mark.setBusy(!!r && !!r.fighter && z.seat !== currentIdx && r.mode === 'drill');
      z.mark.tick(dt);
    }
    if (markZone) {
      const cur = roster[currentIdx];
      markZone.setBusy(!!cur && cur.mode === 'drill');
      markZone.tick(dt);
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
    fitCamera();
  });
  resizeObserver.observe(el);
});

watch(() => [props.seats, props.count, props.layout].join('|'), () => rebuild());
watch(() => props.trainState, () => applyTraining());
watch(() => props.statsOpen, () => positionStats());

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  if (onVisibility) document.removeEventListener('visibilitychange', onVisibility);
  if (onPointerDown && canvasEl.value) canvasEl.value.removeEventListener('pointerdown', onPointerDown);
  if (mm && onMM) (mm.removeEventListener ? mm.removeEventListener('change', onMM) : mm.removeListener(onMM));
  renderer?.setAnimationLoop(null);
  teardown();
  renderer?.dispose();
});

defineExpose({ pickFighter: (i) => { currentIdx = i; applyTraining(); } });
</script>

<style scoped>
.fm-wrap { position: relative; width: 100%; height: 100%; background: var(--void); overflow: hidden; }
.fm-canvas { display: block; width: 100%; height: 100%; }
.fm-vignette { position: absolute; inset: 0; pointer-events: none; background: var(--scene-vignette); }
.fm-fps {
  position: absolute; right: var(--sp-2); top: var(--sp-2);
  font-family: var(--font-mono); font-size: var(--t-xs); color: var(--ink-dim);
  background: rgba(0, 0, 0, 0.4); padding: 2px 6px;
}
</style>
