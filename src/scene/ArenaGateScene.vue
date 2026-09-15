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

     ЧТО В НЁМ СТОИТ. Первые острова — выбор режима боя: DUEL живой, SQUAD
     заперт с подписью SOON (gatePlates.js). Форма острова взята готовой от
     островов дома, отделка своя. Дальше здесь встанут острова выбора бойцов и
     объёмная кнопка старта — их ставят следующие работы.

     ДОРОГА ВНУТРЬ ОСТРОВА — ТА ЖЕ. Клик по живому острову увозит камеру внутрь
     тем же режиссёром (islandDive), что и на экране режимов: своей поездки
     ворота не заводят. Клик по запертому не ведёт никуда и коротко дрожит.

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
import { createIslandDive } from './islandDive.js';
import { buildGatePlates } from './gatePlates.js';
import { setGatePlateTag, setGatePlateHover, setGatePlateRefused, clearGatePlateTags } from './gatePlateTags.js';
import { beginSceneLoad, loadingState } from '@/services/sceneLoading.js';
import { FOG_COLOR, FOG, FOV, CAMERA } from '@/data/sceneTokens.js';

// 'arrived' — подлёт доехал, игрок может выбирать.
// 'dive-start' — камера тронулась внутрь острова: виду пора растворить свой хром.
// 'pick' — камера доехала внутрь острова, режим выбран: виду пора менять адрес.
// 'refused' — клик по запертому острову: перехода нет, вид только отзывается.
// Что стоит на островах, решает ВИД: он знает и таблицу режимов, и список
// бойцов. Сцена умеет разложить любой список и ничего не знает о том, что на
// нём написано. Смена списка = смена шага; менять его надо под чёрным кадром,
// и это тоже забота вида (см. ArenaGateView).
const props = defineProps({
  items: { type: Array, default: () => [] },
  // Идентификаторы выбранных островов — они горят и без курсора.
  selected: { type: Array, default: () => [] },
  // Уводит ли выбор ДАЛЬШЕ. На выборе режима — да: клик это переход, и камера
  // летит внутрь острова. На выборе бойцов — нет: там клик это отметка, состав
  // набирают из нескольких, и улететь в лицо одному значило бы спрятать
  // остальных ровно в тот момент, когда их сравнивают.
  diveOnPick: { type: Boolean, default: true },
});

const emit = defineEmits(['arrived', 'dive-start', 'pick', 'refused']);

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
  // Поза покоя — то, к чему привозит подлёт. Две базовые, по раскладке островов:
  // лёжа пара стоит поперёк кадра, стоя уходит в глубину, и с лежачей позы
  // ближний остров упирался в нижнюю кромку экрана, а дальний терялся. Обе
  // выверены глазами на ДВУХ островах режима.
  //
  // Когда островов больше (бойцов может быть сколько угодно), поза не
  // придумывается заново: та же камера ОТЪЕЗЖАЕТ по своему лучу во столько раз,
  // во сколько разложенное шире или глубже пары. Так раскладка и кадр не могут
  // разойтись — второе выводится из первого.
  rest:         [0, 5.4, 12.5],
  restPortrait: [0, 9.6, 17.5],
  // Габарит, под который эти две позы выверены, — пара островов режима.
  baseHalfW: 5.1,           // лёжа: шаг 5.8 между двумя + полплиты 2.2
  baseHalfD: 6.1,           // стоя: шаг 8.8 между двумя + полплиты 1.7
  maxPull: 3.0,             // дальше не отъезжаем: острова станут марками
  portraitAspect: 1.0,      // уже этого — портретная поза (тот же порог, что у островов)
  look:   [0, 1.1, 0],      // цель орбиты
  polarMin: 0.60,
  polarMax: 1.38,
  // Коридор зума. Числа выверены на ПАРЕ островов — как и позы покоя, — поэтому
  // и едут они вместе с позой: когда островов больше и камера отъезжает, потолок
  // обязан отъехать во столько же раз. Пока он стоял на месте, отъезда не было
  // вовсе: поза покоя стоя лежит на луче длиной 19.5, потолок был 20, и любой
  // отъезд орбита возвращала назад в тот же кадр. Троих в глубину это роняло за
  // нижнюю кромку экрана (замерено: подписи легли на 355, 546 и 1007 при высоте
  // окна 844), и никакая правка самой позы этого не лечила — лечился симптом.
  distMin: 7,
  distMax: 20,
};

const wrap = ref(null);
const canvasEl = ref(null);

let renderer = null, scene = null, camera = null, controls = null;
let backdrop = null, field = null, approach = null, load = null, plates = null, dive = null;
let resizeObserver = null, onVisibility = null, stopVeilWatch = null;
let onPointerMove = null, onPointerDown = null, onPointerUp = null;
let reduced = false;
let arrived = false;
let diving = false;
let departRef = null;   // ссылка на depart() из onMounted — её дёргает вид
// Откуда начался клик — чтобы отличить выбор от вращения камеры. Порог тот же,
// что на островах дома: 5 пикселей.
let downAt = null;
const CLICK_SLOP = 5;
const _ray = new THREE.Raycaster();
const _ptr = new THREE.Vector2();

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

