<!-- SparScene — сцена экрана SPAR (/play/spar). Заведена макетом (ТЗ 24.09.2026
     v2), в игру встроена ТЗ 24.09.2026 v3: служебного адреса /dev/spar больше нет.
     ДВОЕ ДРУГ ПРОТИВ ДРУГА: слева боец игрока, справа собираемый соперник.

     Своя сцена своими копиями, по рецепту hexlash-3d: свой рендер, своя камера,
     свой свет, свой пол. Защищённого не задевает ничего — buildFighter
     ВЫЗЫВАЕТСЯ, а не правится, ровно как это уже делают BuffsPreviewScene
     (/dev/buffs) и FighterLabScene (/dev/lab).

     ⚠️ КАМЕРА НЕПОДВИЖНА. Ни орбиты, ни зума, ни ведения: на этом экране
     управление живёт в панели, а сцена только показывает. Холст не слушает
     указатель вовсе — палец, опущенный на сцену, уходит странице (ей он нужен:
     нажатие мимо панели её закрывает).

     ⚠️ ФИГУРЫ НЕ ДЕРУТСЯ. Обоим отдан живой `getFoePos` — он нужен, чтобы они
     стояли ЛИЦОМ друг к другу, — но мозг выключен (setAI(false)), поэтому никто
     никуда не идёт и никого не бьёт. Бой на этой странице не запускается.

     ⚠️ ЧТО ВИДНО ПРИ СМЕНЕ СБОРКИ, а что нет — замерено, см. §3 отчёта:
       · ЯДРО — видно полностью: цвет тела-ядра и его ореол. Фигура строится
         заново из нового ядра.
       · КРИСТАЛЛЫ — на СТОЯЩЕЙ фигуре не видны ничем. Они меняют оси, оси
         меняют МАНЕРУ (шаг, темп, дистанцию), а манера живёт в навигации, до
         которой планка без мозга не доходит: `navigate` есть только в ветке
         `ai.on`, и без неё тело отдаёт ровный `idlePose`, одинаковый для любой
         сборки. Своего значка «тут горит кристалл» здесь НЕ заводится — это
         был бы выдуманный язык поверх настоящего.
     Поэтому сборка соперника показана там, где она и читается: на самой
     «Печати» в панели — наливом граней и именами кристаллов. -->
<template>
  <div ref="wrap" class="sps-wrap">
    <canvas ref="canvasEl" class="sps-canvas" />
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import * as THREE from 'three';
import { buildFighter } from './buildFighter.js';
import { buildBackdrop } from './hallBackdrop.js';
import { beginSceneLoad } from '@/services/sceneLoading.js';
import { resolveBehavior } from '../data/behavior.js';
import { MATERIALS, LIGHTING, FOG_COLOR, FOG, FOV, CAMERA, coreHue } from '../data/sceneTokens.js';

const wrap = ref(null);
const canvasEl = ref(null);

const emit = defineEmits(['ready']);

/* ── КАДР ────────────────────────────────────────────────────────────────
   Двое стоят друг против друга, камера смотрит в промежуток между ними:
   главное на этом экране — ПАРА, а не один боец.

   ⚠️ КАМЕРА СТОИТ ПОПЕРЁК ПАРЫ, и это не украшение, а единственный угол, при
   котором оба читаются как СТОЯЩИЕ ДРУГ ПРОТИВ ДРУГА. Пробовали развернуть
   пару по глубине, чтобы влезла в узкий кадр: получилось, что ближний повёрнут
   к камере спиной, а дальний грудью, и вместо противостояния читалось «оба
   смотрят в камеру» — плюс у ближнего пропадало ядро, потому что оно на груди.
   Поперёк оба стоят в профиль, ядро видно у обоих: ореол ядра — спрайт, он
   всегда развёрнут к камере, а значит светится под любым углом.

   ⚠️ ДВА КАДРА, А НЕ ОДИН. Значения подобраны по снимкам 390×844 и 844×390: в
   обоих обе фигуры видны целиком, от стоп до головы, и ни одна не попадает под
   язычок панели у левого края. */
