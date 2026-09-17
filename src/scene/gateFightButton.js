// gateFightButton.js — ОБЪЁМНАЯ КНОПКА СТАРТА в воротах.
//
// До неё в бой вела плоская кнопка внизу экрана — временная и названная
// временной с первого дня. Она честно работала, но читалась как элемент
// интерфейса поверх сцены, а не как предмет в ней: игрок выбирал бойцов в
// комнате, а выходил в бой нажатием на наклейку поверх комнаты.
//
// НОВОЙ ГЕОМЕТРИИ ЗДЕСЬ НЕТ. Корпус — та же плита, что у островов (`buildSlab`
// из modePlates), только меньше. Это не экономия: язык предметов в игре один, и
// вторая форма «тоже плита, но своя» — это место, где скос и обводка разойдутся
// на первой же правке. Кнопка отличается от острова размером, положением
// (ближе к камере) и единственным светящимся ядром, а не силуэтом.
//
// ОДНО РОЗОВОЕ И ОДНО СВЕЧЕНИЕ. Розовый в игре принадлежит главному действию —
// и на шаге выбора бойцов главное действие ровно одно. Поэтому ядро кнопки
// розовое, а ядра островов — нет, и светится на этом шаге только она. Пока
// состав не набран, кнопка ТУСКЛАЯ и не светится вовсе: обещать нажатие, за
// которым ничего не будет, — хуже, чем не обещать.
//
// ОТКАЗ ТОТ ЖЕ, ЧТО У ЗАПЕРТОГО ОСТРОВА. Нажали, когда состав не собран, —
// короткая дрожь, и ничего больше. Механизм взят у островов дословно (и числа
// тоже), чтобы «нельзя» в воротах выглядело одинаково, откуда бы ни пришло.
//
// Экспортирует: FIGHT_BTN (настройки), buildGateFightButton.
import * as THREE from 'three';
import { buildSlab } from './modePlates.js';
import { makeHexGridTexture } from './arenaTextures.js';

// ───────────────────────────── Настройки ─────────────────────────────
export const FIGHT_BTN = {
  // Размер — доля от острова (2.2 × 1.7 × 0.42). Меньше, но не марка: в неё
  // целятся пальцем, и она главный предмет шага.
  halfW: 1.45,
  halfD: 0.95,
  height: 0.34,

  // Насколько вынести вперёд от ближней кромки разложенных островов. Кнопка
  // обязана стоять БЛИЖЕ островов (так её видно первой и она не спорит с ними
  // за место), но не наезжать на их подписи: подпись висит под ближней кромкой
  // ряда, и зазор считается от неё.
  gap: 5.6,

  // Отделка — от островов, но корпус чуть светлее: предмет, к которому идут,
  // не должен тонуть в полу наравне с теми, из которых выбирают.
  body: 0x151a2b,
  rim: 0x6d7ea8,
  rimOpacity: 0.26,
  chamfer: 0.26,
  hexTile: 2.6,

  // Ядро. Розовое — единственное на этом шаге (см. шапку).
  core: '#FF0069',
  coreR: 0.30,
  coreLift: 0.012,
  coreDim: 0.10,        // не собран состав: тускло и без свечения
  coreArmed: 0.85,      // собран: горит
  coreHoverBoost: 0.15, // курсор поверх горящей — чуть ярче

  // Свечение — ореол вокруг ядра, аддитивный диск. Он и есть «одно свечение»
  // шага; у островов его нет вовсе.
  haloR: 1.15,
  haloArmed: 0.30,

  litLerp: 6.5,         // 1/с сглаживания — без щелчка

  // Отказ: те же числа, что у островов (gatePlates), намеренно.
  shakeMs: 380,
  shakeAmp: 0.075,
  shakeHz: 11,

  // Подпись встаёт под ближней кромкой — как у островов.
  captionDrop: 0.30,

  // Доля кадра, которую кнопка занимает в конце подлёта «в лицо». Больше, чем
  // у острова (0.88): к острову подлетают, чтобы сквозь него пройти дальше, а
  // сюда — чтобы упереться.
  diveFill: 0.62,
  diveMinDist: 2.6,
};

const _v = new THREE.Vector3();

