<!-- ArenaGateScene — ВОРОТА АРЕНЫ: пространство, в которое игрок попадает через
     дверь ARENA. Своя копия по рецепту (hexlash-3d §3), собранная из тех же
     кирпичей, что дом и зал: гекс-пол в семейном материале арены, тёмный купол
     фона внутри сцены, рассеянная заливка без теней, орбита с клампами.

     ЗАЧЕМ ОТДЕЛЬНАЯ СЦЕНА, А НЕ УВОД КАМЕРЫ В СУЩЕСТВУЮЩЕМ МИРЕ. Инструкция
     советует второе, и для всего, что делали раньше, это было верно. Здесь
     требование обратное и названо владельцем прямо: ARENA — не другой экран, а
     ДРУГОЕ МЕСТО. Дом и острова режимов остаются позади и выгружаются; новое
     пространство грузится с нуля, под экраном загрузки. Увод камеры в том же
     мире даёт ровно то, от чего уходим, — переход между экранами одной комнаты.
     Риск, ради которого правило написано (кадры на телефоне), снят иначе: это
     самая лёгкая из сцен — пол, купол, три источника света, ноль фигур, ноль
     частиц, — и две сцены никогда не живут в памяти одновременно.

     ПУСТО — ЭТО ПОКА ЧЕСТНО. Острова выбора режима и бойцов ставит следующая
     работа. Сейчас здесь нужно проверить одно: дорогу. Пол и туман дают ей
     землю и глубину, без них подлёт камеры некуда мерить.

     ПОДЛЁТ КАМЕРЫ. Сцена собирается с камерой в отодвинутой позе и НЕ трогает её,
     пока стоит экран загрузки. В тот кадр, когда экран НАЧИНАЕТ растворяться,
     стартует подлёт (gateApproach.js) — растемнение и движение идут вместе, как
     требует ТЗ. Сигнал — `loadingState.active`, который переходит в false ровно
     на первом кадре растворения (см. sceneLoading.js, release()).

     Дисциплина: свечения в сцене нет ни одного — светиться тут пока нечему;
     розового нет. Пол, туман и купол — семейные тёмные тона из токенов. -->
<template>
  <div ref="wrap" class="gate-scene-wrap">
    <canvas ref="canvasEl" class="gate-scene-canvas" />
    <div class="gate-scene-vignette" />
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { makeHexGridTexture } from './arenaTextures.js';
import { buildBackdrop } from './hallBackdrop.js';
import { createGateApproach } from './gateApproach.js';
import { beginSceneLoad, loadingState } from '@/services/sceneLoading.js';
import { FOG_COLOR, FOG, FOV, CAMERA } from '@/data/sceneTokens.js';

const emit = defineEmits(['arrived']);

// ───────────────────────── CONFIG (ручки приёмки) ─────────────────────────
// Пол. Одно ровное гекс-поле от края до края — без центральной плиты и без шва:
// шов делит пространство на «здесь» и «там», а ворота должны читаться единым
// местом. Размер подобран так, чтобы кромка тонула в тумане, а не обрезалась.
const FIELD = {
  size: 40,      // сторона поля в единицах
  repeat: 16,    // плотность гекс-решётки по полю
  y: 0,          // высота поверхности
  // Тон семейный — тёмный сине-серый, как поле пространства (0x0d1120). Здесь
  // чуть светлее и холоднее: ворота ближе к камере и глуше по туману, и на
  // тоне поля пространства пол тонул бы в нём целиком.
  base: 0x121729,
  lineOpacity: 0.5,   // сила линий решётки; свой цвет у них уже есть в текстуре
};

// Свет. Ровная рассеянная заливка без теней — тот же выбор, что в пространстве
// (владелец отклонил объёмный лепящий свет). Тёплый ключ + холодноватая
// полусфера: пол читается, но остаётся глухим.
// Значения взяты от сцены пространства (там эта заливка принята владельцем) и
// приспущены: комната меньше и ближе, туман плотнее, при тамошних числах ворота
// читались бы ярче зала. Первая сборка стояла в пять раз ниже — пол выходил
// чёрным: на почти чёрной подложке слабая заливка не даёт ничего.
const LIGHT = {
  key:  { color: 0xfff2e8, intensity: 2.1, pos: [5, 15, 7] },
  hemi: { sky: 0x6f6a58, ground: 0x0c0e16, intensity: 1.05 },
  amb:  { color: 0x423c38, intensity: 0.75 },
};

