<!-- AscensionScene — сцена ОБРЯДА (/play/ascension). Один боец в центре кадра.

     ⚠️ ШЕСТАЯ СЦЕНА, И ЭТО ОСОЗНАННЫЙ ШАГ ЗА ПОРОГ (см. hexlash-3d §2). Порог
     говорит: новое селить в существующем мире и уводить камеру. Здесь так не
     вышло по продуктовой причине — обряд обязан быть ОТДЕЛЬНЫМ местом: в зале
     камерой владеет игрок, вокруг ходит весь ростер, и поставить посреди этого
     одноразовое необратимое событие значит провести его в проходной комнате.
     Цена шага снижена до предела: сцена САМАЯ ЛЁГКАЯ В ПРОЕКТЕ — одно тело,
     неподвижная камера, ни блужданий, ни частиц, ни разлома, ни ламп. Легче
     SPAR, у которого тел два.

     СОБРАНА СВОИМИ КОПИЯМИ по рецепту, а не флагом в чужой сцене. Защищённого
     не задевает ничего: buildFighter ВЫЗЫВАЕТСЯ, а сердце красится снаружи —
     тем же приёмом, каким зал гасит плашку здоровья (ascensionRite.js).

     ⚠️ КАМЕРА НЕПОДВИЖНА. Обряд — поставленный кадр, а не осмотр: крутить
     нечего, и холст указателя не слушает вовсе.

     ⚠️ ДВИЖЕНИЕ ЖИВЁТ ЗДЕСЬ, А НЕ НА СТРАНИЦЕ. Страница говорит «начинай» и
     ждёт «готово»; чем именно обряд занят эти секунды — дело сцены. Так же
     устроено «уменьшить движение»: страница о нём не знает. -->
<template>
  <div ref="wrap" class="asc-wrap">
    <canvas ref="canvasEl" class="asc-canvas" />
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
import { RITE, legendHue, heartHandle } from './ascensionRite.js';

const wrap = ref(null);
const canvasEl = ref(null);
const emit = defineEmits(['ready', 'done']);

/* ── КАДР. Один боец по центру, камера чуть выше пояса и смотрит в грудь: там
   сердце, и оно — главное на этом экране.

   ⚠️ ДВА КАДРА, А НЕ ОДИН, по образцу SPAR: значения подобраны так, чтобы
   фигура целиком помещалась и стоя (390×844), и лёжа (844×390). Лёжа камера
   отходит дальше и опускается — иначе фигура упирается макушкой в верх кадра. */
/* ⚠️ КАМЕРА СМОТРИТ НИЖЕ НОГ, И ЭТО НЕ ОШИБКА. Точка взгляда лежит почти на
   полу, поэтому фигура уезжает в ВЕРХНЮЮ часть кадра и целиком помещается над
   выбором, который стоит низом экрана. Целились в грудь — и ноги уходили за
   карточки (поймано первым же снимком 390×844).

   ⚠️ ЛЁЖА ФИГУРА СДВИНУТА ВПРАВО, потому что там выбор стоит колонкой слева.
   Сдвиг сделан камерой (обе точки уехали по x), а не переносом тела: тело
   стоит в начале координат, и вокруг него считается всё остальное. */
const FRAME = {
  portrait:  { pos: [0, 1.45, 4.00], look: [0, 0.15, 0] },
  landscape: { pos: [-0.5, 1.25, 3.60], look: [-0.5, 0.25, 0] },
};
let frame = FRAME.portrait;

let renderer, scene, camera, clock;
let backdrop = null;
let load = null;
let resizeObserver = null, onVisibility = null, mm = null, onMM = null;
let reduced = false;
let raised = false;

/* Тело обряда и ручка к его сердцу. Тело одно и пересобирается только при
   смене выбранного бойца — сам обряд его не пересобирает (см. шапку). */
let body = null;          // { fighter, heart }
let decided = false;      // про тело уже сказали, что на нём стоит (или что его нет)

/* ── ХОД ОБРЯДА. Одно число времени и одна ступень; страница их не видит. */
const RITE_IDLE = 0, RITE_SPIN = 1, RITE_GOLD = 2, RITE_HOLD = 3;
let stage = RITE_IDLE;
let stageT = 0;           // секунд на текущей ступени
let baseYaw = 0;          // поворот фигуры на момент начала вращения
let goldMix = 0;          // 0 — сердце бойца · 1 — золото легенды

