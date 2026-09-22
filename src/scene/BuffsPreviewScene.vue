<!-- BuffsPreviewScene — 3D-витрина трёх предметов-баффов (TOWEL / BUCKET / DICE)
     на манекене. Часть скрытой страницы /dev/buffs (ТЗ 22.09.2026, «Баффы»).

     Собственная сцена, своими копиями, по рецепту hexlash-3d (§3): свой рендер,
     своя камера, свой свет. Никакой протекции не задевает — buildFighter
     ВЫЗЫВАЕТСЯ (не правится) для манекена, ровно как это уже делает
     FighterLabScene (/dev/lab) для собственных нужд.

     Не fullscreen: канвас занимает свою коробку на обычной прокручиваемой
     странице — страница ниже несёт HTML-панели (иконки, состояния, слоты). -->
<template>
  <div ref="wrap" class="bp-wrap">
    <canvas ref="canvasEl" class="bp-canvas" />
    <div v-if="fps !== null" class="bp-fps">{{ fps }} fps</div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import * as THREE from 'three';
import { buildFighter } from './buildFighter.js';
import { buildStand, buildTowel, buildBucket, buildDice, BUFF_ITEMS } from './buffItems.js';

const wrap = ref(null);
const canvasEl = ref(null);
const fps = ref(null); // включается пропом showFps через defineExpose, см. ниже

const props = defineProps({
  showFps: { type: Boolean, default: false },
});

let renderer, scene, camera, clock;
let fighter = null;
let resizeObserver, onVisibility;
let reduced = false;
let mm = null;

// Манекен стоит ЗАМЕТНО дальше от камеры, чем ряд предметов — иначе постаменты
// на переднем плане перспективно наезжают на его ноги (замечено на первом
// снимке: без разнесения по глубине читалось одним пятном). «К манекену» — в
// сторону меньшего Z (см. buffItems.js «система координат»).
const MANNEQUIN_Z = -1.3;
const SLOTS = {
  towel:  { x: -1.15, z: 1.45 },
  bucket: { x: 0,     z: 1.45 },
  dice:   { x: 1.15,  z: 1.45 },
};
const MANNEQUIN_SHOULDER = new THREE.Vector3(0, 1.15, MANNEQUIN_Z + 0.32); // мировая точка посадки полотенца

let towelObj = null, bucketObj = null, diceObj = null;
let standObjs = [];

// FPS-счётчик — только когда включён (для §«Проверка и сдача»: замер кадров).
let fpsAcc = 0, fpsFrames = 0;

onMounted(() => {
  const el = wrap.value;
  const w = el.clientWidth || 800;
  const h = el.clientHeight || 480;

  mm = window.matchMedia('(prefers-reduced-motion: reduce)');
  reduced = mm.matches;
  const onMM = () => { reduced = mm.matches; };
  mm.addEventListener ? mm.addEventListener('change', onMM) : mm.addListener(onMM);
  onBeforeUnmount(() => { mm.removeEventListener ? mm.removeEventListener('change', onMM) : mm.removeListener(onMM); });

  renderer = new THREE.WebGLRenderer({ canvas: canvasEl.value, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0b10);

  camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 60);
  camera.position.set(0, 2.15, 6.3);
  camera.lookAt(0, 1.2, -0.2);

  // Свет — техническая тройка + подсвет, без теней (бюджет телефона).
  const key = new THREE.DirectionalLight(0xfff2e8, 2.1);
  key.position.set(4, 8, 5);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x8fa0c0, 0.6);
  fill.position.set(-5, 4, -3);
  scene.add(fill);
  scene.add(new THREE.AmbientLight(0x2a3550, 0.55));
  scene.add(new THREE.HemisphereLight(0x44506e, 0x05060c, 0.45));

  // Пол — плоский тёмный диск, ничего лишнего.
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(6, 48),
    new THREE.MeshStandardMaterial({ color: 0x0a0c12, roughness: 1, metalness: 0 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.001;
  scene.add(floor);

  // Манекен — существующий боец, вызванный, не переписанный. Нейтральный цвет:
  // это тренировочный манекен, а не конкретное ядро.
  const foePoint = new THREE.Vector3(0, 0, -1.1);
  fighter = buildFighter('#FF0069', {
    side: 'player',
    neutralColor: true,
    bounds: { x: 2, z: 2 },
    getFoePos: () => foePoint,
  });
  fighter.setAI(false);
  fighter.setIntentionLock(null);
  fighter.setReducedMotion(reduced);
  fighter.group.position.set(0, 0, MANNEQUIN_Z);
  fighter.group.rotation.y = Math.PI; // лицом к камере (по умолчанию боец смотрит в -Z)
  // Подавляем плашку HP снаружи — тот же приём, что и HomeScene.vue: это не бой,
  // плашка здесь не нужна. Единственный спрайт прямым ребёнком группы бойца.
  fighter.group.children.forEach((o) => { if (o.isSprite) o.visible = false; });
  scene.add(fighter.group);

  // Три постамента + три предмета.
  towelObj = buildTowel();
  bucketObj = buildBucket();
  diceObj = buildDice();

  for (const [key2, obj] of [['towel', towelObj], ['bucket', bucketObj], ['dice', diceObj]]) {
    const slot = SLOTS[key2];
    const stand = buildStand();
    stand.group.position.set(slot.x, 0, slot.z);
    scene.add(stand.group);
    standObjs.push(stand);

    if (key2 === 'bucket') {
      obj.group.position.set(slot.x, BUFF_ITEMS.stand.h, slot.z);
    } else {
      obj.place(BUFF_ITEMS.stand.h, new THREE.Vector3(slot.x, 0, slot.z));
    }
    scene.add(obj.group);
  }

  clock = new THREE.Clock();
  let elapsed = 0;

  const loop = () => {
    const dt = Math.min(0.05, clock.getDelta());
    elapsed += dt;

    fighter?.update(elapsed, camera);
    fighter.group.rotation.y = Math.PI; // держим лицом к камере снаружи, каждый кадр

    towelObj.tick(dt, elapsed, reduced);
    bucketObj.tick(dt, elapsed, reduced);
    diceObj.tick(dt, elapsed, reduced);

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
  });
  resizeObserver.observe(el);
});