// Камера. Поза покоя — то, к чему привозит подлёт и вокруг чего потом ходит
// орбита. Клампы обязательны (hexlash-3d §4): под пол не заглянуть, зум в
// коридоре, цель орбиты неподвижна — панорамы здесь нет.
const CAM = {
  rest:   [0, 5.4, 12.5],   // поза покоя
  look:   [0, 1.1, 0],      // цель орбиты
  polarMin: 0.60,
  polarMax: 1.38,
  distMin: 7,
  distMax: 20,
};

const wrap = ref(null);
const canvasEl = ref(null);

let renderer = null, scene = null, camera = null, controls = null;
let backdrop = null, field = null, approach = null, load = null;
let resizeObserver = null, onVisibility = null, stopVeilWatch = null;
let reduced = false;
let arrived = false;

function lowPowerDevice() {
  const cores = navigator.hardwareConcurrency || 8;
  const mem = navigator.deviceMemory || 8;
  return cores <= 4 || mem <= 4;
}

// Пол — подложка + тайленная гекс-решётка поверх. Две плоскости, а не одна с
// комбинированной текстурой: решётка тайлится своей частотой, подложка тянется
// целиком, и разводить их частоты в одной текстуре нечем.
function buildField(maxAniso) {
  const group = new THREE.Group();

  const baseGeo = new THREE.PlaneGeometry(FIELD.size, FIELD.size);
  const baseMat = new THREE.MeshStandardMaterial({
    color: FIELD.base, roughness: 0.95, metalness: 0.0,
  });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.rotation.x = -Math.PI / 2;
  base.position.y = FIELD.y;
  group.add(base);

  // Текстура решётки уже несёт СВОЙ цвет линий (rgba(160,182,218,.32) внутри
  // arenaTextures). Задавать материалу ещё и `color` нельзя: он умножается на
  // цвет текстуры, и тёмный тон гасит линии до невидимости — так и вышло в
  // первой сборке. Семейный состав (см. поле в SpaceScene): map + прозрачность,
  // без тона. Анизотропия передаётся генератору, он ставит её сам.
  const tex = makeHexGridTexture(maxAniso);
  tex.repeat.set(FIELD.repeat, FIELD.repeat);
  const gridGeo = new THREE.PlaneGeometry(FIELD.size, FIELD.size);
  const gridMat = new THREE.MeshBasicMaterial({
    map: tex, transparent: true, opacity: FIELD.lineOpacity, depthWrite: false,
  });
  const grid = new THREE.Mesh(gridGeo, gridMat);
  grid.rotation.x = -Math.PI / 2;
  grid.position.y = FIELD.y + 0.002;   // поверх подложки, без спора за глубину
  group.add(grid);

  const dispose = () => {
    baseGeo.dispose(); baseMat.dispose();
    gridGeo.dispose(); gridMat.dispose(); tex.dispose();
  };
  return { group, dispose };
}

