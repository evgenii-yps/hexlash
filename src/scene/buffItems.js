// buffItems.js — ТРИ ПРЕДМЕТА-БАФФА ДЛЯ ПРЕВЬЮ /dev/buffs (ТЗ 22.09.2026, «Баффы»).
//
// TOWEL (полотенце), BUCKET (ведро), DICE (кубик) — простые формы, огранённые,
// без реализма и без фото-текстур: тот же язык, каким собраны эмблемы ворот
// (gateEmblems.js) — матовое тело + один розовый акцент, там где акцент нужен.
//
// ⚠️ Розовое свечение здесь — ОСОЗНАННОЕ ИСКЛЮЧЕНИЕ из «одно свечение на экран»,
// то же самое, каким уже пользуется /dev/core (там пять цветов горят одновременно
// ради сравнения). Это витрина трёх предметов рядом, не игровой экран.
//
// Материал предметов — MATERIALS.decor / decorDark из sceneTokens.js: они уже
// объявлены, второго тона декора здесь не заводится. Розовый читается из --pink
// (тот же приём, что leaderHue() в sceneTokens.js), не новое число.
//
// Никакой предмет не трогает buildFighter.js — манекен получает удары только
// через СВОИ внешние спецэффекты (вспышка, частицы) плюс уже существующий метод
// fighter.stagger(), вызванный СНАРУЖИ. Тот же приём, каким FighterLabScene
// показывает попадание по манекену (labSpark), не залезая в защищённый файл.
//
// СИСТЕМА КООРДИНАТ (задаётся вызывающей сценой, здесь только контракт):
// манекен стоит лицом к камере (+Z), предметы — на своих постаментах МЕЖДУ
// манекеном и камерой, чуть дальше по Z. «К манекену» = в сторону МЕНЬШЕГО Z.
//
// Экспортирует: BUFF_ITEMS (настройки), buildStand, buildTowel, buildBucket,
// buildDice.
import * as THREE from 'three';
import { MATERIALS } from '../data/sceneTokens.js';
import { makeRadialTexture } from './arenaTextures.js';

function pinkHex() {
  const raw = typeof document === 'undefined'
    ? '#FF0069'
    : getComputedStyle(document.documentElement).getPropertyValue('--pink').trim();
  return raw || '#FF0069';
}

// ───────────────────────────── Настройки ─────────────────────────────
export const BUFF_ITEMS = {
  stand: { r: 0.30, r2: 0.34, h: 0.09 },
  puddle: { r: 0.78, opacity: 0.65 },
  idleSpinPeriod: 10.0, // спокойный оборот на постаменте, секунд

  towel: {
    w: 0.50, h: 0.085, d: 0.34,
    foldW: 0.34, foldH: 0.05, foldD: 0.12, foldOffsetX: 0.10,
    dropFrom: 2.4,     // высота падения над точкой посадки
    dropDur: 1.2,
  },

  bucket: {
    rTop: 0.205, rBot: 0.155, h: 0.30, sides: 10,
    handleR: 0.175, handleTube: 0.020, handleSegs: 9,
    tiltDur: 1.3,
    tiltAngle: -1.15,   // радианы наклона на пике — мимо вертикали, но не «вверх ногами»
    dropletCount: 14,
    dropletR: 0.018,
  },

  dice: {
    size: 0.24,
    rollDur: 1.35,
    bounceCount: 3,
    hopHeight: 0.34,
    travelZ: 1.05,       // на сколько кубик уезжает к манекену (в сторону меньшего Z)
    flashScale: 0.62,
    flashScaleSix: 1.05, // на шестёрке вспышка заметно сильнее
  },
};

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3(1, 1, 1);
const _up = new THREE.Vector3(0, 1, 0);

/** Матовый материал предмета — тон декора, без своего объявления цвета. */
function decorMat(dark = false) {
  const src = dark ? MATERIALS.decorDark : MATERIALS.decor;
  return new THREE.MeshStandardMaterial({ ...src });
}