/** Разгон и остановка: рывок, а не карусель (ТЗ §3.3). */
function easeInOut(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function applyFraming() {
  const el = wrap.value;
  if (!el || !camera) return;
  const w = el.clientWidth || 1;
  const h = el.clientHeight || 1;
  frame = h > w ? FRAME.portrait : FRAME.landscape;
  camera.position.set(...frame.pos);
  camera.lookAt(...frame.look);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}

function dropBody() {
  if (!body) return;
  scene.remove(body.fighter.group);
  body.fighter.dispose();
  body = null;
}

/**
 * Поставить в центр ЭТОГО бойца. Единственный вход снаружи, кроме «начинай».
 *   coreId — ядро бойца, либо null (тогда тела нет вовсе)
 *   tree   — рабочее дерево бойца, как оно лежит в хранилище
 *
 * Цвет НЕ передаётся: выводится из ядра через coreHue(), то есть из одного
 * объявления в tokens.css.
 */
function setFighter({ coreId = null, tree = null } = {}) {
  if (!scene) return;
  dropBody();
  decided = true;
  goldMix = 0;
  stage = RITE_IDLE;

  // Нет ядра — нет тела. Пустой ростер обязан выглядеть пустым, а не ставить в
  // центр фигуру неизвестно чьего цвета (тот же урок, что и на SPAR).
  if (!coreId) { markBuilt(); return; }

  const fighter = buildFighter(coreHue(coreId), {
    side: 'player',
    coreId,
    behavior: resolveBehavior(coreId, collectLit(tree)),
    bounds: { x: 1, z: 1 },
    getFoePos: () => null,
  });
  fighter.setAI(false);              // обряд — не бой: никто никуда не идёт
  fighter.setReducedMotion(reduced);
  // ⚠️ РАЗВОРОТ ЛИЦОМ К КАМЕРЕ ОБЯЗАТЕЛЕН. Тело строится смотрящим в −Z, а
  //    сердце у него на груди — и без разворота обряд показывал бы спину, то
  //    есть ту сторону, где золоту взяться неоткуда (поймано снимком). Тот же
  //    разворот стоит у силуэта на постаменте SPAR и по той же причине.
  fighter.group.rotation.y = Math.PI;
  // Плашка здоровья снаружи гасится — это не бой. Единственный спрайт прямым
  // ребёнком группы, тот же приём, что в зале и на SPAR.
  fighter.group.children.forEach((o) => { if (o.isSprite) o.visible = false; });
  scene.add(fighter.group);
  body = { fighter, heart: heartHandle(fighter, legendHue(coreId)) };
  markBuilt();
}

/** Начать обряд. Ответ придёт событием `done`, когда всё кончится. */
function beginRite() {
  if (!body) { emit('done'); return; }
  baseYaw = body.fighter.group.rotation.y;
  stageT = 0;
  // ⚠️ «УМЕНЬШИТЬ ДВИЖЕНИЕ» ВРАЩЕНИЕ СНИМАЕТ ЦЕЛИКОМ, а не ускоряет: обряд
  //    начинается сразу с налива золота (ТЗ §3.3). Смена цвета остаётся —
  //    она и есть событие, и гасить её нечем.
  stage = reduced ? RITE_GOLD : RITE_SPIN;
}

function markBuilt() { if (decided) load?.stage('fighter'); }

/** Зажжённые кристаллы дерева — сами записи. Тот же сбор, что в арене и SPAR. */
function collectLit(tree) {
  const lit = [];
  for (const branch of tree || []) {
    for (const f of branch.faces || []) if (f.state === 'lit') lit.push(f);
  }
  return lit;
}

onMounted(() => {
  load = beginSceneLoad(['renderer', 'room', 'fighter']);

  const el = wrap.value;
  const w = el.clientWidth || window.innerWidth;
  const h = el.clientHeight || window.innerHeight;

  mm = window.matchMedia('(prefers-reduced-motion: reduce)');
  reduced = mm.matches;
  onMM = () => {
    reduced = mm.matches;
    body?.fighter.setReducedMotion(reduced);
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

  // Свет — общая тройка залов плюс контр-заливка, ни одного своего числа.
  // Контр-заливка обязательна по той же причине, что на SPAR: ламп и
  // отражающей плиты здесь нет, и без неё фигура выходит чёрным силуэтом.
  const key = new THREE.DirectionalLight(LIGHTING.key.color, LIGHTING.key.intensity);
  key.position.set(...LIGHTING.key.position);
  scene.add(key);
  const back = new THREE.DirectionalLight(LIGHTING.farFill.color, LIGHTING.farFill.intensity);
  back.position.set(LIGHTING.farFill.x, LIGHTING.farFill.y, LIGHTING.farFill.zOffset);
  scene.add(back);
  scene.add(new THREE.AmbientLight(LIGHTING.amb.color, LIGHTING.amb.intensity));
  scene.add(new THREE.HemisphereLight(LIGHTING.hemi.sky, LIGHTING.hemi.ground, LIGHTING.hemi.intensity));

  // Пол — тот же диск из вещества постаментов, что на SPAR, и так же заведомо
  // больше кадра: на малом радиусе его кромка читается обрезом поперёк экрана.
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

  backdrop = buildBackdrop({ radius: 40, centerY: 1.2 });
  scene.add(backdrop.mesh);

  applyFraming();
  load.stage('room');

  clock = new THREE.Clock();
  let elapsed = 0;
  const loop = () => {
    // ⚠️ ДВА ВРЕМЕНИ, И ЭТО НЕ ДУБЛИРОВАНИЕ. `dt` подрезан сверху, как во всех
    //    сценах: после паузы вкладки один огромный шаг швырнул бы тело. А ОБРЯД
    //    ИДЁТ ПО ЧАСАМ, `raw`, и вот почему: подрезанное время на медленном
    //    устройстве течёт МЕДЛЕННЕЕ настоящего — при 8 кадрах в секунду каждый
    //    кадр приносит 125 мс, а засчитывается 50, и обряд растягивается в два
    //    с половиной раза. Замерено: на программной отрисовке двухсекундное
    //    вращение шло почти шесть секунд, то есть весь бюджет обряда целиком
    //    (ТЗ §3.3 — не длиннее шести секунд).
    //
    //    Пауза вкладки обряд не перематывает: на возврате из фона цикл
    //    выбрасывает накопленный разрыв одним холостым getDelta() ниже.
    const raw = clock.getDelta();
    const dt = Math.min(0.05, raw);
    elapsed += dt;

    // ── ход обряда ──────────────────────────────────────────────────────
    if (stage !== RITE_IDLE) {
      stageT += raw;
      if (stage === RITE_SPIN) {
        const p = Math.min(1, stageT / (RITE.spinMs / 1000));
        if (body) body.fighter.group.rotation.y = baseYaw + easeInOut(p) * RITE.turns * Math.PI * 2;
        if (p >= 1) { stage = RITE_GOLD; stageT = 0; }
      } else if (stage === RITE_GOLD) {
        goldMix = Math.min(1, stageT / (RITE.goldMs / 1000));
        if (goldMix >= 1) { stage = RITE_HOLD; stageT = 0; }
      } else if (stage === RITE_HOLD && stageT >= RITE.holdMs / 1000) {
        stage = RITE_IDLE;
        emit('done');
      }
    }

    body?.fighter.update(elapsed, camera);
    // Сердце красится ПОСЛЕ тела: тело переписывает его каждый кадр заново.
    if (goldMix > 0) body?.heart?.apply(goldMix);

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

  resizeObserver = new ResizeObserver(() => { applyFraming(); load?.unsettle(); });
  resizeObserver.observe(el);
});

onBeforeUnmount(() => {
  load?.dispose();
  if (resizeObserver) resizeObserver.disconnect();
  if (onVisibility) document.removeEventListener('visibilitychange', onVisibility);
  if (mm && onMM) { mm.removeEventListener ? mm.removeEventListener('change', onMM) : mm.removeListener(onMM); }
  if (renderer) renderer.setAnimationLoop(null);
  dropBody();
  if (backdrop) { scene?.remove(backdrop.mesh); backdrop.dispose(); }
  renderer?.dispose();
  renderer = scene = camera = null;
});

defineExpose({ setFighter, beginRite });
</script>

<style scoped>
.asc-wrap { position: absolute; inset: 0; }
/* Холст указателя не слушает: камера неподвижна, а нажатие обязано доходить
   до страницы — там живут карточки выбора и окно подтверждения. */
.asc-canvas { display: block; width: 100%; height: 100%; pointer-events: none; }
</style>