onBeforeUnmount(() => {
  if (resizeObserver) resizeObserver.disconnect();
  if (onVisibility) document.removeEventListener('visibilitychange', onVisibility);
  if (renderer) renderer.setAnimationLoop(null);
  fighter?.dispose();
  towelObj?.dispose(); bucketObj?.dispose(); diceObj?.dispose();
  standObjs.forEach((s) => s.dispose());
  if (renderer) renderer.dispose();
});

// ── Проигрыш анимаций срабатывания (кнопки страницы) ──────────────────────
function playTowel() {
  towelObj?.activate(MANNEQUIN_SHOULDER, reduced);
}
function playBucket() {
  bucketObj?.activate(null, reduced, () => { fighter?.stagger?.(); });
}
function playDice(value) {
  diceObj?.activate(value ?? null, camera, reduced, () => { fighter?.stagger?.(); });
}

// ── Снимок предмета для плоской иконки (Блок 2) ────────────────────────────
// Отдельная маленькая офскрин-сцена: тот же строитель, свежий экземпляр,
// прозрачный фон, один ракурс. Основную сцену не трогает и не останавливает.
const SNAP_BUILDERS = { towel: buildTowel, bucket: buildBucket, dice: buildDice };
function captureIcon(kind, size = 256) {
  const build = SNAP_BUILDERS[kind];
  if (!build) return null;
  const obj = build();
  if (obj.place) obj.place(0, new THREE.Vector3(0, 0, 0));
  else obj.group.position.set(0, 0, 0);

  const s = new THREE.Scene();
  s.add(obj.group);
  const c = new THREE.PerspectiveCamera(38, 1, 0.1, 10);
  c.position.set(0.75, 0.65, 0.95);
  c.lookAt(0, kind === 'bucket' ? 0.14 : 0.06, 0);
  const k = new THREE.DirectionalLight(0xffffff, 2.2);
  k.position.set(2, 3, 2);
  s.add(k);
  s.add(new THREE.AmbientLight(0xffffff, 0.7));

  const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  r.setSize(size, size, false);
  r.setClearColor(0x000000, 0);
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.render(s, c);
  const dataUrl = r.domElement.toDataURL('image/png');

  r.dispose();
  obj.dispose();
  k.dispose?.();
  return dataUrl;
}

defineExpose({ playTowel, playBucket, playDice, captureIcon });
</script>

<style scoped>
.bp-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  background: radial-gradient(ellipse 70% 60% at 50% 40%, #12141d 0%, #0a0c12 62%, #050608 100%);
}
.bp-canvas { display: block; width: 100%; height: 100%; }
.bp-fps {
  position: absolute;
  right: var(--sp-2);
  top: var(--sp-2);
  font-family: var(--font-mono);
  font-size: var(--t-xs);
  color: var(--ink-dim);
  background: rgba(0, 0, 0, 0.4);
  padding: 2px 6px;
}
</style>