const STANCE = {
  //          свой            соперник        камера             взгляд
  portrait:  { me: [-0.62, 0], foe: [0.62, 0], pos: [0, 1.85, 5.25], look: [0, 0.72, 0] },
  landscape: { me: [-1.25, 0], foe: [1.25, 0], pos: [0, 1.45, 2.95], look: [0, 0.70, 0] },
};
let stance = STANCE.portrait;

let renderer, scene, camera, clock;
let backdrop = null;
/* ЭКРАН ЗАГРУЗКИ. SPAR — экран игры, а не служебная страница: вход тяжёлый
   (две фигуры, своя сцена), и общий экран загрузки обязан держаться до первого
   устоявшегося кадра. Договор — services/sceneLoading.js: объявить этапы,
   отметить их по факту, звать frame() в цикле после отрисовки. */
let load = null;
let resizeObserver = null, onVisibility = null, mm = null, onMM = null;
let reduced = false;
let raised = false;                 // сигнал готовности уже отдан
/* Две стороны. У каждой — построенное тело и его последняя сборка, чтобы
   лишний раз не пересобирать: смена ядра или кристалла приходит часто. */
const sides = { me: null, foe: null };
const decided = new Set();   // стороны, про которые уже сказали, что на них ставить
/* Точка «где мой соперник» — своя у каждой стороны. Тело читает её каждый кадр,
   чтобы стоять лицом; мозг выключен, поэтому идти и бить по ней некому. */
const foePoint = { me: new THREE.Vector3(), foe: new THREE.Vector3() };

/* Поставить тела и камеру под нынешнюю раскладку. ⚠️ ТЕЛА НЕ ПЕРЕСОБИРАЮТСЯ —
   только переставляются и доворачиваются: поворот экрана не должен стоить
   сборки заново (ТЗ §5.8). */
function applyFraming() {
  const el = wrap.value;
  if (!el || !camera) return;
  const w = el.clientWidth || 1;
  const h = el.clientHeight || 1;
  stance = h > w ? STANCE.portrait : STANCE.landscape;

  foePoint.me.set(stance.foe[0], 1, stance.foe[1]);
  foePoint.foe.set(stance.me[0], 1, stance.me[1]);
  placeSide('me'); placeSide('foe');

  camera.position.set(...stance.pos);
  camera.lookAt(...stance.look);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}

/* Поставить сторону на её место и развернуть лицом к другой. Формула поворота —
   та же, что у зала (PveScene.faceTowards): тело построено смотрящим в −Z. */
function placeSide(key) {
  const s = sides[key];
  if (!s) return;
  const [x, z] = stance[key];
  s.fighter.group.position.set(x, 0, z);
  const foe = foePoint[key];
  s.fighter.group.rotation.y = Math.atan2(-(foe.x - x), -(foe.z - z));
}

/** Снять тело стороны со сцены и освободить его. */
function dropSide(key) {
  const s = sides[key];
  if (!s) return;
  scene.remove(s.fighter.group);
  s.fighter.dispose();
  sides[key] = null;
}

/**
 * ПОСТРОИТЬ СТОРОНУ ЗАНОВО ИЗ СБОРКИ. Единственный вход снаружи.
 *   key    — 'me' | 'foe'
 *   coreId — ядро ('natisk' | 'nalet' | 'skala' | 'zasada'), либо null
 *   tree   — РАБОЧЕЕ ДЕРЕВО бойца, как оно лежит в хранилище: три ветви, у
 *            каждой пять `faces`. По верному словарю — три грани по пять
 *            кристаллов.
 * Цвет НЕ передаётся: он выводится из ядра через coreHue(), то есть из одного
 * объявления в tokens.css. Второго объявления цвета ядра здесь быть не может.
 */