/** Аддитивный розовый свет — постамент и вспышки берут этот же состав. */
function pinkGlowMat(opacity, map = null) {
  return new THREE.MeshBasicMaterial({
    map,
    color: new THREE.Color(pinkHex()),
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}

const EASE_SETTLE = (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);

/**
 * Тёмный постамент + розовая лужица под ним. Форма одна на все три предмета —
 * различие несут только предметы сверху.
 */
export function buildStand() {
  const o = BUFF_ITEMS.stand;
  const group = new THREE.Group();

  const bodyGeo = new THREE.CylinderGeometry(o.r, o.r2, o.h, 8);
  const bodyMat = decorMat(true);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = o.h / 2;
  group.add(body);

  const tex = makeRadialTexture('rgba(255,0,105,0.9)', 'rgba(255,0,105,0)', 0.5);
  const glowGeo = new THREE.PlaneGeometry(BUFF_ITEMS.puddle.r * 2, BUFF_ITEMS.puddle.r * 2);
  const glowMatI = pinkGlowMat(BUFF_ITEMS.puddle.opacity, tex);
  const glow = new THREE.Mesh(glowGeo, glowMatI);
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.003;
  group.add(glow);

  const dispose = () => {
    bodyGeo.dispose(); bodyMat.dispose();
    glowGeo.dispose(); glowMatI.dispose(); tex.dispose();
  };
  return { group, topY: o.h, dispose };
}

/** Вспышка на манекене — билборд-спрайт, аддитивный, розовый. */
function buildFlash() {
  const tex = makeRadialTexture('rgba(255,255,255,0.95)', 'rgba(255,0,105,0)', 0.45);
  const mat = new THREE.MeshBasicMaterial({
    map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), mat);
  mesh.visible = false;
  const ud = { life: 0, dur: 1 };
  return {
    mesh,
    fire(pos, camera, scale, dur) {
      mesh.visible = true;
      mesh.position.copy(pos);
      mesh.scale.setScalar(scale);
      if (camera) mesh.quaternion.copy(camera.quaternion);
      ud.life = 0; ud.dur = dur;
    },
    tick(dt, camera) {
      if (!mesh.visible) return;
      ud.life += dt;
      const k = ud.life / ud.dur;
      if (k >= 1) { mesh.visible = false; mat.opacity = 0; return; }
      mat.opacity = 1 - k;
      if (camera) mesh.quaternion.copy(camera.quaternion);
    },
    dispose() { mesh.geometry.dispose(); mat.dispose(); tex.dispose(); },
  };
}

// ───────────────────────────── TOWEL ─────────────────────────────
// Сложенный брусок со скруглённой (по ощущению — приподнятой) складкой. Падает
// сверху на плечи манекена и остаётся лежать, пока не нажали кнопку заново.
export function buildTowel() {
  const o = BUFF_ITEMS.towel;
  const group = new THREE.Group();

  const mat = decorMat(false);
  const body = new THREE.Mesh(new THREE.BoxGeometry(o.w, o.h, o.d), mat);
  group.add(body);
  const fold = new THREE.Mesh(new THREE.BoxGeometry(o.foldW, o.foldH, o.foldD), mat);
  fold.position.set(o.foldOffsetX, o.h / 2 + o.foldH / 2 - 0.006, 0);
  group.add(fold);

  let state = 'idle'; // idle (на постаменте) → falling → resting
  let t = 0;
  let standPos = new THREE.Vector3();
  let target = new THREE.Vector3();

  function place(standTopY, standPosXZ) {
    standPos.set(standPosXZ.x, standTopY + o.h / 2, standPosXZ.z);
    group.position.copy(standPos);
    group.rotation.set(0, 0, 0);
    state = 'idle';
  }

  function tick(dt, elapsed, reduced) {
    if (state === 'idle') {
      if (!reduced) group.rotation.y = (elapsed * (Math.PI * 2)) / BUFF_ITEMS.idleSpinPeriod;
      return;
    }
    if (state === 'falling') {
      t += dt;
      const dur = reduced ? 0.22 : o.dropDur;
      const u = Math.min(1, t / dur);
      const e = EASE_SETTLE(u);
      const fromY = standPos.y + o.dropFrom;
      group.position.set(
        THREE.MathUtils.lerp(standPos.x, target.x, e),
        THREE.MathUtils.lerp(fromY, target.y, e),
        THREE.MathUtils.lerp(standPos.z, target.z, e),
      );
      // лёгкий поворот при падении, к нулю на посадке — «плюхнулось и легло»
      group.rotation.x = (1 - e) * 0.35;
      group.rotation.z = (1 - e) * -0.18;
      if (u >= 1) { state = 'resting'; group.rotation.set(0, 0, 0); }
    }
  }

  /** @param {THREE.Vector3} mannequinAnchor мировая точка на плечах манекена */
  function activate(mannequinAnchor, reduced) {
    target.copy(mannequinAnchor);
    t = 0;
    state = 'falling';
  }

  const dispose = () => { body.geometry.dispose(); fold.geometry.dispose(); mat.dispose(); };
  return { group, place, tick, activate, get state() { return state; }, dispose };
}

// ───────────────────────────── BUCKET ─────────────────────────────
// Усечённый конус с ручкой-дугой. Наклоняется над манекеном, короткий всплеск
// частиц, манекен встряхивается (вызывается СНАРУЖИ через fighter.stagger()).
export function buildBucket() {
  const o = BUFF_ITEMS.bucket;
  const group = new THREE.Group();   // постамент/мир → сюда кладёт вызывающий код
  const body = new THREE.Group();    // само ведро, точка вращения — его донышко

  const mat = decorMat(false);
  const bodyMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(o.rTop, o.rBot, o.h, o.sides),
    mat,
  );
  bodyMesh.position.y = o.h / 2;
  body.add(bodyMesh);

  const handleGeo = new THREE.TorusGeometry(o.handleR, o.handleTube, 4, o.handleSegs, Math.PI);
  const handleMat = decorMat(false);
  const handle = new THREE.Mesh(handleGeo, handleMat);
  handle.position.y = o.h;
  body.add(handle);
  group.add(body);

  // Капли — дети BODY: наследуют наклон ведра, поэтому «падают» в его локальном
  // низе, а в момент наклона локальный низ и указывает в сторону манекена.
  const dropGeo = new THREE.SphereGeometry(o.dropletR, 6, 5);
  const dropMat = new THREE.MeshStandardMaterial({ color: 0xdadde6, roughness: 0.3, metalness: 0.05, transparent: true });
  const droplets = new THREE.InstancedMesh(dropGeo, dropMat, o.dropletCount);
  droplets.frustumCulled = false;
  droplets.count = 0;
  droplets.position.set(0, o.h * 0.92, -o.rTop * 0.75); // у переднего (ближнего к манекену) края обода
  body.add(droplets);
  const dropVel = [];
  for (let i = 0; i < o.dropletCount; i++) {
    const a = (i / o.dropletCount - 0.5) * 1.4;
    dropVel.push({ vx: Math.sin(a) * 0.28, vy: -(0.55 + Math.random() * 0.35), vz: -(0.35 + Math.random() * 0.25) });
  }

  let state = 'idle';
  let t = 0;
  let splashed = false;
  let onSplash = null;

  function tick(dt, elapsed, reduced) {
    if (state === 'idle') {
      if (!reduced) group.rotation.y = (elapsed * (Math.PI * 2)) / BUFF_ITEMS.idleSpinPeriod;
      return;
    }
    if (state === 'tilting') {
      t += dt;
      const dur = reduced ? 0.22 : o.tiltDur;
      const u = Math.min(1, t / dur);
      // замах вперёд → задержка на пике → тяжёлый медленный возврат
      let e;
      if (u < 0.32) e = EASE_SETTLE(u / 0.32);
      else if (u < 0.55) e = 1;
      else e = 1 - EASE_SETTLE((u - 0.55) / 0.45);
      body.rotation.x = o.tiltAngle * e;

      if (!splashed && u >= 0.30) {
        splashed = true;
        droplets.count = o.dropletCount;
        dropMat.opacity = 1;
        if (onSplash) onSplash();
      }
      if (splashed) {
        const since = t - dur * 0.30;
        for (let i = 0; i < o.dropletCount; i++) {
          const v = dropVel[i];
          _p.set(v.vx * since, v.vy * since - 1.6 * since * since, v.vz * since);
          _m.compose(_p, _q.identity(), _s);
          droplets.setMatrixAt(i, _m);
        }
        droplets.instanceMatrix.needsUpdate = true;
        dropMat.opacity = Math.max(0, 1 - since * 1.6);
      }
      if (u >= 1) { state = 'resting'; droplets.count = 0; body.rotation.x = 0; }
    }
  }

  /** @param {*} _anchor не используется — ведро наклоняется на месте */
  function activate(_anchor, reduced, splashCb) {
    t = 0; splashed = false; onSplash = splashCb || null;
    group.rotation.y = 0; // фиксированный разворот на старте — ручка всегда к камере
    state = 'tilting';
  }

  const dispose = () => {
    bodyMesh.geometry.dispose(); mat.dispose();
    handleGeo.dispose(); handleMat.dispose();
    dropGeo.dispose(); dropMat.dispose(); droplets.dispose();
  };
  return { group, tick, activate, get state() { return state; }, dispose };
}

// ───────────────────────────── DICE ─────────────────────────────
// Кубик, точки на гранях запечены в текстуру каждой стороны. Катится к
// манекену, 2–3 отскока, останавливается заданной гранью вверх. На шестёрке —
// вспышка заметно сильнее.
function pipTexture(value, faceHex, pipHex) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = faceHex;
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = pipHex;
  const R = 11;
  const pip = (x, y) => { ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.fill(); };
  const L = 32, C = 64, Hh = 96;
  const layouts = {
    1: [[C, C]],
    2: [[L, L], [Hh, Hh]],
    3: [[L, L], [C, C], [Hh, Hh]],
    4: [[L, L], [Hh, L], [L, Hh], [Hh, Hh]],
    5: [[L, L], [Hh, L], [C, C], [L, Hh], [Hh, Hh]],
    6: [[L, L], [Hh, L], [L, C], [Hh, C], [L, Hh], [Hh, Hh]],
  };
  for (const [x, y] of layouts[value]) pip(x, y);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

// Локальная ось грани → значение (противоположные грани в сумме дают 7).
const FACE_AXIS = {
  1: new THREE.Vector3(1, 0, 0),
  6: new THREE.Vector3(-1, 0, 0),
  2: new THREE.Vector3(0, 1, 0),
  5: new THREE.Vector3(0, -1, 0),
  3: new THREE.Vector3(0, 0, 1),
  4: new THREE.Vector3(0, 0, -1),
};
// Материал BoxGeometry идёт в порядке [+x, -x, +y, -y, +z, -z] → значения по осям.
const MAT_ORDER_VALUE = [1, 6, 2, 5, 3, 4];

export function buildDice() {
  const o = BUFF_ITEMS.dice;
  const group = new THREE.Group();
  const faceHex = '#20242f';
  const pipHex = '#F6F4F6';

  const textures = MAT_ORDER_VALUE.map((v) => pipTexture(v, faceHex, pipHex));
  const materials = textures.map((tex) => new THREE.MeshStandardMaterial({
    map: tex, roughness: 0.55, metalness: 0.08,
  }));
  const geo = new THREE.BoxGeometry(o.size, o.size, o.size);
  const mesh = new THREE.Mesh(geo, materials);
  group.add(mesh);

  const flash = buildFlash();
  flash.mesh.position.y = o.size * 1.4;
  group.add(flash.mesh);

  let state = 'idle';
  let t = 0;
  let standPos = new THREE.Vector3();
  let targetVal = 1;
  let onLand = null;
  let flashed = false;
  let camRef = null;
  const spinAxis = new THREE.Vector3(0.6, 1, 0.3).normalize();
  const targetQuat = new THREE.Quaternion();

  function place(standTopY, standPosXZ) {
    standPos.set(standPosXZ.x, standTopY + o.size * 0.75, standPosXZ.z);
    group.position.copy(standPos);
    // Вращение живёт на MESH, не на group: group остаётся без своего разворота,
    // иначе конечный кватернион осадки (мировая ось «вверх») считался бы мимо —
    // он метит мировую грань, а не локальную для повёрнутого родителя.
    group.rotation.set(0, 0, 0);
    mesh.rotation.set(0.4, 0.7, 0.15);
    state = 'idle';
  }

  function tick(dt, elapsed, reduced) {
    if (state === 'idle') {
      if (!reduced) mesh.rotateOnAxis(spinAxis, (dt * Math.PI * 2) / BUFF_ITEMS.idleSpinPeriod);
      flash.tick(dt, camRef);
      return;
    }
    if (state === 'rolling') {
      t += dt;
      const dur = reduced ? 0.22 : o.rollDur;
      const u = Math.min(1, t / dur);
      const travelU = Math.min(1, u / 0.72); // путь заканчивается раньше осадки грани
      const ex = EASE_SETTLE(travelU);
      group.position.z = THREE.MathUtils.lerp(standPos.z, standPos.z - o.travelZ, ex);

      const bounceU = travelU * o.bounceCount;
      const bounceLocal = bounceU % 1;
      const decay = 1 - travelU * 0.85;
      const hop = travelU < 1 ? Math.sin(bounceLocal * Math.PI) * o.hopHeight * decay : 0;
      group.position.y = standPos.y + hop;

      if (u < 0.72) {
        if (!reduced) { mesh.rotation.x += dt * 9.5; mesh.rotation.z += dt * 6.2; }
      } else {
        const settleU = Math.min(1, (u - 0.72) / 0.28);
        const se = EASE_SETTLE(settleU);
        mesh.quaternion.slerp(targetQuat, Math.min(1, se + dt * 4));
        group.position.y = standPos.y + (1 - se) * 0.05 * Math.sin(settleU * 18);
        if (!flashed && u >= 0.74) {
          flashed = true;
          const big = targetVal === 6;
          const scale = big ? o.flashScaleSix : o.flashScale;
          // Вспышка — ребёнок group, координата ЛОКАЛЬНАЯ (небольшой сдвиг
          // вверх от центра кубика), не мировая.
          const pos = new THREE.Vector3(0, o.size * 0.7, 0);
          flash.fire(pos, camRef, scale, big ? 0.55 : 0.4);
          if (onLand) onLand(targetVal);
        }
      }
      if (u >= 1) state = 'resting';
    }
    flash.tick(dt, camRef);
  }

  /** @param {number|null} value 1..6 или null/0 — «случайно» */
  function activate(value, camera, reduced, landCb) {
    targetVal = value >= 1 && value <= 6 ? value : (1 + Math.floor(Math.random() * 6));
    _q.setFromUnitVectors(FACE_AXIS[targetVal], _up);
    _q2.setFromAxisAngle(_up, Math.random() * Math.PI * 2); // довод по кругу — верхнюю грань не меняет
    targetQuat.copy(_q2).multiply(_q);
    t = 0; flashed = false; onLand = landCb || null; camRef = camera || null;
    state = 'rolling';
  }

  const dispose = () => {
    geo.dispose();
    materials.forEach((m) => m.dispose());
    textures.forEach((tx) => tx.dispose());
    flash.dispose();
  };
  return { group, place, tick, activate, get state() { return state; }, dispose };
}