// Собрать острова по списку. Старые разбираются целиком: переиспользовать
// половину плит и дорисовать недостающие значило бы держать в сцене два разных
// способа оказаться на месте, а собрать их заново стоит доли кадра и происходит
// под чёрным кадром, где этого всё равно не видно.
function buildPlates(items, aspect) {
  if (plates) { scene.remove(plates.group); plates.dispose(); plates = null; }
  plates = buildGatePlates({ items, maxAniso: renderer.capabilities.getMaxAnisotropy() });
  plates.setSelected(props.selected);
  scene.add(plates.group);
  plates.layout(aspect);
}

onMounted(() => {
  load = beginSceneLoad(['renderer', 'field', 'plates', 'camera']);

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

  buildPlates(props.items, w / h);
  load.stage('plates');

  const look = new THREE.Vector3(...CAM.look);
  // Поза покоя = базовая поза этой ориентации, отодвинутая по своему же лучу во
  // столько раз, во сколько разложенное больше пары. Меньше единицы не бывает:
  // подъезжать ближе выверенной позы незачем.
  // Во сколько раз разложенное больше пары, под которую мерили позы. Меньше
  // единицы не бывает: подъезжать ближе выверенной позы незачем.
  let pull = 1;
  function pullFor() {
    const b = plates ? plates.bounds() : null;
    if (!b) return 1;
    return Math.min(CAM.maxPull, Math.max(1, b.halfW / CAM.baseHalfW, b.halfD / CAM.baseHalfD));
  }
  function restFor(a) {
    const base = new THREE.Vector3(...(a < CAM.portraitAspect ? CAM.restPortrait : CAM.rest));
    if (!plates) return base;
    pull = pullFor();
    return look.clone().addScaledVector(base.clone().sub(look), pull);
  }
  // Коридор зума живёт на том же множителе, что и поза: иначе потолок съедает
  // отъезд и кадр не вмещает то, ради чего камера отъезжала (см. CAM.distMax).
  function applyZoomRange() {
    if (!controls) return;
    controls.minDistance = CAM.distMin * pull;
    controls.maxDistance = CAM.distMax * pull;
  }
  let rest = restFor(w / h);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(look);
  controls.enableDamping = true;
  controls.dampingFactor = CAMERA.damping;
  controls.enablePan = false;            // цель неподвижна — уезжать некуда
  controls.minPolarAngle = CAM.polarMin;
  controls.maxPolarAngle = CAM.polarMax;
  applyZoomRange();

  approach = createGateApproach({ camera, controls });
  // Тот же режиссёр, что увозит камеру внутрь острова на экране режимов. Ворота
  // не заводят своего: дорога внутрь острова в игре одна, и вести её должен один
  // файл — иначе две одинаковые на вид поездки разойдутся на первой же правке.
  dive = createIslandDive({ camera, controls });

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

  departRef = depart;

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

  // ── наведение и выбор ──────────────────────────────────────────────────
  // Луч бьётся в невидимые коробки островов, а не в их геометрию: остров должен
  // быть ОДНИМ предметом, иначе наведение зависит от того, попал курсор в крышку
  // или в бок.
  function pickAt(clientX, clientY) {
    if (!plates || !canvasEl.value) return null;
    const r = canvasEl.value.getBoundingClientRect();
    _ptr.x = ((clientX - r.left) / r.width) * 2 - 1;
    _ptr.y = -((clientY - r.top) / r.height) * 2 + 1;
    _ray.setFromCamera(_ptr, camera);
    const hit = _ray.intersectObjects(plates.pickables, false)[0];
    return hit ? hit.object.userData.gatePlate : null;
  }

  function applyHover(id) {
    if (!plates) return;
    plates.setHover(id);
    setGatePlateHover(plates.hovered);
    // Курсор-палец — только там, где клик что-то делает. На запертом острове
    // палец обещал бы переход, которого не будет.
    canvasEl.value.style.cursor = (id && !plates.plates[id].locked) ? 'pointer' : '';
  }

  // Выбор живого острова: гасим свой интерфейс, везём камеру внутрь и только по
  // прибытии отдаём выбор наружу. Порядок тот же, что на экране режимов, и по той
  // же причине — чернеть и менять адрес можно лишь когда камера доехала.
  function choose(id) {
    if (diving || !plates) return;
    // Выбор-отметка: камера остаётся на месте, хром не растворяется.
    if (!props.diveOnPick) { emit('pick', id); return; }
    diving = true;
    emit('dive-start');
    const aim = (!reduced && dive) ? plates.aimFor(id) : null;
    // Прицела нет (выключены анимации) — переход мгновенный, без поездки.
    if (!aim || !dive.play(aim, { onArrive: () => emit('pick', id) })) emit('pick', id);
  }

  function refuse(id) {
    if (!plates) return;
    plates.refuse(id);
    setGatePlateRefused(id);
    emit('refused', id);
    setTimeout(() => setGatePlateRefused(null), 420);
  }

  onPointerMove = (e) => {
    if (diving || !arrived) return;
    if (downAt) return;                 // тянут камеру — наведение не трогаем
    applyHover(pickAt(e.clientX, e.clientY));
  };
  onPointerDown = (e) => { downAt = { x: e.clientX, y: e.clientY }; };
  onPointerUp = (e) => {
    const from = downAt; downAt = null;
    if (!from || diving || !arrived) return;
    if (Math.hypot(e.clientX - from.x, e.clientY - from.y) > CLICK_SLOP) return;  // это было вращение
    const id = pickAt(e.clientX, e.clientY);
    if (!id) return;
    if (plates.plates[id].locked) refuse(id);
    else choose(id);
  };
  canvasEl.value.addEventListener('pointermove', onPointerMove);
  canvasEl.value.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', onPointerUp);

  // ── смена шага ──────────────────────────────────────────────────────────
  // Вид меняет список под ЧЁРНЫМ кадром и потом просит тронуться. Здесь только
  // пересборка и возврат камеры в начало дороги: когда ехать — решает вид, у
  // него занавес.
  watch(() => props.items, (next) => {
    if (!renderer || !next) return;
    const cw = el.clientWidth || w, ch = el.clientHeight || h;
    diving = false;
    arrived = false;
    applyHover(null);
    clearGatePlateTags();     // прошлые острова ушли — их подписи тоже
    buildPlates(next, cw / ch);
    rest = restFor(cw / ch);
    applyZoomRange();
    if (reduced) { camera.position.copy(rest); camera.lookAt(look); controls.target.copy(look); controls.update(); }
    else approach.park(rest, look);
    load?.unsettle();
  });

  watch(() => props.selected, (ids) => plates?.setSelected(ids || []), { deep: true });

  const clock = new THREE.Clock();
  const loop = () => {
    const dt = Math.min(clock.getDelta(), 0.05);

    const t = clock.elapsedTime;

    // Пока камера едет — подлётом или пролётом внутрь острова, — орбита к ней не
    // прикасается: два владельца одной камеры в одном кадре дают дёрганье,
    // которое потом ищут в самой поездке.
    const approaching = approach ? approach.update(dt) : false;
    const divingNow = dive ? dive.update(dt) : false;
    if (!approaching && !divingNow) controls.update();

    if (plates) {
      plates.update(t, dt);
      // Подписи пишутся каждый кадр — они приклеены к настоящим островам, а не
      // стоят в углу. Пока камера едет внутрь острова, подписи скрыты: вид их в
      // это время растворяет, и считать для них место незачем.
      const cw = el.clientWidth, ch = el.clientHeight;
      for (const p of plates.list) {
        const sc = plates.captionScreen(p.id, camera, cw, ch);
        setGatePlateTag(p.id, sc.x, sc.y, sc.visible && arrived && !diving);
      }
    }

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
    plates?.layout(cw / ch);
    // Сменилась ориентация — сменилась и поза покоя: пара разложилась иначе, и
    // кадр обязан её вместить. Двигаем камеру, только если она сейчас ничья:
    // во время поездки у неё есть владелец, а после — игрок, который сам её
    // повернул, и отменять его поворот сменой размера окна нельзя.
    const next = restFor(cw / ch);
    applyZoomRange();
    if (!next.equals(rest)) {
      rest = next;
      if (!arrived && approach && !reduced) approach.park(rest, look);
      else if (!arrived) { camera.position.copy(rest); camera.lookAt(look); }
    }
    load?.unsettle();
  });
  resizeObserver.observe(el);
});

// Вид зовёт это, когда занавес начал уходить: растемнение и подлёт обязаны идти
// вместе. На первом входе в пространство эту роль играет экран загрузки, и там
// момент сцена ловит сама (см. depart ниже по коду).
defineExpose({ depart: () => departRef && departRef() });

onBeforeUnmount(() => {
  // Порядок: сначала оборвать обе поездки — их отложенные вызовы не должны
  // догнать уже снятый экран, — и только потом разбирать сцену.
  approach?.cancel();
  dive?.cancel();
  stopVeilWatch?.();
  clearGatePlateTags();
  load?.dispose();
  resizeObserver?.disconnect();
  if (onVisibility) document.removeEventListener('visibilitychange', onVisibility);
  if (onPointerMove) canvasEl.value?.removeEventListener('pointermove', onPointerMove);
  if (onPointerDown) canvasEl.value?.removeEventListener('pointerdown', onPointerDown);
  if (onPointerUp) window.removeEventListener('pointerup', onPointerUp);
  renderer?.setAnimationLoop(null);
  controls?.dispose();
  plates?.dispose();
  field?.dispose();
  backdrop?.dispose();
  renderer?.dispose();
  renderer = scene = camera = controls = null;
  field = backdrop = approach = dive = plates = load = null;
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