function setSide(key, { coreId = null, tree = null } = {}) {
  if (!scene) return;
  dropSide(key);
  decided.add(key);

  // ⚠️ НЕТ ЯДРА — НЕТ ТЕЛА. Раньше сторона без ядра всё равно строилась, и цвет
  //    ей доставался розовый (leaderHue) — тот самый, которым в игре владеет
  //    интерфейс. На пустом ростере это выглядело так: панель честно пишет
  //    «БОЙЦОВ НЕТ», а в сцене стоят двое, и у левого розовое ядро. Поймано
  //    снимком пустого ростера. Пусто — значит пусто.
  if (!coreId) { markBuilt(); return; }

  const hue = coreHue(coreId);
  const behavior = resolveBehavior(coreId, collectLit(tree));
  const fighter = buildFighter(hue, {
    // Сторона — только для яркости ядра (свой ярче, чужой глуше): это
    // единственный НЕцветовой признак «кто есть кто», и он уже есть в бойце.
    side: key === 'foe' ? 'opponent' : 'player',
    coreId,
    behavior,
    bounds: { x: 2, z: 2 },
    // Живая точка — чтобы стоял лицом. Мозга нет, идти и бить он не будет.
    getFoePos: () => foePoint[key],
  });
  fighter.setAI(false);
  fighter.setReducedMotion(reduced);
  // Плашка здоровья снаружи гасится — это не бой. Тот же приём, что в
  // HomeScene и BuffsPreviewScene: единственный спрайт прямым ребёнком группы.
  fighter.group.children.forEach((o) => { if (o.isSprite) o.visible = false; });
  scene.add(fighter.group);
  sides[key] = { fighter };
  placeSide(key);
  markBuilt();
}

/** Обе стороны РЕШЕНЫ (построены или намеренно пусты) — сборка сцены закончена,
    экран загрузки может уйти. Отметка идемпотентна: повторные пересборки
    (смена ядра) её не трогают. Считаем именно «решены», а не «построены»: на
    пустом ростере тел нет вовсе, и ожидание тела держало бы экран загрузки. */
function markBuilt() {
  if (decided.has('me') && decided.has('foe')) load?.stage('fighters');
}

/** Зажжённые кристаллы дерева — САМИ ЗАПИСИ, а не их имена: resolveBehavior
    читает у каждой `shifts` / `conditionals` / `effects`. Тот же сбор, что и в
    арене (ArenaScene.collectLit) — второй его формы быть не должно. */
function collectLit(tree) {
  const lit = [];
  for (const branch of tree || []) {
    for (const f of branch.faces || []) if (f.state === 'lit') lit.push(f);
  }
  return lit;
}