/** Мягкий круглый ореол — тот же приём, что под ядром бойца. */
function makeHaloTexture(hex) {
  const S = 128;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  const col = new THREE.Color(hex);
  const rgb = `${Math.round(col.r * 255)}, ${Math.round(col.g * 255)}, ${Math.round(col.b * 255)}`;
  grad.addColorStop(0.0, `rgba(${rgb}, 0.85)`);
  grad.addColorStop(0.45, `rgba(${rgb}, 0.22)`);
  grad.addColorStop(1.0, `rgba(${rgb}, 0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, S, S);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * @param {object} opts
 * @param {number} [opts.maxAniso]
 * @returns {object} кнопка и её контракт — та же форма, что у островов
 */
export function buildGateFightButton(opts = {}) {
  const o = FIGHT_BTN;
  const root = new THREE.Group();

  const hexTex = makeHexGridTexture(opts.maxAniso || 1);
  hexTex.repeat.set(1, 1);
  const slab = buildSlab(o.halfW, o.halfD, o.height, hexTex, o);
  root.add(slab.group);

  // Ядро — плоский диск в крышке, как у островов.
  const coreGeo = new THREE.CircleGeometry(o.coreR, 40);
  const coreMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(o.core), transparent: true, opacity: o.coreDim,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.rotation.x = -Math.PI / 2;
  core.position.y = slab.topY + o.coreLift;
  root.add(core);

  // Ореол — над крышкой, но ПОД ядром по яркости: светится предмет, а не пятно.
  const haloTex = makeHaloTexture(o.core);
  const haloGeo = new THREE.PlaneGeometry(o.haloR * 2, o.haloR * 2);
  const haloMat = new THREE.MeshBasicMaterial({
    map: haloTex, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const halo = new THREE.Mesh(haloGeo, haloMat);
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = slab.topY + o.coreLift * 0.5;
  root.add(halo);

  // Невидимая коробка — одна цель для луча на весь предмет, как у островов.
  const pickGeo = new THREE.BoxGeometry(o.halfW * 2, o.height * 2.6, o.halfD * 2);
  const pick = new THREE.Mesh(pickGeo, new THREE.MeshBasicMaterial({ visible: false }));
  pick.position.y = o.height * 0.7;
  pick.userData.gateFight = true;
  root.add(pick);

  let armed = false;
  let hovered = false;
  let lit = 0;          // 0…1 — сглаженная «собранность»
  let hoverLit = 0;
  let baseX = 0, baseZ = 0;
  let shakeUntil = 0;
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

  /**
   * Поставить кнопку перед разложенными островами.
   * @param {{halfD:number}} bounds габарит островов — от него и отступаем
   */
  function place(bounds) {
    baseX = 0;
    baseZ = (bounds ? bounds.halfD : 0) + o.gap + o.halfD;
    root.position.set(baseX, 0, baseZ);
  }

  /** Собран ли состав. Не собран — тускло, без свечения и без курсора-пальца. */
  function setArmed(on) { armed = !!on; }
  function setHover(on) { hovered = !!on; }
  function refuse() { shakeUntil = now() + o.shakeMs; }
  function shaking() { return shakeUntil > now(); }

  /** Прицел для подлёта — та же форма, что у островов (её ждёт islandDive). */
  function aimFor() {
    _v.set(0, o.height * 0.5, 0);
    const point = root.localToWorld(_v.clone());
    return {
      point,
      halfW: o.halfW,
      halfH: o.height * 0.5 + o.haloR * 0.5,
      fill: o.diveFill,
      minDist: o.diveMinDist,
      // ПОДЛЁТ В ЛИЦО. У острова направление берут то, с которого игрок смотрит:
      // остров — дверь, и въезжать в неё всегда с одной стороны значило бы
      // отменять его поворот. Кнопка — не дверь, у неё есть лицо: крышка с
      // надписью и ядром. Поэтому направление задаём мы, и камера приходит
      // спереди-сверху, а не с той стороны, куда игрок случайно отвернул.
      dir: new THREE.Vector3(0, 0.62, 1).normalize(),
    };
  }

  /** Экранная точка под ближней кромкой — туда встаёт надпись FIGHT. */
  function captionScreen(camera, w, h) {
    _v.set(0, -o.captionDrop, o.halfD);
    root.localToWorld(_v);
    _v.project(camera);
    return {
      x: (_v.x * 0.5 + 0.5) * w,
      y: (-_v.y * 0.5 + 0.5) * h,
      visible: _v.z < 1 && _v.x > -1.6 && _v.x < 1.6,
    };
  }

  function update(t, dt) {
    const k = 1 - Math.exp(-o.litLerp * dt);
    lit += ((armed ? 1 : 0) - lit) * k;
    hoverLit += ((armed && hovered ? 1 : 0) - hoverLit) * k;

    coreMat.opacity = o.coreDim + (o.coreArmed - o.coreDim) * lit + o.coreHoverBoost * hoverLit;
    haloMat.opacity = o.haloArmed * lit * (1 + 0.35 * hoverLit);
    slab.rimMat.opacity = o.rimOpacity * (1 + lit * 1.4);

    const tNow = now();
    if (shakeUntil > tNow) {
      const left = (shakeUntil - tNow) / o.shakeMs;
      const a = o.shakeAmp * left;
      root.position.x = baseX + a * Math.sin((tNow / 1000) * Math.PI * 2 * o.shakeHz);
    } else if (root.position.x !== baseX) {
      root.position.x = baseX;
    }
  }

  function dispose() {
    slab.dispose();
    coreGeo.dispose(); coreMat.dispose();
    haloGeo.dispose(); haloMat.dispose(); haloTex.dispose();
    pickGeo.dispose(); pick.material.dispose();
    hexTex.dispose();
  }

  return {
    group: root, pick, slab,
    place, setArmed, setHover, refuse, shaking, aimFor, captionScreen, update, dispose,
    get armed() { return armed; },
  };
}