onMounted(() => {
  load = beginSceneLoad(['renderer', 'field', 'camera']);

  const el = wrap.value;
  const w = el.clientWidth || window.innerWidth;
  const h = el.clientHeight || window.innerHeight;

  reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  renderer = new THREE.WebGLRenderer({
    canvas: canvasEl.value, antialias: true, alpha: true, powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowPowerDevice() ? 1.5 : 2));
  renderer.setSize(w, h, false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(FOG_COLOR, FOG.gate.density);

  camera = new THREE.PerspectiveCamera(FOV.gate, w / h, CAMERA.near, CAMERA.far.gate);

  const key = new THREE.DirectionalLight(LIGHT.key.color, LIGHT.key.intensity);
  key.position.set(LIGHT.key.pos[0], LIGHT.key.pos[1], LIGHT.key.pos[2]);
  scene.add(key);
  scene.add(new THREE.AmbientLight(LIGHT.amb.color, LIGHT.amb.intensity));
  scene.add(new THREE.HemisphereLight(LIGHT.hemi.sky, LIGHT.hemi.ground, LIGHT.hemi.intensity));
  load.stage('renderer');

  field = buildField(renderer.capabilities.getMaxAnisotropy());
  scene.add(field.group);
  backdrop = buildBackdrop({ radius: 60, centerY: 5 });
  scene.add(backdrop.mesh);
  load.stage('field');

  const rest = new THREE.Vector3(...CAM.rest);
  const look = new THREE.Vector3(...CAM.look);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(look);
  controls.enableDamping = true;
  controls.dampingFactor = CAMERA.damping;
  controls.enablePan = false;            // цель неподвижна — уезжать некуда
  controls.minPolarAngle = CAM.polarMin;
  controls.maxPolarAngle = CAM.polarMax;
  controls.minDistance = CAM.distMin;
  controls.maxDistance = CAM.distMax;

  approach = createGateApproach({ camera, controls });

  // Камера ставится ЗАРАНЕЕ и сразу в НАЧАЛО дороги, а не в позу покоя: пока
  // стоит экран загрузки, кадры всё равно рисуются, и камера должна досчитывать
  // устоявшиеся кадры уже оттуда, откуда поедет. Иначе скачок в начальную позу
  // пришёлся бы ровно на первый кадр растворения заслонки.
  // При выключенных анимациях поездки не будет — там сразу поза покоя.
  if (reduced) { camera.position.copy(rest); camera.lookAt(look); }
  else approach.park(rest, look);
  controls.update();
  load.stage('camera');

  // ── Момент отправления ──
  // Экран загрузки НАЧИНАЕТ растворяться ровно тогда, когда `active` становится
  // false (sceneLoading.release(): сначала снимается признак, поверхность живёт
  // ещё FADE_OUT_MS). Поэтому здесь — и не раньше и не позже.
  const depart = () => {
    if (arrived) return;
    if (reduced) { arrived = true; emit('arrived'); return; }
    approach.play({
      to: rest,
      look,
      onArrive: () => {
        if (arrived) return;
        arrived = true;
        controls.target.copy(look);
        controls.update();
        emit('arrived');
      },
    });
  };

  if (!loadingState.active) {
    // Экрана загрузки нет вовсе (лёгкий путь — например, прямой заход без
    // тяжёлой сборки). Ждать нечего: трогаемся со следующего кадра.
    requestAnimationFrame(depart);
  } else {
    stopVeilWatch = watch(
      () => loadingState.active,
      (on) => { if (!on) { stopVeilWatch?.(); stopVeilWatch = null; depart(); } },
    );
  }

  const clock = new THREE.Clock();
  const loop = () => {
    const dt = Math.min(clock.getDelta(), 0.05);

    // Пока камера едет, орбита к ней не прикасается: два владельца одной камеры
    // в одном кадре — это дёрганье, которое потом ищут в самой поездке.
    const moving = approach ? approach.update(dt) : false;
    if (!moving) controls.update();

    renderer.render(scene, camera);
    load.frame();
  };
  renderer.setAnimationLoop(loop);

  onVisibility = () => {
    if (document.hidden) renderer.setAnimationLoop(null);
    else renderer.setAnimationLoop(loop);
  };
  document.addEventListener('visibilitychange', onVisibility);

  resizeObserver = new ResizeObserver(() => {
    const cw = el.clientWidth, ch = el.clientHeight;
    if (!cw || !ch) return;
    camera.aspect = cw / ch;
    camera.updateProjectionMatrix();
    renderer.setSize(cw, ch, false);
    load?.unsettle();
  });
  resizeObserver.observe(el);
});

onBeforeUnmount(() => {
  // Порядок: сначала оборвать поездку — её отложенный вызов не должен догнать
  // уже снятый экран, — и только потом разбирать сцену.
  approach?.cancel();
  stopVeilWatch?.();
  load?.dispose();
  resizeObserver?.disconnect();
  if (onVisibility) document.removeEventListener('visibilitychange', onVisibility);
  renderer?.setAnimationLoop(null);
  controls?.dispose();
  field?.dispose();
  backdrop?.dispose();
  renderer?.dispose();
  renderer = scene = camera = controls = null;
  field = backdrop = approach = load = null;
});
</script>

<style scoped>
.gate-scene-wrap { position: fixed; inset: 0; z-index: var(--z-scene); }
.gate-scene-canvas { display: block; width: 100%; height: 100%; }

/* Виньетка — та же, что в остальных залах: собирает взгляд к центру и прячет
   кромку поля там, где туман ещё не догасил её до фона. */
.gate-scene-vignette {
  position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(ellipse at 50% 52%,
    transparent 46%, rgba(0, 0, 0, 0.42) 100%);
}
</style>