onMounted(() => {
  // Этапы — в том порядке, в котором они происходят ниже.
  load = beginSceneLoad(['renderer', 'room', 'fighters']);

  const el = wrap.value;
  const w = el.clientWidth || window.innerWidth;
  const h = el.clientHeight || window.innerHeight;

  mm = window.matchMedia('(prefers-reduced-motion: reduce)');
  reduced = mm.matches;
  onMM = () => {
    reduced = mm.matches;
    sides.me?.fighter.setReducedMotion(reduced);
    sides.foe?.fighter.setReducedMotion(reduced);
  };
  mm.addEventListener ? mm.addEventListener('change', onMM) : mm.addListener(onMM);

  renderer = new THREE.WebGLRenderer({ canvas: canvasEl.value, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h, false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(FOG_COLOR, FOG.forge.density);
  load.stage('renderer');

  camera = new THREE.PerspectiveCamera(FOV.forge, w / h, CAMERA.near, CAMERA.far.forge);

  // Свет — общая тройка залов плюс КОНТР-ЗАЛИВКА, ни одного своего числа.
  //
  // ⚠️ КОНТР-ЗАЛИВКА ОБЯЗАТЕЛЬНА, и это не украшение. Без неё обе фигуры вышли
  // чёрными силуэтами на чёрном (поймано первым же снимком): в залах силуэт
  // держат лампы и отражающая плита, а здесь ни того, ни другого нет. Токен
  // farFill описан ровно для этого случая — «чтобы силуэт не проваливался в
  // черноту, а не чтобы осветить вторую сцену».
  const key = new THREE.DirectionalLight(LIGHTING.key.color, LIGHTING.key.intensity);
  key.position.set(...LIGHTING.key.position);
  scene.add(key);
  const back = new THREE.DirectionalLight(LIGHTING.farFill.color, LIGHTING.farFill.intensity);
  back.position.set(LIGHTING.farFill.x, LIGHTING.farFill.y, LIGHTING.farFill.zOffset);
  scene.add(back);
  scene.add(new THREE.AmbientLight(LIGHTING.amb.color, LIGHTING.amb.intensity));
  scene.add(new THREE.HemisphereLight(LIGHTING.hemi.sky, LIGHTING.hemi.ground, LIGHTING.hemi.intensity));

  // Пол — диск из вещества постаментов зала: на полтона светлее бойца, и на нём
  // фигура читается. Взят токеном, своего цвета здесь не объявляется.
  //
  // ⚠️ ДИСК ЗАВЕДОМО БОЛЬШЕ КАДРА. На радиусе 9 его кромка попадала в кадр и
  // читалась резким обрезом поперёк экрана (поймано снимком). На тридцати она
  // уходит за горизонт и растворяется в тумане раньше, чем до неё доходит
  // взгляд: при плотности зала на таком расстоянии остаётся меньше пятой части
  // цвета.
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(30, 64),
    new THREE.MeshStandardMaterial({
      color: MATERIALS.pedestal.color,
      roughness: MATERIALS.pedestal.roughness,
      metalness: MATERIALS.pedestal.metalness,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.001;
  scene.add(floor);

  // Купол — общий, тот же, что во всех залах.
  backdrop = buildBackdrop({ radius: 40, centerY: 1.4 });
  scene.add(backdrop.mesh);

  applyFraming();
  load.stage('room');

  clock = new THREE.Clock();
  let elapsed = 0;
  const loop = () => {
    const dt = Math.min(0.05, clock.getDelta());
    elapsed += dt;
    sides.me?.fighter.update(elapsed, camera);
    sides.foe?.fighter.update(elapsed, camera);
    renderer.render(scene, camera);
    load?.frame();
    if (!raised) { raised = true; emit('ready'); }
  };
  renderer.setAnimationLoop(loop);

  onVisibility = () => {
    if (document.hidden) renderer.setAnimationLoop(null);
    else { clock.getDelta(); renderer.setAnimationLoop(loop); }
  };
  document.addEventListener('visibilitychange', onVisibility);

  // ⚠️ ПОВОРОТ ЭКРАНА СЦЕНУ НЕ ПЕРЕСОБИРАЕТ. Меняется только кадр камеры и
  // размер холста: тела, их сборка и выбор остаются те же (ТЗ §5.8).
  resizeObserver = new ResizeObserver(() => { applyFraming(); load?.unsettle(); });
  resizeObserver.observe(el);
});

onBeforeUnmount(() => {
  load?.dispose();   // ушли посреди сборки — снять экран и ожидание вместе с нами
  if (resizeObserver) resizeObserver.disconnect();
  if (onVisibility) document.removeEventListener('visibilitychange', onVisibility);
  if (mm && onMM) { mm.removeEventListener ? mm.removeEventListener('change', onMM) : mm.removeListener(onMM); }
  if (renderer) renderer.setAnimationLoop(null);
  dropSide('me'); dropSide('foe');
  if (backdrop) { scene?.remove(backdrop.mesh); backdrop.dispose(); }
  renderer?.dispose();
  renderer = scene = camera = null;
});

defineExpose({ setSide });
</script>

<style scoped>
.sps-wrap { position: absolute; inset: 0; }
/* ⚠️ Холст указателя НЕ СЛУШАЕТ. Камера неподвижна, крутить нечего, а нажатие
   мимо панели обязано дойти до страницы — им она панель и закрывает. */
.sps-canvas { display: block; width: 100%; height: 100%; pointer-events: none; }
</style>
